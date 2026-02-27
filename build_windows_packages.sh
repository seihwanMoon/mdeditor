#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${ROOT_DIR}/dist/windows"
WEB_STAGE="${OUT_DIR}/mdedit-web"
FULL_STAGE="${OUT_DIR}/mdedit-full"

echo "[1/6] 기본 release 생성"
"${ROOT_DIR}/build_release.sh"

echo "[2/6] Windows 패키지 스테이징 초기화"
rm -rf "${OUT_DIR}"
mkdir -p "${WEB_STAGE}" "${FULL_STAGE}"

echo "[3/6] 파일 복사"
cp -R "${ROOT_DIR}/release/web/." "${WEB_STAGE}/"
cp -R "${ROOT_DIR}/release/hwpx/." "${FULL_STAGE}/"

cat > "${WEB_STAGE}/start_web.bat" <<'EOF'
@echo off
setlocal
cd /d %~dp0
echo MDedit Web edition starting on http://127.0.0.1:8080
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0web_server.ps1" -Port 8080
endlocal
EOF

cat > "${WEB_STAGE}/web_server.ps1" <<'EOF'
param([int]$Port = 8080)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$prefix = "http://127.0.0.1:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "MDedit Web server started: $prefix"
Start-Process $prefix | Out-Null

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif" = "image/gif"
  ".svg" = "image/svg+xml"
  ".ico" = "image/x-icon"
}

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $reqPath = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ([string]::IsNullOrWhiteSpace($reqPath) -or $reqPath -eq "/") { $reqPath = "/index.html" }
    $localPath = Join-Path $root ($reqPath.TrimStart('/').Replace('/','\'))

    if ((Test-Path $localPath) -and -not (Get-Item $localPath).PSIsContainer) {
      $ext = [System.IO.Path]::GetExtension($localPath).ToLowerInvariant()
      $bytes = [System.IO.File]::ReadAllBytes($localPath)
      $ctx.Response.StatusCode = 200
      $ctx.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" })
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $body = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $ctx.Response.StatusCode = 404
      $ctx.Response.ContentType = "text/plain; charset=utf-8"
      $ctx.Response.ContentLength64 = $body.Length
      $ctx.Response.OutputStream.Write($body, 0, $body.Length)
    }
    $ctx.Response.OutputStream.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
EOF

cat > "${WEB_STAGE}/README-Windows.txt" <<'EOF'
[MDedit Web Edition]
1) start_web.bat 더블클릭
2) 브라우저에서 http://127.0.0.1:8080 열림

- Python 설치가 필요 없습니다.
- HWPX 변환 기능은 포함되지 않습니다.
EOF

cat > "${FULL_STAGE}/setup_full.bat" <<'EOF'
@echo off
setlocal EnableExtensions
cd /d %~dp0

set "PY_CMD="
py -3 --version >nul 2>nul && set "PY_CMD=py -3"
if not defined PY_CMD (
  python --version >nul 2>nul && set "PY_CMD=python"
)

if not defined PY_CMD (
  echo Python 3.8+ 를 찾을 수 없습니다.
  echo 아래 페이지에서 Python 설치 후 다시 실행하세요.
  start "" "https://www.python.org/downloads/windows/"
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo [1/3] 가상환경 생성
  %PY_CMD% -m venv .venv
  if errorlevel 1 goto :err
)

call ".venv\Scripts\activate.bat"
echo [2/3] pip 업데이트
python -m pip install --upgrade pip
if errorlevel 1 goto :err

echo [3/3] 의존성 설치
python -m pip install -r requirements.txt
if errorlevel 1 goto :err

echo setup 완료
endlocal
exit /b 0

:err
echo setup 실패
pause
endlocal
exit /b 1
EOF

cat > "${FULL_STAGE}/start_full.bat" <<'EOF'
@echo off
setlocal
cd /d %~dp0

if not exist ".venv\Scripts\python.exe" (
  call "%~dp0setup_full.bat"
  if errorlevel 1 exit /b 1
)

call ".venv\Scripts\activate.bat"
echo MDedit Full edition starting: http://127.0.0.1:8000
start "" "http://127.0.0.1:8000"
python server.py
endlocal
EOF

cat > "${FULL_STAGE}/README-Windows.txt" <<'EOF'
[MDedit Full Edition]
1) 처음 1회: setup_full.bat 실행 (Python/패키지 준비)
2) 이후: start_full.bat 실행
3) 브라우저에서 http://127.0.0.1:8000 열림

- HWPX 변환 기능 포함
- Python 3.8+ 필요 (없으면 setup이 설치 페이지를 엽니다)
EOF

echo "[4/6] 실행 권한/라인엔딩 준비"
chmod +x "${WEB_STAGE}/start_web.bat" "${FULL_STAGE}/setup_full.bat" "${FULL_STAGE}/start_full.bat"

echo "[5/6] ZIP 패키지 생성"
(
  cd "${OUT_DIR}"
  rm -f mdedit-web-win.zip mdedit-full-win.zip
  if command -v zip >/dev/null 2>&1; then
    zip -qr mdedit-web-win.zip mdedit-web
    zip -qr mdedit-full-win.zip mdedit-full
  else
    python3 - <<'PY'
import pathlib, zipfile
root = pathlib.Path('.').resolve()
targets = [
    ('mdedit-web', 'mdedit-web-win.zip'),
    ('mdedit-full', 'mdedit-full-win.zip'),
]
for folder, zip_name in targets:
    base = root / folder
    with zipfile.ZipFile(root / zip_name, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(base.rglob('*')):
            if p.is_file():
                zf.write(p, p.relative_to(root).as_posix())
PY
  fi
)

echo "[6/6] 완료"
echo " - ${OUT_DIR}/mdedit-web-win.zip"
echo " - ${OUT_DIR}/mdedit-full-win.zip"
