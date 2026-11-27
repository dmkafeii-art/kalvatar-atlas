/* Coordinates share the 1371 × 2078 grid of the world chart. Only relationships
   described in the atlas are canonical; locations within a shore are approximate. */
window.FrontierMap = (() => {
  const bounds={x:250,y:580,width:370,height:390};
  const sites=[
    {id:'ironfort',x:390,y:611,lx:360,ly:644,anchor:'end',kind:'port',
      en:'Sheltered northern anchorage on the Crown Route',es:'Fondeadero protegido en la Ruta de la Corona'},
    {id:'greyhaven',x:504,y:651,lx:530,ly:637,kind:'port',
      en:'Fishing harbor inside the Widow’s Teeth',es:'Puerto pesquero al abrigo de los Dientes de la Viuda'},
    {id:'widows-teeth',x:518,y:656,lx:543,ly:659,kind:'sea',
      en:'Sea stacks and the Gap of Sorrows outside Greyhaven',es:'Farallones y paso de las Penas ante Puerto Gris'},
    {id:'black-harbor',x:485,y:686,lx:507,ly:684,kind:'port',
      en:'Sea caves on the coast below Greyhaven',es:'Cuevas marinas en la costa al sur de Puerto Gris'},
    {id:'saltreach',x:409,y:746,lx:375,ly:738,anchor:'end',kind:'port',
      en:'Low western shore with salt pans and sluices',es:'Costa baja occidental con salinas y esclusas'},
    {id:'northreach',x:433,y:723,lx:408,ly:695,anchor:'end',kind:'land',
      en:'Horse country and open inland heath',es:'Criaderos de caballos y brezales abiertos del interior'},
    {id:'giants-table',x:455,y:753,lx:466,ly:769,kind:'land',
      en:'High shoulder of the Tarvan moor above the lake',es:'Loma alta del páramo tarvan, por encima del lago'},
    {id:'soldiers-rest',x:528,y:796,lx:549,ly:780,kind:'land',lines:[['Soldiers’','Rest'],['El Descanso de','los Soldados']],
      en:'Terraced mineral springs near Bastion',es:'Manantiales minerales en terrazas cerca de Bastión'},
    {id:'bastion',x:516,y:815,lx:555,ly:817,kind:'port',
      en:'Fortress island on the eastern sea-road',es:'Isla fortificada en la ruta marítima oriental'},
    {id:'serpents-coil',x:542,y:866,lx:516,ly:872,anchor:'end',kind:'sea',
      en:'Reef ring in the strait below the fortress',es:'Anillo de arrecifes en el estrecho bajo la fortaleza'},
    {id:'stormreach',x:536,y:879,lx:606,ly:930,anchor:'end',kind:'port',
      en:'Fortress rock at the entrance to the shipyards',es:'Fortaleza sobre la roca a la entrada de los astilleros'}
  ];
  const regions=[
    {id:'north',x:451,y:646,en:'Northern harbors',es:'Puertos del norte'},
    {id:'moors',x:459,y:751,en:'Tarvan moors',es:'Páramos tarvan'},
    {id:'strait',x:529,y:852,en:'Eastern islands and strait',es:'Islas orientales y estrecho'}
  ];
  const labels=[
    [292,608,'CROWN ROUTE','RUTA DE LA CORONA'],
    [292,618,'toward Assios','hacia Assios',true],
    [289,692,'NORTHERN WATERS','AGUAS DEL NORTE'],
    [562,721,'EASTERN SEA-ROAD','RUTA MARÍTIMA ORIENTAL'],
    [563,737,'Bastion Holds','Dominios de Bastión',true],
    [305,893,'WESTERN WATERS','AGUAS OCCIDENTALES'],
    [481,912,'Stormreach Strait','Estrecho de Confín de Tormentas',true]
  ];
  const key=[
    ['upland','Ridges','Cordilleras'],['wood','Pine forest','Pinares'],
    ['heath','Heath and moors','Brezales y páramos'],['water','Rivers and streams','Ríos y arroyos'],
    ['pans','Salt pans','Salinas'],['reef','Reefs and stacks','Arrecifes y farallones'],
    ['route','Sea routes','Rutas marítimas'],['bridge','Causeways','Calzadas']
  ];
  const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const viewBox=`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`;

  function mapSvg(visible,t) {
    return `<svg class="frontier-chart-svg" viewBox="${viewBox}" role="group" aria-label="${t('Northern Frontier map','Mapa de la Frontera del Norte')}">
      <image href="assets/northern-frontier-chart.svg?v=5" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}"/>
      <g class="fm-water-names" aria-hidden="true">${labels.map(([x,y,en,es,secondary])=>`<text x="${x}" y="${y}"${secondary?' class="fm-water-secondary"':''}>${t(en,es)}</text>`).join('')}</g>
      ${visible.map(({id,x,y,lx,ly,anchor='start',kind,lines,entry})=>{
        const title=escape(entry.title);
        const leaderX=anchor==='end'?lx+3:lx-3;
        const label=lines?t(...lines).map((line,i)=>`<tspan x="${lx}" dy="${i?6.3:0}">${line}</tspan>`).join(''):title;
        return `<a class="frontier-site fm-${kind}" href="#entry/${id}" aria-label="${title}" data-map-site="${id}">
          <title>${title}</title><path class="fm-leader" d="M${x} ${y}L${leaderX} ${ly-1.5}"/>
          <circle class="fm-hit" cx="${x}" cy="${y}" r="8.5"/><circle class="fm-pin" cx="${x}" cy="${y}" r="${kind==='port'?2.6:2}"/>
          <text class="fm-label" x="${lx}" y="${ly}" text-anchor="${anchor}">${label}</text>
        </a>`;
      }).join('')}
    </svg>`;
  }

  function render(byId,canRead,t=(en)=>en) {
    const visible=sites.flatMap(site=>byId[site.id]&&canRead(site.id)?[{...site,entry:byId[site.id]}]:[]);
    return `<div class="content-wrap frontier-page">
      <header class="frontier-header">
        <div><h1>${t('Northern Frontier','Frontera del Norte')}</h1><p>${t('Follow the Crown Route from Ironfort, cross the Tarvan moors and find the reef-ring below Stormreach.','Sigue la Ruta de la Corona desde Fuerte de Hierro, cruza los páramos tarvan y encuentra el anillo de arrecifes bajo Confín de Tormentas.')}</p></div>
        <a class="frontier-back" href="#atlas/northern-frontier">${t('World map','Mapa mundial')}</a>
      </header>
      <div class="frontier-map">
        <div class="frontier-toolbar" role="group" aria-label="${t('Map controls','Controles del mapa')}">
          <div class="frontier-jumps">${regions.map(({id,en,es})=>`<button type="button" data-frontier-area="${id}" aria-pressed="false">${t(en,es)}</button>`).join('')}</div>
          <div class="frontier-zoom">
            <button type="button" data-frontier-zoom="out" aria-label="${t('Zoom out','Alejar')}">−</button>
            <button type="button" data-frontier-zoom="reset">${t('Full view','Vista completa')}</button>
            <button type="button" data-frontier-zoom="in" aria-label="${t('Zoom in','Acercar')}">+</button>
            <output class="frontier-scale" aria-live="polite">100%</output>
          </div>
        </div>
        <div class="frontier-map-image" tabindex="0" role="region" aria-label="${t('Interactive chart. Scroll within the map when zoomed.','Carta interactiva. Desplázate dentro del mapa cuando esté ampliado.')}">${mapSvg(visible,t)}</div>
        <div class="frontier-key" aria-label="${t('Map legend','Leyenda del mapa')}">${key.map(([symbol,en,es])=>`<span><i class="frontier-symbol ${symbol}" aria-hidden="true"></i>${t(en,es)}</span>`).join('')}</div>
      </div>
      <section class="frontier-rail" aria-labelledby="frontier-places">
        <h2 id="frontier-places">${t('Places on the chart','Lugares de la carta')}</h2>
        <ul class="frontier-place-list">${visible.map(({id,kind,entry,en,es})=>`<li><a href="#entry/${id}" data-map-list="${id}"><i class="frontier-place-dot fm-${kind}" aria-hidden="true"></i><span><strong>${escape(entry.title)}</strong><small>${t(en,es)}</small></span></a></li>`).join('')}</ul>
      </section>
      <div class="frontier-note"><p>${t('Coastline from the world map. The atlas establishes how the places relate. Exact positions, ridgelines and unnamed waterways are cartographic interpretations.','La costa sigue el mapa mundial. El Atlas establece la relación entre los lugares. Las posiciones exactas, las crestas y los cauces sin nombre son interpretaciones cartográficas.')}</p><a href="#entry/northern-frontier">${t('Read the region entry','Leer la entrada de la región')}</a></div>
    </div>`;
  }

  function mount(root) {
    const viewport=root.querySelector('.frontier-map-image');
    const chart=root.querySelector('.frontier-chart-svg');
    const scale=root.querySelector('.frontier-scale');
    const buttons=Object.fromEntries([...root.querySelectorAll('[data-frontier-zoom]')].map(button=>[button.dataset.frontierZoom,button]));
    const jumps=[...root.querySelectorAll('[data-frontier-area]')];
    let zoom=1;

    function setZoom(next,center) {
      const before=chart.getBoundingClientRect();
      const x=center?(center.x-bounds.x)/bounds.width:(viewport.scrollLeft+viewport.clientWidth/2)/before.width;
      const y=center?(center.y-bounds.y)/bounds.height:(viewport.scrollTop+viewport.clientHeight/2)/before.height;
      zoom=Math.max(1,Math.min(3,next));
      viewport.classList.toggle('is-zoomed',zoom>1);
      chart.style.width=`${zoom*100}%`;
      viewport.scrollLeft=x*chart.clientWidth-viewport.clientWidth/2;
      viewport.scrollTop=y*chart.clientHeight-viewport.clientHeight/2;
      scale.value=`${Math.round(zoom*100)}%`;
      buttons.out.disabled=zoom===1;
      buttons.in.disabled=zoom===3;
      for(const button of jumps)button.setAttribute('aria-pressed',String(button.dataset.frontierArea===center?.id));
    }

    buttons.out.addEventListener('click',()=>setZoom(zoom-.5));
    buttons.in.addEventListener('click',()=>setZoom(zoom+.5));
    buttons.reset.addEventListener('click',()=>setZoom(1));
    for(const button of jumps)button.addEventListener('click',()=>{
      const region=regions.find(region=>region.id===button.dataset.frontierArea);
      setZoom(2,region);
    });
    for(const site of sites) {
      const mark=root.querySelector(`[data-map-site="${site.id}"]`);
      const row=root.querySelector(`[data-map-list="${site.id}"]`);
      if(!mark||!row)continue;
      for(const [source,target] of [[mark,row],[row,mark]]) {
        source.addEventListener('mouseenter',()=>target.classList.add('is-related'));
        source.addEventListener('mouseleave',()=>target.classList.remove('is-related'));
        source.addEventListener('focus',()=>target.classList.add('is-related'));
        source.addEventListener('blur',()=>target.classList.remove('is-related'));
      }
    }
    setZoom(1);
  }
  return {render,mount,sites};
})();
