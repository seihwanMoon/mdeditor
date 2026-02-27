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
  const appEl = document.getElementById('app');
  const workspaceEl = document.getElementById('workspace');
  const editorEl = document.getElementById('editor');
  const editorPanelEl = document.getElementById('editor-panel');
  const previewPanelEl = document.getElementById('preview-panel');
  const previewBgEl = document.getElementById('preview-bg');
  const splitterEl = document.getElementById('panel-splitter');
  const settingsPanelEl = document.getElementById('settings-panel');
  const statusLeft = document.getElementById('status-left');
  const statusRight = document.getElementById('status-right');
  const themeToggle = document.getElementById('theme-toggle');
  const settingsToggleBtn = document.getElementById('btn-toggle-settings');

  const parseStoredJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || '');
    } catch {
      return fallback;
    }
  };

  const mergeDeep = (target, source) => {
    const out = Array.isArray(target) ? [...target] : { ...target };
    if (!source || typeof source !== 'object') return out;
    Object.keys(source).forEach((key) => {
      const src = source[key];
      if (src && typeof src === 'object' && !Array.isArray(src)) {
        const base = out[key] && typeof out[key] === 'object' && !Array.isArray(out[key]) ? out[key] : {};
        out[key] = mergeDeep(base, src);
      } else {
        out[key] = src;
      }
    });
    return out;
  };

  const savedSettings = parseStoredJson('mdhwpx.settings', {});

  const state = {
    markdown: localStorage.getItem('md-hwpx-content') || SAMPLE_MD,
    settings: mergeDeep(window.deepClone(window.defaultSettings), savedSettings),
    viewMode: localStorage.getItem('mdhwpx.viewMode') || 'split',
    filename: 'document.md',
    fileHandle: null,
    settingsPanelOpen: false,
    splitRatio: Number(localStorage.getItem('mdhwpx.splitRatio') || 0.5),
    serverState: 'checking',
    assets: {},
    history: [],
  };
  let syncPreviewToCaret = () => {};

  try {
    state.assets = JSON.parse(localStorage.getItem('mdhwpx.assets') || '{}');
  } catch {
    state.assets = {};
  }

  const persistAssets = () => {
    try {
      localStorage.setItem('mdhwpx.assets', JSON.stringify(state.assets));
    } catch {
      // localStorage 용량 초과 시 세션 메모리에서만 유지
    }
  };

  const getReferencedAssetIds = (markdown) => {
    const ids = new Set();
    (markdown || '').replace(/asset:\/\/([a-zA-Z0-9_-]+)/g, (_, id) => {
      ids.add(id);
      return _;
    });
    return [...ids];
  };

  const getReferencedAssetsPayload = () => {
    const ids = getReferencedAssetIds(state.markdown);
    const out = {};
    ids.forEach((id) => {
      if (state.assets[id]) out[id] = state.assets[id];
    });
    return out;
  };

  const pruneUnreferencedAssets = () => {
    const ids = new Set(getReferencedAssetIds(state.markdown));
    let changed = false;
    Object.keys(state.assets).forEach((id) => {
      if (!ids.has(id)) {
        delete state.assets[id];
        changed = true;
      }
    });
    if (changed) persistAssets();
  };

  window.getAssetMap = () => state.assets;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

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

  const applySplitRatio = (ratio) => {
    state.splitRatio = clamp(Number(ratio) || 0.5, 0.2, 0.8);
    localStorage.setItem('mdhwpx.splitRatio', String(state.splitRatio));
    if (state.viewMode !== 'split') return;
    editorPanelEl.style.flex = `0 0 ${(state.splitRatio * 100).toFixed(1)}%`;
    previewPanelEl.style.flex = '1 1 auto';
  };

  const setSettingsPanelOpen = (open) => {
    state.settingsPanelOpen = !!open;
    appEl.dataset.settingsOpen = String(state.settingsPanelOpen);
    settingsToggleBtn.classList.toggle('is-active', state.settingsPanelOpen);
    localStorage.setItem('mdhwpx.settingsPanelOpen', String(state.settingsPanelOpen));
    if (state.viewMode === 'split') applySplitRatio(state.splitRatio);
  };

  const setViewMode = (mode) => {
    state.viewMode = mode;
    localStorage.setItem('mdhwpx.viewMode', mode);
    document.querySelectorAll('.view-mode-group .tool-btn').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.view === mode));

    if (mode === 'edit') {
      editorPanelEl.style.display = 'flex';
      previewPanelEl.style.display = 'none';
      splitterEl.classList.add('is-hidden');
      editorPanelEl.style.flex = '1 1 auto';
    } else if (mode === 'preview') {
      editorPanelEl.style.display = 'none';
      previewPanelEl.style.display = 'block';
      splitterEl.classList.add('is-hidden');
      previewPanelEl.style.flex = '1 1 auto';
    } else {
      editorPanelEl.style.display = 'flex';
      previewPanelEl.style.display = 'block';
      splitterEl.classList.remove('is-hidden');
      applySplitRatio(state.splitRatio);
    }
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
    syncPreviewToCaret();
  }, 300);

  const autoSave = debounce(() => {
    localStorage.setItem('md-hwpx-content', state.markdown);
    const t = new Date();
    updateStatus(`${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`);
  }, 2000);

  const onTextChanged = () => {
    state.markdown = editorEl.value;
    pruneUnreferencedAssets();
    repaint();
    autoSave();
  };

  const applySettings = (settings) => {
    state.settings = mergeDeep(window.deepClone(window.defaultSettings), settings || {});
    localStorage.setItem('mdhwpx.settings', JSON.stringify(state.settings));
    const zoomLabel = document.getElementById('zoom-label');
    if (zoomLabel) zoomLabel.textContent = `${Math.round((Number(state.settings.scale) || 1) * 100)}%`;
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

  const formatHistoryDate = (isoText) => {
    const d = new Date(isoText);
    if (Number.isNaN(d.getTime())) return isoText || '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  };

  const loadHistory = async (withToast = false) => {
    try {
      const ts = Date.now();
      const res = await fetch(`http://127.0.0.1:8000/api/history?limit=20&_ts=${ts}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) throw new Error('history_fetch_failed');
      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items : [];
      state.history = items.map((item) => ({
        ...item,
        created_at_local: formatHistoryDate(item.created_at),
      }));
      if (typeof window.renderConversionHistory === 'function') {
        window.renderConversionHistory(state.history);
      }
      if (withToast) showToast('변환 이력 새로고침 완료', 'info');
    } catch {
      state.history = [];
      if (typeof window.renderConversionHistory === 'function') {
        window.renderConversionHistory(state.history);
      }
      if (withToast) showToast('변환 이력 조회 실패', 'warn');
    }
  };

  const setTemplateHint = (text) => {
    const hintEl = document.getElementById('template-server-hint');
    if (hintEl) hintEl.textContent = text;
  };

  const setHwpxButtons = (disabled) => {
    document.getElementById('btn-export-hwpx').disabled = disabled;
    const innerConvertBtn = document.getElementById('btn-convert-hwpx');
    if (innerConvertBtn) innerConvertBtn.disabled = disabled;
  };

  const syncServerUiByState = () => {
    if (state.serverState === 'online') {
      setHwpxButtons(false);
      setTemplateHint('서버 연결됨 (HWPX 변환 가능)');
      return;
    }
    if (state.serverState === 'warn') {
      setHwpxButtons(true);
      setTemplateHint('Pandoc 미설치 또는 설정 필요');
      return;
    }
    if (state.serverState === 'offline') {
      setHwpxButtons(true);
      setTemplateHint('python server.py 실행 필요');
      return;
    }
    setHwpxButtons(true);
    setTemplateHint('서버 상태 확인 중...');
  };

  const checkServer = async () => {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), 2000);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/health', { signal: c.signal });
      const json = await res.json();
      if (json.status === 'ok' && json.pandoc) {
        state.serverState = 'online';
        statusRight.textContent = '● 서버 online (Pandoc OK)';
        statusRight.dataset.state = 'online';
      } else {
        state.serverState = 'warn';
        statusRight.textContent = '● 서버 warn (Pandoc 없음)';
        statusRight.dataset.state = 'warn';
      }
    } catch {
      state.serverState = 'offline';
      statusRight.textContent = '● 서버 없음';
      statusRight.dataset.state = 'offline';
    } finally {
      clearTimeout(timer);
      syncServerUiByState();
      await loadTemplates();
      if (state.serverState === 'offline') {
        state.history = [];
        if (typeof window.renderConversionHistory === 'function') {
          window.renderConversionHistory(state.history);
        }
      } else {
        await loadHistory();
      }
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
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,.txt';
        input.onchange = async () => {
          const file = input.files[0];
          if (!file) return;
          state.filename = file.name;
          state.markdown = await file.text();
          normalizeInlineDataUrlsToAssets();
          editorEl.value = state.markdown;
          repaint();
        };
        input.click();
        return;
      }
      normalizeInlineDataUrlsToAssets();
      editorEl.value = state.markdown;
      repaint();
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
    const convertMode = state.settings.convertMode || 'template_match';
    if (btn.disabled) {
      showToast('서버를 먼저 실행하세요: python server.py', 'warn');
      return;
    }

    try {
      const fm = window.parseFrontmatter(state.markdown) || {};
      const assetsPayload = getReferencedAssetsPayload();
      let htmlContent = '';
      if (convertMode === 'style_priority') {
        if (typeof window.buildStyledHtmlForPandoc === 'function') {
          htmlContent = window.buildStyledHtmlForPandoc({
            markdown: state.markdown,
            settings: state.settings,
            assets: assetsPayload,
          });
        } else if (typeof window.composeDocumentHtml === 'function') {
          const composed = window.composeDocumentHtml(state.markdown, state.settings, { assets: assetsPayload, frontmatterMode: 'preview' });
          htmlContent = composed.htmlBody || '';
        }
      }
      const res = await fetch('http://127.0.0.1:8000/api/convert/hwpx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          md_content: state.markdown,
          mode: convertMode,
          html_content: htmlContent,
          template,
          filename: state.filename.replace(/\.[^/.]+$/, ''),
          metadata: {
            title: fm.title || '',
            subtitle: fm.subtitle || '',
            author: fm.author || '',
            date: fm.date || '',
            organization: fm.organization || '',
          },
          assets: assetsPayload,
          style_profile: {
            profile_name: state.settings.styleProfileName || '기본',
            exported_at: new Date().toISOString(),
            settings: state.settings,
          },
          settings: state.settings,
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
      await loadHistory();
    } catch (e) {
      showToast(e.message || 'HWPX 변환 실패', 'error');
    }
  };

  const setByPath = (obj, path, value) => {
    const keys = String(path).split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i += 1) {
      const k = keys[i];
      if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
      cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
  };

  const onSettingChange = (path, value) => {
    setByPath(state.settings, path, value);
    applySettings(state.settings);
  };

  const applyPreset = (id) => {
    const preset = window.loadPresets().find((p) => p.id === id);
    if (!preset) return;
    applySettings({ ...state.settings, ...preset.settings, margin: { ...state.settings.margin, ...(preset.settings.margin || {}) } });
    renderSettingsPanel();
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

  const exportStyleProfile = () => {
    try {
      const profile = {
        version: 1,
        profileName: state.settings.styleProfileName || '기본',
        exportedAt: new Date().toISOString(),
        settings: window.deepClone(state.settings),
      };
      const stamp = profile.exportedAt.slice(0, 10).replace(/-/g, '');
      const safeName = String(profile.profileName || 'style')
        .trim()
        .replace(/[^\w\-가-힣]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'style';
      const filename = `${safeName}_${stamp}.style.json`;
      const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('스타일 파일 내보내기 완료', 'success');
    } catch {
      showToast('스타일 파일 내보내기 실패', 'error');
    }
  };

  const importStyleProfile = async (file) => {
    try {
      const raw = await file.text();
      const json = JSON.parse(raw);
      const imported = (json && typeof json === 'object' && json.settings && typeof json.settings === 'object')
        ? json.settings
        : json;
      if (!imported || typeof imported !== 'object') {
        throw new Error('invalid_profile');
      }
      const importedName = (json && typeof json === 'object' && typeof json.profileName === 'string')
        ? json.profileName
        : file.name.replace(/\.[^.]+$/, '');
      const merged = mergeDeep(window.deepClone(window.defaultSettings), imported);
      merged.styleProfileName = merged.styleProfileName || importedName || '불러온 스타일';
      applySettings(merged);
      renderSettingsPanel();
      showToast('스타일 파일 불러오기 완료', 'success');
    } catch {
      showToast('스타일 파일 불러오기 실패', 'error');
    }
  };

  const renderSettingsPanel = () => {
    window.renderSettingsPanel(
      state.settings,
      onSettingChange,
      applyPreset,
      savePreset,
      deletePreset,
      {
        history: state.history,
        onRefreshHistory: () => loadHistory(true),
        onExportStyle: exportStyleProfile,
        onImportStyle: importStyleProfile,
      },
    );
    const convertBtn = document.getElementById('btn-convert-hwpx');
    if (convertBtn) convertBtn.addEventListener('click', exportHWPX);
    syncServerUiByState();
  };

  const replaceSelection = (build) => {
    const start = editorEl.selectionStart;
    const end = editorEl.selectionEnd;
    const selected = editorEl.value.slice(start, end);
    const out = build(selected, start, end);
    editorEl.setRangeText(out.text, start, end, 'end');
    if (typeof out.selectionStart === 'number' && typeof out.selectionEnd === 'number') {
      editorEl.setSelectionRange(out.selectionStart, out.selectionEnd);
    }
    editorEl.focus();
    onTextChanged();
  };

  const wrapSelection = (before, after, fallback = '텍스트') => {
    replaceSelection((selected, start) => {
      const content = selected || fallback;
      const text = `${before}${content}${after}`;
      const contentStart = start + before.length;
      return {
        text,
        selectionStart: contentStart,
        selectionEnd: contentStart + content.length,
      };
    });
  };

  const replaceSelectedLines = (lineMapper) => {
    const text = editorEl.value;
    const start = editorEl.selectionStart;
    const end = editorEl.selectionEnd;
    const blockStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    let blockEnd = text.indexOf('\n', end);
    if (blockEnd === -1) blockEnd = text.length;
    const block = text.slice(blockStart, blockEnd);
    const mapped = block
      .split('\n')
      .map((line, idx) => lineMapper(line, idx))
      .join('\n');
    editorEl.setRangeText(mapped, blockStart, blockEnd, 'select');
    editorEl.focus();
    onTextChanged();
  };

  const insertBlock = (text) => {
    replaceSelection((selected, start) => {
      const out = selected ? `${selected}\n${text}` : text;
      const cursor = start + out.length;
      return { text: out, selectionStart: cursor, selectionEnd: cursor };
    });
  };

  const setHeading = (level) => {
    const prefix = `${'#'.repeat(level)} `;
    replaceSelectedLines((line) => {
      if (!line.trim()) return line;
      return `${prefix}${line.replace(/^\s*#{1,6}\s+/, '')}`;
    });
  };

  const setParagraph = () => {
    replaceSelectedLines((line) => line.replace(/^\s*#{1,6}\s+/, ''));
  };

  const setUnorderedList = () => {
    replaceSelectedLines((line) => {
      if (!line.trim()) return line;
      return `- ${line.replace(/^\s*(?:[-*+]\s+|\d+\.\s+)/, '')}`;
    });
  };

  const setOrderedList = () => {
    replaceSelectedLines((line, idx) => {
      if (!line.trim()) return line;
      return `${idx + 1}. ${line.replace(/^\s*(?:[-*+]\s+|\d+\.\s+)/, '')}`;
    });
  };

  const insertTable = () => {
    insertBlock('| 항목 | 내용 |\n| --- | --- |\n| 예시1 | 값1 |\n| 예시2 | 값2 |');
    showToast('표 마크다운을 삽입했습니다', 'success');
  };

  const createAssetId = () => `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const registerAsset = (file, dataUrl) => {
    const id = createAssetId();
    state.assets[id] = {
      name: file?.name || `image-${id}.png`,
      type: file?.type || 'image/png',
      dataUrl,
    };
    persistAssets();
    return id;
  };

  const normalizeInlineDataUrlsToAssets = () => {
    const pattern = /!\[([^\]]*)\]\((data:image\/[-\w.+]+;base64,[A-Za-z0-9+/=\s]+)\)/g;
    let changed = false;
    state.markdown = state.markdown.replace(pattern, (full, alt, dataUrl) => {
      const mime = (String(dataUrl).match(/^data:(image\/[-\w.+]+);base64,/) || [])[1] || 'image/png';
      const ext = mime.includes('jpeg') ? 'jpg' : (mime.split('/')[1] || 'png');
      const name = (alt && String(alt).trim()) ? String(alt).trim() : `image-${Date.now()}.${ext}`;
      const id = registerAsset({ name, type: mime }, dataUrl);
      changed = true;
      return `![${alt || name}](asset://${id})`;
    });
    if (changed) {
      editorEl.value = state.markdown;
      localStorage.setItem('md-hwpx-content', state.markdown);
      showToast('기존 base64 이미지를 내부 링크로 정리했습니다', 'info');
    }
  };

  const insertImage = async () => {
    const insertByPrompt = () => {
      const url = prompt('이미지 URL 또는 경로', './image.png');
      if (!url) return;
      const alt = prompt('대체 텍스트', '이미지') || '이미지';
      insertBlock(`![${alt}](${url})`);
      showToast('이미지 마크다운을 삽입했습니다', 'success');
    };

    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Images', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'] } }],
          excludeAcceptAllOption: false,
          multiple: false,
        });
        const file = await handle.getFile();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const id = registerAsset(file, dataUrl);
        const widthText = prompt('이미지 폭(px, 선택)', '');
        const width = Number(String(widthText || '').trim());
        const alt = (Number.isFinite(width) && width > 0)
          ? `${file.name}|${Math.round(width)}`
          : file.name;
        insertBlock(`![${alt}](asset://${id})`);
        showToast('이미지 마크다운을 삽입했습니다', 'success');
        return;
      } catch {
        // fallback prompt
      }
    }
    insertByPrompt();
  };

  const showPresetPicker = () => {
    const presets = window.loadPresets();
    if (!presets.length) {
      showToast('사용 가능한 프리셋이 없습니다', 'warn');
      return;
    }

    const text = presets.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    const pick = prompt(`적용할 프리셋 번호를 입력하세요.\n\n${text}`);
    if (!pick) return;
    const idx = Number(pick) - 1;
    if (!Number.isInteger(idx) || !presets[idx]) {
      showToast('유효한 번호를 입력하세요', 'warn');
      return;
    }
    applyPreset(presets[idx].id);
    setSettingsPanelOpen(true);
  };

  const attachToolbarHandlers = () => {
    const bind = (id, handler) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', handler);
    };

    bind('btn-fmt-bold', () => wrapSelection('**', '**'));
    bind('btn-fmt-italic', () => wrapSelection('*', '*'));
    bind('btn-fmt-strike', () => wrapSelection('~~', '~~'));
    bind('btn-fmt-code', () => wrapSelection('`', '`', 'code'));
    bind('btn-fmt-link', () => wrapSelection('[', '](https://example.com)', '링크 텍스트'));
    bind('btn-fmt-quote', () => replaceSelectedLines((line) => (line.trim() ? `> ${line.replace(/^\s*>\s+/, '')}` : line)));
    bind('btn-fmt-ul', setUnorderedList);
    bind('btn-fmt-ol', setOrderedList);
    bind('btn-fmt-hr', () => insertBlock('\n---\n'));

    bind('btn-insert-table', insertTable);
    bind('btn-insert-image', insertImage);
    bind('btn-toolbar-presets', showPresetPicker);
    bind('btn-toggle-settings', () => setSettingsPanelOpen(!state.settingsPanelOpen));
    bind('btn-help', () => {
      alert([
        '주요 단축키',
        'Ctrl+S: 저장',
        'Ctrl+O: 열기',
        'Ctrl+1/2/3: 편집/분할/미리보기',
        'Ctrl+B/I: 굵게/기울임',
        'Ctrl+Shift+W: HWPX 변환',
      ].join('\n'));
    });

    const blockSelect = document.getElementById('fmt-block');
    if (blockSelect) {
      blockSelect.addEventListener('change', () => {
        const m = blockSelect.value.match(/^h([1-6])$/);
        if (m) setHeading(Number(m[1]));
        else if (blockSelect.value === 'p') setParagraph();
        blockSelect.value = 'p';
      });
    }
  };

  const initSplitter = () => {
    let dragging = false;

    const onMove = (e) => {
      if (!dragging || state.viewMode !== 'split') return;
      const rect = workspaceEl.getBoundingClientRect();
      const settingsWidth = state.settingsPanelOpen ? settingsPanelEl.getBoundingClientRect().width : 0;
      const usable = rect.width - settingsWidth - splitterEl.getBoundingClientRect().width;
      if (usable < 200) return;
      const x = e.clientX - rect.left;
      applySplitRatio(x / usable);
    };

    const stop = () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    splitterEl.addEventListener('mousedown', (e) => {
      if (state.viewMode !== 'split') return;
      dragging = true;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('resize', () => applySplitRatio(state.splitRatio));
  };

  const initScrollSync = () => {
    let syncingFromEditor = false;

    const syncToPreviewByScroll = () => {
      if (state.viewMode === 'edit') return;
      const editorMax = Math.max(1, editorEl.scrollHeight - editorEl.clientHeight);
      const previewMax = Math.max(1, previewBgEl.scrollHeight - previewBgEl.clientHeight);
      const ratio = editorEl.scrollTop / editorMax;
      syncingFromEditor = true;
      previewBgEl.scrollTop = ratio * previewMax;
      requestAnimationFrame(() => { syncingFromEditor = false; });
    };

    syncPreviewToCaret = () => {
      if (syncingFromEditor || state.viewMode === 'edit') return;
      const totalLines = Math.max(1, state.markdown.split('\n').length);
      const caret = window.getCaretInfo(editorEl);
      const lineRatio = totalLines <= 1 ? 0 : (Math.max(1, caret.line) - 1) / (totalLines - 1);
      const previewMax = Math.max(1, previewBgEl.scrollHeight - previewBgEl.clientHeight);
      syncingFromEditor = true;
      previewBgEl.scrollTop = lineRatio * previewMax;
      requestAnimationFrame(() => { syncingFromEditor = false; });
    };

    editorEl.addEventListener('scroll', syncToPreviewByScroll);
    ['click', 'keyup', 'input'].forEach((ev) => {
      editorEl.addEventListener(ev, () => requestAnimationFrame(syncPreviewToCaret));
    });
  };

  window.bindEditor({ editorEl, onTextChanged });
  window.bindExportButtons(() => ({
    markdown: state.markdown,
    settings: state.settings,
    filename: state.filename,
    assets: getReferencedAssetsPayload(),
  }));
  renderSettingsPanel();
  attachToolbarHandlers();
  initSplitter();
  initScrollSync();
  normalizeInlineDataUrlsToAssets();

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
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') { e.preventDefault(); window.exportHTMLWeb({ markdown: state.markdown, settings: state.settings, filename: state.filename, assets: getReferencedAssetsPayload() }); }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') { e.preventDefault(); window.exportHTMLforHWP({ markdown: state.markdown, settings: state.settings, filename: state.filename, assets: getReferencedAssetsPayload() }); }
    if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); window.exportPDF({ markdown: state.markdown, settings: state.settings, assets: getReferencedAssetsPayload() }); }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'w') { e.preventDefault(); exportHWPX(); }
    if (e.ctrlKey && e.key.toLowerCase() === 'b') { e.preventDefault(); wrapSelection('**', '**'); }
    if (e.ctrlKey && e.key.toLowerCase() === 'i') { e.preventDefault(); wrapSelection('*', '*'); }
  });

  editorEl.value = state.markdown;
  const zoomLabel = document.getElementById('zoom-label');
  if (zoomLabel) zoomLabel.textContent = `${Math.round((Number(state.settings.scale) || 1) * 100)}%`;
  setTheme(localStorage.getItem('mdhwpx.theme') || 'light');
  setSettingsPanelOpen(state.settingsPanelOpen);
  setViewMode(state.viewMode);
  repaint();
  loadTemplates();
  checkServer();
  setInterval(checkServer, 5000);
})();
