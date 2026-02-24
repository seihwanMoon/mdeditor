# CLAUDE.md — MD-HWPX Studio v4.0 개발 가이드

> AI 코딩 어시스턴트가 코드를 생성하기 전 반드시 읽어야 할 파일.

---

## 프로젝트 한 줄 설명

**`textarea + A4 iframe 프리뷰` 방식의 로컬 Markdown 에디터. 설정 패널의 값이 프리뷰에 즉시 반영되고, HTML(웹/HWP용) · PDF · HWPX 4가지로 내보낸다.**

---

## 아키텍처 핵심 원칙 (절대 변경 금지)

### 원칙 1: 에디터는 textarea
- vditor, CodeMirror, Quill, TipTap 등 외부 에디터 라이브러리 사용 금지
- 순수 `<textarea>` + 수동 라인번호 + marked.js 파서
- 이유: A4 프리뷰 CSS를 100% 제어하려면 에디터와 프리뷰가 분리되어야 함

### 원칙 2: 프리뷰는 A4 iframe
- `<iframe srcDoc="...">` 방식으로 렌더링
- A4 크기 흉내: `width: 210mm; min-height: 297mm`
- 회색 배경에 흰 용지 모양
- 설정 패널 값 변경 → iframe 내부 CSS 변수 즉시 업데이트

### 원칙 3: Stage 분리
- **Stage 1** (`index.html`) — Python 없이 완전 동작
- **Stage 2** (`server.py`) — HWPX 변환 전용
- 서버 없어도 HTML/PDF 내보내기 100% 동작

### 원칙 4: HTML 내보내기 2종
- **HTML 웹용**: CSS 테마 포함, 브라우저 배포용
- **HTML HWP용**: 인라인 스타일만, HWP import 최적화
  - CSS class 금지, 외부 폰트 금지, 인라인 style만 사용

### 원칙 5: 설정 → 출력 일관성
- 설정 패널의 모든 값은 프리뷰 / HTML내보내기 / HWPX변환 에 동일하게 적용
- 설정값 → CSS 변수 → 프리뷰 (즉시)
- 설정값 → 인라인 스타일 → HTML 내보내기
- 설정값 → --metadata → pypandoc-hwpx

---

## 기술 스택

| 레이어 | 기술 | CDN/설치 |
|---|---|---|
| MD 에디터 | `<textarea>` | 없음 |
| MD 파서 | marked.js v14 | `cdn.jsdelivr.net/npm/marked/marked.min.js` |
| 코드 하이라이트 | highlight.js | `cdn.jsdelivr.net/npm/highlight.js` |
| 파일 I/O | File System Access API | 없음 |
| 자동저장 | localStorage | 없음 |
| 백엔드 | FastAPI | pip |
| HWPX 변환 | pypandoc-hwpx | pip |
| frontmatter | 직접 파싱 (regex) | 없음 |

**절대 쓰지 말 것**: vditor, CodeMirror, PySide6, Electron, PyInstaller

---

## 프로젝트 구조

```
md-hwpx-studio/
├── index.html      # 진입점 (브라우저에서 직접 열기)
├── style.css       # 앱 전체 레이아웃 + CSS 변수
├── app.js          # 앱 초기화, 상태 관리, 단축키
├── editor.js       # textarea 에디터 + 라인번호 + 찾기
├── preview.js      # marked.js 렌더링 + A4 iframe 주입
├── settings.js     # 설정 패널 UI + defaultSettings
├── export.js       # HTML(웹/HWP용) + PDF 내보내기
├── presets.js      # 프리셋 저장/불러오기 (localStorage)
├── server.py       # FastAPI HWPX 서버
├── templates/
│   └── default.hwpx
├── requirements.txt
└── README.md
```

---

## defaultSettings (전체 — 이게 진실의 원천)

```javascript
// settings.js에 정의
const defaultSettings = {
    fontFamily:        "nanum-gothic",
    customFontFamily:  "",
    fontSize:          10,           // pt
    lineHeight:        1.6,
    wordBreak:         "keep-all",
    textIndent:        "0",
    margin: {
        top:    "15mm",
        right:  "20mm",
        bottom: "15mm",
        left:   "20mm",
    },
    tableStyle:        "hwp",        // hwp | apa | minimal | none
    headingStyle:      "default",    // default | numbered-box | apa
    pageBreakBeforeH1: false,
    pageBreakBeforeH2: false,
    pageBreakBeforeH3: false,
    breaks:            true,
    highlight:         true,
    scale:             1,
};

const FONT_MAP = {
    "nanum-gothic":   "'NanumGothic', '나눔고딕', sans-serif",
    "nanum-myeongjo": "'NanumMyeongjo', '나눔명조', serif",
    "malgun":         "'Malgun Gothic', '맑은 고딕', sans-serif",
    "pretendard":     "'Pretendard', sans-serif",
    "custom":         null,  // customFontFamily 사용
};
```

---

## 핵심 코드 패턴

### A4 iframe 프리뷰 생성

```javascript
// preview.js
function buildIframeDoc(htmlContent, settings) {
    const fontCss = buildFontCss(settings);
    const tableCss = buildTableCss(settings.tableStyle);
    const headingCss = buildHeadingCss(settings.headingStyle);
    const pageBreakCss = buildPageBreakCss(settings);

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic&family=Nanum+Myeongjo&display=swap');

:root {
    --doc-font-family: ${getFontFamily(settings)};
    --doc-font-size: ${settings.fontSize}pt;
    --doc-line-height: ${settings.lineHeight};
    --doc-word-break: ${settings.wordBreak};
    --doc-text-indent: ${settings.textIndent};
    --margin-top: ${settings.margin.top};
    --margin-right: ${settings.margin.right};
    --margin-bottom: ${settings.margin.bottom};
    --margin-left: ${settings.margin.left};
}

body {
    font-family: var(--doc-font-family);
    font-size: var(--doc-font-size);
    line-height: var(--doc-line-height);
    word-break: var(--doc-word-break);
    text-indent: var(--doc-text-indent);
    padding: var(--margin-top) var(--margin-right) var(--margin-bottom) var(--margin-left);
    margin: 0;
    color: #000;
    background: #fff;
}

${tableCss}
${headingCss}
${pageBreakCss}

/* 코드 블록 */
pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
code { font-family: 'Consolas', monospace; font-size: 0.9em; }
pre code { background: none; padding: 0; }

/* 인용문 */
blockquote { border-left: 3px solid #ccc; margin: 0; padding-left: 16px; color: #555; }

@media print {
    body { padding: 0; margin: 0; }
}
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;
}

function updatePreview(markdown, settings) {
    const frontmatter = parseFrontmatter(markdown);
    const mdContent = stripFrontmatter(markdown);

    const html = marked.parse(mdContent, {
        breaks: settings.breaks,
        gfm: true,
    });

    const headerHtml = frontmatter
        ? buildFrontmatterHeader(frontmatter)
        : '';

    const iframe = document.getElementById('preview-iframe');
    iframe.srcdoc = buildIframeDoc(headerHtml + html, settings);
}
```

### 테이블 CSS 프리셋

```javascript
function buildTableCss(tableStyle) {
    const base = `
table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
th, td { padding: 4pt 8pt; }`;

    const styles = {
        hwp: `${base}
th, td { border: 1px solid #000; }
th { background: #f0f0f0; font-weight: bold; text-align: center; }`,

        apa: `${base}
table { border-top: 2px solid #000; border-bottom: 2px solid #000; }
th { border-bottom: 1px solid #000; font-weight: bold; }
td { border: none; }`,

        minimal: `${base}
table { border: 1px solid #ccc; }
th, td { border: none; }
th { background: #f9f9f9; }`,

        none: `${base}
th, td { border: none; }`,
    };
    return styles[tableStyle] || styles.hwp;
}
```

### 제목 스타일 CSS

```javascript
function buildHeadingCss(headingStyle) {
    const base = `
h1 { font-size: 1.6em; margin: 1em 0 0.5em; }
h2 { font-size: 1.3em; margin: 0.8em 0 0.4em; }
h3 { font-size: 1.1em; margin: 0.6em 0 0.3em; }
h4, h5, h6 { font-size: 1em; margin: 0.5em 0 0.25em; }`;

    const styles = {
        default: base,

        "numbered-box": `${base}
h1::before { content: counter(h1) ". "; counter-increment: h1; }
h2::before { content: counter(h1) "." counter(h2) " "; counter-increment: h2; }
h3::before { content: counter(h1) "." counter(h2) "." counter(h3) " "; counter-increment: h3; }
body { counter-reset: h1 h2 h3; }`,

        apa: `${base}
h1 { text-align: center; font-weight: bold; }
h2 { font-weight: bold; }
h3 { font-weight: bold; font-style: italic; }
h4 { font-weight: bold; display: inline; }`,
    };
    return styles[headingStyle] || styles.default;
}
```

### YAML frontmatter 파싱

```javascript
// 직접 파싱 (외부 라이브러리 없음)
function parseFrontmatter(markdown) {
    const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!match) return null;

    const result = {};
    match[1].split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) return;
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        if (key && val) result[key] = val;
    });
    return Object.keys(result).length ? result : null;
}

function stripFrontmatter(markdown) {
    return markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
}

function buildFrontmatterHeader(fm) {
    if (!fm) return '';
    return `
<div style="margin-bottom:24pt; padding-bottom:12pt; border-bottom:2px solid #000;">
    ${fm.title ? `<div style="font-size:1.8em; font-weight:bold; margin-bottom:4pt;">${fm.title}</div>` : ''}
    ${fm.subtitle ? `<div style="font-size:1.2em; color:#444; margin-bottom:8pt;">${fm.subtitle}</div>` : ''}
    <div style="font-size:0.9em; color:#666;">
        ${fm.organization ? `<span>${fm.organization}</span>` : ''}
        ${fm.author ? `<span style="margin-left:12pt;">${fm.author}</span>` : ''}
        ${fm.date ? `<span style="margin-left:12pt;">${fm.date}</span>` : ''}
    </div>
</div>`;
}
```

### HTML HWP용 내보내기 (인라인 스타일 변환)

```javascript
// export.js
function exportHTMLforHWP(markdown, settings) {
    const frontmatter = parseFrontmatter(markdown);
    const mdContent = stripFrontmatter(markdown);
    const html = marked.parse(mdContent);
    const fontFamily = getFontFamily(settings);

    // DOM 파싱 후 인라인 스타일 주입
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 모든 요소에 인라인 스타일 적용
    doc.querySelectorAll('h1').forEach(el =>
        el.setAttribute('style', `font-family:${fontFamily};font-size:16pt;font-weight:bold;margin-top:12pt;margin-bottom:6pt;`));
    doc.querySelectorAll('h2').forEach(el =>
        el.setAttribute('style', `font-family:${fontFamily};font-size:14pt;font-weight:bold;margin-top:10pt;margin-bottom:4pt;`));
    doc.querySelectorAll('h3').forEach(el =>
        el.setAttribute('style', `font-family:${fontFamily};font-size:12pt;font-weight:bold;margin-top:8pt;margin-bottom:4pt;`));
    doc.querySelectorAll('p').forEach(el =>
        el.setAttribute('style', `font-family:${fontFamily};font-size:${settings.fontSize}pt;line-height:${settings.lineHeight};margin:0 0 6pt;`));

    // 표: 인라인 border 주입
    const tableBorder = settings.tableStyle !== 'none' ? '1px solid #000' : 'none';
    doc.querySelectorAll('table').forEach(el =>
        el.setAttribute('style', 'border-collapse:collapse;width:100%;margin:8pt 0;'));
    doc.querySelectorAll('th').forEach(el =>
        el.setAttribute('style', `border:${tableBorder};padding:4pt 8pt;background:#f0f0f0;font-weight:bold;`));
    doc.querySelectorAll('td').forEach(el =>
        el.setAttribute('style', `border:${tableBorder};padding:4pt 8pt;`));

    // class 속성 모두 제거
    doc.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));

    const bodyStyle = [
        `font-family:${fontFamily}`,
        `font-size:${settings.fontSize}pt`,
        `line-height:${settings.lineHeight}`,
        `word-break:${settings.wordBreak}`,
        `margin:${settings.margin.top} ${settings.margin.right} ${settings.margin.bottom} ${settings.margin.left}`,
    ].join(';');

    const fmHtml = frontmatter ? buildFrontmatterHWP(frontmatter, fontFamily) : '';

    const fullDoc = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="${bodyStyle}">
${fmHtml}
${doc.body.innerHTML}
</body>
</html>`;

    downloadBlob(
        new Blob([fullDoc], { type: 'text/html;charset=utf-8' }),
        getFilename().replace('.md', '') + '_hwp.html'
    );
}

function buildFrontmatterHWP(fm, fontFamily) {
    return `
<table style="border-collapse:collapse;width:100%;margin-bottom:16pt;">
    ${fm.title ? `<tr><td colspan="2" style="border:none;font-size:16pt;font-weight:bold;font-family:${fontFamily};padding:4pt 0;">${fm.title}</td></tr>` : ''}
    ${fm.subtitle ? `<tr><td colspan="2" style="border:none;font-size:12pt;font-family:${fontFamily};padding:2pt 0;">${fm.subtitle}</td></tr>` : ''}
    <tr><td style="border:none;font-family:${fontFamily};width:50%;">${fm.organization || ''}</td>
        <td style="border:none;font-family:${fontFamily};text-align:right;">${fm.author || ''}&nbsp;&nbsp;${fm.date || ''}</td></tr>
</table>
<hr style="border:1px solid #000;margin-bottom:12pt;">`;
}
```

### 서버 상태 폴링

```javascript
// app.js
let serverOnline = false;

async function checkServer() {
    try {
        const res = await fetch('http://localhost:8000/api/health', {
            signal: AbortSignal.timeout(2000)
        });
        const data = await res.json();
        setServerStatus(res.ok, data.pandoc);
    } catch {
        setServerStatus(false, false);
    }
}

function setServerStatus(online, pandocOk) {
    serverOnline = online;
    const dot = document.getElementById('server-dot');
    const label = document.getElementById('server-label');
    const hwpxBtn = document.getElementById('btn-hwpx');

    if (online && pandocOk) {
        dot.className = 'status-dot online';
        label.textContent = '서버 연결됨';
        hwpxBtn.disabled = false;
        loadTemplates();
    } else if (online && !pandocOk) {
        dot.className = 'status-dot warn';
        label.textContent = 'Pandoc 없음';
        hwpxBtn.disabled = true;
    } else {
        dot.className = 'status-dot offline';
        label.textContent = '서버 없음';
        hwpxBtn.disabled = true;
    }
}

checkServer();
setInterval(checkServer, 5000);
```

### HWPX 변환 요청 (frontmatter 포함)

```javascript
// export.js
async function exportHWPX(markdown, settings) {
    if (!serverOnline) {
        showToast('서버를 먼저 실행하세요: python server.py', 'warn');
        return;
    }

    const frontmatter = parseFrontmatter(markdown) || {};
    const mdContent = stripFrontmatter(markdown);
    const template = document.getElementById('template-select').value || 'default.hwpx';

    showLoading('HWPX 변환 중...');
    try {
        const res = await fetch('http://localhost:8000/api/convert/hwpx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                md_content: mdContent,
                template,
                filename: getFilename().replace('.md', '') || 'document',
                metadata: {
                    title:        frontmatter.title || '',
                    subtitle:     frontmatter.subtitle || '',
                    author:       frontmatter.author || '',
                    date:         frontmatter.date || '',
                    organization: frontmatter.organization || '',
                }
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `HTTP ${res.status}`);
        }
        downloadBlob(await res.blob(), getFilename().replace('.md', '') + '.hwpx');
        showToast('HWPX 저장 완료', 'success');
    } catch (e) {
        showToast(`변환 실패: ${e.message}`, 'error');
    } finally {
        hideLoading();
    }
}
```

### FastAPI 서버 핵심 (server.py)

```python
class ConvertRequest(BaseModel):
    md_content: str
    template:   str = "default.hwpx"
    filename:   str = "document"
    metadata:   dict = {}

@app.post("/api/convert/hwpx")
def convert_hwpx(req: ConvertRequest):
    template_path = TEMPLATES_DIR / req.template
    if not template_path.exists():
        raise HTTPException(404, f"템플릿 없음: {req.template}")

    safe_name = Path(req.filename).name or "document"

    # metadata → pandoc --metadata 옵션 조립
    meta_args = []
    for key, val in req.metadata.items():
        if val:
            meta_args += [f"--metadata={key}:{val}"]

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        md_file  = tmp / "input.md"
        out_file = tmp / f"{safe_name}.hwpx"
        md_file.write_text(req.md_content, encoding="utf-8")

        cmd = [
            "pypandoc-hwpx", str(md_file),
            f"--reference-doc={template_path}",
            "-o", str(out_file),
        ] + meta_args

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            raise HTTPException(500, f"변환 실패: {result.stderr}")

        dest = Path(tempfile.gettempdir()) / f"mhs_{safe_name}.hwpx"
        shutil.copy2(out_file, dest)

    return FileResponse(str(dest), filename=f"{safe_name}.hwpx",
                        media_type="application/octet-stream")
```

---

## CSS 변수 체계

```css
/* style.css — 라이트/다크 공통 구조 */
:root {
    /* 앱 UI 색상 */
    --wp-titlebar:     #1e3a5f;
    --wp-chrome:       #f0f0f0;
    --wp-chrome-dark:  #e0e0e0;
    --wp-bg:           #d0d0d0;   /* 프리뷰 배경 (회색) */
    --wp-border:       #ccc;
    --wp-border-light: #e0e0e0;
    --wp-text:         #222;
    --wp-text-dim:     #888;
    --wp-text-muted:   #aaa;
    --wp-accent:       #2563eb;
    --wp-editor-bg:    #fff;
    --wp-editor-gutter:#f5f5f5;
    --wp-input-bg:     #fff;
    --wp-input-border: #ddd;
    --wp-input-focus:  #2563eb;
    --wp-paper-shadow: rgba(0,0,0,0.15);

    /* 문서 설정값 (settings.js가 업데이트) */
    --doc-font-family: 'NanumGothic', sans-serif;
    --doc-font-size:   10pt;
    --doc-line-height: 1.6;
}

[data-theme="dark"] {
    --wp-titlebar:     #0f1923;
    --wp-chrome:       #1e2530;
    --wp-chrome-dark:  #161c26;
    --wp-bg:           #0d1117;
    --wp-border:       #30363d;
    --wp-border-light: #21262d;
    --wp-text:         #e6edf3;
    --wp-text-dim:     #8b949e;
    --wp-text-muted:   #6e7681;
    --wp-editor-bg:    #0d1117;
    --wp-editor-gutter:#161b22;
    --wp-input-bg:     #21262d;
    --wp-input-border: #30363d;
}
```

---

## 금지 패턴

| 실수 | 올바른 방법 |
|---|---|
| vditor 또는 외부 에디터 사용 | `<textarea>` 직접 사용 |
| iframe 없이 div 프리뷰 | 반드시 `<iframe srcDoc>` |
| HWP용 HTML에 CSS class | 인라인 style만 |
| HWP용 HTML에 외부 폰트 | 로컬 폰트명만 (나눔고딕 등) |
| 설정값 무시하고 하드코딩 | 항상 defaultSettings에서 읽기 |
| fetch timeout 미설정 | `AbortSignal.timeout(2000)` 필수 |
| 서버 오류 시 앱 전체 중단 | try-catch + 토스트 안내만 |
| frontmatter를 MD 본문에 포함 | 반드시 strip 후 변환 |

---

## 실행 방법

```bash
# Stage 1: Python 불필요
# index.html을 Chrome/Edge에서 열기

# Stage 2: HWPX 변환 추가
pip install -r requirements.txt
# Pandoc 설치: https://pandoc.org/installing.html
python server.py  # → localhost:8000
```
