"""
MD-HWPX Studio — server.py  v4.0
HWPX 변환 전용 FastAPI 로컬 서버
실행: python server.py
"""
from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="MD-HWPX Studio Server", version="4.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

TEMPLATES_DIR = Path("templates")
TEMPLATES_DIR.mkdir(exist_ok=True)
DEFAULT_TEMPLATE = TEMPLATES_DIR / "default.hwpx"


class ConvertRequest(BaseModel):
    md_content: str
    template: str = "default.hwpx"
    filename: str = "document"
    metadata: dict = {}


@app.get("/api/health")
def health():
    return {"status": "ok", "pandoc": shutil.which("pandoc") is not None}


@app.get("/api/templates")
def list_templates():
    return {"templates": sorted(f.name for f in TEMPLATES_DIR.glob("*.hwpx"))}


@app.post("/api/convert/hwpx")
def convert_hwpx(req: ConvertRequest):
    if not shutil.which("pandoc"):
        raise HTTPException(status_code=500, detail="Pandoc 미설치. https://pandoc.org/installing.html")

    template_path = TEMPLATES_DIR / Path(req.template).name
    if not template_path.exists():
        raise HTTPException(status_code=404, detail=f"템플릿 없음: {req.template}")

    safe_name = Path(req.filename).stem or "document"
    meta_args = [f"--metadata={k}:{v}" for k, v in req.metadata.items() if v]

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        md_file = tmp / "input.md"
        out_file = tmp / f"{safe_name}.hwpx"
        md_file.write_text(req.md_content, encoding="utf-8")

        cmd = [
            "pypandoc-hwpx",
            str(md_file),
            f"--reference-doc={template_path}",
            "-o",
            str(out_file),
            *meta_args,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
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


if __name__ == "__main__":
    import uvicorn

    if not DEFAULT_TEMPLATE.exists():
        # 빈 템플릿 placeholder (실제 변환에는 유효한 hwpx 필요)
        DEFAULT_TEMPLATE.write_bytes(b"PLACEHOLDER-HWPX")

    print("=" * 50)
    print("MD-HWPX Studio Server v4.0")
    print("index.html을 Chrome/Edge에서 여세요")
    print("API 문서: http://localhost:8000/docs")
    print("=" * 50)
    uvicorn.run(app, host="127.0.0.1", port=8000)
