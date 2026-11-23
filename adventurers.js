/* Adventurers: tools for players. A name generator, the peoples' traits, the workshop, downtime, side quests, treasure, the Sigil, passages, the sea, the Reckoners' Hall, the Coinsday Reading, the black market, and the Most Wanted. Data: adventurers.json. */
'use strict';
window.Adventurers = (() => {
 const h = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const t = (en, es) => window.Pack2?.language === 'es' ? es : en;
 const md = s => h(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
 const $ = s => document.querySelector(s);
 let data = null, failed = false;
 const state = {people: '', region: '', home: '', form: '', canonOnly: false, results: []};
 const ready = fetch('adventurers.json?v=22').then(r => {if(!r.ok) throw Error(); return r.json();})
  .then(v => {data = v;}).catch(() => {failed = true;});

 const pick = list => list[Math.floor(Math.random() * list.length)];
 const recent = [];
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
    const some = (list, n) => {const a = list.filter(x => !recent.includes(x)), out = []; if(a.length < n) a.push(...list); while(out.length < n && a.length) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]); return out;};
    const n = chance(.12) ? 3 : chance(.4) ? 2 : 1, ts = some(p.title, n), os = some(p.of, n);
    const title = ts.map((x, k) => x + ' ' + os[k]).join(', ');
    recent.push(...ts, ...os); recent.splice(0, Math.max(0, recent.length - 40));
    const ep = some(p.epithet, 1)[0]; recent.push(ep);
    return {name: given + ' ' + ep + ', ' + title};
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
  $('#content').innerHTML = `<div class="content-wrap pack-page adventurers"><div class="page-intro"><p class="eyebrow">KALVATAR / 175 EC</p><h1>${t('Adventurers', 'Aventureros')}</h1><p>${t('Tools for players: a name that sounds like the islands, what your people can do, what it costs to make things, and what to do between voyages.', 'Herramientas para jugadores: un nombre que suene a las islas, lo que tu pueblo sabe hacer, lo que cuesta fabricar cosas, y qué hacer entre viajes.')}</p></div><nav class="adv-tabs" aria-label="${t('Adventurers tools', 'Herramientas de aventureros')}">${link('names', '#adventurers', t('Name generator', 'Generador de nombres'))}${link('traits', '#adventurers/traits', t('Peoples and traits', 'Pueblos y rasgos'))}${link('workshop', '#adventurers/workshop', t('Workshop', 'Taller'))}${link('downtime', '#adventurers/downtime', t('Downtime', 'Tiempo libre'))}${link('side', '#adventurers/side-quests', t('Side quests', 'Misiones secundarias'))}${link('treasure', '#adventurers/treasure', t('Treasure', 'Tesoro'))}${link('sigil', '#adventurers/sigil', t('Sigil', 'Sigil'))}${link('travel', '#adventurers/travel', t('Passages', 'Travesías'))}${link('sea', '#adventurers/sea', t('At sea', 'En altamar'))}${link('hall', '#adventurers/hall', t('The Reckoners’ Hall', 'El Reckoners’ Hall'))}${link('coinsday', '#adventurers/coinsday', t('Coinsday Reading', 'Lectura de Monedía'))}${link('black', '#adventurers/black-market', t('Black market', 'Mercado negro'))}${link('wanted', '#adventurers/wanted', t('Most Wanted', 'Los más buscados'))}</nav>${body}</div>`;
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
  let html = '', depth = 0, ol = false;
  const close = to => {while(depth > to) {html += '</ul>'; depth--;}};
  const endOl = () => {if(ol) {html += '</ol>'; ol = false;}};
  blocks.forEach(b => {
   if(b.t === 'oli') {close(0); if(!ol) {html += '<ol>'; ol = true;} html += `<li>${md(b.text)}</li>`; return;}
   endOl();
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
  endOl();
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
  unit(Math.floor(bits / 1000), 'Orsal', t('Orsals', 'Orsales')); bits %= 1000;
  unit(Math.floor(bits / 100), t('Anchor', 'Ancla'), t('Anchors', 'Anclas')); bits %= 100;
  unit(Math.floor(bits / 10), t('Tide', 'Marea'), t('Tides', 'Mareas')); unit(bits % 10, t('Bit', 'Ola'), t('Bits', 'Olas'));
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
  tiles('workshop');
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
  tiles('downtime');
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
  tiles('side');
 }

 /* Treasure: what a fight might leave behind, for a party, a level, a region, and a difficulty. For the Game Master. */
 const loot = {size: 4, level: 3, region: 'heartland', hard: 1, kind: 1, out: null};
 function rollLoot() {
  const T = data.sidequests.treasure, tier = T.tiers.find(x => loot.level <= x.to), reg = T.regions.find(r => r.id === loot.region);
  const xpEach = T.xp[loot.level - 1][loot.hard], total = Math.max(1, Math.round(tier.base * [1, 2, 4][loot.hard] * loot.kind * loot.size / 4 * (0.8 + Math.random() * 0.4)));
  const L = data.loot, low = x => /^(Tarvan|Aurelion|Frost|Galven|Korvan|Sporrn|Pocchin|Goldwind|Jakupur|Vorthani)/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1), bits = v => Math.max(.01, Math.round(v * 100) / 100);
  const thing = () => {
   const k = pick(['gem', 'gem', 'jewel', 'jewel', 'jewel', 'art', 'art', 'made', 'made', 'clothes', 'clothes', 'arms', 'arms', 'kit', 'kit', 'papers', 'curio', 'curio', 'drink', 'drink', 'trade', 'trade']);
   if(k === 'gem') {const g = pick(L.gems); return {k, name: g[0], value: g[1], many: 1};}
   if(k === 'jewel') {const o = pick(L.jewelry), m = pick(L.metals), d = pick(L.jdetail); return {k, name: `${o[0]} of ${m[0]}${d[0]}`, value: o[1] * m[1] * d[1]};}
   if(k === 'art') {const o = pick(L.art), m = pick(L.artmat); return {k, name: `${o[0]} ${pick(L.subjects)}, in ${m[0]}`, value: o[1] * m[1]};}
   if(k === 'arms') {const g = pick(pick(data.workshop.goods.slice(0, 2)).groups), it = pick(g[1]), bag = L.makes.flatMap(m => Array(m[2]).fill(m)), mk = pick(bag); return {k, name: `${mk[0]} ${low(it[0])}`, value: it[1] * mk[1]};}
   if(k === 'trade') {const g = pick(reg.goods); return {k, name: g[0], value: g[1], many: 1};}
   const g = pick(L[{made: 'made', clothes: 'clothes', kit: 'kit', papers: 'papers', curio: 'curios', drink: 'drink'}[k]]); return {k, name: g[0], value: g[1], many: k === 'drink'};
  };
  let left = total * (0.45 + Math.random() * 0.3), goods = [];
  const want = 3 + Math.floor(Math.random() * 5) + (loot.kind > 1 ? 2 : 0) + T.tiers.indexOf(tier), kinds = {}, floor = total * 0.004;
  for(let tries = 0; tries < 400 && goods.length < want && left > total * 0.02; tries++) {
   const x = thing(); x.value = bits(x.value);
   if(x.value > left || (x.value < floor && x.k !== 'curio' && tries < 300) || (kinds[x.k] || 0) >= 2 || goods.some(g => g.name === x.name)) continue;
   const most = Math.floor(left * 0.5 / x.value), n = x.many && most >= 2 && x.value <= total * 0.05 && chance(.45) ? 2 + Math.floor(Math.random() * Math.min(loot.level > 10 ? 11 : 5, most - 1)) : 1;
   goods.push({name: x.name, n, value: bits(x.value * n)}); left -= x.value * n; kinds[x.k] = (kinds[x.k] || 0) + 1;
  }
  goods.sort((a, b) => b.value - a.value);
  const spent = goods.reduce((a, g) => a + g.value, 0), magic = [];
  if(Math.random() * 100 < tier.magic[loot.hard] * (loot.kind > 1 ? 2 : 1)) magic.push(tier.grade + ': ' + pick(T.magic[tier.grade]));
  if(loot.level > 4 && chance(.25)) magic.push('A charm: ' + pick(T.magic['A charm']));
  loot.out = {xpEach, xpAll: xpEach * loot.size, total, coins: Math.max(0, Math.round((total - spent) * 100) / 100), goods, magic, extra: chance(.45) ? pick(T.extras) : '', coin: reg.coin + ' ' + t('This lot was', 'Este lote estaba') + ' ' + pick(L.mint) + '.', region: reg.name};
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
 const badge = {rank: 'silver', a: 0, b: 3, hon: '', deeds: 3, shape: 'shield', field: 'rays', flourish: 'laurel'};
 const METAL = {bronze: ['#b9793f', '#6f431d', '#e6ac70', '#8f5a2b'], silver: ['#c5cbd1', '#6f7982', '#f4f6f8', '#98a2ab'], gold: ['#d6ac42', '#7e5c12', '#f8e092', '#b08a26'], platinum: ['#e4eaed', '#92a4ab', '#ffffff', '#c3d0d5']};
 const STONE = ['#a3262e', '#2d5fae', '#3f8f5c', '#f3f0e4', '#e08a8f', '#1c1c1f', '#7a4fa3'];
 const DEVICE = [
  c => `<path d="M0-70 10-50 8 14-8 14-10-50Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0-66V12" stroke="${c[3]}" stroke-width="2"/><path d="M-26 14Q0 6 26 14L24 24Q0 16-24 24Z" fill="${c[1]}"/><rect x="-5" y="22" width="10" height="26" rx="2" fill="${c[3]}" stroke="${c[1]}" stroke-width="2"/><circle cy="56" r="8" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5"/>`,
  c => `<path d="M0-68 28-26 16 54-16 54-28-26Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0-68 0 0M-28-26 0 0 28-26M0 0-16 54M0 0 16 54" fill="none" stroke="${c[1]}" stroke-width="1.6"/><path d="M-28-26 0-38 28-26" fill="none" stroke="${c[3]}" stroke-width="1.6"/><path d="M-44-50l4 8 8 4-8 4-4 8-4-8-8-4 8-4ZM42 30l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill="${c[1]}"/>`,
  c => `<path d="M0-44V50" stroke="${c[1]}" stroke-width="7" stroke-linecap="round"/><path d="M0-44V50" stroke="${c[3]}" stroke-width="2.5"/><path d="M0-72 18-38 0-46-18-38Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0 22-20 44-20 66 0 48 20 66 20 44Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0 30-12 44M0 30 12 44M0 40-12 54M0 40 12 54" stroke="${c[1]}" stroke-width="1.5"/>`,
  c => `<path d="M-10 66C-16 8-6-34 26-70 38-24 26 18-2 44Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-10 66C-2 20 8-24 26-70" fill="none" stroke="${c[1]}" stroke-width="2.5"/><path d="M4-18 20-30M0 2 22-10M-4 22 16 10M12-40 24-48" stroke="${c[3]}" stroke-width="1.8"/><path d="M-10 66-16 48-4 54Z" fill="${c[1]}"/>`,
  c => `<path d="M0-66C22-56 40-54 50-54 50 4 30 44 0 66-30 44-50 4-50-54-40-54-22-56 0-66Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0-52C16-45 30-43 38-43 38 0 23 32 0 50-23 32-38 0-38-43-30-43-16-45 0-52Z" fill="none" stroke="${c[3]}" stroke-width="1.6"/><path d="M0-30C14-8 20 4 20 14A20 20 0 0 1-20 14C-20 4-14-8 0-30Z" fill="${c[1]}"/><path d="M-9 16A9 9 0 0 0 0 25" fill="none" stroke="${c[2]}" stroke-width="2.5" stroke-linecap="round"/>`,
  c => `<path d="M-46 22H46L36 36H14L20 58H-20L-14 36H-36Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-46 22Q-58 10-40 8H46V22Z" fill="${c[3]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><g transform="rotate(-28 0 -20)"><rect x="-4" y="-40" width="8" height="52" rx="2" fill="${c[1]}"/><path d="M-26-66H22L30-54 22-42H-26Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/></g>`,
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
  const two = !bronze && badge.b !== '' && +badge.b !== badge.a, hon = !bronze && !hidden && badge.hon !== '' ? `<g transform="translate(0 ${badge.rank === 'gold' && badge.deeds ? 66 : 84})"><circle r="8" fill="${c[1]}"/><circle r="5.5" fill="${STONE[+badge.hon]}"/></g>` : '';
  const shape = SHAPE[bronze ? 'disc' : badge.shape], field = bronze ? 'plain' : badge.field, flourish = bronze ? 'none' : badge.flourish;
  const fields = {plain: '',
   rays: Array.from({length: 24}, (_, k) => `<path d="M0 0L${(170 * Math.sin((k + .25) * Math.PI / 12)).toFixed(1)} ${(-170 * Math.cos((k + .25) * Math.PI / 12)).toFixed(1)}L${(170 * Math.sin((k + .75) * Math.PI / 12)).toFixed(1)} ${(-170 * Math.cos((k + .75) * Math.PI / 12)).toFixed(1)}Z" fill="${c[3]}" opacity=".28"/>`).join(''),
   waves: [-90, -66, -42, -18, 6, 30, 54, 78, 102].map(y => `<path d="M-130 ${y}q13-11 26 0t26 0 26 0 26 0 26 0 26 0 26 0 26 0 26 0 26 0" fill="none" stroke="${c[3]}" stroke-width="2" opacity=".55"/>`).join(''),
   scales: Array.from({length: 11}, (_, r) => Array.from({length: 12}, (_, q) => `<path d="M${-132 + q * 24 + (r % 2) * 12} ${-116 + r * 22}a12 12 0 0 0 24 0" fill="none" stroke="${c[3]}" stroke-width="1.8" opacity=".5"/>`).join('')).join('')};
  const leaf = (a, side) => {const r = badge.shape === 'disc' ? 96 : 74, x = side * r * Math.sin(a), y = r * Math.cos(a) * -1 + 8; return `<path d="M0 0Q9-10 0-24Q-9-10 0 0Z" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(side * (a * 180 / Math.PI) + side * 28).toFixed(0)})" fill="${c[2]}" stroke="${c[1]}" stroke-width="1.5"/>`;};
  const fl = {none: '',
   laurel: [1, -1].map(sd => [2.75, 2.45, 2.15, 1.85, 1.55, 1.25, .95].map(a => leaf(a, sd)).join('')).join(''),
   wings: [1, -1].map(sd => `<g transform="scale(${sd} 1)"><path d="M20 30C70-20 150-40 196-92C196-52 180-20 150 0C170 0 184-6 194-16C186 16 160 36 126 40C142 46 154 46 164 42C150 62 122 70 96 64C104 70 112 72 118 72C100 84 60 84 20 70Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 24C96 4 150-24 186-64M44 44C100 38 150 22 184-4M44 60C90 62 130 56 156 46" fill="none" stroke="${c[1]}" stroke-width="1.6"/></g>`).join(''),
   rope: `<path d="${shape}" transform="scale(.9)" fill="none" stroke="${c[2]}" stroke-width="9" stroke-dasharray="8 6"/>`};
  const stone = !bronze && !hidden ? `<g transform="translate(0 ${badge.shape === 'shield' ? -100 : -98})"><circle r="12" fill="${c[1]}"/><circle r="9" fill="${STONE[badge.a]}"/><path d="M-4-4a6 6 0 0 1 6-2" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/></g>` : '';
  const studs = badge.rank === 'gold' ? Array.from({length: badge.deeds}, (_, n) => {const a = (90 + (n - (badge.deeds - 1) / 2) * 17) * Math.PI / 180; return `<circle cx="${(86 * Math.cos(a)).toFixed(1)}" cy="${(86 * Math.sin(a)).toFixed(1)}" r="5.5" fill="${c[2]}" stroke="${c[1]}" stroke-width="2"/>`;}).join('') : '';
  const dev = bronze ? COMMON(c) : hidden ? `<g opacity=".14">${DEVICE[badge.a](c)}</g>` : two ? `<g transform="rotate(40) scale(.8)">${DEVICE[+badge.b](c)}</g><g transform="rotate(-40) scale(.8)">${DEVICE[badge.a](c)}</g>` : `<g transform="scale(.92)">${DEVICE[badge.a](c)}</g>`;
  const wide = flourish === 'wings';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${wide ? '-215 -150 430 300' : '-140 -140 280 280'}" role="img" aria-label="${t('A Hunter’s Sigil', 'Un Sigil de Hunter')}"><defs><radialGradient id="sg" cx="34%" cy="26%" r="85%"><stop offset="0" stop-color="${c[2]}"/><stop offset=".55" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[3]}"/></radialGradient><clipPath id="sc"><path d="${shape}" transform="scale(.93)"/></clipPath></defs>${wide ? fl.wings : ''}<path d="${shape}" transform="translate(0 5)" fill="#0d2226" opacity=".35"/><path d="${shape}" fill="${c[1]}"/><path d="${shape}" transform="scale(.96)" fill="url(#sg)"/><g clip-path="url(#sc)">${fields[field]}</g><path d="${shape}" transform="scale(.93)" fill="none" stroke="${c[1]}" stroke-width="${bronze ? 7 : 3.5}"/>${bronze ? '' : `<path d="${shape}" transform="scale(.8)" fill="none" stroke="${c[1]}" stroke-width="1.6"/><path d="${shape}" transform="scale(.865)" fill="none" stroke="${c[2]}" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"/>`}${flourish === 'rope' ? fl.rope : ''}${flourish === 'laurel' ? fl.laurel : ''}${studs}${dev}${stone}${hon}<path d="M-10 ${badge.shape === 'shield' && !bronze ? 96 : 100}h20l-10 16Z" fill="${c[1]}"/><path d="M-110-70Q-60-128 30-116" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/></svg>`;
 }
 function sigilText() {
  const B = data.sigils.branches, a = B[badge.a], two = badge.rank !== 'bronze' && badge.b !== '' && +badge.b !== badge.a, b = two ? B[+badge.b] : null, hn = badge.hon !== '' ? B[+badge.hon] : null;
  if(badge.rank === 'bronze') return `<p class="adv-roll">${t('A Bronze Sigil. Every Bronze wears the same one: a plain disc with the Star and Wave, and the iron of the Hunter who vouched for you set into the back.', 'Un Sigil de Bronze. Todos los Bronze llevan el mismo: un disco liso con la Estrella y la Ola, y por detrás el iron del Hunter que respondió por ti.')}</p><p class="adv-note">${t('A Bronze has no branch yet. The Bronze years are for finding out what you are for. At Silver you choose a branch and design your own.', 'Un Bronze todavía no tiene rama. Los años de Bronze son para descubrir para qué sirves. En Silver eliges rama y diseñas el tuyo.')}</p>`;
  const lead = {silver: t('A Silver Sigil, to its bearer’s own design', 'Un Sigil de Silver, con el diseño de quien lo porta'), gold: t(`A Gold Sigil, recast in gold, with ${badge.deeds} ${badge.deeds === 1 ? 'stud' : 'studs'} for great deeds in the Ledger`, `Un Sigil de Gold, refundido en oro, con ${badge.deeds} ${badge.deeds === 1 ? 'remache' : 'remaches'} por grandes hazañas`), platinum: t('A Platinum Sigil: pale, and bare to every eye but its bearer’s', 'Un Sigil de Platinum: pálido, y liso para todos menos para quien lo porta')}[badge.rank];
  const dev = two ? t(`${a.device} crossed over ${b.device}`, `${a.device} cruzado sobre ${b.device}`) : a.device;
  return `<p class="adv-roll">${h(lead)}: ${h(dev)}, ${t('with', 'con')} ${h(a.stone)}.</p><p class="adv-note"><strong>${h(a.name)}.</strong> ${h(a.who)}${b ? ` <strong>${h(b.name)}.</strong> ${h(b.who)}` : ''}${hn ? ` <strong>${t('Honorary', 'Honorario')} ${h(hn.name)}:</strong> ${t('shown by its stone, set small at the foot.', 'se muestra con su piedra, pequeña, al pie.')}` : ''}</p>`;
 }
 function renderSigil() {
  const B = data.sigils.branches, opts = B.map((b, n) => [n, `${b.name} (${b.device})`]);
  frame('sigil', `<p class="adv-lead">${t('A Hunter’s badge shows what its bearer is for. Every Bronze wears the same one. At Silver you choose a branch, or two, and design your own.', 'La insignia de un Hunter muestra para qué sirve quien la porta. Todos los Bronze llevan la misma. En Silver eliges rama y diseñas la tuya.')}</p>
  <section class="adv-panel adv-shop"><h2>${t('The Sigil bench', 'El banco de Sigils')}</h2>
  <div class="adv-controls"><label class="pack-label">${t('Rank', 'Rango')}${sel('sg-rank', [['bronze', 'Bronze'], ['silver', 'Silver'], ['gold', 'Gold'], ['platinum', 'Platinum']], badge.rank)}</label><label class="pack-label sg-own">${t('Branch', 'Rama')}${sel('sg-a', opts, badge.a)}</label><label class="pack-label sg-own">${t('Second branch', 'Segunda rama')}${sel('sg-b', [['', t('None', 'Ninguna')]].concat(opts), badge.b)}</label><label class="pack-label sg-own">${t('Honorary branch', 'Rama honoraria')}${sel('sg-hon', [['', t('None', 'Ninguna')]].concat(B.map((x, n) => [n, x.name])), badge.hon)}</label><label class="pack-label sg-gold">${t('Great deeds', 'Grandes hazañas')}${sel('sg-deeds', [0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => [n, String(n)]), badge.deeds)}</label>
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
  bind('sg-rank', 'rank'); bind('sg-a', 'a', 1); bind('sg-b', 'b', 1); bind('sg-hon', 'hon', 1); bind('sg-deeds', 'deeds', 1); bind('sg-shape', 'shape'); bind('sg-field', 'field'); bind('sg-flourish', 'flourish');
  $('#sg-any').addEventListener('click', () => {
   Object.assign(badge, {rank: pick(['silver', 'silver', 'gold', 'gold', 'platinum']), a: Math.floor(Math.random() * DEVICE.length), b: chance(.5) ? Math.floor(Math.random() * DEVICE.length) : '', hon: chance(.2) ? Math.floor(Math.random() * DEVICE.length) : '', deeds: Math.floor(Math.random() * 9), shape: pick(Object.keys(SHAPE)), field: pick(['plain', 'rays', 'waves', 'scales']), flourish: pick(['none', 'laurel', 'wings', 'rope'])});
   [['sg-rank', 'rank'], ['sg-a', 'a'], ['sg-b', 'b'], ['sg-hon', 'hon'], ['sg-deeds', 'deeds'], ['sg-shape', 'shape'], ['sg-field', 'field'], ['sg-flourish', 'flourish']].forEach(([id, k]) => {$('#' + id).value = String(badge[k]);});
   draw();
  });
  draw();
 }

 /* Tools as buttons: where a tab holds several tools, show them as tiles first and open the one that is pressed. */
 const opened = {};
 function tiles(tab) {
  const panels = [...document.querySelectorAll('.adventurers > section.adv-panel')];
  if(panels.length < 2) return;
  const nav = document.createElement('div');
  nav.className = 'adv-tiles';
  nav.innerHTML = panels.map((p, n) => `<button type="button" class="adv-tile" data-n="${n}" aria-expanded="false"><strong>${p.querySelector('h2').innerHTML}</strong><span>${h((p.querySelector('.adv-hint')?.textContent || '').split(/(?<=[.?])\s/)[0])}</span><i aria-hidden="true">+</i></button>`).join('');
  panels[0].before(nav);
  const show = (n, move) => {
   opened[tab] = n;
   panels.forEach((p, k) => {p.hidden = k !== n;});
   nav.querySelectorAll('.adv-tile').forEach((b, k) => {b.classList.toggle('active', k === n); b.setAttribute('aria-expanded', String(k === n)); b.querySelector('i').textContent = k === n ? '−' : '+';});
   if(move && n != null) panels[n].scrollIntoView({block: 'nearest', behavior: 'smooth'});
  };
  nav.addEventListener('click', e => {const b = e.target.closest('.adv-tile'); if(b) show(opened[tab] === +b.dataset.n ? null : +b.dataset.n, true);});
  show(opened[tab] ?? null);
 }

 /* Passages: how long from one port to another, by what ship, and what it costs. */
 const trip = {from: 'goldwind', to: 'southhaven', mode: 'rations', size: 4, skip: 0};
 function passage() {
  const T = data.travel, port = id => T.ports.find(x => x.id === id), mode = T.modes.find(m => m.id === trip.mode), free = trip.mode === 'quiet' || trip.mode === 'own';
  if(trip.from === trip.to) return {same: true};
  const shut = id => !free && port(id).kind === 'hidden';
  if(shut(trip.from) || shut(trip.to)) return {shut: port(shut(trip.to) ? trip.to : trip.from)};
  const dist = {[trip.from]: 0}, prev = {}, done = new Set();
  for(;;) {
   let u = null;
   for(const k in dist) if(!done.has(k) && (u === null || dist[k] < dist[u])) u = k;
   if(u === null || u === trip.to) break;
   done.add(u);
   for(const [a, b, d, sure, stops] of T.legs) {
    const v = a === u ? b : b === u ? a : null;
    if(!v || done.has(v) || (shut(v) && v !== trip.to)) continue;
    if(dist[v] === undefined || dist[u] + d < dist[v]) {dist[v] = dist[u] + d; prev[v] = [u, d, sure, a === u ? (stops || []) : (stops || []).map(([k, at]) => [k, d - at]).reverse()];}
   }
  }
  if(dist[trip.to] === undefined) return {none: true};
  const legs = [];
  for(let v = trip.to; v !== trip.from; v = prev[v][0]) legs.unshift({from: port(prev[v][0]), to: port(v), days: prev[v][1], sure: prev[v][2], stops: prev[v][3].map(([k, at]) => ({name: (port(k) || T.ways[k]).name, note: T.ways[k]?.note || T.notes[k] || '', at}))});
  let total = 0, bitsEach = 0, calls = 0;
  for(const l of legs) {
   calls += l.stops.length;
   l.sail = Math.max(1, Math.round((l.days - (trip.skip ? l.stops.length * T.skip.days : 0)) * mode.time));
   l.stops.forEach(x => {x.day = Math.max(1, Math.round(x.at * mode.time));});
   const ice = /cabin/.test(mode.id) && (l.from.region === 'Icy Expanse' || l.to.region === 'Icy Expanse') ? T.ice : 1;
   l.bits = l.sail * mode.bits * ice; total += l.sail; bitsEach += l.bits;
  }
  return {legs, total, calls, bribe: trip.skip && trip.mode !== 'own' ? calls * T.skip.anchors : 0, each: Math.round(bitsEach) / 100, mode, notes: [...new Set(legs.flatMap(l => [l.from.id, l.to.id]))].map(id => T.notes[id]).filter(Boolean)};
 }
 function passageHtml() {
  const o = passage();
  if(o.same) return `<p class="adv-note">${t('You are already there. A harbor ferry is 1 Bit.', 'Ya estás ahí. Un ferry de puerto cuesta 1 Bit.')}</p>`;
  if(o.shut) return `<p class="adv-roll">${t(`No harbor office sells a passage to or from ${o.shut.name}.`, `Ninguna oficina de puerto vende pasaje hacia o desde ${o.shut.name}.`)}</p><p class="adv-note">${t('Choose a quiet passage, or your own ship.', 'Elige un pasaje discreto, o tu propio barco.')}</p>`;
  if(o.none) return `<p class="adv-note">${t('No known route.', 'No hay ruta conocida.')}</p>`;
  const lo = Math.max(1, Math.round(o.total * .9)), hi = Math.round(o.total * 1.25), cyc = Math.round(o.total / 10 * 10) / 10, meet = Math.round(o.total * .15);
  const stops = o.legs.flatMap((l, n) => [...(trip.skip ? [] : l.stops.map(x => x.name)), ...(n < o.legs.length - 1 ? [l.to.name] : [])]);
  return `<dl class="adv-out">${row(t('Fair passage', 'Travesía normal'), `${days(o.total)} · ${cyc} Cycles`)}${row(t('With the weather', 'Según el clima'), `${lo} ${t('to', 'a')} ${days(hi)}`)}${row(t('Fare, each', 'Pasaje, cada uno'), coin(o.each))}${row(t('Fare, all of you', 'Pasaje, todos'), coin(Math.round(o.each * trip.size * 100) / 100))}${o.bribe ? row(t('To skip the ports of call', 'Por saltarse las escalas'), coin(o.bribe) + ' ' + t('to the captain', 'al capitán')) : ''}${row(t('Ports of call', 'Escalas'), stops.length ? `${stops.length}: ${h(stops.join(', '))}` : t('none', 'ninguna'))}</dl>
  <ol class="adv-legs">${o.legs.map(l => `<li><strong>${h(l.from.name)} → ${h(l.to.name)}</strong><span>${days(l.sail)} · ${coin(Math.round(l.bits) / 100)} ${t('each', 'cada uno')}${l.sure ? '' : ' · ' + t('estimated', 'estimado')}${trip.skip && l.stops.length ? ' · ' + t(`${l.stops.length} ${l.stops.length === 1 ? 'call' : 'calls'} skipped`, `${l.stops.length} ${l.stops.length === 1 ? 'escala saltada' : 'escalas saltadas'}`) : ''}</span>${!trip.skip && l.stops.length ? `<ul class="adv-calls">${l.stops.map(x => `<li><b>${t('Day', 'Día')} ${x.day}: ${h(x.name)}.</b> ${h(x.note)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ol>
  <p class="adv-note">${h(o.mode.note)} ${t(`At sea, something finds a ship on an 18 or higher on a d20 each day: expect about ${meet} ${meet === 1 ? 'meeting' : 'meetings'} on this passage.`, `En el mar, algo encuentra al barco con 18 o más en un d20 cada día: espera unos ${meet} encuentros en esta travesía.`)}</p>${o.notes.length ? `<ul class="adv-loot">${o.notes.map(n => `<li>${h(n)}</li>`).join('')}</ul>` : ''}`;
 }
 function renderTravel() {
  const T = data.travel, regs = [...new Set(T.ports.map(x => x.region))];
  const ports = (id, value) => `<select id="${id}">${regs.map(r => `<optgroup label="${h(r)}">${T.ports.filter(x => x.region === r).map(x => `<option value="${h(x.id)}"${x.id === value ? ' selected' : ''}>${h(x.name)}${x.kind === 'hidden' ? ' *' : ''}</option>`).join('')}</optgroup>`).join('')}</select>`;
  frame('travel', `<p class="adv-lead">${t('How long it takes to get from one port to another, what it costs, and where the ship stops. A Cycle is ten days. A fair passage counts a day in each port of call, so a ship that sails straight through gets there sooner.', 'Cuánto se tarda de un puerto a otro, cuánto cuesta y dónde para el barco. Un Cycle son diez días.')}</p>
  <section class="adv-panel adv-shop"><h2>${t('A passage', 'Una travesía')}</h2>
  <div class="adv-controls"><label class="pack-label">${t('From', 'Desde')}${ports('tv-from', trip.from)}</label><label class="pack-label">${t('To', 'Hasta')}${ports('tv-to', trip.to)}</label><label class="pack-label">${t('How', 'Cómo')}${sel('tv-mode', T.modes.map(m => [m.id, m.name]), trip.mode)}</label><label class="pack-label">${t('How many of you', 'Cuántos son')}${sel('tv-size', [1, 2, 3, 4, 5, 6, 7, 8].map(n => [n, String(n)]), trip.size)}</label><label class="pack-label">${t('Ports of call', 'Escalas')}${sel('tv-skip', [[0, t('Call at every one', 'Parar en todas')], [1, t('Sail straight through', 'Seguir de largo')]], trip.skip)}</label></div>
  <div class="pack-actions"><button type="button" class="button cream" id="tv-swap">${t('And back again', 'Y de regreso')} <span aria-hidden="true">⇄</span></button></div>
  <div id="tv-out" aria-live="polite">${passageHtml()}</div>
  <p class="adv-hint">${t('Ports marked * are in no harbor book: only a quiet passage or your own ship goes there.', 'Los puertos con * no están en ningún libro de puerto: solo se llega con un pasaje discreto o en tu propio barco.')}</p></section>
  <p class="adv-hint">${t('Five of these passages are in every pilot book: Ironfort to Goldwind, Goldwind to Southhaven, Southhaven to Jakupur, Southhaven to Varan Port, and Varan Port to the far ice. The rest are fair estimates, and your Game Master has the last word.', 'Cinco de estas travesías están en todo libro de pilotos: Ironfort a Goldwind, Goldwind a Southhaven, Southhaven a Jakupur, Southhaven a Varan Port y Varan Port al hielo lejano. El resto son estimaciones, y tu GM tiene la última palabra.')} <a href="#entry/coins-and-prices">Coins and Prices</a> · <a href="#entry/lighthouses">The Lights</a></p>`);
  const again = () => {$('#tv-out').innerHTML = passageHtml();};
  [['tv-from', 'from'], ['tv-to', 'to'], ['tv-mode', 'mode']].forEach(([id, k]) => $('#' + id).addEventListener('input', e => {trip[k] = e.target.value; again();}));
  $('#tv-size').addEventListener('input', e => {trip.size = +e.target.value; again();});
  $('#tv-skip').addEventListener('input', e => {trip.skip = +e.target.value; again();});
  $('#tv-swap').addEventListener('click', () => {[trip.from, trip.to] = [trip.to, trip.from]; $('#tv-from').value = trip.from; $('#tv-to').value = trip.to; again();});
 }

 /* At sea: how a ship works on the open water (Seafaring, Parts One to Six), and every ship a player can sail, hire, or meet. */
 const SEA_HINTS = {
  'The Voyage': ['How a passage runs, day by day: weather, navigation, what finds the ship, and water.', 'Cómo transcurre una travesía, día a día: el clima, la navegación, lo que encuentra al barco y el agua.'],
  'Ships': ['How to read a ship’s stat block, what the guns do, and every ship you can sail, hire, or meet.', 'Cómo leer el stat block de un barco, qué hacen los cañones, y cada barco que puedes tripular, contratar o encontrarte.'],
  'Crews': ['Crew quality, wages and shares, the stations you can hold in a fight, and morale.', 'La calidad de la tripulación, sueldos y partes, los puestos que puedes ocupar en combate, y la moral.'],
  'Battle at Sea': ['The ship’s turn, the wind, maneuvers, hits and criticals, boarding, sinking, and repairs.', 'El turno del barco, el viento, las maniobras, impactos y críticos, el abordaje, el hundimiento y las reparaciones.'],
  'The Chase': ['When one ship runs and another follows, counted in hours.', 'Cuando un barco huye y otro lo sigue, contado en horas.'],
  'The Sea Herself': ['Reefs, the Stillwater, the fog-seas, sea-ice, the Wrong Coast, the King Tide, and the sea-pacts.', 'Arrecifes, el Stillwater, los mares de niebla, el hielo, la Wrong Coast, la King Tide y los pactos del mar.'],
 };
 function renderSea() {
  const S = data.sea, all = S.ships.flatMap(g => g.ships);
  const f = (b, k) => (b.fields.find(x => x[0] === k) || [])[1] || '';
  const steps = S.chapters[0].sections.find(x => /step by step/.test(x.title));
  const card = b => `<button type="button" class="adv-ship" data-ship="${all.indexOf(b)}"><strong>${h(b.name)}</strong><span>${h(b.meta)}</span><small>AC ${h(f(b, 'Armor Class').split(' ')[0])} · ${t('Hull', 'Casco')} ${h(f(b, 'Hull Points'))} · ${h(f(b, 'Speed').split(/[ ,(]/)[0])} ft. · ${h(f(b, 'Travel pace').split(' ')[0])} ${t('miles a day', 'millas al día')}</small></button>`;
  const fleet = S.ships.map(g => `<details class="adv-sea-sec"><summary>${h(g.title)}</summary><div class="adv-sea-body">${g.intro ? blocksHtml([{t: 'p', text: g.intro}]) : ''}<div class="adv-ships">${g.ships.map(card).join('')}</div></div></details>`).join('');
  const chapter = c => {
   const secs = c.sections.filter(x => x !== steps);
   const hint = SEA_HINTS[c.title] || ['', ''];
   return `<section class="adv-panel adv-sea"><h2>${h(c.title)}</h2><p class="adv-hint">${t(hint[0], hint[1])}</p>${blocksHtml(c.lead)}${secs.map(x => `<details class="adv-sea-sec"><summary>${h(x.title)}</summary><div class="adv-sea-body">${blocksHtml(x.blocks)}</div></details>`).join('')}${c.title === 'Ships' ? fleet : ''}</section>`;
  };
  frame('sea', `<p class="adv-lead">${t('How a ship works on the open sea: the voyage, the crew, a fight, a chase, and what the sea does to the careless. The rules are Seafaring’s, for the 2024 rules; your Game Master has the last word.', 'Cómo funciona un barco en altamar: la travesía, la tripulación, un combate, una persecución y lo que el mar le hace al descuidado. Las reglas son las de Seafaring (reglas 2024); tu GM tiene la última palabra.')}</p>
  ${steps ? `<div class="adv-panel adv-steps"><h2>${t('A ship at sea, step by step', 'Un barco en altamar, paso a paso')}</h2>${blocksHtml(steps.blocks)}</div>` : ''}
  ${S.chapters.map(chapter).join('')}
  <p class="adv-hint">${t('How long a passage takes, and what it costs:', 'Cuánto dura una travesía y cuánto cuesta:')} <a href="#adventurers/travel">${t('Passages', 'Travesías')}</a> · <a href="#entry/ship-classes-of-the-armada">${t('The Armada’s ships', 'Los barcos de la Armada')}</a> · <a href="#entry/titania-and-the-iron-swan">The Iron Swan</a></p>`);
  document.querySelectorAll('.adv-ship').forEach(b => b.addEventListener('click', () => window.KalvatarStatblocks?.show([all[+b.dataset.ship]], b)));
  tiles('sea');
 }

 /* The Reckoners' Hall: what it costs to borrow, insure, keep and carry money, register a wreck, and collect a bounty.
    Rates from Volume XXV (adventurers.json, "hall"). */
 const UNIT = {bit: .01, tide: .1, anchor: 1, orsal: 10};
 const hall = {who: 4, amt: 100, unit: 'anchor', term: 10, voy: 0, val: 1000, vunit: 'anchor', king: 0, keep: 100, kunit: 'anchor', years: 1, salv: 500, sunit: 'anchor', crew: 4, pact: 0, cap: 0, hunters: 4, twins: 1};
 const amountIn = (id, v, u) => `<span class="adv-amount"><input id="${id}" type="number" min="0" step="any" value="${v}" inputmode="decimal">${sel(id + '-u', [['bit', t('Bits', 'Olas')], ['tide', t('Tides', 'Mareas')], ['anchor', t('Anchors', 'Anclas')], ['orsal', t('Orsals', 'Orsales')]], u)}</span>`;
 const oneIn = n => t(`1 in ${n}`, `1 de cada ${n}`);
 const months = m => m < 10 ? `${m} ${m === 1 ? t('month', 'mes') : t('months', 'meses')}` : `${m / 10} ${m === 10 ? t('year', 'año') : t('years', 'años')}`;
 function hallBorrow() {
  const H = data.hall, b = H.borrow[hall.who], p = (+hall.amt || 0) * UNIT[hall.unit];
  if(p <= 0) return `<p class="adv-note">${t('How much?', '¿Cuánto?')}</p>`;
  if(b.wolves) {
   const cyc = Math.max(1, Math.round(hall.term * 3.6)), owed = p * Math.pow(1 + 1 / b.one_in, cyc);
   return `<dl class="adv-out">${row(t('The Wolves’ rate', 'La tasa de los Wolves'), oneIn(b.one_in) + ' ' + t('every Cycle', 'cada Cycle'))}${row(t('The first Cycle’s interest', 'El interés del primer Cycle'), coin(p / b.one_in))}${row(t(`Owed after ${months(hall.term)} (${cyc} Cycles)`, `Debes tras ${months(hall.term)} (${cyc} Cycles)`), coin(owed))}</dl>
   <p class="adv-roll">${t('Every Cycle the Wolves add a tenth to what you owe, and the next tenth is counted on that. They collect by knife, and the first sign is a torn ledger-corner pinned to your door.', 'Cada Cycle los Wolves le suman una décima parte a lo que debes, y la siguiente se cuenta sobre eso. Cobran a cuchillo, y la primera señal es una esquina de libro rota clavada en tu puerta.')}</p>
   <p class="adv-note">${t('Try a Lodge Quartermaster’s chit first.', 'Primero intenta con un chit del Quartermaster de tu Lodge.')} <a href="#entry/ledger-wolves">The Ledger Wolves</a></p>`;
  }
  const year = p / b.one_in, all = year * hall.term / 10;
  return `<dl class="adv-out">${row(t('The Hall’s rate', 'La tasa del Hall'), oneIn(b.one_in) + ' ' + t('a year', 'al año'))}${row(t('Interest a year', 'Interés al año'), coin(year))}${row(t('Interest a month', 'Interés al mes'), coin(year / 10))}${row(t(`To repay after ${months(hall.term)}`, `A devolver tras ${months(hall.term)}`), coin(p + all))}</dl>
  <p class="adv-roll">${t('Interest falls due on Coinsday. Three Coinsdays unpaid and your name goes into the Ledger: no loan anywhere, no bottomry bond, no master’s chain in any guild.', 'El interés vence en Coinsday. Tres Coinsdays sin pagar y tu nombre entra al Ledger: ningún préstamo en ninguna parte, ningún seguro de barco, ninguna cadena de maestro en ningún gremio.')}</p>
  <p class="adv-note">${t('The Hall lends against something: a ship, a shop, a warehouse, a title, a post. You leave with a small card that has your Coinsday on it.', 'El Hall presta contra algo: un barco, un taller, un almacén, un título, un puesto. Sales con una tarjetita que tiene tu Coinsday.')}</p>`;
 }
 function hallInsure() {
  const H = data.hall, v = H.insure[hall.voy], val = (+hall.val || 0) * UNIT[hall.vunit];
  if(!v.one_in) return `<p class="adv-roll">${t('The Hall will not write it at any price.', 'El Hall no lo asegura a ningún precio.')}</p><p class="adv-note">${t('Nobody insures a voyage into the Sealed Waters. Ask yourself why.', 'Nadie asegura un viaje a las Sealed Waters. Pregúntate por qué.')}</p>`;
  if(val <= 0) return `<p class="adv-note">${t('What are the ship and her cargo worth?', '¿Cuánto valen el barco y su carga?')}</p>`;
  const k = hall.king ? H.king_tide : 1, prem = val / v.one_in * k;
  return `<dl class="adv-out">${row(t('Premium', 'Prima'), oneIn(v.one_in) + (k > 1 ? ' × ' + k : ''))}${row(t('For this voyage', 'Por este viaje'), coin(prem))}${row(t('There and back', 'Ida y vuelta'), coin(prem * 2))}</dl>
  <p class="adv-roll">${t('A bottomry bond is a sea-loan on the ship and her cargo, forgiven if the ship is lost. That is why the Hall’s wreck-clerks exist: a captain who sinks his own ship for the bond goes into the Ledger the same day.', 'Un bottomry bond es un préstamo sobre el barco y su carga que se perdona si el barco se pierde. Para eso existen los wreck-clerks del Hall: el capitán que hunde su propio barco para cobrarlo entra al Ledger ese mismo día.')}</p>`;
 }
 function hallKeep() {
  const H = data.hall, p = (+hall.keep || 0) * UNIT[hall.kunit];
  if(p <= 0) return `<p class="adv-note">${t('How much?', '¿Cuánto?')}</p>`;
  return `<dl class="adv-out">${row(t('Vault fee a year', 'Cuota de bóveda al año'), coin(p / H.deposit))}${row(t(`Vault fee for ${hall.years} ${hall.years === 1 ? 'year' : 'years'}`, `Cuota por ${hall.years} ${hall.years === 1 ? 'año' : 'años'}`), coin(p / H.deposit * hall.years))}${row(t('A reckoning for it costs', 'Un reckoning por esa suma cuesta'), coin(p / H.reckoning))}</dl>
  <p class="adv-roll">${t('A reckoning is a sealed letter of credit, in ledger ink, payable at any of the nine counting-houses to the person named on it, and only on their counter-word. A stolen reckoning is a piece of paper.', 'Un reckoning es una carta de crédito sellada, en tinta de libro mayor, que paga cualquiera de las nueve casas de cuentas a la persona que nombra, y solo con su counter-word. Un reckoning robado es un papel.')}</p>
  <p class="adv-note">${t('Choose a counter-word nobody would guess, and never say it in a tavern. A large draw away from home waits for the next Coinsday’s pages from Goldwind.', 'Elige una counter-word que nadie adivine, y nunca la digas en una taberna. Un retiro grande lejos de casa espera las páginas del próximo Coinsday desde Goldwind.')}</p>`;
 }
 function hallSalvage() {
  const H = data.hall, v = (+hall.salv || 0) * UNIT[hall.sunit];
  if(v <= 0) return `<p class="adv-note">${t('What is it worth?', '¿Cuánto vale?')}</p>`;
  const tenth = v / H.tenth, rest = v - tenth, finders = rest / H.finder;
  return `<dl class="adv-out">${row(t('The Reckoners’ tenth', 'La décima del Hall'), coin(tenth))}${row(t('The finders’ third', 'El tercio de quienes lo hallan'), coin(finders))}${row(t('Each finder', 'Cada uno'), coin(Math.floor(finders / hall.crew * 100) / 100))}${row(t('The owner or the insurer', 'El dueño o el asegurador'), coin(rest - finders))}</dl>
  ${hall.pact ? `<p class="adv-roll">${t('In pact-water the Coral court chooses first: take its pick out of the wreck before you count any of this.', 'En aguas de pacto la corte de coral elige primero: saca su parte del naufragio antes de contar nada de esto.')}</p>` : ''}
  <p class="adv-note">${t('Register the claim at the Wreck Office before you dive, not after. New-found wrecks are the Chartwrights’ to register, and nothing Below can be registered at all. Here the Hall’s tenth comes off the top; your Game Master may take it from the finders’ third instead.', 'Registra el reclamo en el Wreck Office antes de bucear, no después. Los naufragios recién descubiertos los registran los Chartwrights, y nada de Below se puede registrar. Aquí la décima del Hall sale primero; tu GM puede sacarla del tercio de quienes lo hallan.')}</p>`;
 }
 function hallBounty() {
  const c = data.wanted.captains[hall.cap], n = c.each ? hall.twins : 1, total = c.bounty * n;
  return `<dl class="adv-out">${row(t('The bounty', 'La recompensa'), coin(total))}${row(t('Each of you', 'Cada uno'), coin(Math.floor(total / hall.hunters * 100) / 100))}${row(t('Proof', 'Prueba'), t('The captain, the ship, or the flag', 'El capitán, el barco o la bandera'))}</dl>
  ${c.alive ? `<p class="adv-roll">${t('Alive only. A dead Davin pays nothing, and the docks will not forgive you either.', 'Solo vivo. Un Davin muerto no paga nada, y los muelles tampoco te lo perdonarán.')}</p>` : ''}
  <p class="adv-roll">${t('The Hall pays in the Proof Room, witnessed by a Reckoner and two counters. The flag stays on the wall, and is never given back.', 'El Hall paga en la Proof Room, con un Reckoner y dos counters como testigos. La bandera se queda en la pared y nunca se devuelve.')}</p>
  <p class="adv-note"><a href="#entry/${h(c.id)}">${h(c.name)}</a> · <a href="#adventurers/wanted">${t('The Most Wanted', 'Los más buscados')}</a></p>`;
 }
 function renderHall() {
  const H = data.hall, terms = [1, 2, 3, 6, 10, 20, 30, 50].map(m => [m, months(m)]), C = data.wanted.captains;
  frame('hall', `<p class="adv-lead">${t('What the Reckoners’ Hall will charge you, and what it will pay you. The rates are the Hall’s own; your Game Master has the last word.', 'Lo que te cobra el Reckoners’ Hall, y lo que te paga. Las tasas son las del Hall; tu GM tiene la última palabra.')}</p>
  <section class="adv-panel adv-shop"><h2>${t('Borrow', 'Pedir prestado')}</h2><p class="adv-hint">${t('What a loan costs, by who you are.', 'Lo que cuesta un préstamo, según quién eres.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('Who is borrowing', 'Quién pide')}${sel('hl-who', H.borrow.map((b, i) => [i, b.wolves ? t('Nobody will lend to you (the Ledger Wolves)', 'Nadie te presta (los Ledger Wolves)') : b.who]), hall.who)}</label><label class="pack-label">${t('How much', 'Cuánto')}${amountIn('hl-amt', hall.amt, hall.unit)}</label><label class="pack-label">${t('For how long', 'Por cuánto tiempo')}${sel('hl-term', terms, hall.term)}</label></div><div id="hl-borrow" aria-live="polite">${hallBorrow()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('Insure a ship', 'Asegurar un barco')}</h2><p class="adv-hint">${t('The bottomry premium for one voyage.', 'La prima de bottomry por un viaje.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('The voyage', 'El viaje')}${sel('hl-voy', H.insure.map((v, i) => [i, v.voyage]), hall.voy)}</label><label class="pack-label">${t('Ship and cargo worth', 'Valor del barco y la carga')}${amountIn('hl-val', hall.val, hall.vunit)}</label><label class="pack-label">${t('A King Tide year?', '¿Año de King Tide?')}${sel('hl-king', [[0, t('No', 'No')], [1, t('Yes (177 EC)', 'Sí (177 EC)')]], hall.king)}</label></div><div id="hl-insure" aria-live="polite">${hallInsure()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('Keep and carry money', 'Guardar y llevar dinero')}</h2><p class="adv-hint">${t('A deposit in the vaults, and a reckoning to carry instead of gold.', 'Un depósito en las bóvedas, y un reckoning para llevar en vez de oro.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('How much', 'Cuánto')}${amountIn('hl-keep', hall.keep, hall.kunit)}</label><label class="pack-label">${t('Kept for', 'Guardado por')}${sel('hl-years', [1, 2, 3, 5, 10].map(n => [n, n + ' ' + (n === 1 ? t('year', 'año') : t('years', 'años'))]), hall.years)}</label></div><div id="hl-keep-out" aria-live="polite">${hallKeep()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('Salvage a wreck', 'Rescatar un naufragio')}</h2><p class="adv-hint">${t('Who gets what from a registered wreck.', 'Quién se queda con qué de un naufragio registrado.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('What it is worth', 'Cuánto vale')}${amountIn('hl-salv', hall.salv, hall.sunit)}</label><label class="pack-label">${t('How many finders', 'Cuántos lo hallaron')}${sel('hl-crew', [1, 2, 3, 4, 5, 6, 7, 8].map(n => [n, String(n)]), hall.crew)}</label><label class="pack-label">${t('In pact-water?', '¿En aguas de pacto?')}${sel('hl-pact', [[0, t('No', 'No')], [1, t('Yes', 'Sí')]], hall.pact)}</label></div><div id="hl-salv-out" aria-live="polite">${hallSalvage()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('Collect a bounty', 'Cobrar una recompensa')}</h2><p class="adv-hint">${t('What the Proof Room pays for a name on the poster.', 'Lo que paga la Proof Room por un nombre del cartel.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('The captain', 'El capitán')}${sel('hl-cap', C.map((c, i) => [i, `${c.name} (${c.bounty.toLocaleString('en-US')})`]), hall.cap)}</label><label class="pack-label" id="hl-twins-l"${C[hall.cap].each ? '' : ' hidden'}>${t('How many twins', 'Cuántos gemelos')}${sel('hl-twins', [[1, '1'], [2, '2']], hall.twins)}</label><label class="pack-label">${t('How many of you', 'Cuántos son')}${sel('hl-hunters', [1, 2, 3, 4, 5, 6, 7, 8].map(n => [n, String(n)]), hall.hunters)}</label></div><div id="hl-bounty" aria-live="polite">${hallBounty()}</div></section>
  <p class="adv-hint"><a href="#entry/reckoners-hall">${t('About the Reckoners’ Hall', 'Sobre el Reckoners’ Hall')}</a> · <a href="#entry/reckoners-ledger">The Reckoners' Ledger</a> · <a href="#entry/coins-and-prices">Coins and Prices</a></p>`);
  const bind = (id, key, out, fn, n) => $('#' + id).addEventListener('input', e => {hall[key] = n ? +e.target.value : e.target.value; $('#' + out).innerHTML = fn();});
  bind('hl-who', 'who', 'hl-borrow', hallBorrow, 1); bind('hl-amt', 'amt', 'hl-borrow', hallBorrow); bind('hl-amt-u', 'unit', 'hl-borrow', hallBorrow); bind('hl-term', 'term', 'hl-borrow', hallBorrow, 1);
  bind('hl-voy', 'voy', 'hl-insure', hallInsure, 1); bind('hl-val', 'val', 'hl-insure', hallInsure); bind('hl-val-u', 'vunit', 'hl-insure', hallInsure); bind('hl-king', 'king', 'hl-insure', hallInsure, 1);
  bind('hl-keep', 'keep', 'hl-keep-out', hallKeep); bind('hl-keep-u', 'kunit', 'hl-keep-out', hallKeep); bind('hl-years', 'years', 'hl-keep-out', hallKeep, 1);
  bind('hl-salv', 'salv', 'hl-salv-out', hallSalvage); bind('hl-salv-u', 'sunit', 'hl-salv-out', hallSalvage); bind('hl-crew', 'crew', 'hl-salv-out', hallSalvage, 1); bind('hl-pact', 'pact', 'hl-salv-out', hallSalvage, 1);
  bind('hl-twins', 'twins', 'hl-bounty', hallBounty, 1); bind('hl-hunters', 'hunters', 'hl-bounty', hallBounty, 1);
  $('#hl-cap').addEventListener('input', e => {hall.cap = +e.target.value; $('#hl-twins-l').hidden = !C[hall.cap].each; $('#hl-bounty').innerHTML = hallBounty();});
  tiles('hall');
 }

 /* The Most Wanted: the Council's poster, and a generator of dock talk and broadsheet news about its captains.
    Public knowledge only (Most Wanted, Part One, and wanted.json); none of it is true until the Game Master says so. */
 const talk = {cap: '', out: []};
 const shipName = c => c.ship.replace(/^The /, '');
 const nameAt = (c, start) => {const n = c.name.replace(/, "[^"]*"$/, ''); return start ? n : n.replace(/^The /, 'the ');};
 const poss = (c, start) => {const n = nameAt(c, start); return /s$/.test(n) ? n + '’' : /"$/.test(n) ? n + '’s' : n + '’s';};
 const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
 function portFor(c) {
  const all = data.travel.ports.filter(p => p.kind !== 'hidden'), near = all.filter(p => c.waters.includes(p.region));
  return pick(near.length ? near : all).name;
 }
 function fill(tpl, c, port) {
  const G = data.wanted.gen, witness = pick(G.witness).replace('{port}', port);
  const v = {name: nameAt(c, false), ship: '*' + shipName(c) + '*', sign: pick(c.signs), deed: pick(c.deeds), docks: pick(c.docks), tag: c.tag, when: pick(G.when), port, witness,
   cargo: pick(G.cargo), market: pick(G.market), armada: pick(G.armada), rank: pick(G.rank), n: pick(['two', 'three', 'four']),
   bounty: c.bounty.toLocaleString('en-US') + ' Anchors' + (c.each ? ' each' : '') + (c.alive ? ', alive only' : '')};
  let s = tpl.replace(/\{name\}'s/g, poss(c, false)).replace(/\{(\w+)\}/g, (m, k) => {
   if(k === 'Witness') return cap1(witness);
   if(k === 'PORT') return port.toUpperCase();
   if(k === 'TAG') return c.tag.toUpperCase();
   return v[k] ?? m;
  });
  s = s.replace(/^the /, 'The ').replace(/^([a-z])/, x => x.toUpperCase()).replace(/\. the /g, '. The ');
  return {s, witness};
 }
 function makeTalk(kind, capId) {
  const W = data.wanted, G = W.gen, c = capId ? W.captains.find(x => x.id === capId) : pick(W.captains), port = portFor(c);
  for(let tries = 0; tries < 8; tries++) {
   let item;
   if(kind === 'rumor') {
    const tpl = pick(G.rumor), r = fill(tpl, c, port);
    item = {kind, c, text: r.s, by: tpl.includes('{Witness}') ? '' : r.witness};
   } else {
    const [head, body] = pick(G.news);
    item = {kind, c, head: fill(head, c, port).s.toUpperCase(), text: fill(body, c, port).s};
   }
   if(!talk.out.some(x => x.text === item.text)) return item;
  }
  return null;
 }
 function talkHtml() {
  if(!talk.out.length) return `<p class="adv-empty">${t('Pick a captain, or leave it to the sea, and ask.', 'Elige un capitán, o déjaselo al mar, y pregunta.')}</p>`;
  return `<ol class="adv-talk">${talk.out.map((x, i) => x.kind === 'rumor'
   ? `<li class="adv-talk-rumor"><p>“${md(x.text)}”${x.by ? ` <span>(${h(x.by)})</span>` : ''}</p><small><a href="#entry/${h(x.c.id)}">${h(x.c.name)}</a></small><button type="button" class="adv-copy" data-talk="${i}">${t('Copy', 'Copiar')}</button></li>`
   : `<li class="adv-talk-news"><strong>${md(x.head)}</strong><p>${md(x.text)}</p><small><a href="#entry/${h(x.c.id)}">${h(x.c.name)}</a></small><button type="button" class="adv-copy" data-talk="${i}">${t('Copy', 'Copiar')}</button></li>`).join('')}</ol>`;
 }
 function posterHtml() {
  const W = data.wanted;
  return `<div class="adv-poster">${W.captains.map(c => `<article class="adv-wanted"><p class="adv-wanted-top">${t('Wanted', 'Se busca')}</p><h3><a href="#entry/${h(c.id)}">${h(c.name)}</a></h3><p class="adv-wanted-ship"><em>${h(c.ship)}</em></p><p class="adv-wanted-price">${c.bounty.toLocaleString('en-US')} <span>Anchors${c.each ? ' ' + t('each', 'cada uno') : ''}</span></p>${c.alive ? `<p class="adv-wanted-alive">${t('Alive only', 'Solo vivo')}</p>` : ''}<div class="adv-wanted-ask"><button type="button" class="adv-copy" data-ask="rumor" data-cap="${h(c.id)}">${t('Dock talk', 'Rumor')}</button><button type="button" class="adv-copy" data-ask="news" data-cap="${h(c.id)}">${t('News', 'Noticia')}</button></div></article>`).join('')}
  <article class="adv-wanted adv-wanted-swan"><p class="adv-wanted-top">${t('On no poster', 'En ningún cartel')}</p><h3><a href="#entry/${h(W.swan.id)}">The Iron Swan</a></h3><p>${h(W.swan.text)}</p></article></div>`;
 }
 function renderWanted() {
  const W = data.wanted;
  frame('wanted', `<p class="adv-lead">${t('The Council’s poster hangs in every Lodge, every customs-house, and every tavern that will let it. Here is who is on it, and what the docks are saying this week.', 'El cartel del Council cuelga en cada Lodge, cada aduana y cada taberna que lo deje. Aquí está quién sale en él, y qué se dice en los muelles esta semana.')}</p>
  <section class="adv-panel adv-shop adv-talk-panel"><h2>${t('Dock talk and news', 'Rumores y noticias')}</h2><p class="adv-hint">${t('What the harbors say about the captains on the poster: a rumor overheard, or a broadsheet headline.', 'Lo que dicen los puertos de los capitanes del cartel: un rumor escuchado, o un titular de hoja suelta.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('About', 'Sobre')}${sel('mw-cap', [['', t('Any captain', 'Cualquier capitán')]].concat(W.captains.map(c => [c.id, c.name])), talk.cap)}</label></div>
  <div class="pack-actions"><button type="button" class="button" id="mw-rumor">${t('What do the docks say?', '¿Qué se dice en los muelles?')} <span aria-hidden="true">✦</span></button><button type="button" class="button cream" id="mw-news">${t('The broadsheet', 'La hoja de noticias')} <span aria-hidden="true">✦</span></button></div>
  <div id="mw-out" aria-live="polite">${talkHtml()}</div>
  <p class="adv-note">${t('Table talk, not canon: none of it is true until your Game Master says so. The Game Master’s sheets on these captains are not here.', 'Charla de mesa, no canon: nada de esto es cierto hasta que tu GM lo diga. Las fichas del GM sobre estos capitanes no están aquí.')}${window.Pack2?.language === 'es' ? ' Los rumores y noticias salen en inglés por ahora.' : ''}</p></section>
  <section class="adv-panel adv-poster-panel"><h2>${t('The poster', 'El cartel')}</h2><p class="adv-wanted-notice">${h(W.notice)}</p>${posterHtml()}</section>
  <p class="adv-hint"><a href="#entry/most-wanted">${t('About the Most Wanted', 'Sobre los más buscados')}</a> · <a href="#adventurers/hall">${t('What the Proof Room pays', 'Lo que paga la Proof Room')}</a> · <a href="#entry/free-tide">The Free Tide</a></p>`);
  const ask = (kind, capId, scroll) => {
   const item = makeTalk(kind, capId);
   if(item) {talk.out.unshift(item); talk.out.length = Math.min(talk.out.length, 8);}
   $('#mw-out').innerHTML = talkHtml();
   if(scroll) $('#mw-out').scrollIntoView({block: 'nearest', behavior: 'smooth'});
  };
  $('#mw-cap').addEventListener('input', e => {talk.cap = e.target.value;});
  $('#mw-rumor').addEventListener('click', () => ask('rumor', talk.cap));
  $('#mw-news').addEventListener('click', () => ask('news', talk.cap));
  $('.adv-poster').addEventListener('click', e => {const b = e.target.closest('[data-ask]'); if(!b) return; talk.cap = b.dataset.cap; $('#mw-cap').value = talk.cap; ask(b.dataset.ask, talk.cap, true);});
  $('#mw-out').addEventListener('click', async e => {
   const b = e.target.closest('[data-talk]'); if(!b) return;
   const x = talk.out[+b.dataset.talk], plain = s => s.replace(/\*/g, '');
   try {await navigator.clipboard.writeText(x.kind === 'rumor' ? `“${plain(x.text)}”${x.by ? ` (${x.by})` : ''}` : `${plain(x.head)}\n${plain(x.text)}`); b.textContent = t('Copied', 'Copiado');} catch {b.textContent = t('Could not copy', 'No se pudo copiar');}
  });
 }

 /* The Coinsday Reading: every Coinsday at the noon bell the Reckoners' Hall reads the price of a part in every concern on its Board.
    Here it is read Coinsday by Coinsday: the news from the coffee-houses (a d20), 2d6 for every concern, and the Reader's words.
    The Board a table is using is kept in this browser only (Kalvatar_Mercantile_Congress, Part Three; adventurers.json, "coinsday"). */
 const CK = 'kalvatar-coinsday-v1';
 const board = {prices: null, sunk: {}, sinking: {}, n: 0, last: null, pending: null, sure: false};
 const hold = {id: 'charter-notes', parts: 10, paid: 10, unit: 'anchor', vparts: 10, vprice: 1, vunit: 'anchor', home: null};
 const die = n => 1 + Math.floor(Math.random() * n);
 const concern = id => data.coinsday.concerns.find(c => c.id === id);
 const bitsCoin = b => coin(b / 100);
 function boardReset() {
  board.prices = {}; board.sunk = {}; board.sinking = {}; board.n = 0; board.last = null; board.pending = null;
  data.coinsday.concerns.forEach(c => {board.prices[c.id] = c.price;});
 }
 function boardLoad() {
  if(board.prices) return;
  try {
   const s = JSON.parse(localStorage.getItem(CK) || 'null');
   if(s && s.prices && data.coinsday.concerns.every(c => c.id in s.prices)) Object.assign(board, s, {sure: false});
  } catch {}
  if(!board.prices) boardReset();
 }
 function boardSave() {
  try {localStorage.setItem(CK, JSON.stringify({prices: board.prices, sunk: board.sunk, sinking: board.sinking, n: board.n, last: board.last, pending: board.pending}));} catch {}
 }
 const word = s => {const w = data.coinsday.words.find(([min]) => s >= min); return t(w[1], w[2]);};
 function ringBell() {
  const C = data.coinsday, ev = die(20), e = C.events[ev - 1], fx = e.fx, rows = [];
  let note = '', front = 0, rumor = null;
  if(fx.front) {const r = die(6); front = r % 2 ? -3 : 3; note = r % 2 ? t(`The die: ${r}. The Imperium took it.`, `El dado: ${r}. Lo tomó el Imperio.`) : t(`The die: ${r}. The Alliance took it.`, `El dado: ${r}. Lo tomó la Alianza.`);}
  const live = C.concerns.filter(c => !board.sunk[c.id]);
  if(fx.rumor && live.length) {rumor = pick(live).id; note = t(`The rumor was about ${concern(rumor).en}.`, `El rumor era sobre ${concern(rumor).es}.`);}
  const before = board.pending; board.pending = null;
  if(rumor && chance(.5)) board.pending = rumor;  // half the rumors prove false, and the concern gets its two steps back
  C.concerns.forEach(c => {
   if(board.sunk[c.id]) return;
   if(board.sinking[c.id]) {board.sunk[c.id] = true; delete board.sinking[c.id]; rows.push({id: c.id, sunk: true}); return;}
   const a = die(6), b = die(6), r = C.roll[a + b];
   let ex = typeof fx[c.id] === 'number' ? fx[c.id] : typeof fx['*'] === 'number' ? fx['*'] : 0;
   if(fx.front && c.id === 'front-paper') ex = front;
   if(rumor === c.id) ex = -2;
   const back = before === c.id ? 2 : 0, steps = r + ex + back, was = board.prices[c.id], now = Math.max(c.step, was + steps * c.step);
   board.prices[c.id] = now;
   if(now <= c.price / 4) board.sinking[c.id] = true;
   rows.push({id: c.id, a, b, r, ex: ex + back, steps, was, now, sinking: !!board.sinking[c.id], back: !!back});
  });
  board.n += 1;
  board.last = {n: board.n, ev, note, rows, back: before};
  boardSave();
 }
 function readerWords() {
  const o = board.last;
  if(!o) return '';
  const lines = o.rows.map(x => {
   const c = concern(x.id), name = t(c.en, c.es);
   return x.sunk ? t(`${name}: sunk.`, `${name}: a pique.`) : `${name}: ${bitsCoin(x.now)}, ${word(x.steps)}.`;
  });
  return lines.concat(t('Written. Witnessed. Owed.', 'Escrito. Atestiguado. Debido.')).join('\n');
 }
 function readingHtml() {
  const C = data.coinsday, o = board.last;
  const arrow = s => s > 0 ? `<span class="adv-up" aria-label="${t('up', 'sube')}">▲ ${s}</span>` : s < 0 ? `<span class="adv-down" aria-label="${t('down', 'baja')}">▼ ${-s}</span>` : '<span class="adv-flat">=</span>';
  if(!o) {
   return `<p class="adv-empty">${t('The Board as it was listed. Ring the noon bell to read the first Coinsday.', 'El Tablero como se inscribió. Toca la campana del mediodía para leer el primer Monedía.')}</p>
   <div class="adv-table"><table><thead><tr><th>${t('Concern', 'Negocio')}</th><th>${t('A part', 'Una parte')}</th><th>${t('Swing and step', 'Vaivén y paso')}</th></tr></thead><tbody>${C.concerns.map(c => `<tr><td>${h(t(c.en, c.es))}</td><td>${bitsCoin(board.prices[c.id])}</td><td>${h(t(c.swing_en, c.swing_es))}, ${bitsCoin(c.step)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  const e = C.events[o.ev - 1], back = o.back ? concern(o.back) : null;
  return `<p class="adv-reading-n">${t('Reading', 'Lectura')} ${o.n}</p>
  <div class="adv-news"><strong>${t('What the coffee-houses heard', 'Lo que se oyó en las casas de café')} (d20: ${o.ev})</strong><p>${md(t(e.en, e.es))}${o.note ? ' ' + h(o.note) : ''}</p>${back ? `<p>${h(t(`The rumor about ${back.en} was false: two steps back.`, `El rumor sobre ${back.es} era falso: recupera dos pasos.`))}</p>` : ''}</div>
  <div class="adv-table"><table><thead><tr><th>${t('Concern', 'Negocio')}</th><th>2d6</th><th>${t('News', 'Noticia')}</th><th>${t('Steps', 'Pasos')}</th><th>${t('A part', 'Una parte')}</th><th>${t('The word', 'La palabra')}</th></tr></thead><tbody>${o.rows.map(x => {
   const c = concern(x.id), name = h(t(c.en, c.es));
   if(x.sunk) return `<tr class="adv-sunk"><td>${name}</td><td colspan="5">${t('Sunk: struck from the Board, and its parts are paper.', 'A pique: borrado del Tablero, y sus partes son papel.')}</td></tr>`;
   return `<tr><td>${name}</td><td>${x.a} + ${x.b}</td><td>${x.ex ? (x.ex > 0 ? '+' : '') + x.ex : ''}</td><td>${arrow(x.steps)}</td><td>${bitsCoin(x.now)}${x.sinking ? ` <em>${t('(sinking)', '(hundiéndose)')}</em>` : ''}</td><td>${h(word(x.steps))}</td></tr>`;
  }).join('')}${Object.keys(board.sunk).filter(id => !o.rows.some(x => x.id === id)).map(id => `<tr class="adv-sunk"><td>${h(t(concern(id).en, concern(id).es))}</td><td colspan="5">${t('Sunk.', 'A pique.')}</td></tr>`).join('')}</tbody></table></div>
  <div class="adv-reader"><strong>${t('The Reader’s words', 'Las palabras del Lector')}</strong><pre>${h(readerWords())}</pre><button type="button" class="adv-copy" id="cd-copy">${t('Copy', 'Copiar')}</button></div>`;
 }
 function holdOut() {
  const c = concern(hold.id), n = Math.max(0, Math.floor(+hold.parts || 0)), paid = (+hold.paid || 0) * UNIT[hold.unit] * 100;
  if(!n) return `<p class="adv-note">${t('How many parts?', '¿Cuántas partes?')}</p>`;
  if(board.sunk[c.id]) return `<p class="adv-roll">${t('Sunk. The parts are paper, and the Hall will not enter a trade in them.', 'A pique. Las partes son papel, y la Casa no asienta operaciones con ellas.')}</p>`;
  const now = board.prices[c.id], worth = now * n, cost = paid * n, fees = worth / data.coinsday.fees.hall + worth / data.coinsday.fees.chalker;
  const half = c.voyage ? null : now < c.price / 2 ? 0 : worth * c.share / 200;
  const diff = worth - cost;
  return `<dl class="adv-out">${row(t('A part now', 'Una parte ahora'), bitsCoin(now))}${row(t('Your parts are worth', 'Tus partes valen'), bitsCoin(worth))}${cost ? row(t('You paid', 'Pagaste'), bitsCoin(cost)) + row(diff >= 0 ? t('Up', 'Ganas') : t('Down', 'Pierdes'), bitsCoin(Math.abs(diff))) : ''}${row(t('To sell today, after the Hall’s and the chalker’s cut', 'Al vender hoy, después de la parte de la Casa y del corredor'), bitsCoin(worth - fees))}${half === null ? '' : row(t('At the next Share-out', 'En el próximo Reparto'), half ? bitsCoin(half) : t('nothing: the part is under half its listing price', 'nada: la parte está por debajo de la mitad de su precio de inscripción'))}</dl>
  ${c.voyage ? `<p class="adv-note">${t('A voyage pays nothing at the Share-out. It pays when the ship comes home: see below.', 'Un viaje no paga nada en el Reparto. Paga cuando el barco vuelve: mira abajo.')}</p>` : `<p class="adv-note">${t(`The Share-out is paid at the last Reading of Idel and of Okram: half of ${c.share} in 100 a year, on the part's price that day.`, `El Reparto se paga en la última Lectura de Idel y de Okram: la mitad de ${c.share} de cada 100 al año, sobre el precio de la parte ese día.`)}</p>`}`;
 }
 function homeOut() {
  const o = hold.home;
  if(!o) return `<p class="adv-empty">${t('At the end of the ship’s season, roll.', 'Al final de la temporada del barco, tira.')}</p>`;
  const text = o.r === 1 ? t('Lost. The parts are worth nothing.', 'Perdido. Las partes no valen nada.') : o.r <= 4 ? t('Home. Each part pays twice its price.', 'Volvió. Cada parte paga el doble de su precio.') : t('A great voyage. Each part pays three times its price.', 'Un gran viaje. Cada parte paga el triple de su precio.');
  return `<dl class="adv-out">${row('d6', String(o.r))}${row(t('The ship', 'El barco'), text)}${row(t('You are paid', 'Te pagan'), o.pay ? bitsCoin(o.pay) : t('nothing', 'nada'))}</dl>`;
 }
 function renderCoinsday() {
  boardLoad();
  const C = data.coinsday;
  frame('coinsday', `<p class="adv-lead">${t('Every Coinsday at the noon bell, the Reckoners’ Hall reads the price of a part in every concern on its Board. Read it here, Coinsday by Coinsday. This browser keeps the Board your table is using.', 'Cada Monedía, con la campana del mediodía, la Casa de los Tesoreros lee el precio de una parte de cada negocio de su Tablero. Léelo aquí, Monedía tras Monedía. Este navegador guarda el Tablero que usa tu mesa.')}</p>
  <section class="adv-panel adv-shop"><h2>${t('The Reading', 'La Lectura')}</h2><p class="adv-hint">${t('The news from the coffee-houses, 2d6 for every concern, and the Reader’s words.', 'La noticia de las casas de café, 2d6 por cada negocio, y las palabras del Lector.')}</p>
  <div class="pack-actions"><button type="button" class="button" id="cd-bell">${t('Ring the noon bell', 'Toca la campana del mediodía')} <span aria-hidden="true">✦</span></button><button type="button" class="button cream" id="cd-reset">${t('Start a new Board', 'Empezar un Tablero nuevo')}</button></div>
  <div id="cd-out" aria-live="polite">${readingHtml()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('Your parts', 'Tus partes')}</h2><p class="adv-hint">${t('What your parts are worth on today’s Board, what selling costs, and the next Share-out.', 'Cuánto valen tus partes en el Tablero de hoy, cuánto cuesta vender, y el próximo Reparto.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('Concern', 'Negocio')}${sel('cd-id', C.concerns.map(c => [c.id, t(c.en, c.es)]), hold.id)}</label><label class="pack-label">${t('Parts', 'Partes')}${num('cd-parts', hold.parts, 1, 100000)}</label><label class="pack-label">${t('Paid for each', 'Pagado por cada una')}${amountIn('cd-paid', hold.paid, hold.unit)}</label></div><div id="cd-hold" aria-live="polite">${holdOut()}</div></section>
  <section class="adv-panel adv-shop"><h2>${t('A voyage comes home', 'Un viaje vuelve a casa')}</h2><p class="adv-hint">${t('Parts in a single ship, paid when her season ends.', 'Partes de un solo barco, que se pagan cuando termina su temporada.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('Parts', 'Partes')}${num('cd-vparts', hold.vparts, 1, 100000)}</label><label class="pack-label">${t('Price of a part', 'Precio de una parte')}${amountIn('cd-vprice', hold.vprice, hold.vunit)}</label></div>
  <div class="pack-actions"><button type="button" class="button" id="cd-home">${t('Did she come home?', '¿Volvió el barco?')} <span aria-hidden="true">✦</span></button></div><div id="cd-home-out" aria-live="polite">${homeOut()}</div></section>
  <p class="adv-hint"><a href="#entry/coinsday-reading">${t('About the Coinsday Reading', 'Sobre la Lectura de Monedía')}</a> · <a href="#entry/reckoners-hall">${t('The Reckoners’ Hall', 'La Casa de los Tesoreros')}</a> · <a href="#entry/twelve-flags">${t('The Twelve Flags', 'Las Doce Banderas')}</a> · <a href="#adventurers/hall">${t('Borrow, insure, keep', 'Pedir prestado, asegurar, guardar')}</a></p>`);
  const out = () => {$('#cd-out').innerHTML = readingHtml(); $('#cd-hold').innerHTML = holdOut();};
  $('#cd-bell').addEventListener('click', () => {board.sure = false; $('#cd-reset').textContent = t('Start a new Board', 'Empezar un Tablero nuevo'); ringBell(); out();});
  $('#cd-reset').addEventListener('click', e => {
   if(!board.sure) {board.sure = true; e.target.textContent = t('Sure? Press again', '¿Seguro? Pulsa otra vez'); return;}
   board.sure = false; e.target.textContent = t('Start a new Board', 'Empezar un Tablero nuevo'); boardReset(); boardSave(); out();
  });
  $('#cd-out').addEventListener('click', async e => {
   if(e.target.id !== 'cd-copy') return;
   try {await navigator.clipboard.writeText(readerWords()); e.target.textContent = t('Copied', 'Copiado');} catch {e.target.textContent = t('Could not copy', 'No se pudo copiar');}
  });
  const bind = (id, key, fn, outId) => $('#' + id).addEventListener('input', e => {hold[key] = e.target.value; $('#' + outId).innerHTML = fn();});
  bind('cd-id', 'id', holdOut, 'cd-hold'); bind('cd-parts', 'parts', holdOut, 'cd-hold'); bind('cd-paid', 'paid', holdOut, 'cd-hold'); bind('cd-paid-u', 'unit', holdOut, 'cd-hold');
  bind('cd-vparts', 'vparts', () => {hold.home = null; return homeOut();}, 'cd-home-out'); bind('cd-vprice', 'vprice', () => {hold.home = null; return homeOut();}, 'cd-home-out'); bind('cd-vprice-u', 'vunit', () => {hold.home = null; return homeOut();}, 'cd-home-out');
  $('#cd-home').addEventListener('click', () => {
   const r = die(6), n = Math.max(0, Math.floor(+hold.vparts || 0)), p = (+hold.vprice || 0) * UNIT[hold.vunit] * 100;
   hold.home = {r, pay: r === 1 ? 0 : n * p * (r <= 4 ? 2 : 3)};
   $('#cd-home-out').innerHTML = homeOut();
  });
  if(opened.coinsday === undefined) opened.coinsday = 0;
  tiles('coinsday');
 }

 /* The black market: what the Undertow has this week, what a fence pays, what it costs to buy a blind eye, and how to find the
    door. From Kalvatar_Vice_and_Contraband and Volumes XIX and XXI (adventurers.json, "undertow"). */
 const bm = {settle: 'city', region: 'central-heartland', out: null, val: 100, unit: 'anchor', kind: 'ordinary'};
 function rollMarket() {
  const U = data.undertow, si = U.settle.findIndex(s => s[0] === bm.settle), kr = die(6);
  const drugs = U.drugs.map(x => {
   const home = x.home.includes(bm.region), far = !home && x.far.includes(bm.region);
   let p = x.pct[si];
   if(home) p = Math.min(95, p * 2); else if(far) p = Math.floor(p / 2);
   const r = die(100);
   return {x, p, r, has: r <= p, home, far};
  });
  const [lo, hi] = U.more[si], n = lo + Math.floor(Math.random() * (hi - lo + 1)), pool = U.goods.filter(g => g.min <= si).slice(), goods = [];
  while(goods.length < n && pool.length) goods.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  const tr = die(8);
  bm.out = {kr, keeper: U.keeper.find(k => kr <= k[0]), drugs, goods, tr, trouble: U.trouble[tr - 1]};
 }
 function marketHtml() {
  const o = bm.out, es = window.Pack2?.language === 'es';
  if(!o) return `<p class="adv-empty">${t('Choose where you are, and ask around.', 'Elige dónde estás, y pregunta por ahí.')}</p>`;
  const on = o.drugs.filter(d => d.has), off = o.drugs.filter(d => !d.has);
  const tag = d => d.home ? ` <em>${t('at home here: chance doubled', 'en su tierra: probabilidad doble')}</em>` : d.far ? ` <em>${t('far from home: chance halved', 'lejos de su tierra: probabilidad a la mitad')}</em>` : '';
  const find = d => d.x.dc ? t(`Finding the seller: a day, and a Persuasion or Investigation check, DC ${d.x.dc}, with someone who knows the Undertow.`, `Encontrar al vendedor: un día, y una prueba de Persuasión o Investigación, CD ${d.x.dc}, con alguien que conozca la Resaca.`) + (d.x.id === 'damareth' ? t(' Without a title, add 5.', ' Sin título, suma 5.') : '') : t('Ask anyone.', 'Pregúntale a cualquiera.');
  return `<div class="adv-news"><strong>${t('Is Aunt Brine about?', '¿Anda por ahí la Tía Salmuera?')} (d6: ${o.kr})</strong><p>${h(t(o.keeper[1], o.keeper[2]))} ${h(t(o.keeper[3], o.keeper[4]))}</p></div>
  <h3>${t('Selling this week', 'A la venta esta semana')}</h3>${on.length ? `<ul class="adv-loot">${on.map(d => `<li><strong><a href="#entry/${h(d.x.id)}">${h(es ? d.x.es : d.x.en)}</a></strong> <span>${h(es ? d.x.price_es : d.x.price_en)}. ${h(cap1(es ? d.x.law_es : d.x.law_en))}. ${h(find(d))} (d100: ${d.r}, ${t('needed', 'hacía falta')} ${d.p} ${t('or less', 'o menos')})${tag(d)}</span></li>`).join('')}</ul>` : `<p class="adv-note">${t('Nothing this week. Try again next week, or another port.', 'Nada esta semana. Prueba la semana que viene, o en otro puerto.')}</p>`}
  ${o.goods.length ? `<h3>${t('And what else is about', 'Y qué más anda por ahí')}</h3><ul class="adv-loot">${o.goods.map(g => `<li><strong>${h(es ? g.es : g.en)}</strong> <span>${h(es ? g.price_es : g.price_en)}</span></li>`).join('')}</ul>` : ''}
  <div class="adv-news"><strong>${t('The catch', 'La trampa')} (d8: ${o.tr})</strong><p>${h(es ? o.trouble.es : o.trouble.en)}</p></div>
  <p class="adv-note">${t('Not about this week', 'No hay esta semana')}: ${off.map(d => h(es ? d.x.es : d.x.en)).join(', ') || t('nothing', 'nada')}. ${t('Some things are never on this list. The Chainbreakers keep their own list of who buys them.', 'Algunas cosas nunca están en esta lista. Los Rompecadenas llevan su propia lista de quién las compra.')}</p>`;
 }
 function fenceOut() {
  const U = data.undertow, f = U.fence.find(x => x.id === bm.kind), v = (+bm.val || 0) * UNIT[bm.unit];
  if(v <= 0) return `<p class="adv-note">${t('What would it fetch honestly?', '¿Cuánto valdría honradamente?')}</p>`;
  const note = t(f.note_en, f.note_es);
  return `<dl class="adv-out">${row(t('The fence pays', 'El reducidor paga'), `${coin(v / f.pays)} (${oneIn(f.pays)}${note ? ', ' + h(note) : ''})`)}${row(t('You lose', 'Pierdes'), coin(v - v / f.pays))}</dl>`;
 }
 function renderBlack() {
  const U = data.undertow, es = window.Pack2?.language === 'es';
  frame('black', `<p class="adv-lead">${t('Everything the harbors will not carry moves through the Undertow. Here is what it has this week, what it pays, and what it charges. Your Game Master has the last word, and so does the Bell.', 'Todo lo que los puertos no quieren llevar se mueve por la Resaca. Aquí está lo que tiene esta semana, lo que paga y lo que cobra. Tu Máster tiene la última palabra, y la Campana también.')}</p>
  <section class="adv-panel adv-shop"><h2>${t('What is for sale', 'Qué hay a la venta')}</h2><p class="adv-hint">${t('The drugs and the goods about this week, by the size of the place and the region.', 'Las drogas y la mercancía que hay esta semana, según el tamaño del lugar y la región.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('Where', 'Dónde')}${sel('bm-settle', U.settle.map(s => [s[0], es ? s[2] : s[1]]), bm.settle)}</label><label class="pack-label">${t('Region', 'Región')}${sel('bm-region', U.regions.map(r => [r[0], es ? r[2] : r[1]]), bm.region)}</label></div>
  <div class="pack-actions"><button type="button" class="button" id="bm-roll">${t('Ask around', 'Pregunta por ahí')} <span aria-hidden="true">✦</span></button></div>
  <div id="bm-out" aria-live="polite">${marketHtml()}</div>
  <p class="adv-note">${t('Black ports are Fairweather, Black Harbor, Hollowkey, and their like.', 'Los puertos negros son Buentiempo, Puerto Negro, Cayo Hueco y los que se les parecen.')} <a href="#entry/vice-and-the-black-market">${t('The drugs, one by one', 'Las drogas, una por una')}</a></p></section>
  <section class="adv-panel adv-shop"><h2>${t('The fence', 'El reducidor')}</h2><p class="adv-hint">${t('What a fence pays for what you took.', 'Lo que paga un reducidor por lo que te llevaste.')}</p>
  <div class="adv-controls"><label class="pack-label">${t('Honest price', 'Precio honrado')}${amountIn('bm-val', bm.val, bm.unit)}</label><label class="pack-label">${t('What it is', 'Qué es')}${sel('bm-kind', U.fence.map(f => [f.id, es ? f.es : f.en]), bm.kind)}</label></div>
  <div id="bm-fence" aria-live="polite">${fenceOut()}</div><ul class="adv-rates">${(es ? U.rates_es : U.rates_en).map(r => `<li>${md(r)}</li>`).join('')}</ul></section>
  <section class="adv-panel adv-shop"><h2>${t('What it charges', 'Lo que cobra')}</h2><p class="adv-hint">${t('A blind eye, a new name, a way out, and worse.', 'Un ojo ciego, un nombre nuevo, una salida, y cosas peores.')}</p>
  <div class="adv-table"><table><thead><tr><th>${t('Service', 'Servicio')}</th><th>${t('Who sells it', 'Quién lo vende')}</th><th>${t('Price', 'Precio')}</th></tr></thead><tbody>${U.services.map(s => `<tr>${(es ? s.es : s.en).map(c => `<td>${h(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>
  <section class="adv-panel adv-shop"><h2>${t('Finding the door', 'Encontrar la puerta')}</h2><p class="adv-hint">${t('The turned hook, the five rules, and the cant.', 'El anzuelo volteado, las cinco reglas y la jerga.')}</p>
  <ul class="adv-rates">${(es ? U.finding_es : U.finding_en).map(r => `<li>${md(r)}</li>`).join('')}</ul>
  <h3>${t('The cant', 'La jerga')}</h3><div class="adv-table"><table><tbody>${U.cant.map(c => {const [a, b] = es ? c.es : c.en; return `<tr><td><strong>${h(a)}</strong></td><td>${h(b)}</td></tr>`;}).join('')}</tbody></table></div></section>
  <p class="adv-hint"><a href="#entry/undertow">${t('The Undertow', 'La Resaca')}</a> · <a href="#entry/vice-and-the-black-market">${t('Vice and the black market', 'El vicio y el mercado negro')}</a> · <a href="#entry/quiet-auction">${t('The Quiet Auction', 'La Subasta Callada')}</a> · <a href="#entry/ledger-wolves">${t('The Ledger Wolves', 'Los Lobos del Libro Mayor')}</a></p>`);
  $('#bm-settle').addEventListener('input', e => {bm.settle = e.target.value;});
  $('#bm-region').addEventListener('input', e => {bm.region = e.target.value;});
  $('#bm-roll').addEventListener('click', () => {rollMarket(); $('#bm-out').innerHTML = marketHtml();});
  const bind = (id, key) => $('#' + id).addEventListener('input', e => {bm[key] = e.target.value; $('#bm-fence').innerHTML = fenceOut();});
  bind('bm-val', 'val'); bind('bm-val-u', 'unit'); bind('bm-kind', 'kind');
  if(opened.black === undefined) opened.black = 0;
  tiles('black');
 }

 function route(view, parts) {
  if(view !== 'adventurers') return false;
  const draw = () => {
   if(location.hash.slice(1).split('/')[0] !== 'adventurers') return;
   if(failed || !data) {frame('names', `<p class="adv-hint">${t('The adventurers’ tools could not be loaded. Try reloading the page.', 'No se pudieron cargar las herramientas. Recarga la página.')}</p>`); return;}
   if(parts[1] === 'traits') renderTraits(parts[2]); else if(parts[1] === 'workshop') renderWorkshop(); else if(parts[1] === 'downtime') renderDowntime(); else if(parts[1] === 'side-quests') renderSide(); else if(parts[1] === 'treasure') renderTreasure(); else if(parts[1] === 'sigil') renderSigil(); else if(parts[1] === 'travel') renderTravel(); else if(parts[1] === 'sea') renderSea(); else if(parts[1] === 'hall') renderHall(); else if(parts[1] === 'wanted') renderWanted(); else if(parts[1] === 'coinsday') renderCoinsday(); else if(parts[1] === 'black-market') renderBlack(); else renderNames();
  };
  if(data || failed) draw(); else {frame('names', `<p class="adv-hint">${t('Loading…', 'Cargando…')}</p>`); ready.then(draw);}
  return true;
 }
 return {route, ready};
})();
