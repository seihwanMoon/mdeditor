"""
MD-HWPX Studio — server.py  v4.0
HWPX 변환 전용 FastAPI 로컬 서버
실행: python server.py
"""
from __future__ import annotations

import base64
import html
import importlib.util
import json
import logging
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="MD-HWPX Studio Server", version="4.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logger = logging.getLogger("mdedit.server")

ROOT_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = ROOT_DIR / "templates"
TEMPLATES_DIR.mkdir(exist_ok=True)
DEFAULT_TEMPLATE = TEMPLATES_DIR / "default.hwpx"
PLACEHOLDER_TEMPLATE_BYTES = b"PLACEHOLDER-HWPX"
HISTORY_FILE = ROOT_DIR / "conversion_history.json"
MAX_HISTORY_ITEMS = 200

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
    body = _strip_frontmatter(md_content)
    if not clean_meta:
        return body

    fm_lines = ["---"]
    # JSON string literal은 YAML에서도 유효하므로 특수문자(: ! # 줄바꿈)로 인한 파싱 실패를 방지한다.
    fm_lines.extend(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in clean_meta.items())
    fm_lines.extend(["---", ""])
    return "\n".join(fm_lines) + body


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


def _normalize_style_html_for_pandoc(html_content: str) -> str:
    raw = str(html_content or "")
    if not raw.strip():
        return ""

    # buildIframeDoc 전체 문서가 넘어오면 main/body 내부만 추출해 Pandoc 파서 안정성을 높인다.
    m = re.search(r"<main[^>]*>([\s\S]*?)</main>", raw, flags=re.IGNORECASE)
    if m:
        body = m.group(1)
    else:
        m = re.search(r"<body[^>]*>([\s\S]*?)</body>", raw, flags=re.IGNORECASE)
        body = m.group(1) if m else raw

    body = re.sub(r"<script\b[\s\S]*?</script>", "", body, flags=re.IGNORECASE)
    body = re.sub(r"<style\b[\s\S]*?</style>", "", body, flags=re.IGNORECASE)
    body = re.sub(r"<link\b[^>]*>", "", body, flags=re.IGNORECASE)
    body = re.sub(r"\sclass=(\"[^\"]*\"|'[^']*')", "", body, flags=re.IGNORECASE)
    body = re.sub(r"\sdata-[a-zA-Z0-9_-]+=(\"[^\"]*\"|'[^']*')", "", body, flags=re.IGNORECASE)
    return f'<!doctype html><html><head><meta charset="utf-8"></head><body>{body}</body></html>'


def _hwpx_has_meaningful_text(hwpx_path: Path) -> bool:
    try:
        with zipfile.ZipFile(hwpx_path) as zf:
            section_names = [n for n in zf.namelist() if re.match(r"^Contents/section\d+\.xml$", n)]
            for name in section_names:
                xml = zf.read(name).decode("utf-8", "ignore")
                texts = re.findall(r"<hp:t>(.*?)</hp:t>", xml, flags=re.DOTALL)
                joined = "".join(texts).replace("\u200b", "").strip()
                if re.search(r"[0-9A-Za-z가-힣]", joined):
                    return True
            try:
                preview = zf.read("Preview/PrvText.txt").decode("utf-8", "ignore").strip()
                if re.search(r"[0-9A-Za-z가-힣]", preview):
                    return True
            except KeyError:
                pass
    except Exception:
        return False
    return False


def _strip_frontmatter(md_content: str) -> str:
    text = md_content or ""
    text = text.replace("\r\n", "\n")
    if text.startswith("\ufeff"):
        text = text[1:]
    text = text.lstrip("\n")
    if not re.match(r"^---\s*\n", text):
        return text

    lines = text.split("\n")
    closing_idx = None
    for i in range(1, len(lines)):
        marker = lines[i].strip()
        if marker in {"---", "..."}:
            closing_idx = i
            break

    if closing_idx is not None:
        return "\n".join(lines[closing_idx + 1 :]).lstrip("\n")

    # 비정상 frontmatter(닫힘 없음): 첫 빈 줄까지 제거하여 Pandoc YAML 파싱 실패를 방지.
    for i in range(1, len(lines)):
        if lines[i].strip() == "":
            return "\n".join(lines[i + 1 :]).lstrip("\n")
    return text


def _extract_markdown_headings(md_content: str) -> list[tuple[int, str]]:
    lines = _strip_frontmatter(md_content).splitlines()
    out: list[tuple[int, str]] = []
    in_fence = False
    for line in lines:
        if re.match(r"^\s*```", line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        m = re.match(r"^\s*(#{1,6})\s+(.+?)\s*#*\s*$", line)
        if not m:
            continue
        text = m.group(2).strip()
        text = re.sub(r"!\[[^\]]*]\([^)]+\)", "", text)
        text = re.sub(r"\[([^\]]+)]\([^)]+\)", r"\1", text)
        text = re.sub(r"`([^`]+)`", r"\1", text)
        text = re.sub(r"[*_~]", "", text).strip()
        if text:
            out.append((len(m.group(1)), text))
    return out


def _build_cover_html(metadata: dict) -> str:
    title = html.escape(str((metadata or {}).get("title") or "제목 없음").strip())
    subtitle = html.escape(str((metadata or {}).get("subtitle") or "").strip())
    author = html.escape(str((metadata or {}).get("author") or "").strip())
    org = html.escape(str((metadata or {}).get("organization") or "").strip())
    date_text = html.escape(str((metadata or {}).get("date") or datetime.now().strftime("%Y-%m-%d")).strip())
    subtitle_html = f'<p style="margin:0 0 18pt;font-size:15pt;">{subtitle}</p>' if subtitle else ""
    author_html = f"<div>작성자: {author}</div>" if author else ""
    org_html = f"<div>소속: {org}</div>" if org else ""
    return f"""
<div style="page-break-after:always;min-height:220mm;border:1px solid #ddd;border-radius:6px;padding:48pt 32pt;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
  <h1 style="margin:0 0 14pt;font-size:30pt;">{title}</h1>
  {subtitle_html}
  <div style="font-size:11pt;color:#444;line-height:1.8;">
    {author_html}
    {org_html}
    <div>날짜: {date_text}</div>
  </div>
</div>
"""


def _build_toc_markdown(md_content: str, depth: int) -> str:
    headings = _extract_markdown_headings(md_content)
    lines = ["# 목차", ""]
    for level, text in headings:
        if level > depth:
            continue
        indent = "  " * (level - 1)
        lines.append(f"{indent}- {text}")
    if len(lines) == 2:
        lines.append("- (표시할 제목 없음)")
    lines.extend(["", '<div style="page-break-after:always;"></div>', ""])
    return "\n".join(lines)


def _inject_special_pages(md_content: str, metadata: dict, settings: dict) -> str:
    special = (settings or {}).get("specialPages")
    if not isinstance(special, dict):
        return md_content

    out: list[str] = []
    if bool(special.get("coverPage")):
        out.append(_build_cover_html(metadata))

    if bool(special.get("tocPage")):
        raw_depth = special.get("tocDepth")
        try:
            if raw_depth is None or raw_depth == "":
                depth = 2
            else:
                depth = int(float(str(raw_depth).strip()))
        except (TypeError, ValueError):
            depth = 2
        depth = max(1, min(6, depth))
        out.append(_build_toc_markdown(md_content, depth))

    if not out:
        return md_content
    special_block = "\n".join(out) + "\n"
    frontmatter_match = re.match(r"^(\ufeff?---\n[\s\S]*?\n---\n?)", md_content or "")
    if not frontmatter_match:
        return special_block + md_content

    frontmatter = frontmatter_match.group(1)
    body = (md_content or "")[len(frontmatter):]
    return frontmatter + "\n" + special_block + body


def _read_history_items() -> list[dict]:
    if not HISTORY_FILE.exists():
        return []
    try:
        data = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []
    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict)]


def _write_history_items(items: list[dict]) -> None:
    HISTORY_FILE.write_text(
        json.dumps(items[:MAX_HISTORY_ITEMS], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _record_history(item: dict) -> None:
    items = _read_history_items()
    items.insert(0, item)
    _write_history_items(items)


class ConvertRequest(BaseModel):
    md_content: str
    mode: str = "template_match"
    html_content: str = ""
    template: str = "default.hwpx"
    filename: str = "document"
    metadata: dict = {}
    style_profile: dict = {}
    assets: dict = {}
    settings: dict = {}


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


@app.get("/api/history")
def get_history(limit: int = 20):
    n = max(1, min(100, int(limit or 20)))
    return {"items": _read_history_items()[:n]}


@app.post("/api/convert/hwpx")
def convert_hwpx(req: ConvertRequest):
    try:
        if not _has_hwpx_cli():
            raise HTTPException(status_code=500, detail="pypandoc-hwpx 미설치. pip install -r requirements.txt")

        pandoc_path = _resolve_pandoc_path(autoinstall=True)
        if not pandoc_path:
            raise HTTPException(status_code=500, detail="Pandoc 미설치. https://pandoc.org/installing.html")

        template_path = TEMPLATES_DIR / Path(req.template).name
        if not template_path.exists():
            raise HTTPException(status_code=404, detail=f"템플릿 없음: {req.template}")

        safe_name = Path(req.filename).stem or "document"
        requested_mode = str(getattr(req, "mode", "template_match") or "template_match").strip().lower()
        convert_mode = "style_priority" if requested_mode in {"style_priority", "mdedit_style", "style"} else "template_match"
        source_markdown = _inject_frontmatter(req.md_content, req.metadata)
        try:
            source_markdown = _inject_special_pages(source_markdown, req.metadata, req.settings)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"특수 페이지 설정 처리 실패: {e}")

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

            env = os.environ.copy()
            env["PYPANDOC_PANDOC"] = str(pandoc_path)
            extra_path_dirs = [str(pandoc_path.parent)]
            local_bin = _resolve_binary("pypandoc-hwpx")
            if local_bin:
                extra_path_dirs.append(str(local_bin.parent))
            env["PATH"] = os.pathsep.join(extra_path_dirs + [env.get("PATH", "")])

            def run_convert(input_path: Path, use_reference: bool) -> subprocess.CompletedProcess:
                if out_file.exists():
                    try:
                        out_file.unlink()
                    except OSError:
                        pass
                cmd = [sys.executable, "-m", "pypandoc_hwpx.cli", str(input_path)]
                if use_reference:
                    cmd.extend(reference_doc_arg)
                cmd.extend(["-o", str(out_file)])
                return subprocess.run(cmd, capture_output=True, text=True, timeout=120, env=env)

            current_markdown = source_markdown
            current_input = md_file
            input_kind = "markdown"
            yaml_recovered = False
            yaml_disabled_retry = False
            yaml_html_reader_retry = False
            style_to_markdown_retry = False
            style_html_empty_output_retry = False

            try:
                if convert_mode == "style_priority" and str(getattr(req, "html_content", "") or "").strip():
                    html_file = tmp / "input_preview.html"
                    normalized_html = _normalize_style_html_for_pandoc(str(req.html_content))
                    html_file.write_text(normalized_html, encoding="utf-8")
                    current_input = html_file
                    input_kind = "html"
                result = run_convert(current_input, use_reference=bool(reference_doc_arg))
            except FileNotFoundError:
                raise HTTPException(status_code=500, detail="HWPX 변환 CLI 실행 실패 (python/pypandoc-hwpx 경로 확인)")
            except subprocess.TimeoutExpired:
                raise HTTPException(status_code=504, detail="변환 시간 초과 (120초)")

            if result.returncode == 0 and input_kind == "html" and out_file.exists():
                # 일부 템플릿/HTML 조합에서 성공 코드지만 본문이 비는 사례가 있어 내용 검증 후 폴백한다.
                if not _hwpx_has_meaningful_text(out_file):
                    style_html_empty_output_retry = True
                    style_to_markdown_retry = True
                    try:
                        current_input = md_file
                        input_kind = "markdown"
                        result = run_convert(current_input, use_reference=bool(reference_doc_arg))
                    except subprocess.TimeoutExpired:
                        raise HTTPException(status_code=504, detail="변환 시간 초과 (스타일 HTML 빈출력 폴백 재시도 포함, 120초)")

            # 스타일 우선(HTML) 입력이 실패하면 markdown 변환 경로로 1회 자동 폴백.
            if result.returncode != 0 and input_kind == "html":
                style_to_markdown_retry = True
                try:
                    current_input = md_file
                    input_kind = "markdown"
                    result = run_convert(current_input, use_reference=bool(reference_doc_arg))
                except subprocess.TimeoutExpired:
                    raise HTTPException(status_code=504, detail="변환 시간 초과 (스타일 HTML->Markdown 폴백 재시도 포함, 120초)")

            # 사용자 입력 frontmatter가 깨져 있으면 strip 후 안전 frontmatter를 재주입해 1회 복구 시도.
            if result.returncode != 0 and input_kind == "markdown":
                err_text = result.stderr or result.stdout or ""
                if "Error parsing YAML metadata" in err_text:
                    yaml_recovered = True
                    recovered_markdown = _strip_frontmatter(source_markdown)
                    recovered_markdown = _inject_frontmatter(recovered_markdown, req.metadata)
                    try:
                        current_markdown = recovered_markdown
                        md_file.write_text(current_markdown, encoding="utf-8")
                        current_input = md_file
                        result = run_convert(current_input, use_reference=bool(reference_doc_arg))
                    except subprocess.TimeoutExpired:
                        raise HTTPException(status_code=504, detail="변환 시간 초과 (YAML 복구 재시도 포함, 120초)")

            # YAML 복구 후에도 같은 오류면 metadata 블록 파싱을 완전히 회피하는 최종 재시도.
            if result.returncode != 0 and input_kind == "markdown":
                err_text = result.stderr or result.stdout or ""
                if "Error parsing YAML metadata" in err_text:
                    yaml_disabled_retry = True
                    hard_markdown = "<!-- mdedit: disable yaml metadata block -->\n\n" + _strip_frontmatter(current_markdown)
                    try:
                        current_markdown = hard_markdown
                        md_file.write_text(current_markdown, encoding="utf-8")
                        current_input = md_file
                        result = run_convert(current_input, use_reference=bool(reference_doc_arg))
                    except subprocess.TimeoutExpired:
                        raise HTTPException(status_code=504, detail="변환 시간 초과 (YAML 파싱 비활성화 재시도 포함, 120초)")

            # 그래도 YAML 오류면 markdown reader의 YAML 기능을 끈 상태로 HTML 경유 변환.
            if result.returncode != 0 and input_kind == "markdown":
                err_text = result.stderr or result.stdout or ""
                if "Error parsing YAML metadata" in err_text:
                    yaml_html_reader_retry = True
                    plain_markdown = _strip_frontmatter(current_markdown)
                    md_file.write_text(plain_markdown, encoding="utf-8")
                    html_file = tmp / "input_no_yaml.html"
                    try:
                        pre = subprocess.run(
                            [
                                str(pandoc_path),
                                "-f",
                                "markdown-yaml_metadata_block",
                                "-t",
                                "html",
                                str(md_file),
                                "-o",
                                str(html_file),
                            ],
                            capture_output=True,
                            text=True,
                            timeout=120,
                            env=env,
                        )
                    except subprocess.TimeoutExpired:
                        raise HTTPException(status_code=504, detail="변환 시간 초과 (YAML 우회 HTML 전처리 포함, 120초)")

                    if pre.returncode != 0:
                        raise HTTPException(status_code=500, detail=f"YAML 우회 HTML 전처리 실패:\n{pre.stderr or pre.stdout}")

                    current_input = html_file
                    try:
                        result = run_convert(current_input, use_reference=bool(reference_doc_arg))
                    except subprocess.TimeoutExpired:
                        raise HTTPException(status_code=504, detail="변환 시간 초과 (YAML 우회 HTML 경유 변환 포함, 120초)")

            # Uploaded/legacy template가 깨져있으면 reference-doc 없이 1회 재시도.
            retried_without_template = False
            if result.returncode != 0 and reference_doc_arg:
                retried_without_template = True
                try:
                    result = run_convert(current_input, use_reference=False)
                except subprocess.TimeoutExpired:
                    raise HTTPException(status_code=504, detail="변환 시간 초과 (템플릿 미적용 재시도 포함, 120초)")

            if result.returncode != 0:
                detail = result.stderr or result.stdout or "unknown"
                failed_dump = Path(tempfile.gettempdir()) / f"mdedit_last_failed_input{current_input.suffix}"
                try:
                    shutil.copy2(current_input, failed_dump)
                except Exception:
                    failed_dump = None
                logger.error(
                    "pandoc conversion failed: mode=%s retried_without_template=%s style_to_markdown_retry=%s style_html_empty_output_retry=%s yaml_recovered=%s yaml_disabled_retry=%s yaml_html_reader_retry=%s failed_input=%s detail=%s",
                    convert_mode,
                    retried_without_template,
                    style_to_markdown_retry,
                    style_html_empty_output_retry,
                    yaml_recovered,
                    yaml_disabled_retry,
                    yaml_html_reader_retry,
                    str(failed_dump) if failed_dump else None,
                    detail[:1200],
                )
                if retried_without_template:
                    raise HTTPException(status_code=500, detail=f"변환 실패(템플릿 미적용 재시도 후에도 실패):\n{detail}")
                if yaml_html_reader_retry:
                    raise HTTPException(status_code=500, detail=f"변환 실패(YAML 우회 HTML 경유 재시도 후에도 실패):\n{detail}")
                if yaml_disabled_retry:
                    raise HTTPException(status_code=500, detail=f"변환 실패(YAML 파싱 비활성화 재시도 후에도 실패):\n{detail}")
                if yaml_recovered:
                    raise HTTPException(status_code=500, detail=f"변환 실패(YAML 복구 재시도 후에도 실패):\n{detail}")
                raise HTTPException(status_code=500, detail=f"변환 실패:\n{detail}")
            if not out_file.exists():
                raise HTTPException(status_code=500, detail="변환 결과 파일 없음")

            dest = Path(tempfile.gettempdir()) / f"mhs_{safe_name}.hwpx"
            shutil.copy2(out_file, dest)

        try:
            _record_history(
                {
                    "created_at": datetime.now().isoformat(timespec="seconds"),
                    "filename": f"{safe_name}.hwpx",
                    "template": template_path.name,
                    "mode": convert_mode,
                    "style_profile_name": str((req.style_profile or {}).get("profile_name") or ""),
                    "size_bytes": dest.stat().st_size if dest.exists() else None,
                    "title": str((req.metadata or {}).get("title") or ""),
                    "author": str((req.metadata or {}).get("author") or ""),
                }
            )
        except Exception:
            pass

        return FileResponse(str(dest), filename=f"{safe_name}.hwpx", media_type="application/octet-stream")
    except HTTPException as e:
        logger.error(
            "convert_hwpx failed: status=%s detail=%s template=%s filename=%s",
            e.status_code,
            e.detail,
            getattr(req, "template", None),
            getattr(req, "filename", None),
        )
        raise
    except Exception as e:
        logger.exception("Unexpected error during /api/convert/hwpx")
        raise HTTPException(status_code=500, detail=f"서버 내부 예외: {type(e).__name__}: {e}")


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
