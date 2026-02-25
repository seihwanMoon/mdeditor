window.updateLineNumbers = function updateLineNumbers(textarea) {
  const lines = textarea.value.split('\n').length;
  const current = textarea.value.slice(0, textarea.selectionStart).split('\n').length;
  document.getElementById('line-numbers').innerHTML = Array.from({ length: lines }, (_, i) => {
    const n = i + 1;
    return `<div class="${n === current ? 'active-line' : ''}">${n}</div>`;
  }).join('');
};

window.getCaretInfo = function getCaretInfo(textarea) {
  const before = textarea.value.slice(0, textarea.selectionStart);
  const line = before.split('\n').length;
  const col = before.length - before.lastIndexOf('\n');
  return { line, col };
};

window.bindEditor = function bindEditor({ editorEl, onTextChanged }) {
  const lineNumbers = document.getElementById('line-numbers');
  const findBar = document.getElementById('find-bar');
  const findInput = document.getElementById('find-input');
  const findCount = document.getElementById('find-count');
  const findClose = document.getElementById('find-close');

  let findMatches = [];
  let findIndex = -1;
  const refreshFind = () => {
    const q = findInput.value;
    if (!q) { findMatches = []; findIndex = -1; findCount.textContent = '0/0'; return; }
    findMatches = [...editorEl.value.matchAll(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'))];
    findCount.textContent = `${findMatches.length ? findIndex + 1 : 0}/${findMatches.length}`;
  };
  const moveFind = (dir) => {
    if (!findMatches.length) return;
    findIndex = (findIndex + dir + findMatches.length) % findMatches.length;
    const m = findMatches[findIndex];
    editorEl.focus();
    editorEl.setSelectionRange(m.index, m.index + m[0].length);
    findCount.textContent = `${findIndex + 1}/${findMatches.length}`;
  };

  editorEl.addEventListener('scroll', () => { lineNumbers.scrollTop = editorEl.scrollTop; });
  editorEl.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editorEl.selectionStart;
      editorEl.setRangeText('  ', s, editorEl.selectionEnd, 'end');
      onTextChanged();
    }
  });
  ['input', 'click', 'keyup'].forEach((ev) => editorEl.addEventListener(ev, onTextChanged));

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      findBar.classList.remove('hidden');
      findInput.focus();
      findInput.select();
    } else if (e.key === 'Escape' && !findBar.classList.contains('hidden')) {
      findBar.classList.add('hidden');
      editorEl.focus();
    }
  });

  findInput.addEventListener('input', () => { refreshFind(); findIndex = 0; moveFind(0); });
  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); moveFind(e.shiftKey ? -1 : 1); }
    if (e.key === 'Escape') { findBar.classList.add('hidden'); editorEl.focus(); }
  });
  findClose.addEventListener('click', () => { findBar.classList.add('hidden'); editorEl.focus(); });
};
