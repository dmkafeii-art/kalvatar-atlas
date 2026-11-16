/* Stat blocks for the islands' animals and companions, the Savage Lords' progeny, what lives in the sea and Below, the foes, and the ships (2024 rules).
   Data: statblocks.json, built from the Player's Companion and the Bestiary. At the end of a creature's entry
   a button opens its stat block in a popup. Blocks stay in English, as the game documents are. */
'use strict';
(() => {
 const es = () => window.Pack2?.language === 'es';
 const t = (en, sp) => es() ? sp : en;
 const h = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
 const md = s => h(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
 const plain = s => String(s ?? '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
 const V = (document.currentScript?.src.split('v=')[1] || '1');
 let data = null, loading = null;
 const load = () => loading ||= fetch('statblocks.json?v=' + V).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(d => (data = d));
 const field = (b, k) => [...(b.top || []), ...(b.mid || []), ...(b.fields || [])].find(x => x[0] === k)?.[1] || '';
 const cr = b => b.kind === 'ship' ? '' : field(b, 'Challenge').split(' ')[0];
 const tag = b => cr(b) ? 'CR ' + cr(b) : (b.kind === 'ship' ? t('Hull', 'Casco') + ' ' + field(b, 'Hull Points') : '');

 function blockHtml(b, id) {
  const row = ([k, v]) => `<p class="sb-prop"><b>${h(k)}</b> ${md(v)}</p>`;
  const trait = it => {const m = it.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/); return m ? `<p class="sb-item"><b><i>${h(m[1])}</i></b> ${md(m[2])}</p>` : `<p class="sb-item">${md(it)}</p>`;};
  if(b.kind === 'ship') return `<article class="sb-block sb-ship" id="${id}">
   <header><h2 class="sb-name">${h(b.name)}</h2><p class="sb-meta">${h(b.meta)}</p></header>
   <hr class="sb-rule">${b.fields.map(row).join('')}
   ${b.traits.length ? `<section class="sb-sec"><h3>${t('Traits', 'Rasgos')}</h3>${b.traits.map(trait).join('')}</section>` : ''}
   ${b.notes.length ? `<footer class="sb-notes">${b.notes.map(n => `<p>${md(n)}</p>`).join('')}</footer>` : ''}
  </article>`;
  const abil = `<div class="sb-abil" role="table" aria-label="Ability scores">${b.abilities.map(([k, v, m]) => `<div role="row"><span role="columnheader">${k}</span><strong role="cell">${h(v)}</strong><em role="cell">${h(m)}</em></div>`).join('')}</div>`;
  const items = it => {
   const m = it.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
   return m ? `<p class="sb-item"><b><i>${h(m[1])}</i></b> ${md(m[2])}</p>` : `<p class="sb-item">${md(it)}</p>`;
  };
  return `<article class="sb-block" id="${id}">
   <header><h2 class="sb-name">${h(b.name)}</h2><p class="sb-meta">${h(b.meta)}</p></header>
   <hr class="sb-rule">${b.top.map(row).join('')}<hr class="sb-rule">${abil}<hr class="sb-rule">${b.mid.map(row).join('')}
   ${b.sections.map(s => `<section class="sb-sec"><h3>${h(s.title)}</h3>${s.items.map(items).join('')}</section>`).join('')}
   ${b.notes.length ? `<footer class="sb-notes">${b.notes.map(n => `<p>${md(n)}</p>`).join('')}</footer>` : ''}
  </article>`;
 }
 function blockText(b) {
  if(b.kind === 'ship') return [b.name.toUpperCase(), b.meta, ...b.fields.map(([k, v]) => `${k}: ${plain(v)}`), ...(b.traits.length ? ['', 'TRAITS', ...b.traits.map(plain)] : []), ...(b.notes.length ? ['', ...b.notes.map(plain)] : [])].join('\n');
  const out = [b.name.toUpperCase(), b.meta, ...b.top.map(([k, v]) => `${k}: ${plain(v)}`),
   b.abilities.map(([k, v, m]) => `${k} ${v} (${m})`).join('  '), ...b.mid.map(([k, v]) => `${k}: ${plain(v)}`)];
  for(const s of b.sections) out.push('', s.title.toUpperCase(), ...s.items.map(plain));
  if(b.notes.length) out.push('', ...b.notes.map(plain));
  return out.join('\n');
 }

 let dialog = null, opener = null;
 function close() {
  if(!dialog) return;
  dialog.close();
 }
 function open(id, btn) {show(data?.[id], btn);}
 function show(list, btn) {
  if(!list?.length) return;
  opener = btn;
  dialog?.remove();
  dialog = document.createElement('dialog');
  dialog.className = 'sb-dialog';
  dialog.setAttribute('aria-label', list.map(b => b.name).join(', '));
  const tabs = list.length > 1 ? `<div class="sb-tabs" role="tablist">${list.map((b, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}">${h(b.name)}<span>${h(tag(b))}</span></button>`).join('')}</div>` : '';
  dialog.innerHTML = `<div class="sb-card">
   <div class="sb-bar"><p class="sb-eyebrow">${list[0].kind === 'ship' ? t('Ship · Seafaring rules', 'Barco · reglas de Seafaring') : t('Stat block · 2024 rules', 'Stat block · reglas 2024')}</p><button type="button" class="sb-x" aria-label="${t('Close', 'Cerrar')}">×</button></div>
   ${tabs}<div class="sb-body">${blockHtml(list[0], 'sb-0')}</div>
   <div class="sb-actions"><button type="button" class="sb-copy">${t('Copy as text', 'Copiar como texto')}</button><button type="button" class="sb-done">${t('Close', 'Cerrar')}</button></div>
  </div>`;
  let cur = 0;
  dialog.querySelectorAll('.sb-tabs button').forEach(tab => tab.onclick = () => {
   cur = +tab.dataset.i;
   dialog.querySelectorAll('.sb-tabs button').forEach(x => x.setAttribute('aria-selected', x === tab));
   dialog.querySelector('.sb-body').innerHTML = blockHtml(list[cur], 'sb-' + cur);
   dialog.querySelector('.sb-body').scrollTop = 0;
  });
  dialog.querySelector('.sb-x').onclick = close;
  dialog.querySelector('.sb-done').onclick = close;
  dialog.querySelector('.sb-copy').onclick = async e => {
   const b = e.currentTarget;
   try {await navigator.clipboard.writeText(blockText(list[cur])); b.textContent = t('Copied', 'Copiado');}
   catch {b.textContent = t('Could not copy', 'No se pudo copiar');}
   setTimeout(() => {b.textContent = t('Copy as text', 'Copiar como texto');}, 1800);
  };
  dialog.addEventListener('click', e => {if(e.target === dialog) close();});
  dialog.addEventListener('close', () => {document.documentElement.classList.remove('sb-open'); dialog?.remove(); dialog = null; opener?.focus();});
  document.body.append(dialog);
  document.documentElement.classList.add('sb-open');
  dialog.showModal();
  dialog.querySelector('.sb-x').focus();
 }

 function dress() {
  const m = location.hash.match(/^#entry\/([^/?]+)/);
  if(!m) return;
  const id = decodeURIComponent(m[1]);
  const prose = document.querySelector('.article-prose');
  if(!prose || prose.querySelector(`.sb-launch[data-entry="${CSS.escape(id)}"]`)) return;
  if(!data) {load().then(dress); return;}
  const list = data[id];
  prose.querySelectorAll('.sb-launch').forEach(x => x.remove());
  if(!list?.length) return;
  const box = document.createElement('div');
  box.className = 'sb-launch';
  box.dataset.entry = id;
  const many = list.length > 1, role = ['progeny', 'found', 'ships'].find(r => list.every(b => b.role === r)) || '';
  const label = role === 'progeny' ? (many ? t('View its progeny’s stat blocks', 'Ver los stat blocks de su progenie') : t('View its progeny’s stat block', 'Ver el stat block de su progenie'))
   : role === 'found' ? (many ? t('What you may meet here: stat blocks', 'Lo que puedes encontrarte aquí: stat blocks') : t('What you may meet here: stat block', 'Lo que puedes encontrarte aquí: stat block'))
   : role === 'ships' ? (many ? t('View the ships’ stat blocks', 'Ver los stat blocks de los barcos') : t('View the ship’s stat block', 'Ver el stat block del barco'))
   : (many ? t('View stat blocks', 'Ver stat blocks') : t('View stat block', 'Ver stat block'));
  const names = list.slice(0, list.length > 4 ? 3 : 4).map(b => `${h(b.name)}${tag(b) ? ' · ' + h(tag(b)) : ''}`).join(' &nbsp;·&nbsp; ') + (list.length > 4 ? ` &nbsp;·&nbsp; ${t(`and ${list.length - 3} more`, `y ${list.length - 3} más`)}` : '');
  box.innerHTML = `<button type="button" class="sb-open-btn" aria-haspopup="dialog">
   <svg class="sb-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 2v20M3 7l18 10M21 7 3 17"/></svg>
   <span class="sb-open-text"><strong>${label}</strong>
   <small>${names}</small></span><span class="sb-arrow" aria-hidden="true">↗</span></button>`;
  box.querySelector('button').onclick = e => open(id, e.currentTarget);
  const src = prose.querySelector(':scope > .article-source');
  src ? prose.insertBefore(box, src) : prose.append(box);
 }
 window.KalvatarStatblocks = {show};
 new MutationObserver(dress).observe(document.documentElement, {childList: true, subtree: true});
 addEventListener('hashchange', () => {if(dialog) close(); dress();});
 document.addEventListener('DOMContentLoaded', dress);
})();
