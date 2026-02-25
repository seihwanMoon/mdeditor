window.savePreset = function savePreset(name, settings) {
  const presets = JSON.parse(localStorage.getItem('mdhwpx.presets') || '{}');
  presets[name] = settings;
  localStorage.setItem('mdhwpx.presets', JSON.stringify(presets));
};

window.loadPreset = function loadPreset(name) {
  const presets = JSON.parse(localStorage.getItem('mdhwpx.presets') || '{}');
  return presets[name] || null;
};
