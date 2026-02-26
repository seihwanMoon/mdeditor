marked.setOptions({ breaks: true, gfm: true });

window.parseFrontmatter = function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  const out = {};
  match[1].split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx > -1) out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
  const allowed = ['title', 'subtitle', 'author', 'date', 'organization'];
  const filtered = {};
  allowed.forEach((k) => { if (out[k]) filtered[k] = out[k]; });
  return Object.keys(filtered).length ? filtered : null;
};

window.stripFrontmatter = function stripFrontmatter(markdown) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n?/, '');
};

window.resolveMarkdownAssets = function resolveMarkdownAssets(markdown, assets = {}) {
  if (!markdown || !assets || typeof assets !== 'object') return markdown || '';
  return markdown.replace(/asset:\/\/([a-zA-Z0-9_-]+)/g, (full, id) => {
    const item = assets[id];
    if (!item) return full;
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && typeof item.dataUrl === 'string') return item.dataUrl;
    return full;
  });
};

window.applyImageSizeSyntax = function applyImageSizeSyntax(markdown) {
  if (!markdown) return markdown || '';
  return markdown.replace(
    /!\[([^\]\n|]+)\|(\d{1,4})\]\(([^)\n]+)\)/g,
    (full, alt, width, src) => `<img src="${src}" alt="${alt}" width="${width}" style="max-width:100%;height:auto;" />`,
  );
};

window.buildFrontmatterHeader = function buildFrontmatterHeader(fm) {
  const title = fm?.title ? `<h1>${fm.title}</h1>` : '';
  const subtitle = fm?.subtitle ? `<p><strong>${fm.subtitle}</strong></p>` : '';
  const meta = ['author', 'date', 'organization'].filter((k) => fm?.[k]).map((k) => `<span>${fm[k]}</span>`).join(' · ');
  return `<header class="doc-meta">${title}${subtitle}<div>${meta}</div></header>`;
};

window.buildFrontmatterHWP = function buildFrontmatterHWP(fm, fontFamily) {
  if (!fm) return '';
  return `<table style="width:100%;border-collapse:collapse;font-family:${fontFamily};margin-bottom:10pt;"><tr><td style="font-size:18pt;font-weight:bold;padding:6pt 0;">${fm.title || ''}</td></tr><tr><td style="font-size:10pt;color:#444;">${[fm.subtitle, fm.author, fm.date, fm.organization].filter(Boolean).join(' / ')}</td></tr></table>`;
};

function getFontFamily(settings) {
  if (settings.fontFamily === 'custom') return settings.customFontFamily || 'sans-serif';
  return window.FONT_MAP[settings.fontFamily] || window.FONT_MAP['nanum-gothic'];
}

function buildTableCss(style) {
  const base = 'table{border-collapse:collapse;width:100%;margin:8pt 0;}th,td{padding:4pt 8pt;}';
  const map = {
    hwp: `${base}th,td{border:1px solid #000;}th{background:#f0f0f0;font-weight:bold;text-align:center;}`,
    apa: `${base}table{border-top:2px solid #000;border-bottom:2px solid #000;}th{border-bottom:1px solid #000;font-weight:bold;}td{border:none;}`,
    minimal: `${base}table{border:1px solid #ccc;}th{background:#f9f9f9;}th,td{border:none;}`,
    none: `${base}th,td{border:none;}`,
  };
  return map[style] || map.hwp;
}

function buildHeadingCss(style) {
  const base = 'h1{font-size:1.6em;}h2{font-size:1.3em;}h3{font-size:1.1em;}';
  const map = {
    default: base,
    'numbered-box': `${base}h1::before{content:counter(h1) '. ';counter-increment:h1;}h2::before{content:counter(h1) '.' counter(h2) ' ';counter-increment:h2;}body{counter-reset:h1 h2;}`,
    apa: `${base}h1{text-align:center;font-weight:bold;}h2,h3{font-weight:bold;}`,
  };
  return map[style] || map.default;
}

function buildPageBreakCss(settings) {
  return `${settings.pageBreakBeforeH1 ? 'h1{page-break-before:always;}' : ''}
${settings.pageBreakBeforeH2 ? 'h2{page-break-before:always;}' : ''}
${settings.pageBreakBeforeH3 ? 'h3{page-break-before:always;}' : ''}`;
}

window.buildIframeDoc = function buildIframeDoc(html, settings) {
  return `<!doctype html><html lang="ko"><head><meta charset="UTF-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic&family=Nanum+Myeongjo&display=swap');
    body{font-family:${getFontFamily(settings)};font-size:${settings.fontSize}pt;line-height:${settings.lineHeight};word-break:${settings.wordBreak};text-indent:${settings.textIndent};padding:${settings.margin.top} ${settings.margin.right} ${settings.margin.bottom} ${settings.margin.left};margin:0;}
    .doc-meta{border-bottom:1px solid #ddd;padding-bottom:8pt;margin-bottom:12pt;}
    ${buildTableCss(settings.tableStyle)}
    ${buildHeadingCss(settings.headingStyle)}
    ${buildPageBreakCss(settings)}
    img{max-width:100%;height:auto;}
    pre{background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;}blockquote{border-left:3px solid #ccc;padding-left:16px;color:#555;}
    @media print { body { margin:0; padding:0; } }
  </style></head><body>${html}</body></html>`;
};

window.updatePreview = function updatePreview(markdown, settings) {
  const fm = parseFrontmatter(markdown);
  const resolved = window.resolveMarkdownAssets(markdown, window.getAssetMap ? window.getAssetMap() : {});
  const sized = window.applyImageSizeSyntax(resolved);
  const md = stripFrontmatter(sized);
  const html = marked.parse(md, { breaks: settings.breaks, gfm: true });
  const withHeader = (fm ? buildFrontmatterHeader(fm) : '') + html;
  const iframe = document.getElementById('preview-iframe');
  iframe.srcdoc = window.buildIframeDoc(withHeader, settings);
  iframe.onload = () => {
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const resize = () => {
        const bodyHeight = Math.max(
          doc.body ? doc.body.scrollHeight : 0,
          doc.documentElement ? doc.documentElement.scrollHeight : 0,
          1122,
        );
        iframe.style.height = `${bodyHeight + 8}px`;
      };
      resize();
      doc.querySelectorAll('img').forEach((img) => img.addEventListener('load', resize, { once: true }));
    } catch {
      // ignore cross-context failures
    }
  };
};
