const SAMPLE_MD = `---
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
`;

(function initApp() {
  const editorEl = document.getElementById('editor');
  const statusLeft = document.getElementById('status-left');
  const themeToggle = document.getElementById('theme-toggle');

  const state = {
    markdown: localStorage.getItem('mdhwpx.markdown') || SAMPLE_MD,
    settings: { ...window.defaultSettings, ...(JSON.parse(localStorage.getItem('mdhwpx.settings') || '{}')) },
    viewMode: 'split',
  };

  const debounce = (fn, ms = 120) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('mdhwpx.theme', theme);
  }

  function applyViewMode(mode) {
    state.viewMode = mode;
    document.querySelectorAll('.view-mode-group .tool-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.view === mode);
    });
    document.getElementById('editor-panel').style.display = mode === 'preview' ? 'none' : 'flex';
    document.getElementById('preview-panel').style.display = mode === 'edit' ? 'none' : 'block';
  }

  function updateStatus() {
    const lines = state.markdown.split('\n').length;
    const chars = state.markdown.length;
    const { line, col } = window.getCaretInfo(editorEl);
    statusLeft.textContent = `줄 ${line}, 열 ${col} | ${lines}줄 | ${chars}자 | Markdown`;
  }

  const repaint = debounce(() => {
    window.updateLineNumbers(editorEl);
    window.updatePreview(state.markdown, state.settings);
    updateStatus();
  }, 100);

  const onTextChanged = () => {
    state.markdown = editorEl.value;
    localStorage.setItem('mdhwpx.markdown', state.markdown);
    repaint();
  };

  themeToggle.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  document.querySelectorAll('.view-mode-group .tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyViewMode(btn.dataset.view));
  });

  window.renderSettingsPanel(state.settings, (key, value) => {
    state.settings[key] = value;
    localStorage.setItem('mdhwpx.settings', JSON.stringify(state.settings));
    window.updatePreview(state.markdown, state.settings);
  });

  window.bindEditor({ editorEl, onTextChanged });
  window.bindExportButtons(() => state);

  editorEl.value = state.markdown;
  applyTheme(localStorage.getItem('mdhwpx.theme') || 'light');
  applyViewMode(state.viewMode);
  repaint();
})();
