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

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeHeadingText(text) {
  return String(text || '')
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .trim();
}

window.extractHeadingsFromMarkdown = function extractHeadingsFromMarkdown(markdown) {
  const lines = window.stripFrontmatter(markdown || '').split('\n');
  const out = [];
  let inFence = false;
  lines.forEach((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const m = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) return;
    const text = normalizeHeadingText(m[2]);
    if (!text) return;
    out.push({ level: m[1].length, text });
  });
  return out;
};

function buildCoverPageHtml(fm = {}) {
  return `
    <section class="special-page-cover" style="page-break-after:always;min-height:220mm;border:1px solid #ddd;border-radius:6px;padding:48pt 32pt;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
      <h1 style="margin:0 0 14pt;font-size:30pt;">${escapeHtml(fm.title || '제목 없음')}</h1>
      ${fm.subtitle ? `<p style="margin:0 0 18pt;font-size:15pt;">${escapeHtml(fm.subtitle)}</p>` : ''}
      <div style="font-size:11pt;color:#444;line-height:1.8;">
        ${fm.author ? `<div>작성자: ${escapeHtml(fm.author)}</div>` : ''}
        ${fm.organization ? `<div>소속: ${escapeHtml(fm.organization)}</div>` : ''}
        <div>날짜: ${escapeHtml(fm.date || new Date().toISOString().slice(0, 10))}</div>
      </div>
    </section>
  `;
}

function buildTocHtml(markdown, tocDepth = 2) {
  const depth = Math.max(1, Math.min(6, Number(tocDepth) || 2));
  const headings = window.extractHeadingsFromMarkdown(markdown).filter((h) => h.level <= depth);
  const items = headings.length
    ? `<ul style="margin:12pt 0 0;padding:0;list-style:none;">${
      headings.map((h) => `<li style="margin:4pt 0 4pt ${(h.level - 1) * 16}pt;">${escapeHtml(h.text)}</li>`).join('')
    }</ul>`
    : '<p style="color:#666;">표시할 목차 항목이 없습니다.</p>';
  return `
    <section class="special-page-toc" style="page-break-after:always;min-height:220mm;border:1px solid #ddd;border-radius:6px;padding:36pt 28pt;">
      <h2 style="margin:0 0 8pt;">목차</h2>
      ${items}
    </section>
  `;
}

window.buildSpecialPagesHtml = function buildSpecialPagesHtml(markdown, settings = {}, fm = {}) {
  const special = settings.specialPages || {};
  const out = [];
  if (special.coverPage) out.push(buildCoverPageHtml(fm));
  if (special.tocPage) out.push(buildTocHtml(markdown, special.tocDepth));
  return out.join('');
};

function resolveSlotValue(mode, customText, fm = {}) {
  if (mode === 'title') return fm.title || '';
  if (mode === 'date') return fm.date || new Date().toISOString().slice(0, 10);
  if (mode === 'custom') return customText || '';
  return '';
}

function buildHeaderFooterBar(type, settings = {}, fm = {}) {
  const cfg = settings[type] || {};
  const left = resolveSlotValue(cfg.left, cfg.customLeft, fm);
  const center = resolveSlotValue(cfg.center, cfg.customCenter, fm);
  const right = resolveSlotValue(cfg.right, cfg.customRight, fm);
  if (!left && !center && !right) return '';
  const topOrBottom = type === 'header' ? 'top:0;' : 'bottom:0;';
  return `
    <div class="doc-running-${type}" style="position:sticky;${topOrBottom}z-index:3;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:4pt 0;border-${type === 'header' ? 'bottom' : 'top'}:1px solid #ddd;font-size:9.5pt;color:#555;background:#fff;">
      <span style="text-align:left;">${escapeHtml(left)}</span>
      <span style="text-align:center;">${escapeHtml(center)}</span>
      <span style="text-align:right;">${escapeHtml(right)}</span>
    </div>
  `;
}

window.composeDocumentHtml = function composeDocumentHtml(markdown, settings, options = {}) {
  const mode = options.frontmatterMode || 'preview';
  const assets = options.assets || (window.getAssetMap ? window.getAssetMap() : {});
  const resolved = window.resolveMarkdownAssets(markdown || '', assets);
  const sized = window.applyImageSizeSyntax(resolved);
  const fm = window.parseFrontmatter(sized);
  const md = window.stripFrontmatter(sized);
  const body = marked.parse(md, { breaks: settings.breaks, gfm: true });
  const specialPagesHtml = window.buildSpecialPagesHtml(sized, settings, fm || {});
  const frontmatterHtml = mode === 'hwp'
    ? (fm ? window.buildFrontmatterHWP(fm, window.FONT_MAP[settings.fontFamily] || 'sans-serif') : '')
    : (fm ? window.buildFrontmatterHeader(fm) : '');
  return {
    fm,
    body,
    htmlBody: `${specialPagesHtml}${frontmatterHtml}${body}`,
  };
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
  const fm = arguments[2] || {};
  const headerBar = buildHeaderFooterBar('header', settings, fm);
  const footerBar = buildHeaderFooterBar('footer', settings, fm);
  const hasHeader = !!headerBar;
  const hasFooter = !!footerBar;
  return `<!doctype html><html lang="ko"><head><meta charset="UTF-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic&family=Nanum+Myeongjo&display=swap');
    body{font-family:${getFontFamily(settings)};font-size:${settings.fontSize}pt;line-height:${settings.lineHeight};word-break:${settings.wordBreak};text-indent:${settings.textIndent};padding:${settings.margin.top} ${settings.margin.right} ${settings.margin.bottom} ${settings.margin.left};margin:0;}
    .doc-main{padding-top:${hasHeader ? '10pt' : '0'};padding-bottom:${hasFooter ? '10pt' : '0'};}
    .doc-meta{border-bottom:1px solid #ddd;padding-bottom:8pt;margin-bottom:12pt;}
    ${buildTableCss(settings.tableStyle)}
    ${buildHeadingCss(settings.headingStyle)}
    ${buildPageBreakCss(settings)}
    @page { size:A4; margin:0; }
    img{max-width:100%;height:auto;}
    pre{background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;}blockquote{border-left:3px solid #ccc;padding-left:16px;color:#555;}
    @media print {
      body { margin:0; padding:0; }
      .doc-running-header,.doc-running-footer{position:fixed;left:${settings.margin.left};right:${settings.margin.right};}
      .doc-running-header{top:${settings.margin.top};}
      .doc-running-footer{bottom:${settings.margin.bottom};}
      .doc-main{padding-top:${hasHeader ? '16pt' : '0'};padding-bottom:${hasFooter ? '16pt' : '0'};}
    }
  </style></head><body>${headerBar}<main class="doc-main">${html}</main>${footerBar}</body></html>`;
};

window.updatePreview = function updatePreview(markdown, settings) {
  const composed = window.composeDocumentHtml(markdown, settings, { frontmatterMode: 'preview' });
  const fm = composed.fm || {};
  const iframe = document.getElementById('preview-iframe');
  iframe.srcdoc = window.buildIframeDoc(composed.htmlBody, settings, fm);
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
