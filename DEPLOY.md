# 배포 버전 가이드

## 1) 웹 전용 버전
- 목적: 에디터/미리보기/HTML/PDF 내보내기만 사용
- HWPX 버튼/템플릿/변환이력 UI는 비활성화됨
- 실행:
  - `cd release/web`
  - `./run_web.sh`
  - 브라우저에서 `http://127.0.0.1:8080`

## 2) HWPX 포함 버전
- 목적: 웹 기능 + HWPX 변환 API 사용
- 실행:
  - `cd release/hwpx`
  - `./run_hwpx.sh`
  - 브라우저에서 `http://127.0.0.1:8000`

## 릴리즈 생성
- 프로젝트 루트에서:
  - `./build_release.sh`

생성 폴더:
- `release/web`
- `release/hwpx`

## Windows 패키지 생성
- 프로젝트 루트에서:
  - `./build_windows_packages.sh`

생성 파일:
- `dist/windows/mdedit-web-win.zip`
- `dist/windows/mdedit-full-win.zip`

### Windows 사용자 실행
- Web:
  - 압축 해제 후 `start_web.bat` 더블클릭
  - Python 설치 불필요
- Full:
  - 압축 해제 후 `setup_full.bat` 1회 실행
  - 이후 `start_full.bat` 실행
