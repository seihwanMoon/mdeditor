# TASKS.md v4.0 — MD-HWPX Studio 구현 체크리스트

> 위에서 아래로 순서대로 진행. 완료 항목은 `- [x]`로 표시.
> 각 태스크는 브라우저에서 바로 열어 확인 가능해야 함.

---

## Stage 1 — 브라우저 단독 (목표: 5일)

---

### S1-1: 프로젝트 구조 + 레이아웃

**목표**: 빈 골격을 열었을 때 3패널(에디터/프리뷰/설정) 레이아웃이 보임

- [x] 디렉토리 생성
  ```
  md-hwpx-studio/
  ├── index.html
  ├── style.css
  ├── app.js
  ├── editor.js
  ├── preview.js
  ├── settings.js
  ├── export.js
  └── presets.js
  ```

- [x] `index.html` 기본 골격
  - [x] marked.js CDN (`cdn.jsdelivr.net/npm/marked/marked.min.js`)
  - [x] highlight.js CDN (코드 하이라이트)
  - [x] 모든 .js 파일 `<script>` 링크
  - [x] `style.css` 링크
  - [ ] 구조:
    ```html
    <div id="app">
      <div id="titlebar">...</div>
      <div id="toolbar">...</div>
      <div id="workspace">
        <div id="editor-panel">
          <div id="line-numbers"></div>
          <textarea id="editor"></textarea>
        </div>
        <div id="preview-panel">
          <div id="preview-bg">   <!-- 회색 배경 -->
            <iframe id="preview-iframe"></iframe>  <!-- A4 용지 -->
          </div>
        </div>
        <div id="settings-panel">...</div>
      </div>
      <div id="statusbar">...</div>
    </div>
    ```

- [x] `style.css` 레이아웃 구현
  - [x] `--wp-*` CSS 변수 정의 (라이트/다크)
  - [x] titlebar: 고정 높이 36px, `--wp-titlebar` 배경
  - [x] toolbar: 고정 높이 48px, `--wp-chrome` 배경
  - [x] workspace: `flex: 1`, `display: flex`, `overflow: hidden`
  - [x] editor-panel: `flex: 1`, 에디터 + 라인번호 나란히
  - [x] preview-panel: `flex: 1`, 회색 배경(`--wp-bg`), 스크롤
  - [x] settings-panel: 고정 `width: 240px`, 스크롤
  - [x] statusbar: 고정 높이 24px, 작은 텍스트
  - [x] A4 iframe: `width: 210mm; min-height: 297mm; background: #fff`
    ```css
    #preview-bg {
        background: var(--wp-bg);
        overflow: auto;
        display: flex;
        justify-content: center;
        padding: 24px 16px;
    }
    #preview-iframe {
        width: 210mm;
        min-height: 297mm;
        border: none;
        background: #fff;
        box-shadow: 0 2px 12px var(--wp-paper-shadow);
    }
    ```

- [x] 브라우저에서 `index.html` 열어 3패널 레이아웃 확인

---

### S1-2: 타이틀바 + 툴바 + 상태바

- [ ] **타이틀바**
  - [ ] 앱 이름 표시 (MD-HWPX Studio)
  - [ ] 다크/라이트 토글 버튼 🌙/☀️
  - [ ] 테마 전환: `data-theme="dark"` 토글 + localStorage 저장

- [ ] **툴바 버튼 그룹**
  ```
  그룹1: [새문서] [열기] [저장]
  구분선
  그룹2: [HTML웹↓] [HTML한글↓] [PDF↓] [HWPX↓]
  구분선
  그룹3: [표▼] [이미지]
  구분선
  그룹4: [편집] [분할] [미리보기]  ← 토글 그룹
  구분선
  그룹5: [프리셋▼] [도움말]
  ```
  - [ ] 각 버튼: 아이콘 (SVG) + 라벨 텍스트 아래
  - [ ] HWPX 버튼 초기: `disabled` + 회색
  - [ ] 뷰 모드 버튼: 활성 버튼 강조 표시

- [ ] **상태바**
  - [ ] 좌: `줄 {n}, 열 {m}` | `{총줄수}줄` | `{글자수}자` | `Markdown`
  - [ ] 우: 서버 상태 인디케이터 (`● 서버 없음`)
  - [ ] 텍스트 입력/커서 이동 시 실시간 업데이트

---

### S1-3: textarea 에디터 + 라인번호

- [ ] **라인번호** (`editor.js`)
  ```javascript
  function updateLineNumbers(textarea) {
      const lines = textarea.value.split('\n').length;
      const nums = Array.from({length: lines}, (_, i) => i + 1);
      document.getElementById('line-numbers').innerHTML =
          nums.map(n => `<div>${n}</div>`).join('');
  }
  ```
  - [ ] 폰트: JetBrains Mono (CDN 또는 시스템 폰트)
  - [ ] textarea 스크롤과 라인번호 스크롤 동기화
    ```javascript
    textarea.addEventListener('scroll', () => {
        lineNumbers.scrollTop = textarea.scrollTop;
    });
    ```
  - [ ] 현재 줄 강조 (cursor 있는 줄 번호 색상 변경)

- [ ] **textarea 스타일**
  ```css
  #editor {
      flex: 1;
      resize: none;
      border: none;
      outline: none;
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      font-size: 12.5px;
      line-height: 20px;
      padding: 16px 16px 16px 8px;
      background: var(--wp-editor-bg);
      color: var(--wp-text);
      tab-size: 2;
      caret-color: var(--wp-accent);
  }
  ```

- [ ] **Tab 키 처리**: Tab → 스페이스 2칸 삽입 (textarea 기본 동작 방지)
- [ ] **입력 이벤트**: `input` → 상태바 업데이트 + 라인번호 업데이트 + 프리뷰 갱신(디바운스)

- [ ] **찾기 기능** (Ctrl+F)
  - [ ] 에디터 상단에 찾기 바 표시/숨김
  - [ ] 입력 → 일치 항목 개수 표시 (`3/7`)
  - [ ] Enter: 다음 / Shift+Enter: 이전 / Esc: 닫기
  - [ ] 현재 일치 항목 하이라이트 (selection으로 처리)

- [ ] **샘플 텍스트** 초기 로드
  ```markdown
  ---
  title: MD-HWPX Studio 테스트
  subtitle: 한글 문서 변환 도구
  author: 홍길동
  date: 2025-01-01
  organization: 개발팀
  ---

  # 제목 1

  본문 내용입니다. **굵은 텍스트**와 *기울임*을 지원합니다.

  ## 제목 2

  | 항목 | 설명 |
  |------|------|
  | A | 첫 번째 항목 |
  | B | 두 번째 항목 |

  > 인용문 블록

  - 목록 1
  - 목록 2
  ```

---

### S1-4: marked.js + A4 iframe 프리뷰

- [ ] marked.js 초기화
  ```javascript
  marked.setOptions({ breaks: true, gfm: true });
  ```
- [ ] `updatePreview(markdown, settings)` 함수 구현
  - [ ] `parseFrontmatter()` → frontmatter 추출
  - [ ] `stripFrontmatter()` → MD 본문만 추출
  - [ ] `marked.parse(mdContent)` → HTML
  - [ ] `buildFrontmatterHeader(fm)` → 문서 헤더 HTML
  - [ ] `buildIframeDoc(html, settings)` → 완성된 HTML
  - [ ] `iframe.srcdoc = ...` 주입

- [ ] CSS 변수 → 프리뷰 스타일 연결 확인
  - [ ] 폰트 변경 → 프리뷰 즉시 반영
  - [ ] 여백 변경 → 프리뷰 즉시 반영

- [ ] **테스트 시나리오**
  - [ ] 샘플 MD 입력 → A4 용지 모양 프리뷰 렌더링
  - [ ] frontmatter 있으면 문서 헤더 블록 표시
  - [ ] frontmatter 없으면 헤더 없이 본문만 표시
  - [ ] 코드블록 하이라이트 적용

- [ ] **디바운스 설정**: 입력 후 300ms 후 프리뷰 갱신
  ```javascript
  const debouncedUpdate = debounce(() => updatePreview(editor.value, currentSettings), 300);
  editor.addEventListener('input', debouncedUpdate);
  ```

---

### S1-5: 설정 패널 UI

- [ ] **설정 패널 헤더**: `⚙ 문서 설정` 타이틀

- [ ] **섹션 1 — T 글꼴** (기본 열림)
  - [ ] 폰트 드롭다운
    - 나눔고딕 / 나눔명조 / 맑은 고딕 / Pretendard / 사용자 지정
  - [ ] 사용자 지정 선택 시 CSS font-family 입력 필드 표시
  - [ ] 크기 (pt) 숫자 입력 (step 0.5, min 6)
  - [ ] 줄 간격 숫자 입력 (step 0.1, min 1)
  - [ ] 줄바꿈 드롭다운 (단어단위/글자단위/기본)
  - [ ] 들여쓰기 텍스트 입력

- [ ] **섹션 2 — ▦ 여백** (기본 열림)
  - [ ] 상단 / 하단 / 좌측 / 우측 입력 (mm 단위, 2×2 그리드)

- [ ] **섹션 3 — ⊞ 표 스타일** (기본 열림)
  - [ ] 드롭다운: 관공서(HWP) / APA / 최소 / 없음

- [ ] **섹션 4 — H 제목 스타일** (기본 열림)
  - [ ] 드롭다운: 기본 / 번호 박스 / APA

- [ ] **섹션 5 — ⏤ 페이지 나누기** (기본 열림)
  - [ ] 체크박스: H1 앞에서 / H2 앞에서 / H3 앞에서

- [ ] **섹션 6 — 📋 HWPX 템플릿** (기본 열림)
  - [ ] 드롭다운: 서버 미연결 시 "서버 없음" 표시
  - [ ] [HWPX 변환] 버튼 (서버 없으면 disabled)
  - [ ] 안내 텍스트: `python server.py` 실행 필요

- [ ] **섹션 7 — 💾 프리셋**
  - [ ] [현재 설정 저장] 버튼 → 이름 입력 팝업
  - [ ] 내장 프리셋 목록 (공공기관/학술/보고서)
  - [ ] 저장한 프리셋 목록 (클릭 → 즉시 적용)

- [ ] **섹션 접기/펼치기**: 각 섹션 헤더 클릭 → 토글

- [ ] 각 설정값 변경 즉시 `currentSettings` 업데이트 + `updatePreview()` 호출

---

### S1-6: defaultSettings + 설정 연동

- [ ] `settings.js`에 `defaultSettings` 객체 정의 (CLAUDE.md 참조)
- [ ] `currentSettings = deepClone(defaultSettings)` 초기화
- [ ] 각 설정 UI 요소 → `currentSettings` 양방향 바인딩
- [ ] `applySettings(settings)` 함수:
  - [ ] UI 요소 값 업데이트
  - [ ] `updatePreview()` 호출
- [ ] **FONT_MAP** 객체로 fontFamily 값 → CSS font-family 변환

---

### S1-7: YAML frontmatter 파싱

- [ ] `parseFrontmatter(markdown)` 구현
  - [ ] `---` 블록 감지 (파일 시작)
  - [ ] key: value 파싱
  - [ ] 지원 필드: title, subtitle, author, date, organization
  - [ ] frontmatter 없으면 `null` 반환

- [ ] `stripFrontmatter(markdown)` 구현
  - [ ] `---` 블록 제거 후 나머지 반환

- [ ] `buildFrontmatterHeader(fm)` 구현 (프리뷰용 HTML)
- [ ] `buildFrontmatterHWP(fm, fontFamily)` 구현 (HWP용 인라인 스타일 HTML)

- [ ] 테스트
  - [ ] frontmatter 있는 MD → 프리뷰 상단에 문서 정보 블록 표시
  - [ ] frontmatter 없는 MD → 본문만 표시
  - [ ] 불완전한 frontmatter (일부 필드만) → 있는 필드만 표시

---

### S1-8: HTML 내보내기 2종

- [ ] **HTML 웹용** (`exportHTMLWeb`)
  - [ ] Google Fonts import (선택된 폰트)
  - [ ] CSS 테마 (settings 값 반영)
  - [ ] frontmatter → `<header class="doc-meta">` 블록
  - [ ] marked.parse 결과 삽입
  - [ ] Blob 다운로드 (파일명: `{원본}.html`)
  - [ ] 테스트: 생성된 HTML을 브라우저에서 열어 예쁘게 보이는지 확인

- [ ] **HTML HWP용** (`exportHTMLforHWP`)
  - [ ] DOMParser로 HTML 파싱
  - [ ] 모든 요소 인라인 스타일 주입 (CLAUDE.md 코드 참조)
  - [ ] `class` 속성 전부 제거
  - [ ] 외부 CSS/폰트 없는 순수 HTML
  - [ ] frontmatter → 인라인 스타일 테이블로 변환
  - [ ] Blob 다운로드 (파일명: `{원본}_hwp.html`)
  - [ ] **테스트**: 생성된 HTML을 HWP/한글에서 열기 → 서식 확인
    - [ ] 폰트 적용 확인
    - [ ] 표 테두리 적용 확인
    - [ ] 제목 크기 확인
    - [ ] 여백 적용 확인

---

### S1-9: PDF 내보내기

- [ ] `exportPDF()` 구현
  - [ ] `@media print` CSS에서 에디터/설정 패널 숨김
  - [ ] 프리뷰 패널만 남기거나, 새 창 열어서 인쇄
  - [ ] `window.print()` 호출
- [ ] 툴바 PDF 버튼 연결
- [ ] 단축키 Ctrl+P 연결

---

### S1-10: 파일 저장/열기 + 자동저장

- [ ] **파일 열기** (`openFile`)
  - [ ] File System Access API 우선
  - [ ] 폴백: `<input type="file" accept=".md,.markdown">`
  - [ ] 열린 파일 내용 → textarea + 프리뷰 갱신
  - [ ] 파일명 → 타이틀바/상태바 표시

- [ ] **파일 저장** (`saveFile`)
  - [ ] 기존 핸들 있으면 덮어쓰기
  - [ ] 없으면 `showSaveFilePicker`
  - [ ] 폴백: Blob 다운로드
  - [ ] Ctrl+S 연결

- [ ] **자동저장** (localStorage)
  - [ ] key: `md-hwpx-content`
  - [ ] 2초 디바운스
  - [ ] 앱 로드 시 복원 시도
  - [ ] 상태바에 `자동 저장됨 HH:MM` 표시

---

### S1-11: 프리셋 관리

- [ ] `presets.js` 구현
  - [ ] localStorage key: `md-hwpx-presets`
  - [ ] 내장 프리셋 3개 (공공기관/학술/보고서)
  - [ ] `loadPresets()` → 내장 + 사용자 프리셋 합치기
  - [ ] `saveCurrentAsPreset(name)` → 현재 settings 저장
  - [ ] `applyPreset(id)` → settings 적용 + UI 갱신 + 프리뷰 갱신
  - [ ] `deletePreset(id)` → 사용자 프리셋만 삭제 가능
  - [ ] JSON 내보내기/불러오기 (`markdown-hwpx-presets.json`)

- [ ] 설정 패널 프리셋 섹션 연동
  - [ ] 프리셋 목록 렌더링
  - [ ] 적용된 프리셋 강조 표시
  - [ ] [저장] 버튼 → 이름 입력 → 저장

---

### S1-12: 서버 연결 대기 UI

- [ ] `checkServer()` 함수 (CLAUDE.md 참조)
  - [ ] `/api/health` 2초 타임아웃
  - [ ] pandoc 설치 여부 별도 확인
  - [ ] 상태 3가지: online(Pandoc OK) / warn(Pandoc 없음) / offline
- [ ] 5초 폴링
- [ ] 상태바 인디케이터 업데이트
- [ ] HWPX 버튼 활성/비활성 연동
- [ ] 템플릿 드롭다운 연동

---

### S1-13: 단축키 + 뷰 모드 + 토스트

- [ ] **단축키** (`app.js`)
  ```
  Ctrl+S      → saveFile()
  Ctrl+O      → openFile()
  Ctrl+1      → setViewMode('edit')
  Ctrl+2      → setViewMode('split')
  Ctrl+3      → setViewMode('preview')
  Ctrl+Shift+H → exportHTMLWeb()
  Ctrl+Shift+K → exportHTMLforHWP()
  Ctrl+P      → exportPDF()
  Ctrl+Shift+W → exportHWPX()
  Ctrl+F      → toggleFind()
  ```

- [ ] **뷰 모드** (`setViewMode`)
  ```
  edit:    에디터만 (settings 패널 유지)
  split:   에디터 + 프리뷰 (기본)
  preview: 프리뷰만 (settings 패널 유지)
  ```

- [ ] **토스트** (`showToast`)
  - [ ] 우하단 고정, 3초 자동 소멸
  - [ ] 타입: info / success / warn / error

---

### S1-14: Stage 1 통합 테스트

- [ ] **시나리오 A**: 샘플 MD 로드 → 설정 변경 → 프리뷰 즉시 반영
- [ ] **시나리오 B**: HTML 웹용 내보내기 → 브라우저에서 열어 확인
- [ ] **시나리오 C**: HTML HWP용 내보내기 → **한/글에서 열어 서식 확인** ← 중요
- [ ] **시나리오 D**: 파일 저장 → 다시 열기 → 내용 동일
- [ ] **시나리오 E**: 앱 닫고 재오픈 → 자동저장 내용 복원
- [ ] **시나리오 F**: 프리셋 3개 각각 적용 → 프리뷰 스타일 차이 확인
- [ ] **시나리오 G**: 서버 없이 HWPX 버튼 클릭 → 안내만, 앱 정상

---

## Stage 2 — Python 서버 추가 (목표: 3~4일)

---

### S2-1: Python 환경 + requirements.txt

- [ ] `requirements.txt`:
  ```
  fastapi>=0.110.0
  uvicorn[standard]>=0.29.0
  pypandoc-hwpx>=0.1.0
  python-multipart>=0.0.9
  ```
- [ ] `pip install -r requirements.txt`
- [ ] Pandoc 설치 확인: `pandoc --version`
- [ ] `templates/default.hwpx` 파일 준비 (실제 한글 문서 복사)
- [ ] pypandoc-hwpx 동작 확인:
  ```bash
  echo "# 테스트" > test.md
  pypandoc-hwpx test.md --reference-doc=templates/default.hwpx -o test.hwpx
  ```

---

### S2-2: FastAPI 기본 구조

- [ ] `server.py` 기본 구조 작성 (CLAUDE.md 참조)
- [ ] CORS 설정 (`allow_origins=["*"]`)
- [ ] `GET /api/health` → `{"status": "ok", "pandoc": true/false}`
- [ ] `python server.py` 실행 → `http://localhost:8000/docs` 확인
- [ ] 브라우저에서 index.html 열어 상태바 인디케이터 녹색 확인

---

### S2-3: 템플릿 API

- [ ] `GET /api/templates` → `{"templates": ["default.hwpx", ...]}`
- [ ] `POST /api/templates/upload` → .hwpx 파일 수신 → 저장
- [ ] `DELETE /api/templates/{filename}` → 삭제 (default.hwpx 보호)
- [ ] 브라우저 HWPX 템플릿 드롭다운 연동 확인

---

### S2-4: HWPX 변환 핵심 API

- [ ] `POST /api/convert/hwpx` 구현 (CLAUDE.md 코드 참조)
  - [ ] frontmatter metadata → `--metadata` 옵션 변환
  - [ ] 임시 파일 생성 → pypandoc-hwpx 실행 → 반환
  - [ ] Pandoc 미설치 에러 처리
  - [ ] 변환 실패 에러 처리 (stderr 포함)
  - [ ] 임시 파일 정리

- [ ] **변환 품질 테스트** (한/글에서 직접 열어 확인):
  - [ ] 제목 (h1~h3) 스타일 적용
  - [ ] 표 테두리 스타일
  - [ ] 목록 (ul, ol)
  - [ ] 굵게/기울임
  - [ ] frontmatter title/author 메타데이터 반영

---

### S2-5: 브라우저 ↔ 서버 통합 테스트

- [ ] **시나리오 H**: 서버 실행 → 템플릿 목록 자동 로드
- [ ] **시나리오 I**: YAML frontmatter 작성 → HWPX 변환 → 한/글에서 열기
  - [ ] 메타데이터(title, author) 반영 확인
  - [ ] 본문 서식 확인
- [ ] **시나리오 J**: 새 템플릿 업로드 → 선택 → 변환 → 스타일 차이 확인
- [ ] **시나리오 K**: 서버 실행 중 Stage 1 기능 모두 정상 동작 확인

---

## Stage 2 보너스

### S2-B1: 표지/목차 페이지

- [ ] 설정 패널에 "특수 페이지" 섹션 추가
  - [ ] ☐ 표지 페이지 (title, subtitle, author, date, organization)
  - [ ] ☐ 목차 페이지 (목차 깊이 설정)
- [ ] 서버에서 표지 HTML 앞에 삽입 후 변환

### S2-B2: 헤더/푸터

- [ ] 설정 패널에 헤더/푸터 섹션 추가
  - [ ] 좌/중/우 각각: 없음/제목/날짜/사용자지정
- [ ] 프리뷰에서 헤더/푸터 표시
- [ ] HTML 내보내기에 반영

### S2-B3: 변환 이력

- [ ] 최근 변환 파일 목록 (서버 측 JSON)
- [ ] 설정 패널 하단에 표시

---

## 완료 기준 (Definition of Done)

**Stage 1 완료**:
- `index.html`을 브라우저에서 열어 MD 작성 → 설정 패널 변경 → 프리뷰 즉시 반영
- HTML 웹용 내보내기 → 브라우저에서 예쁘게 보임
- HTML HWP용 내보내기 → **한/글에서 열었을 때 서식이 살아있음**

**Stage 2 완료**:
- `python server.py` 실행 후 HWPX 변환 버튼으로 `.hwpx` 생성
- 생성된 HWPX를 **한/글에서 열었을 때** frontmatter 정보 + 본문 서식 확인

---

## 알려진 한계

- HWPX 서식 보존은 Pandoc AST 수준 (장평, 자간 등 정밀 서식 미지원)
- File System Access API: Chrome/Edge 전용 (Firefox는 Blob 다운로드 폴백)
- HWP용 HTML: HWP 버전에 따라 CSS 인식률 차이 있음
- pypandoc-hwpx: 복잡한 표 셀 병합은 결과가 불확실할 수 있음
