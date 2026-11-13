/* The Game Master's secrets: a wall that takes three clicks, and a count of every secret revealed.
   Data: the "secret" field of a section in entries.json (encoded). The count is kept by a public counter
   (abacus.jasoncameron.dev), with this browser's own count as the fallback. */
'use strict';
(() => {
 const es = () => window.Pack2?.language === 'es';
 const t = (en, sp) => es() ? sp : en;
 const h = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
 const md = s => h(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
 const COUNTER = 'https://abacus.jasoncameron.dev', KEY = 'kalvatar-atlas/secrets-revealed';
 const store = {
  get(k, d) {try {return JSON.parse(localStorage.getItem(k)) ?? d;} catch {return d;}},
  set(k, v) {try {localStorage.setItem(k, JSON.stringify(v));} catch {}},
 };
 const seen = () => store.get('kalvatar-secrets-seen-v1', []);
 let entries = null;
 const load = () => entries ||= fetch(document.querySelector('script[src^="app.js"]') ? 'entries.json?s=' + (document.querySelector('script[src^="app.js"]').src.split('v=')[1] || '1') : 'entries.json')
  .then(r => r.json()).catch(() => []);
 const count = hit => fetch(`${COUNTER}/${hit ? 'hit' : 'get'}/${KEY}`).then(r => r.ok ? r.json() : Promise.reject()).then(v => Math.max(0, +v.value || 0)).catch(() => seen().length);

 const STEPS = [
  () => [t('Something is written here.', 'Aquí hay algo escrito.'), t('Read it', 'Leerlo')],
  () => [t('These are the Game Master’s secrets.', 'Estos son los secretos del Game Master.'), t('I understand', 'Entiendo')],
  () => [t('Spoilers. You have been warned.', 'Spoilers. Están advertidos.'), t('Reveal the secret', 'Revelar el secreto')],
 ];
 function veil(box, step) {
  const [line, button] = STEPS[step]();
  box.querySelector('.gm-veil').innerHTML = `<div class="gm-blur" aria-hidden="true">${'<span></span>'.repeat(5)}</div><div class="gm-ask"><p class="gm-line gm-step-${step}">${line}</p><button type="button" class="gm-button">${button}</button></div>`;
  box.querySelector('.gm-button').onclick = () => step < 2 ? veil(box, step + 1) : reveal(box);
 }
 async function reveal(box) {
  const id = box.dataset.entry, all = await load(), entry = all.find(e => e.id === id), sec = entry?.sections.find(s => s.secret);
  const holder = box.querySelector('.gm-veil');
  if(!sec) {holder.innerHTML = `<p class="gm-line">${t('The page is blank after all.', 'La página estaba en blanco.')}</p>`; return;}
  let body;
  try {body = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(sec.secret), c => c.charCodeAt(0))));} catch {body = {paragraphs: []};}
  const first = !seen().includes(id);
  if(first) store.set('kalvatar-secrets-seen-v1', seen().concat(id));
  const n = await count(first);
  holder.className = 'gm-veil gm-open';
  holder.innerHTML = `${(body.paragraphs || []).map(p => `<p>${md(p)}</p>`).join('')}${body.list?.length ? `<ul>${body.list.map(p => `<li>${md(p)}</li>`).join('')}</ul>` : ''}<p class="gm-tally">${n === 1 ? t('1 secret has been revealed.', 'Se ha revelado 1 secreto.') : t(`${n} secrets have been revealed.`, `Se han revelado ${n} secretos.`)}</p>`;
 }
 function dress() {
  const box = document.querySelector('section.article-box-secret:not([data-entry])');
  if(!box) return;
  const m = location.hash.match(/^#entry\/([^/?]+)/);
  box.dataset.entry = m ? decodeURIComponent(m[1]) : '';
  box.querySelector('h2').textContent = t('Game Master’s secrets', 'Secretos del Game Master');
  const holder = document.createElement('div');
  holder.className = 'gm-veil';
  box.append(holder);
  veil(box, 0);
 }
 new MutationObserver(dress).observe(document.documentElement, {childList: true, subtree: true});
 document.addEventListener('DOMContentLoaded', dress);

 /* The reckoning: once a visit, after the splash, say how many secrets have been revealed. */
 let told = false;
 async function reckon() {
  if(told) return;
  told = true;
  try {if(sessionStorage.getItem('kalvatar-reckoned')) return; sessionStorage.setItem('kalvatar-reckoned', '1');} catch {}
  const n = await count(false);
  if(!n) return;
  const el = document.createElement('div');
  el.className = 'gm-reckon';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', t('Secrets revealed', 'Secretos revelados'));
  el.innerHTML = `<div class="gm-reckon-card"><p class="gm-reckon-eye" aria-hidden="true">◉</p><p class="gm-reckon-n">${n}</p><p class="gm-reckon-line">${n === 1 ? t('secret has been revealed…', 'secreto ha sido revelado…') : t('secrets have been revealed…', 'secretos han sido revelados…')}</p><p class="gm-reckon-sub">${t('The Game Master knows.', 'El Game Master lo sabe.')}</p><button type="button" class="gm-button">${t('Sail on', 'Seguir navegando')}</button></div>`;
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('on'));
  const close = () => {el.classList.remove('on'); setTimeout(() => el.remove(), 400);};
  el.querySelector('button').onclick = close;
  el.addEventListener('click', e => {if(e.target === el) close();});
  document.addEventListener('keydown', function esc(e) {if(e.key === 'Escape') {close(); document.removeEventListener('keydown', esc);}});
  el.querySelector('button').focus();
 }
 document.addEventListener('click', e => {if(e.target.closest?.('[data-kv-go], .kv-choice')) setTimeout(reckon, 900);}, true);
 window.addEventListener('load', () => setTimeout(() => {if(!document.querySelector('.kv-splash-frame')) reckon();}, 2500));
})();
