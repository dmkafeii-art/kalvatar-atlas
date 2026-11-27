/* Coordinates share the 1371 × 2078 grid of the world chart. Only relationships
   described in the atlas are canonical; locations within a shore are approximate. */
window.AtlasCharts = (() => {
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
  const frontier = {
    id:'northern-frontier',
    bounds, sites, regions, labels, key,
    image:'assets/northern-frontier-chart.svg?v=6',
    intro:['Follow the Crown Route from Ironfort, cross the Tarvan moors and find the reef-ring below Stormreach.','Sigue la Ruta de la Corona desde Fuerte de Hierro, cruza los páramos tarvan y encuentra el anillo de arrecifes bajo Confín de Tormentas.'],
    note:['The coast follows the world map. Precise placements, ridgelines and unnamed waterways are interpretations of the Atlas geography.','La costa sigue el mapa mundial. Las posiciones exactas, las crestas y los cauces sin nombre son interpretaciones de la geografía del Atlas.']
  };
  const city = {
    id:'goldwind',
    bounds:{x:0,y:0,width:1000,height:813}, unit:2.65,
    image:'assets/ventoro-city-chart-v3.webp',
    overlay:{image:'assets/ventoro-beacon-temple.webp',viewBox:'0 0 1391 1131',x:921,y:640,width:470,height:375},
    intro:['Two lighthouses mark the entrance to the C-shaped gulf: Tholmar’s great light on the Commons’ point, and the Sentinel, half its height, across the mouth. Below the cliffs, the Commons crowds around its waterways, and the city climbs from the three harbors to the Vol Kaern heights.','Dos faros marcan la entrada del golfo en forma de C: el gran faro de Tholmar, en la punta del Común, y el Centinela, de la mitad de su altura, al otro lado de la boca. Al pie de los riscos, el Común se apiña alrededor de sus canales y la ciudad sube desde los tres puertos hasta las alturas de Vol Kaern.'],
    note:['The harbors, districts and landmarks follow their relationships in the Atlas. Street alignments, blocks and individual footprints are proposed placements.','La relación entre los puertos, barrios y lugares sigue el Atlas. El trazado exacto de las calles, las manzanas y los edificios es una propuesta cartográfica.'],
    regions:[
      {id:'commons',x:185,y:536,en:'The Commons',es:'El Común'},
      {id:'canals',x:278,y:638,en:'The Canals',es:'Los Canales'},
      {id:'rings',x:250,y:216,en:'Upper rings',es:'Anillos altos'},
      {id:'harbors',x:425,y:364,en:'Harbors and quays',es:'Puertos y muelles'}
    ],
    labels:[
      [714,391,'GOLDWIND GULF','GOLFO DE VENTORO']
    ],
    key:[
      ['city-landmark','Landmarks','Edificios y lugares'],['city-lighthouse','Lighthouses','Faros'],
      ['upland','Cliffs and slopes','Riscos y laderas'],['water','Waterways','Cursos de agua']
    ],
    sites:[
      {id:'the-commons',x:128,y:503,lx:33,ly:493,kind:'area',primary:true,en:'Seven densely built wards around the Lower Harbor',es:'Siete barrios de calles enmarañadas alrededor del Puerto Bajo'},
      {id:'lower-harbor',x:409,y:521,lx:472,ly:521,kind:'port',en:'The Commons’ working harbor',es:'El puerto de trabajo del Común'},
      {id:'the-canals',x:278,y:614,lx:310,ly:643,kind:'land',primary:true,en:'An extensive maze of waterways, bridges and doors opening onto the water',es:'Una extensa red de canales, puentes y casas con puertas al agua'},
      {id:'gullmarket',x:222,y:474,lx:242,ly:509,kind:'land',lines:[['Gullmarket'],['Mercado de','las Gaviotas']],en:'Market stalls serving the Commons',es:'Puestos del mercado del Común'},
      {id:'sovereign-harbor',target:'goldwind',district:['The Sovereign Harbor', 'El Puerto Soberano'],x:368,y:361,lx:427,ly:366,kind:'port',lines:[['Sovereign','Harbor'],['Puerto','Soberano']],en:'Merchant fleets, customs and the Turning',es:'Flotas mercantes, aduana y paseo de la Vuelta'},
      {id:'sentinel-docks',target:'goldwind',district:['The Sentinel Docks', 'Los Muelles del Centinela'],x:595,y:175,lx:620,ly:225,kind:'port',lines:[['Sentinel','Docks'],['Muelles del','Centinela']],en:'Shipyards under the Sentinel light',es:'Astilleros bajo el faro del Centinela'},
      {id:'tholmar-light',target:'lighthouses',names:['The Sentinel','El Centinela'],x:845,y:148,lx:874,ly:114,kind:'lighthouse',primary:true,lines:[['The','Sentinel'],['El','Centinela']],en:'The lesser light at the mouth of the gulf, over the Sentinel Docks',es:'El faro menor de la boca del golfo, sobre los Muelles del Centinela'},
      {id:'outer-point-light',target:'lighthouses',names:['Tholmar’s Lighthouse','Faro de Tholmar'],x:841,y:564,lx:887,ly:526,kind:'lighthouse',primary:true,lines:[['Tholmar’s','Lighthouse'],['Faro de','Tholmar']],en:'The great lighthouse and temple of Tholmar, on the Commons’ point',es:'El gran faro y templo de Tholmar, en la punta del Común'},
      {id:'old-quarter',target:'goldwind',district:['The old quarter', 'El barrio viejo'],x:198,y:370,lx:44,ly:366,kind:'area',en:'Theaters and crooked streets above the wharves',es:'Teatros y calles sinuosas sobre los muelles'},
      {id:'banking-quarter',target:'goldwind',district:['The banking quarter', 'El barrio de la banca'],x:280,y:320,lx:408,ly:305,kind:'area',lines:[['Banking','quarter'],['Barrio de','la banca']],en:'The Reckoners’ Hall, the Mint and the Exchange',es:'La Casa de los Tesoreros, la Ceca y la Bolsa'},
      {id:'university',x:240,y:231,lx:57,ly:235,kind:'area',lines:[['University'],['Universidad']],en:'The University and its schools in the scholar-quarter',es:'La Universidad y sus escuelas en el barrio académico'},
      {id:'council',x:284,y:187,lx:321,ly:158,kind:'area',lines:[['Council ring'],['Anillo del Consejo']],en:'The white halls above the University',es:'Las salas blancas por encima de la Universidad'},
      {id:'vol-kaern-heights',target:'goldwind',district:['The Vol Kaern Heights', 'Las Alturas de Vol Kaern'],x:192,y:96,lx:48,ly:63,kind:'area',en:'The castle at the crown of the city',es:'El castillo que corona la ciudad'},
      {id:'hunters-citadel',x:409,y:115,lx:547,ly:76,anchor:'end',kind:'area',lines:[['Hunter’s Citadel'],['Ciudadela de los','Cazadores']],en:'The Hunters’ fortress beside the cataract',es:'La fortaleza de los Cazadores junto a la catarata'},
      {id:'heartland-bazaar',target:'goldwind',district:['The Great Heartland Bazaar', 'El Gran Bazar del Corazón'],x:323,y:449,lx:438,ly:447,anchor:'middle',kind:'land',lines:[['Great Heartland','Bazaar'],['Gran Bazar','del Corazón']],en:'Food and merchandise below the rings',es:'Comida y mercancías al pie de los anillos'}
    ]
  };
  const charts={'northern-frontier':frontier,goldwind:city};
  const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));


  function mapSvg({bounds,image,overlay,labels,unit=1},visible,title,t) {
    const viewBox=`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`;
    const u=value=>value*unit;
    return `<svg class="frontier-chart-svg" viewBox="${viewBox}" style="--chart-unit:${unit}" role="group" aria-label="${title}">
      <image href="${image}" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}"/>
      ${overlay?`<svg viewBox="${overlay.viewBox}" width="${bounds.width}" height="${bounds.height}" aria-hidden="true" pointer-events="none">
        <image href="${overlay.image}" x="${overlay.x}" y="${overlay.y}" width="${overlay.width}" height="${overlay.height}"/>
      </svg>`:''}
      <g class="fm-water-names" aria-hidden="true">${labels.map(([x,y,en,es,secondary])=>`<text x="${x}" y="${y}"${secondary?' class="fm-water-secondary"':''}>${t(en,es)}</text>`).join('')}</g>
      ${visible.map(({id,x,y,lx,ly,anchor='start',kind,lines,name,href,primary})=>{
        const leaderX=anchor==='end'?lx+u(3):anchor==='middle'?lx:lx-u(3);
        const label=lines?t(...lines).map((line,i)=>`<tspan x="${lx}" dy="${i?u(6.3):0}">${escape(line)}</tspan>`).join(''):name;
        return `<a class="frontier-site fm-${kind}${primary?' fm-primary':''}" href="${href}" aria-label="${name}" data-map-site="${id}">
          <title>${name}</title><path class="fm-leader" d="M${x} ${y}L${leaderX} ${ly-u(1.5)}"/>
          <circle class="fm-hit" cx="${x}" cy="${y}" r="${u(8.5)}"/><circle class="fm-pin" cx="${x}" cy="${y}" r="${u(kind==='port'?2.6:2)}"/>
          <text class="fm-label" x="${lx}" y="${ly}" text-anchor="${anchor}">${label}</text>
        </a>`;
      }).join('')}
    </svg>`;
  }

  function cityParts(entry) {
    return entry.sections.find(section=>['The parts of the city','Las partes de la ciudad'].includes(section.title));
  }

  function cityDistrictIndex(section,site) {
    return section?.table?.rows.findIndex(row=>site?.district?.includes(row[0]))??-1;
  }

  function chartFor(entryId,canRead) {
    return Object.values(charts).find(chart=>canRead(chart.id)&&(chart.id===entryId||
      chart.sites.some(site=>!site.target&&site.id===entryId)));
  }

  function render(chart,byId,canRead,t=(en)=>en) {
    const {id,regions,key,intro,note}=chart;
    const title=escape(byId[id].title);
    const parts=id==='goldwind'?cityParts(byId[id]):null;
    const visible=chart.sites.flatMap(site=>{
      const target=site.target||site.id;
      if(!byId[target]||!canRead(target))return [];
      const row=parts?.table?.rows[cityDistrictIndex(parts,site)];
      const href=site.district?`#entry/${target}/parts-of-the-city/${site.id}`:`#entry/${target}`;
      const name=row?.[0]||(site.names?t(...site.names):site.district?t(...site.district):byId[target].title);
      return [{...site,name:escape(name),href}];
    });
    const parent=id==='goldwind'?'heartland':id;
    return `<div class="content-wrap frontier-page chart-${id}">
      <header class="frontier-header">
        <div><h1>${title}</h1><p>${t(...intro)}</p></div>
        <a class="frontier-back" href="#atlas/${parent}">${id==='goldwind'?t('Central Heartland on the world map','Corazón Central en el mapa mundial'):t('World map','Mapa mundial')}</a>
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
        <div class="frontier-map-image" tabindex="0" role="region" aria-label="${t('Interactive chart. Scroll within the map when zoomed.','Carta interactiva. Desplázate dentro del mapa cuando esté ampliado.')}">${mapSvg(chart,visible,title,t)}</div>
        <div class="frontier-key" aria-label="${t('Map legend','Leyenda del mapa')}">${key.map(([symbol,en,es])=>`<span><i class="frontier-symbol ${symbol}" aria-hidden="true"></i>${t(en,es)}</span>`).join('')}</div>
      </div>
      <section class="frontier-rail" aria-labelledby="frontier-places">
        <h2 id="frontier-places">${t('Places on the chart','Lugares de la carta')}</h2>
        <ul class="frontier-place-list">${visible.map(({id,kind,name,href,en,es})=>`<li><a href="${href}" data-map-list="${id}"><i class="frontier-place-dot fm-${kind}" aria-hidden="true"></i><span><strong>${name}</strong><small>${t(en,es)}</small></span></a></li>`).join('')}</ul>
      </section>
      <div class="frontier-note"><p>${t(...note)}</p><a href="#entry/${id}">${id==='goldwind'?t('Read the city entry','Leer la entrada de la ciudad'):t('Read the region entry','Leer la entrada de la región')}</a></div>
    </div>`;
  }

  function mount(root,config) {
    const {bounds,regions,sites}=config;
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
  return {render,mount,charts,chartFor,cityParts,cityDistrictIndex};
})();
