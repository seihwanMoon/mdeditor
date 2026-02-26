"""
MD-HWPX Studio — server.py  v4.0
HWPX 변환 전용 FastAPI 로컬 서버
실행: python server.py
"""
from __future__ import annotations

import base64
import importlib.util
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="MD-HWPX Studio Server", version="4.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

ROOT_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = ROOT_DIR / "templates"
TEMPLATES_DIR.mkdir(exist_ok=True)
DEFAULT_TEMPLATE = TEMPLATES_DIR / "default.hwpx"
PLACEHOLDER_TEMPLATE_BYTES = b"PLACEHOLDER-HWPX"

_pandoc_cached_path: Optional[Path] = None
_pandoc_checked = False


def _candidate_binary_paths(binary_name: str):
    return [
        Path.home() / ".local" / "bin" / binary_name,
        Path.home() / "bin" / binary_name,
    ]


def _resolve_binary(binary_name: str) -> Optional[Path]:
    on_path = shutil.which(binary_name)
    if on_path:
        return Path(on_path)
    for candidate in _candidate_binary_paths(binary_name):
        if candidate.exists():
            return candidate
    return None


def _resolve_pandoc_path(autoinstall: bool = False) -> Optional[Path]:
    global _pandoc_cached_path, _pandoc_checked
    if _pandoc_checked and _pandoc_cached_path and _pandoc_cached_path.exists():
        return _pandoc_cached_path

    found = _resolve_binary("pandoc")
    if found:
        _pandoc_cached_path = found
        _pandoc_checked = True
        return found

    if autoinstall:
        try:
            import pypandoc

            pypandoc.download_pandoc(delete_installer=True)
            installed = Path(pypandoc.get_pandoc_path())
            if installed.exists():
                _pandoc_cached_path = installed
                _pandoc_checked = True
                return installed
        except Exception:
            pass

    _pandoc_checked = True
    _pandoc_cached_path = None
    return None


def _has_hwpx_cli() -> bool:
    return importlib.util.find_spec("pypandoc_hwpx.cli") is not None


def _inject_frontmatter(md_content: str, metadata: dict) -> str:
    clean_meta = {k: str(v).strip() for k, v in (metadata or {}).items() if str(v).strip()}
    if not clean_meta:
        return md_content

    stripped = md_content.lstrip("\ufeff")
    if stripped.startswith("---\n"):
        return md_content

    fm_lines = ["---"]
    fm_lines.extend(f"{k}: {v}" for k, v in clean_meta.items())
    fm_lines.extend(["---", ""])
    return "\n".join(fm_lines) + md_content


def _safe_stem(name: str) -> str:
    stem = Path(name or "image").stem or "image"
    return re.sub(r"[^a-zA-Z0-9_-]+", "_", stem)


def _data_url_to_file(data_url: str, out_dir: Path, preferred_name: str = "image") -> Optional[str]:
    if not isinstance(data_url, str) or not data_url.startswith("data:"):
        return None
    match = re.match(r"^data:(?P<mime>[-\w.+/]+);base64,(?P<data>[A-Za-z0-9+/=\s]+)$", data_url.strip(), re.DOTALL)
    if not match:
        return None

    mime = match.group("mime")
    payload = re.sub(r"\s+", "", match.group("data"))
    try:
        raw = base64.b64decode(payload, validate=False)
    except Exception:
        return None

    ext = mimetypes.guess_extension(mime) or ".png"
    if ext == ".jpe":
        ext = ".jpg"
    filename = f"{_safe_stem(preferred_name)}{ext}"
    candidate = out_dir / filename
    i = 1
    while candidate.exists():
        candidate = out_dir / f"{_safe_stem(preferred_name)}_{i}{ext}"
        i += 1
    candidate.write_bytes(raw)
    return f"./{candidate.name}"


def _materialize_markdown_assets(md_content: str, assets: dict, out_dir: Path) -> str:
    resolved = md_content or ""
    if not isinstance(assets, dict):
        assets = {}

    for asset_id, item in assets.items():
        if isinstance(item, dict):
            data_url = item.get("dataUrl") or item.get("data_url")
            name = item.get("name") or f"asset_{asset_id}"
        elif isinstance(item, str):
            data_url = item
            name = f"asset_{asset_id}"
        else:
            continue
        local_ref = _data_url_to_file(str(data_url), out_dir, str(name))
        if local_ref:
            resolved = resolved.replace(f"asset://{asset_id}", local_ref)

    # Backward compatibility: previously editor inserted raw data URLs directly in markdown.
    inline_index = 0

    def replace_inline(match: re.Match) -> str:
        nonlocal inline_index
        inline_index += 1
        local_ref = _data_url_to_file(match.group(0), out_dir, f"inline_asset_{inline_index}")
        return local_ref or match.group(0)

    resolved = re.sub(
        r"data:image/[-\w.+]+;base64,[A-Za-z0-9+/=\s]+",
        replace_inline,
        resolved,
        flags=re.DOTALL,
    )
    return resolved


def _normalize_image_size_syntax_for_pandoc(md_content: str) -> str:
    # Custom syntax: ![name|400](path) -> ![name](path)
    # Width is rendered in browser/HTML/PDF layer; HWPX path keeps Pandoc-safe markdown.
    if not md_content:
        return md_content
    return re.sub(
        r"!\[([^\]\n|]+)\|(\d{1,4})\]\(([^)\n]+)\)",
        lambda m: f"![{m.group(1).strip()}]({m.group(3).strip()})",
        md_content,
    )


class ConvertRequest(BaseModel):
    md_content: str
    template: str = "default.hwpx"
    filename: str = "document"
    metadata: dict = {}
    assets: dict = {}


@app.get("/api/health")
def health():
    pandoc_path = _resolve_pandoc_path(autoinstall=False)
    hwpx_cli = _has_hwpx_cli()
    return {
        "status": "ok",
        "pandoc": bool(pandoc_path and hwpx_cli),
        "pandoc_path": str(pandoc_path) if pandoc_path else None,
        "hwpx_cli": hwpx_cli,
    }


@app.get("/api/templates")
def list_templates():
    return {"templates": sorted(f.name for f in TEMPLATES_DIR.glob("*.hwpx"))}


@app.post("/api/convert/hwpx")
def convert_hwpx(req: ConvertRequest):
    if not _has_hwpx_cli():
        raise HTTPException(status_code=500, detail="pypandoc-hwpx 미설치. pip install -r requirements.txt")

    pandoc_path = _resolve_pandoc_path(autoinstall=True)
    if not pandoc_path:
        raise HTTPException(status_code=500, detail="Pandoc 미설치. https://pandoc.org/installing.html")

    template_path = TEMPLATES_DIR / Path(req.template).name
    if not template_path.exists():
        raise HTTPException(status_code=404, detail=f"템플릿 없음: {req.template}")

    safe_name = Path(req.filename).stem or "document"
    source_markdown = _inject_frontmatter(req.md_content, req.metadata)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        source_markdown = _materialize_markdown_assets(source_markdown, req.assets, tmp)
        source_markdown = _normalize_image_size_syntax_for_pandoc(source_markdown)
        md_file = tmp / "input.md"
        out_file = tmp / f"{safe_name}.hwpx"
        md_file.write_text(source_markdown, encoding="utf-8")

        reference_doc_arg = []
        try:
            if template_path.read_bytes() != PLACEHOLDER_TEMPLATE_BYTES:
                reference_doc_arg = [f"--reference-doc={template_path}"]
        except OSError:
            reference_doc_arg = [f"--reference-doc={template_path}"]

        cmd = [
            sys.executable,
            "-m",
            "pypandoc_hwpx.cli",
            str(md_file),
            *reference_doc_arg,
            "-o",
            str(out_file),
        ]
        env = os.environ.copy()
        env["PYPANDOC_PANDOC"] = str(pandoc_path)
        extra_path_dirs = [str(pandoc_path.parent)]
        local_bin = _resolve_binary("pypandoc-hwpx")
        if local_bin:
            extra_path_dirs.append(str(local_bin.parent))
        env["PATH"] = os.pathsep.join(extra_path_dirs + [env.get("PATH", "")])

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120, env=env)
        except FileNotFoundError:
            raise HTTPException(status_code=500, detail="HWPX 변환 CLI 실행 실패 (python/pypandoc-hwpx 경로 확인)")
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=504, detail="변환 시간 초과 (120초)")

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"변환 실패:\n{result.stderr or result.stdout}")
        if not out_file.exists():
            raise HTTPException(status_code=500, detail="변환 결과 파일 없음")

        dest = Path(tempfile.gettempdir()) / f"mhs_{safe_name}.hwpx"
        shutil.copy2(out_file, dest)

    return FileResponse(str(dest), filename=f"{safe_name}.hwpx", media_type="application/octet-stream")


@app.post("/api/templates/upload")
async def upload_template(file: UploadFile = File(...)):
    if not (file.filename or "").endswith(".hwpx"):
        raise HTTPException(status_code=400, detail=".hwpx 파일만 업로드 가능")
    dest = TEMPLATES_DIR / Path(file.filename).name
    dest.write_bytes(await file.read())
    return {"message": f"업로드 완료: {dest.name}", "filename": dest.name}


@app.delete("/api/templates/{filename}")
def delete_template(filename: str):
    if filename == "default.hwpx":
        raise HTTPException(status_code=403, detail="기본 템플릿 삭제 불가")
    target = TEMPLATES_DIR / Path(filename).name
    if not target.exists():
        raise HTTPException(status_code=404, detail=f"파일 없음: {filename}")
    target.unlink()
    return {"message": f"삭제: {filename}"}


app.mount("/", StaticFiles(directory=ROOT_DIR, html=True), name="web")


if __name__ == "__main__":
    import uvicorn

    if not DEFAULT_TEMPLATE.exists():
        # 빈 템플릿 placeholder (실제 변환에는 유효한 hwpx 필요)
        DEFAULT_TEMPLATE.write_bytes(PLACEHOLDER_TEMPLATE_BYTES)

    print("=" * 50)
    print("MD-HWPX Studio Server v4.0")
    print("브라우저: http://127.0.0.1:8000")
    print("API 문서: http://localhost:8000/docs")
    print("=" * 50)
    uvicorn.run(app, host="127.0.0.1", port=8000)
