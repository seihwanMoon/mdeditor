function download(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

window.bindExportButtons = function bindExportButtons(getState) {
  document.getElementById('btn-save').addEventListener('click', () => {
    const { markdown } = getState();
    download('document.md', markdown, 'text/markdown');
  });
  document.getElementById('btn-export-web').addEventListener('click', () => {
    const iframe = document.getElementById('preview-iframe');
    download('document-web.html', iframe.srcdoc, 'text/html');
  });
  document.getElementById('btn-export-hangul').addEventListener('click', () => {
    const iframe = document.getElementById('preview-iframe');
    download('document-hangul.html', iframe.srcdoc.replace(/<style>/, '<style>@page{size:A4;margin:0;}'), 'text/html');
  });
  document.getElementById('btn-export-pdf').addEventListener('click', () => window.print());
};
