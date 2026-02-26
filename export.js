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

function buildRenderedDocument(markdown, settings, assets = {}) {
  const resolved = window.resolveMarkdownAssets(markdown, assets);
  const sized = window.applyImageSizeSyntax(resolved);
  const fm = window.parseFrontmatter(sized);
  const md = window.stripFrontmatter(sized);
  const body = marked.parse(md, { breaks: settings.breaks, gfm: true });
  return {
    fm,
    body,
    html: window.buildIframeDoc((fm ? window.buildFrontmatterHeader(fm) : '') + body, settings),
  };
}

window.exportHTMLWeb = function exportHTMLWeb({ markdown, settings, filename, assets = {} }) {
  const { html } = buildRenderedDocument(markdown, settings, assets);
  download(`${filenameBase(filename)}.html`, html, 'text/html');
};

window.exportHTMLforHWP = function exportHTMLforHWP({ markdown, settings, filename, assets = {} }) {
  const resolved = window.resolveMarkdownAssets(markdown, assets);
  const sized = window.applyImageSizeSyntax(resolved);
  const fm = window.parseFrontmatter(sized);
  const md = window.stripFrontmatter(sized);
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

window.exportPDF = function exportPDF({ markdown, settings, assets = {} }) {
  const { html } = buildRenderedDocument(markdown, settings, assets);
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    window.print();
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  const runPrint = () => {
    win.focus();
    win.print();
  };
  if (win.document.readyState === 'complete') runPrint();
  else win.addEventListener('load', runPrint, { once: true });
};

window.bindExportButtons = function bindExportButtons(getState) {
  document.getElementById('btn-export-web').addEventListener('click', () => window.exportHTMLWeb(getState()));
  document.getElementById('btn-export-hangul').addEventListener('click', () => window.exportHTMLforHWP(getState()));
  document.getElementById('btn-export-pdf').addEventListener('click', () => window.exportPDF(getState()));
};
