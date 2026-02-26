#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "[1/2] Python 의존성 확인/설치"
python3 -m pip install --user -r requirements.txt >/tmp/mdedit_pip_install.log 2>&1 || {
  echo "패키지 설치 실패. 로그: /tmp/mdedit_pip_install.log"
  cat /tmp/mdedit_pip_install.log
  exit 1
}

echo "[2/2] 서버 실행: http://127.0.0.1:8000"
python3 server.py
