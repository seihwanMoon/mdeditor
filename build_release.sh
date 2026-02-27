#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${ROOT_DIR}/release"
WEB_DIR="${OUT_DIR}/web"
FULL_DIR="${OUT_DIR}/hwpx"

echo "[1/4] 기존 release 정리"
rm -rf "${OUT_DIR}"
mkdir -p "${WEB_DIR}" "${FULL_DIR}"

WEB_FILES=(
  "index.html"
  "style.css"
  "app.js"
  "editor.js"
  "export.js"
  "preview.js"
  "settings.js"
  "presets.js"
)

FULL_FILES=(
  "index.html"
  "style.css"
  "app.js"
  "editor.js"
  "export.js"
  "preview.js"
  "settings.js"
  "presets.js"
  "server.py"
  "requirements.txt"
  ".gitkeep"
)

echo "[2/4] 웹 전용 파일 복사"
for f in "${WEB_FILES[@]}"; do
  cp "${ROOT_DIR}/${f}" "${WEB_DIR}/${f}"
done

echo "[3/4] HWPX 포함 파일 복사"
for f in "${FULL_FILES[@]}"; do
  cp "${ROOT_DIR}/${f}" "${FULL_DIR}/${f}"
done
cp -R "${ROOT_DIR}/templates" "${FULL_DIR}/templates"

cat > "${WEB_DIR}/deployment.js" <<'EOF'
window.MDEDIT_DEPLOY = {
  mode: 'web',
  label: '웹 전용',
};
EOF

cat > "${FULL_DIR}/deployment.js" <<'EOF'
window.MDEDIT_DEPLOY = {
  mode: 'full',
  label: 'HWPX 포함',
};
EOF

cat > "${WEB_DIR}/run_web.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "MDedit 웹 전용 실행: http://127.0.0.1:8080"
python3 -m http.server 8080
EOF

cat > "${FULL_DIR}/run_hwpx.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "[1/2] Python 의존성 설치"
python3 -m pip install --user -r requirements.txt
echo "[2/2] HWPX 서버 실행: http://127.0.0.1:8000"
python3 server.py
EOF

chmod +x "${WEB_DIR}/run_web.sh" "${FULL_DIR}/run_hwpx.sh"

echo "[4/4] 완료"
echo " - 웹 전용: ${WEB_DIR}"
echo " - HWPX 포함: ${FULL_DIR}"
