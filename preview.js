marked.setOptions({ breaks: true, gfm: true });

window.parseFrontmatter = function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  const obj = {};
  match[1].split('\n').forEach((line) => {
    const i = line.indexOf(':');
    if (i > -1) obj[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return obj;
};

window.stripFrontmatter = function stripFrontmatter(markdown) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n?/, '');
};

function getFontFamily(settings) {
  if (settings.fontFamily === 'custom') return settings.customFontFamily || 'sans-serif';
  return window.FONT_MAP[settings.fontFamily] || window.FONT_MAP['nanum-gothic'];
}

function buildTableCss(tableStyle) {
  const base = `table{border-collapse:collapse;width:100%;margin:8pt 0;}th,td{padding:4pt 8pt;}`;
  const map = {
    hwp: `${base}th,td{border:1px solid #000;}th{background:#f0f0f0;font-weight:bold;text-align:center;}`,
    apa: `${base}table{border-top:2px solid #000;border-bottom:2px solid #000;}th{border-bottom:1px solid #000;font-weight:bold;}td{border:none;}`,
    minimal: `${base}table{border:1px solid #ccc;}th,td{border:none;}th{background:#f9f9f9;}`,
    none: `${base}th,td{border:none;}`,
  };
  return map[tableStyle] || map.hwp;
}

function buildHeadingCss(headingStyle) {
  const base = `h1{font-size:1.6em;margin:1em 0 .5em;}h2{font-size:1.3em;margin:.8em 0 .4em;}h3{font-size:1.1em;margin:.6em 0 .3em;}h4,h5,h6{font-size:1em;margin:.5em 0 .25em;}`;
  const map = {
    default: base,
    'numbered-box': `${base}h1::before{content:counter(h1) '. ';counter-increment:h1;}h2::before{content:counter(h1) '.' counter(h2) ' ';counter-increment:h2;}h3::before{content:counter(h1) '.' counter(h2) '.' counter(h3) ' ';counter-increment:h3;}body{counter-reset:h1 h2 h3;}`,
    apa: `${base}h1{text-align:center;font-weight:bold;}h2{font-weight:bold;}h3{font-weight:bold;font-style:italic;}h4{font-weight:bold;display:inline;}`,
  };
  return map[headingStyle] || map.default;
}

function buildFrontmatterHeader(frontmatter) {
  const title = frontmatter.title ? `<h1>${frontmatter.title}</h1>` : '';
  const subtitle = frontmatter.subtitle ? `<p><strong>${frontmatter.subtitle}</strong></p>` : '';
  const meta = ['author', 'date', 'organization'].filter((k) => frontmatter[k]).map((k) => `<span>${frontmatter[k]}</span>`).join(' · ');
  return `<header style="margin-bottom:1em;border-bottom:1px solid #ddd;">${title}${subtitle}<div>${meta}</div></header>`;
}

function buildIframeDoc(htmlContent, settings) {
  return `<!doctype html><html lang="ko"><head><meta charset="UTF-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic&family=Nanum+Myeongjo&display=swap');
    body{font-family:${getFontFamily(settings)};font-size:${settings.fontSize}pt;line-height:${settings.lineHeight};word-break:${settings.wordBreak};text-indent:${settings.textIndent};padding:${settings.margin.top} ${settings.margin.right} ${settings.margin.bottom} ${settings.margin.left};margin:0;color:#000;background:#fff;}
    ${buildTableCss(settings.tableStyle)}
    ${buildHeadingCss(settings.headingStyle)}
    pre{background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;}code{font-family:'Consolas',monospace;font-size:.9em;}pre code{background:none;padding:0;}
    blockquote{border-left:3px solid #ccc;margin:0;padding-left:16px;color:#555;}
  </style></head><body>${htmlContent}</body></html>`;
}

window.updatePreview = function updatePreview(markdown, settings) {
  const frontmatter = parseFrontmatter(markdown);
  const mdContent = stripFrontmatter(markdown);
  const html = marked.parse(mdContent, { breaks: settings.breaks, gfm: true });
  const doc = buildIframeDoc((frontmatter ? buildFrontmatterHeader(frontmatter) : '') + html, settings);
  const iframe = document.getElementById('preview-iframe');
  iframe.srcdoc = doc;
};
