/* Adventurers: tools for players. A name generator and the peoples' traits. Data: adventurers.json. */
'use strict';
window.Adventurers = (() => {
 const h = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const t = (en, es) => window.Pack2?.language === 'es' ? es : en;
 const md = s => h(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
 const $ = s => document.querySelector(s);
 let data = null, failed = false;
 const state = {people: '', region: '', home: '', form: '', canonOnly: false, results: []};
 const ready = fetch('adventurers.json?v=8').then(r => {if(!r.ok) throw Error(); return r.json();})
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
  $('#content').innerHTML = `<div class="content-wrap pack-page adventurers"><div class="page-intro"><p class="eyebrow">KALVATAR / 175 EC</p><h1>${t('Adventurers', 'Aventureros')}</h1><p>${t('Tools for players: a name that sounds like the islands, what your people can do, and what it costs to make things.', 'Herramientas para jugadores: un nombre que suene a las islas, lo que tu pueblo sabe hacer, y lo que cuesta fabricar cosas.')}</p></div><nav class="adv-tabs" aria-label="${t('Adventurers tools', 'Herramientas de aventureros')}">${link('names', '#adventurers', t('Name generator', 'Generador de nombres'))}${link('traits', '#adventurers/traits', t('Peoples and traits', 'Pueblos y rasgos'))}${link('workshop', '#adventurers/workshop', t('Workshop', 'Taller'))}</nav>${body}</div>`;
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

 /* The Workshop: what it costs, and how long it takes, to make a thing. Prices in Anchors (1 Anchor = 1 gp). */
 const shop = {good: 1, price: 15, make: 'proof', smiths: 1, circle: 1, scrolls: 1, grade: 'uncommon', consumable: false, makers: 1, base: 0, where: 'city', roll: ''};
 function coin(anchors) {
  let bits = Math.round(anchors * 100);
  if(bits <= 0) return t('nothing', 'nada');
  const out = [], unit = (n, one, many) => n ? out.push(n.toLocaleString('en-US') + ' ' + (n === 1 ? one : many)) : 0;
  unit(Math.floor(bits / 1000), 'Orsal', t('Orsals', 'Orsals')); bits %= 1000;
  unit(Math.floor(bits / 100), t('Anchor', 'Anchor'), t('Anchors', 'Anchors')); bits %= 100;
  unit(Math.floor(bits / 10), t('Tide', 'Tide'), t('Tides', 'Tides')); unit(bits % 10, 'Bit', 'Bits');
  return out.join(', ');
 }
 const days = n => n + ' ' + (n === 1 ? t('day', 'día') : t('days', 'días'));
 const row = (k, v) => `<div class="adv-row"><dt>${k}</dt><dd>${v}</dd></div>`;
 const sel = (id, list, value) => `<select id="${id}">${list.map(([v, label]) => `<option value="${h(String(v))}"${String(v) === String(value) ? ' selected' : ''}>${h(label)}</option>`).join('')}</select>`;
 const num = (id, value, min, max) => `<input id="${id}" type="number" min="${min}" max="${max}" value="${value}" inputmode="numeric">`;
 const workers = (id, value) => sel(id, [[1, t('Alone', 'A solas')], [2, t('With one helper', 'Con un ayudante')], [3, t('With two helpers', 'Con dos ayudantes')]], value);

 function forgeOut() {
  const w = data.workshop, make = w.makes.find(m => m.id === shop.make);
  const list = shop.good === 'other' ? Math.max(0, +shop.price || 0) : w.goods[shop.good][1];
  const price = Math.max(list * make.factor, make.min && list ? make.min : 0);
  const time = Math.max(1, Math.ceil(Math.ceil(price / 10) / shop.smiths));
  const quality = shop.make === 'signed' ? `<p class="adv-note">${t('Choose one quality as the piece is finished:', 'Elige una cualidad al terminar la pieza:')}</p><ul class="adv-qual">${w.qualities.map(q => `<li><strong>${h(q.name)}.</strong> ${h(q.text)}</li>`).join('')}</ul>` : '';
  return `<dl class="adv-out">${row(t('It sells for', 'Se vende por'), coin(price))}${row(t('Materials', 'Materiales'), coin(price / 2))}${row(t('Time at the bench', 'Tiempo en el banco'), days(time) + (price < 10 ? ' ' + t('or less', 'o menos') : ''))}</dl><p class="adv-note">${h(make.note)}</p>${quality}`;
 }
 function scrollOut() {
  const [lvl, name, d, cost, dc, atk] = data.workshop.scrolls[shop.circle], n = Math.max(1, Math.min(20, +shop.scrolls || 1));
  const rings = lvl ? t(`To scribe it openly in Council lands you need ${lvl} copper ${lvl === 1 ? 'ring' : 'rings'}.`, `Para escribirlo abiertamente en tierras del Consejo necesitas ${lvl} ${lvl === 1 ? 'anillo' : 'anillos'} de cobre.`) : t('A cantrip needs no ring.', 'Un truco no necesita anillo.');
  return `<dl class="adv-out">${row(t('Materials', 'Materiales'), coin(cost * n))}${row(t('Time at the desk', 'Tiempo en el escritorio'), days(d * n))}${row(t('Save DC and attack', 'CD y ataque'), `${dc} / +${atk}`)}</dl><p class="adv-note">${t('You need proficiency in Arcana or with Calligrapher’s Supplies, and the spell prepared on every day of the work. Costly components are spent when the scroll is finished.', 'Necesitas competencia en Arcana o con útiles de calígrafo, y el conjuro preparado cada día de trabajo. Los componentes costosos se gastan al terminar.')} ${rings} ${t('A scroll sold with papers pays the Registry’s tenth. Without papers it is bright work.', 'Un pergamino vendido con papeles paga el diezmo del Registro. Sin papeles es bright work.')}</p>`;
 }
 function wonderOut() {
  const g = data.workshop.grades.find(x => x.id === shop.grade), half = shop.consumable ? 2 : 1, base = Math.max(0, +shop.base || 0);
  const time = Math.max(1, Math.ceil(g.days / half / shop.makers));
  const named = g.id === 'legendary' ? `<p class="adv-note">${t('A named work is never made to order. These are the bare numbers; the rest is a campaign, and your Game Master’s to decide.', 'Una obra con nombre nunca se hace por encargo. Estos son los números; lo demás es una campaña, y lo decide tu GM.')}</p>` : '';
  return `<dl class="adv-out">${row(t('Grade', 'Grado'), h(g.name) + ' · ' + h(g.rarity))}${row(t('Materials', 'Materiales'), coin(g.cost / half + base))}${row(t('Time', 'Tiempo'), days(time))}${row(t('It sells for', 'Se vende por'), h(g.sells))}</dl><p class="adv-note">${t('You and any helper need proficiency in Arcana and with the right tool. If the piece casts spells, you need them prepared every day of the work. A legal sale pays the Registry’s tenth: one Tide in every Anchor.', 'Tú y tus ayudantes necesitan competencia en Arcana y con la herramienta adecuada. Si la pieza lanza conjuros, debes tenerlos preparados cada día. Una venta legal paga el diezmo del Registro: un Tide por cada Anchor.')}</p>${named}${shop.roll ? `<p class="adv-roll">${h(shop.roll)}</p>` : ''}`;
 }
 function renderWorkshop() {
  const w = data.workshop;
  const goods = w.goods.map(([name, price], i) => [i, `${name} (${coin(price)})`]).concat([['other', t('Something else…', 'Otra cosa…')]]);
  frame('workshop', `<p class="adv-lead">${t('What it costs, and how long it takes, to make a thing in the islands. A day is eight hours of work, and the days need not be in a row.', 'Lo que cuesta, y lo que tarda, fabricar algo en las islas. Un día son ocho horas de trabajo, y no tienen que ser seguidos.')}</p>
  <section class="adv-panel adv-shop"><h2>${t('The forge', 'La forja')}</h2><p class="adv-hint">${t('Arms, armor, tools, and anything else with no magic in it. You need the right tool and proficiency with it.', 'Armas, armaduras, herramientas y todo lo que no lleva magia. Necesitas la herramienta adecuada y competencia con ella.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('Piece', 'Pieza')}${sel('ws-good', goods, shop.good)}</label><label class="pack-label" id="ws-price-wrap"${shop.good === 'other' ? '' : ' hidden'}>${t('Proof price, in Anchors', 'Precio proof, en Anchors')}${num('ws-price', shop.price, 0, 100000)}</label><label class="pack-label">${t('Make', 'Factura')}${sel('ws-make', w.makes.map(m => [m.id, m.name]), shop.make)}</label><label class="pack-label">${t('Hands', 'Manos')}${workers('ws-smiths', shop.smiths)}</label></div><div id="ws-forge">${forgeOut()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('The writing desk', 'El escritorio')}</h2><p class="adv-hint">${t('Spell scrolls, by circle.', 'Pergaminos de conjuro, por círculo.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('Circle', 'Círculo')}${sel('ws-circle', w.scrolls.map(x => [x[0], x[1]]), shop.circle)}</label><label class="pack-label">${t('How many', 'Cuántos')}${num('ws-scrolls', shop.scrolls, 1, 20)}</label></div><div id="ws-scroll">${scrollOut()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('The enchanter’s bench', 'El banco del encantador')}</h2><p class="adv-hint">${t('Charms and workings: the magic items of the islands, by grade.', 'Charms y workings: los objetos mágicos de las islas, por grado.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('Grade', 'Grado')}${sel('ws-grade', w.grades.map(g => [g.id, `${g.name} (${g.rarity})`]), shop.grade)}</label><label class="pack-label">${t('Hands', 'Manos')}${workers('ws-makers', shop.makers)}</label><label class="pack-label">${t('Cost of the thing it is laid on', 'Costo del objeto base')}${num('ws-base', shop.base, 0, 100000)}</label></div>
  <label class="adv-check"><input type="checkbox" id="ws-consumable"${shop.consumable ? ' checked' : ''}> ${t('Used up when used (a potion, a single charge): half the time and cost', 'Se gasta al usarse (una poción, una carga): mitad de tiempo y costo')}</label>
  <div id="ws-wonder">${wonderOut()}</div>
  <div class="pack-actions"><label class="pack-label adv-inline">${t('Looking for materials in', 'Buscas materiales en')}${sel('ws-where', [['city', t('a city', 'una ciudad')], ['else', t('anywhere else', 'otro lugar')]], shop.where)}</label><button type="button" class="button cream" id="ws-roll">${t('Are the materials in port?', '¿Hay materiales en el puerto?')} <span aria-hidden="true">✦</span></button></div>
  <div class="adv-table"><table><thead><tr><th>${t('To make', 'Para hacer')}</th><th>${t('You need', 'Necesitas')}</th></tr></thead><tbody>${w.tools.map(([a, b]) => `<tr><td>${h(a)}</td><td>${h(b)}</td></tr>`).join('')}</tbody></table></div></section>
  <p class="adv-hint">${t('For what these things are, read', 'Para saber qué son estas cosas, lee')} <a href="#entry/signed-works">Signed Works and the Great Sets</a> ${t('and', 'y')} <a href="#entry/charms-and-workings">Charms and Workings</a>.</p>
  <p class="adv-credit">${t('The times and costs follow the crafting rules of the System Reference Document 5.2 by Wizards of the Coast LLC, used under the Creative Commons Attribution 4.0 International License. Makes, grades, signed works, and the Registry are Kalvatar’s own.', 'Los tiempos y costos siguen las reglas de fabricación del System Reference Document 5.2 de Wizards of the Coast LLC, bajo licencia Creative Commons Attribution 4.0 International. Las facturas, grados, signed works y el Registro son de Kalvatar.')}</p>`);
  const on = (id, fn) => $('#' + id).addEventListener('input', e => {fn(e.target); $('#ws-forge').innerHTML = forgeOut(); $('#ws-scroll').innerHTML = scrollOut(); $('#ws-wonder').innerHTML = wonderOut();});
  on('ws-good', el => {shop.good = el.value === 'other' ? 'other' : +el.value; $('#ws-price-wrap').hidden = shop.good !== 'other';});
  on('ws-price', el => {shop.price = el.value;}); on('ws-make', el => {shop.make = el.value;}); on('ws-smiths', el => {shop.smiths = +el.value;});
  on('ws-circle', el => {shop.circle = +el.value;}); on('ws-scrolls', el => {shop.scrolls = el.value;});
  on('ws-grade', el => {shop.grade = el.value; shop.roll = '';}); on('ws-makers', el => {shop.makers = +el.value;}); on('ws-base', el => {shop.base = el.value;});
  on('ws-consumable', el => {shop.consumable = el.checked;}); on('ws-where', el => {shop.where = el.value; shop.roll = '';});
  $('#ws-roll').addEventListener('click', () => {
   const roll = 1 + Math.floor(Math.random() * 100), need = shop.where === 'city' ? 75 : 25, ok = roll <= need;
   shop.roll = t(`You rolled ${roll} (you needed ${need} or less). `, `Sacaste ${roll} (necesitabas ${need} o menos). `) + (ok ? t('The materials are here.', 'Los materiales están aquí.') : t('Not here. Ask again in seven days, or try another port.', 'Aquí no. Pregunta de nuevo en siete días, o prueba otro puerto.'));
   $('#ws-wonder').innerHTML = wonderOut();
  });
 }

 function route(view, parts) {
  if(view !== 'adventurers') return false;
  const draw = () => {
   if(location.hash.slice(1).split('/')[0] !== 'adventurers') return;
   if(failed || !data) {frame('names', `<p class="adv-hint">${t('The adventurers’ tools could not be loaded. Try reloading the page.', 'No se pudieron cargar las herramientas. Recarga la página.')}</p>`); return;}
   if(parts[1] === 'traits') renderTraits(parts[2]); else if(parts[1] === 'workshop') renderWorkshop(); else renderNames();
  };
  if(data || failed) draw(); else {frame('names', `<p class="adv-hint">${t('Loading…', 'Cargando…')}</p>`); ready.then(draw);}
  return true;
 }
 return {route, ready};
})();
