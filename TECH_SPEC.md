# TECH_SPEC.md v4.0 — MD-HWPX Studio 기술 명세

> 바이브코딩 시 복붙 가능한 전체 구현 코드.

---

## 1. `index.html` 전체

```html
<!DOCTYPE html>
<html lang="ko" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MD-HWPX Studio</title>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <!-- highlight.js -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11/styles/github.min.css">
  <script src="https://cdn.jsdelivr.net/npm/highlight.js@11/lib/highlight.min.js"></script>

  <!-- marked.js -->
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

  <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- 타이틀바 -->
<header id="titlebar">
  <div class="titlebar-left">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#2B7CD0"/>
      <text x="12" y="17" text-anchor="middle" font-size="13"
            font-weight="bold" fill="white" font-family="serif">ㅎ</text>
    </svg>
    <span class="app-name">MD-HWPX Studio</span>
    <span class="app-sub">마크다운을 진짜 한글 문서로</span>
  </div>
  <div class="titlebar-right">
    <button id="btn-theme" title="다크/라이트 전환">🌙</button>
  </div>
</header>

<!-- 툴바 -->
<div id="toolbar">
  <!-- 파일 그룹 -->
  <div class="tb-group" data-group="file">
    <button class="tb-btn" id="btn-new"  title="새 문서">
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
      <span>새 문서</span>
    </button>
    <button class="tb-btn" id="btn-open" title="열기 (Ctrl+O)">
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><polyline points="8,13 12,9 16,13"/><line x1="12" y1="9" x2="12" y2="17"/></svg>
      <span>열기</span>
    </button>
    <button class="tb-btn" id="btn-save" title="저장 (Ctrl+S)">
      <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
      <span>저장</span>
    </button>
  </div>

  <div class="tb-sep"></div>

  <!-- 내보내기 그룹 -->
  <div class="tb-group" data-group="export">
    <button class="tb-btn" id="btn-html-web" title="HTML 웹용 내보내기 (Ctrl+Shift+H)">
      <svg viewBox="0 0 24 24"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>
      <span>HTML 웹</span>
    </button>
    <button class="tb-btn" id="btn-html-hwp" title="HTML 한글용 내보내기 (Ctrl+Shift+K)">
      <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 7h10M7 12h10M7 17h6"/></svg>
      <span>HTML 한글</span>
    </button>
    <button class="tb-btn" id="btn-pdf" title="PDF 인쇄 (Ctrl+P)">
      <svg viewBox="0 0 24 24"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      <span>PDF</span>
    </button>
    <button class="tb-btn tb-btn-accent" id="btn-hwpx" title="HWPX 변환 (Ctrl+Shift+W)" disabled>
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
      <span>HWPX</span>
    </button>
  </div>

  <div class="tb-sep"></div>

  <!-- 삽입 그룹 -->
  <div class="tb-group" data-group="insert">
    <button class="tb-btn" id="btn-insert-table" title="표 삽입">
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
      <span>표</span>
    </button>
    <button class="tb-btn" id="btn-insert-img" title="이미지">
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
      <span>이미지</span>
    </button>
  </div>

  <div class="tb-sep"></div>

  <!-- 뷰 모드 그룹 -->
  <div class="tb-group tb-view-group" data-group="view">
    <button class="tb-btn tb-view" id="btn-view-edit"    data-view="edit"    title="편집 (Ctrl+1)"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span>편집</span></button>
    <button class="tb-btn tb-view active" id="btn-view-split" data-view="split" title="분할 (Ctrl+2)"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg><span>분할</span></button>
    <button class="tb-btn tb-view" id="btn-view-preview" data-view="preview" title="미리보기 (Ctrl+3)"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><span>미리보기</span></button>
  </div>

  <div class="tb-sep"></div>

  <!-- 기타 -->
  <div class="tb-group" data-group="misc">
    <button class="tb-btn" id="btn-presets" title="프리셋">
      <svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      <span>프리셋</span>
    </button>
  </div>
</div>

<!-- 워크스페이스 -->
<div id="workspace">

  <!-- 에디터 패널 -->
  <div id="editor-panel" class="panel">
    <!-- 찾기 바 (숨김) -->
    <div id="find-bar" class="hidden">
      <input id="find-input" type="text" placeholder="찾기...">
      <span id="find-count">0/0</span>
      <button id="find-prev" title="이전 (Shift+Enter)">↑</button>
      <button id="find-next" title="다음 (Enter)">↓</button>
      <button id="find-close" title="닫기 (Esc)">✕</button>
    </div>
    <div id="editor-inner">
      <div id="line-numbers"></div>
      <textarea id="editor" spellcheck="false"></textarea>
    </div>
  </div>

  <!-- 미리보기 패널 -->
  <div id="preview-panel" class="panel">
    <div id="preview-bg">
      <iframe id="preview-iframe" sandbox="allow-same-origin" title="문서 미리보기"></iframe>
    </div>
  </div>

  <!-- 설정 패널 -->
  <aside id="settings-panel">
    <div id="settings-header">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      <span>문서 설정</span>
    </div>
    <div id="settings-body">

      <!-- 글꼴 -->
      <div class="s-section open" data-section="font">
        <div class="s-section-head"><span class="s-icon">T</span>글꼴<span class="s-arrow">▾</span></div>
        <div class="s-section-body">
          <label class="s-label">폰트
            <select id="s-fontFamily">
              <option value="nanum-gothic">나눔고딕</option>
              <option value="nanum-myeongjo">나눔명조</option>
              <option value="malgun">맑은 고딕</option>
              <option value="pretendard">Pretendard</option>
              <option value="custom">사용자 지정</option>
            </select>
          </label>
          <div id="s-customFont-wrap" class="hidden">
            <label class="s-label">CSS font-family
              <input id="s-customFontFamily" type="text" placeholder="'Arial', sans-serif">
            </label>
          </div>
          <div class="s-row2">
            <label class="s-label">크기
              <div class="s-input-unit"><input id="s-fontSize" type="number" value="10" step="0.5" min="6"><span>pt</span></div>
            </label>
            <label class="s-label">줄 간격
              <input id="s-lineHeight" type="number" value="1.6" step="0.1" min="1">
            </label>
          </div>
          <label class="s-label">줄바꿈
            <select id="s-wordBreak">
              <option value="keep-all">단어 단위 (keep-all)</option>
              <option value="break-all">글자 단위 (break-all)</option>
              <option value="normal">기본 (normal)</option>
            </select>
          </label>
          <label class="s-label">들여쓰기
            <input id="s-textIndent" type="text" value="0" placeholder="0">
          </label>
        </div>
      </div>

      <!-- 여백 -->
      <div class="s-section open" data-section="margin">
        <div class="s-section-head"><span class="s-icon">▦</span>여백<span class="s-arrow">▾</span></div>
        <div class="s-section-body">
          <div class="s-row2">
            <label class="s-label">상단<input id="s-margin-top"    type="text" value="15mm"></label>
            <label class="s-label">하단<input id="s-margin-bottom" type="text" value="15mm"></label>
            <label class="s-label">좌측<input id="s-margin-left"   type="text" value="20mm"></label>
            <label class="s-label">우측<input id="s-margin-right"  type="text" value="20mm"></label>
          </div>
        </div>
      </div>

      <!-- 표 스타일 -->
      <div class="s-section open" data-section="table">
        <div class="s-section-head"><span class="s-icon">⊞</span>표 스타일<span class="s-arrow">▾</span></div>
        <div class="s-section-body">
          <label class="s-label">테두리 스타일
            <select id="s-tableStyle">
              <option value="hwp">관공서 (HWP)</option>
              <option value="apa">APA</option>
              <option value="minimal">최소</option>
              <option value="none">없음</option>
            </select>
          </label>
        </div>
      </div>

      <!-- 제목 스타일 -->
      <div class="s-section open" data-section="heading">
        <div class="s-section-head"><span class="s-icon">H</span>제목 스타일<span class="s-arrow">▾</span></div>
        <div class="s-section-body">
          <label class="s-label">스타일
            <select id="s-headingStyle">
              <option value="default">기본</option>
              <option value="numbered-box">번호 박스</option>
              <option value="apa">APA 7th Edition</option>
            </select>
          </label>
        </div>
      </div>

      <!-- 페이지 나누기 -->
      <div class="s-section open" data-section="pagebreak">
        <div class="s-section-head"><span class="s-icon">⏤</span>페이지 나누기<span class="s-arrow">▾</span></div>
        <div class="s-section-body">
          <label class="s-check"><input id="s-pbH1" type="checkbox"><span>H1 앞에서 나누기</span></label>
          <label class="s-check"><input id="s-pbH2" type="checkbox"><span>H2 앞에서 나누기</span></label>
          <label class="s-check"><input id="s-pbH3" type="checkbox"><span>H3 앞에서 나누기</span></label>
        </div>
      </div>

      <hr class="s-hr">

      <!-- HWPX 템플릿 -->
      <div class="s-section open" data-section="hwpx">
        <div class="s-section-head"><span class="s-icon">📋</span>HWPX 템플릿<span class="s-arrow">▾</span></div>
        <div class="s-section-body">
          <label class="s-label">템플릿
            <select id="template-select" disabled>
              <option value="">서버 미연결</option>
            </select>
          </label>
          <button id="btn-hwpx-convert" class="s-btn s-btn-primary" disabled>HWPX 변환</button>
          <p class="s-hint">서버 필요: <code>python server.py</code></p>
        </div>
      </div>

      <hr class="s-hr">

      <!-- 프리셋 -->
      <div class="s-section open" data-section="presets">
        <div class="s-section-head"><span class="s-icon">💾</span>프리셋<span class="s-arrow">▾</span></div>
        <div class="s-section-body">
          <button id="btn-save-preset" class="s-btn">현재 설정 저장</button>
          <div id="preset-list"></div>
        </div>
      </div>

    </div><!-- /settings-body -->
  </aside>

</div><!-- /workspace -->

<!-- 상태바 -->
<footer id="statusbar">
  <div class="status-left">
    <span id="stat-pos">줄 1, 열 1</span>
    <span id="stat-lines">1줄</span>
    <span id="stat-chars">0자</span>
    <span>Markdown</span>
  </div>
  <div class="status-right">
    <span id="server-dot" class="status-dot offline"></span>
    <span id="server-label">서버 없음</span>
  </div>
</footer>

<!-- 토스트 컨테이너 -->
<div id="toast-container"></div>

<!-- 파일 입력 폴백 -->
<input type="file" id="file-input" accept=".md,.markdown,.txt" style="display:none">

<!-- JS 모듈 로드 -->
<script src="settings.js"></script>
<script src="editor.js"></script>
<script src="preview.js"></script>
<script src="export.js"></script>
<script src="presets.js"></script>
<script src="app.js"></script>
</body>
</html>
```

---

## 2. `style.css` 전체

```css
/* ── 리셋 ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
button { cursor: pointer; border: none; background: none; font-family: inherit; }
select, input { font-family: inherit; }

/* ── CSS 변수: 라이트 ── */
:root {
  --wp-titlebar:      #1e3a5f;
  --wp-chrome:        #f0f0f0;
  --wp-chrome-dark:   #e0e0e0;
  --wp-bg:            #c8c8c8;
  --wp-border:        #ccc;
  --wp-border-light:  #e0e0e0;
  --wp-text:          #222;
  --wp-text-dim:      #777;
  --wp-text-muted:    #aaa;
  --wp-accent:        #2563eb;
  --wp-accent-light:  #dbeafe;
  --wp-editor-bg:     #ffffff;
  --wp-editor-gutter: #f5f5f5;
  --wp-input-bg:      #ffffff;
  --wp-input-border:  #ddd;
  --wp-input-focus:   #2563eb;
  --wp-paper-shadow:  rgba(0,0,0,0.18);
  --wp-success:       #22c55e;
  --wp-warn:          #f59e0b;
  --wp-error:         #ef4444;
}
[data-theme="dark"] {
  --wp-titlebar:      #0a0f1a;
  --wp-chrome:        #1a1f2e;
  --wp-chrome-dark:   #12161f;
  --wp-bg:            #0d1117;
  --wp-border:        #30363d;
  --wp-border-light:  #21262d;
  --wp-text:          #e6edf3;
  --wp-text-dim:      #8b949e;
  --wp-text-muted:    #6e7681;
  --wp-accent:        #58a6ff;
  --wp-accent-light:  #1f3a5f;
  --wp-editor-bg:     #0d1117;
  --wp-editor-gutter: #161b22;
  --wp-input-bg:      #21262d;
  --wp-input-border:  #30363d;
  --wp-input-focus:   #58a6ff;
  --wp-paper-shadow:  rgba(0,0,0,0.5);
}

/* ── 앱 전체 구조 ── */
html, body { height: 100%; overflow: hidden; background: var(--wp-bg); }
body { display: flex; flex-direction: column; font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; font-size: 13px; color: var(--wp-text); }

/* ── 타이틀바 ── */
#titlebar {
  display: flex; align-items: center; justify-content: space-between;
  height: 36px; padding: 0 12px; flex-shrink: 0;
  background: var(--wp-titlebar); color: #fff;
  user-select: none;
}
.titlebar-left { display: flex; align-items: center; gap: 8px; }
.app-name { font-size: 13px; font-weight: 600; }
.app-sub  { font-size: 11px; opacity: 0.5; margin-left: 4px; }
#btn-theme { color: #fff; opacity: 0.7; font-size: 14px; padding: 4px 8px; border-radius: 4px; transition: opacity 0.15s; }
#btn-theme:hover { opacity: 1; }

/* ── 툴바 ── */
#toolbar {
  display: flex; align-items: center; gap: 0;
  height: 48px; padding: 0 6px; flex-shrink: 0;
  background: var(--wp-chrome); border-bottom: 1px solid var(--wp-border);
  overflow-x: auto;
}
.tb-group { display: flex; align-items: center; gap: 0; }
.tb-sep { width: 1px; height: 28px; background: var(--wp-border); margin: 0 4px; flex-shrink: 0; }
.tb-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; padding: 4px 8px; min-width: 44px;
  border-radius: 4px; font-size: 11px; color: var(--wp-text-dim);
  transition: background 0.12s, color 0.12s;
}
.tb-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.tb-btn:hover { background: var(--wp-chrome-dark); color: var(--wp-text); }
.tb-btn.active { background: var(--wp-accent-light); color: var(--wp-accent); }
.tb-btn-accent { color: var(--wp-accent); }
.tb-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.tb-view-group { border: 1px solid var(--wp-border); border-radius: 5px; overflow: hidden; margin: 0 2px; }
.tb-view-group .tb-btn { border-radius: 0; border-right: 1px solid var(--wp-border); }
.tb-view-group .tb-btn:last-child { border-right: none; }

/* ── 워크스페이스 ── */
#workspace { display: flex; flex: 1; overflow: hidden; min-height: 0; }

/* ── 에디터 패널 ── */
#editor-panel { display: flex; flex-direction: column; flex: 1; min-width: 0; border-right: 1px solid var(--wp-border); }
#find-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; background: var(--wp-chrome);
  border-bottom: 1px solid var(--wp-border-light); flex-shrink: 0;
}
#find-bar.hidden { display: none; }
#find-input {
  flex: 1; max-width: 240px; padding: 4px 8px; font-size: 12px;
  background: var(--wp-input-bg); border: 1px solid var(--wp-input-border);
  border-radius: 4px; color: var(--wp-text); outline: none;
  font-family: 'JetBrains Mono', monospace;
}
#find-input:focus { border-color: var(--wp-input-focus); }
#find-count { font-size: 11px; color: var(--wp-text-muted); min-width: 36px; }
#find-bar button { padding: 3px 8px; font-size: 12px; color: var(--wp-text-dim); border-radius: 3px; }
#find-bar button:hover { background: var(--wp-chrome-dark); color: var(--wp-text); }

#editor-inner { display: flex; flex: 1; overflow: hidden; min-height: 0; }
#line-numbers {
  width: 44px; flex-shrink: 0; overflow: hidden;
  background: var(--wp-editor-gutter); border-right: 1px solid var(--wp-border-light);
  font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 20px;
  color: var(--wp-text-muted); text-align: right;
  padding: 16px 8px 16px 0; user-select: none;
}
#line-numbers div { line-height: 20px; }
#line-numbers div.active { color: var(--wp-accent); font-weight: 500; }
#editor {
  flex: 1; resize: none; border: none; outline: none;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12.5px; line-height: 20px;
  padding: 16px 16px 16px 10px;
  background: var(--wp-editor-bg); color: var(--wp-text);
  tab-size: 2; caret-color: var(--wp-accent);
  overflow-y: auto; white-space: pre;
}

/* ── 미리보기 패널 ── */
#preview-panel { flex: 1; min-width: 0; overflow: hidden; }
#preview-bg {
  width: 100%; height: 100%; overflow: auto;
  background: var(--wp-bg); display: flex;
  justify-content: center; padding: 24px 16px;
}
#preview-iframe {
  width: 210mm; min-height: 297mm; flex-shrink: 0;
  border: none; display: block; background: #fff;
  box-shadow: 0 2px 16px var(--wp-paper-shadow);
}

/* ── 설정 패널 ── */
#settings-panel {
  width: 240px; flex-shrink: 0; display: flex; flex-direction: column;
  border-left: 1px solid var(--wp-border); background: var(--wp-chrome);
  overflow: hidden;
}
#settings-header {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px; font-size: 12px; font-weight: 600;
  color: var(--wp-text-dim); border-bottom: 1px solid var(--wp-border);
  flex-shrink: 0;
}
#settings-body { flex: 1; overflow-y: auto; padding-bottom: 16px; }

/* 설정 섹션 */
.s-section { border-bottom: 1px solid var(--wp-border-light); }
.s-section-head {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; font-size: 11px; font-weight: 600;
  color: var(--wp-text-dim); cursor: pointer; user-select: none;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.s-section-head:hover { color: var(--wp-text); }
.s-icon { font-size: 11px; width: 14px; text-align: center; }
.s-arrow { margin-left: auto; font-size: 10px; transition: transform 0.15s; }
.s-section:not(.open) .s-arrow { transform: rotate(-90deg); }
.s-section-body { padding: 0 12px 10px; display: flex; flex-direction: column; gap: 7px; }
.s-section:not(.open) .s-section-body { display: none; }
.s-label { display: flex; flex-direction: column; gap: 3px; font-size: 11px; color: var(--wp-text-muted); font-weight: 500; }
.s-label select, .s-label input[type="text"], .s-label input[type="number"] {
  padding: 5px 7px; font-size: 12px; border-radius: 4px;
  border: 1px solid var(--wp-input-border); background: var(--wp-input-bg);
  color: var(--wp-text); outline: none; transition: border-color 0.15s;
}
.s-label select:focus, .s-label input:focus { border-color: var(--wp-input-focus); }
.s-label select:disabled { opacity: 0.5; cursor: not-allowed; }
.s-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.s-input-unit { display: flex; align-items: center; gap: 4px; }
.s-input-unit input { flex: 1; }
.s-input-unit span { font-size: 11px; color: var(--wp-text-muted); }
.s-check { display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; color: var(--wp-text); }
.s-check input[type="checkbox"] { accent-color: var(--wp-accent); }
.s-hr { border: none; border-top: 1px solid var(--wp-border); margin: 4px 0; }
.s-btn {
  width: 100%; padding: 7px; font-size: 12px; border-radius: 4px;
  background: var(--wp-chrome-dark); color: var(--wp-text);
  border: 1px solid var(--wp-border); transition: background 0.12s;
}
.s-btn:hover { background: var(--wp-border); }
.s-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.s-btn-primary { background: var(--wp-accent); color: #fff; border-color: transparent; }
.s-btn-primary:hover { filter: brightness(1.1); }
.s-hint { font-size: 10px; color: var(--wp-text-muted); line-height: 1.4; }
.s-hint code { background: var(--wp-chrome-dark); padding: 1px 4px; border-radius: 3px; }

/* 프리셋 목록 */
#preset-list { display: flex; flex-direction: column; gap: 2px; margin-top: 6px; }
.preset-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 5px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;
  transition: background 0.1s;
}
.preset-item:hover { background: var(--wp-chrome-dark); }
.preset-item.active { background: var(--wp-accent-light); color: var(--wp-accent); font-weight: 500; }
.preset-del { font-size: 11px; color: var(--wp-text-muted); opacity: 0; transition: opacity 0.1s; }
.preset-item:hover .preset-del { opacity: 1; }
.preset-built-in { font-size: 10px; color: var(--wp-text-muted); padding: 2px 8px; }

/* ── 상태바 ── */
#statusbar {
  display: flex; align-items: center; justify-content: space-between;
  height: 24px; padding: 0 12px; flex-shrink: 0;
  background: var(--wp-accent); color: rgba(255,255,255,0.85);
  font-size: 11px;
}
.status-left, .status-right { display: flex; align-items: center; gap: 12px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.status-dot.online  { background: #4ade80; box-shadow: 0 0 4px #4ade80; }
.status-dot.warn    { background: #fbbf24; }
.status-dot.offline { background: rgba(255,255,255,0.3); }

/* ── 토스트 ── */
#toast-container { position: fixed; bottom: 32px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 9999; }
.toast {
  padding: 10px 16px; border-radius: 6px; font-size: 12px; color: #fff;
  min-width: 200px; max-width: 320px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  animation: toastIn 0.2s ease;
}
.toast-info    { background: #3b82f6; }
.toast-success { background: #22c55e; }
.toast-warn    { background: #f59e0b; color: #000; }
.toast-error   { background: #ef4444; }
@keyframes toastIn { from { transform: translateX(110%); opacity: 0; } to { transform: none; opacity: 1; } }

/* ── 뷰 모드 ── */
body.view-edit    #preview-panel  { display: none; }
body.view-edit    #editor-panel   { flex: 1; }
body.view-preview #editor-panel   { display: none; }
body.view-preview #preview-panel  { flex: 1; }
body.view-split   #editor-panel,
body.view-split   #preview-panel  { flex: 1; }

/* ── 유틸 ── */
.hidden { display: none !important; }
```

---

## 3. `settings.js` 전체

```javascript
// ── defaultSettings ──────────────────────────────────────────
const defaultSettings = {
    fontFamily:        'nanum-gothic',
    customFontFamily:  '',
    fontSize:          10,
    lineHeight:        1.6,
    wordBreak:         'keep-all',
    textIndent:        '0',
    margin:            { top:'15mm', right:'20mm', bottom:'15mm', left:'20mm' },
    tableStyle:        'hwp',
    headingStyle:      'default',
    pageBreakBeforeH1: false,
    pageBreakBeforeH2: false,
    pageBreakBeforeH3: false,
    breaks:            true,
    highlight:         true,
    scale:             1,
};

const FONT_MAP = {
    'nanum-gothic':   "'NanumGothic','나눔고딕',sans-serif",
    'nanum-myeongjo': "'NanumMyeongjo','나눔명조',serif",
    'malgun':         "'Malgun Gothic','맑은 고딕',sans-serif",
    'pretendard':     "'Pretendard',sans-serif",
    'custom':         null,
};

let currentSettings = JSON.parse(JSON.stringify(defaultSettings));

function getFontFamily(s) {
    if (s.fontFamily === 'custom') return s.customFontFamily || 'sans-serif';
    return FONT_MAP[s.fontFamily] || FONT_MAP['nanum-gothic'];
}

// ── UI → Settings 바인딩 ──────────────────────────────────────
function initSettingsPanel() {
    const bind = (id, key, transform) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            const val = transform ? transform(el) : el.value;
            setNestedKey(currentSettings, key, val);
            if (typeof updatePreview === 'function') updatePreview();
        });
    };

    bind('s-fontFamily',     'fontFamily');
    bind('s-customFontFamily','customFontFamily');
    bind('s-fontSize',       'fontSize',    el => parseFloat(el.value) || 10);
    bind('s-lineHeight',     'lineHeight',  el => parseFloat(el.value) || 1.6);
    bind('s-wordBreak',      'wordBreak');
    bind('s-textIndent',     'textIndent');
    bind('s-margin-top',     'margin.top');
    bind('s-margin-bottom',  'margin.bottom');
    bind('s-margin-left',    'margin.left');
    bind('s-margin-right',   'margin.right');
    bind('s-tableStyle',     'tableStyle');
    bind('s-headingStyle',   'headingStyle');
    bind('s-pbH1',           'pageBreakBeforeH1', el => el.checked);
    bind('s-pbH2',           'pageBreakBeforeH2', el => el.checked);
    bind('s-pbH3',           'pageBreakBeforeH3', el => el.checked);

    // 사용자 지정 폰트 필드 토글
    document.getElementById('s-fontFamily').addEventListener('change', e => {
        document.getElementById('s-customFont-wrap').classList.toggle('hidden', e.target.value !== 'custom');
    });

    // 섹션 접기/펼치기
    document.querySelectorAll('.s-section-head').forEach(head => {
        head.addEventListener('click', () => {
            head.closest('.s-section').classList.toggle('open');
        });
    });
}

function applySettingsToUI(s) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

    set('s-fontFamily',      s.fontFamily);
    set('s-customFontFamily',s.customFontFamily);
    set('s-fontSize',        s.fontSize);
    set('s-lineHeight',      s.lineHeight);
    set('s-wordBreak',       s.wordBreak);
    set('s-textIndent',      s.textIndent);
    set('s-margin-top',      s.margin.top);
    set('s-margin-bottom',   s.margin.bottom);
    set('s-margin-left',     s.margin.left);
    set('s-margin-right',    s.margin.right);
    set('s-tableStyle',      s.tableStyle);
    set('s-headingStyle',    s.headingStyle);
    setChk('s-pbH1',         s.pageBreakBeforeH1);
    setChk('s-pbH2',         s.pageBreakBeforeH2);
    setChk('s-pbH3',         s.pageBreakBeforeH3);

    document.getElementById('s-customFont-wrap')
            .classList.toggle('hidden', s.fontFamily !== 'custom');
}

function setNestedKey(obj, path, val) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    cur[keys[keys.length - 1]] = val;
}
```

---

## 4. `preview.js` 전체

```javascript
// ── marked.js 초기화 ──────────────────────────────────────────
marked.setOptions({ breaks: true, gfm: true });

// ── frontmatter 파싱 ─────────────────────────────────────────
function parseFrontmatter(md) {
    const m = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!m) return null;
    const obj = {};
    m[1].split('\n').forEach(line => {
        const i = line.indexOf(':');
        if (i < 0) return;
        const k = line.slice(0, i).trim();
        const v = line.slice(i + 1).trim();
        if (k && v) obj[k] = v;
    });
    return Object.keys(obj).length ? obj : null;
}

function stripFrontmatter(md) {
    return md.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
}

// ── frontmatter → 프리뷰 헤더 HTML ──────────────────────────
function buildFrontmatterHeader(fm) {
    if (!fm) return '';
    return `<div class="doc-meta">
        ${fm.title ? `<div class="doc-title">${esc(fm.title)}</div>` : ''}
        ${fm.subtitle ? `<div class="doc-subtitle">${esc(fm.subtitle)}</div>` : ''}
        <div class="doc-info">
            ${fm.organization ? `<span>${esc(fm.organization)}</span>` : ''}
            ${fm.author ? `<span>${esc(fm.author)}</span>` : ''}
            ${fm.date ? `<span>${esc(fm.date)}</span>` : ''}
        </div>
    </div>`;
}

// ── CSS 빌더 ─────────────────────────────────────────────────
function buildTableCss(style) {
    const base = 'table{border-collapse:collapse;width:100%;margin:8pt 0}th,td{padding:4pt 8pt}';
    const map = {
        hwp:     base + 'th,td{border:1px solid #000}th{background:#f0f0f0;font-weight:bold;text-align:center}',
        apa:     base + 'table{border-top:2px solid #000;border-bottom:2px solid #000}th{border-bottom:1px solid #000;font-weight:bold}td{border:none}',
        minimal: base + 'table{border:1px solid #ccc}th{background:#f9f9f9}',
        none:    base,
    };
    return map[style] || map.hwp;
}

function buildHeadingCss(style, fontSize) {
    const base = `h1{font-size:${fontSize*1.6}pt;margin:1em 0 .5em}h2{font-size:${fontSize*1.3}pt;margin:.8em 0 .4em}h3{font-size:${fontSize*1.1}pt;margin:.6em 0 .3em}h4,h5,h6{font-size:${fontSize}pt;margin:.5em 0 .25em}`;
    const map = {
        default: base,
        'numbered-box': base + `
            body{counter-reset:h1cnt h2cnt h3cnt}
            h1{counter-reset:h2cnt h3cnt}h1::before{counter-increment:h1cnt;content:counter(h1cnt)". "}
            h2{counter-reset:h3cnt}h2::before{counter-increment:h2cnt;content:counter(h1cnt)"."counter(h2cnt)" "}
            h3::before{counter-increment:h3cnt;content:counter(h1cnt)"."counter(h2cnt)"."counter(h3cnt)" "}`,
        apa: base + 'h1{text-align:center}h2{font-weight:bold}h3{font-style:italic}',
    };
    return map[style] || map.default;
}

function buildPageBreakCss(s) {
    let css = '';
    if (s.pageBreakBeforeH1) css += 'h1{page-break-before:always}';
    if (s.pageBreakBeforeH2) css += 'h2{page-break-before:always}';
    if (s.pageBreakBeforeH3) css += 'h3{page-break-before:always}';
    return css;
}

// ── iframe 문서 빌더 ─────────────────────────────────────────
function buildIframeDoc(bodyHtml, s) {
    const font = getFontFamily(s);
    return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&display=swap" rel="stylesheet">
<style>
body{font-family:${font};font-size:${s.fontSize}pt;line-height:${s.lineHeight};word-break:${s.wordBreak};text-indent:${s.textIndent === '0' ? '0' : s.textIndent};padding:${s.margin.top} ${s.margin.right} ${s.margin.bottom} ${s.margin.left};margin:0;color:#000;background:#fff}
p{margin:0 0 6pt;text-indent:${s.textIndent}}
a{color:#2563eb}
code{font-family:'JetBrains Mono','Consolas',monospace;font-size:.88em;background:#f5f5f5;padding:1px 4px;border-radius:3px}
pre{background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;margin:8pt 0}
pre code{background:none;padding:0}
blockquote{border-left:3px solid #ccc;margin:8pt 0;padding-left:14px;color:#555}
img{max-width:100%}
ul,ol{padding-left:1.5em;margin:4pt 0}
li{margin:2pt 0}
hr{border:none;border-top:1px solid #ccc;margin:12pt 0}
.doc-meta{margin-bottom:20pt;padding-bottom:10pt;border-bottom:2px solid #000}
.doc-title{font-size:${s.fontSize*1.8}pt;font-weight:bold;margin-bottom:3pt}
.doc-subtitle{font-size:${s.fontSize*1.2}pt;color:#444;margin-bottom:6pt}
.doc-info{font-size:${s.fontSize*.9}pt;color:#666;display:flex;gap:16pt}
${buildTableCss(s.tableStyle)}
${buildHeadingCss(s.headingStyle, s.fontSize)}
${buildPageBreakCss(s)}
@media print{body{padding:0;margin:0}}
</style></head><body>${bodyHtml}</body></html>`;
}

// ── 메인 업데이트 함수 ───────────────────────────────────────
const debouncedPreview = debounce(_renderPreview, 300);

function updatePreview() { debouncedPreview(); }

function _renderPreview() {
    const md = document.getElementById('editor').value;
    const fm = parseFrontmatter(md);
    const body = stripFrontmatter(md);
    const html = marked.parse(body);
    const headerHtml = buildFrontmatterHeader(fm);
    const iframe = document.getElementById('preview-iframe');
    iframe.srcdoc = buildIframeDoc(headerHtml + html, currentSettings);
}

function esc(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

---

## 5. `editor.js` 전체

```javascript
let fileHandle = null;
let currentFilename = '새 문서';

function initEditor() {
    const editor = document.getElementById('editor');
    const lineNums = document.getElementById('line-numbers');

    // 라인번호 업데이트
    function updateLineNumbers() {
        const lines = editor.value.split('\n').length;
        const curLine = editor.value.slice(0, editor.selectionStart).split('\n').length;
        lineNums.innerHTML = Array.from({length: lines}, (_, i) => {
            const n = i + 1;
            return `<div class="${n === curLine ? 'active' : ''}">${n}</div>`;
        }).join('');
        lineNums.scrollTop = editor.scrollTop;
    }

    // 상태바 업데이트
    function updateStatusBar() {
        const val = editor.value;
        const before = val.slice(0, editor.selectionStart);
        const line = before.split('\n').length;
        const col  = before.split('\n').pop().length + 1;
        const totalLines = val.split('\n').length;
        const chars = val.length;
        document.getElementById('stat-pos').textContent   = `줄 ${line}, 열 ${col}`;
        document.getElementById('stat-lines').textContent = `${totalLines}줄`;
        document.getElementById('stat-chars').textContent = `${chars}자`;
    }

    editor.addEventListener('input', () => {
        updateLineNumbers();
        updateStatusBar();
        debouncedAutosave();
        updatePreview();
    });

    editor.addEventListener('keyup',  () => { updateLineNumbers(); updateStatusBar(); });
    editor.addEventListener('click',  () => { updateLineNumbers(); updateStatusBar(); });
    editor.addEventListener('scroll', () => { lineNums.scrollTop = editor.scrollTop; });

    // Tab 키: 2칸 공백 삽입
    editor.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const s = editor.selectionStart, end = editor.selectionEnd;
            editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(end);
            editor.selectionStart = editor.selectionEnd = s + 2;
            updateLineNumbers();
        }
    });

    updateLineNumbers();
    updateStatusBar();
}

// ── 파일 저장/열기 ───────────────────────────────────────────
async function openFile() {
    try {
        if (window.showOpenFilePicker) {
            const [handle] = await window.showOpenFilePicker({
                types: [{ description: 'Markdown', accept: {'text/markdown': ['.md', '.markdown', '.txt']} }]
            });
            const file = await handle.getFile();
            document.getElementById('editor').value = await file.text();
            fileHandle = handle;
            setFilename(file.name);
        } else {
            document.getElementById('file-input').click();
        }
        updatePreview();
        showToast(`${currentFilename} 열림`, 'success');
    } catch(e) {
        if (e.name !== 'AbortError') showToast('열기 실패: ' + e.message, 'error');
    }
}

document.getElementById('file-input').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById('editor').value = ev.target.result;
        fileHandle = null; setFilename(file.name); updatePreview();
        showToast(`${file.name} 열림`, 'success');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
});

async function saveFile() {
    const content = document.getElementById('editor').value;
    try {
        if (window.showSaveFilePicker) {
            if (!fileHandle) {
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: currentFilename.endsWith('.md') ? currentFilename : 'document.md',
                    types: [{ description: 'Markdown', accept: {'text/markdown': ['.md']} }]
                });
                setFilename((await fileHandle.getFile()).name);
            }
            const w = await fileHandle.createWritable();
            await w.write(content); await w.close();
            showToast('저장 완료', 'success');
        } else {
            downloadBlob(new Blob([content], {type:'text/markdown;charset=utf-8'}),
                currentFilename.endsWith('.md') ? currentFilename : 'document.md');
        }
    } catch(e) {
        if (e.name !== 'AbortError') showToast('저장 실패: ' + e.message, 'error');
    }
}

function setFilename(name) {
    currentFilename = name;
    document.title = `${name} — MD-HWPX Studio`;
}

function newDocument() {
    if (document.getElementById('editor').value.trim() &&
        !confirm('현재 내용을 버리고 새 문서를 만들까요?')) return;
    document.getElementById('editor').value = getSampleMD();
    fileHandle = null; setFilename('새 문서'); updatePreview();
}

function getSampleMD() {
    return `---\ntitle: 문서 제목\nsubtitle: 부제목\nauthor: 작성자\ndate: ${new Date().toISOString().slice(0,10)}\norganization: 소속 기관\n---\n\n# 제목 1\n\n본문 내용입니다. **굵은 텍스트**와 *기울임*을 지원합니다.\n\n## 제목 2\n\n| 항목 | 설명 |\n|------|------|\n| A | 첫 번째 항목 |\n| B | 두 번째 항목 |\n\n> 인용문 블록입니다.\n\n- 목록 항목 1\n- 목록 항목 2\n`;
}

// ── 자동저장 ─────────────────────────────────────────────────
const AUTOSAVE_KEY = 'md-hwpx-content';

function restoreAutosave() {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) { document.getElementById('editor').value = saved; updatePreview(); }
    else document.getElementById('editor').value = getSampleMD();
}

const debouncedAutosave = debounce(() => {
    localStorage.setItem(AUTOSAVE_KEY, document.getElementById('editor').value);
}, 2000);

// ── 찾기 ─────────────────────────────────────────────────────
let findMatches = [], findIndex = 0;

function toggleFind() {
    const bar = document.getElementById('find-bar');
    bar.classList.toggle('hidden');
    if (!bar.classList.contains('hidden')) document.getElementById('find-input').focus();
}

function doFind(dir = 1) {
    const q = document.getElementById('find-input').value;
    const text = document.getElementById('editor').value;
    if (!q) return;
    findMatches = [];
    let i = 0, idx;
    while ((idx = text.indexOf(q, i)) !== -1) { findMatches.push(idx); i = idx + 1; }
    document.getElementById('find-count').textContent = findMatches.length ? `${findIndex+1}/${findMatches.length}` : '0/0';
    if (!findMatches.length) return;
    findIndex = ((findIndex + dir) % findMatches.length + findMatches.length) % findMatches.length;
    const editor = document.getElementById('editor');
    editor.focus(); editor.selectionStart = findMatches[findIndex]; editor.selectionEnd = findMatches[findIndex] + q.length;
    editor.scrollTop = Math.max(0, editor.selectionStart / editor.value.length * editor.scrollHeight - 100);
    document.getElementById('find-count').textContent = `${findIndex+1}/${findMatches.length}`;
}

document.getElementById('find-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doFind(e.shiftKey ? -1 : 1); }
    if (e.key === 'Escape') document.getElementById('find-bar').classList.add('hidden');
});
document.getElementById('find-input').addEventListener('input', () => { findIndex = -1; doFind(1); });
document.getElementById('find-prev').addEventListener('click', () => doFind(-1));
document.getElementById('find-next').addEventListener('click', () => doFind(1));
document.getElementById('find-close').addEventListener('click', () => document.getElementById('find-bar').classList.add('hidden'));
```

---

## 6. `export.js` 전체

```javascript
// ── HTML 웹용 ─────────────────────────────────────────────────
function exportHTMLWeb() {
    const md = document.getElementById('editor').value;
    const fm = parseFrontmatter(md);
    const body = stripFrontmatter(md);
    const html = marked.parse(body);
    const font = getFontFamily(currentSettings);
    const s = currentSettings;

    const fullDoc = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(fm?.title || currentFilename.replace('.md',''))}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&display=swap" rel="stylesheet">
<style>
body{font-family:${font};font-size:${s.fontSize}pt;line-height:${s.lineHeight};word-break:${s.wordBreak};max-width:210mm;margin:${s.margin.top} auto;padding:0 ${s.margin.right};color:#222}
h1{font-size:${s.fontSize*1.6}pt;margin:1em 0 .5em;padding-bottom:.2em;border-bottom:2px solid #eee}
h2{font-size:${s.fontSize*1.3}pt;margin:.8em 0 .4em;padding-bottom:.15em;border-bottom:1px solid #eee}
h3{font-size:${s.fontSize*1.1}pt;margin:.6em 0 .3em}
p{margin:0 0 8pt}code{background:#f5f5f5;padding:2px 5px;border-radius:3px;font-size:.88em}
pre{background:#f5f5f5;padding:14px;border-radius:6px;overflow-x:auto}
pre code{background:none;padding:0}
blockquote{border-left:4px solid #ddd;padding-left:14px;color:#555;margin:8pt 0}
${buildTableCss(s.tableStyle)}
.doc-meta{margin-bottom:24pt;padding-bottom:12pt;border-bottom:2px solid #000}
.doc-title{font-size:${s.fontSize*1.8}pt;font-weight:bold;margin-bottom:4pt}
.doc-subtitle{font-size:${s.fontSize*1.2}pt;color:#444;margin-bottom:8pt}
.doc-info{font-size:${s.fontSize*.9}pt;color:#666;display:flex;gap:16pt}
</style>
</head>
<body>
${buildFrontmatterHeader(fm)}
${html}
</body>
</html>`;

    downloadBlob(new Blob([fullDoc], {type:'text/html;charset=utf-8'}),
        (currentFilename.replace('.md','') || 'document') + '.html');
    showToast('HTML(웹용) 저장 완료', 'success');
}

// ── HTML HWP용 (인라인 스타일 전용) ───────────────────────────
function exportHTMLforHWP() {
    const md = document.getElementById('editor').value;
    const fm = parseFrontmatter(md);
    const body = stripFrontmatter(md);
    const html = marked.parse(body);
    const s = currentSettings;
    const font = getFontFamily(s);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const fs = s.fontSize, ff = font, lh = s.lineHeight;
    const border = (s.tableStyle !== 'none') ? '1px solid #000' : 'none';

    const inlineStyles = {
        h1: `font-family:${ff};font-size:${fs*1.6}pt;font-weight:bold;margin:12pt 0 6pt;`,
        h2: `font-family:${ff};font-size:${fs*1.3}pt;font-weight:bold;margin:10pt 0 4pt;`,
        h3: `font-family:${ff};font-size:${fs*1.1}pt;font-weight:bold;margin:8pt 0 4pt;`,
        h4: `font-family:${ff};font-size:${fs}pt;font-weight:bold;margin:6pt 0 3pt;`,
        p:  `font-family:${ff};font-size:${fs}pt;line-height:${lh};margin:0 0 6pt;`,
        li: `font-family:${ff};font-size:${fs}pt;line-height:${lh};margin:2pt 0;`,
        th: `font-family:${ff};font-size:${fs}pt;border:${border};padding:4pt 8pt;background:#f0f0f0;font-weight:bold;text-align:center;`,
        td: `font-family:${ff};font-size:${fs}pt;border:${border};padding:4pt 8pt;`,
        table: `border-collapse:collapse;width:100%;margin:8pt 0;`,
        blockquote: `font-family:${ff};font-size:${fs}pt;border-left:3px solid #ccc;padding-left:12pt;color:#555;margin:8pt 0;`,
        code: `font-family:'Consolas',monospace;font-size:${fs*.88}pt;background:#f5f5f5;padding:1px 4px;`,
        pre:  `background:#f5f5f5;padding:10pt;margin:8pt 0;`,
    };

    Object.entries(inlineStyles).forEach(([tag, style]) => {
        doc.querySelectorAll(tag).forEach(el => {
            el.setAttribute('style', style);
            el.removeAttribute('class');
        });
    });

    // 모든 class 제거 (남은 것)
    doc.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));

    const bodyStyle = `font-family:${ff};font-size:${fs}pt;line-height:${lh};word-break:${s.wordBreak};margin:${s.margin.top} ${s.margin.right} ${s.margin.bottom} ${s.margin.left};`;

    const fmHtml = fm ? buildFrontmatterHWP(fm, ff, fs) : '';

    const fullDoc = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="${bodyStyle}">
${fmHtml}
${doc.body.innerHTML}
</body>
</html>`;

    downloadBlob(new Blob([fullDoc], {type:'text/html;charset=utf-8'}),
        (currentFilename.replace('.md','') || 'document') + '_hwp.html');
    showToast('HTML(HWP용) 저장 완료 — 한글에서 열기로 import 가능', 'success');
}

function buildFrontmatterHWP(fm, font, fontSize) {
    const fs = fontSize;
    return `<table style="border-collapse:collapse;width:100%;margin-bottom:16pt;">
  ${fm.title ? `<tr><td colspan="2" style="border:none;font-family:${font};font-size:${fs*1.8}pt;font-weight:bold;padding:4pt 0;">${esc(fm.title)}</td></tr>` : ''}
  ${fm.subtitle ? `<tr><td colspan="2" style="border:none;font-family:${font};font-size:${fs*1.2}pt;padding:2pt 0;color:#444;">${esc(fm.subtitle)}</td></tr>` : ''}
  <tr>
    <td style="border:none;font-family:${font};font-size:${fs}pt;">${esc(fm.organization||'')}</td>
    <td style="border:none;font-family:${font};font-size:${fs}pt;text-align:right;">${esc(fm.author||'')}　${esc(fm.date||'')}</td>
  </tr>
</table>
<hr style="border:none;border-top:1px solid #000;margin-bottom:12pt;">`;
}

// ── PDF ──────────────────────────────────────────────────────
function exportPDF() {
    window.print();
}

// ── HWPX (서버 필요) ─────────────────────────────────────────
async function exportHWPX() {
    if (!serverOnline) {
        showToast('서버를 먼저 실행하세요: python server.py', 'warn'); return;
    }
    const md = document.getElementById('editor').value;
    const fm = parseFrontmatter(md) || {};
    const mdContent = stripFrontmatter(md);
    const template = document.getElementById('template-select').value || 'default.hwpx';
    const basename = (currentFilename.replace('.md','') || 'document').replace(/[\/\\]/g,'');

    showToast('HWPX 변환 중...', 'info');
    try {
        const res = await fetch('http://localhost:8000/api/convert/hwpx', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                md_content: mdContent, template, filename: basename,
                metadata: {
                    title:        fm.title        || '',
                    subtitle:     fm.subtitle     || '',
                    author:       fm.author       || '',
                    date:         fm.date         || '',
                    organization: fm.organization || '',
                }
            })
        });
        if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail||`HTTP ${res.status}`); }
        downloadBlob(await res.blob(), basename + '.hwpx');
        showToast('HWPX 저장 완료', 'success');
    } catch(e) {
        showToast('변환 실패: ' + e.message, 'error');
    }
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

---

## 7. `presets.js` 전체

```javascript
const PRESETS_KEY = 'md-hwpx-presets';

const builtinPresets = [
    { id:'builtin-gov',    name:'공공기관 기본', builtin:true, settings: {...defaultSettings} },
    { id:'builtin-apa',    name:'학술 논문',     builtin:true, settings: {...defaultSettings, fontFamily:'nanum-myeongjo', fontSize:10.5, lineHeight:2.0, tableStyle:'apa', headingStyle:'apa'} },
    { id:'builtin-report', name:'보고서',        builtin:true, settings: {...defaultSettings, fontFamily:'malgun', fontSize:10, lineHeight:1.5, headingStyle:'numbered-box'} },
];

let activePresetId = null;

function loadPresets() {
    const saved = JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
    return [...builtinPresets, ...saved];
}

function renderPresetList() {
    const all = loadPresets();
    const container = document.getElementById('preset-list');
    container.innerHTML = '';

    all.forEach(p => {
        const div = document.createElement('div');
        div.className = 'preset-item' + (p.id === activePresetId ? ' active' : '');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = p.name;

        div.appendChild(nameSpan);

        if (!p.builtin) {
            const del = document.createElement('button');
            del.className = 'preset-del';
            del.textContent = '✕';
            del.title = '삭제';
            del.addEventListener('click', e => {
                e.stopPropagation();
                if (confirm(`"${p.name}" 프리셋을 삭제할까요?`)) {
                    deletePreset(p.id); renderPresetList();
                }
            });
            div.appendChild(del);
        } else {
            const tag = document.createElement('span');
            tag.className = 'preset-built-in';
            tag.textContent = '기본';
            div.appendChild(tag);
        }

        div.addEventListener('click', () => {
            applyPreset(p);
            activePresetId = p.id;
            renderPresetList();
        });
        container.appendChild(div);
    });
}

function applyPreset(p) {
    currentSettings = JSON.parse(JSON.stringify(p.settings));
    applySettingsToUI(currentSettings);
    updatePreview();
    showToast(`"${p.name}" 프리셋 적용됨`, 'info');
}

function saveCurrentAsPreset(name) {
    const presets = JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
    const id = 'user-' + Date.now();
    presets.push({ id, name, builtin:false, settings: JSON.parse(JSON.stringify(currentSettings)) });
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    activePresetId = id;
    renderPresetList();
    showToast(`"${name}" 저장됨`, 'success');
}

function deletePreset(id) {
    const presets = JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.filter(p => p.id !== id)));
    if (activePresetId === id) activePresetId = null;
}

document.getElementById('btn-save-preset').addEventListener('click', () => {
    const name = prompt('프리셋 이름을 입력하세요:');
    if (name && name.trim()) saveCurrentAsPreset(name.trim());
});
```

---

## 8. `app.js` 전체

```javascript
// ── 서버 상태 ─────────────────────────────────────────────────
let serverOnline = false;

async function checkServer() {
    try {
        const res = await fetch('http://localhost:8000/api/health', { signal: AbortSignal.timeout(2000) });
        const data = await res.json().catch(() => ({}));
        setServerStatus(res.ok, data.pandoc !== false);
    } catch { setServerStatus(false, false); }
}

function setServerStatus(online, pandocOk) {
    const prev = serverOnline;
    serverOnline = online && pandocOk;
    const dot   = document.getElementById('server-dot');
    const label = document.getElementById('server-label');
    const hwpxB = document.getElementById('btn-hwpx');
    const hwpxC = document.getElementById('btn-hwpx-convert');
    const tmpl  = document.getElementById('template-select');

    if (online && pandocOk) {
        dot.className = 'status-dot online'; label.textContent = '서버 연결됨';
        [hwpxB, hwpxC].forEach(b => b.disabled = false);
        tmpl.disabled = false;
        if (!prev) loadTemplates();
    } else if (online) {
        dot.className = 'status-dot warn'; label.textContent = 'Pandoc 없음';
        [hwpxB, hwpxC].forEach(b => b.disabled = true);
    } else {
        dot.className = 'status-dot offline'; label.textContent = '서버 없음';
        [hwpxB, hwpxC].forEach(b => b.disabled = true);
        tmpl.disabled = true; tmpl.innerHTML = '<option value="">서버 미연결</option>';
    }
}

async function loadTemplates() {
    try {
        const res = await fetch('http://localhost:8000/api/templates');
        const data = await res.json();
        const sel = document.getElementById('template-select');
        sel.innerHTML = data.templates.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    } catch { /* 조용히 실패 */ }
}

// ── 뷰 모드 ──────────────────────────────────────────────────
function setViewMode(mode) {
    document.body.className = 'view-' + mode;
    document.querySelectorAll('.tb-view').forEach(b => {
        b.classList.toggle('active', b.dataset.view === mode);
    });
    localStorage.setItem('md-hwpx-view', mode);
}

// ── 다크/라이트 ───────────────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem('md-hwpx-theme') || 'light';
    applyTheme(saved);
}

function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    document.getElementById('btn-theme').textContent = t === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('md-hwpx-theme', t);
}

document.getElementById('btn-theme').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme;
    applyTheme(cur === 'dark' ? 'light' : 'dark');
});

// ── 툴바 버튼 이벤트 ─────────────────────────────────────────
document.getElementById('btn-new').addEventListener('click', newDocument);
document.getElementById('btn-open').addEventListener('click', openFile);
document.getElementById('btn-save').addEventListener('click', saveFile);
document.getElementById('btn-html-web').addEventListener('click', exportHTMLWeb);
document.getElementById('btn-html-hwp').addEventListener('click', exportHTMLforHWP);
document.getElementById('btn-pdf').addEventListener('click', exportPDF);
document.getElementById('btn-hwpx').addEventListener('click', exportHWPX);
document.getElementById('btn-hwpx-convert').addEventListener('click', exportHWPX);

document.querySelectorAll('.tb-view').forEach(b => {
    b.addEventListener('click', () => setViewMode(b.dataset.view));
});

// 표 삽입
document.getElementById('btn-insert-table').addEventListener('click', () => {
    const snippet = '\n| 항목 | 내용 |\n|------|------|\n| A | 설명 |\n| B | 설명 |\n';
    const editor = document.getElementById('editor');
    const s = editor.selectionStart;
    editor.value = editor.value.slice(0, s) + snippet + editor.value.slice(s);
    editor.selectionStart = editor.selectionEnd = s + snippet.length;
    editor.focus(); updatePreview();
});

// ── 단축키 ───────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) {
        if (!e.shiftKey) {
            if (e.key === 's') { e.preventDefault(); saveFile(); }
            if (e.key === 'o') { e.preventDefault(); openFile(); }
            if (e.key === 'p') { e.preventDefault(); exportPDF(); }
            if (e.key === 'f') { e.preventDefault(); toggleFind(); }
            if (e.key === '1') { e.preventDefault(); setViewMode('edit'); }
            if (e.key === '2') { e.preventDefault(); setViewMode('split'); }
            if (e.key === '3') { e.preventDefault(); setViewMode('preview'); }
        } else {
            if (e.key === 'H') { e.preventDefault(); exportHTMLWeb(); }
            if (e.key === 'K') { e.preventDefault(); exportHTMLforHWP(); }
            if (e.key === 'W') { e.preventDefault(); exportHWPX(); }
        }
    }
});

// ── 토스트 ───────────────────────────────────────────────────
function showToast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => c.removeChild(t), 300); }, 3000);
}

// ── 유틸 ─────────────────────────────────────────────────────
function debounce(fn, delay) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); };
}

// ── 초기화 ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSettingsPanel();
    initEditor();
    renderPresetList();
    restoreAutosave();
    setViewMode(localStorage.getItem('md-hwpx-view') || 'split');
    checkServer();
    setInterval(checkServer, 5000);
    applySettingsToUI(currentSettings);
    updatePreview();
});
```

---

## 9. `server.py` 전체

```python
"""
MD-HWPX Studio — server.py  v4.0
HWPX 변환 전용 FastAPI 로컬 서버
실행: python server.py
"""
from __future__ import annotations
import shutil, subprocess, tempfile
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="MD-HWPX Studio Server", version="4.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

TEMPLATES_DIR = Path("templates")
TEMPLATES_DIR.mkdir(exist_ok=True)

class ConvertRequest(BaseModel):
    md_content: str
    template:   str  = "default.hwpx"
    filename:   str  = "document"
    metadata:   dict = {}

@app.get("/api/health")
def health():
    return {"status": "ok", "pandoc": shutil.which("pandoc") is not None}

@app.get("/api/templates")
def list_templates():
    return {"templates": sorted(f.name for f in TEMPLATES_DIR.glob("*.hwpx"))}

@app.post("/api/convert/hwpx")
def convert_hwpx(req: ConvertRequest):
    if not shutil.which("pandoc"):
        raise HTTPException(500, "Pandoc 미설치. https://pandoc.org/installing.html")

    template_path = TEMPLATES_DIR / Path(req.template).name
    if not template_path.exists():
        raise HTTPException(404, f"템플릿 없음: {req.template}")

    safe_name = Path(req.filename).name or "document"

    # metadata → --metadata 옵션
    meta_args = [f"--metadata={k}:{v}" for k, v in req.metadata.items() if v]

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        md_file  = tmp / "input.md"
        out_file = tmp / f"{safe_name}.hwpx"
        md_file.write_text(req.md_content, encoding="utf-8")

        cmd = ["pypandoc-hwpx", str(md_file),
               f"--reference-doc={template_path}",
               "-o", str(out_file)] + meta_args

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            raise HTTPException(500, f"변환 실패:\n{result.stderr or result.stdout}")
        if not out_file.exists():
            raise HTTPException(500, "변환 결과 파일 없음")

        dest = Path(tempfile.gettempdir()) / f"mhs_{safe_name}.hwpx"
        shutil.copy2(out_file, dest)

    return FileResponse(str(dest), filename=f"{safe_name}.hwpx",
                        media_type="application/octet-stream")

@app.post("/api/templates/upload")
async def upload_template(file: UploadFile = File(...)):
    if not (file.filename or '').endswith(".hwpx"):
        raise HTTPException(400, ".hwpx 파일만 업로드 가능")
    dest = TEMPLATES_DIR / Path(file.filename).name
    dest.write_bytes(await file.read())
    return {"message": f"업로드 완료: {dest.name}", "filename": dest.name}

@app.delete("/api/templates/{filename}")
def delete_template(filename: str):
    if filename == "default.hwpx":
        raise HTTPException(403, "기본 템플릿 삭제 불가")
    target = TEMPLATES_DIR / Path(filename).name
    if not target.exists():
        raise HTTPException(404, f"파일 없음: {filename}")
    target.unlink()
    return {"message": f"삭제: {filename}"}

if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("MD-HWPX Studio Server v4.0")
    print("index.html을 Chrome/Edge에서 여세요")
    print("API 문서: http://localhost:8000/docs")
    print("=" * 50)
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

---

## 10. `requirements.txt`

```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
pypandoc-hwpx>=0.1.0
python-multipart>=0.0.9
```
