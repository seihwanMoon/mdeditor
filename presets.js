const PRESET_STORAGE_KEY = 'md-hwpx-presets';

window.BUILTIN_PRESETS = [
  {
    id: 'public-office',
    name: '공공기관',
    builtIn: true,
    settings: {
      fontFamily: 'malgun',
      fontSize: 10,
      lineHeight: 1.7,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      tableStyle: 'hwp',
      headingStyle: 'default',
    },
  },
  {
    id: 'academic',
    name: '학술',
    builtIn: true,
    settings: {
      fontFamily: 'nanum-myeongjo',
      fontSize: 10,
      lineHeight: 1.8,
      margin: { top: '25mm', right: '20mm', bottom: '20mm', left: '25mm' },
      tableStyle: 'apa',
      headingStyle: 'apa',
    },
  },
  {
    id: 'report',
    name: '보고서',
    builtIn: true,
    settings: {
      fontFamily: 'pretendard',
      fontSize: 10.5,
      lineHeight: 1.6,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      tableStyle: 'minimal',
      headingStyle: 'numbered-box',
    },
  },
];

window.loadPresets = function loadPresets() {
  const custom = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY) || '[]');
  return [...window.BUILTIN_PRESETS, ...custom];
};

window.saveCurrentAsPreset = function saveCurrentAsPreset(name, settings) {
  const custom = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY) || '[]');
  const id = `custom-${Date.now()}`;
  custom.push({ id, name, builtIn: false, settings });
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(custom));
  return id;
};

window.deletePreset = function deletePreset(id) {
  const custom = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY) || '[]');
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(custom.filter((p) => p.id !== id)));
};
