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
