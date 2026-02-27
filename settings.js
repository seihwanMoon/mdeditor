window.defaultSettings = {
  fontFamily: 'nanum-gothic',
  customFontFamily: '',
  fontSize: 10,
  lineHeight: 1.6,
  wordBreak: 'keep-all',
  textIndent: '0',
  margin: { top: '15mm', right: '20mm', bottom: '15mm', left: '20mm' },
  tableStyle: 'hwp',
  headingStyle: 'default',
  pageBreakBeforeH1: false,
  pageBreakBeforeH2: false,
  pageBreakBeforeH3: false,
  breaks: true,
  highlight: true,
  scale: 1,
  specialPages: {
    coverPage: false,
    tocPage: false,
    tocDepth: 2,
  },
  header: {
    left: 'none',
    center: 'none',
    right: 'none',
    customLeft: '',
    customCenter: '',
    customRight: '',
  },
  footer: {
    left: 'none',
    center: 'none',
    right: 'none',
    customLeft: '',
    customCenter: '',
    customRight: '',
  },
};

window.FONT_MAP = {
  'nanum-gothic': "'NanumGothic', '나눔고딕', sans-serif",
  'nanum-myeongjo': "'NanumMyeongjo', '나눔명조', serif",
  malgun: "'Malgun Gothic', '맑은 고딕', sans-serif",
  pretendard: "'Pretendard', sans-serif",
  custom: null,
};

window.deepClone = (v) => JSON.parse(JSON.stringify(v));

function section(title, body, id) {
  return `<details open><summary>${title}</summary><div class="settings-body" id="${id}">${body}</div></details>`;
}

window.renderSettingsPanel = function renderSettingsPanel(
  settings,
  onChange,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  options = {},
) {
  let historyItems = Array.isArray(options.history) ? options.history : [];
  const onRefreshHistory = typeof options.onRefreshHistory === 'function' ? options.onRefreshHistory : () => {};
  const slotOptions = `
    <option value="none">없음</option>
    <option value="title">제목</option>
    <option value="date">날짜</option>
    <option value="custom">사용자지정</option>
  `;

  const panel = document.getElementById('settings-panel');
  panel.innerHTML = `
    <h3>⚙ 문서 설정</h3>
    ${section('T 글꼴', `
      <label>폰트
        <select id="set-fontFamily">
          <option value="nanum-gothic">나눔고딕</option>
          <option value="nanum-myeongjo">나눔명조</option>
          <option value="malgun">맑은고딕</option>
          <option value="pretendard">Pretendard</option>
          <option value="custom">사용자 지정</option>
        </select>
      </label>
      <label id="set-custom-wrap">사용자 지정 폰트<input id="set-customFontFamily" type="text" placeholder="'Apple SD Gothic Neo', sans-serif"/></label>
      <label>크기(pt)<input id="set-fontSize" type="number" min="6" step="0.5" /></label>
      <label>줄 간격<input id="set-lineHeight" type="number" min="1" step="0.1" /></label>
      <label>줄바꿈
        <select id="set-wordBreak">
          <option value="keep-all">단어단위</option>
          <option value="break-all">글자단위</option>
          <option value="normal">기본</option>
        </select>
      </label>
      <label>들여쓰기<input id="set-textIndent" type="text" /></label>
    `, 'sec-font')}

    ${section('▦ 여백', `
      <div class="grid2">
        <label>상단<input id="set-margin-top" type="text" /></label>
        <label>우측<input id="set-margin-right" type="text" /></label>
        <label>하단<input id="set-margin-bottom" type="text" /></label>
        <label>좌측<input id="set-margin-left" type="text" /></label>
      </div>
    `, 'sec-margin')}

    ${section('⊞ 표 스타일', `<label>스타일<select id="set-tableStyle"><option value="hwp">관공서(HWP)</option><option value="apa">APA</option><option value="minimal">최소</option><option value="none">없음</option></select></label>`, 'sec-table')}
    ${section('H 제목 스타일', `<label>스타일<select id="set-headingStyle"><option value="default">기본</option><option value="numbered-box">번호 박스</option><option value="apa">APA</option></select></label>`, 'sec-heading')}

    ${section('⏤ 페이지 나누기', `
      <label><input id="set-pageBreakBeforeH1" type="checkbox" /> H1 앞에서</label>
      <label><input id="set-pageBreakBeforeH2" type="checkbox" /> H2 앞에서</label>
      <label><input id="set-pageBreakBeforeH3" type="checkbox" /> H3 앞에서</label>
    `, 'sec-break')}

    ${section('🧩 특수 페이지', `
      <label><input id="set-special-coverPage" type="checkbox" /> 표지 페이지</label>
      <label><input id="set-special-tocPage" type="checkbox" /> 목차 페이지</label>
      <label>목차 깊이<input id="set-special-tocDepth" type="number" min="1" max="6" step="1" /></label>
    `, 'sec-special')}

    ${section('🧾 헤더/푸터', `
      <h4>헤더</h4>
      <div class="grid3">
        <label>좌<select id="set-header-left">${slotOptions}</select></label>
        <label>중<select id="set-header-center">${slotOptions}</select></label>
        <label>우<select id="set-header-right">${slotOptions}</select></label>
      </div>
      <label id="set-header-customLeft-wrap">헤더 좌(사용자지정)<input id="set-header-customLeft" type="text" /></label>
      <label id="set-header-customCenter-wrap">헤더 중(사용자지정)<input id="set-header-customCenter" type="text" /></label>
      <label id="set-header-customRight-wrap">헤더 우(사용자지정)<input id="set-header-customRight" type="text" /></label>
      <h4>푸터</h4>
      <div class="grid3">
        <label>좌<select id="set-footer-left">${slotOptions}</select></label>
        <label>중<select id="set-footer-center">${slotOptions}</select></label>
        <label>우<select id="set-footer-right">${slotOptions}</select></label>
      </div>
      <label id="set-footer-customLeft-wrap">푸터 좌(사용자지정)<input id="set-footer-customLeft" type="text" /></label>
      <label id="set-footer-customCenter-wrap">푸터 중(사용자지정)<input id="set-footer-customCenter" type="text" /></label>
      <label id="set-footer-customRight-wrap">푸터 우(사용자지정)<input id="set-footer-customRight" type="text" /></label>
    `, 'sec-header-footer')}

    ${section('📋 HWPX 템플릿', `
      <label>템플릿<select id="set-template"><option>서버 없음</option></select></label>
      <button id="btn-convert-hwpx" disabled>HWPX 변환</button>
      <p class="hint" id="template-server-hint">서버 상태 확인 중...</p>
    `, 'sec-template')}

    ${section('💾 프리셋', `
      <div class="preset-actions"><button id="btn-preset-save">현재 설정 저장</button></div>
      <ul id="preset-list" class="preset-list"></ul>
    `, 'sec-presets')}

    ${section('🕘 변환 이력', `
      <div class="preset-actions"><button id="btn-history-refresh">새로고침</button></div>
      <ul id="history-list" class="history-list"></ul>
    `, 'sec-history')}
  `;

  const getByPath = (obj, path) => path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);

  const bindInput = (id, path, parseFn = (v) => v) => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = getByPath(settings, path);
    el.value = val == null ? '' : val;
    el.addEventListener('change', () => onChange(path, parseFn(el.value)));
  };
  const bindCheck = (id, path) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = !!getByPath(settings, path);
    el.addEventListener('change', () => onChange(path, el.checked));
  };

  bindInput('set-fontFamily', 'fontFamily');
  bindInput('set-customFontFamily', 'customFontFamily');
  bindInput('set-fontSize', 'fontSize', Number);
  bindInput('set-lineHeight', 'lineHeight', Number);
  bindInput('set-wordBreak', 'wordBreak');
  bindInput('set-textIndent', 'textIndent');
  bindInput('set-tableStyle', 'tableStyle');
  bindInput('set-headingStyle', 'headingStyle');
  bindInput('set-margin-top', 'margin.top');
  bindInput('set-margin-right', 'margin.right');
  bindInput('set-margin-bottom', 'margin.bottom');
  bindInput('set-margin-left', 'margin.left');
  bindCheck('set-pageBreakBeforeH1', 'pageBreakBeforeH1');
  bindCheck('set-pageBreakBeforeH2', 'pageBreakBeforeH2');
  bindCheck('set-pageBreakBeforeH3', 'pageBreakBeforeH3');
  bindCheck('set-special-coverPage', 'specialPages.coverPage');
  bindCheck('set-special-tocPage', 'specialPages.tocPage');
  bindInput('set-special-tocDepth', 'specialPages.tocDepth', (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(6, Math.max(1, Math.round(n))) : 2;
  });

  bindInput('set-header-left', 'header.left');
  bindInput('set-header-center', 'header.center');
  bindInput('set-header-right', 'header.right');
  bindInput('set-header-customLeft', 'header.customLeft');
  bindInput('set-header-customCenter', 'header.customCenter');
  bindInput('set-header-customRight', 'header.customRight');

  bindInput('set-footer-left', 'footer.left');
  bindInput('set-footer-center', 'footer.center');
  bindInput('set-footer-right', 'footer.right');
  bindInput('set-footer-customLeft', 'footer.customLeft');
  bindInput('set-footer-customCenter', 'footer.customCenter');
  bindInput('set-footer-customRight', 'footer.customRight');

  const customWrap = document.getElementById('set-custom-wrap');
  const toggleCustom = () => { customWrap.style.display = settings.fontFamily === 'custom' ? 'block' : 'none'; };
  document.getElementById('set-fontFamily').addEventListener('change', toggleCustom);
  toggleCustom();

  const toggleTocDepth = () => {
    const tocPage = document.getElementById('set-special-tocPage');
    const tocDepth = document.getElementById('set-special-tocDepth');
    if (!tocPage || !tocDepth) return;
    tocDepth.disabled = !tocPage.checked;
  };
  document.getElementById('set-special-tocPage').addEventListener('change', toggleTocDepth);
  toggleTocDepth();

  const toggleSlotCustom = (group, slot) => {
    const sel = document.getElementById(`set-${group}-${slot}`);
    const wrap = document.getElementById(`set-${group}-custom${slot[0].toUpperCase()}${slot.slice(1)}-wrap`);
    if (!sel || !wrap) return;
    wrap.style.display = sel.value === 'custom' ? 'block' : 'none';
  };
  ['left', 'center', 'right'].forEach((slot) => {
    const hSel = document.getElementById(`set-header-${slot}`);
    if (hSel) hSel.addEventListener('change', () => toggleSlotCustom('header', slot));
    const fSel = document.getElementById(`set-footer-${slot}`);
    if (fSel) fSel.addEventListener('change', () => toggleSlotCustom('footer', slot));
    toggleSlotCustom('header', slot);
    toggleSlotCustom('footer', slot);
  });

  const list = document.getElementById('preset-list');
  const renderPresetList = () => {
    list.innerHTML = '';
    window.loadPresets().forEach((preset) => {
      const li = document.createElement('li');
      li.innerHTML = `<button class="preset-apply" data-id="${preset.id}">${preset.name}</button>${preset.builtIn ? '' : `<button class="preset-del" data-id="${preset.id}">삭제</button>`}`;
      list.appendChild(li);
    });
  };
  renderPresetList();

  list.addEventListener('click', (e) => {
    const applyId = e.target.getAttribute('data-id');
    if (!applyId) return;
    if (e.target.classList.contains('preset-apply')) {
      onApplyPreset(applyId);
    }
    if (e.target.classList.contains('preset-del')) {
      onDeletePreset(applyId);
      renderPresetList();
    }
  });

  document.getElementById('btn-preset-save').addEventListener('click', () => {
    const name = prompt('프리셋 이름');
    if (!name) return;
    onSavePreset(name);
    renderPresetList();
  });

  const renderHistoryList = (entries = []) => {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    historyList.innerHTML = '';
    if (!entries.length) {
      historyList.innerHTML = '<li class="history-empty">변환 이력이 없습니다.</li>';
      return;
    }
    entries.forEach((item) => {
      const li = document.createElement('li');
      const dateText = item.created_at_local || item.created_at || '';
      const sizeText = Number.isFinite(item.size_bytes) ? `${Math.round(item.size_bytes / 1024)}KB` : '-';
      li.innerHTML = `<strong>${item.filename || 'document.hwpx'}</strong><small>${dateText} · ${item.template || '-'} · ${sizeText}</small>`;
      historyList.appendChild(li);
    });
  };

  window.renderConversionHistory = (entries = []) => {
    historyItems = Array.isArray(entries) ? entries : [];
    renderHistoryList(historyItems);
  };

  renderHistoryList(historyItems);
  document.getElementById('btn-history-refresh').addEventListener('click', () => onRefreshHistory());
};
