/* Adventurers: tools for players. A name generator and the peoples' traits. Data: adventurers.json. */
'use strict';
window.Adventurers = (() => {
 const h = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const t = (en, es) => window.Pack2?.language === 'es' ? es : en;
 const md = s => h(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
 const $ = s => document.querySelector(s);
 let data = null, failed = false;
 const state = {people: '', region: '', home: '', form: '', canonOnly: false, results: []};
 const ready = fetch('adventurers.json?v=7').then(r => {if(!r.ok) throw Error(); return r.json();})
  .then(v => {data = v;}).catch(() => {failed = true;});

 const pick = list => list[Math.floor(Math.random() * list.length)];
 const chance = p => Math.random() < p;
 const pool = o => Array.isArray(o) ? o : state.canonOnly ? o.canon : o.canon.concat(o.more || []);
 const LAND = ['northern-frontier', 'central-heartland', 'southern-wilds', 'icy-expanse'];
 const person = id => data.peoples.find(p => p.id === id);

 function regional(regionId, form) {
  const r = data.regions[regionId];
  const f = form || pick(['masc', 'fem']);
  return {given: pick(pool(r[f])), family: pick(pool(r.family))};
 }
 function byname(b) {
  if(b.list) return pick(b.list);
  return b.pattern.replace(/\{(\w+)\}/g, (_, k) => pick(b[k === 'ordinal' ? 'ordinals' : k]));
 }
 function elfKind(p, regionId) {
  const names = Object.keys(p.kinds);
  return names.find(k => p.kinds[k].regions.includes(regionId)) || pick(names);
 }

 /* A tribe of one homeland: a name printed in the books, or a color or quality and a beast or thing of that country. */
 function tribe(homeId) {
  const hl = data.homelands[homeId];
  if(hl.canon.length && (state.canonOnly || chance(.2))) return pick(hl.canon);
  if(state.canonOnly) return '';
  let a = pick(hl.first), b = pick(hl.second);
  for(let i = 0; i < 6 && a.split('-').includes(b); i++) b = pick(hl.second);
  return a + '-' + b;
 }
 const homesOf = regionId => {
  const all = Object.keys(data.homelands), near = all.filter(id => data.homelands[id].region === regionId);
  return near.length ? near : all;
 };
 function givenOnly(p, land, form) {
  if(p.kind === 'regional') return regional(land, form).given;
  if(p.kind === 'elves' || p.kind === 'half-elf') {
   const elves = person('elves'), k = elves.kinds[elfKind(elves, land)];
   return p.kind === 'elves' || chance(.5) ? pick(pool(k.given)) : regional(land, form).given;
  }
  return pick(pool(p.given));
 }
 /* A name of the tribes: the given name, and the tribe in place of a family. */
 function tribal(p, homeId, form) {
  const hl = data.homelands[homeId], tr = tribe(homeId);
  if(!tr) return null;
  return {name: givenOnly(p, hl.region, form) + ' of the ' + tr, detail: hl.name + ' · ' + (tr.endsWith('s') ? t('the ', 'los ') + tr : t('the ' + tr + ' people', 'el pueblo ' + tr))};
 }

 /* One name for one people. Returns {name, people, detail}. */
 function make(p, regionId, form) {
  const land = LAND.includes(regionId) ? regionId : pick(LAND);
  switch(p.kind) {
   case 'regional': {
    const n = regional(land, form);
    return {name: n.given + ' ' + n.family, detail: data.regions[land].name};
   }
   case 'coral': {
    const n = regional('coral-kingdoms', form);
    return {name: n.given + ' ' + n.family, detail: data.regions['coral-kingdoms'].name};
   }
   case 'elves': {
    const kind = elfKind(p, regionId), k = p.kinds[kind];
    return {name: pick(pool(k.given)) + (chance(.6) ? ' ' + pick(k.byname) : ''), detail: kind + ' ' + t('elf', 'elfo')};
   }
   case 'half-elf': {
    const elves = person('elves'), kind = elfKind(elves, regionId), k = elves.kinds[kind], n = regional(land, form);
    const given = chance(.5) ? pick(pool(k.given)) : n.given;
    return {name: given + ' ' + n.family, detail: data.regions[land].name};
   }
   case 'given-family': return {name: pick(pool(p.given)) + ' ' + pick(pool(p.family))};
   case 'given-byname': {
    const earned = ['goblinoids', 'goliaths', 'orcs'].includes(p.id);
    return {name: pick(pool(p.given)) + (!earned || chance(.75) ? ' ' + byname(p.byname) : '')};
   }
   case 'single': return {name: pick(pool(p.given))};
   case 'galven': {
    const s = p.storm, given = pick(pool(p.given));
    if(state.canonOnly || chance(.15)) return {name: given + ' ' + pick(s.canon)};
    const a = pick(s.first), b = pick(s.second);
    return {name: given + ' ' + (s.hyphen.includes(a) ? a + '-' + b[0].toUpperCase() + b.slice(1) : a + b)};
   }
   case 'florian': {
    if(state.canonOnly || chance(.2)) return {name: pick(p.canon)};
    return {name: pick(p.first) + '-' + pick(p.second)};
   }
   case 'marked': {
    const family = pick(pool(p.family)), chosen = pick(pool(p.chosen)), roll = Math.random();
    if(roll < .5) return {name: chosen + ' ' + family};
    if(roll < .7) return {name: chosen};
    return {name: regional(land, form).given + ' ' + family};
   }
   case 'pocchin': {
    const given = pick(pool(p.given));
    let title = pick(p.title) + ' ' + pick(p.of);
    if(chance(.35)) title += ', ' + pick(p.title) + ' ' + pick(p.of);
    return {name: given + ' ' + pick(p.epithet) + ', ' + title};
   }
   case 'tarvan': return {name: pick(pool(p.clan)) + ' ' + pick(pool(p.given))};
  }
  return {name: pick(pool(p.given))};
 }

 function choosePeople(regionId) {
  if(regionId === 'coral-kingdoms') return chance(.7) ? person('coral-peoples') : pick(data.peoples);
  const bag = [];
  data.peoples.forEach(p => {
   const weight = p.id === 'humans' ? (regionId ? 10 : 5) : p.id === 'florians' ? .3 : 1;
   bag.push([p, weight]);
  });
  let roll = Math.random() * bag.reduce((s, x) => s + x[1], 0);
  for(const [p, w] of bag) {roll -= w; if(roll <= 0) return p;}
  return bag[0][0];
 }

 function generate(count = 10) {
  const out = [], seen = new Set();
  for(let tries = 0; out.length < count && tries < count * 20; tries++) {
   const p = state.people ? person(state.people) : choosePeople(state.region);
   let n = null;
   if(p.tribal && state.home) n = tribal(p, state.home === 'any' ? pick(homesOf(state.region)) : state.home, state.form);
   else if(p.tribal && state.everything && chance(.3)) n = tribal(p, pick(homesOf('')), state.form);
   if(!n) n = make(p, state.home && state.home !== 'any' ? data.homelands[state.home].region : state.region, state.form);
   if(seen.has(n.name)) continue;
   seen.add(n.name);
   out.push({name: n.name, people: p, detail: n.detail || ''});
  }
  state.results = out;
 }

 function frame(tab, body) {
  window.setNavigation?.('adventurers');
  document.title = t('Adventurers', 'Aventureros') + ' | Kalvatar';
  $('#breadcrumb').innerHTML = `<a href="#">${t('The world', 'El mundo')}</a><span>/</span><a href="#adventurers">${t('Adventurers', 'Aventureros')}</a>`;
  const link = (id, href, label) => `<a class="adv-tab${tab === id ? ' active' : ''}" href="${href}"${tab === id ? ' aria-current="page"' : ''}>${label}</a>`;
  $('#content').innerHTML = `<div class="content-wrap pack-page adventurers"><div class="page-intro"><p class="eyebrow">KALVATAR / 175 EC</p><h1>${t('Adventurers', 'Aventureros')}</h1><p>${t('Tools for players: a name that sounds like the islands, and what your people can do.', 'Herramientas para jugadores: un nombre que suene a las islas, y lo que tu pueblo sabe hacer.')}</p></div><nav class="adv-tabs" aria-label="${t('Adventurers tools', 'Herramientas de aventureros')}">${link('names', '#adventurers', t('Name generator', 'Generador de nombres'))}${link('traits', '#adventurers/traits', t('Peoples and traits', 'Pueblos y rasgos'))}</nav>${body}</div>`;
 }

 function options(list, value, any) {
  return `<option value="">${any}</option>` + list.map(([id, name]) => `<option value="${h(id)}"${id === value ? ' selected' : ''}>${h(name)}</option>`).join('');
 }

 function resultsHtml() {
  if(!state.results.length) return `<p class="adv-empty">${t('Choose, or leave everything open, and generate.', 'Elige, o deja todo abierto, y genera.')}</p>`;
  return `<ol class="adv-results">` + state.results.map((r, i) => `<li><div><strong class="adv-name">${h(r.name)}</strong><span class="adv-meta"><a href="#adventurers/traits/${h(r.people.id)}">${h(r.people.name)}</a>${r.detail ? ' · ' + h(r.detail) : ''}</span></div><button type="button" class="adv-copy" data-copy="${i}" aria-label="${t('Copy', 'Copiar')} ${h(r.name)}">${t('Copy', 'Copiar')}</button></li>`).join('') + `</ol>`;
 }

 function hintHtml() {
  const p = state.people && person(state.people);
  if(!p) return '';
  const fixed = !['regional', 'half-elf', 'elves', 'marked'].includes(p.kind);
  let note = fixed && state.region && !state.home ? ' ' + t('This people names the same way in every region.', 'Este pueblo usa los mismos nombres en todas las regiones.') : '';
  if(state.home && !p.tribal) note += ' ' + t('This people does not name by tribe, so the homeland is left out.', 'Este pueblo no usa nombres de tribu, así que la tierra natal no se aplica.');
  return `<p class="adv-hint">${h(p.hint)}${note} <a class="wiki-link" href="#adventurers/traits/${h(p.id)}">${t('Traits', 'Rasgos')} ↗</a></p>`;
 }

 function homeOptions() {
  const groups = Object.entries(data.regions).map(([rid, r]) => {
   const list = Object.entries(data.homelands).filter(([, x]) => x.region === rid);
   return list.length ? `<optgroup label="${h(r.name)}">${list.map(([id, x]) => `<option value="${h(id)}"${id === state.home ? ' selected' : ''}>${h(x.name)}</option>`).join('')}</optgroup>` : '';
  }).join('');
  return `<option value="">${t('No tribe', 'Sin tribu')}</option><option value="any"${state.home === 'any' ? ' selected' : ''}>${t('Any tribe', 'Cualquier tribu')}</option>${groups}`;
 }

 function renderNames() {
  const peoples = data.peoples.map(p => [p.id, p.name]).sort((a, b) => a[1].replace(/^The /, '').localeCompare(b[1].replace(/^The /, '')));
  const regions = Object.entries(data.regions).map(([id, r]) => [id, r.name]);
  frame('names', `<section class="adv-panel"><div class="adv-controls"><label class="pack-label">${t('People', 'Pueblo')}<select id="adv-people">${options(peoples, state.people, t('Any people', 'Cualquier pueblo'))}</select></label><label class="pack-label">${t('Region', 'Región')}<select id="adv-region">${options(regions, state.region, t('Any region', 'Cualquier región'))}</select></label><label class="pack-label">${t('Tribe homeland', 'Tierra de la tribu')}<select id="adv-home">${homeOptions()}</select></label><label class="pack-label">${t('Form', 'Forma')}<select id="adv-form">${options([['masc', t('Masculine', 'Masculina')], ['fem', t('Feminine', 'Femenina')]], state.form, t('Any', 'Cualquiera'))}</select></label></div><label class="adv-check"><input type="checkbox" id="adv-canon"${state.canonOnly ? ' checked' : ''}> ${t('Only names printed in the books', 'Solo nombres que salen en los libros')}</label><div class="pack-actions"><button type="button" class="button" id="adv-go">${t('Generate names', 'Generar nombres')} <span aria-hidden="true">→</span></button><button type="button" class="button cream" id="adv-random">${t('Random everything', 'Random todo')} <span aria-hidden="true">✦</span></button></div><div id="adv-hint">${hintHtml()}</div></section><section aria-live="polite" id="adv-out">${resultsHtml()}</section>`);
  const draw = () => {$('#adv-out').innerHTML = resultsHtml(); $('#adv-hint').innerHTML = hintHtml();};
  const read = () => {state.everything = false; state.people = $('#adv-people').value; state.region = $('#adv-region').value; state.home = $('#adv-home').value; state.form = $('#adv-form').value; state.canonOnly = $('#adv-canon').checked;};
  $('#adv-go').addEventListener('click', () => {read(); generate(); draw();});
  $('#adv-random').addEventListener('click', () => {
   state.people = ''; state.region = ''; state.home = ''; state.form = ''; state.canonOnly = $('#adv-canon').checked; state.everything = true;
   $('#adv-people').value = ''; $('#adv-region').value = ''; $('#adv-home').value = ''; $('#adv-form').value = '';
   generate(); draw();
  });
  ['#adv-people', '#adv-region', '#adv-home', '#adv-form', '#adv-canon'].forEach(s => $(s).addEventListener('change', () => {read(); $('#adv-hint').innerHTML = hintHtml();}));
  $('#adv-out').addEventListener('click', e => {
   const b = e.target.closest('[data-copy]');
   if(!b) return;
   const name = state.results[+b.dataset.copy]?.name;
   const done = () => {b.textContent = t('Copied', 'Copiado'); setTimeout(() => {b.textContent = t('Copy', 'Copiar');}, 1400);};
   if(navigator.clipboard?.writeText) navigator.clipboard.writeText(name).then(done).catch(() => {});
  });
 }

 function blocksHtml(blocks) {
  let html = '', depth = 0;
  const close = to => {while(depth > to) {html += '</ul>'; depth--;}};
  blocks.forEach(b => {
   if(b.t === 'li') {
    const want = b.level + 1;
    while(depth < want) {html += '<ul>'; depth++;}
    close(want);
    html += `<li>${md(b.text)}</li>`;
   } else {
    close(0);
    if(b.t === 'table') html += `<div class="adv-table"><table><thead><tr>${b.rows[0].map(c => `<th>${md(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.slice(1).map(r => `<tr>${r.map(c => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    else html += `<p>${md(b.text)}</p>`;
   }
  });
  close(0);
  return html;
 }

 function renderTraits(id) {
  const sorted = data.peoples.slice().sort((a, b) => a.name.replace(/^The /, '').localeCompare(b.name.replace(/^The /, '')));
  const p = person(id);
  const chips = `<div class="adv-chips">${sorted.map(x => `<a class="adv-chip${p && x.id === p.id ? ' active' : ''}" href="#adventurers/traits/${h(x.id)}">${h(x.name)}</a>`).join('')}</div>`;
  if(!p) {frame('traits', `<p class="adv-lead">${t('Choose a people to read what its members can do.', 'Elige un pueblo para leer lo que saben hacer los suyos.')}</p>${chips}`); return;}
  const parts = p.traits.length ? p.traits.map(x => `<section class="adv-part"><h3>${h(x.title)}</h3>${blocksHtml(x.blocks)}</section>`).join('') : `<p class="adv-hint">${h(p.no_traits)}</p>`;
  const spanish = window.Pack2?.language === 'es' ? `<p class="adv-hint">Los rasgos están en inglés por ahora.</p>` : '';
  frame('traits', `${chips}<article class="adv-people"><header><h2>${h(p.name)}</h2><p class="adv-tagline">${h(p.tagline)}</p><div class="pack-actions"><a class="button" href="#entry/${h(p.id)}">${t('Read about them', 'Leer sobre ellos')} <span aria-hidden="true">→</span></a><button type="button" class="button cream" id="adv-names-for">${t('Names for this people', 'Nombres de este pueblo')} <span aria-hidden="true">✦</span></button></div></header>${spanish}${parts}<section class="adv-part"><h3>${t('Names', 'Nombres')}</h3><p>${h(p.hint)}</p></section></article><p class="adv-credit">${h(data.credit)}</p>`);
  $('#adv-names-for').addEventListener('click', () => {state.people = p.id; state.region = ''; state.home = ''; state.form = ''; state.everything = false; generate(); location.hash = 'adventurers';});
 }

 function route(view, parts) {
  if(view !== 'adventurers') return false;
  const draw = () => {
   if(location.hash.slice(1).split('/')[0] !== 'adventurers') return;
   if(failed || !data) {frame('names', `<p class="adv-hint">${t('The adventurers’ tools could not be loaded. Try reloading the page.', 'No se pudieron cargar las herramientas. Recarga la página.')}</p>`); return;}
   if(parts[1] === 'traits') renderTraits(parts[2]); else renderNames();
  };
  if(data || failed) draw(); else {frame('names', `<p class="adv-hint">${t('Loading…', 'Cargando…')}</p>`); ready.then(draw);}
  return true;
 }
 return {route, ready};
})();
