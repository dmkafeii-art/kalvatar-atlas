/* Adventurers: tools for players. A name generator and the peoples' traits. Data: adventurers.json. */
'use strict';
window.Adventurers = (() => {
 const h = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const t = (en, es) => window.Pack2?.language === 'es' ? es : en;
 const md = s => h(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
 const $ = s => document.querySelector(s);
 let data = null, failed = false;
 const state = {people: '', region: '', home: '', form: '', canonOnly: false, results: []};
 const ready = fetch('adventurers.json?v=15').then(r => {if(!r.ok) throw Error(); return r.json();})
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
  $('#content').innerHTML = `<div class="content-wrap pack-page adventurers"><div class="page-intro"><p class="eyebrow">KALVATAR / 175 EC</p><h1>${t('Adventurers', 'Aventureros')}</h1><p>${t('Tools for players: a name that sounds like the islands, what your people can do, what it costs to make things, and what to do between voyages.', 'Herramientas para jugadores: un nombre que suene a las islas, lo que tu pueblo sabe hacer, lo que cuesta fabricar cosas, y qué hacer entre viajes.')}</p></div><nav class="adv-tabs" aria-label="${t('Adventurers tools', 'Herramientas de aventureros')}">${link('names', '#adventurers', t('Name generator', 'Generador de nombres'))}${link('traits', '#adventurers/traits', t('Peoples and traits', 'Pueblos y rasgos'))}${link('workshop', '#adventurers/workshop', t('Workshop', 'Taller'))}${link('downtime', '#adventurers/downtime', t('Downtime', 'Tiempo libre'))}${link('side', '#adventurers/side-quests', t('Side quests', 'Misiones secundarias'))}${link('treasure', '#adventurers/treasure', t('Treasure', 'Tesoro'))}${link('sigil', '#adventurers/sigil', t('Sigil', 'Sigil'))}</nav>${body}</div>`;
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
 const shop = {cat: 0, group: 0, item: 3, price: 15, make: 'standard', smiths: 1, circle: 1, scrolls: 1, grade: 'uncommon', consumable: false, makers: 1, base: 0, where: 'city', roll: ''};
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

 const forgeGroup = () => data.workshop.goods[shop.cat].groups[shop.group];
 function forgeOut() {
  const w = data.workshop, make = w.makes.find(m => m.id === shop.make);
  const list = shop.item === 'other' ? Math.max(0, +shop.price || 0) : forgeGroup()[1][shop.item][1];
  const price = Math.max(list * make.factor, make.min && list ? make.min : 0);
  const time = make.time === 'hour' ? t('an hour', 'una hora') : days(Math.max(1, Math.ceil(Math.ceil(price / 10) / shop.smiths))) + (price < 10 ? ' ' + t('or less', 'o menos') : '');
  const picks = {superior: t('Choose one quality as the piece is finished:', 'Elige una cualidad al terminar la pieza:'), masterpiece: t('Choose two qualities as the piece is finished:', 'Elige dos cualidades al terminar la pieza:')}[shop.make];
  const quality = picks ? `<p class="adv-note">${picks}</p><ul class="adv-qual">${w.qualities.map(q => `<li><strong>${h(q.name)}.</strong> ${h(q.text)}</li>`).join('')}</ul>` : '';
  return `<dl class="adv-out">${row(t('It sells for', 'Se vende por'), make.factor ? coin(price) : t('nothing', 'nada'))}${row(t('Materials', 'Materiales'), make.factor ? coin(price / 2) : t('whatever is at hand', 'lo que haya a mano'))}${row(t('Time at the bench', 'Tiempo en el banco'), time)}${row(t('Who makes it', 'Quién lo hace'), h(make.who))}</dl><p class="adv-note">${h(make.note)}</p>${quality}`;
 }
 const forgeLists = () => {
  const w = data.workshop;
  return {cats: w.goods.map((c, n) => [n, c.cat]), groups: w.goods[shop.cat].groups.map((g, n) => [n, g[0]]),
   items: forgeGroup()[1].map(([name, price], n) => [n, `${name} (${coin(price)})`]).concat([['other', t('Something else…', 'Otra cosa…')]])};
 };
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
  const fl = forgeLists();
  frame('workshop', `<p class="adv-lead">${t('What it costs, and how long it takes, to make a thing in the islands. A day is eight hours of work, and the days need not be in a row.', 'Lo que cuesta, y lo que tarda, fabricar algo en las islas. Un día son ocho horas de trabajo, y no tienen que ser seguidos.')}</p>
  <section class="adv-panel adv-shop"><h2>${t('The forge', 'La forja')}</h2><p class="adv-hint">${t('Arms, armor, tools, and anything else with no magic in it, in any of the five makes: improvised, crude, standard, superior, or masterpiece.', 'Armas, armaduras, herramientas y todo lo que no lleva magia, en cualquiera de las cinco facturas: improvised, crude, standard, superior o masterpiece.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('Kind', 'Tipo')}${sel('ws-cat', fl.cats, shop.cat)}</label><label class="pack-label">${t('Of which', 'De cuáles')}${sel('ws-group', fl.groups, shop.group)}</label><label class="pack-label">${t('Piece', 'Pieza')}${sel('ws-item', fl.items, shop.item)}</label><label class="pack-label" id="ws-price-wrap"${shop.item === 'other' ? '' : ' hidden'}>${t('Standard price, in Anchors', 'Precio estándar, en Anchors')}${num('ws-price', shop.price, 0, 100000)}</label><label class="pack-label">${t('Make', 'Factura')}${sel('ws-make', w.makes.map(m => [m.id, m.name]), shop.make)}</label><label class="pack-label">${t('Hands', 'Manos')}${workers('ws-smiths', shop.smiths)}</label></div><div id="ws-forge">${forgeOut()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('The writing desk', 'El escritorio')}</h2><p class="adv-hint">${t('Spell scrolls, by circle.', 'Pergaminos de conjuro, por círculo.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('Circle', 'Círculo')}${sel('ws-circle', w.scrolls.map(x => [x[0], x[1]]), shop.circle)}</label><label class="pack-label">${t('How many', 'Cuántos')}${num('ws-scrolls', shop.scrolls, 1, 20)}</label></div><div id="ws-scroll">${scrollOut()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('The enchanter’s bench', 'El banco del encantador')}</h2><p class="adv-hint">${t('Charms and workings: the magic items of the islands, by grade.', 'Charms y workings: los objetos mágicos de las islas, por grado.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('Grade', 'Grado')}${sel('ws-grade', w.grades.map(g => [g.id, `${g.name} (${g.rarity})`]), shop.grade)}</label><label class="pack-label">${t('Hands', 'Manos')}${workers('ws-makers', shop.makers)}</label><label class="pack-label">${t('Cost of the thing it is laid on', 'Costo del objeto base')}${num('ws-base', shop.base, 0, 100000)}</label></div>
  <label class="adv-check"><input type="checkbox" id="ws-consumable"${shop.consumable ? ' checked' : ''}> ${t('Used up when used (a potion, a single charge): half the time and cost', 'Se gasta al usarse (una poción, una carga): mitad de tiempo y costo')}</label>
  <div id="ws-wonder">${wonderOut()}</div>
  <div class="pack-actions"><label class="pack-label adv-inline">${t('Looking for materials in', 'Buscas materiales en')}${sel('ws-where', [['city', t('a city', 'una ciudad')], ['else', t('anywhere else', 'otro lugar')]], shop.where)}</label><button type="button" class="button cream" id="ws-roll">${t('Are the materials in port?', '¿Hay materiales en el puerto?')} <span aria-hidden="true">✦</span></button></div>
  <div class="adv-table"><table><thead><tr><th>${t('To make', 'Para hacer')}</th><th>${t('You need', 'Necesitas')}</th></tr></thead><tbody>${w.tools.map(([a, b]) => `<tr><td>${h(a)}</td><td>${h(b)}</td></tr>`).join('')}</tbody></table></div></section>
  <p class="adv-hint">${t('For what these things are, read', 'Para saber qué son estas cosas, lee')} <a href="#entry/signed-works">Signed Works and the Great Sets</a> ${t('and', 'y')} <a href="#entry/charms-and-workings">Charms and Workings</a>.</p>
  <p class="adv-credit">${t('The times and costs follow the crafting rules of the System Reference Document 5.2 by Wizards of the Coast LLC, used under the Creative Commons Attribution 4.0 International License. The five makes, the exotic arms, the grades, and the Registry are Kalvatar’s own.', 'Los tiempos y costos siguen las reglas de fabricación del System Reference Document 5.2 de Wizards of the Coast LLC, bajo licencia Creative Commons Attribution 4.0 International. Las cinco facturas, las armas exóticas, los grados y el Registro son de Kalvatar.')}</p>`);
  const on = (id, fn) => $('#' + id).addEventListener('input', e => {fn(e.target); $('#ws-forge').innerHTML = forgeOut(); $('#ws-scroll').innerHTML = scrollOut(); $('#ws-wonder').innerHTML = wonderOut();});
  const fill = (id, list, value) => {$('#' + id).innerHTML = list.map(([v, label]) => `<option value="${h(String(v))}"${String(v) === String(value) ? ' selected' : ''}>${h(label)}</option>`).join('');};
  const refill = () => {const l = forgeLists(); fill('ws-group', l.groups, shop.group); fill('ws-item', l.items, shop.item); $('#ws-price-wrap').hidden = shop.item !== 'other';};
  on('ws-cat', el => {shop.cat = +el.value; shop.group = 0; shop.item = 0; refill();});
  on('ws-group', el => {shop.group = +el.value; shop.item = 0; refill();});
  on('ws-item', el => {shop.item = el.value === 'other' ? 'other' : +el.value; $('#ws-price-wrap').hidden = shop.item !== 'other';});
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

 /* Downtime: what to do between voyages, and what learning costs. */
 const free = {what: 'tongue', mod: 0, how: 'teacher', ideas: []};
 function learnOut() {
  const x = data.downtime.learn.find(l => l.id === free.what), alone = x.alone && free.how === 'alone';
  let cycles = x.flat ? x.cycles : Math.max(x.min, x.cycles - free.mod);
  if(alone) cycles *= 2;
  return `<dl class="adv-out">${row(t('Time', 'Tiempo'), `${cycles} ${t('Cycles', 'Cycles')} · ${cycles * 10} ${t('days', 'días')}`)}${row(t('The teacher’s fee', 'Lo que cobra el maestro'), alone ? t('nothing', 'nada') : coin(x.fee * cycles))}${row(t('Each Cycle', 'Cada Cycle'), alone ? t('nothing', 'nada') : coin(x.fee))}</dl><p class="adv-note">${h(x.note)} ${t('Always with your Game Master’s leave.', 'Siempre con permiso de tu GM.')}</p>`;
 }
 function ideasHtml() {
  if(!free.ideas.length) return '';
  return `<ol class="adv-results">${free.ideas.map(([name, text, link]) => `<li><div><strong class="adv-name">${h(name)}</strong><span class="adv-meta">${h(text)}${link ? ` <a href="#entry/${h(link)}">${t('Read more', 'Leer más')}</a>` : ''}</span></div></li>`).join('')}</ol>`;
 }
 function renderDowntime() {
  const d = data.downtime, mods = [-1, 0, 1, 2, 3, 4, 5].map(m => [m, (m > 0 ? '+' : '') + m]);
  const table = (heads, rows) => `<div class="adv-table"><table><thead><tr>${heads.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${h(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  frame('downtime', `<p class="adv-lead">${t('Between voyages there is a port, a purse, and some days to spend. A Cycle is ten days.', 'Entre viajes hay un puerto, una bolsa y unos días para gastar. Un Cycle son diez días.')}</p>
  <section class="adv-panel adv-shop"><h2>${t('Something to do', 'Algo que hacer')}</h2><p class="adv-hint">${t('Three ideas for the days in port.', 'Tres ideas para los días en puerto.')}</p><div class="pack-actions"><button type="button" class="button" id="dt-ideas">${t('Give me three', 'Dame tres')} <span aria-hidden="true">✦</span></button></div><div id="dt-list" aria-live="polite">${ideasHtml()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('Learning', 'Aprender')}</h2><p class="adv-hint">${t('A tongue, a tool, a skill, or a feat, from someone who has it.', 'Un idioma, una herramienta, una habilidad o una dote, de alguien que la tenga.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('What', 'Qué')}${sel('dt-what', d.learn.map(l => [l.id, l.name]), free.what)}</label><label class="pack-label">${t('Your Intelligence modifier', 'Tu modificador de Inteligencia')}${sel('dt-mod', mods, free.mod)}</label><label class="pack-label">${t('How', 'Cómo')}${sel('dt-how', [['teacher', t('With a teacher', 'Con un maestro')], ['alone', t('By living among speakers (tongues only)', 'Viviendo entre hablantes (solo idiomas)')]], free.how)}</label></div><div id="dt-learn">${learnOut()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('Working', 'Trabajar')}</h2><p class="adv-hint">${t('What the islands pay. Wages fall due on Coinsday, every ten days.', 'Lo que pagan las islas. El salario se cobra en Coinsday, cada diez días.')}</p>${table([t('Work', 'Trabajo'), t('Pay', 'Paga'), t('In a Cycle', 'En un Cycle')], d.work)}<h3>${t('And what living costs', 'Y lo que cuesta vivir')}</h3>${table([t('How', 'Cómo'), t('Cost', 'Costo')], d.living)}<p class="adv-hint"><a href="#entry/jobs-and-wages">${t('The whole wage-book', 'El libro de salarios completo')}</a> · <a href="#adventurers/workshop">${t('Making things: the Workshop', 'Fabricar cosas: el Taller')}</a></p></section>
  ${window.Pack2?.language === 'es' ? '<p class="adv-hint">Las ideas y las tablas están en inglés por ahora.</p>' : ''}`);
  const again = () => {$('#dt-learn').innerHTML = learnOut();};
  $('#dt-what').addEventListener('input', e => {free.what = e.target.value; again();});
  $('#dt-mod').addEventListener('input', e => {free.mod = +e.target.value; again();});
  $('#dt-how').addEventListener('input', e => {free.how = e.target.value; again();});
  $('#dt-ideas').addEventListener('click', () => {
   const pool = d.ideas.slice(); free.ideas = [];
   while(free.ideas.length < 3 && pool.length) free.ideas.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
   $('#dt-list').innerHTML = ideasHtml();
  });
 }

 /* Side quests: a twist of Ranking cards, a patch to earn, a hook, and a curiosity. */
 const side = {twist: [], patch: null, hook: '', curio: '', pulled: 0};
 const stat = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
 function card() {
  const c = data.sidequests.cards, r = Math.random();
  const stats = (lo, hi) => ({steel: stat(lo, hi), wit: stat(lo, hi), luck: stat(lo, hi)});
  if(r < .003) return {border: 'silhouette', label: t('A silhouette', 'Una silueta'), name: t('One of the Ten', 'Uno de los Diez') + ', No. ' + stat(1, 10), line: t('A black shape and a number. Nobody knows whose.', 'Una forma negra y un número. Nadie sabe de quién.'), ...stats(7, 9)};
  if(r < .004) return {border: 'gilt', label: t('Gilt', 'Dorada'), name: c.face[0], line: c.face[1] + '.', bio: c.bios[c.face[0]], ...stats(7, 9)};
  if(r < .054) {const f = pick(c.famous), gilt = chance(.08); return {border: gilt ? 'gilt' : 'silver', label: gilt ? t('Gilt', 'Dorada') : t('Silver-edged', 'Borde de plata'), name: f[0], line: f[1] + '.', bio: c.bios[f[0]], ...stats(5, 9)};}
  if(r < .17) return {border: 'copper', label: t('Copper-edged', 'Borde de cobre'), name: pick(c.companies), line: t('A company of the Ranking.', 'Una compañía del Ranking.'), ...stats(4, 8)};
  if(r < .23) return {border: 'copper', label: t('Copper-edged', 'Borde de cobre'), name: pick(c.deeds), line: t('A Great Deed.', 'Una Gran Hazaña.'), ...stats(3, 9)};
  if(r < .31) {const l = pick(c.lodges); return {border: 'plain', label: t('Plain', 'Sencilla'), name: l[0].toUpperCase() + l.slice(1), line: t('A Lodge card.', 'Carta de Lodge.'), ...stats(2, 6)};}
  const p = choosePeople(''), n = make(p, '', ''), silver = chance(.25);
  return {border: silver ? 'copper' : 'plain', label: silver ? t('Copper-edged', 'Borde de cobre') : t('Plain', 'Sencilla'), name: n.name, line: `${silver ? 'Silver · ' + pick(c.branches) : 'Bronze'} · ${pick(c.lodges)} · ${p.name.replace(/ \(.*\)$/, '')}`, bio: `${pick(c.known)}. ${pick(c.quirk)}`, ...stats(1, silver ? 7 : 6)};
 }
 function twistHtml() {
  if(!side.twist.length) return '';
  return `<ol class="adv-cards">${side.twist.map(x => `<li class="adv-card adv-card-${x.border}"><span class="adv-card-kind">${h(x.label)}</span><strong>${h(x.name)}</strong><span class="adv-card-line">${h(x.line)}</span>${x.bio ? `<span class="adv-card-bio">${h(x.bio)}</span>` : ''}<span class="adv-card-stats">${t('Steel', 'Acero')} ${x.steel} · ${t('Wit', 'Ingenio')} ${x.wit} · ${t('Luck', 'Suerte')} ${x.luck}</span></li>`).join('')}</ol><p class="adv-note">${t('Twists opened here', 'Sobres abiertos aquí')}: ${side.pulled}. ${t('Each costs a Bit.', 'Cada uno cuesta un Bit.')}</p>`;
 }
 function patchHtml() {
  const p = side.patch;
  if(!p) return '';
  return `<dl class="adv-out">${row(t('The place', 'El lugar'), h(p.place))}${row(t('The patch', 'El parche'), h(p.design))}${row(t('First stitch by', 'Primera puntada'), h(p.giver))}</dl><p class="adv-roll">${t('To earn it', 'Para ganarlo')}: ${h(p.deed)}.</p><p class="adv-note">${h(p.catch)}</p>`;
 }
 function renderSide() {
  const q = data.sidequests;
  frame('side', `<p class="adv-lead">${t('Small things to chase in any port. None of them needs a villain.', 'Cosas pequeñas que perseguir en cualquier puerto. Ninguna necesita un villano.')}</p>
  <section class="adv-panel adv-shop"><h2>${t('Open a twist', 'Abre un sobre')}</h2><p class="adv-hint">${t('Five Ranking cards for a Bit. Play Flip with what you pull: turn a card each, call a number, higher takes both.', 'Cinco Ranking cards por un Bit. Juega Flip con lo que saques: cada uno voltea una carta, se canta un número, el mayor se lleva las dos.')} <a href="#entry/ranking-cards">${t('About the cards', 'Sobre las cartas')}</a></p><div class="pack-actions"><button type="button" class="button" id="sq-twist">${t('Open one', 'Abrir uno')} <span aria-hidden="true">✦</span></button></div><div id="sq-cards" aria-live="polite">${twistHtml()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('A patch to earn', 'Un parche por ganar')}</h2><p class="adv-hint">${t('Every port has one waiting.', 'Todo puerto tiene uno esperando.')} <a href="#entry/patches">${t('About patches', 'Sobre los parches')}</a></p><div class="pack-actions"><button type="button" class="button" id="sq-patch">${t('Find one', 'Encontrar uno')} <span aria-hidden="true">✦</span></button></div><div id="sq-patch-out" aria-live="polite">${patchHtml()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('Something is going on', 'Algo está pasando')}</h2><p class="adv-hint">${t('A hook for tonight.', 'Un gancho para esta noche.')}</p><div class="pack-actions"><button type="button" class="button" id="sq-hook">${t('What is the talk?', '¿Qué se dice?')} <span aria-hidden="true">✦</span></button></div><p class="adv-roll" id="sq-hook-out" aria-live="polite"${side.hook ? '' : ' hidden'}>${h(side.hook)}</p></section>
  <section class="adv-panel adv-shop"><h2>${t('Did you know?', '¿Sabías que?')}</h2><div class="pack-actions"><button type="button" class="button cream" id="sq-curio">${t('Tell me something', 'Cuéntame algo')} <span aria-hidden="true">✦</span></button></div><p class="adv-roll" id="sq-curio-out" aria-live="polite"${side.curio ? '' : ' hidden'}>${h(side.curio)}</p></section>
  ${window.Pack2?.language === 'es' ? '<p class="adv-hint">Las cartas, parches, ganchos y curiosidades salen en inglés por ahora.</p>' : ''}`);
  $('#sq-twist').addEventListener('click', () => {side.twist = [card(), card(), card(), card(), card()]; side.pulled++; $('#sq-cards').innerHTML = twistHtml();});
  $('#sq-patch').addEventListener('click', () => {
   const x = q.patch, a = pick(x.motif); let b = pick(x.motif); while(b === a) b = pick(x.motif);
   side.patch = {place: pick(x.place), design: `${a} ${t('and', 'y')} ${b}, ${t('on', 'sobre')} ${pick(x.color)}`, deed: pick(x.deed), giver: pick(x.giver), catch: pick(x.catch)};
   $('#sq-patch-out').innerHTML = patchHtml();
  });
  const say = (btn, out, key, list) => $('#' + btn).addEventListener('click', () => {let v = pick(list); while(v === side[key] && list.length > 1) v = pick(list); side[key] = v; const el = $('#' + out); el.hidden = false; el.textContent = v;});
  say('sq-hook', 'sq-hook-out', 'hook', q.hooks); say('sq-curio', 'sq-curio-out', 'curio', q.curios);
 }

 /* Treasure: what a fight might leave behind, for a party, a level, a region, and a difficulty. For the Game Master. */
 const loot = {size: 4, level: 3, region: 'heartland', hard: 1, kind: 1, out: null};
 function rollLoot() {
  const T = data.sidequests.treasure, tier = T.tiers.find(x => loot.level <= x.to), reg = T.regions.find(r => r.id === loot.region);
  const xpEach = T.xp[loot.level - 1][loot.hard], total = Math.max(1, Math.round(tier.base * [1, 2, 4][loot.hard] * loot.kind * loot.size / 4 * (0.8 + Math.random() * 0.4)));
  let left = total * (0.4 + Math.random() * 0.2), goods = [];
  const pool = reg.goods.filter(g => g[1] <= left).sort(() => Math.random() - .5).slice(0, 3);
  for(const [name, value] of pool) {
   const n = Math.min(8, Math.max(1, Math.floor(left / value / (pool.length > 1 ? 2 : 1))));
   if(value * n > left) continue;
   goods.push({name, n, value: value * n}); left -= value * n;
  }
  const spent = goods.reduce((a, g) => a + g.value, 0), magic = [];
  if(Math.random() * 100 < tier.magic[loot.hard] * (loot.kind > 1 ? 2 : 1)) magic.push(tier.grade + ': ' + pick(T.magic[tier.grade]));
  if(loot.level > 4 && chance(.25)) magic.push('A charm: ' + pick(T.magic['A charm']));
  loot.out = {xpEach, xpAll: xpEach * loot.size, total, coins: total - spent, goods, magic, extra: chance(.45) ? pick(T.extras) : '', coin: reg.coin, region: reg.name};
 }
 function lootHtml() {
  const o = loot.out;
  if(!o) return '';
  const each = o.total / loot.size;
  return `<dl class="adv-out">${row(t('Worth, all told', 'Valor total'), coin(o.total))}${row(t('A share each', 'Parte de cada uno'), coin(Math.floor(each * 100) / 100))}${row(t('Experience', 'Experiencia'), `${o.xpAll.toLocaleString('en-US')} XP · ${o.xpEach.toLocaleString('en-US')} ${t('each', 'cada uno')}`)}</dl>
  <ul class="adv-loot"><li><strong>${t('Coin', 'Monedas')}:</strong> ${coin(o.coins)}. <span>${h(o.coin)}</span></li>${o.goods.map(g => `<li><strong>${g.n > 1 ? g.n + ' × ' : ''}${h(g.name)}</strong> <span>${coin(g.value)}${g.n > 1 ? ' ' + t('together', 'en total') : ''}</span></li>`).join('')}${o.magic.map(m => `<li class="adv-loot-magic"><strong>${h(m)}</strong> <span>${t('on top of the rest', 'además del resto')}</span></li>`).join('')}${o.extra ? `<li><strong>${t('And', 'Y')}:</strong> ${h(o.extra)}</li>` : ''}</ul>
  <p class="adv-note">${t('An idea, not a rule: change anything. The experience is the 2024 budget for a fight of that difficulty, so it is also what such a fight is worth if you give experience for it.', 'Una idea, no una regla: cambia lo que quieras. La experiencia es el presupuesto 2024 para un combate de esa dificultad, así que también es lo que vale ese combate si das experiencia.')}</p>`;
 }
 function renderTreasure() {
  const T = data.sidequests.treasure, levels = Array.from({length: 20}, (_, i) => [i + 1, String(i + 1)]), sizes = [1, 2, 3, 4, 5, 6, 7, 8].map(n => [n, String(n)]);
  frame('treasure', `<p class="adv-lead">${t('For the Game Master: what a fight might leave behind. In the islands a laborer’s year is one Orsal, so a little coin goes a long way.', 'Para el GM: lo que puede dejar un combate. En las islas el año de un jornalero es un Orsal, así que poca moneda rinde mucho.')}</p>
  <section class="adv-panel adv-shop"><h2>${t('The take', 'El botín')}</h2>
  <div class="adv-controls"><label class="pack-label">${t('Party', 'Grupo')}${sel('tr-size', sizes, loot.size)}</label><label class="pack-label">${t('Level', 'Nivel')}${sel('tr-level', levels, loot.level)}</label><label class="pack-label">${t('Where', 'Dónde')}${sel('tr-region', T.regions.map(r => [r.id, r.name]), loot.region)}</label><label class="pack-label">${t('The fight was', 'El combate fue')}${sel('tr-hard', [[0, t('Low', 'Bajo')], [1, t('Moderate', 'Moderado')], [2, t('High', 'Alto')]], loot.hard)}</label><label class="pack-label">${t('Found', 'Se encontró')}${sel('tr-kind', [[1, t('On the losers', 'En los vencidos')], [3, t('In a lair or a strongbox', 'En una guarida o un cofre')]], loot.kind)}</label></div>
  <div class="pack-actions"><button type="button" class="button" id="tr-roll">${t('What did they leave?', '¿Qué dejaron?')} <span aria-hidden="true">✦</span></button></div><div id="tr-out" aria-live="polite">${lootHtml()}</div></section>
  <p class="adv-hint">${t('What the things are', 'Qué son las cosas')}: <a href="#entry/charms-and-workings">Charms and Workings</a> · <a href="#entry/coins-and-prices">Coins and Prices</a> · <a href="#entry/signed-works">Signed Works</a></p>
  <p class="adv-credit">${t('Experience budgets follow the encounter guidelines of the 2024 rules. Coin, goods, and grades are Kalvatar’s own.', 'Los presupuestos de experiencia siguen las guías de encuentros de las reglas 2024. Monedas, bienes y grados son de Kalvatar.')}</p>`);
  const set = (id, key) => $('#' + id).addEventListener('input', e => {loot[key] = isNaN(+e.target.value) ? e.target.value : +e.target.value;});
  set('tr-size', 'size'); set('tr-level', 'level'); set('tr-region', 'region'); set('tr-hard', 'hard'); set('tr-kind', 'kind');
  $('#tr-roll').addEventListener('click', () => {rollLoot(); $('#tr-out').innerHTML = lootHtml();});
 }

 /* The Sigil bench: the Hunters' badge. Bronze is the same for everyone; from Silver the bearer designs their own. */
 const badge = {rank: 'silver', a: 0, b: 3, deeds: 3, shape: 'shield', field: 'rays', flourish: 'laurel'};
 const METAL = {bronze: ['#b9793f', '#6f431d', '#e6ac70', '#8f5a2b'], silver: ['#c5cbd1', '#6f7982', '#f4f6f8', '#98a2ab'], gold: ['#d6ac42', '#7e5c12', '#f8e092', '#b08a26'], platinum: ['#e4eaed', '#92a4ab', '#ffffff', '#c3d0d5']};
 const STONE = ['#a3262e', '#2d5fae', '#3f8f5c', '#f3f0e4', '#e08a8f', '#1c1c1f', '#d49a2b', '#7a4fa3'];
 const DEVICE = [
  c => `<path d="M0-70 10-50 8 14-8 14-10-50Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0-66V12" stroke="${c[3]}" stroke-width="2"/><path d="M-26 14Q0 6 26 14L24 24Q0 16-24 24Z" fill="${c[1]}"/><rect x="-5" y="22" width="10" height="26" rx="2" fill="${c[3]}" stroke="${c[1]}" stroke-width="2"/><circle cy="56" r="8" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5"/>`,
  c => `<path d="M0-68 28-26 16 54-16 54-28-26Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0-68 0 0M-28-26 0 0 28-26M0 0-16 54M0 0 16 54" fill="none" stroke="${c[1]}" stroke-width="1.6"/><path d="M-28-26 0-38 28-26" fill="none" stroke="${c[3]}" stroke-width="1.6"/><path d="M-44-50l4 8 8 4-8 4-4 8-4-8-8-4 8-4ZM42 30l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill="${c[1]}"/>`,
  c => `<path d="M0-44V50" stroke="${c[1]}" stroke-width="7" stroke-linecap="round"/><path d="M0-44V50" stroke="${c[3]}" stroke-width="2.5"/><path d="M0-72 18-38 0-46-18-38Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0 22-20 44-20 66 0 48 20 66 20 44Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0 30-12 44M0 30 12 44M0 40-12 54M0 40 12 54" stroke="${c[1]}" stroke-width="1.5"/>`,
  c => `<path d="M-10 66C-16 8-6-34 26-70 38-24 26 18-2 44Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-10 66C-2 20 8-24 26-70" fill="none" stroke="${c[1]}" stroke-width="2.5"/><path d="M4-18 20-30M0 2 22-10M-4 22 16 10M12-40 24-48" stroke="${c[3]}" stroke-width="1.8"/><path d="M-10 66-16 48-4 54Z" fill="${c[1]}"/>`,
  c => `<path d="M0-66C22-56 40-54 50-54 50 4 30 44 0 66-30 44-50 4-50-54-40-54-22-56 0-66Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0-52C16-45 30-43 38-43 38 0 23 32 0 50-23 32-38 0-38-43-30-43-16-45 0-52Z" fill="none" stroke="${c[3]}" stroke-width="1.6"/><path d="M0-30C14-8 20 4 20 14A20 20 0 0 1-20 14C-20 4-14-8 0-30Z" fill="${c[1]}"/><path d="M-9 16A9 9 0 0 0 0 25" fill="none" stroke="${c[2]}" stroke-width="2.5" stroke-linecap="round"/>`,
  c => `<path d="M-46 22H46L36 36H14L20 58H-20L-14 36H-36Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-46 22Q-58 10-40 8H46V22Z" fill="${c[3]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><g transform="rotate(-28 0 -20)"><rect x="-4" y="-40" width="8" height="52" rx="2" fill="${c[1]}"/><path d="M-26-66H22L30-54 22-42H-26Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/></g>`,
  c => `<circle r="50" fill="none" stroke="${c[1]}" stroke-width="2"/><path d="M0-36 6-6 36 0 6 6 0 36-6 6-36 0-6-6Z" transform="rotate(45)" fill="${c[3]}" stroke="${c[1]}" stroke-width="1.5"/><path d="M0-70 11-11 70 0 11 11 0 70-11 11-70 0-11-11Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0-70V70M-70 0H70" stroke="${c[1]}" stroke-width="1.2"/><circle r="6" fill="${c[1]}"/>`,
  c => `<path d="M-14-50A14 14 0 0 1 14-50" fill="none" stroke="${c[1]}" stroke-width="6" stroke-linecap="round"/><path d="M-24-48H24L18-36H-18Z" fill="${c[3]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-20-36H20L28 40H-28Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-7-36-10 40M7-36 10 40" stroke="${c[1]}" stroke-width="1.6"/><path d="M-32 40H32L26 54H-26Z" fill="${c[3]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0-22C12-4 15 6 15 14A15 15 0 0 1-15 14C-15 6-8 2 0-22Z" fill="${c[1]}"/><path d="M-70-6-52-2M70-6 52-2M-64-38-48-26M64-38 48-26" stroke="${c[1]}" stroke-width="2.5" stroke-linecap="round"/>`];
 const COMMON = c => `<path d="M0-66 9-30 44-22 9-14 0 22-9-14-44-22-9-30Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-60 34q15-14 30 0t30 0 30 0 30 0M-60 54q15-14 30 0t30 0 30 0 30 0" fill="none" stroke="${c[1]}" stroke-width="5" stroke-linecap="round"/>`;
 const SHAPE = {
  disc: 'M0-120A120 120 0 1 1 0 120A120 120 0 1 1 0-120Z',
  shield: 'M0-122C40-106 78-102 108-102C108 6 70 82 0 124C-70 82-108 6-108-102C-78-102-40-106 0-122Z',
  sunburst: (() => {let d = ''; for(let k = 0; k < 24; k++) {const a = k * Math.PI / 12, r = k % 2 ? 104 : 124; d += (k ? 'L' : 'M') + (r * Math.sin(a)).toFixed(1) + ' ' + (-r * Math.cos(a)).toFixed(1);} return d + 'Z';})(),
  diamond: 'M0-126Q12-112 114 0Q12 112 0 126Q-12 112-114 0Q-12-112 0-126Z',
  hex: 'M0-124 107-62 107 62 0 124-107 62-107-62Z'};
 function sigilSvg() {
  const c = METAL[badge.rank], bronze = badge.rank === 'bronze', hidden = badge.rank === 'platinum';
  const two = badge.rank === 'gold' && badge.b !== '' && +badge.b !== badge.a;
  const shape = SHAPE[bronze ? 'disc' : badge.shape], field = bronze ? 'plain' : badge.field, flourish = bronze ? 'none' : badge.flourish;
  const fields = {plain: '',
   rays: Array.from({length: 24}, (_, k) => `<path d="M0 0L${(170 * Math.sin((k + .25) * Math.PI / 12)).toFixed(1)} ${(-170 * Math.cos((k + .25) * Math.PI / 12)).toFixed(1)}L${(170 * Math.sin((k + .75) * Math.PI / 12)).toFixed(1)} ${(-170 * Math.cos((k + .75) * Math.PI / 12)).toFixed(1)}Z" fill="${c[3]}" opacity=".28"/>`).join(''),
   waves: [-90, -66, -42, -18, 6, 30, 54, 78, 102].map(y => `<path d="M-130 ${y}q13-11 26 0t26 0 26 0 26 0 26 0 26 0 26 0 26 0 26 0 26 0" fill="none" stroke="${c[3]}" stroke-width="2" opacity=".55"/>`).join(''),
   scales: Array.from({length: 11}, (_, r) => Array.from({length: 12}, (_, q) => `<path d="M${-132 + q * 24 + (r % 2) * 12} ${-116 + r * 22}a12 12 0 0 0 24 0" fill="none" stroke="${c[3]}" stroke-width="1.8" opacity=".5"/>`).join('')).join('')};
  const leaf = (a, side) => {const r = badge.shape === 'disc' ? 96 : 74, x = side * r * Math.sin(a), y = r * Math.cos(a) * -1 + 8; return `<path d="M0 0Q9-10 0-24Q-9-10 0 0Z" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(side * (a * 180 / Math.PI) + side * 28).toFixed(0)})" fill="${c[2]}" stroke="${c[1]}" stroke-width="1.5"/>`;};
  const fl = {none: '',
   laurel: [1, -1].map(sd => [2.75, 2.45, 2.15, 1.85, 1.55, 1.25, .95].map(a => leaf(a, sd)).join('')).join(''),
   wings: [1, -1].map(sd => `<g transform="scale(${sd} 1)"><path d="M92-6C150-40 176-34 190-66C186-22 168 6 132 22C150 22 162 18 172 10C162 36 138 50 108 48C120 54 130 54 138 52C124 68 104 72 88 62Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M100 4C130-6 156-22 176-44M100 24C124 22 146 16 162 6M96 44C112 46 126 44 134 40" fill="none" stroke="${c[1]}" stroke-width="1.6"/></g>`).join(''),
   rope: `<path d="${shape}" transform="scale(.9)" fill="none" stroke="${c[2]}" stroke-width="9" stroke-dasharray="8 6"/>`};
  const stone = !bronze && !hidden ? `<g transform="translate(0 ${badge.shape === 'shield' ? -100 : -98})"><circle r="12" fill="${c[1]}"/><circle r="9" fill="${STONE[badge.a]}"/><path d="M-4-4a6 6 0 0 1 6-2" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/></g>` : '';
  const studs = badge.rank === 'gold' ? Array.from({length: badge.deeds}, (_, n) => {const a = (90 + (n - (badge.deeds - 1) / 2) * 17) * Math.PI / 180; return `<circle cx="${(86 * Math.cos(a)).toFixed(1)}" cy="${(86 * Math.sin(a)).toFixed(1)}" r="5.5" fill="${c[2]}" stroke="${c[1]}" stroke-width="2"/>`;}).join('') : '';
  const dev = bronze ? COMMON(c) : hidden ? `<g opacity=".14">${DEVICE[badge.a](c)}</g>` : two ? `<g transform="rotate(40) scale(.8)">${DEVICE[+badge.b](c)}</g><g transform="rotate(-40) scale(.8)">${DEVICE[badge.a](c)}</g>` : `<g transform="scale(.92)">${DEVICE[badge.a](c)}</g>`;
  const wide = flourish === 'wings';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${wide ? '-200 -140 400 280' : '-140 -140 280 280'}" role="img" aria-label="${t('A Hunter’s Sigil', 'Un Sigil de Hunter')}"><defs><radialGradient id="sg" cx="34%" cy="26%" r="85%"><stop offset="0" stop-color="${c[2]}"/><stop offset=".55" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[3]}"/></radialGradient><clipPath id="sc"><path d="${shape}" transform="scale(.93)"/></clipPath></defs>${wide ? fl.wings : ''}<path d="${shape}" transform="translate(0 5)" fill="#0d2226" opacity=".35"/><path d="${shape}" fill="${c[1]}"/><path d="${shape}" transform="scale(.96)" fill="url(#sg)"/><g clip-path="url(#sc)">${fields[field]}</g><path d="${shape}" transform="scale(.93)" fill="none" stroke="${c[1]}" stroke-width="${bronze ? 7 : 3.5}"/>${bronze ? '' : `<path d="${shape}" transform="scale(.8)" fill="none" stroke="${c[1]}" stroke-width="1.6"/><path d="${shape}" transform="scale(.865)" fill="none" stroke="${c[2]}" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"/>`}${flourish === 'rope' ? fl.rope : ''}${flourish === 'laurel' ? fl.laurel : ''}${studs}${dev}${stone}<path d="M-10 ${badge.shape === 'shield' && !bronze ? 96 : 100}h20l-10 16Z" fill="${c[1]}"/><path d="M-110-70Q-60-128 30-116" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/></svg>`;
 }
 function sigilText() {
  const B = data.sigils.branches, a = B[badge.a], two = badge.rank === 'gold' && badge.b !== '' && +badge.b !== badge.a, b = two ? B[+badge.b] : null;
  if(badge.rank === 'bronze') return `<p class="adv-roll">${t('A Bronze Sigil. Every Bronze wears the same one: a plain disc with the Star and Wave, and the iron of the Hunter who vouched for you set into the back.', 'Un Sigil de Bronze. Todos los Bronze llevan el mismo: un disco liso con la Estrella y la Ola, y por detrás el iron del Hunter que respondió por ti.')}</p><p class="adv-note">${t('A Bronze has no branch yet. The Bronze years are for finding out what you are for. At Silver you choose a branch and design your own.', 'Un Bronze todavía no tiene rama. Los años de Bronze son para descubrir para qué sirves. En Silver eliges rama y diseñas el tuyo.')}</p>`;
  const lead = {silver: t('A Silver Sigil, to its bearer’s own design', 'Un Sigil de Silver, con el diseño de quien lo porta'), gold: t(`A Gold Sigil, recast in gold, with ${badge.deeds} ${badge.deeds === 1 ? 'stud' : 'studs'} for great deeds in the Ledger`, `Un Sigil de Gold, refundido en oro, con ${badge.deeds} ${badge.deeds === 1 ? 'remache' : 'remaches'} por grandes hazañas`), platinum: t('A Platinum Sigil: pale, and bare to every eye but its bearer’s', 'Un Sigil de Platinum: pálido, y liso para todos menos para quien lo porta')}[badge.rank];
  const dev = two ? t(`${a.device} crossed over ${b.device}`, `${a.device} cruzado sobre ${b.device}`) : a.device;
  return `<p class="adv-roll">${h(lead)}: ${h(dev)}, ${t('with', 'con')} ${h(a.stone)}.</p><p class="adv-note"><strong>${h(a.name)}.</strong> ${h(a.who)}${b ? ` <strong>${h(b.name)}.</strong> ${h(b.who)}` : ''}</p>`;
 }
 function renderSigil() {
  const B = data.sigils.branches, opts = B.map((b, n) => [n, `${b.name} (${b.device})`]);
  frame('sigil', `<p class="adv-lead">${t('A Hunter’s badge shows what its bearer is for. Every Bronze wears the same one. At Silver you choose a branch and design your own.', 'La insignia de un Hunter muestra para qué sirve quien la porta. Todos los Bronze llevan la misma. En Silver eliges rama y diseñas la tuya.')}</p>
  <section class="adv-panel adv-shop"><h2>${t('The Sigil bench', 'El banco de Sigils')}</h2>
  <div class="adv-controls"><label class="pack-label">${t('Rank', 'Rango')}${sel('sg-rank', [['bronze', 'Bronze'], ['silver', 'Silver'], ['gold', 'Gold'], ['platinum', 'Platinum']], badge.rank)}</label><label class="pack-label sg-own">${t('Branch', 'Rama')}${sel('sg-a', opts, badge.a)}</label><label class="pack-label sg-gold">${t('Second branch', 'Segunda rama')}${sel('sg-b', [['', t('None', 'Ninguna')]].concat(opts), badge.b)}</label><label class="pack-label sg-gold">${t('Great deeds', 'Grandes hazañas')}${sel('sg-deeds', [0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => [n, String(n)]), badge.deeds)}</label>
  <label class="pack-label sg-own">${t('Shape', 'Forma')}${sel('sg-shape', [['disc', t('Disc', 'Disco')], ['shield', t('Shield', 'Escudo')], ['sunburst', t('Sunburst', 'Sol')], ['diamond', t('Diamond', 'Rombo')], ['hex', t('Hexagon', 'Hexágono')]], badge.shape)}</label><label class="pack-label sg-own">${t('Field', 'Campo')}${sel('sg-field', [['plain', t('Plain', 'Liso')], ['rays', t('Rays', 'Rayos')], ['waves', t('Waves', 'Olas')], ['scales', t('Scales', 'Escamas')]], badge.field)}</label><label class="pack-label sg-own">${t('Flourish', 'Adorno')}${sel('sg-flourish', [['none', t('None', 'Ninguno')], ['laurel', t('Laurel', 'Laurel')], ['wings', t('Wings', 'Alas')], ['rope', t('Rope', 'Soga')]], badge.flourish)}</label></div>
  <div class="adv-sigil"><div id="sg-art">${sigilSvg()}</div><div id="sg-text">${sigilText()}</div></div>
  <div class="pack-actions"><a class="button cream" id="sg-save" download="sigil.svg" href="#">${t('Save the drawing', 'Guardar el dibujo')}</a><button type="button" class="button" id="sg-any">${t('Surprise me', 'Sorpréndeme')} <span aria-hidden="true">✦</span></button></div></section>
  <p class="adv-hint"><a href="#entry/sigil">${t('About the Sigil and the branches', 'Sobre el Sigil y las ramas')}</a> · <a href="#entry/hunters">${t('About the Hunters', 'Sobre los Hunters')}</a></p>`);
  const draw = () => {
   $('#sg-art').innerHTML = sigilSvg(); $('#sg-text').innerHTML = sigilText();
   document.querySelectorAll('.sg-gold').forEach(el => {el.hidden = badge.rank !== 'gold';});
   document.querySelectorAll('.sg-own').forEach(el => {el.hidden = badge.rank === 'bronze';});
   $('#sg-save').href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sigilSvg());
  };
  const bind = (id, key, n) => $('#' + id).addEventListener('input', e => {badge[key] = n ? (e.target.value === '' ? '' : +e.target.value) : e.target.value; draw();});
  bind('sg-rank', 'rank'); bind('sg-a', 'a', 1); bind('sg-b', 'b', 1); bind('sg-deeds', 'deeds', 1); bind('sg-shape', 'shape'); bind('sg-field', 'field'); bind('sg-flourish', 'flourish');
  $('#sg-any').addEventListener('click', () => {
   Object.assign(badge, {rank: pick(['silver', 'silver', 'gold', 'gold', 'platinum']), a: Math.floor(Math.random() * 8), b: chance(.5) ? Math.floor(Math.random() * 8) : '', deeds: Math.floor(Math.random() * 9), shape: pick(Object.keys(SHAPE)), field: pick(['plain', 'rays', 'waves', 'scales']), flourish: pick(['none', 'laurel', 'wings', 'rope'])});
   [['sg-rank', 'rank'], ['sg-a', 'a'], ['sg-b', 'b'], ['sg-deeds', 'deeds'], ['sg-shape', 'shape'], ['sg-field', 'field'], ['sg-flourish', 'flourish']].forEach(([id, k]) => {$('#' + id).value = String(badge[k]);});
   draw();
  });
  draw();
 }

 function route(view, parts) {
  if(view !== 'adventurers') return false;
  const draw = () => {
   if(location.hash.slice(1).split('/')[0] !== 'adventurers') return;
   if(failed || !data) {frame('names', `<p class="adv-hint">${t('The adventurers’ tools could not be loaded. Try reloading the page.', 'No se pudieron cargar las herramientas. Recarga la página.')}</p>`); return;}
   if(parts[1] === 'traits') renderTraits(parts[2]); else if(parts[1] === 'workshop') renderWorkshop(); else if(parts[1] === 'downtime') renderDowntime(); else if(parts[1] === 'side-quests') renderSide(); else if(parts[1] === 'treasure') renderTreasure(); else if(parts[1] === 'sigil') renderSigil(); else renderNames();
  };
  if(data || failed) draw(); else {frame('names', `<p class="adv-hint">${t('Loading…', 'Cargando…')}</p>`); ready.then(draw);}
  return true;
 }
 return {route, ready};
})();
