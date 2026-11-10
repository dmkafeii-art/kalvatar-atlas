/* Regional chart coordinates follow the original 1371 × 2078 world chart.
   Placements are interpretive until the campaign canon fixes their exact sites. */
window.FrontierMap = (() => {
  const sites = [
    {id:'ironfort',x:401,y:617,why:'Northern anchorage on the Crown Route',es:'Fondeadero septentrional de la Ruta de la Corona'},
    {id:'greyhaven',x:473,y:651,why:'Fog harbor in the northern island group',es:'Puerto de niebla en las islas del norte'},
    {id:'black-harbor',x:479,y:677,why:'Sea caves below Greyhaven',es:'Cuevas marinas bajo Greyhaven'},
    {id:'widows-teeth',x:515,y:657,why:'Sea stacks beyond Greyhaven’s harbor mouth',es:'Farallones ante la bocana de Greyhaven'},
    {id:'saltreach',x:411,y:747,why:'Low western coast and salt pans',es:'Costa baja occidental y salinas'},
    {id:'northreach',x:442,y:721,why:'Horse country and inland moors',es:'Tierras de caballos y páramos interiores'},
    {id:'giants-table',x:457,y:753,why:'High Tarvan moor, on the Giant’s shoulder',es:'Páramo alto tarvan, en el hombro del Gigante'},
    {id:'bastion',x:519,y:815,why:'Eastern fortress-island chain',es:'Cadena oriental de islas fortificadas'},
    {id:'soldiers-rest',x:525,y:794,why:'Springs on the hillside near Bastion',es:'Manantiales en la ladera cercana a Bastion'},
    {id:'stormreach',x:568,y:902,why:'Rock fortress above the southern strait',es:'Fortaleza rocosa sobre el estrecho meridional'},
    {id:'serpents-coil',x:544,y:866,why:'Reef ring in the Stormreach strait',es:'Anillo de arrecifes del estrecho de Stormreach'}
  ];
  const svg = () => `<svg class="frontier-chart-svg" viewBox="250 580 370 390" role="group" aria-label="Detailed Northern Frontier chart with eleven linked locations">
    <image href="assets/northern-frontier-chart.svg?v=4" x="250" y="580" width="370" height="390"/>
    ${sites.map((s,i)=>`<a class="frontier-site" href="#entry/${s.id}" aria-label="${i+1}. ${s.id.replaceAll('-',' ')}" data-map-site="${s.id}"><title>${s.why}</title><circle class="fm-pin-ring" cx="${s.x}" cy="${s.y}" r="6.6"/><circle class="fm-pin" cx="${s.x}" cy="${s.y}" r="4.9"/><text class="fm-pin-number" x="${s.x}" y="${s.y+.2}">${i+1}</text></a>`).join('')}
  </svg>`;
  function render(byId,canRead,t=(en)=>en) {
    const visible=sites.map((s,i)=>({...s,n:i+1,entry:byId[s.id]})).filter(s=>s.entry&&canRead(s.id));
    return `<div class="content-wrap frontier-page">
      <div class="frontier-header"><div><p class="eyebrow">${t('THE WORLD / REGIONAL CHART 01','EL MUNDO / CARTA REGIONAL 01')}</p>
        <h1>Northern <em>Frontier.</em></h1><p>${t('From the first northern harbor to the storm-built southern strait. Explore the terrain and the places along this stretch of coast.','Desde el primer puerto del norte hasta el estrecho de las tormentas. Explora el terreno y los lugares de este tramo de costa.')}</p></div>
        <a class="frontier-back" href="#atlas">← ${t('Full world chart','Mapa completo del mundo')}</a></div>
      <div class="frontier-layout"><div class="frontier-map"><div class="frontier-map-image">${svg()}</div><div class="frontier-map-foot"><span>${t('THE CHARTED ISLES','LAS ISLAS CARTOGRAFIADAS')} · 175 EC</span><span>${t('COASTLINE FROM THE ORIGINAL WORLD MAP','COSTA DEL MAPA ORIGINAL DEL MUNDO')}</span></div></div>
      <aside class="frontier-rail"><p class="eyebrow">${t("THE CARTOGRAPHER'S KEY",'CLAVE DEL CARTÓGRAFO')}</p><h2>${t('Places on this chart','Lugares de esta carta')}</h2>
        <p class="frontier-rail-intro">${t('Select a number on the map or a name here to open its entry.','Selecciona un número en el mapa o un nombre aquí para abrir su entrada.')}</p>
        <ol class="frontier-place-list">${visible.map(s=>`<li><a href="#entry/${s.id}" data-map-list="${s.id}"><span class="frontier-list-num">${String(s.n).padStart(2,'0')}</span><span><strong>${s.entry.title}</strong><small>${t(s.why,s.es)}</small></span><span aria-hidden="true">↗</span></a></li>`).join('')}</ol>
        <div class="frontier-key"><div><span class="frontier-symbol mountain">△</span>${t('High ground','Tierras altas')}</div><div><span class="frontier-symbol stream">⌁</span>${t('Streams','Arroyos')}</div><div><span class="frontier-symbol reef">◌</span>${t('Reefs / shoals','Arrecifes / bajos')}</div><div><span class="frontier-symbol pans">▥</span>${t('Salt pans','Salinas')}</div></div></aside></div>
      <div class="frontier-note"><span class="mono">${t('A WORKING CHART','CARTA EN DESARROLLO')}</span><p>${t("The coast follows the original Kalvatar map. Ironfort's northern anchorage, the west-coast salt pans, the inland Tarvan moors, the Bastion island chain, and the Stormreach strait follow the written geography. Individual pins, ridges, and unnamed streams are proposed placements for this regional draft; they can move as the canon grows.",'La costa sigue el mapa original de Kalvatar. El fondeadero norte de Ironfort, las salinas occidentales, los páramos tarvan del interior, la cadena de Bastion y el estrecho de Stormreach siguen la geografía escrita. La posición precisa de cada marcador, las crestas y los arroyos sin nombre son propuestas de este borrador regional; podrán ajustarse cuando crezca el canon.')}</p><a href="#entry/northern-frontier">${t('Read the Northern Frontier entry','Leer la entrada de Northern Frontier')} ↗</a></div></div>`;
  }
  return {render,sites};
})();
