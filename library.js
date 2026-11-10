/* Reading editions for the Living Atlas. Stories and dossiers share stable entry ids. */
'use strict';
window.AtlasLibrary = (() => {
 const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const progressKey = 'kalvatar-library-reading-v1';
 let books = [], failed = false, query = '', kind = '', active = null, scrollHandler = null, jump = null;
 const ready = fetch('library.json').then(r => {if(!r.ok) throw Error(); return r.json();})
  .then(value => {books = value;}).catch(() => {failed = true;});
 const scope = () => window.Pack2?.campaign ? 'campaign:' + (Pack2.campaign.id || Pack2.campaign.name) : 'atlas';
 const allowed = book => book.requiredEntries.every(id => Pack2.canRead(id));
 const readProgress = () => {try {return JSON.parse(localStorage.getItem(progressKey) || '{}');} catch {return {};}};
 function place(book) {
  const value = readProgress()[scope() + ':' + book.id];
  return Number.isInteger(value?.chapter) && value.chapter >= 0 && value.chapter < book.chapters.length ? value.chapter : 0;
 }
 function remember(book, chapter) {
  try {const value = readProgress(); value[scope() + ':' + book.id] = {chapter}; localStorage.setItem(progressKey, JSON.stringify(value));} catch {}
 }
 function cleanup() {
  if(scrollHandler) window.removeEventListener('scroll', scrollHandler);
  scrollHandler = null; active = null; jump = null;
 }
 function art(book, large = false) {
  const a = book.illustration;
  return a ? `<img src="${h(large ? a.src : a.thumb)}" alt="${large ? h(a.alt) : ''}" width="${large ? 960 : 480}" height="${large ? 640 : 320}" loading="${large ? 'eager' : 'lazy'}">` : `<div class="library-book-cover" aria-hidden="true"><span>KALVATAR TALES</span><i>✦</i><strong>${h(book.title)}</strong><small>FROM THE TABLE’S ARCHIVE</small></div>`;
 }
 function card(book, compact = false) {
  if(!allowed(book)) return Pack2.lockedCard();
  const chapter = place(book);
  return `<a class="library-card${compact ? ' compact' : ''}" href="#library/${h(book.id)}${chapter ? '/' + (chapter + 1) : ''}"><div class="library-card-art">${art(book)}</div><div class="library-card-copy"><p class="eyebrow">${h(book.kind)} · ${book.readingMinutes} min read</p><h2>${h(book.title)}</h2><p>${h(book.summary)}</p><span class="library-edition">${h(book.edition)} · ${book.chapters.length} chapters</span><span class="library-card-open">${chapter ? 'Continue at chapter ' + (chapter + 1) : 'Open the book'} <span aria-hidden="true">↗</span></span></div></a>`;
 }
 function selectNavigation() {
  setNavigation('library');
  document.querySelector('#breadcrumb').innerHTML = '<a href="#">The world</a><span>/</span><a href="#library">Library</a>';
 }
 function renderShelf() {
  cleanup(); selectNavigation(); document.title = 'Library | Kalvatar';
  document.querySelector('#content').innerHTML = `<div class="content-wrap library-shelf" data-content-lang><header class="library-intro"><p class="eyebrow">THE ISLANDS, IN THEIR OWN WORDS</p><h1>A little room<br>for <em>stories.</em></h1><p>Chronicles, tales from the table, and the voices that give the atlas its life. Open a book and stay a while.</p><span class="library-language">Reading editions in English · Spanish translations pending</span></header><form class="library-filters" role="search" aria-label="Search the library"><label for="library-search">Find a story<input id="library-search" type="search" placeholder="A title, a character, a place…" autocomplete="off" value="${h(query)}"></label><label for="library-kind">On the shelf<select id="library-kind"><option value="">All books</option>${[...new Set(books.map(b => b.kind))].map(k => `<option ${kind === k ? 'selected' : ''}>${h(k)}</option>`).join('')}</select></label><p id="library-result-count" aria-live="polite"></p></form><div class="library-book-grid" id="library-books"></div><p class="library-shelf-note">Stories are reading editions of the table’s archive. A character’s account can be mistaken, incomplete or fiercely personal. The atlas entries remain the reference for what the islands know.</p></div>`;
  document.querySelector('.library-filters').addEventListener('submit', e => e.preventDefault());
  document.querySelector('#library-search').addEventListener('input', e => {query = e.target.value; drawShelf();});
  document.querySelector('#library-kind').addEventListener('change', e => {kind = e.target.value; drawShelf();});
  drawShelf();
 }
 function drawShelf() {
  const term = query.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const matches = books.filter(b => (!kind || b.kind === kind) && (!term || allowed(b) &&
   [b.title, b.subtitle, b.summary, b.region, ...b.cast.map(id => byId[id]?.title || ''), ...b.chapters.flatMap(c => [c.title,...c.paragraphs])].join(' ').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(term)));
  document.querySelector('#library-result-count').textContent = failed ? 'The shelf could not be loaded. Please try again.' : `${matches.length} ${matches.length === 1 ? 'book' : 'books'}`;
  document.querySelector('#library-books').innerHTML = matches.length ? matches.map(b => card(b)).join('') : '<p class="empty-state">No book on this shelf matches that search.</p>';
 }
 function entryLinks(ids) {
  return ids.filter(id => byId[id] && Pack2.canRead(id)).map(id => `<a class="library-entry-link" href="#entry/${h(id)}">${h(byId[id].title)} <span aria-hidden="true">↗</span></a>`).join('');
 }
 function inlineProse(text) {
  // Emphasis belongs to the reading edition; each text segment still passes
  // through the atlas's escaping/link renderer. Raw HTML is never accepted.
  return String(text).split(/\*([^*\n]+)\*/g).map((part, index) =>
   index % 2 ? `<em>${linkify(part, '')}</em>` : linkify(part, '')).join('');
 }
 function chapterProse(chapter) {
  const breaks = new Set(chapter.sceneBreaks || []);
  return chapter.paragraphs.map((text, index) =>
   (breaks.has(index) ? '<div class="library-scene-break" role="separator" aria-label="New scene"><span aria-hidden="true">✦ ✦ ✦</span></div>' : '') +
   `<p${/^[“"]/.test(text) ? ' class="story-dialogue"' : ''}>${inlineProse(text)}</p>`).join('');
 }
 function renderBook(id, requestedChapter) {
  cleanup(); selectNavigation();
  const book = books.find(b => b.id === id);
  if(!book) {
   document.querySelector('#content').innerHTML = '<div class="content-wrap library-shelf"><h1>This shelf is still uncharted.</h1><p>The book could not be found.</p><a class="button" href="#library">Return to the library →</a></div>';
   document.title = 'Uncharted shelf | Kalvatar'; return;
  }
  if(!allowed(book)) {Pack2.renderLocked(); return;}
  active = book;
  const chapter = requestedChapter && /^\d+$/.test(requestedChapter) ? Math.max(0, Math.min(book.chapters.length - 1, Number(requestedChapter) - 1)) : 0;
  jump = requestedChapter ? chapter : null;
  document.title = book.title + ' | Kalvatar Library';
  const prose = book.chapters.map((s, i) => `<section id="book-chapter-${i}" class="library-chapter" data-book-chapter="${i}"><p class="library-chapter-number">${String(i + 1).padStart(2, '0')}</p><h2>${h(s.title)}</h2>${s.illustration ? `<figure class="library-chapter-art">${art({illustration:s.illustration},true)}<figcaption>${h(s.illustration.caption || "")}</figcaption></figure>` : ""}${chapterProse(s)}${i < book.chapters.length - 1 ? `<button class="text-link book-next" data-book-jump="${i + 1}">Next: ${h(book.chapters[i + 1].title)} ↓</button>` : '<p class="library-colophon" aria-label="End of this account">✦ ✦ ✦</p>'}</section>`).join('');
  const resumed = place(book);
  document.querySelector('#content').innerHTML = `<article class="content-wrap library-reader" data-content-lang lang="en"><header class="library-book-header"><a class="library-return" href="#library">← Back to the library</a><p class="eyebrow">${h(book.kind)} · ${h(book.region)} · ${book.readingMinutes} MIN READ</p><h1>${h(book.title)}</h1><p class="article-subtitle">${h(book.subtitle)}</p><div class="library-book-meta"><span>${h(book.edition)}</span><span>${book.chapters.length} chapters</span><span>English edition</span>${book.sourceStatus === 'opening-missing' ? '<span class="library-fragment-label">Preserved fragment</span>' : ''}</div>${resumed && !requestedChapter ? `<button class="button book-resume" data-book-jump="${resumed}">Resume chapter ${resumed + 1}: ${h(book.chapters[resumed].title)} ↓</button>` : ''}</header>${book.illustration ? `<figure class="library-frontispiece">${art(book, true)}<figcaption>${h(book.illustration.caption || '')}</figcaption></figure>` : ''}<div class="library-reading-layout"><aside class="library-contents"><p class="eyebrow">IN THIS BOOK</p><nav aria-label="Book chapters">${book.chapters.map((s, i) => `<button data-book-jump="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${h(s.title)}</button>`).join('')}</nav><p class="library-place" id="library-reading-place" aria-live="polite">Your place is kept on this device.</p><div class="library-progress-track" aria-hidden="true"><span id="library-reading-progress"></span></div></aside><div class="library-prose">${prose}<aside class="library-edition-note"><p class="eyebrow">ABOUT THIS EDITION</p><p>${h(book.sourceNote)}</p><p>Spanish translation pending.</p></aside><section class="library-cast"><p class="eyebrow">PEOPLE IN THESE PAGES</p><div>${entryLinks(book.cast)}</div>${book.castNotes.map(p => `<p>${h(p)}</p>`).join('')}</section><section class="library-related"><p class="eyebrow">BACK TO THE ATLAS</p><div>${entryLinks(book.related)}</div></section><a class="library-return" href="#library">← Return to the shelves</a></div></div></article>`;
  document.querySelectorAll('[data-book-jump]').forEach(button => button.addEventListener('click', () => jumpTo(Number(button.dataset.bookJump))));
 }
 function jumpTo(index) {
  const target = document.querySelector('#book-chapter-' + index);
  if(!target || !active) return;
  remember(active, index);
  target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
 }
 function mountReading() {
  if(!active) return;
  const book = active, sections = [...document.querySelectorAll('[data-book-chapter]')];
  let previous = -1, queued = false;
  const update = () => {
   if(active !== book) return;
   const visible = sections.filter(s => s.getBoundingClientRect().top <= 190);
   if(!visible.length) return;
   const index = Number(visible[visible.length - 1].dataset.bookChapter);
   if(index !== previous) {
    previous = index; remember(book, index);
    document.querySelector('#library-reading-place').textContent = `Chapter ${index + 1} of ${sections.length} · place saved on this device`;
    document.querySelector('#library-reading-progress').style.width = ((index + 1) / sections.length * 100) + '%';
    document.querySelectorAll('.library-contents [data-book-jump]').forEach(b => {
     const yes = Number(b.dataset.bookJump) === index;
     b.classList.toggle('current', yes);
     if(yes) b.setAttribute('aria-current', 'location'); else b.removeAttribute('aria-current');
    });
   }
  };
  scrollHandler = () => {if(!queued) {queued = true; requestAnimationFrame(() => {queued = false; update();});}};
  window.addEventListener('scroll', scrollHandler, {passive: true});
  if(jump !== null) {const target = jump; requestAnimationFrame(() => {jumpTo(target); update();});} else update();
 }
 function profile(e) {
  if(!e?.dossier) return;
  const article = document.querySelector('.article-wrap');
  if(!article) return;
  article.classList.add('character-dossier');
  const header = article.querySelector('.article-header');
  header.insertAdjacentHTML('afterbegin', '<p class="dossier-label" data-content-lang>CHARACTER DOSSIER</p>');
  const labels = ['Background', 'Powers and abilities', 'Equipment', 'Personality', 'Goals', 'In Kalvatar'];
  const known = labels.map(label => ({label, index: e.sections.findIndex(s => s.title === label)})).filter(x => x.index >= 0);
  if(known.length > 2) {
   const nav = document.createElement('nav'); nav.className = 'dossier-sections'; nav.setAttribute('aria-label', 'Character dossier sections'); nav.setAttribute('data-content-lang', '');
   nav.innerHTML = known.map(x => `<button data-dossier-section="${x.index}">${h(x.label)}</button>`).join('');
   nav.querySelectorAll('button').forEach(b => b.addEventListener('click', () => document.querySelector('#article-section-' + b.dataset.dossierSection)?.scrollIntoView({behavior: 'smooth'})));
   header.append(nav);
  }
 }
 function afterRoute() {
  if(location.hash.startsWith('#library/')) {mountReading(); return;}
  if(!location.hash.startsWith('#entry/')) {cleanup(); return;}
  cleanup();
  const e = byId[location.hash.slice(7)]; if(!e || !Pack2.canRead(e.id)) return;
  profile(e);
  const related = books.filter(b => allowed(b) && (b.cast.includes(e.id) || b.related.includes(e.id)));
  if(!related.length) return;
  const anchor = document.querySelector('.article-related');
  if(anchor) anchor.insertAdjacentHTML('beforebegin', `<section class="library-entry-shelf" data-content-lang><p class="eyebrow">FROM THE LIBRARY</p><h2>There is a story here.</h2><div class="library-book-grid">${related.map(b => card(b, true)).join('')}</div><a class="text-link" href="#library">Browse the library →</a></section>`);
 }
 function route(view, parts) {
  if(view !== 'library') return false;
  if(parts[1]) renderBook(parts[1], parts[2]); else renderShelf();
  return true;
 }
 function searchResults(query) {
  const term = query.trim().toLocaleLowerCase();
  if(!term) return '';
  return books.filter(b => allowed(b) && [b.title, b.summary, ...b.cast.map(id => byId[id]?.title || ''), ...b.chapters.flatMap(c => [c.title,...c.paragraphs])].join(' ').toLocaleLowerCase().includes(term)).slice(0,3).map(b => `<a class="search-result library-search-result" href="#library/${h(b.id)}"><span><strong>${h(b.title)}</strong><small>LIBRARY / ${h(b.kind)} · ${b.readingMinutes} MIN READ</small><p>${h(b.summary)}</p></span><span aria-hidden="true">↗</span></a>`).join('');
 }
 return {ready, route, afterRoute, searchResults, get count(){return books.length;}};
})();
