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

\`\`\`js
console.log('code block')
\`\`\`

> 인용문 블록

- 목록 1
- 목록 2
`;

(function initApp() {
  const editorEl = document.getElementById('editor');
  const statusLeft = document.getElementById('status-left');
  const statusRight = document.getElementById('status-right');
  const themeToggle = document.getElementById('theme-toggle');

  const state = {
    markdown: localStorage.getItem('md-hwpx-content') || SAMPLE_MD,
    settings: Object.assign(window.deepClone(window.defaultSettings), JSON.parse(localStorage.getItem('mdhwpx.settings') || '{}')),
    viewMode: 'split',
    filename: 'document.md',
    fileHandle: null,
  };

  const debounce = (fn, ms = 300) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const showToast = (msg, type = 'info') => {
    const host = document.getElementById('toast-host');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const setTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('mdhwpx.theme', theme);
  };

  const setViewMode = (mode) => {
    state.viewMode = mode;
    document.querySelectorAll('.view-mode-group .tool-btn').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.view === mode));
    document.getElementById('editor-panel').style.display = mode === 'preview' ? 'none' : 'flex';
    document.getElementById('preview-panel').style.display = mode === 'edit' ? 'none' : 'block';
  };

  const updateStatus = (autoSavedAt = '') => {
    const lines = state.markdown.split('\n').length;
    const chars = state.markdown.length;
    const { line, col } = window.getCaretInfo(editorEl);
    const autoSaved = autoSavedAt ? ` | 자동 저장됨 ${autoSavedAt}` : '';
    statusLeft.textContent = `줄 ${line}, 열 ${col} | ${lines}줄 | ${chars}자 | Markdown${autoSaved}`;
  };

  const repaint = debounce(() => {
    window.updateLineNumbers(editorEl);
    window.updatePreview(state.markdown, state.settings);
    updateStatus();
  }, 300);

  const autoSave = debounce(() => {
    localStorage.setItem('md-hwpx-content', state.markdown);
    const t = new Date();
    updateStatus(`${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`);
  }, 2000);

  const onTextChanged = () => {
    state.markdown = editorEl.value;
    repaint();
    autoSave();
  };

  const applySettings = (settings) => {
    state.settings = window.deepClone(settings);
    localStorage.setItem('mdhwpx.settings', JSON.stringify(state.settings));
    window.updatePreview(state.markdown, state.settings);
  };

  const loadTemplates = async () => {
    const sel = document.getElementById('set-template');
    if (!sel) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/templates');
      const json = await res.json();
      const templates = json.templates || [];
      sel.innerHTML = templates.length
        ? templates.map((t) => `<option value="${t}">${t}</option>`).join('')
        : '<option value="">서버 없음</option>';
      if (templates.includes('default.hwpx')) sel.value = 'default.hwpx';
    } catch {
      sel.innerHTML = '<option value="">서버 없음</option>';
    }
  };

  const checkServer = async () => {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), 2000);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/health', { signal: c.signal });
      const json = await res.json();
      if (json.status === 'ok' && json.pandoc) {
        statusRight.textContent = '● 서버 online (Pandoc OK)';
        statusRight.dataset.state = 'online';
        document.getElementById('btn-export-hwpx').disabled = false;
      } else {
        statusRight.textContent = '● 서버 warn (Pandoc 없음)';
        statusRight.dataset.state = 'warn';
        document.getElementById('btn-export-hwpx').disabled = true;
      }
    } catch {
      statusRight.textContent = '● 서버 없음';
      statusRight.dataset.state = 'offline';
      document.getElementById('btn-export-hwpx').disabled = true;
    } finally {
      clearTimeout(timer);
      await loadTemplates();
    }
  };

  const openFile = async () => {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({ types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown', '.txt'] } }] });
        const file = await handle.getFile();
        state.fileHandle = handle;
        state.filename = file.name;
        state.markdown = await file.text();
        editorEl.value = state.markdown;
        repaint();
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,.txt';
        input.onchange = async () => {
          const file = input.files[0];
          if (!file) return;
          state.filename = file.name;
          state.markdown = await file.text();
          editorEl.value = state.markdown;
          repaint();
        };
        input.click();
      }
      showToast('파일 열기 완료', 'success');
    } catch {
      showToast('파일 열기 취소/실패', 'warn');
    }
  };

  const saveFile = async () => {
    try {
      if (state.fileHandle && state.fileHandle.createWritable) {
        const w = await state.fileHandle.createWritable();
        await w.write(state.markdown);
        await w.close();
      } else if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({ suggestedName: state.filename, types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }] });
        state.fileHandle = handle;
        const w = await handle.createWritable();
        await w.write(state.markdown);
        await w.close();
      } else {
        const blob = new Blob([state.markdown], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = state.filename;
        a.click();
      }
      showToast('저장 완료', 'success');
    } catch {
      showToast('저장 취소/실패', 'warn');
    }
  };

  const exportHWPX = async () => {
    const btn = document.getElementById('btn-export-hwpx');
    const template = document.getElementById('set-template')?.value || 'default.hwpx';
    if (btn.disabled) {
      showToast('서버를 먼저 실행하세요: python server.py', 'warn');
      return;
    }

    try {
      const fm = window.parseFrontmatter(state.markdown) || {};
      const res = await fetch('http://127.0.0.1:8000/api/convert/hwpx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          md_content: state.markdown,
          template,
          filename: state.filename.replace(/\.[^/.]+$/, ''),
          metadata: {
            title: fm.title || '',
            author: fm.author || '',
            date: fm.date || '',
          },
        }),
      });

      if (!res.ok) {
        let msg = 'HWPX 변환 실패';
        try {
          const data = await res.json();
          msg = data.detail || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${state.filename.replace(/\.[^/.]+$/, '')}.hwpx`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('HWPX 변환 완료', 'success');
    } catch (e) {
      showToast(e.message || 'HWPX 변환 실패', 'error');
    }
  };

  const onSettingChange = (path, value) => {
    if (path.startsWith('margin.')) {
      state.settings.margin[path.split('.')[1]] = value;
    } else {
      state.settings[path] = value;
    }
    applySettings(state.settings);
  };

  const applyPreset = (id) => {
    const preset = window.loadPresets().find((p) => p.id === id);
    if (!preset) return;
    applySettings({ ...state.settings, ...preset.settings, margin: { ...state.settings.margin, ...(preset.settings.margin || {}) } });
    window.renderSettingsPanel(state.settings, onSettingChange, applyPreset, savePreset, deletePreset);
    showToast(`프리셋 적용: ${preset.name}`, 'info');
  };

  const savePreset = (name) => {
    window.saveCurrentAsPreset(name, window.deepClone(state.settings));
    showToast('프리셋 저장 완료', 'success');
  };

  const deletePreset = (id) => {
    window.deletePreset(id);
    showToast('프리셋 삭제 완료', 'info');
  };

  window.bindEditor({ editorEl, onTextChanged });
  window.bindExportButtons(() => ({ markdown: state.markdown, settings: state.settings, filename: state.filename }));
  window.renderSettingsPanel(state.settings, onSettingChange, applyPreset, savePreset, deletePreset);

  themeToggle.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  document.querySelectorAll('.view-mode-group .tool-btn').forEach((btn) => btn.addEventListener('click', () => setViewMode(btn.dataset.view)));

  document.getElementById('btn-new').addEventListener('click', () => {
    editorEl.value = SAMPLE_MD;
    onTextChanged();
    showToast('새 문서 생성', 'info');
  });
  document.getElementById('btn-open').addEventListener('click', openFile);
  document.getElementById('btn-save').addEventListener('click', saveFile);
  document.getElementById('btn-export-hwpx').addEventListener('click', exportHWPX);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); saveFile(); }
    if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); openFile(); }
    if (e.ctrlKey && e.key === '1') { e.preventDefault(); setViewMode('edit'); }
    if (e.ctrlKey && e.key === '2') { e.preventDefault(); setViewMode('split'); }
    if (e.ctrlKey && e.key === '3') { e.preventDefault(); setViewMode('preview'); }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') { e.preventDefault(); window.exportHTMLWeb({ markdown: state.markdown, settings: state.settings, filename: state.filename }); }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') { e.preventDefault(); window.exportHTMLforHWP({ markdown: state.markdown, settings: state.settings, filename: state.filename }); }
    if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); window.exportPDF(); }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'w') { e.preventDefault(); exportHWPX(); }
  });

  editorEl.value = state.markdown;
  setTheme(localStorage.getItem('mdhwpx.theme') || 'light');
  setViewMode('split');
  repaint();
  loadTemplates();
  checkServer();
  setInterval(checkServer, 5000);
})();
