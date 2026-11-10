/* Kalvatar, the Living Atlas: Pack 3, Spanish everywhere.
 *
 * A drop-in module. app.js, pack2.js, campaigns.js and character-book.js do not change.
 * Add one line to the <head> of index.html, BEFORE pack2.js:
 *   <script src="pack3.js?v=1"></script>
 * (No "defer": it has to be in place before pack2.js asks for its data files.)
 *
 * 1. Fresh data, and Spanish data. Every data file is asked for with a version tag (DATA_VERSION), so
 *    browsers fetch new copies after an update. In Spanish, the atlas reads rumors_es.json, timeline_es.json, calendar_es.json,
 *    glossary_es.json and tours_es.json instead of the English files. If a Spanish file is missing,
 *    it quietly falls back to the English one.
 * 2. Switching language reloads the page, so every list is read again in the new language.
 *    The reload skips the landfall screen (welcome.js v15 or later).
 * 3. A second translation pass for text drawn after the page is translated: the search dialog,
 *    a region's panel on the chart, "load more", the zoom scale, and dates.
 * 4. Names stay in English. Under each English name, the Spanish meaning appears small and in
 *    parentheses (the "gloss" field in entries_es.json): on the article title, on every card,
 *    and in the search results.
 */
(function () {
  'use strict';

  var KEY = 'kalvatar-language-v1';
  function stored() {
    try { return JSON.parse(localStorage.getItem(KEY)) === 'es' ? 'es' : 'en'; } catch (e) { return 'en'; }
  }
  var ES = stored() === 'es';

  /* ---------------- 1. Spanish data ---------------- */
  var SWAP = {
    'rumors.json': 'rumors_es.json',
    'timeline.json': 'timeline_es.json',
    'calendar.json': 'calendar_es.json',
    'glossary.json': 'glossary_es.json',
    'tours.json': 'tours_es.json'
  };
  // Bump this when the data files change, so browsers fetch the new copies instead of cached ones.
  var DATA_VERSION = 'p3z';
  if (window.fetch) {
    var plain = window.fetch.bind(window);
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : input && input.url;
        var m = /^((?:[^?#:]*\/)?)([a-z0-9_-]+\.json)(\?[^#]*)?$/.exec(url || '');
        if (m) {
          var q = (m[3] ? m[3] + '&' : '?') + 'd=' + DATA_VERSION;
          var fresh = m[1] + m[2] + q;
          if (ES && SWAP[m[2]]) {
            var alt = m[1] + SWAP[m[2]] + q;
            return plain(alt, init).then(function (r) { return r.ok ? r : plain(fresh, init); },
              function () { return plain(fresh, init); });
          }
          return plain(fresh, init);
        }
      } catch (e) {}
      return plain(input, init);
    };
  }

  /* ---------------- 2. Reload on a language switch ---------------- */
  document.addEventListener('kalvatar-language', function () {
    try { sessionStorage.setItem('kv-skip-splash', '1'); } catch (e) {}
    location.reload();
  });

  if (!ES) return;

  /* ---------------- 3. The second pass ---------------- */
  var MONTHS = 'Eo|Eliol|Ezra|Liora|Idel|Veriden|Memnara|Rhor|Halvenir|Okram';
  var PATTERNS = [
    [/^Explore (.+)$/, 'Explorar $1'],
    [/^REGIONAL CHART \/ (\d+)%$/, 'CARTA REGIONAL / $1%'],
    [new RegExp('^(' + MONTHS + ') (\\d+)(?:st|nd|rd|th)$'), '$2 de $1'],
    [new RegExp('^(\\w+), (' + MONTHS + ') (\\d+), 175 EC$'), '$1, $3 de $2, 175 EC'],
    [/^(\d+) RUMORS$/, '$1 RUMORES'],
    [/^(\d+) ft\.?$/, '$1 pies'],
    [/^Continue exploring \((\d+) more\)$/, 'Seguir explorando ($1 más)']
  ];
  var SKIP = 'script,style,textarea,#language-switch,[data-content-lang],.article-lead,.article-subtitle,' +
    '.article-prose p,.article-table,.article-facts dd,.entry-card-copy>p,figcaption,.music-track,' +
    '.glossary-term>p:last-child,.campaign-space,.kv-gloss';
  var dict = null, folded = null;

  function lookup(value) {
    if (!value) return null;
    if (dict[value]) return dict[value];
    var known = folded[value.toLowerCase()];
    if (known) return value === value.toUpperCase() ? known.toUpperCase() : known;
    if (value.indexOf(' / ') > 0) {
      var parts = value.split(' / '), changed = false;
      var out = parts.map(function (p) { var t = lookup(p); if (t) { changed = true; return t; } return p; });
      if (changed) return out.join(' / ');
    }
    for (var i = 0; i < PATTERNS.length; i++) {
      if (PATTERNS[i][0].test(value)) return value.replace(PATTERNS[i][0], PATTERNS[i][1]);
    }
    return null;
  }

  function pass(root) {
    if (!dict) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), node;
    while ((node = walker.nextNode())) {
      var el = node.parentElement;
      if (!el || el.closest(SKIP)) continue;
      var raw = node.nodeValue, trimmed = raw.trim();
      if (!trimmed || !/[A-Za-z]/.test(trimmed)) continue;
      var t = lookup(trimmed);
      if (t && t !== trimmed) node.nodeValue = raw.replace(trimmed, t);
    }
    var scope = root.querySelectorAll ? root : document;
    var els = [].slice.call(scope.querySelectorAll('[aria-label],[title],[placeholder]'));
    if (root.nodeType === 1) els.push(root);
    els.forEach(function (el) {
      if (!el.getAttribute || el.id === 'language-switch' || (el.closest && el.closest('.campaign-space'))) return;
      ['aria-label', 'title', 'placeholder'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (!v) return;
        var t = lookup(v.trim());
        if (t && t !== v) el.setAttribute(a, t);
      });
    });
    if (document.title === 'Kalvatar | Kalvatar') document.title = 'Kalvatar | El Atlas Vivo';
  }

  /* ---------------- 4. The gloss under English names ---------------- */
  var gloss = {}, titles = {};
  function idOf(href) {
    var m = /#entry\/([^/?#]+)/.exec(href || '');
    return m ? decodeURIComponent(m[1]) : null;
  }
  function small(text, cls) {
    var s = document.createElement(cls === 'kv-gloss kv-gloss-title' ? 'p' : 'span');
    s.className = cls;
    s.setAttribute('lang', 'es');
    s.textContent = '(' + text + ')';
    return s;
  }
  function keepName(el, name) {
    var label = el.querySelector('.kv-entry-name');
    if (!label) {
      label = document.createElement('span');
      label.className = 'kv-entry-name';
      label.setAttribute('data-content-lang', 'en');
      var text = [].slice.call(el.childNodes).find(function (n) { return n.nodeType === 3 && n.nodeValue.trim(); });
      if (text) el.replaceChild(label, text); else el.insertBefore(label, el.firstChild);
    }
    if (label.textContent !== name) label.textContent = name;
  }
  function glossAll(root) {
    var scope = root.querySelectorAll ? root : document;
    // Article title
    var h1 = document.querySelector('.article-header h1');
    var current = idOf(location.hash);
    if (h1 && current && titles[current]) { keepName(h1, titles[current]); }
    if (h1 && current && gloss[current] && !(h1.nextElementSibling && h1.nextElementSibling.classList.contains('kv-gloss'))) {
      var gt = small(gloss[current], 'kv-gloss kv-gloss-title');
      var sub = document.querySelector('.article-subtitle');
      gt.style.fontFamily = getComputedStyle(sub || h1).fontFamily;
      h1.insertAdjacentElement('afterend', gt);
    }
    // Cards and search results
    [].slice.call(scope.querySelectorAll('a.entry-card, a.search-result')).forEach(function (a) {
      var id = idOf(a.getAttribute('href'));
      if (!id) return;
      var title = a.querySelector('h3, strong');
      if (title && titles[id]) { keepName(title, titles[id]); }
      if (!gloss[id] || a.querySelector('.kv-gloss')) return;
      if (title) { var g = small(gloss[id], 'kv-gloss'); g.style.fontFamily = getComputedStyle(title).fontFamily; title.insertAdjacentElement('afterend', g); }
    });
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    (window.requestAnimationFrame || setTimeout)(function () {
      queued = false;
      pass(document.body);
      glossAll(document);
    });
  }

  var css = '.kv-gloss{display:block;margin:.1rem 0 .45rem;font-style:italic;font-weight:400;font-size:.8rem;' +
    'line-height:1.3;letter-spacing:.01em;text-transform:none;opacity:.72}' +
    '.article-header .kv-gloss-title{font-size:clamp(1rem,1.6vw,1.2rem);margin:-.25rem 0 .7rem}' +
    '.search-result .kv-gloss{margin:0 0 .2rem}';
  function start() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    var P = window.Pack2;
    var ready = P && P.ready ? P.ready : Promise.resolve();
    ready.then(function () {
      var data = (window.Pack2 && window.Pack2.data) || {};
      dict = Object.assign({}, (data.i18n && data.i18n.ui) || {});
      folded = {};
      Object.keys(dict).forEach(function (k) { folded[k.toLowerCase()] = dict[k]; });
      var es = data.entries_es || {};
      Object.keys(es).forEach(function (id) { if (es[id] && es[id].title) titles[id] = es[id].title; if (es[id] && es[id].gloss) gloss[id] = es[id].gloss; });
      new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
      schedule();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
