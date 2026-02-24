# MD-HWPX Studio — PRD v4.0

**제품 요구사항 문서 (최종 통합안)**

| 항목 | 내용 |
|---|---|
| 버전 | v4.0 |
| 작성일 | 2026-02-24 |
| 작성자 | Shmoon |
| 상태 | 확정 → 구현 준비 |
| 주요 변경 | 에디터 textarea 전환 + takjakim 아이디어 통합 |

---

## 1. 프로젝트 개요

### 핵심 가치

> "Markdown을 진짜 한글 문서로 — HWPX 변환과 HWP 친화적 HTML 내보내기"

### takjakim 대비 포지셔닝

| | takjakim (md.takjakim.kr) | MD-HWPX Studio (우리) |
|---|---|---|
| 포커스 | Markdown → 예쁜 PDF | Markdown → 진짜 한글 문서 |
| HTML 내보내기 | 웹용 | 웹용 + **HWP import용** |
| PDF | ✅ 브라우저 인쇄 | ✅ 동일 |
| HWPX 변환 | ❌ 없음 | ✅ **독보적 강점** |
| 설정 패널 | ✅ 풍부함 | ✅ HWPX 연동 중심으로 채택 |
| 에디터 | textarea + 라인번호 | textarea + 라인번호 (채택) |
| 프리뷰 | A4 iframe | A4 iframe (채택) |

### 버전별 전환 이유
- **v4.0: textarea + A4 iframe → 프리뷰 완전 제어 + takjakim 아이디어 통합**

---

## 2. 사용 환경

- **사용자**: 개인 (Shmoon), 로컬 PC
- **브라우저**: Chrome / Edge (File System Access API 지원)
- **OS**: Windows 
- **외부 배포**: 없음 (localhost 전용)
- **보안 제약**: 없음

---

## 3. 기능 범위

### Stage 1 — 브라우저 단독 (Python 불필요)

| 기능 | 설명 |
|---|---|
| MD 편집 | textarea + JetBrains Mono + 라인번호 |
| 실시간 프리뷰 | A4 크기(210mm) iframe, 설정 즉시 반영 |
| 문서 설정 패널 | 글꼴/여백/표스타일/제목스타일/페이지나누기 |
| YAML frontmatter | title/subtitle/author/date/organization 파싱 |
| 프리셋 | localStorage 저장/불러오기/내보내기 |
| HTML 내보내기 (웹용) | CSS 테마 적용, 브라우저 배포용 |
| HTML 내보내기 (HWP용) | 인라인 스타일 중심, HWP import 최적화 |
| PDF | 브라우저 print() |
| MD 파일 저장/열기 | File System Access API |
| 자동저장 | localStorage |

### Stage 2 — Python 서버 추가 (HWPX 변환)

| 기능 | 설명 |
|---|---|
| HWPX 변환 | MD + 설정 → pypandoc-hwpx → .hwpx |
| frontmatter 연동 | title/author/date → HWPX 메타데이터 |
| 템플릿 관리 | .hwpx 템플릿 목록/선택/업로드 |
| 서버 상태 | 5초 폴링, UI 인디케이터 |

### 비목표 (전체)

- 클라우드 동기화
- 다중 사용자
- 모바일
- HWPX 편집 (읽기 전용 템플릿)
- 표지/목차/간지 자동 생성 (Stage 2 보너스)

---

## 4. 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    index.html (브라우저)                     │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  textarea 에디터  │    │  A4 iframe 프리뷰 (210×297mm)  │ │
│  │  - 라인번호       │    │  - marked.js → HTML            │ │
│  │  - JetBrains Mono│    │  - 문서 설정 CSS 즉시 반영      │ │
│  │  - 찾기 기능      │    │  - 설정값 → CSS 변수           │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ⚙ 문서 설정 패널                                       │ │
│  │  글꼴 | 여백 | 표스타일 | 제목스타일 | 페이지나누기      │ │
│  │  HWPX 템플릿 선택 | 프리셋                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  출력:                                                       │
│  [HTML 웹용] [HTML HWP용] [PDF] → 서버 없이 브라우저 처리   │
│  [HWPX 변환] → fetch → server.py                           │
└────────────────────────────────┬────────────────────────────┘
                                 │ HTTP localhost:8000 (HWPX만)
┌────────────────────────────────▼────────────────────────────┐
│                    server.py (FastAPI)                      │
│                                                             │
│  POST /api/convert/hwpx                                     │
│    ← { md_content, settings, template }                     │
│    → frontmatter 파싱 + pypandoc-hwpx 실행                  │
│    → .hwpx 반환                                             │
│                                                             │
│  GET  /api/templates, /api/health                           │
│  POST /api/templates/upload                                 │
└─────────────────────────────────────────────────────────────┘
```

### 파일 구조

```
md-hwpx-studio/
├── index.html          # 브라우저에서 직접 열기
├── style.css           # 앱 레이아웃
├── app.js              # 메인 로직
├── editor.js           # textarea 에디터 + 라인번호
├── preview.js          # A4 iframe 프리뷰 렌더링
├── settings.js         # 문서 설정 패널
├── export.js           # HTML/PDF 내보내기
├── presets.js          # 프리셋 관리
├── server.py           # FastAPI (HWPX 전용)
├── templates/          # HWPX 템플릿 파일
│   ├── default.hwpx
│   └── report.hwpx
├── requirements.txt
└── README.md
```

---

## 5. 기술 스택

| 구성 요소 | 선택 | 이유 |
|---|---|---|
| MD 에디터 | `<textarea>` + 라인번호 | 프리뷰 CSS 완전 제어 가능 |
| MD 파서 | marked.js (CDN) | 경량, 빠름, 커스터마이징 쉬움 |
| 프리뷰 | `<iframe srcDoc>` A4 210mm | HWP 용지 모양 재현 |
| 파일 I/O | File System Access API | 로컬 파일 직접 저장 |
| 자동저장 | localStorage | 탭 닫힘 복원 |
| 백엔드 | FastAPI (Python 3.11+) | HWPX 변환 전용 |
| HWPX 변환 | pypandoc-hwpx | Pandoc 기반, MIT |
| frontmatter | gray-matter (JS) or 직접 파싱 | YAML 메타데이터 추출 |

---

## 6. 문서 설정 명세

### defaultSettings (전체)

```javascript
const defaultSettings = {
    // 글꼴
    fontFamily:         "nanum-gothic",  // nanum-gothic | nanum-myeongjo | malgun | pretendard | custom
    customFontFamily:   "",
    fontSize:           10,              // pt
    lineHeight:         1.6,
    wordBreak:          "keep-all",      // keep-all | break-all | normal
    textIndent:         "0",

    // 여백 (mm)
    margin: { top: "15mm", right: "20mm", bottom: "15mm", left: "20mm" },

    // 표 스타일
    tableStyle:         "hwp",           // hwp | apa | minimal | none

    // 제목 스타일
    headingStyle:       "default",       // default | numbered-box | apa

    // 페이지 나누기
    pageBreakBeforeH1:  false,
    pageBreakBeforeH2:  false,
    pageBreakBeforeH3:  false,

    // 기타
    breaks:             true,
    highlight:          true,
    scale:              1,               // PDF 출력 스케일
};
```

### 폰트 매핑

| value | CSS font-family | 설명 |
|---|---|---|
| nanum-gothic | 'NanumGothic', '나눔고딕' | 공공기관 기본 |
| nanum-myeongjo | 'NanumMyeongjo', '나눔명조' | 학술/논문 |
| malgun | 'Malgun Gothic', '맑은 고딕' | Windows 기본 |
| pretendard | 'Pretendard' | 현대적 |
| custom | customFontFamily 값 사용 | 사용자 지정 |

### 표 스타일 (tableStyle)

| value | 설명 | CSS 특징 |
|---|---|---|
| hwp | 관공서 (HWP) | 모든 셀 border, 헤더 회색 배경 |
| apa | APA 7th | 상하 border만, 내부선 없음 |
| minimal | 최소 | 외곽선만 |
| none | 없음 | border 없음 |

---

## 7. 출력 명세

### 7-1. HTML 웹용

브라우저에서 예쁘게 보이는 HTML. CSS 테마 포함.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <style>
    /* Google Fonts + 테마 CSS + 설정값 반영 */
    body { font-family: '나눔고딕'; font-size: 10pt; ... }
  </style>
</head>
<body>
  <!-- frontmatter가 있으면 헤더 블록 -->
  <header class="doc-meta">...</header>
  <article><!-- marked.js 변환 결과 --></article>
</body>
</html>
```

### 7-2. HTML HWP import용 ← 차별화 핵심

HWP/한글 프로그램에서 File → 열기로 직접 import할 때 최적화.

**원칙**: CSS class 없음, 인라인 style 중심, 시맨틱 태그만 사용

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <!-- 외부 CSS 없음 — HWP가 무시하므로 -->
</head>
<body style="font-family:'나눔고딕',sans-serif; font-size:10pt; line-height:1.6; margin:15mm 20mm;">
  <h1 style="font-size:16pt; font-weight:bold; margin-top:12pt; margin-bottom:6pt;">제목</h1>
  <p style="margin:0 0 6pt;">본문 내용</p>
  <table style="border-collapse:collapse; width:100%;">
    <tr><th style="border:1px solid #000; padding:4pt; background:#f0f0f0;">항목</th></tr>
    <tr><td style="border:1px solid #000; padding:4pt;">내용</td></tr>
  </table>
</body>
</html>
```

**HWP가 인식하는 것**: h1~h6, p, table, ul/ol/li, strong, em, 인라인 style 일부
**HWP가 무시하는 것**: CSS class, 외부 폰트, flexbox, CSS 변수

### 7-3. PDF

`window.print()` + `@media print` CSS. 브라우저 인쇄 대화상자.

```css
@media print {
    body { margin: 0; }
    .editor-panel, .settings-panel { display: none; }
    .preview-panel { width: 100%; }
}
```

### 7-4. HWPX (서버 필요)

```
YAML frontmatter 파싱
    → title, author, date → --metadata 옵션
    → md_content (frontmatter 제거) → 임시 .md 파일
    → pypandoc-hwpx input.md \
         --reference-doc=templates/{template}.hwpx \
         --metadata title="..." \
         --metadata author="..." \
         -o output.hwpx
    → FileResponse 반환
```

---

## 8. UI/UX 명세

### 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  타이틀바 (진한 배경)                          [🌙 다크]    │
├─────────────────────────────────────────────────────────────┤
│  툴바 (회색 배경)                                           │
│  [새문서][열기][저장] | [HTML웹][HTML한글][PDF][HWPX]       │
│  [표▼][이미지] | [편집|분할|미리보기] | [프리셋▼][도움말]   │
├───────────────────────┬─────────────────┬───────────────────┤
│  에디터 패널 (flex:1) │ 미리보기 패널   │ 설정 패널 (240px) │
│                       │ (flex:1)        │                   │
│  라인 │ textarea      │  회색 배경      │ ⚙ 문서 설정       │
│  번호 │               │ ┌──A4──────┐   │                   │
│   1   │ ---           │ │          │   │ T 글꼴            │
│   2   │ title:...     │ │  iframe  │   │   폰트 ▼         │
│   3   │               │ │  프리뷰  │   │   크기  줄간격    │
│  ...  │ # 제목        │ │          │   │   줄바꿈 ▼       │
│       │ 본문...       │ └──────────┘   │ ▦ 여백           │
│       │               │                │   상단 하단       │
│       │               │                │   좌측 우측       │
│       │               │                │ ⊞ 표 스타일      │
│       │               │                │   관공서(HWP) ▼  │
│       │               │                │ H 제목 스타일    │
│       │               │                │   기본 ▼        │
│       │               │                │ ⏤ 페이지나누기   │
│       │               │                │  ☐H1 ☐H2 ☐H3   │
│       │               │                │ ─────────────── │
│       │               │                │ 📋 HWPX 템플릿  │
│       │               │                │  default.hwpx ▼ │
│       │               │                │  [HWPX 변환]    │
│       │               │                │ ─────────────── │
│       │               │                │ 💾 프리셋       │
│       │               │                │  [저장] [관리]  │
│       │               │                │  공공기관 기본  │
│       │               │                │  학술 논문      │
├───────────────────────┴─────────────────┴───────────────────┤
│  상태바: 줄1, 열1 | 15줄 | 352자 | Markdown | ● 서버연결됨 │
└─────────────────────────────────────────────────────────────┘
```

### 뷰 모드 (툴바 토글)

| 모드 | 레이아웃 |
|---|---|
| 편집 | 에디터만 (설정 패널 유지) |
| 분할 | 에디터 + 프리뷰 (기본) |
| 미리보기 | 프리뷰만 (설정 패널 유지) |

### 단축키

| 단축키 | 동작 |
|---|---|
| Ctrl+S | 파일 저장 |
| Ctrl+O | 파일 열기 |
| Ctrl+1 | 편집 모드 |
| Ctrl+2 | 분할 모드 |
| Ctrl+3 | 미리보기 모드 |
| Ctrl+Shift+H | HTML 웹용 내보내기 |
| Ctrl+Shift+K | HTML HWP용 내보내기 |
| Ctrl+P | PDF 인쇄 |
| Ctrl+Shift+W | HWPX 변환 |
| Ctrl+F | 찾기 |

### 다크/라이트 테마

CSS 변수(`--wp-*`)로 전체 컬러 제어. localStorage에 선택값 저장.

---

## 9. YAML frontmatter 명세

### 지원 필드

```yaml
---
title: 문서 제목
subtitle: 부제목
author: 작성자
date: 2025-01-01
organization: 소속 기관
---
```

### 처리 방식

- 에디터에서 `---`로 시작하는 블록 감지 → 파싱
- 프리뷰: frontmatter 숨기고 헤더 블록으로 렌더링
- HTML 웹용: `<header class="doc-meta">` 블록 생성
- HTML HWP용: 문서 상단 테이블로 변환
- HWPX: `--metadata` 옵션으로 pypandoc-hwpx 전달

---

## 10. 프리셋 명세

### 구조

```javascript
// localStorage key: "md-hwpx-studio-presets"
[
    {
        id: "uuid",
        name: "공공기관 기본",
        settings: { ...defaultSettings }
    },
    {
        id: "uuid",
        name: "학술 논문",
        settings: { fontFamily: "nanum-myeongjo", fontSize: 10.5, ... }
    }
]
```

### 내장 프리셋 (초기값)

| 이름 | 주요 설정 |
|---|---|
| 공공기관 기본 | 나눔고딕, 10pt, 줄간격 1.6, 관공서 표, 여백 15/20mm |
| 학술 논문 | 나눔명조, 10.5pt, 줄간격 2.0, APA 표, 여백 25mm |
| 보고서 | 맑은 고딕, 10pt, 줄간격 1.5, HWP 표, 번호박스 제목 |

---

## 11. 서버 API 명세

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/health` | 서버 상태 + pandoc 설치 여부 |
| GET | `/api/templates` | 템플릿 목록 |
| POST | `/api/convert/hwpx` | HWPX 변환 |
| POST | `/api/templates/upload` | 템플릿 업로드 |
| DELETE | `/api/templates/{name}` | 템플릿 삭제 |

### POST /api/convert/hwpx Request

```json
{
    "md_content": "# 제목\n\n본문",
    "template": "default.hwpx",
    "filename": "report",
    "metadata": {
        "title": "문서 제목",
        "author": "홍길동",
        "date": "2025-01-01",
        "organization": "개발팀"
    }
}
```

---

## 12. 개발 로드맵

### Stage 1 (1주)

```
Day 1:  프로젝트 구조, 레이아웃 CSS, 다크/라이트 테마
Day 2:  textarea 에디터 (라인번호, 찾기, 단축키)
        marked.js + A4 iframe 프리뷰 연결
Day 3:  설정 패널 UI + defaultSettings
        설정 변경 → 프리뷰 CSS 즉시 반영
Day 4:  YAML frontmatter 파싱
        HTML 웹용 내보내기
        HTML HWP용 내보내기 (인라인 스타일)
Day 5:  파일 저장/열기, 자동저장
        프리셋 저장/불러오기
        PDF, 서버 연결 대기 UI
        통합 테스트
```

### Stage 2 (3~4일)

```
Day 1:  FastAPI 서버 기본 구조
Day 2:  HWPX 변환 API + frontmatter 메타데이터 연동
Day 3:  템플릿 관리 API + 브라우저 연동
Day 4:  통합 테스트 + README
```

### 총 예상 기간: 1.5~2주

---

## 13. 변경 이력

| 버전 | 날짜 | 주요 변경 |
|---|---|---|
| **v4.0** | **2026-02-24** | **textarea + A4 프리뷰 + takjakim 통합** |
