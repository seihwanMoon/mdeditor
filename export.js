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

function buildRenderedDocument(markdown, settings, assets = {}, frontmatterMode = 'preview') {
  const composed = window.composeDocumentHtml(markdown, settings, { assets, frontmatterMode });
  return {
    fm: composed.fm,
    body: composed.body,
    html: window.buildIframeDoc(composed.htmlBody, settings, composed.fm || {}),
  };
}

function appendInlineStyle(el, styleText) {
  if (!el || !styleText) return;
  const cur = (el.getAttribute('style') || '').trim();
  const head = cur ? (cur.endsWith(';') ? cur : `${cur};`) : '';
  el.setAttribute('style', `${head}${styleText}`);
}

function replaceTag(doc, oldTag, newTag) {
  doc.querySelectorAll(oldTag).forEach((oldEl) => {
    const newEl = doc.createElement(newTag);
    [...oldEl.attributes].forEach((attr) => newEl.setAttribute(attr.name, attr.value));
    while (oldEl.firstChild) newEl.appendChild(oldEl.firstChild);
    oldEl.replaceWith(newEl);
  });
}

function hwpFontFamily(settings) {
  if (settings.fontFamily === 'custom') return settings.customFontFamily || 'Malgun Gothic';
  const raw = window.FONT_MAP[settings.fontFamily] || window.FONT_MAP['nanum-gothic'] || 'Malgun Gothic';
  return String(raw).split(',')[0].replace(/['"]/g, '').trim() || 'Malgun Gothic';
}

window.exportHTMLWeb = function exportHTMLWeb({ markdown, settings, filename, assets = {} }) {
  const { html } = buildRenderedDocument(markdown, settings, assets);
  download(`${filenameBase(filename)}.html`, html, 'text/html');
};

window.exportHTMLforHWP = function exportHTMLforHWP({ markdown, settings, filename, assets = {} }) {
  const composed = window.composeDocumentHtml(markdown, settings, { assets, frontmatterMode: 'hwp' });
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="hwp-root">${composed.htmlBody}</div>`, 'text/html');
  const root = doc.getElementById('hwp-root');
  if (!root) return;

  ['section', 'main', 'article', 'header', 'footer', 'aside', 'nav'].forEach((tag) => replaceTag(doc, tag, 'div'));
  root.querySelectorAll('script,style,link').forEach((n) => n.remove());

  root.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name === 'class' || attr.name.startsWith('data-')) el.removeAttribute(attr.name);
    });
  });

  const font = hwpFontFamily(settings);
  const baseText = `font-family:${font};font-size:${settings.fontSize}pt;line-height:${settings.lineHeight};`;

  appendInlineStyle(root, baseText);
  root.querySelectorAll('p').forEach((el) => appendInlineStyle(el, `${baseText}margin:0 0 8pt;text-indent:${settings.textIndent};`));
  root.querySelectorAll('h1').forEach((el) => appendInlineStyle(el, `${baseText}font-size:22pt;font-weight:bold;margin:16pt 0 10pt;`));
  root.querySelectorAll('h2').forEach((el) => appendInlineStyle(el, `${baseText}font-size:18pt;font-weight:bold;margin:14pt 0 8pt;`));
  root.querySelectorAll('h3').forEach((el) => appendInlineStyle(el, `${baseText}font-size:15pt;font-weight:bold;margin:12pt 0 6pt;`));
  root.querySelectorAll('h4,h5,h6').forEach((el) => appendInlineStyle(el, `${baseText}font-size:13pt;font-weight:bold;margin:10pt 0 6pt;`));
  root.querySelectorAll('ul,ol').forEach((el) => appendInlineStyle(el, `${baseText}margin:6pt 0 8pt 20pt;padding:0;`));
  root.querySelectorAll('li').forEach((el) => appendInlineStyle(el, `${baseText}margin:2pt 0;`));
  root.querySelectorAll('blockquote').forEach((el) => appendInlineStyle(el, `${baseText}margin:8pt 0;padding-left:10pt;border-left:1pt solid #999;`));
  root.querySelectorAll('pre').forEach((el) => appendInlineStyle(el, `${baseText}white-space:pre-wrap;border:1px solid #bbb;padding:8pt;margin:8pt 0;`));
  root.querySelectorAll('code').forEach((el) => appendInlineStyle(el, 'font-family:Consolas, monospace;'));
  root.querySelectorAll('table').forEach((el) => appendInlineStyle(el, `${baseText}border-collapse:collapse;width:100%;margin:10pt 0;`));
  root.querySelectorAll('th,td').forEach((el) => appendInlineStyle(el, `${baseText}border:1px solid #000;padding:4pt 6pt;`));
  root.querySelectorAll('img').forEach((el) => {
    const src = String(el.getAttribute('src') || '');
    if (src.startsWith('data:image/') || src.startsWith('asset://') || src.startsWith('blob:')) {
      const holder = doc.createElement('p');
      const alt = String(el.getAttribute('alt') || '이미지');
      holder.textContent = `[이미지: ${alt}]`;
      appendInlineStyle(holder, `${baseText}margin:6pt 0;color:#444;`);
      el.replaceWith(holder);
      return;
    }
    appendInlineStyle(el, 'max-width:100%;height:auto;border:0;');
  });
  root.querySelectorAll('hr').forEach((el) => appendInlineStyle(el, 'border:0;border-top:1px solid #888;margin:10pt 0;'));

  const bodyStyle = [
    baseText,
    'margin:0;',
    `padding:${settings.margin.top} ${settings.margin.right} ${settings.margin.bottom} ${settings.margin.left};`,
    `word-break:${settings.wordBreak};`,
  ].join('');

  const out = [
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">',
    '<html>',
    '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>HWP Export</title></head>',
    `<body style="${bodyStyle}">${root.innerHTML}</body>`,
    '</html>',
  ].join('');

  download(`${filenameBase(filename)}_hwp.html`, out, 'text/html;charset=utf-8');
};

window.exportPDF = function exportPDF({ markdown, settings, assets = {} }) {
  if (typeof window.updatePreview === 'function') {
    window.updatePreview(markdown, settings);
  }

  const iframe = document.getElementById('preview-iframe');
  if (!iframe || !iframe.contentWindow) {
    window.print();
    return;
  }

  const runPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch {
      window.print();
    }
  };

  let printed = false;
  const printOnce = () => {
    if (printed) return;
    printed = true;
    runPrint();
  };

  iframe.addEventListener('load', printOnce, { once: true });
  setTimeout(() => {
    const ready = iframe.contentDocument && iframe.contentDocument.readyState === 'complete';
    if (ready) printOnce();
  }, 120);
};

window.bindExportButtons = function bindExportButtons(getState) {
  document.getElementById('btn-export-web').addEventListener('click', () => window.exportHTMLWeb(getState()));
  document.getElementById('btn-export-hangul').addEventListener('click', () => window.exportHTMLforHWP(getState()));
  document.getElementById('btn-export-pdf').addEventListener('click', () => window.exportPDF(getState()));
};
