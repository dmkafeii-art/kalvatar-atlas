/* Kalvatar, the Living Atlas: the landfall screen and the tide carousel.
 *
 * A drop-in module. app.js does not change.
 * Add two lines to the <head> of index.html, after aesthetic.css:
 *   <link rel="stylesheet" href="welcome.css?v=1">
 *   <script src="welcome.js?v=1"></script>
 * (No "defer" on this one script: it must run before the page paints, so the
 * home page never flashes behind the landfall screen.)
 *
 * 1. The landfall screen. Whoever opens the bare link (no #entry/... in it) sees only
 *    the title for four seconds; then two choices appear. A link straight to an entry
 *    skips the screen, so a shared link opens where it points.
 * 2. The tide carousel. Under the hero on the home page: ten entries chosen at random,
 *    a new handful on every visit, with an "Another tide" button.
 * 3. Lantern mode (needs storybook.css). A lantern button in the top bar switches the atlas
 *    to its night colors. The choice is remembered; until a reader chooses, the atlas follows
 *    the device's dark setting. It is set before the page paints, so nothing flashes.
 *
 * Language: the Spanish strings are used when <html lang="es">.
 */
(function () {
  'use strict';

  var CONFIG = {
    splashSeconds: 4,
    // Where "Make landfall" leads. Change to '#start' once the Start here page exists.
    newcomerHref: '#start',
    // The carousel goes after this element on the home page (falls back to the hero).
    carouselAfter: '.stats-strip',
    carouselSize: 10,
    perCategory: 3,
    autoAdvanceSeconds: 7,
    // Already shown on the home page, so the carousel leaves them out.
    skip: ['lampet', 'teacup-moth', 'chartback-tortoise', 'grommoth', 'tarvan', 'vorthani', 'pocchin']
  };

  var STRINGS = {
    en: {
      sub: 'THE LIVING ATLAS',
      foot: 'THE CHARTED ISLES',
      by: 'AN ORIGINAL WORLD BY KAFEII',
      newKicker: 'FIRST VOYAGE',
      newTitle: 'Make landfall',
      newLine: 'New to the islands? Start here.',
      backKicker: 'RETURNING',
      backTitle: 'Set sail again',
      backLine: 'Straight to the atlas.',
      backLineEntry: 'Back to {title}.',
      choices: 'Choose your way in',
      tideKicker: 'CHOSEN BY THE TIDE',
      tideHeading: 'What the tide<br><em>brought in.</em>',
      tideDeck: 'Every visit, the tide leaves something different on the beach.',
      another: 'Another tide',
      prev: 'Previous entries',
      next: 'More entries',
      region: 'Entries chosen at random',
      fieldNotes: 'FIELD NOTES',
      working: 'Working beast',
      companion: 'Companion',
      saurian: 'Saurian',
      lanternOn: 'Light the lantern',
      lanternOff: 'Put out the lantern'
    },
    es: {
      sub: 'EL ATLAS VIVO',
      foot: 'LAS ISLAS CARTOGRAFIADAS',
      by: 'UN MUNDO ORIGINAL DE KAFEII',
      newKicker: 'PRIMER VIAJE',
      newTitle: 'Llegar a tierra',
      newLine: '¿Primera vez en las islas? Empieza aquí.',
      backKicker: 'DE REGRESO',
      backTitle: 'Seguir navegando',
      backLine: 'Directo al atlas.',
      backLineEntry: 'De vuelta a {title}.',
      choices: 'Elige cómo entrar',
      tideKicker: 'ELEGIDO POR LA MAREA',
      tideHeading: 'Lo que trajo<br><em>la marea.</em>',
      tideDeck: 'En cada visita, la marea deja algo distinto en la playa.',
      another: 'Otra marea',
      prev: 'Entradas anteriores',
      next: 'Más entradas',
      region: 'Entradas elegidas al azar',
      fieldNotes: 'NOTAS DE CAMPO',
      working: 'Bestia de trabajo',
      companion: 'Compañero',
      saurian: 'Sauriano',
      lanternOn: 'Enciende el farol',
      lanternOff: 'Apaga el farol'
    }
  };

  var LAST_KEY = 'kalvatar-last-entry-v1';
  var root = document.documentElement;
  var COMPASS = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="kv-ring" cx="32" cy="32" r="24"/>' +
    '<circle class="kv-dots" cx="32" cy="32" r="19" stroke-dasharray="1 5"/>' +
    '<path class="kv-star" d="m32 4 5 23 23 5-23 5-5 23-5-23-23-5 23-5Z"/></svg>';

  function t(key) {
    var lang = (root.lang || 'en').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
    return STRINGS[lang][key];
  }
  function escape(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function readLast() {
    try {
      var v = JSON.parse(localStorage.getItem(LAST_KEY) || 'null');
      return v && typeof v.id === 'string' && typeof v.title === 'string' ? v : null;
    } catch (e) { return null; }
  }
  function writeLast(id, title) {
    try { localStorage.setItem(LAST_KEY, JSON.stringify({ id: id, title: title })); } catch (e) { /* private mode */ }
  }
  // app.js keeps its data in top-level variables; read them safely.
  function atlas() {
    try {
      return {
        entries: typeof entries !== 'undefined' && Array.isArray(entries) ? entries : [],
        byId: typeof byId !== 'undefined' ? byId : {},
        categories: typeof categories !== 'undefined' ? categories : {},
        icon: typeof icon === 'function' ? icon : null,
        mapSvg: typeof mapSvg === 'function' ? mapSvg : null
      };
    } catch (e) {
      return { entries: [], byId: {}, categories: {}, icon: null, mapSvg: null };
    }
  }

  /* ---------------- 3. Lantern mode (set first, before anything paints) ---------------- */

  var THEME_KEY = 'kalvatar-theme-v1';
  var LANTERN_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.6v2.2"/><path d="M9 6.2h6l-.9-2.4H9.9Z"/>' +
    '<rect x="7.6" y="6.2" width="8.8" height="11.3" rx="1.6"/><path d="M7.2 17.5h9.6l-1.2 2.6H8.4Z"/>' +
    '<path class="kv-flame" d="M12 9.4c1.7 1.8 1.7 3.6 0 5.3-1.7-1.7-1.7-3.5 0-5.3Z"/></svg>';
  function storedTheme() {
    try { var v = localStorage.getItem(THEME_KEY); return v === 'lantern' || v === 'day' ? v : null; } catch (e) { return null; }
  }
  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'lantern' : 'day';
  }
  function syncLantern() {
    var b = document.querySelector('.kv-lantern');
    if (!b) return;
    var on = root.getAttribute('data-theme') === 'lantern';
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', t(on ? 'lanternOff' : 'lanternOn'));
    b.title = t(on ? 'lanternOff' : 'lanternOn');
  }
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'lantern' ? '#0d2126' : '#142b30');
    syncLantern();
  }
  applyTheme(storedTheme() || systemTheme());
  if (window.matchMedia) {
    var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var follow = function () { if (!storedTheme()) applyTheme(systemTheme()); };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', follow);
    else if (darkQuery.addListener) darkQuery.addListener(follow);
  }
  function mountLantern() {
    // Only when storybook.css is on the page: it holds the night colors.
    if (getComputedStyle(root).getPropertyValue('--storybook').trim() !== '1') return;
    var bar = document.querySelector('.topbar-right');
    if (!bar || bar.querySelector('.kv-lantern')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'kv-lantern';
    b.innerHTML = LANTERN_ICON;
    var random = bar.querySelector('.topbar-random');
    bar.insertBefore(b, random || null);
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'lantern' ? 'day' : 'lantern';
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode: this visit only */ }
      if (!reducedMotion()) {
        root.classList.add('kv-theme-anim');
        setTimeout(function () { root.classList.remove('kv-theme-anim'); }, 600);
      }
      applyTheme(next);
    });
    syncLantern();
  }

  /* ---------------- 1. The landfall screen ---------------- */

  // Pack 3 reloads the page when the reader switches language; that reload skips the screen once.
  function skipOnce() {
    try { if (sessionStorage.getItem('kv-skip-splash')) { sessionStorage.removeItem('kv-skip-splash'); return true; } } catch (e) {}
    return false;
  }
  var landing = (!location.hash || location.hash === '#') && !skipOnce();
  if (landing) {
    root.classList.add('kv-landing');
    // Safety: if anything goes wrong, never leave the page hidden.
    setTimeout(function () {
      if (!document.querySelector('.kv-splash')) root.classList.remove('kv-landing');
    }, 3000);
  }

  function mountSplash() {
    var a = atlas();
    var last = readLast();
    var el = document.createElement('div');
    el.className = 'kv-splash';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'kv-splash-title');
    var activeCampaign=window.Pack2&&window.Pack2.campaign;
    var backHref = activeCampaign ? '#campaign' : last ? '#entry/' + last.id : '#';
    var backLine = activeCampaign ? escape(activeCampaign.name) : last ? t('backLineEntry').replace('{title}', escape(last.title)) : t('backLine');
    el.innerHTML =
      '<div class="kv-splash-chart" aria-hidden="true">' + (a.mapSvg ? a.mapSvg('splash') : '') + '</div>' +
      '<div class="kv-splash-frame" aria-hidden="true"></div>' +
      '<div class="kv-splash-inner">' +
        '<div class="kv-splash-mark">' + COMPASS + '</div>' +
        '<h1 class="kv-splash-title" id="kv-splash-title">KALVATAR</h1>' +
        '<p class="kv-splash-sub"><span aria-hidden="true">✦</span> ' + t('sub') + ' <span aria-hidden="true">✦</span></p>' +
        '<nav class="kv-splash-choices" aria-label="' + t('choices') + '" inert>' +
          '<a class="kv-choice kv-choice-new" href="' + CONFIG.newcomerHref + '" data-kv-go="new">' +
            '<span class="kv-choice-kicker">' + t('newKicker') + '</span>' +
            '<strong>' + t('newTitle') + '</strong>' +
            '<span class="kv-choice-line">' + t('newLine') + '</span>' +
            '<span class="kv-choice-arrow" aria-hidden="true">↗</span></a>' +
          '<a class="kv-choice kv-choice-back" href="' + backHref + '" data-kv-go="back">' +
            '<span class="kv-choice-kicker">' + t('backKicker') + '</span>' +
            '<strong>' + t('backTitle') + '</strong>' +
            '<span class="kv-choice-line">' + backLine + '</span>' +
            '<span class="kv-choice-arrow" aria-hidden="true">↗</span></a>' +
        '</nav>' +
      '</div>' +
      '<p class="kv-splash-foot"><span>' + t('foot') + '</span><span class="kv-splash-star" aria-hidden="true">✦</span><span>' + t('by') + '</span></p>';
    el.tabIndex = -1;
    document.body.appendChild(el);
    el.focus({ preventScroll: true }); // keyboard and screen-reader users start inside the screen

    var choices = el.querySelector('.kv-splash-choices');
    // While only the title shows, it sits in the middle of the screen; when the
    // choices appear, it rises to make room for them.
    if (!reducedMotion()) {
      var lift = (choices.offsetHeight + (parseFloat(getComputedStyle(choices).marginTop) || 0)) / 2;
      el.querySelector('.kv-splash-inner').style.setProperty('--kv-lift', lift + 'px');
    }
    var ready = false, closing = false;
    function reveal() {
      if (ready) return;
      ready = true;
      choices.removeAttribute('inert');
      el.classList.add('kv-ready');
    }
    function close(hash) {
      if (closing) return;
      closing = true;
      document.removeEventListener('keydown', onKey);
      el.classList.add('kv-leaving');
      root.classList.remove('kv-landing');
      if (hash && hash !== '#' && hash !== location.hash) location.hash = hash.slice(1);
      var content = document.getElementById('content');
      if (content) content.focus({ preventScroll: true });
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, reducedMotion() ? 0 : 700);
    }
    function onKey(e) {
      if (e.key === 'Escape') { if (ready) close('#'); else reveal(); }
      else if (!ready && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); reveal(); }
    }
    var timer = setTimeout(reveal, CONFIG.splashSeconds * 1000);
    // A tap or key before the four seconds are up brings the choices early.
    el.addEventListener('click', function (e) {
      var go = e.target.closest('[data-kv-go]');
      if (go && ready) { e.preventDefault(); close(go.getAttribute('href')); return; }
      if (!ready) { e.preventDefault(); clearTimeout(timer); reveal(); }
    });
    document.addEventListener('keydown', onKey);
  }

  /* ---------------- 2. The tide carousel ---------------- */

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), x = list[i];
      list[i] = list[j];
      list[j] = x;
    }
    return list;
  }
  function pickTide(a) {
    var skip = {};
    CONFIG.skip.forEach(function (id) { skip[id] = true; });
    var pool = a.entries.filter(function (e) { return e && e.id && (!window.Pack2 || window.Pack2.canRead(e.id)) && !skip[e.id] && a.categories[e.category]; });
    var art = shuffle(pool.filter(function (e) { return e.illustration; }));
    var plain = shuffle(pool.filter(function (e) { return !e.illustration; }));
    var out = [], count = {};
    function take(list, max, cap) {
      for (var i = 0; i < list.length && out.length < max; i++) {
        var e = list[i];
        if (out.indexOf(e) > -1 || (count[e.category] || 0) >= cap) continue;
        count[e.category] = (count[e.category] || 0) + 1;
        out.push(e);
      }
    }
    var size = CONFIG.carouselSize, cap = CONFIG.perCategory;
    take(art, Math.ceil(size * 0.7), cap); // most of the handful has a picture
    take(plain, size, cap);
    take(art, size, cap);
    take(shuffle(pool.slice()), size, Infinity); // if the caps left gaps, fill them
    return shuffle(out);
  }
  function typeLabel(a, e) {
    if (e.creatureKind) return t(e.creatureKind === 'working' ? 'working' : e.creatureKind === 'companion' ? 'companion' : 'saurian');
    var c = a.categories[e.category];
    return c ? c.short : '';
  }
  function tideCard(a, e) {
    var visual;
    if (e.illustration && e.illustration.thumb) {
      visual = '<div class="entry-illustration has-art"><img src="' + escape(e.illustration.thumb) +
        '" alt="" loading="lazy" decoding="async" width="480" height="320"></div>';
    } else {
      var c = a.categories[e.category];
      visual = '<div class="entry-illustration ' + escape(e.category) + '">' + (a.icon ? a.icon(c ? c.icon : 'compass') : COMPASS) +
        '<span class="mono">' + t('fieldNotes') + ' / ' + escape(String(e.region || '').toUpperCase()) + '</span></div>';
    }
    var teaser = e.epigraph && e.epigraph.quote
      ? '<p class="kv-tide-quote">“' + escape(e.epigraph.quote) + '”</p>'
      : '<p>' + escape(e.summary) + '</p>';
    return '<a class="entry-card kv-tide-card" href="#entry/' + escape(e.id) + '">' + visual +
      '<div class="entry-card-copy"><span class="entry-type">' + escape(typeLabel(a, e)) + '</span>' +
      '<h3>' + escape(e.title) + '</h3>' + teaser +
      '<div class="entry-card-bottom"><span>' + escape(e.region) + '</span><span aria-hidden="true">↗</span></div></div></a>';
  }

  var tideTimer = null, tideVisible = false, tidePaused = false;
  function stopTide() { clearInterval(tideTimer); tideTimer = null; }
  function startTide(track) {
    stopTide();
    if (reducedMotion()) return;
    tideTimer = setInterval(function () {
      if (!document.body.contains(track)) { stopTide(); return; }
      if (tidePaused || !tideVisible || document.hidden || root.classList.contains('kv-landing')) return;
      step(track, 1, true);
    }, CONFIG.autoAdvanceSeconds * 1000);
  }
  function step(track, dir, wrap) {
    var card = track.querySelector('.kv-tide-card');
    if (!card) return;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var by = card.getBoundingClientRect().width + gap;
    var end = track.scrollWidth - track.clientWidth - 4;
    var behavior = reducedMotion() ? 'auto' : 'smooth';
    if (dir > 0 && track.scrollLeft >= end) { if (wrap) track.scrollTo({ left: 0, behavior: behavior }); return; }
    track.scrollBy({ left: dir * by, behavior: behavior });
  }
  function fillTide(section) {
    var a = atlas();
    var track = section.querySelector('.kv-tide-track');
    track.innerHTML = pickTide(a).map(function (e) { return tideCard(a, e); }).join('');
    track.scrollLeft = 0;
  }
  function mountTide() {
    var content = document.getElementById('content');
    if (!content || !content.querySelector('.hero') || content.querySelector('.kv-tide')) return;
    if (!atlas().entries.length) return;
    var anchor = content.querySelector(CONFIG.carouselAfter) || content.querySelector('.hero');
    var section = document.createElement('section');
    section.className = 'section kv-tide';
    section.setAttribute('aria-labelledby', 'kv-tide-heading');
    section.innerHTML =
      '<div class="section-title"><div><p class="eyebrow">' + t('tideKicker') + '</p>' +
      '<h2 id="kv-tide-heading">' + t('tideHeading') + '</h2></div>' +
      '<div class="kv-tide-controls"><button class="text-link" type="button" data-kv-another>' + t('another') +
      ' <span aria-hidden="true">⤨</span></button>' +
      '<button class="kv-tide-arrow" type="button" data-kv-step="-1" aria-label="' + t('prev') + '">←</button>' +
      '<button class="kv-tide-arrow" type="button" data-kv-step="1" aria-label="' + t('next') + '">→</button></div></div>' +
      '<p class="section-deck">' + t('tideDeck') + '</p>' +
      '<div class="kv-tide-track" role="region" aria-roledescription="carousel" aria-label="' + t('region') + '" tabindex="0"></div>';
    anchor.insertAdjacentElement('afterend', section);
    fillTide(section);
    var track = section.querySelector('.kv-tide-track');
    section.addEventListener('click', function (e) {
      if (e.target.closest('[data-kv-another]')) { fillTide(section); return; }
      var s = e.target.closest('[data-kv-step]');
      if (s) step(track, Number(s.getAttribute('data-kv-step')), false);
    });
    ['mouseenter', 'focusin', 'pointerdown', 'touchstart'].forEach(function (ev) {
      section.addEventListener(ev, function () { tidePaused = true; }, { passive: true });
    });
    section.addEventListener('mouseleave', function () { tidePaused = false; });
    section.addEventListener('focusout', function (e) { if (!section.contains(e.relatedTarget)) tidePaused = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (list) { tideVisible = list[0].isIntersecting; }, { threshold: 0.4 }).observe(section);
    } else {
      tideVisible = true;
    }
    tidePaused = false;
    startTide(track);
  }

  /* ---------------- Watching the page ---------------- */

  function onRender() {
    var m = /^#entry\/([^/]+)/.exec(location.hash);
    if (m) {
      var e = atlas().byId[m[1]];
      if (e && (!window.Pack2 || window.Pack2.canRead(e.id))) writeLast(e.id, e.title);
    }
    mountTide();
  }
  document.addEventListener('kalvatar-language', function(){ syncLantern(); var tide=document.querySelector('.kv-tide');if(tide)tide.remove();mountTide(); });
  function start() {
    mountLantern();
    if (landing) mountSplash();
    var content = document.getElementById('content');
    if (content) new MutationObserver(onRender).observe(content, { childList: true });
    onRender();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
