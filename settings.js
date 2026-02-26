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

window.renderSettingsPanel = function renderSettingsPanel(settings, onChange, onApplyPreset, onSavePreset, onDeletePreset) {
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

    ${section('📋 HWPX 템플릿', `
      <label>템플릿<select id="set-template"><option>서버 없음</option></select></label>
      <button id="btn-convert-hwpx" disabled>HWPX 변환</button>
      <p class="hint" id="template-server-hint">서버 상태 확인 중...</p>
    `, 'sec-template')}

    ${section('💾 프리셋', `
      <div class="preset-actions"><button id="btn-preset-save">현재 설정 저장</button></div>
      <ul id="preset-list" class="preset-list"></ul>
    `, 'sec-presets')}
  `;

  const bindInput = (id, key, parseFn = (v) => v) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = settings[key];
    el.addEventListener('change', () => onChange(key, parseFn(el.value)));
  };
  const bindCheck = (id, key) => {
    const el = document.getElementById(id);
    el.checked = settings[key];
    el.addEventListener('change', () => onChange(key, el.checked));
  };
  const bindMargin = (id, key) => {
    const el = document.getElementById(id);
    el.value = settings.margin[key];
    el.addEventListener('change', () => onChange(`margin.${key}`, el.value));
  };

  bindInput('set-fontFamily', 'fontFamily');
  bindInput('set-customFontFamily', 'customFontFamily');
  bindInput('set-fontSize', 'fontSize', Number);
  bindInput('set-lineHeight', 'lineHeight', Number);
  bindInput('set-wordBreak', 'wordBreak');
  bindInput('set-textIndent', 'textIndent');
  bindInput('set-tableStyle', 'tableStyle');
  bindInput('set-headingStyle', 'headingStyle');
  bindMargin('set-margin-top', 'top');
  bindMargin('set-margin-right', 'right');
  bindMargin('set-margin-bottom', 'bottom');
  bindMargin('set-margin-left', 'left');
  bindCheck('set-pageBreakBeforeH1', 'pageBreakBeforeH1');
  bindCheck('set-pageBreakBeforeH2', 'pageBreakBeforeH2');
  bindCheck('set-pageBreakBeforeH3', 'pageBreakBeforeH3');

  const customWrap = document.getElementById('set-custom-wrap');
  const toggleCustom = () => { customWrap.style.display = settings.fontFamily === 'custom' ? 'block' : 'none'; };
  document.getElementById('set-fontFamily').addEventListener('change', toggleCustom);
  toggleCustom();

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
};
