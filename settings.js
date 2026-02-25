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

window.renderSettingsPanel = function renderSettingsPanel(settings, onChange) {
  const panel = document.getElementById('settings-panel');
  panel.innerHTML = `
    <h3>설정</h3>
    <label>폰트
      <select id="set-fontFamily">
        <option value="nanum-gothic">나눔고딕</option>
        <option value="nanum-myeongjo">나눔명조</option>
        <option value="malgun">맑은고딕</option>
        <option value="pretendard">Pretendard</option>
      </select>
    </label>
    <label>글자 크기 (pt)<input id="set-fontSize" type="number" min="8" max="24" /></label>
    <label>줄간격<input id="set-lineHeight" type="number" min="1" max="3" step="0.1" /></label>
    <label>테이블 스타일
      <select id="set-tableStyle">
        <option value="hwp">HWP</option>
        <option value="apa">APA</option>
        <option value="minimal">Minimal</option>
        <option value="none">None</option>
      </select>
    </label>
  `;

  const bind = (id, key, parseFn = (v) => v) => {
    const el = document.getElementById(id);
    el.value = settings[key];
    el.addEventListener('change', () => onChange(key, parseFn(el.value)));
  };
  bind('set-fontFamily', 'fontFamily');
  bind('set-fontSize', 'fontSize', Number);
  bind('set-lineHeight', 'lineHeight', Number);
  bind('set-tableStyle', 'tableStyle');
};
