/* ============================================================================
   APPLICATION STATE
   ============================================================================ */
var state = {
  values: {},      // flat key -> string, for every static schema field
  servers: [],      // [{alias, destination, useRSA:'on'|'off'}]
  macros: [],        // [{slot, dest, text}]
  screens: {},         // windowName -> {parent, geometry, mapped:'on'|'off', allow}
  unknown: [],           // [{key, value}] passthrough lines we didn't recognize
  fileName: null,
  dirty: false,
};

// Flat lookup: key -> {tab, field}
var FIELD_INDEX = {};
RC_SCHEMA.forEach(tab => {
  (tab.fields || []).forEach(f => { FIELD_INDEX[f.key] = { tab, field: f }; });
});

function initTooltips(){
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function initDefaults() {
  state.values = {};
  RC_SCHEMA.forEach(tab => (tab.fields || []).forEach(f => { state.values[f.key] = f.default; }));
  state.servers = [];
  state.macros = [];
  state.screens = {};
  SCREEN_WINDOWS.forEach(w => {
    state.screens[w.name] = {
      parent: w.parent !== undefined ? w.parent : null,
      geometry: w.geometry !== undefined ? w.geometry : null,
      mapped: w.mapped !== undefined ? w.mapped : null,
      allow: w.allow !== undefined ? w.allow : null,
    };
  });
  state.unknown = [];
  state.fileName = null;
  state.dirty = false;
}
initDefaults();

/* ============================================================================
   PARSING an uploaded RC file into state
   ============================================================================ */
function parseRcText(text) {
  initDefaults();
  const lines = text.split(/\r\n|\r|\n/);

  lines.forEach(raw => {
    const line = raw.replace(/^\uFEFF/, '');
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    let key, value;
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      key = line.slice(0, colonIdx).trim();
      value = line.slice(colonIdx + 1).trim();
    } else {
      const m = line.match(/^(\S+)\s+(.*)$/);
      if (!m) return;
      key = m[1].trim();
      value = m[2].trim();
    }
    if (!key) return;

    // 1) Static schema field?
    if (FIELD_INDEX[key]) {
      state.values[key] = value;
      return;
    }
    // 2) Server alias entries
    let m;
    if ((m = key.match(/^server\.(.+)$/))) {
      const alias = m[1];
      let row = state.servers.find(r => r.alias === alias);
      if (!row) { row = { alias, destination: '', useRSA: 'off' }; state.servers.push(row); }
      row.destination = value;
      return;
    }
    if ((m = key.match(/^useRSA\.(.+)$/))) {
      const alias = m[1];
      let row = state.servers.find(r => r.alias === alias);
      if (!row) { row = { alias, destination: '', useRSA: 'off' }; state.servers.push(row); }
      row.useRSA = value;
      return;
    }
    // 3) Macro entries: mac.<slot> or mac.<slot>.<dest>
    if ((m = key.match(/^mac\.([^.]+)(?:\.(.+))?$/))) {
      state.macros.push({ slot: m[1], dest: m[2] || '', text: value });
      return;
    }
    // 4) Screens window entries
    if ((m = key.match(/^(.+)\.(parent|geometry|mapped|allow)$/))) {
      const wname = m[1], prop = m[2];
      if (state.screens[wname]) {
        state.screens[wname][prop] = value;
        return;
      }
    }
    // 5) Unrecognized - preserve verbatim for round-trip
    state.unknown.push({ key, value });
  });

  state.dirty = false;
}

/* ============================================================================
   GENERATING an RC file from state
   ============================================================================ */
function generateRcText() {
  const out = [];
  const pushHeader = name => { out.push(''); out.push(`# ---- ${name} ----`); };

  RC_SCHEMA.forEach(tab => {
    pushHeader(tab.name);
    (tab.fields || []).forEach(f => {
      out.push(`${f.key}: ${state.values[f.key] !== undefined ? state.values[f.key] : ''}`);
    });

    if (tab.dynamic === 'servers') {
      state.servers.forEach(row => {
        if (!row.alias) return;
        out.push(`server.${row.alias}: ${row.destination}`);
        out.push(`useRSA.${row.alias}: ${row.useRSA}`);
      });
    }
    if (tab.dynamic === 'macros') {
      state.macros.forEach(row => {
        if (!row.slot) return;
        const k = row.dest ? `mac.${row.slot}.${row.dest}` : `mac.${row.slot}`;
        out.push(`${k}: ${row.text}`);
      });
    }
    if (tab.dynamic === 'screens') {
      SCREEN_WINDOWS.forEach(w => {
        const s = state.screens[w.name] || {};
        if (w.parent !== undefined) out.push(`${w.name}.parent: ${s.parent}`);
        if (w.geometry !== undefined) out.push(`${w.name}.geometry: ${s.geometry}`);
        if (w.mapped !== undefined) out.push(`${w.name}.mapped: ${s.mapped}`);
        if (w.allow !== undefined) out.push(`${w.name}.allow: ${s.allow}`);
      });
    }
  });

  if (state.unknown.length) {
    pushHeader('Other / Unrecognized (preserved from loaded file)');
    state.unknown.forEach(({ key, value }) => out.push(`${key}: ${value}`));
  }

  return out.join('\n').replace(/^\n/, '') + '\n';
}

/* ============================================================================
   RENDERING
   ============================================================================ */
var activeTabId = RC_SCHEMA[0].id;

function isFieldModified(f) {
  return (state.values[f.key] !== undefined ? state.values[f.key] : '') !== f.default;
}

function tabModifiedCount(tab) {
  let n = (tab.fields || []).filter(isFieldModified).length;
  if (tab.dynamic === 'servers') n += state.servers.length;
  if (tab.dynamic === 'macros') n += state.macros.length;
  if (tab.dynamic === 'screens') {
    n += SCREEN_WINDOWS.filter(w => {
      const s = state.screens[w.name] || {};
      return (w.parent !== undefined && s.parent !== w.parent) ||
             (w.geometry !== undefined && s.geometry !== w.geometry) ||
             (w.mapped !== undefined && s.mapped !== w.mapped) ||
             (w.allow !== undefined && s.allow !== w.allow);
    }).length;
  }
  return n;
}

function renderRail() {
  const rail = document.getElementById('tabRail');
  rail.innerHTML = '';
  RC_SCHEMA.forEach((tab, i) => {
    const item = document.createElement('div');
    item.className = 'tab-item' + (tab.id === activeTabId ? ' active' : '');
    const modCount = tabModifiedCount(tab);
    item.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}</span><span>${tab.name}</span>` +
      (modCount ? `<span class="badge-mod">${modCount}</span>` : '');
    item.addEventListener('click', () => { activeTabId = tab.id; renderAll(); });
    rail.appendChild(item);
  });
}

function fieldControl(f) {
  const wrap = document.createElement('div');
  wrap.className = 'field' + (isFieldModified(f) ? ' modified' : '');
  const val = state.values[f.key] !== undefined ? state.values[f.key] : f.default;

  if (f.type === 'checkbox') {
    const onVal = f.onValue || 'on';
    const offVal = f.offValue || 'off';
    wrap.innerHTML = `
      <div class="field-checkbox">
        <label data-bs-toggle="tooltip" data-bs-html="true" data-bs-custom-class="tooltipWide" title="${f.tooltip}">
            <span class="key">${f.label}</span>
        </label>
        <div class="form-check form-switch m-0">
          <input class="form-check-input" type="checkbox" role="switch" ${val === onVal ? 'checked' : ''}>
        </div>
      </div>`;
    wrap.querySelector('input').addEventListener('change', e => {
      setValue(f.key, e.target.checked ? onVal : offVal);
    });
    return wrap;
  }

  if (f.type === 'select') {
    //const opts = f.options.map(o => `<option value="${o}" ${String(o) === String(val) ? 'selected' : ''}>${o}</option>`).join(''); 
    const opts = f.options.map(o => `<option value="${o.id}" ${String(o.id) === String(val) ? 'selected' : ''}>${o.name}</option>`).join('');
    wrap.innerHTML = `<label data-bs-toggle="tooltip" data-bs-html="true" data-bs-custom-class="tooltipWide" title="${f.tooltip}"><span class="key">${f.label}</span>${isFieldModified(f) ? '<span class="flag">MOD</span>' : ''}</label>
      <select class="form-select form-select-sm">${opts}</select>`;
    wrap.querySelector('select').addEventListener('change', e => setValue(f.key, e.target.value));
    return wrap;
  }

  if (f.type === 'color') {
    wrap.innerHTML = `<label data-bs-toggle="tooltip" title="${f.tooltip}"><span class="key">${f.label}</span>${isFieldModified(f) ? '<span class="flag">MOD</span>' : ''}</label>
      <div class="d-flex align-items-center gap-2">
        <span class="color-swatch" style="background:${cssColorGuess(val)}"></span>
        <input type="text" class="form-control form-control-sm" value="${escapeAttr(val)}">
      </div>`;
    wrap.querySelector('input').addEventListener('input', e => setValue(f.key, e.target.value));
    return wrap;
  }

  // text
  wrap.innerHTML = `<label data-bs-toggle="tooltip" data-bs-html="true" data-bs-custom-class="tooltipWide" title="${f.tooltip}"><span class="key">${f.label}</span>${isFieldModified(f) ? '<span class="flag">MOD</span>' : ''}</label>
    <input type="${f.sensitive ? 'password' : 'text'}" class="form-control form-control-sm" value="${escapeAttr(val)}">`;
  wrap.querySelector('input').addEventListener('input', e => setValue(f.key, e.target.value));
  return wrap;
}

function cssColorGuess(name) {
  const map = { gray63: '#a1a1a1' };
  return map[name] || name || 'transparent';
}
function escapeAttr(s) { return String(s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

function renderServersSection(container) {
  const box = document.createElement('div');
  box.innerHTML = `
    <h4 class="tab-title" style="font-size:.95rem; margin-top:1.6rem;">Server Aliases</h4>
    <div class="section-note">Repeatable <strong>server.{alias}</strong> / <strong>useRSA.{alias}</strong> entries. Add one row per saved server shortcut.</div>
    <table class="dyn-table mb-2">
      <thead><tr><th>Alias</th><th>Destination</th><th>Use RSA</th><th></th></tr></thead>
      <tbody id="serverRows"></tbody>
    </table>
    <button class="btn btn-console add-row-btn" id="addServerRow">+ Add Server</button>`;
  container.appendChild(box);

  const tbody = box.querySelector('#serverRows');
  state.servers.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="form-control form-control-sm" value="${escapeAttr(row.alias)}" placeholder="e.g. paradise"></td>
      <td><input class="form-control form-control-sm" value="${escapeAttr(row.destination)}" placeholder="host:port"></td>
      <td class="text-center"><input type="checkbox" class="form-check-input" ${row.useRSA === 'on' ? 'checked' : ''}></td>
      <td><button class="icon-btn" title="Remove">&times;</button></td>`;
    const [aliasIn, destIn, rsaIn] = tr.querySelectorAll('input');
    aliasIn.addEventListener('input', e => { row.alias = e.target.value; markDirty(); });
    destIn.addEventListener('input', e => { row.destination = e.target.value; markDirty(); });
    rsaIn.addEventListener('change', e => { row.useRSA = e.target.checked ? 'on' : 'off'; markDirty(); });
    tr.querySelector('.icon-btn').addEventListener('click', () => { state.servers.splice(idx, 1); markDirty(); renderAll(); });
    tbody.appendChild(tr);
  });
  box.querySelector('#addServerRow').addEventListener('click', () => {
    state.servers.push({ alias: '', destination: '', useRSA: 'off' });
    markDirty(); renderAll();
  });
}

function renderMacrosSection(container) {
  const box = document.createElement('div');
  box.innerHTML = `
    <h4 class="tab-title" style="font-size:.95rem; margin-top:1.6rem;">Macro Table</h4>
    <div class="section-note">Repeatable <strong>mac.{slot}.{dest}</strong> entries (leave Destination blank for on-the-fly macros like <strong>mac.f</strong>).</div>
    <table class="dyn-table mb-2">
      <thead><tr><th style="width:15%">Slot</th><th style="width:15%">Destination</th><th>Text</th><th></th></tr></thead>
      <tbody id="macroRows"></tbody>
    </table>
    <button class="btn btn-console add-row-btn" id="addMacroRow">+ Add Macro</button>`;
  container.appendChild(box);

  const tbody = box.querySelector('#macroRows');
  state.macros.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="form-control form-control-sm" value="${escapeAttr(row.slot)}" placeholder="1"></td>
      <td><input class="form-control form-control-sm" value="${escapeAttr(row.dest)}" placeholder="A / T / G"></td>
      <td><input class="form-control form-control-sm" value="${escapeAttr(row.text)}" placeholder="message text"></td>
      <td><button class="icon-btn" title="Remove">&times;</button></td>`;
    const [slotIn, destIn, textIn] = tr.querySelectorAll('input');
    slotIn.addEventListener('input', e => { row.slot = e.target.value; markDirty(); });
    destIn.addEventListener('input', e => { row.dest = e.target.value; markDirty(); });
    textIn.addEventListener('input', e => { row.text = e.target.value; markDirty(); });
    tr.querySelector('.icon-btn').addEventListener('click', () => { state.macros.splice(idx, 1); markDirty(); renderAll(); });
    tbody.appendChild(tr);
  });
  box.querySelector('#addMacroRow').addEventListener('click', () => {
    state.macros.push({ slot: '', dest: '', text: '' });
    markDirty(); renderAll();
  });
}

function renderScreensTab(container) {
  SCREEN_WINDOWS.forEach(w => {
    const s = state.screens[w.name];
    const card = document.createElement('div');
    card.className = 'window-card';
    let fieldsHtml = '';
    if (w.parent !== undefined) fieldsHtml += `
      <div><span class="sub-label">Parent</span><input data-prop="parent" class="form-control form-control-sm" value="${escapeAttr(s.parent)}"></div>`;
    if (w.geometry !== undefined) fieldsHtml += `
      <div><span class="sub-label">Geometry</span><input data-prop="geometry" class="form-control form-control-sm" value="${escapeAttr(s.geometry)}"></div>`;
    if (w.mapped !== undefined) fieldsHtml += `
      <div><span class="sub-label">Mapped</span>
        <div class="form-check form-switch m-0 pt-1">
          <input data-prop="mapped" class="form-check-input" type="checkbox" role="switch" ${s.mapped === 'on' ? 'checked' : ''}>
        </div>
      </div>`;
    if (w.allow !== undefined) fieldsHtml += `
      <div><span class="sub-label">Allow</span><input data-prop="allow" class="form-control form-control-sm" value="${escapeAttr(s.allow)}"></div>`;
    card.innerHTML = `<div class="wname">${w.name}</div><div class="row-fields">${fieldsHtml}</div>`;

    card.querySelectorAll('input[data-prop]').forEach(inp => {
      const prop = inp.dataset.prop;
      const evt = prop === 'mapped' ? 'change' : 'input';
      inp.addEventListener(evt, e => {
        s[prop] = prop === 'mapped' ? (e.target.checked ? 'on' : 'off') : e.target.value;
        markDirty();
        renderRail();
      });
    });
    container.appendChild(card);
  });
}

function renderContent() {
  const pane = document.getElementById('contentPane');
  pane.innerHTML = '';
  const tab = RC_SCHEMA.find(t => t.id === activeTabId);

  const title = document.createElement('div');
  title.innerHTML = `<h3 class="tab-title">${tab.name}</h3>`;
  pane.appendChild(title);
  if (tab.note) {
    const note = document.createElement('div');
    note.className = 'section-note';
    note.innerHTML = tab.note;
    pane.appendChild(note);
  }

  if (tab.id === 'screens') {
    renderScreensTab(pane);
    return;
  }

  if (tab.fields && tab.fields.length) {
    const grid = document.createElement('div');
    grid.className = 'field-grid';
    tab.fields.forEach(f => grid.appendChild(fieldControl(f)));
    pane.appendChild(grid);
  }

  if (tab.dynamic === 'servers') renderServersSection(pane);
  if (tab.dynamic === 'macros') renderMacrosSection(pane);
  
  //update tooltips
  initTooltips();
  
}

function renderAll() {
  renderRail();
  renderContent();
  updateFileStatus();
}

function setValue(key, value) {
  state.values[key] = value;
  markDirty();
  renderAll();
}

function markDirty() {
  state.dirty = true;
  document.getElementById('dirtyDot').classList.add('dirty');
}

function updateFileStatus() {
  const el = document.getElementById('fileStatus');
  if (state.fileName) {
    el.innerHTML = `Loaded: <span class="loaded">${state.fileName}</span>${state.unknown.length ? ` &middot; ${state.unknown.length} unrecognized line(s) preserved` : ''}`;
  } else {
    el.textContent = 'No file loaded — editing defaults';
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._h);
  showToast._h = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ============================================================================
   FILE I/O
   ============================================================================ */
document.getElementById('loadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
document.getElementById('fileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    parseRcText(ev.target.result);
    state.fileName = file.name;
    document.getElementById('dirtyDot').classList.remove('dirty');
    renderAll();
    showToast(`Loaded ${file.name}`);
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset all fields to their defaults? This discards unsaved changes.')) return;
  initDefaults();
  document.getElementById('dirtyDot').classList.remove('dirty');
  renderAll();
  showToast('Reset to defaults');
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  const text = generateRcText();
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = state.fileName || 'netrekrc.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('RC file downloaded');
});

renderAll();
