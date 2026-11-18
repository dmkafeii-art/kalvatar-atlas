/* Spanish names (the DM's word, 17 November): when a name is translated into Spanish, its English name sits small,
   in parentheses, right under it. The data writes it [[nombre|English name]]; this draws it as ruby text, wherever
   it lands on the page (an article, a rumor card, a fact, a revealed secret). */
'use strict';
(() => {
 const RE = /\[\[([^\[\]|]+?)\|([^\[\]]+?)\]\]/g;
 const BLOCK = 'p,li,dd,dt,h1,h2,h3,h4,figcaption,td,th,caption,blockquote';
 const SKIP = 'script,style,textarea,input,select,rt';
 const draw = el => {
  const html = el.innerHTML, next = html.replace(RE, (m, es, en) => `<ruby class="kv-en">${es}<rt lang="en">(${en})</rt></ruby>`);
  if(next !== html) el.innerHTML = next;
  el.querySelectorAll('ruby.kv-en rt a').forEach(a => a.replaceWith(a.textContent));  // the English under a name is not a second link
 };
 // In Spanish some entry names are everyday words too ("abajo", "el hierro"): written in lowercase, they are the word, not the entry.
 const PLAIN = new Set(['abajo', 'bastión', 'el hierro', 'caos', 'la espada', 'el alféizar', 'la resaca', 'la mortaja', 'el rompeolas', 'la guarda',
  'el nudo', 'el ciclo', 'el remiendo', 'el sello', 'el desatado', 'la marea libre', 'la puerta callada', 'el hombre pálido']);
 const unlink = root => {
  if(window.Pack2?.language !== 'es' || !root.querySelectorAll) return;
  root.querySelectorAll('a.wiki-link').forEach(a => {
   const t = a.textContent;
   if(t && t[0] !== t[0].toUpperCase() && PLAIN.has(t.toLowerCase())) a.replaceWith(t);
  });
 };
 function scan(node) {
  const root = node?.nodeType === 3 ? node.parentElement : node;
  if(!root || root.nodeType !== 1 || root.closest(SKIP)) return;
  unlink(root);
  if(!root.textContent.includes('[[')) return;
  const found = new Set(), walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for(let n = walk.nextNode(); n; n = walk.nextNode()) {
   if(!n.nodeValue.includes('[[') || n.parentElement.closest(SKIP)) continue;
   const block = n.parentElement.closest(BLOCK);
   if(block) found.add(block);
  }
  found.forEach(draw);
 }
 const css = document.createElement('style');
 css.textContent = 'ruby.kv-en{-webkit-ruby-position:after;ruby-position:under;ruby-align:center;white-space:nowrap}' +
  'ruby.kv-en>rt{font-size:.62em;font-style:italic;font-weight:400;letter-spacing:0;text-transform:none;opacity:.8;line-height:1.2}';
 document.head.append(css);
 new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(scan))).observe(document.documentElement, {childList: true, subtree: true});
 document.addEventListener('DOMContentLoaded', () => scan(document.body));
})();
