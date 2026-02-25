function download(filename, text, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function filenameBase(name = 'document.md') {
  return name.replace(/\.[^/.]+$/, '') || 'document';
}

window.exportHTMLWeb = function exportHTMLWeb({ markdown, settings, filename }) {
  const fm = window.parseFrontmatter(markdown);
  const md = window.stripFrontmatter(markdown);
  const body = marked.parse(md, { breaks: settings.breaks, gfm: true });
  const html = window.buildIframeDoc((fm ? window.buildFrontmatterHeader(fm) : '') + body, settings);
  download(`${filenameBase(filename)}.html`, html, 'text/html');
};

window.exportHTMLforHWP = function exportHTMLforHWP({ markdown, settings, filename }) {
  const fm = window.parseFrontmatter(markdown);
  const md = window.stripFrontmatter(markdown);
  const body = marked.parse(md, { breaks: settings.breaks, gfm: true });
  const html = window.buildIframeDoc((fm ? window.buildFrontmatterHWP(fm, window.FONT_MAP[settings.fontFamily] || 'sans-serif') : '') + body, settings);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('[class]').forEach((n) => n.removeAttribute('class'));
  doc.querySelectorAll('table,th,td,p,h1,h2,h3,h4,h5,h6,blockquote,pre,code,ul,ol,li').forEach((el) => {
    if (!el.getAttribute('style')) el.setAttribute('style', '');
  });
  download(`${filenameBase(filename)}_hwp.html`, `<!doctype html>${doc.documentElement.outerHTML}`, 'text/html');
};

window.exportPDF = function exportPDF() {
  window.print();
};

window.bindExportButtons = function bindExportButtons(getState) {
  document.getElementById('btn-export-web').addEventListener('click', () => window.exportHTMLWeb(getState()));
  document.getElementById('btn-export-hangul').addEventListener('click', () => window.exportHTMLforHWP(getState()));
  document.getElementById('btn-export-pdf').addEventListener('click', () => window.exportPDF());
};
