'use strict';
const $ = s => document.querySelector(s);
const categories={place:{name:'Places',short:'Place',description:'From the northern strait to the far ice. Ports, regions, and wonders worth a voyage.',icon:'map'},people:{name:'Peoples',short:'People',description:'The many lives of the archipelago, and the customs that make each people their own.',icon:'leaf'},creature:{name:'Beasts & companions',short:'Creature',description:'Small lives that travel beside you, and great beasts that carry the load.',icon:'paw'},culture:{name:'Life & lore',short:'Life & lore',description:'The things islanders know: moons, money, magic, promises, and a place by the fire.',icon:'moon'},power:{name:'Powers & factions',short:'Power',description:'The institutions, guilds, and living powers whose influence crosses the water.',icon:'shield'}};

Object.assign(categories,{
 trade:{name:'Trade & wages',short:'Trade',description:"What a day's work is worth, and what every shore makes, sells, and needs.",icon:'compass'},
 gods:{name:'Gods & powers',short:'God',description:'The gods islanders name, honor, and argue with.',icon:'moon'},
 houses:{name:'Noble houses',short:'House',description:'Names, banners, and the obligations that travel with them.',icon:'shield'},
 'savage-lords':{name:'Savage Lords',short:'Savage Lord',description:'The great living powers of the wild world.',icon:'paw'},
 foes:{name:'Foes',short:'Foe',description:'Warbands, raiding tribes, and the old powers they serve.',icon:'shield'},
 outlaws:{name:'Outlaws',short:'Outlaw',description:'Free sails, wanted names, and lives beyond the Charter.',icon:'compass'},
 folk:{name:'Notable folk',short:'Notable person',description:'The people whose names travel farther than their ships.',icon:'leaf'},
 history:{name:'History',short:'History',description:'The past as an islander learns it, from the old stories to 175 EC.',icon:'map'}
});
const paths={map:'<path d="m13 14 14-5 14 5 14-5v38l-14 5-14-5-14 5Zm14-5v38m14-33v38"/><path d="m18 24 5-2m10 8 5 2m8 7 5-2"/>',leaf:'<path d="M32 53V29M31 42C11 41 11 20 11 20s23 0 20 22Zm2-8C52 33 53 10 53 10S31 13 33 34Z"/><path d="m16 26 15 16m16-25-14 17"/>',paw:'<ellipse cx="32" cy="42" rx="15" ry="11"/><ellipse cx="15" cy="24" rx="6" ry="8" transform="rotate(-23 15 24)"/><ellipse cx="28" cy="17" rx="5" ry="8"/><ellipse cx="42" cy="19" rx="5" ry="8" transform="rotate(18 42 19)"/><ellipse cx="52" cy="30" rx="5" ry="7" transform="rotate(33 52 30)"/>',moon:'<path d="M44 10A23 23 0 1 0 54 46 23 23 0 0 1 44 10Z"/><path d="m48 17 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><circle cx="20" cy="47" r="2"/>',shield:'<path d="m32 7 21 8v17c0 14-21 25-21 25S11 46 11 32V15Z"/><path d="M32 15v32M20 28h24m-18-6 6-7 6 7m-12 18 6 7 6-7"/>',compass:'<circle cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="19" stroke-dasharray="1 5"/><path d="m32 4 5 23 23 5-23 5-5 23-5-23-23-5 23-5Z"/>',wing:'<path d="M32 52V27C23 12 8 10 8 10s-1 25 24 29C57 35 56 10 56 10S41 12 32 27Z"/><path d="m14 18 18 16 18-16M17 29l15 10 15-10M26 51h12"/>',flower:'<path d="M32 54V33m0 13c-12 0-15-9-15-9s12-2 15 9Zm0-6c11 0 15-10 15-10S34 28 32 40Z"/><path d="M32 29C12 39 9 21 23 19 10 7 29 1 32 15 39 1 55 10 42 20 57 23 49 39 32 29Z"/><circle cx="32" cy="23" r="5"/>',lampet:'<path d="M13 43c-4-14 1-29 15-31 18-3 24 10 20 22 11 0 9 9-1 10-9 12-28 12-34-1Z"/><path d="m15 36-8-1m8 5-9 2m40-6 9-1m-9 5 10 2M24 47l-7 5m21-5 8 5"/><circle cx="24" cy="26" r="2"/><circle cx="39" cy="26" r="2"/><path d="m28 34 4 3 4-3m-4 3v4"/><path d="m31 10 3 5-3 5-3-5Z"/>'};
paths.book='<path d="M7 12c10-4 18-3 25 2 7-5 15-6 25-2v40c-10-4-18-3-25 2-7-5-15-6-25-2Zm25 2v40"/>' ;
function icon(name,cls=''){return `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true">${paths[name]||paths.compass}</svg>`}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const storageKey='kalvatar-reading-list-v1';
let rumors=[],timeline=[],entries=[],byId={},saved=new Set(),readingStorage=true,toastTimer,limit=18,currentCategory='all',directoryQuery='',directorySort='az',directoryKind='',directoryRegion='',mapZoom=1,mapX=0,mapY=0,mapMove=false;
try{const data=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(data))saved=new Set(data.filter(x=>typeof x==='string'))}catch(e){readingStorage=false}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3800)}
function updateSavedCount(){$('#saved-count').textContent=saved.size}
function saveList(){try{localStorage.setItem(storageKey,JSON.stringify([...saved]));readingStorage=true}catch(e){readingStorage=false}updateSavedCount()}
function setNavigation(active){document.querySelectorAll('[data-nav]').forEach(a=>{const yes=a.dataset.nav===active;a.classList.toggle('active',yes);if(yes)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}

function visibleCategories(){return Object.entries(categories).filter(([id])=>entries.some(e=>e.category===id))}
function renderMainNavigation(){
 const item=(id,href,label,glyph,count)=>`<a href="${href}" data-nav="${id}"><span class="nav-icon">${icon(glyph)}</span>${label}${count===undefined?'':`<span class="nav-count" id="${id}-count">${count}</span>`}</a>`;
 $('#main-nav').innerHTML=item('home','#','The threshold','compass')+item('atlas','#atlas','World atlas','map')+item('library','#library',Pack2.text('Library','Biblioteca'),'book',window.AtlasLibrary?.count||0)+item('adventurers','#adventurers',Pack2.text('Adventurers','Aventureros'),'shield')+item('all','#browse','All entries','map',entries.length)+'<div class="nav-divider"></div>'+visibleCategories().map(([id,c])=>item(id,'#category/'+id,esc(c.name),c.icon,entries.filter(e=>e.category===id).length)).join('')+'<div class="nav-divider"></div>'+(rumors.length?item('rumors','#rumors','Rumors','moon',rumors.length):'')+(timeline.length?item('timeline','#timeline','Timeline','map',timeline.length):'')+item('saved','#saved','Reading list','leaf',saved.size);
}

function closeMenu(){$('#sidebar').classList.remove('open');$('#mobile-backdrop').classList.remove('visible');$('#menu-toggle').setAttribute('aria-expanded','false')}
function mapSvg(uid){return `<svg viewBox="0 0 1371 2078" preserveAspectRatio="none" role="img" aria-label="The original Kalvatar world chart: Assios to the north, the Northern Frontier, Central Heartland, Southern Wilds, and Icy Expanse to the south."><defs><filter id="land-${uid}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feFlood flood-color="#1c465e"/><feBlend in2="SourceGraphic" mode="difference"/><feColorMatrix type="matrix" values="0 0 0 0 .72 0 0 0 0 .73 0 0 0 0 .55 4 4 4 0 -.4"/></filter></defs><image href="assets/world-chart-ink.webp" width="1371" height="2078"/></svg>`}
function articleCard(e,illustrated=false){
 if(!e)return '';if(!Pack2.canRead(e.id))return Pack2.lockedCard();
 const glyph=e.id==='aethyn'?'wing':e.id==='lampet'?'lampet':e.id==='florians'?'flower':categories[e.category].icon;
 const art=e.illustration;
 const visual=art?`<div class="entry-illustration has-art"><img src="${esc(art.thumb)}" alt="" loading="lazy" decoding="async" width="480" height="320"></div>`:illustrated?`<div class="entry-illustration ${e.category}">${icon(glyph)}<span class="mono">FIELD NOTES / ${esc(e.region.toUpperCase())}</span></div>`:'';
 return `<a class="entry-card" href="#entry/${e.id}">${visual}<div class="entry-card-copy"><span class="entry-type">${e.creatureKind?(e.creatureKind==='working'?'Working beast':e.creatureKind==='companion'?'Companion':'Saurian'):categories[e.category].short}</span><h3>${esc(e.title)} ${Pack2.newBadge(e.id)}</h3>${e.saurianParent?`<span class="entry-native">${esc(e.aliases?.[0]||e.subtitle.split(' · ')[0])}</span>`:''}<p>${esc(e.summary)}</p><div class="entry-card-bottom"><span>${esc(e.region)}</span><span aria-hidden="true">↗</span></div></div></a>`;
}
function articleImages(e){return [e.illustration,...(e.gallery||[])].filter(Boolean)}
function articleArtFigure(e,a,index,showLabel=false,leading=false){
 const sizes='(max-width: 720px) calc(100vw - 36px), (max-width: 1180px) calc(100vw - 260px), 1100px';
 const label=esc(a.label||e.title);
 const openLabel=Pack2.text('Enlarge illustration of','Ampliar ilustración de');
 const hint=Pack2.text('View illustration ⤢','Ver ilustración ⤢');
 const captionAction=leading?`<button class="article-art-enlarge" type="button" data-open-art="${e.id}" data-art-index="${index}">${Pack2.text('Enlarge illustration','Ampliar ilustración')}</button>`:'';
 return `<figure class="article-art${a.kind==='plate'?' field-guide-plate':''}"><button class="article-art-open" data-open-art="${e.id}" data-art-index="${index}" aria-label="${openLabel} ${label}"><img style="aspect-ratio:${Number(a.width)}/${Number(a.height)}" src="${esc(a.src)}" srcset="${esc(a.thumb)} 480w, ${esc(a.src)} 960w, ${esc(a.full)} ${a.width}w" sizes="${sizes}" width="${a.width}" height="${a.height}" alt="${esc(a.alt)}" decoding="async" ${index===0?'fetchpriority="high"':'loading="lazy"'}>${leading?'':`<span class="art-open-hint" aria-hidden="true">${hint}</span>`}</button><figcaption>${showLabel?`<strong>${label}</strong><br>`:''}${esc(a.caption)}${captionAction}</figcaption></figure>`;
}
function articleArtwork(e){
 const placements=artSectionsByEntry.get(e.id);
 const sections=new Map(), gallery=[], plates=[];
 let main='', cover;
 const seen=new Set();
 for(const [index,a] of articleImages(e).entries()){
  if(seen.has(a.full))continue;
  seen.add(a.full);
  if(!main&&a.kind!=='plate'){
   main=articleArtFigure(e,a,index,false,true);
   cover={src:a.thumb,index};
   continue;
  }
  const filename=a.full.split('/').pop().replace(/-1536\.webp$/,'');
  const section=placements?.get(filename);
  // Translated sections follow the source order. Match an unchanged title first.
  let sectionIndex=section?e.sections.findIndex(s=>s.title===section.title):-1;
  if(sectionIndex===-1&&section&&e._translated){
   const translated=e.sections[section.index];
   if(translated&&!['Rumors','Rumores'].includes(translated.title))sectionIndex=section.index;
  }
  if(sectionIndex>=0){
   const figure=articleArtFigure(e,a,index,true);
   sections.set(sectionIndex,(sections.get(sectionIndex)||'')+figure);
  }else{
   (a.kind==='plate'?plates:gallery).push({a,index});
  }
 }
 return {main,cover,sections,gallery,plates};
}
function articleGallery(e,photos){
 if(!photos.length)return '';
 const goldwind=e.id==='goldwind';
 const eyebrow=goldwind?Pack2.text('SCENES FROM THE CITY','ESCENAS DE LA CIUDAD'):Pack2.text('THE ILLUSTRATED ATLAS','EL ATLAS ILUSTRADO');
 const heading=goldwind?Pack2.text('Everyday Goldwind.','La vida en Goldwind.'):Pack2.text('In pictures.','En imágenes.');
 const intro=goldwind?Pack2.text('Beyond the Council halls and the harbor fortunes, the lower streets have their own stories.','Más allá del Consejo y las fortunas del puerto, las calles bajas tienen sus propias historias.'):Pack2.text('A closer look at the places, people, and stories of this entry.','Una mirada más cercana a los lugares, personajes e historias de esta entrada.');
 return `<section id="article-gallery" class="atlas-photo-gallery" aria-label="${esc(Pack2.text(`Illustrations of ${e.title}`,`Ilustraciones de ${e.title}`))}"><div class="section-title"><div><p class="eyebrow">${eyebrow}</p><h2>${heading}</h2></div></div><p class="atlas-gallery-intro">${intro}</p><div class="atlas-gallery-grid">${photos.map(({a,index})=>articleArtFigure(e,a,index,true)).join('')}</div></section>`;
}
function articleFieldPlates(e,plates){
 if(!plates.length)return '';
 return `<section id="article-plates" class="field-guide-gallery" aria-labelledby="field-guide-title"><div class="section-title"><div><p class="eyebrow">THE NATURALIST’S NOTES</p><h2 id="field-guide-title">In the field guide.</h2></div></div>${plates.map(({a,index})=>articleArtFigure(e,a,index)).join('')}</section>`;
}
function openIllustration(id,index=0){
 const e=byId[id],a=e?articleImages(e)[index]:null;if(!a||!Pack2.canRead(id))return;
 $('#illustration-kicker').textContent=a.kind==='plate'?'THE FIELD GUIDE OF KALVATAR':categories[e.category].name.toUpperCase()+' OF KALVATAR';$('#illustration-title').textContent=a.label||e.title;$('#illustration-image').src=a.full;$('#illustration-image').alt=a.alt;$('#illustration-caption').textContent=a.caption;$('#illustration-original').href=a.full;
 if(!$('#illustration-dialog').open)$('#illustration-dialog').showModal();
}
function articleCollection(e){
 if(!e.children?.length)return '';
 if(e.category==='foes'){
  const heading=e.id==='gnoll-warbands'?'The Warbands':'The Tribes';
  return `<section class="section" aria-labelledby="foe-collection-title"><div class="section-title"><div><p class="eyebrow">FOES OF KALVATAR</p><h2 id="foe-collection-title">${heading}</h2></div></div><div class="entry-grid">${e.children.map(id=>articleCard(byId[id])).join('')}</div></section>`;
 }
 return `<section class="saurian-catalogue" aria-labelledby="saurian-catalogue-title"><div class="section-title"><div><p class="eyebrow">THE FIELD GUIDE / THE LIVING SOUTH</p><h2 id="saurian-catalogue-title">Seventeen kinds.<br><em>A living south.</em></h2></div></div><p class="section-deck">From the household courtyard to the open sky. Meet each kind by its Common and Kalvatari names.</p><div class="entry-grid saurian-grid">${e.children.map(id=>articleCard(byId[id],true)).join('')}</div></section>`;
}
function atlasOrnament(){
 return '<div class="atlas-ornament" aria-hidden="true"><span>✦</span><span>✦</span><span>✦</span></div>';
}
function renderHome(){
 setNavigation('home');$('#breadcrumb').innerHTML='The world <span>/</span> An explorer’s guide';
 $('#content').innerHTML=`<div class="content-wrap home-wrap">
 <div class="edition-line"><span>THE CHARTED ISLES</span><span class="edition-star" aria-hidden="true">✦</span><span>AN ORIGINAL WORLD BY KAFEII</span></div>
 <button class="home-atlas-search" type="button"><span aria-hidden="true">⌕</span> ${Pack2.text('Search the Atlas','Buscar en el Atlas')}</button>
 <section class="hero hero-port" aria-labelledby="hero-heading">
  <img class="hero-scene" src="assets/scenes/harbor-v1-1536.webp" srcset="assets/scenes/harbor-v1-960.webp 960w, assets/scenes/harbor-v1-1536.webp 1536w" sizes="(max-width:720px) 100vw, calc(100vw - 280px)" width="1536" height="1024" alt="A sunlit island harbor: barefoot travelers in flowing clothes, market awnings, and cream-sailed ships on turquoise water." fetchpriority="high" decoding="async">
  <div class="hero-copy"><p class="eyebrow"><span class="star" aria-hidden="true">✦</span> A WORLD BETWEEN SALT AND STARS</p><h1 id="hero-heading">Every island<br>has <em>a story.</em></h1><p class="hero-description">A sail on the horizon. A stranger at the tea table. A small light waiting on the dock.<br>Find your way into Kalvatar.</p><div class="hero-actions"><a class="button cream" href="#atlas">Unfold the atlas <span aria-hidden="true">↗</span></a><button class="text-link" data-random>Follow a thread <span aria-hidden="true">⤨</span></button></div></div>
  <span class="hero-corner">ARGENTUS / 175 EC</span><div class="hero-seal" aria-hidden="true">${icon('compass')}<span>LET CURIOSITY<br>BE YOUR COMPASS</span></div>
  <div class="hero-footnote"><span>FIELD NOTES FROM THE ARCHIPELAGO</span><span aria-hidden="true">— &nbsp; THE VOYAGE BEGINS HERE</span></div>
 </section>
 <div class="stats-strip"><div class="stat"><strong>5,800</strong><span>ISLANDS, GIVE<br>OR TAKE A TIDE</span></div><div class="stat"><strong>1 in 6</strong><span>ISLANDS WITHIN<br>THE COUNCIL’S REACH</span></div><div class="stat"><strong>2 moons</strong><span>TO GUIDE YOU<br>THROUGH THE DARK</span></div></div>
 ${atlasOrnament()}
 <section class="home-paths" aria-labelledby="home-paths-title">
  <h2 class="atlas-cartela" id="home-paths-title">${Pack2.text('Explore the Atlas','Explora el Atlas')}</h2>
  <nav aria-labelledby="home-paths-title">
   <a href="#start">${icon('compass')}${Pack2.text('Start here','Empieza aquí')}</a>
   <a href="#adventurers">${icon('shield')}${Pack2.text('Adventurers','Aventureros')}</a>
   <a href="#library">${icon('book')}${Pack2.text('Library','Biblioteca')}</a>
  </nav>
 </section>
 ${atlasOrnament()}
 <section class="section bestiary-shelf" aria-labelledby="small-wonders-heading"><div class="section-title"><div><p class="eyebrow">THE FIELD GUIDE / BEASTS & COMPANIONS</p><h2 id="small-wonders-heading">A little company.<br><em>A world of wonders.</em></h2></div><a class="text-link" href="#category/creature">Meet the creatures <span aria-hidden="true">→</span></a></div><p class="section-deck">Some warm your tea. Some carry your home. All have a place in island life.</p><div class="entry-grid creature-feature-grid">${['lampet','teacup-moth','chartback-tortoise','grommoth'].map(id=>articleCard(byId[id],true)).join('')}</div></section>
 <nav class="category-band" aria-label="Explore the atlas by subject">${visibleCategories().map(([id,c],i)=>`<a class="category-tile" href="#category/${id}"><span class="category-number">${String(i+1).padStart(2,'0')}</span>${icon(c.icon)}<strong>${c.name}</strong><span class="mono">${entries.filter(e=>e.category===id).length} ENTRIES <span aria-hidden="true">↗</span></span></a>`).join('')}</nav>
 <section class="chart-invitation" aria-labelledby="chart-invitation-title"><a class="chart-invitation-image" href="#atlas" aria-label="Open the world atlas">${mapSvg('invitation')}<span class="chart-compass" aria-hidden="true">${icon('compass')}</span></a><div class="chart-invitation-copy"><p class="eyebrow">A CHARTWRIGHT’S INVITATION</p><h2 id="chart-invitation-title">The sea between<br><em>everything.</em></h2><p>From the northern strait to the far ice, every crossing leads to another story. Unfold the original world chart and choose a shore.</p><a class="button" href="#atlas">Choose your next shore <span aria-hidden="true">↗</span></a></div></section>
 <section class="section"><div class="section-title"><div><p class="eyebrow">THE PEOPLE WHO CALL IT HOME</p><h2>Many shores.<br><em>Many ways to belong.</em></h2></div><a class="text-link" href="#category/people">Explore the peoples <span aria-hidden="true">→</span></a></div><div class="entry-grid home-feature-grid">${['tarvan','vorthani','pocchin'].map(id=>articleCard(byId[id],true)).join('')}</div></section>
 <section class="reading-trails" aria-label="A traveler’s shelf"><a href="#entry/companions"><span class="mono">01 / A LITTLE COMPANY</span><h3>Find someone small.</h3><p>Meet the companions that share island lives.</p><span aria-hidden="true">↗</span></a><a href="#entry/coinage"><span class="mono">02 / BEFORE YOU SET SAIL</span><h3>Learn the everyday.</h3><p>Coins, customs, and a place beside the fire.</p><span aria-hidden="true">↗</span></a><a href="#entry/saurians"><span class="mono">03 / THE LIVING SOUTH</span><h3>Follow the saurians.</h3><p>Seventeen kinds, from the table to the sky.</p><span aria-hidden="true">↗</span></a></section>
 <div class="discovery"><article class="quote-feature"><span class="quote-flower" aria-hidden="true">${icon('flower')}</span><p class="eyebrow">FROM THE MARGINS / THE FLORIANS</p><blockquote>“A whole life,<br>from dawn to dusk.”</blockquote><p>Not every story needs centuries. Meet the day-flowers, small kin of the Liriath who live entirely in the now.</p><a class="text-link" href="#entry/florians">Meet the Florians <span aria-hidden="true">→</span></a></article><section class="questions"><p class="eyebrow">BEGIN WITH A QUESTION</p><a class="question-link" href="#entry/king-tide">Why does the sea rise?<span aria-hidden="true">↗</span></a><a class="question-link" href="#entry/sea-pacts">Who keeps a harbor safe?<span aria-hidden="true">↗</span></a><a class="question-link" href="#entry/hospitality">What do you owe a stranger?<span aria-hidden="true">↗</span></a></section></div>
 </div>`;
 $('.home-atlas-search').addEventListener('click',openSearch);
}
function directoryFrontispiece(cat){
 const c=categories[cat];if(!c)return '';
 const image=cat==='creature'?'assets/creatures/lampet-v1-960.webp':cat==='people'?byId.tarvan.illustration.src:cat==='place'?'assets/scenes/harbor-v1-960.webp':null;
 return `<div class="directory-frontispiece ${image?'with-image':''}" aria-hidden="true">${image?`<img src="${image}" alt="" width="960" height="640">`:icon(c.icon)}<span class="folio-stamp">${icon(c.icon)}</span></div>`;
}
function matches(e,q){const tokens=fold(q).trim().split(/\s+/).filter(Boolean);return tokens.every(t=>e.searchText.includes(t))}
const regionNames=['Northern Frontier','Central Heartland','Southern Wilds','Icy Expanse','The Sea','Below'];
const creatureKinds={companion:'Companions',working:'Working beasts',saurian:'Saurians'};
function renderDirectory(cat='all',query='',savedOnly=false){
 currentCategory=cat;directoryQuery=query;limit=18;directorySort=['people','creature'].includes(cat)?'illustrated':'az';directoryKind='';directoryRegion='';
 const title=savedOnly?'Your reading list':cat==='all'?'The collected atlas':categories[cat]?.name||'The collected atlas';
 const description=savedOnly?'Keep the threads you want to follow. Your reading list is saved in this browser.':cat==='all'?'An index of places, peoples, creatures, and customs. Every name is a way into another story.':categories[cat].description;
 setNavigation(savedOnly?'saved':cat);
 $('#breadcrumb').innerHTML='<a href="#">The world</a> <span>/</span> '+esc(title);
 const categoryNav=savedOnly?'':'<nav class="filter-row" aria-label="Article categories"><a href="#browse" class="'+(cat==='all'?'active':'')+'">All entries</a>'+visibleCategories().map(([id,c])=>'<a href="#category/'+id+'" class="'+(cat===id?'active':'')+'">'+c.name+'</a>').join('')+'</nav>';
 const kindFilter=cat==='creature'?'<label>Creature kind<select id="directory-kind" aria-label="Creature kind"><option value="">All creatures</option>'+Object.entries(creatureKinds).map(([id,name])=>'<option value="'+id+'">'+name+'</option>').join('')+'</select></label>':'';
 const refinements='<div class="directory-refinements">'+kindFilter+'<label>Region<select id="directory-region" aria-label="Region"><option value="">All regions</option>'+regionNames.map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join('')+'</select></label><button id="reset-filters" type="button" disabled>Reset filters</button></div>';
 const sortOptions=(['people','creature'].includes(cat)?'<option value="illustrated">Illustrated first</option>':'')+'<option value="az">Title A to Z</option><option value="region">By region</option>';
 $('#content').innerHTML='<div class="content-wrap"><div class="directory-heading">'+(savedOnly?'':directoryFrontispiece(cat))+'<div class="page-intro"><p class="eyebrow">THE LIVING ATLAS / '+(savedOnly?'YOUR FIELD NOTES':'ENCYCLOPEDIA')+'</p><h1>'+esc(title)+'</h1><p>'+esc(description)+'</p></div></div><div class="directory-tools"><label class="directory-search"><span aria-hidden="true">⌕</span><input id="directory-search" type="search" aria-label="Filter the article index" placeholder="Search by name, region, or something you remember…" value="'+esc(query)+'"></label>'+categoryNav+refinements+'</div><div class="directory-status"><span class="mono" id="result-count" role="status" aria-live="polite"></span><label><span class="sr-only">Sort articles</span><select id="directory-sort" aria-label="Sort articles">'+sortOptions+'</select></label></div><div id="directory-results"></div></div>';
 $('#directory-search').addEventListener('input',event=>{directoryQuery=event.target.value;limit=18;drawDirectory(savedOnly)});
 $('#directory-sort').addEventListener('change',event=>{directorySort=event.target.value;drawDirectory(savedOnly)});
 $('#directory-region').addEventListener('change',event=>{directoryRegion=event.target.value;limit=18;drawDirectory(savedOnly)});
 if($('#directory-kind'))$('#directory-kind').addEventListener('change',event=>{directoryKind=event.target.value;limit=18;drawDirectory(savedOnly)});
 $('#reset-filters').addEventListener('click',()=>{directoryQuery='';directoryRegion='';directoryKind='';limit=18;$('#directory-search').value='';$('#directory-region').value='';if($('#directory-kind'))$('#directory-kind').value='';drawDirectory(savedOnly)});
 drawDirectory(savedOnly);
}
function drawDirectory(savedOnly=false){
 const filtered=entries.filter(e=>(currentCategory==='all'||e.category===currentCategory)&&(currentCategory!=='foes'||!e.foeParent||!!directoryQuery||!!directoryRegion)&&(!savedOnly||saved.has(e.id))&&(!directoryKind||e.creatureKind===directoryKind)&&(!directoryRegion||e.region===directoryRegion||e.region==='All regions'||e.regions?.includes(directoryRegion))&&(!directoryQuery||Pack2.canRead(e.id))&&matches(e,directoryQuery)).sort((a,b)=>Number(Pack2.canRead(b.id))-Number(Pack2.canRead(a.id))||(directorySort==='illustrated'?Number(!!b.illustration)-Number(!!a.illustration):0)||(directorySort==='region'?a.region.localeCompare(b.region):0)||a.title.localeCompare(b.title));
 const hasFilters=!!(directoryQuery||directoryKind||directoryRegion);
 $('#reset-filters').disabled=!hasFilters;
 $('#result-count').textContent=filtered.length+' '+(filtered.length===1?'ENTRY':'ENTRIES')+' '+(hasFilters?'FOUND':'TO EXPLORE');
 if(!filtered.length){$('#directory-results').innerHTML='<div class="empty-state"><span>✦</span><h2>'+(savedOnly&&!hasFilters?'A little room for curiosity.':'No trail by that name.')+'</h2><p>'+(savedOnly&&!hasFilters?'Open an article and choose Save for later. It will be waiting here.':'Try a shorter name or broaden the region and creature filters.')+'</p><a class="button" href="#browse">Explore the entries <span>→</span></a></div>';return}
 $('#directory-results').innerHTML='<div class="entry-grid directory-grid">'+filtered.slice(0,limit).map(e=>articleCard(e)).join('')+'</div>'+(filtered.length>limit?'<button class="load-more" id="load-more">Continue exploring ('+(filtered.length-limit)+' more) ↓</button>':'');
 const more=$('#load-more');if(more)more.addEventListener('click',()=>{limit+=18;drawDirectory(savedOnly)});
}
let aliases=[];
function buildAliases(){const map=new Map();for(const e of entries){map.set(e.title,e.id);for(const name of e.aliases||[])map.set(name,e.id);if(e.title.startsWith('The '))map.set(e.title.slice(4),e.id)}for(const [name,id]of Object.entries({'Council':'council','Concord':'concord','Hunters':'hunters','Armada':'armada','University':'university','Aethyn':'aethyn','Cindren':'cindren','Galven':'galven','Liriath':'liriath','Florians':'florians','Vorthani':'vorthani','Tarvan':'tarvan','Pocchin':'pocchin','Sporrn':'sporrn','Chartwrights':'chartwrights','King Tide':'king-tide','Still Days':'calendar','sea-pacts':'sea-pacts','saurians':'saurians','aurocs':'aurocs'}))map.set(name,id);aliases=[...map].sort((a,b)=>b[0].length-a[0].length)}
function linkify(text,current){
 const valid=aliases.filter(([,id])=>id!==current&&Pack2.canRead(id));
 const names=valid.map(([name])=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
 const fishbread=/\[\[(panpescado)\|fishbread\]\]|\b(fishbread\b(?: \(food\))?|panpescado\b(?: \(comida\))?)/;
 const re=new RegExp(fishbread.source+(names?'|\\b(?:'+names+')\\b':''),'gi');let result='',last=0;
 for(const m of text.matchAll(re)){
  const word=m[1]||m[2];
  // The food overview also uses the capitalized spelling at the start of its description.
  const id=word
   ? (word.includes('(')||word===word.toLowerCase()||current==='food-of-the-islands'?'fishbread-food':'fishbread')
   : valid.find(([name])=>fold(name)===fold(m[0]))?.[1];
  if(!id||id===current||!Pack2.canRead(id))continue;
  result+=esc(text.slice(last,m.index))+'<a class="wiki-link" href="#entry/'+id+'">'+esc(m[0])+'</a>';
  last=m.index+m[0].length;
 }
 return emphasis(result+esc(text.slice(last)));
}
function emphasis(html){return html.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g,'$1<em>$2</em>')}
function renderArticleSection(s,i,current,art=''){
 if(s.title==='Rumors'||s.title==='Rumores')return Pack2.rumorSection(s,i,current);
 let body=(s.paragraphs||[]).map(p=>'<p>'+linkify(p,current)+'</p>').join('');
 if(s.list?.length)body+='<ul>'+s.list.map(p=>'<li>'+linkify(p,current)+'</li>').join('')+'</ul>';
 if(s.table){
  const t=s.table;
  body+='<div class="article-table-wrap" role="region" aria-label="'+esc(t.caption)+'" tabindex="0"><table class="article-table'+(t.headers.length>3?' article-table-wide':'')+'" role="table"><caption>'+esc(t.caption)+'</caption><thead role="rowgroup"><tr role="row">'+t.headers.map(h=>'<th scope="col" role="columnheader">'+esc(h)+'</th>').join('')+'</tr></thead><tbody role="rowgroup">'+t.rows.map(row=>'<tr role="row">'+row.map((cell,j)=>j===0?'<th scope="row" role="rowheader">'+linkify(cell,current)+'</th>':'<td role="cell" data-column="'+esc(t.headers[j]||'')+'">'+linkify(cell,current)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 }
 const box={'Game Master’s secrets':'secret','The Code':'verse','Adventure hooks':'hooks','Tips':'tips','Did you know?':'curio','Ganchos de aventura':'hooks','Consejos':'tips','¿Sabías que?':'curio'}[s.title];
 return '<section id="article-section-'+i+'"'+(box?' class="article-box article-box-'+box+'"':'')+'><h2>'+esc(s.title)+'</h2>'+art+body+'</section>';
}
function mapRegionFor(entry){
 return regions.find(r=>r.id===entry.id) || regions.find(r=>byId[r.id]?.region===entry.region);
}
function entryMapAction(entry){
 const region=mapRegionFor(entry);
 if(mapReturnEntry===entry.id)return `<a class="quick-action" href="#atlas">${Pack2.text('Back to map','Volver al mapa')}</a>`;
 return region&&Pack2.canRead(region.id)?`<a class="quick-action" href="#atlas/${region.id}">${Pack2.text('View on map','Ver en el mapa')}</a>`:'';
}
function quickReference(entry){
 if(entry.category!=='place')return '';
 const t=(en,es)=>Pack2.text(en,es);
 const readable=id=>id!==entry.id&&byId[id]&&Pack2.canRead(id);
 const direct=(entry.related||[]).filter(readable).map(id=>byId[id]);
 const folk=direct.filter(item=>item.category==='folk');
 const known=new Set(folk.map(item=>item.id));
 for(const item of entries){
  if(item.category==='folk'&&!known.has(item.id)&&item.related?.includes(entry.id)&&readable(item.id)){
   folk.push(item);known.add(item.id);
  }
 }
 const section=(heading,html)=>html?`<section><h3>${heading}</h3>${html}</section>`:'';
 const short=text=>{
  const value=String(text||'').split(/(?<=[.!?])\s+/)[0];
  return value.length>170?value.slice(0,170).replace(/\s+\S*$/,'')+'…':value;
 };
 const card=item=>`<li><a href="#entry/${item.id}">${esc(item.title)}</a>${item.summary?`<span>${esc(short(item.summary))}</span>`:''}</li>`;
 const more=(items,item)=>items.length?`<ul>${items.slice(0,4).map(item).join('')}</ul>${items.length>4?`<details class="quick-more"><summary>${t('Show more','Ver más')} (${items.length-4})</summary><ul>${items.slice(4).map(item).join('')}</ul></details>`:''}`:'';
 const districts=entry.sections.find(s=>['The parts of the city','Las partes de la ciudad'].includes(s.title)&&s.table);
 const civic=districts?more(districts.table.rows,row=>{
  const match=entry.id==='goldwind'&&['The Commons','El Común'].includes(row[0])&&readable('the-commons')?'the-commons':null;
  return `<li>${match?`<a href="#entry/${match}">${esc(row[0])}</a>`:`<strong>${linkify(row[0],entry.id)}</strong>`}<span>${linkify(row[1],entry.id)}${row[2]?' · '+linkify(row[2],entry.id):''}</span></li>`;
 }):'';
 const publicRumors=entry.sections.find(s=>['Rumors','Rumores'].includes(s.title));
 const rumors=more(publicRumors?.paragraphs||[],line=>`<li><span>${linkify(line,entry.id)}</span></li>`);
 const secretIndex=entry.sections.findIndex(s=>s.secret||s.title==='Game Master’s secrets');
 const region=mapRegionFor(entry);
 const nameRegion=region?.id==='heartland'?'central-heartland':region?.surface!==false?region?.id:null;
 const actions=`<nav class="quick-actions" aria-label="${t('Tools for this place','Herramientas para este lugar')}">
  ${nameRegion?`<a class="quick-action" href="#adventurers/names?region=${nameRegion}">${t('Generate regional names','Generar nombres de la región')}</a>`:''}
  <span data-quick-passage hidden></span>
  ${secretIndex>=0?`<button class="quick-action quick-secret" type="button" data-scroll-to="article-section-${secretIndex}">${t('Game Master’s secrets','Secretos del Máster')}</button>`:''}
 </nav>`;
 return `<details class="quick-reference" id="quick-reference"><summary>${t('Quick reference','Consulta rápida')}</summary>
 <div class="quick-reference-inner">
  ${actions}${section(t('Districts','Distritos'),civic)}
  ${section(t('People linked to this place','Personajes vinculados al lugar'),more(folk,card))}
  ${section(t('Public rumors','Rumores públicos'),rumors)}
  ${section(t('Related entries','Entradas relacionadas'),more(direct.filter(item=>item.category!=='folk'),card))}
 </div></details>`;
}

function renderArticle(id){
 const e=byId[id];if(!e){renderNotFound();return}if(!Pack2.canRead(id)){Pack2.renderLocked();return}const categoryHref=e.category==='folk'?NotableFolk.returnHref(e):e.foeParent?'#entry/'+e.foeParent:'#category/'+e.category;setNavigation(e.category);$('#breadcrumb').innerHTML=`<a href="#">The world</a><span>/</span><a href="${esc(categoryHref)}">${e.foeParent?esc(byId[e.foeParent].title):categories[e.category].name}</a><span>/</span>${esc(e.title)}`;
 const art=articleArtwork(e);
 const titleContent=`<div class="article-title-copy"><p class="eyebrow">${categories[e.category].short.toUpperCase()} / ${esc(e.region.toUpperCase())}</p><h1 class="atlas-cartela">${esc(e.title)}</h1></div>`;
 const coverArt=art.cover?`<button class="article-cover-art" type="button" data-open-art="${e.id}" data-art-index="${art.cover.index}" aria-label="${Pack2.text('Enlarge illustration of','Ampliar ilustración de')} ${esc(e.title)}"><img src="${esc(art.cover.src)}" alt="" decoding="async"></button>`:'';
 const titleBlock=`<div class="article-cover${art.cover?' article-cover--illustrated':''}">${coverArt}${titleContent}</div>${art.main?`<div class="article-leading-art">${art.main}</div>`:''}`;
 $('#content').innerHTML=`<article class="content-wrap article-wrap"><header class="article-header">${titleBlock}<div class="article-intro">${Pack2.header(e)}<p class="article-subtitle">${esc(e.subtitle)}</p><p class="article-lead">${esc(e.summary)}</p></div><div class="article-actions"><button id="save-article" data-save="${e.id}" class="${saved.has(e.id)?'saved':''}" aria-pressed="${saved.has(e.id)}"><span aria-hidden="true">${saved.has(e.id)?'◆':'◇'}</span>${saved.has(e.id)?'Saved to reading list':'Save for later'}</button><button id="copy-link"><span aria-hidden="true">⧉</span> Copy article link</button>${e.category==='place'?`<button id="open-quick-reference" aria-expanded="false" aria-controls="quick-reference">${Pack2.text('Quick reference','Consulta rápida')}</button>`:''}${entryMapAction(e)}<span class="mono">THE CHARTED ISLES / 175 EC</span></div></header>${quickReference(e)}${window.NotableFolk?.articleLinks(e)||''}${e.id==='northern-frontier'?'<a class="frontier-article-cta" href="#map/northern-frontier">Explore the detailed Northern Frontier chart <span aria-hidden="true">↗</span></a>':''}${Pack2.music(e)}${articleCollection(e)}<div class="article-layout"><div class="article-prose">${e.sections.map((s,i)=>renderArticleSection(s,i,e.id,art.sections.get(i))).join(atlasOrnament())}<div class="article-source"><strong>FROM THE WORLD REFERENCE</strong>${esc(e.source)}<br>An explorer’s account of Kalvatar, set in 175 EC.</div></div><aside class="article-side" aria-label="Article reference"><div class="article-facts"><span class="mono">AT A GLANCE</span><dl>${e.facts.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div><nav class="article-toc" aria-label="On this page"><span class="mono">ON THIS PAGE</span>${e.sections.map((s,i)=>`<button data-scroll-to="article-section-${i}">${esc(s.title)}</button>`).join('')}${art.gallery.length?`<button data-scroll-to="article-gallery">${Pack2.text('Gallery','Galería')}</button>`:''}${art.plates.length?`<button data-scroll-to="article-plates">${Pack2.text('Field guide','Guía de campo')}</button>`:''}</nav></aside></div>${articleFieldPlates(e,art.plates)}${articleGallery(e,art.gallery)}${Pack2.notePanel(e)}<section class="article-related"><div class="section-title"><div><p class="eyebrow">ANOTHER THREAD TO FOLLOW</p><h2>Connected to this story.</h2></div></div><div class="related-links">${e.related.map(id=>{const r=byId[id];if(!Pack2.canRead(id))return '<span class="related-link">'+Pack2.text('Uncharted','Sin cartografiar')+'</span>';return `<a class="related-link" href="#entry/${id}"><span><small>${categories[r.category].short} / ${esc(r.region)}</small>${esc(r.title)}</span><span aria-hidden="true">↗</span></a>`}).join('')}</div></section><div class="article-back"><a href="${esc(categoryHref)}">← Back to ${e.foeParent?esc(byId[e.foeParent].title):categories[e.category].name.toLowerCase()}</a><button class="text-link" data-random>Another discovery ⤨</button></div></article>`;
 const quick=$('#quick-reference'),quickButton=$('#open-quick-reference');
 if(quick&&quickButton){
  quickButton.addEventListener('click',()=>{
   quick.open=!quick.open;
   if(quick.open){quick.querySelector('summary').focus({preventScroll:true});quick.scrollIntoView({block:'start'});}
  });
  quick.addEventListener('toggle',()=>quickButton.setAttribute('aria-expanded',String(quick.open)));
  window.Adventurers?.ready.then(()=>{
   const target=quick.querySelector('[data-quick-passage]');
   if(!quick.isConnected||!window.Adventurers.hasPort(e.id))return;
   target.hidden=false;
   target.innerHTML=`<a class="quick-action" href="#adventurers/travel?from=${e.id}">${Pack2.text('Plan a passage from here','Planear una travesía desde aquí')}</a>`;
  });
 }
 $('#save-article').addEventListener('click',()=>{const present=saved.has(e.id);if(present)saved.delete(e.id);else saved.add(e.id);saveList();const b=$('#save-article');b.classList.toggle('saved',!present);b.setAttribute('aria-pressed',String(!present));b.innerHTML=`<span aria-hidden="true">${!present?'◆':'◇'}</span>${!present?'Saved to reading list':'Save for later'}`;toast(readingStorage?(present?'Removed from your reading list.':'Saved for your next visit.'):'Saved for this visit. This browser could not keep the reading list.')});
 $('#copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);toast('Article link copied.')}catch(err){toast('Copy the article’s address from your browser to share it.')}});
}
const regions=[{id:'northern-frontier',x:30,y:34,places:['ironfort','tarvan','aurocs']},{id:'heartland',x:53,y:51,places:['goldwind','highspire','everfall']},{id:'southern-wilds',x:28,y:70,places:['jakupur','cathedral-green','liriath']},{id:'icy-expanse',x:59,y:89,places:['varan-port','auroral-vault','hospitality']},{id:'coral-kingdoms',x:77,y:64,places:['sea-pacts','coral-peoples','starfall-reef']},{id:'below',surface:false,places:['sporrn','haulbeetle','lantern-mouse']}];
let mapSelection=null,mapReturnEntry=null;
const mapText=(en,es)=>Pack2.text(en,es);
const regionName=r=>Pack2.canRead(r.id)?byId[r.id]?.title:mapText('Uncharted','Sin cartografiar');

function renderAtlas(regionId){
 setNavigation('atlas');
 const requested=regions.find(region=>region.id===regionId&&Pack2.canRead(region.id));
 if(requested&&requested.id!==mapSelection){mapZoom=1;mapX=0;mapY=0;}
 mapMove=false;
 $('#breadcrumb').innerHTML=`<a href="#">${mapText('The world','El mundo')}</a><span>/</span> ${mapText('World atlas','Atlas del mundo')}`;
 const t=mapText;
 $('#content').innerHTML=`<div class="content-wrap atlas-map-page">
 <div class="page-intro"><h1>${t('World atlas','Atlas del mundo')}</h1><p>${t('Choose a region from the list or on the chart.','Elige una región en la lista o en el mapa.')}</p></div>
 <div class="atlas-region-picker"><label for="atlas-region">${t('Region','Región')}</label><select id="atlas-region">${regions.map(r=>`<option value="${r.id}">${esc(regionName(r))}</option>`).join('')}</select></div>
 <div class="map-layout"><div class="world-chart">
 <div class="atlas-map-toolbar" aria-label="${t('Map controls','Controles del mapa')}">
 <div class="atlas-zoom"><button type="button" data-zoom="out" aria-label="${t('Zoom out','Alejar')}">−</button><output id="map-scale" aria-live="polite">100%</output><button type="button" data-zoom="in" aria-label="${t('Zoom in','Acercar')}">+</button></div>
 <button type="button" data-zoom="reset">${t('Reset','Restablecer')}</button><button type="button" id="map-move" aria-pressed="false">${t('Move map','Mover mapa')}</button></div>
 <div class="map-viewport" id="map-viewport" tabindex="0" aria-label="${t('Interactive regional map','Mapa regional interactivo')}" aria-describedby="map-hint"><div class="map-layer" id="map-layer">${mapSvg('atlas')}${regions.filter(r=>r.surface!==false).map(r=>`<button class="region-pin" data-region="${r.id}" style="left:${r.x}%;top:${r.y}%" aria-label="${esc(regionName(r))}"><span>${esc(regionName(r))}</span></button>`).join('')}</div></div>
 <div class="map-caption" id="map-hint"></div></div>
 <aside class="map-detail"><div class="region-detail" id="region-detail" aria-live="polite"></div></aside></div></div>`;
 const vp=$('#map-viewport');
 let drag=null;
 setRegion(requested?.id || mapSelection || regions.find(r=>r.id==='heartland'&&Pack2.canRead(r.id))?.id || regions.find(r=>Pack2.canRead(r.id))?.id || 'heartland');
 $('#atlas-region').addEventListener('change',e=>setRegion(e.target.value));
 $('#map-move').addEventListener('click',()=>{mapMove=!mapMove;updateMapControls()});
 vp.addEventListener('pointerdown',e=>{
  if(!mapMove||!e.isPrimary||e.button!==0||e.target.closest('button'))return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:mapX,startY:mapY};
  vp.setPointerCapture(e.pointerId);vp.classList.add('is-dragging');
 });
 vp.addEventListener('pointermove',e=>{
  if(drag?.id!==e.pointerId)return;
  mapX=drag.startX+e.clientX-drag.x;mapY=drag.startY+e.clientY-drag.y;applyMapTransform();
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture'])vp.addEventListener(event,e=>{
  if(drag?.id!==e.pointerId)return;
  drag=null;vp.classList.remove('is-dragging');
 });
 vp.addEventListener('keydown',e=>{
  if(e.target!==vp)return;
  if(['+','=','-'].includes(e.key)){e.preventDefault();zoomMap(e.key==='-'?'out':'in');return}
  if(mapZoom===1||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();
  mapX+=e.key==='ArrowLeft'?30:e.key==='ArrowRight'?-30:0;
  mapY+=e.key==='ArrowUp'?30:e.key==='ArrowDown'?-30:0;
  applyMapTransform();
 });
 updateMapControls();
 applyMapTransform();
}
function setRegion(id){
 const e=byId[id],region=regions.find(r=>r.id===id),detail=$('#region-detail');
 if(!e||!region||!detail)return;
 mapSelection=id;
 // Keep the URL aligned with the selected region so browser Back restores the same view.
 const hash='#atlas/'+id;
 if(location.hash!==hash)history.replaceState(history.state,'',hash);
 $('#atlas-region').value=id;
 document.querySelectorAll('.atlas-map-page [data-region]').forEach(el=>{
  const yes=el.dataset.region===id;
  el.classList.toggle('active',yes);el.setAttribute('aria-pressed',String(yes));
 });
 if(!Pack2.canRead(id)){detail.innerHTML=Pack2.lockedCard();return}
 const t=mapText;
 const localIds=[...new Set([...region.places,...entries.filter(x=>x.category==='place'&&x.region===e.region&&x.id!==id).map(x=>x.id)])].filter(id=>byId[id]&&Pack2.canRead(id));
 detail.innerHTML=`<h2>${esc(e.title)}</h2><p>${esc(e.summary)}</p>
 ${region.surface===false?`<p class="below-chart-note">${t('Below lies beneath the islands and has no surface marker.','Abajo yace bajo las islas y no tiene un marcador en la superficie.')}</p>`:''}
 <div class="atlas-region-actions"><a class="button" data-map-entry="${e.id}" href="#entry/${e.id}">${t('Open region entry','Abrir entrada de la región')}</a>
 ${id==='northern-frontier'?`<a class="button cream" href="#map/northern-frontier">${t('Detailed chart','Mapa detallado')}</a>`:''}</div>
 <div class="map-region-list"><p>${t('PLACES AND LOCAL THREADS','LUGARES E HISTORIAS LOCALES')}</p>${localIds.map(id=>`<a class="question-link" data-map-entry="${id}" href="#entry/${id}">${esc(byId[id].title)}</a>`).join('')}</div>`;
}
function applyMapTransform(){
 const layer=$('#map-layer');if(!layer)return;
 const maxX=layer.clientWidth*(mapZoom-1)/2,maxY=layer.clientHeight*(mapZoom-1)/2;
 mapX=Math.max(-maxX,Math.min(maxX,mapX));mapY=Math.max(-maxY,Math.min(maxY,mapY));
 layer.style.transform=`translate(${mapX}px,${mapY}px) scale(${mapZoom})`;
 layer.style.setProperty('--pin-scale',1/mapZoom);
}
function updateMapControls(){
 const vp=$('#map-viewport'),move=$('#map-move');
 if(!vp||!move)return;
 const enlarged=mapZoom>1,t=mapText;
 if(!enlarged)mapMove=false;
 vp.classList.toggle('is-movable',mapMove);
 move.disabled=!enlarged;
 move.setAttribute('aria-pressed',String(mapMove));
 move.textContent=mapMove?t('Done moving','Listo'):t('Move map','Mover mapa');
 $('[data-zoom="reset"]').disabled=!enlarged;
 $('[data-zoom="out"]').disabled=!enlarged;
 $('[data-zoom="in"]').disabled=mapZoom===3.5;
 $('#map-scale').textContent=Math.round(mapZoom*100)+'%';
 $('#map-hint').textContent=mapMove?t('Drag the map. Tap Done moving to scroll the page.','Arrastra el mapa. Toca Listo para desplazar la página.'):enlarged?t('Tap Move map to drag the chart.','Toca Mover mapa para arrastrar la carta.'):t('Zoom in to move around the chart.','Acerca el mapa para moverte por la carta.');
}
function zoomMap(direction){
 if(!$('#map-viewport'))return;
 const next=direction==='reset'?1:Math.max(1,Math.min(3.5,mapZoom+(direction==='in'?.25:-.25)));
 mapX*=next/mapZoom;mapY*=next/mapZoom;mapZoom=next;
 applyMapTransform();updateMapControls();
}
window.addEventListener('resize',applyMapTransform);

function renderRegionalChart(id){
 if(id!=='northern-frontier'||!Pack2.canRead(id)){renderNotFound();return}
 setNavigation('atlas');$('#breadcrumb').innerHTML='<a href="#">The world</a><span>/</span><a href="#atlas">World atlas</a><span>/</span> Northern Frontier';
 $('#content').innerHTML=FrontierMap.render(byId,id=>Pack2.canRead(id),(en,es)=>Pack2.text(en,es));
 $('#content').querySelectorAll('[data-map-list]').forEach(el=>{const mark=$(`[data-map-site="${el.dataset.mapList}"]`);if(!mark)return;el.addEventListener('mouseenter',()=>mark.classList.add('is-related'));el.addEventListener('mouseleave',()=>mark.classList.remove('is-related'));el.addEventListener('focus',()=>mark.classList.add('is-related'));el.addEventListener('blur',()=>mark.classList.remove('is-related'))});
 $('#content').querySelectorAll('[data-map-site]').forEach(el=>{const row=$(`[data-map-list="${el.dataset.mapSite}"]`);if(!row)return;el.addEventListener('mouseenter',()=>row.classList.add('is-related'));el.addEventListener('mouseleave',()=>row.classList.remove('is-related'));el.addEventListener('focus',()=>row.classList.add('is-related'));el.addEventListener('blur',()=>row.classList.remove('is-related'))});
}

function renderRumors(){
 setNavigation('rumors');$('#breadcrumb').innerHTML='<a href="#">The world</a><span>/</span> Rumors';
 $('#content').innerHTML=`<div class="content-wrap"><div class="page-intro"><p class="eyebrow">VOICES OF THE ISLANDS</p><h1>What the tide <em>brings in.</em></h1><p>Every port has a story. An overheard claim is a rumor, not a promise that it is true.</p></div><div class="rumor-tools"><label>Region<select id="rumor-region" aria-label="Rumor region"><option value="">All regions</option>${regionNames.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><button class="button" id="random-rumor">A rumor at random <span>⤨</span></button></div><p class="mono" id="rumor-count" role="status"></p><div id="rumor-spotlight" aria-live="polite"></div><div class="rumor-grid" id="rumor-list"></div></div>`;
 const card=r=>`<article class="rumor-card"><p class="eyebrow">${esc(r.region||'All regions')}</p><blockquote>${esc(r.text)}</blockquote>${r.heardAt?`<p class="rumor-heard">Heard ${esc(r.heardAt)}</p>`:''}</article>`;
 const filtered=()=>rumors.filter(r=>!$('#rumor-region').value||r.region===$('#rumor-region').value||r.region==='All regions');
 const draw=()=>{const rs=filtered();$('#rumor-count').textContent=rs.length+' RUMORS';$('#rumor-list').innerHTML=rs.length?rs.map(card).join(''):'<p class="empty-state">No rumors gathered on this chart yet.</p>';$('#rumor-spotlight').innerHTML='';$('#random-rumor').disabled=!rs.length};
 $('#rumor-region').addEventListener('change',draw);$('#random-rumor').addEventListener('click',()=>{const rs=filtered();if(rs.length)$('#rumor-spotlight').innerHTML=card(rs[Math.floor(Math.random()*rs.length)])});draw();
}
function renderTimeline(){
 setNavigation('timeline');$('#breadcrumb').innerHTML='<a href="#">The world</a><span>/</span> Timeline';
 $('#content').innerHTML=`<div class="content-wrap"><div class="page-intro"><p class="eyebrow">THE PAST, AS ISLANDERS TELL IT</p><h1>Before this <em>tide.</em></h1><p>From the oldest stories to 175 EC. Myth keeps its own place beside remembered history.</p></div><ol class="atlas-timeline">${timeline.filter(t=>t.related?.some(Pack2.canRead)).map(t=>`<li><p class="eyebrow">${esc(t.date)}</p><h2>${esc(t.title)}</h2><p>${esc(t.text)}</p>${t.related?.length?`<div class="timeline-links">${t.related.filter(id=>byId[id]&&Pack2.canRead(id)).map(id=>`<a href="#entry/${id}">${esc(byId[id].title)} ↗</a>`).join('')}</div>`:''}</li>`).join('')}</ol>${timeline.length?'':'<p class="empty-state">The chronology is still being charted.</p>'}</div>`;
}

function renderNotFound(){setNavigation('all');$('#breadcrumb').innerHTML='<a href="#">The world</a><span>/</span> Uncharted';$('#content').innerHTML='<div class="content-wrap"><div class="empty-state"><span>✦</span><h2>Beyond this chart.</h2><p>That entry is not in the atlas yet.</p><a class="button" href="#browse">Return to known waters →</a></div></div>'}
function route(){
 const parts=location.hash.slice(1).split('/');const view=parts[0];closeMenu();if($('#illustration-dialog').open)$('#illustration-dialog').close();if($('#search-dialog').open)$('#search-dialog').close();
 if(Pack2.customRoute(view,parts)){}
 else if(view==='entry'){renderArticle(parts[1]);document.title=(Pack2.canRead(parts[1])?byId[parts[1]]?.title||'Uncharted':'Uncharted')+' | Kalvatar'}
 else if(view==='rumors'){Pack2.renderRumorsFor(parts[1]);document.title='Rumors | Kalvatar'}
 else if(view==='timeline'){renderTimeline();document.title='Timeline | Kalvatar'}
 else if(view==='atlas'){renderAtlas(parts[1]);document.title='World atlas | Kalvatar'}
 else if(view==='map'){renderRegionalChart(parts[1]);document.title='Northern Frontier chart | Kalvatar'}
 else if(view==='browse'){renderDirectory();document.title='All entries | Kalvatar'}
 else if(view==='category'&&parts[1]==='folk'){NotableFolk.render(parts[2]||'');document.title=NotableFolk.title(parts[2])+' | Kalvatar'}
 else if(view==='category'&&categories[parts[1]]){renderDirectory(parts[1]);document.title=categories[parts[1]].name+' | Kalvatar'}
 else if(view==='saved'){renderDirectory('all','',true);document.title='Your reading list | Kalvatar'}
 else if(view==='search'){let query='';try{query=decodeURIComponent(parts.slice(1).join('/'))}catch(e){}renderDirectory('all',query);document.title='Search | Kalvatar'}
 else if(!view){renderHome();document.title='Kalvatar | The Living Atlas'}else{renderNotFound();document.title='Uncharted | Kalvatar'}
 window.scrollTo({top:0,behavior:'instant'});$('#content').focus({preventScroll:true});Pack2.afterRoute();syncArticleToc();
}
function syncArticleToc(){
 const links=[...document.querySelectorAll('.article-toc [data-scroll-to]')];
 if(!links.length)return;
 const sections=links.map(link=>document.getElementById(link.dataset.scrollTo));
 let active=0;
 sections.forEach((section,index)=>{if(section?.getBoundingClientRect().top<=120)active=index});
 links.forEach((link,index)=>{
  if(index===active)link.setAttribute('aria-current','location');
  else link.removeAttribute('aria-current');
 });
}
window.addEventListener('scroll',syncArticleToc,{passive:true});
function searchRank(e,q){const term=fold(q).trim();const title=fold(e.title).replace(/^the /,'');return (title===term?1000:0)+(e.aliases?.some(a=>fold(a).replace(/^the /,'')===term.replace(/^the /,''))?1000:0)+(title.startsWith(term)?150:0)+(title.includes(term)?80:0)+(fold(e.region).includes(term)?15:0)+(fold(e.summary).includes(term)?5:0)}
function renderSearch(query=''){
 const selected=(query.trim()?entries.filter(e=>Pack2.canRead(e.id)&&matches(e,query)).sort((a,b)=>searchRank(b,query)-searchRank(a,query)||a.title.localeCompare(b.title)):['kalvatar','goldwind','lampet','liriath','king-tide','hunters'].map(id=>byId[id])).filter(e=>Pack2.canRead(e.id)).slice(0,10);
 $('#search-results').innerHTML=selected.length?selected.map(e=>`<a class="search-result" href="#entry/${e.id}"><span><strong>${esc(e.title)}</strong><small>${categories[e.category].short} / ${esc(e.region)}</small>${query?`<p>${esc(e.summary)}</p>`:''}</span><span aria-hidden="true">↗</span></a>`).join(''):'<p class="search-empty">No entry found. Try “Goldwind”, “Florians”, “Krysta”, or “moons”.</p>';
 const storyMatches=window.AtlasLibrary?.searchResults(query)||'';if(storyMatches){if(!selected.length)$('#search-results').innerHTML='';$('#search-results').insertAdjacentHTML('beforeend',storyMatches);}
}
function openSearch(){if(!entries.length)return;$('#global-search').value='';renderSearch();if(!$('#search-dialog').open)$('#search-dialog').showModal();$('#global-search').focus()}
$('#open-search').addEventListener('click',openSearch);$('#global-search').addEventListener('input',e=>renderSearch(e.target.value));$('#global-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const first=$('.search-result');if(first)first.click()}});
$('#menu-toggle').addEventListener('click',()=>{const yes=!$('#sidebar').classList.contains('open');$('#sidebar').classList.toggle('open',yes);$('#mobile-backdrop').classList.toggle('visible',yes);$('#menu-toggle').setAttribute('aria-expanded',String(yes))});$('#mobile-backdrop').addEventListener('click',closeMenu);
document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#search-dialog').open){e.preventDefault();openSearch()}if(e.key==='Escape')closeMenu()});
document.addEventListener('click',e=>{const link=e.target.closest('a[href]');if(link?.hasAttribute('data-map-entry')&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey)mapReturnEntry=link.dataset.mapEntry;if(link?.getAttribute('href')==='#content'){e.preventDefault();$('#content').focus();$('#content').scrollIntoView();return}if(link){if($('#search-dialog').open)$('#search-dialog').close();if(link.getAttribute('href')===location.hash)closeMenu()}const close=e.target.closest('[data-close-search]');if(close)$('#search-dialog').close();const random=e.target.closest('[data-random]');if(random&&entries.length){const available=entries.filter(x=>Pack2.canRead(x.id)&&location.hash!==`#entry/${x.id}`);if(!available.length)return;location.hash=`entry/${available[Math.floor(Math.random()*available.length)].id}`}const pin=e.target.closest('[data-region]');if(pin)setRegion(pin.dataset.region);const zoom=e.target.closest('[data-zoom]');if(zoom)zoomMap(zoom.dataset.zoom);const section=e.target.closest('[data-scroll-to], [data-scroll-section]');if(section){const id=section.dataset.scrollTo||'article-section-'+section.dataset.scrollSection;document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}});
$('#search-dialog').addEventListener('click',e=>{if(e.target===$('#search-dialog')){const r=$('#search-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#search-dialog').close()}});
window.addEventListener('hashchange',route);
const entryIllustrations = {
 "tenants": ["scenes", "Two silvery glints form eyes inside Squint, the tenanted spyglass, as it turns toward a ship on the horizon.", "Dos destellos plateados dibujan unos ojos en la lente de Squint, el catalejo poseído, mientras se orienta hacia un barco en el horizonte.", "tenants-squint-approved-v1"],
 "northreach": ["scenes", "Northreach horses gallop along a moor road through heather and gorse.", "Caballos del Confín del Norte galopan por un camino entre brezos y tojos.", "northreach-moorland-horses-approved-v1"],
 "pearl-groove-and-the-pelagar-isle": ["scenes", "A pearl diver surfaces above the oyster beds of Pearl Groove.", "Una buceadora sale a respirar sobre los bancos de ostras del Surco de Perlas.", "pearl-groove-lagoon-diver-approved-v1"],
 "thin-places": ["scenes", "A still spring reflects a sunlit sky that does not match the clouds overhead.", "Un manantial refleja un cielo soleado bajo las nubes grises del páramo.", "thin-places-wrong-sky-approved-v1"],
 "door-coins": ["scenes", "A visitor sets a holed copper Bit on the lintel of a new home.", "Una visitante coloca una Ola de cobre perforada en el dintel de una casa nueva.", "door-coins-lintel-approved-v1"],
 "first-bread": ["scenes", "An innkeeper sets a newcomer’s first meal before them. A stranger has already paid for it.", "Una posadera sirve la primera comida de un viajero recién llegado. Alguien ya pagó por ella.", "first-bread-harbor-inn-approved-v1"],
 "kellum": ["scenes", "A sailor offers the first drop of kellum to the sea.", "Un marinero ofrece al mar la primera gota de kellum.", "kellum-first-drop-approved-v1"],
 "the-keeping": ["scenes", "A keeper tends the hearth before dawn while a hearth newt sleeps on the first coal.", "Antes del amanecer, una mujer aviva el fuego mientras un tritón del hogar duerme sobre la primera brasa.", "the-keeping-first-coal-approved-v1"],
 "the-roam": ["scenes", "A traveler follows the roads of the Roam, with four seasonal lands in view.", "Una viajera recorre los caminos de la Errancia, con las cuatro estaciones a la vista.", "the-roam-four-seasons-approved-v1"],
 "two-moons-and-the-tides": ["scenes", "A child chalks the morning’s high-water mark under Valtaire and Ciel.", "Una niña marca con tiza hasta dónde subió el mar, bajo Valtaire y Ciel.", "two-moons-chalk-tide-approved-v1"],
 "lighthouses": ["scenes", "A keeper tends a lighthouse flame in a storm while another light answers across the water.", "Un farero cuida la llama durante la tormenta mientras otro faro responde al otro lado del agua.", "lighthouses-long-watch-approved-v1"],
 "charter-mint": ["scenes", "Two Reckoners watch a gold pour at the Charter Mint. A square Orsal stamped with the sun face of Ors rests in the foreground.", "Dos contadores presencian el vertido del oro en la Casa de Moneda. En primer plano descansa un Orsal cuadrado con el rostro solar de Ors.", "charter-mint-gold-pour-approved-v1"],
 "stillwater": ["scenes", "Sailors take to the oars as an Old Shell surfaces inside the glassy circle of the Stillwater.", "Los marineros toman los remos mientras una tortuga sabia emerge en el círculo terso del Agua Quieta.", "stillwater-old-shell-approved-v1"],
 "returning-cup": ["scenes", "A neighbor leaves bread while cups wait upright in the windows and the fleet returns to Okram.", "Una vecina deja pan mientras las tazas esperan boca arriba en las ventanas y la flota regresa a Okram.", "returning-cup-okram-approved-v2"],
 "fishbread": ["folk", "Fishbread sleeps on the highest of the Warm Steps of Ixtalu beside an offering of fishbread.", "Panpescado duerme en el escalón más alto de los Escalones Tibios de Ixtalu, junto a un panpescado que le dejaron de ofrenda.", "fishbread-cat-approved-v1"],
 "fishbread-food": ["scenes", "A Jakupur fishbread with grilled river fish, red pepper and herbs, served in a leaf.", "Panpescado de Jakupur con pescado de río a la brasa, ají rojo y hierbas, servido en una hoja.", "fishbread-jakupur-approved-v1"],
 "coinage": ["scenes", "The four coins of Kalvatar: a holed copper Bit, a silver Tide, a gold Anchor, and a square Orsal stamped with the sun face of Ors.", "Las cuatro monedas de Kalvatar: una Ola de cobre perforada, una Marea de plata, un Ancla de oro y un Orsal cuadrado con el rostro solar de Ors.", "coinage-approved-v1"],
 "serpents-coil": ["scenes", "A schooner threads the reefs at low tide.", "Una goleta cruza los arrecifes en bajamar.", "serpents-coil", {"width": 1536, "height": 864}],
 "halfwake": ["scenes", "Lanterns reflect in the glass vault above Halfwake.", "Los faroles se reflejan en la bóveda de vidrio de Halfwake.", "halfwake", {"width": 1536, "height": 864}],
 "suns-grave": ["scenes", "Two fishers find gold leaf in their net.", "Dos pescadores encuentran una lámina de oro en su red.", "suns-grave", {"width": 1536, "height": 864}],
 "slowwater": ["scenes", "A lizardfolk guide poles a reed boat through the marsh.", "Un guía lagarto impulsa una barca de juncos por la ciénaga.", "slowwater", {"width": 1536, "height": 864}],
 "signed-works": ["scenes", "An armorer inspects her mark beside the guild stamp.", "Una armera examina su marca junto al sello del gremio.", "signed-works", {"width": 1536, "height": 1024}],
 "cistern-door": ["scenes", "A kobold sweeps beside the dwarven wall.", "Un kobold barre junto al muro enano.", "cistern-door", {"width": 1536, "height": 864}],
 "merrin-games": ["scenes", "Harbor grandmothers judge a fish chowder.", "Las abuelas del puerto prueban un guiso de pescado.", "merrin-games", {"width": 1536, "height": 864}],
 "answering-light": ["scenes", "A child raises a lantern to answer a passing ship.", "Un niño alza un farol en respuesta a un barco que pasa.", "answering-light", {"width": 1536, "height": 864}],
 "naming-spoon": ["scenes", "A returning sailor rests her hand beside her spoon.", "Una marinera que ha vuelto a casa apoya la mano junto a su cuchara.", "naming-spoon", {"width": 1536, "height": 864}],
 "chalk-tide": ["scenes", "Children chalk the high-water mark on the quay.", "Dos niños marcan con tiza la pleamar en el muelle.", "chalk-tide", {"width": 1536, "height": 864}],
 "goldwind-kites": ["scenes", "A patchwork fish kite rises above Goldwind.", "Una cometa de retazos en forma de pez se eleva sobre Goldwind.", "goldwind-kites", {"width": 1536, "height": 864}],
 "chainbreakers": ["scenes", "Freed miners burn a debt ledger at dawn.", "Los mineros liberados queman un libro de deudas al amanecer.", "chainbreakers", {"width": 1536, "height": 864}],
 "savannas": ["scenes", "Centaurs follow the well road ahead of a storm.", "Los centauros siguen la ruta de los pozos antes de la tormenta.", "savannas", {"width": 1536, "height": 786}],
 "naxtumen": ["scenes", "A chant-keeper sees a ship in the smoke.", "Una guardiana de los cantos ve un barco en el humo.", "naxtumen", {"width": 1536, "height": 864}],
 "coinsday-reading": ["scenes", "A runner waits as the prices are read at noon.", "Una mensajera espera durante la lectura de precios al mediodía.", "coinsday-reading", {"width": 1536, "height": 864}],
 "drinkseed": ["scenes", "Drinkseed soaks in a fen kitchen.", "El drinkseed se remoja en una cocina del pantano.", "drinkseed", {"width": 1536, "height": 1024}],
 "the-grandfather": ["scenes", "A living shoot catches the light on the Grandfather.", "Un brote del árbol ancestral recibe la luz.", "the-grandfather", {"width": 1536, "height": 864}],
 "blue-folk": ["scenes", "Travelers draw water at a well in the dry isles.", "Unos viajeros sacan agua de un pozo en las islas secas.", "blue-folk", {"width": 1536, "height": 864}],
 "driftborn": ["scenes", "Driftborn families lash their boats together at sunset.", "Las familias Driftborn amarran sus barcos entre sí al atardecer.", "driftborn", {"width": 1536, "height": 864}],
 "mirehorn": ["scenes", "A mirehorn pulls a plough through a flooded field.", "Un mirehorn arrastra un arado por un campo inundado.", "mirehorn", {"width": 1536, "height": 864}],
 "giants-table": ["scenes", "Horned moorhorses circle the stone at sunrise.", "Caballos cornudos rodean la losa al amanecer.", "giants-table", {"width": 1536, "height": 768}],
 "inkers-circle": ["scenes", "A printer lifts a fresh sheet of Hunter Ranking cards.", "Un impresor levanta una hoja recién impresa de cartas de cazadores.", "inkers-circle", {"width": 1536, "height": 864}],
 "brassfield": ["scenes", "A cane worker counts brass tokens as the clerk reads the ledger.", "Un trabajador cuenta fichas de latón mientras el escribiente lee las deudas.", "brassfield", {"width": 1536, "height": 864}],
 "red-choir": ["scenes", "Sahuagin priests sing beneath the King Tide.", "Los sacerdotes sahuagin cantan bajo la gran marea.", "red-choir", {"width": 1536, "height": 864}],
 "silver-ships": ["scenes", "Unlit ships cross a moonlit sea.", "Barcos sin faroles cruzan un mar iluminado por la luna.", "silver-ships", {"width": 1536, "height": 786}],
 'azhani': ['folk', 'Azhani Emberstep dances on glowing embers at the Gullmarket.', 'Azhani Emberstep baila sobre las brasas en el Gullmarket.', 'azhani', {width:1024,height:1536}],
 "the-commons": ["scenes", "Neighbors trade and work along a street in the Commons.", "Los vecinos compran y trabajan en una calle de El Común.", "the-commons-approved-v1", {"width": 1536, "height": 1024}],
 "the-canals": ["scenes", "A boatwoman sings as she passes beneath the Kettle Bridge.", "Una barquera canta al pasar bajo el Puente de la Tetera.", "the-canals-approved-v1", {"width": 1536, "height": 1024}],
 "gullmarket": ["scenes", "The Gullmarket pricecaller calls from her crate as neighbors shop and eat.", "La pregonera del Gullmarket canta los precios desde su caja mientras los vecinos compran y comen.", "gullmarket-approved-v1", {"width": 1536, "height": 1024}],
 "lower-harbor": ["scenes", "A fisher leaves salt on the Salt Steps before the dawn departure.", "Una pescadora deja sal en los Escalones de la Sal antes de zarpar al amanecer.", "lower-harbor-approved-v1", {"width": 1536, "height": 1024}],
 "the-ropewalks": ["scenes", "Ropewalkers lay rope in the long sheds beside the sail-lofts.", "Los cordeleros fabrican cabos en las largas naves junto a los talleres de velas.", "the-ropewalks-approved-v1", {"width": 1536, "height": 1024}],
 "the-smokes": ["scenes", "Salters and coopers prepare the catch beside the smokehouses.", "Saladores y toneleros preparan la pesca junto a los ahumaderos.", "the-smokes-approved-v1", {"width": 1536, "height": 1024}],
 "the-tangle": ["scenes", "Neighbors gather around the Common Hearth at dusk.", "Los vecinos se reúnen alrededor del hogar comunitario al anochecer.", "the-tangle-approved-v1", {"width": 1536, "height": 1024}],
 "kitehill": ["scenes", "Kitefighters compete above the bay as spectators cheer from bleachers and rooftops.", "Los combatientes de cometas compiten sobre la bahía mientras el público anima desde las gradas y las azoteas.", "kitehill-approved-v1", {"width": 1536, "height": 1024}],
 "university": ["powers", "The University of Kalvatar rises above Goldwind beneath its copper-ringed spires.", "La Universidad de Kalvatar se alza sobre Goldwind bajo sus agujas ceñidas de cobre.", "university-approved-v2", {"width":1536,"height":1024}],
 "krystawrights": ["scenes", "A master Krystawright finishes an imbued crystal as his apprentice watches.", "Un maestro Krystawright termina un cristal imbuido mientras su aprendiz observa.", "krystawrights-approved-v1", {"width":1536,"height":1024}],
 "arcane-registry": ["scenes", "A sealed Writ changes hands at Goldwind’s Arcane Registry, beside a tray of copper rings.", "Un Writ sellado cambia de manos en el Registro Arcano de Goldwind, junto a una bandeja de anillos de cobre.", "arcane-registry-approved-v1", {"width": 1536, "height": 1024}],
 "imra-and-claire": ["folk", "Imra and Claire aboard The Last Word.", "Imra y Claire a bordo de La Última Palabra.", "imra-and-claire-approved-v1", {"width": 1536, "height": 1024}],
 "morgha-wall-holder": ["folk", "Morgha Wall-Holder leans against cargo crates on a wharf.", "Morgha Wall-Holder se apoya en unas cajas de carga en el muelle.", "morgha-wall-holder-approved-v1", {"width": 1024, "height": 1536}],
 "ottilie-veldane": ["folk", "Ottilie Veldane receives visitors with a sealed letter in her lap.", "Ottilie Veldane recibe visitas con una carta sellada en el regazo.", "ottilie-veldane-approved-v1", {"width": 1024, "height": 1536}],
 "mother-kess": ["folk", "Mother Kess pauses over tea beside a harbor window.", "Mother Kess hace una pausa para tomar té junto a una ventana con vista al puerto.", "mother-kess-approved-v1", {"width": 1024, "height": 1536}],
 "imelda-roque": ["folk", "Imelda Roque holds a seal beside an open contract.", "Imelda Roque sostiene un sello junto a un contrato abierto.", "imelda-roque-approved-v1", {"width": 1024, "height": 1536}],
 "alesse-brightwater": ["folk", "Alesse Brightwater stands in a sunlit coastal cloister.", "Alesse Brightwater permanece en un claustro costero iluminado por el sol.", "alesse-brightwater-approved-v1", {"width": 1024, "height": 1536}],
 "ondrel-greywake": ["folk", "Ondrel Greywake rests on the quay at dusk.", "Ondrel Greywake descansa en el muelle al anochecer.", "ondrel-greywake-approved-v1", {"width": 1024, "height": 1536}],
 "uha-farsight": ["folk", "Uha Farsight turns toward her crew, her coat caught by the wind.", "Uha Farsight se vuelve hacia su tripulación mientras el viento agita su abrigo.", "uha-farsight-approved-v1", {"width": 1024, "height": 1536}],
 "zyanya-greymoor": ["folk", "Zyanya Greymoor directs a river maneuver in the rain.", "Zyanya Greymoor dirige una maniobra fluvial bajo la lluvia.", "zyanya-greymoor-approved-v1", {"width": 1024, "height": 1536}],
 "runa-kaldmark": ["folk", "Runa Kaldmark keeps watch from a snow-dusted deck.", "Runa Kaldmark mantiene la guardia desde una cubierta salpicada de nieve.", "runa-kaldmark-approved-v1", {"width": 1024, "height": 1536}],
 "zeras-durant": ["folk", "Zeras Durant discusses a maneuver over a chart.", "Zeras Durant comenta una maniobra sobre una carta de navegación.", "zeras-durant-approved-v1", {"width": 1024, "height": 1536}],
 'maera-blackstrand': ['folk', 'Maera Blackstrand beside an open ledger in the Reckoners’ Hall.', 'Maera Blackstrand junto a un libro de cuentas abierto en el Reckoners’ Hall.', 'maera-blackstrand-approved-v1', {width:1024,height:1536}],
 'victoria-wingate': ['folk', 'Victoria Wingate aboard a sailing vessel.', 'Victoria Wingate a bordo de un velero.', 'victoria-wingate-approved-v1', {width:1024,height:1536}],
 'house-wingate': ['folk', 'Victoria Wingate aboard a sailing vessel.', 'Victoria Wingate a bordo de un velero.', 'victoria-wingate-approved-v1', {width:1024,height:1536}],
 'summer-court': ['scenes', 'Knights salute each other at the Noonhold, beneath the Summer Court’s golden banners.', 'Dos caballeros se saludan en el Noonhold, bajo los estandartes dorados de la Corte de Verano.', 'summer-court-portrait'],
 'autumn-court': ['scenes', 'The stewards of Autumn weigh a bargain at the edge of the Red Orchards.', 'Los administradores de Otoño sopesan un trato junto a los Huertos Rojos.', 'autumn-court-portrait'],
 'winter-court': ['scenes', 'Snow falls inside the Pale Hall as Winter’s clerks record promises on ice.', 'La nieve cae dentro del Salón Pálido mientras los escribas de Invierno registran promesas en hielo.', 'winter-court-portrait'],
 'spring-court': ['scenes', 'The Spring Court plays an old game in the Laughing Garden.', 'La Corte de Primavera juega a un juego antiguo en el Jardín Risueño.', 'spring-court-portrait'],
 'pyraxis-the-unbowed-flame': ['folk', 'Pyraxis watches the tournament grounds from a sunlit arch at the Noonhold.', 'Pyraxis observa el campo del torneo desde un arco soleado del Noonhold.', 'pyraxis-the-unbowed-flame-portrait'],
 'vael-mournthorn-the-crimson-reaper-king': ['folk', 'Vael Mournthorn looks up from his ledger in the Halls of the Last Bargain.', 'Vael Mournthorn alza la vista de su libro de cuentas en los Salones del Último Trato.', 'vael-mournthorn-the-crimson-reaper-king-portrait'],
 'morthryn-the-pale-empress-of-air-and-ending': ['folk', 'Morthryn sits in the Pale Hall as the first light catches her crown of ice.', 'Morthryn permanece sentada en el Salón Pálido mientras la primera luz alcanza su corona de hielo.', 'morthryn-the-pale-empress-of-air-and-ending-portrait'],
 'aoifel-the-green-laugh': ['folk', 'Aoifel leaps barefoot through the Laughing Garden, eyes closed and smiling.', 'Aoifel salta descalza en el Jardín Risueño, con los ojos cerrados y una sonrisa.', 'aoifel-the-green-laugh-leap'],
 'unbound': ['folk', 'The Unbound rests with his eyes closed, a sleeping cat on his lap and a cup of coffee beside him.', 'El Unbound descansa con los ojos cerrados, un gato dormido en el regazo y una taza de café a su lado.', 'unbound-portrait'],
 'radan-sunmere': ['folk', 'Radan halts a swinging load with magic.', 'Radan detiene una carga suspendida con magia.'],
 'lysandra-vellune': ['folk', 'Amarise dispels an illusion over an object.', 'Amarise disipa la ilusión que oculta un objeto.'],
 'kettik-ninth-step': ['folk', 'Kettik lifts a false bottom to inspect hidden cargo.', 'Kettik levanta un doble fondo para inspeccionar la carga oculta.'],
 'cat-kin': ['peoples', 'Two Cat-kin pass a rope between rooftops above a lantern-lit market.', 'Dos Cat-kin se pasan una cuerda entre los tejados sobre un mercado iluminado por faroles.'],
 'shifters': ['peoples', 'Two Shifters turn to look back on a rain-soaked quay.', 'Dos Shifters miran hacia atrás en un muelle bajo la lluvia.'],
 'warforged': ['peoples', 'An ancient bronze Warforged emerges from the sea at dawn.', 'Un Warforged de bronce antiguo emerge del mar al amanecer.'],
 'pride-kin': ['peoples', 'Three Pride-kin talk around a fire on the savanna.', 'Tres Pride-kin conversan alrededor de una fogata en la sabana.'],
 'ivory-kin': ['peoples', 'Two Ivory-kin haul a bucket of water from a stone well.', 'Dos Ivory-kin sacan un balde de agua de un pozo de piedra.'],
 'centaurs': ['peoples', 'Two centaurs gallop across the savanna at sunset.', 'Dos centauros galopan por la sabana al atardecer.'],
 'zalkareth': ['scenes', 'A skiff approaches the fortified river port of Zal’Kareth.', 'Un bote se acerca al puerto fluvial fortificado de Zal’Kareth.'],
 'kaskan': ['scenes', 'Two brightly feathered aurocs on the docks of Kaskan at sunset.', 'Dos aurocs de plumaje colorido en los muelles de Kaskan al atardecer.'],
 'stormreach': ['scenes', 'Shipwrights raise a hull rib in the Stormreach shipyard during a squall.', 'Los carpinteros del astillero de Stormreach levantan una cuaderna en plena tormenta.'],
 'duskmire-haven': ['scenes', 'A reed boat passes stilt houses in Duskmire Haven at dusk.', 'Una barca de juncos pasa entre las casas sobre pilotes de Duskmire Haven al atardecer.'],
 'silverport': ['scenes', 'Two artisans prepare rose oil and hang dyed silk in Silverport.', 'Dos artesanas preparan aceite de rosas y tienden seda teñida en Silverport.'],
 'saltreach': ['scenes', 'Workers rake salt and operate a sluice on the Saltreach coast.', 'Los trabajadores recogen sal y manejan una compuerta en las salinas de Saltreach.'],
 'crystalhaven': ['scenes', 'Four salvagers pull a mast on a sled across the ice at Crystalhaven.', 'Cuatro rescatistas arrastran un mástil sobre un trineo por el hielo de Crystalhaven.'],
 'bastion': ['scenes', 'A mounted patrol leaves Bastion beneath the black and iron-grey banners of House Faust.', 'Una patrulla montada sale de Bastion bajo los estandartes negros y gris hierro de la Casa Faust.'],
 'briarcrown': ['scenes', 'Two people exchange a sealed note in a garden overlooking the coast.', 'Dos personas se pasan una nota sellada en un jardín con vista a la costa.'],
 'frosthold': ['scenes', 'A Tidecaller blesses a crew at Frosthold’s harbor.', 'Una Tidecaller bendice a una tripulación en el puerto de Frosthold.'],
 'kaldmark': ['scenes', 'A guard pushes open the whalebone gate beneath Kaldmark’s black banners.', 'Un guardia abre el portón bajo el arco de hueso de ballena y los estandartes negros de Kaldmark.'],
 'snowvah': ['scenes', 'A woman sets down a bowl of steaming stew overlooking Snowvah’s icy plain.', 'Una mujer sirve un guiso humeante en una sala con vista a la llanura helada de Snowvah.'],
 'sunhold': ['scenes', 'Two workers lift a block of pressed brightleaf on Sunhold’s terraces.', 'Dos trabajadores levantan un bloque de brightleaf prensado en las terrazas de Sunhold.']
};
const galleryScenes = {
 "fishbread-food": [
  ["fishbread-goldwind-approved-v1", "Goldwind", "Ventoro", "Grilled sea fish with spiced oil in toasted flatbread on the Goldwind quay.", "Pescado de mar a la brasa con aceite especiado en pan plano tostado, en el muelle de Ventoro."],
  ["fishbread-frontier-approved-v1", "Northern Frontier", "Frontera Norte", "Grilled salt fish in dark rye flatbread on a cold northern quay.", "Pescado salado a la parrilla en pan plano de centeno oscuro, en un muelle de la Frontera Norte."]
 ],
 "sunhold": [["sunhold-vintage","The price of a harvest","El precio de una cosecha","A grower watches a bank appraiser taste the wine.","Un viticultor observa a la tasadora que prueba su vino.",{"width":1536,"height":864}]],
 "crystalhaven": [["crystalhaven-false-lights","The false lights","Las falsas luces","Granny Ylva raises her lantern above the frozen harbor.","Granny Ylva alza su farol sobre el puerto helado.",{"width":1536,"height":864}]],
 "zalkareth": [["zalkareth-upriver","What comes upriver","Lo que sube por el río","An Orka relic arrives under cover of rain.","Una reliquia Orka llega bajo la lluvia.",{"width":1536,"height":864}]],
 "snowvah": [["snowvah-last-post","The last post","El último poste","A guide waits beside the last marker on the ice.","Un guía espera junto al último poste sobre el hielo.",{"width":1536,"height":768}]],
 "kitehill": [["kitehill-caught-kite","Caught it!","¡La atrapé!","A child catches a cut kite on the Long Stair.","Una niña atrapa una cometa suelta en la Gran Escalera.",{"width":1536,"height":864}]],
 "lower-harbor": [["harbor-salt-offering","A pinch before sailing","Una pizca antes de zarpar","The crew waits while the captain leaves salt on the steps.","La tripulación espera mientras el capitán deja sal en los escalones.",{"width":1536,"height":864}]],
 "gullmarket": [["gullmarket-returned-compass","What the sea returned","Lo que devolvió el mar","A sailor recognizes a dripping compass at a secondhand stall.","Una marinera reconoce una brújula que todavía gotea en un puesto de segunda mano.",{"width":1536,"height":864}],["gullmarket-coinsday","Coinsday on Fish Row","Coinsday en Fish Row","A fishwife raises a mackerel as a buyer holds up a coin.","Una pescadera alza una caballa mientras una compradora le muestra una moneda.",{"width":1536,"height":864}]],
 "the-ropewalks": [["ropewalks-mainsail","The mainsail","La vela mayor","Sailmakers stitch a mainsail across the loft floor.","Los artesanos cosen una vela mayor extendida en el taller.",{"width":1536,"height":864}],["ropewalks-armada","The Armada’s thread","El hilo de la Armada","A ropewalker twists a colored thread into a line for the fleet.","Un cordelero incorpora un hilo de color al cabo de la flota.",{"width":1536,"height":512}]],
 "the-smokes": [["smokes-barrel-row","Barrel Row","La calle de los toneleros","A cooper brands a barrel lid beside the smokehouses.","Un tonelero marca a fuego una tapa junto a los ahumaderos.",{"width":1536,"height":864}]],
 "the-tangle": [["tangle-blue-door","That door wasn’t there yesterday","Esa puerta ayer no estaba","A baker and a child study a staircase leading to an unfamiliar door.","Una panadera y un niño miran la escalera que lleva a una puerta desconocida.",{"width":1536,"height":864}],["tangle-common-hearth","Before dawn at the Common Hearth","Antes del alba en el hogar comunitario","A neighbor adds a log while the courtyard still lies in shadow.","Una vecina añade un leño mientras el patio sigue en penumbra.",{"width":1536,"height":864}]],
 "the-canals": [["canals-kettle-bridge","Beneath the Kettle Bridge","Bajo el Puente de la Tetera","A boatman sings as his boat clears the stone arch.","Un barquero canta al salir de debajo del arco de piedra.",{"width":1536,"height":864}],["canals-doorstep-market","The market at your door","El mercado llega a tu puerta","A woman receives a basket of oranges from a passing boat.","Una vecina recibe una cesta de naranjas desde una barca.",{"width":1536,"height":1024}],["canals-wrack-cow","The Kelp Toll","El peaje en algas","A wrack cow tows a Stillwright barge with honeywrack caught in its whiskers.","Una vaca de alga remolca una barcaza de los Stillwrights con honeywrack entre los bigotes.",{"width":1536,"height":864}]],
 "university": [["university-painterly-v1", "Charts and scholarship", "Cartas y estudios", "Charts, science, and arcane study share a courtyard in Goldwind.", "Las cartas de navegación, la ciencia y el estudio arcano comparten un patio en Goldwind.", {"directory":"powers","width":1536,"height":1024,"presentation":"gallery"}]],
 "arbiters": [["hall-of-threads-approved-v1", "The Hall of Threads", "El Salón de los Hilos", "Retired Arbiter regalia is preserved with commemorative plaques in Goldwind’s Hall of Threads.", "Los atuendos de antiguos Árbitros se conservan con placas conmemorativas en el Salón de los Hilos de Goldwind.", {"width":1536,"height":1024}]],
 'house-wingate': [
  ["henrietta-wingate-approved-v1", "Henrietta Wingate", "Henrietta Wingate", "Henrietta adjusts her gloves beside a field tent.", "Henrietta se ajusta los guantes junto a una tienda de campaña.", {"directory": "folk", "width": 1024, "height": 1536}],
  ["evangeline-wingate-approved-v1", "Evangeline Wingate", "Evangeline Wingate", "Evangeline pauses beside a ship’s chart table.", "Evangeline hace una pausa junto a la mesa de cartas de un barco.", {"directory": "folk", "width": 1024, "height": 1536}],
  ["edmond-wingate-approved-v1", "Edmond Wingate", "Edmond Wingate", "Edmond rests on a stone terrace overlooking the sea.", "Edmond descansa en una terraza de piedra frente al mar.", {"directory": "folk", "width": 1024, "height": 1536}]
 ],
 'goldwind': [
  ['goldwind-street-wanderer', 'A carefree afternoon', 'Una tarde sin preocupaciones', 'A young woman enjoys the sunshine on one of Goldwind’s lower streets.', 'Una joven disfruta del sol mientras recorre las calles bajas de Goldwind.', {width:1024,height:1536,presentation:'gallery'}],
  ['goldwind-family-on-steps', 'A family in the lower streets', 'Una familia en las calles bajas', 'A family shares a sunlit moment outside a small Goldwind shop.', 'Una familia comparte un momento soleado a la entrada de una tienda de Goldwind.', {width:1448,height:1086,presentation:'gallery'}]
 ],
 'pyraxis-the-unbowed-flame': [['pyraxis-aoifel-turn-v1', 'A challenge at the Turn', 'Un reto durante el relevo', 'Pyraxis reacts to one of Aoifel’s ridiculous challenges at the handover of the Turn.', 'Pyraxis reacciona a uno de los retos ridículos de Aoifel durante el relevo del Turn.']],
 'aoifel-the-green-laugh': [
  ['aoifel-wildflower-bed', 'A bed of wildflowers', 'Una cama de flores silvestres', 'Aoifel stretches as she wakes among the wildflowers of the Laughing Garden.', 'Aoifel se estira al despertar entre las flores silvestres del Jardín Risueño.'],
  ['aoifel-winter-embrace-v1', 'An embrace in the Pale Hall', 'Un abrazo en el Salón Pálido', 'Aoifel draws Morthryn into a tender embrace by a frosted window.', 'Aoifel abraza con ternura a Morthryn junto a una ventana escarchada.']
 ],
 'morthryn-the-pale-empress-of-air-and-ending': [
  ['morthryn-frozen-balcony', 'The frozen balcony', 'El balcón helado', 'Morthryn holds a letter on the frost-covered balcony of the Pale Hall, barefoot and barehanded.', 'Morthryn sostiene una carta en el balcón escarchado del Salón Pálido, descalza y con las manos desnudas.'],
  ['morthryn-quiet-confession-v1', 'A quiet confession', 'Una confesión en voz baja', 'Aoifel confesses her feelings, catching Morthryn off guard.', 'Aoifel le confiesa lo que siente y toma a Morthryn por sorpresa.']
 ],
 'hunters-citadel': [['hunters-citadel-goldwind-falls', 'Above the Goldwind Falls', 'Sobre las cascadas de Goldwind', 'The Hunters’ Citadel rises above the cliffs and waterfalls of Goldwind.', 'La Ciudadela de los Cazadores se alza sobre los acantilados y las cascadas de Goldwind.']],
 'black-harbor': [['black-harbor-fogbound-wharf', 'The fogbound wharf', 'El muelle entre la niebla', 'Lanterns light the wooden wharf beneath the sea caves of Black Harbor.', 'Los faroles iluminan el muelle de madera bajo las cuevas marinas de Black Harbor.']],
 'stormreach': [['stormreach-shipyard-storm-break', 'The shipyard after the storm', 'El astillero tras la tormenta', 'Sunlight breaks through the clouds over the shipyard of Stormreach.', 'La luz atraviesa las nubes sobre el astillero de Stormreach.']],
 'kaldmark': [["kaldmark-icebrand","Inside the icebrand stillhouse","Al calor del icebrand","Warriors return to the stillhouse beneath the bear-skull banner.","Los guerreros vuelven a la destilería bajo el estandarte del cráneo de oso.",{"width":1536,"height":864}],['kaldmark-black-keep', 'The black keep', 'La fortaleza negra', 'Travelers approach the gate of Kaldmark beneath a bear-skull banner.', 'Unos viajeros se acercan al portón de Kaldmark bajo un estandarte con un cráneo de oso.']],
 'widows-teeth': [['widows-teeth-pilot-boat', 'A pilot boat through the Teeth', 'Una lancha de prácticos entre los Dientes', 'A pilot boat threads the channel between the jagged rocks of the Widow’s Teeth.', 'Una lancha de prácticos cruza el canal entre los farallones de los Dientes de la Viuda.']]
};

// Use the exact English section titles from the build, before Pack2 localizes entries.
const gallerySectionTitles = {
 "arbiters": {"hall-of-threads-approved-v1":"The Hall of Threads"},
 'house-wingate': {"henrietta-wingate-approved-v1": "The Wingates", "evangeline-wingate-approved-v1": "The Wingates", "edmond-wingate-approved-v1": "The Wingates"},
 'aethyn': {'highspire-painterly-v2':'High places'},
 'cindren': {'everfall-painterly-v2':'Forge and fire-vigil'},
 'aurocs': {
  'great-auroc-v2':'Domestic and great aurocs',
  'ironfort-painterly-v2':'North and south'
 },
 'armada': {'admiralty-high-command-painterly-v2':'The Admiralty’s table'},
 'swordtooth': {'jakupur-painterly-v2':'In the stables and the wild'},
 'loamback': {'jakupur-painterly-v2':'In southern life'},
 'nine-fleets': {
  'falken-brightsight-painterly-v1':'The nine commands',
  'enara-torraflame-painterly-v1':'The nine commands',
  'skarrei-ninth-squall-painterly-v1':'The nine commands'
 },
 'battle-of-the-krakens-maw': {
  'maw-volunteers-painterly-v1':'The islands answered',
  'trident-through-the-line-painterly-v1':'Thulissa’s last charge',
  'thulissa-blackheart-duel-painterly-v1':'Thulissa’s last charge',
  'maw-wrecks-painterly-v1':'Ten years later'
 },
 'kalivos-durant': {'admiralty-high-command-painterly-v2':'Four kinds of responsibility'},
 'serane-marr': {'admiralty-high-command-painterly-v2':'Across the chart table'},
 'brigid-thane': {'admiralty-high-command-painterly-v2':'The Cerulean Vanguard'},
 'edran-holst': {'admiralty-high-command-painterly-v2':'The shoreward command'},
 'admiral-thulissa': {'trident-through-the-line-painterly-v1':'On the Dread Sovereign'},
 'hyacinth-alastor': {'hyacinth-vesna-ride-v1':'Vesna, her prized Songcrest'},
 'songcrest': {'hyacinth-vesna-ride-v1':'Vesna'},
 'radan-sunmere': {'lysandra-radan-harbor-debate-v1':'Amarise knew him before'},
 'lysandra-vellune': {'lysandra-radan-harbor-debate-v1':'An assignment she tried to change'},
 'pyraxis-the-unbowed-flame': {'pyraxis-aoifel-turn-v1':'What nobody says to her face'},
 'aoifel-the-green-laugh': {'aoifel-winter-embrace-v1':'Spring and Winter'},
 'morthryn-the-pale-empress-of-air-and-ending': {'morthryn-quiet-confession-v1':'Spring and Winter'},
 'stormreach': {'stormreach-shipyard-storm-break':'Overview'},
 'kaldmark': {'kaldmark-black-keep':'Overview'},
 'widows-teeth': {'widows-teeth-pilot-boat':'Seeing it'}
};
const artSectionsByEntry = new Map();
let availableGoldwindArt = new Set();
function addFishbreadEntry(input, spanish) {
 const food = {
  id: 'fishbread-food',
  title: 'Fishbread (food)',
  category: 'culture',
  region: 'All regions',
  subtitle: 'A bite from the quay',
  summary: 'Hot grilled fish folded into flatbread. A Bit buys one.',
  sections: [{title:'At the quay', paragraphs:['A quick street meal across the islands. The cook splits the hot grilled fish straight into a flatbread and folds it to eat on the go.']}],
  facts: [['Price','One Bit']],
  source: 'Kalvatar Library · 175 EC',
  related: ['food-of-the-islands','coinage','fishbread']
 };
 input.push(food);
 spanish[food.id] = {
  title: 'Panpescado (comida)',
  subtitle: 'Un bocado del muelle',
  summary: 'Pescado caliente a la parrilla envuelto en pan plano. Una Ola compra uno.',
  sections: [{title:'En el muelle', paragraphs:['Una comida callejera rápida en todas las islas. El cocinero abre el pescado recién salido de la parrilla, lo mete en un pan plano y dobla el pan para comerlo al paso.']}],
  facts: [['Precio','Una Ola']]
 };

 // These corrections live alongside the illustrations so the generated lore files can be rebuilt as usual.
 const spellPanpescado = text => text.replace(/\bpan de pescado\b/gi, match => match.startsWith('P') ? 'Panpescado' : 'panpescado');
 for (const id of ['coinage','coins-and-prices','food-of-the-islands','fishbread']) {
  const copy = spanish[id];
  if (!copy) continue;
  if (copy.summary) copy.summary = spellPanpescado(copy.summary);
  for (const section of copy.sections || []) {
   if (section.paragraphs) section.paragraphs = section.paragraphs.map(spellPanpescado);
   if (section.list) section.list = section.list.map(spellPanpescado);
  }
  if (copy.facts) copy.facts = copy.facts.map(([label,value]) => [label,spellPanpescado(value)]);
 }
 const cat = input.find(entry => entry.id === 'fishbread');
 if (!cat) return;
 cat.related = [...new Set([food.id, ...(cat.related || [])])];
 cat.sections[0].paragraphs = cat.sections[0].paragraphs.map(line =>
  line.replace('because that is what they leave him.', 'because they leave him fishbread.'));
 const catEs = spanish[cat.id];
 if (!catEs) return;
 catEs.title = 'Panpescado';
 for (const section of catEs.sections || []) {
  section.paragraphs = section.paragraphs.map(line =>
   line.replace('porque eso es lo que le dejan.', 'porque le dejan panpescado de ofrenda.'));
 }
 // Keep any untranslated GM sections reachable through the same secret controls.
 if (cat.translations?.es === 'pending') {
  catEs.sections.push(...cat.sections.filter(section => section.secret));
  cat.translations.es = 'complete';
 }
}
function applyEntryIllustrations(entries) {
 for (const entry of entries) {
  const placements = new Map();
  for (const [filename, title] of Object.entries(gallerySectionTitles[entry.id] ?? {})) {
   const index = entry.sections.findIndex(section => section.title === title);
   if (index >= 0) placements.set(filename, {title, index});
  }
  if (placements.size) artSectionsByEntry.set(entry.id, placements);
  for (const [filename, label, labelEs, caption, captionEs, options = {}] of galleryScenes[entry.id] ?? []) {
   if (entry.id==='goldwind' && !availableGoldwindArt.has(filename)) continue;
   const base = `assets/${options.directory || 'scenes'}/${filename}`;
   const scene = {
    thumb: base + '-480.webp', src: base + '-960.webp', full: base + '-1536.webp',
    width: options.width || 1536, height: options.height || 1024,
    presentation: options.presentation,
    get label() { return Pack2.text(label, labelEs); },
    get alt() { return Pack2.text(caption, captionEs); },
    get caption() { return Pack2.text(caption, captionEs); }
   };
   const gallery=entry.gallery ??= [];
   const existing=gallery.findIndex(art=>art.full===scene.full);
   if(existing===-1)gallery.push(scene);
   else gallery[existing]=scene;
  }
  const illustration = entryIllustrations[entry.id];
  if (!illustration) continue;
  const [directory, caption, captionEs, filename = entry.id, options = {}] = illustration;
  const base = `assets/${directory}/${filename}`;
  entry.illustration = {
   thumb: base + '-480.webp', src: base + '-960.webp', full: base + '-1536.webp',
   width: options.width || 1536, height: options.height || 1024,
   get alt() { return Pack2.text(caption, captionEs); },
   get caption() { return Pack2.text(caption, captionEs); }
  };
 }
}
(async()=>{try{
 const response=await fetch('entries.json?v=93');if(!response.ok)throw new Error('Atlas unavailable');const input=await response.json();
 availableGoldwindArt = new Set((await Promise.all(galleryScenes.goldwind.map(async ([filename])=>{
  try{const r=await fetch('assets/scenes/'+filename+'-480.webp',{method:'HEAD'});return r.ok?filename:null}catch{return null}
 }))).filter(Boolean));
 await Pack2.ready;
 addFishbreadEntry(input, Pack2.data.entries_es);
 applyEntryIllustrations(input);entries=await Pack2.prepare(input);await window.AtlasLibrary?.ready;byId=Object.fromEntries(entries.map(e=>[e.id,e]));
 const optional=async name=>{try{const r=await fetch(name+'?v=93');const data=r.ok?await r.json():[];return Array.isArray(data)?data:[]}catch{return []}};
 [rumors,timeline]=await Promise.all([optional('rumors.json'),optional('timeline.json')]);
 for(const e of entries)e.searchText=fold([e.title,e.summary,e.subtitle,e.region,categories[e.category].name,...(e.aliases||[]),...e.sections.flatMap(s=>[s.title,...(s.paragraphs||[]),...(s.list||[]),...(s.table?[s.table.caption,...s.table.headers,...s.table.rows.flat()]:[])]),...e.facts.flat(),creatureKinds[e.creatureKind]||''].join(' '));
 saved=new Set([...saved].filter(id=>byId[id]));buildAliases();renderMainNavigation();Pack2.nav();updateSavedCount();route();
 }catch(error){$('#content').innerHTML='<div class="loading">The atlas could not be opened.<br>Please reload the page to try again.</div>';console.error(error)}})();

// The illustration viewer preserves the complete composition at every screen size.
document.addEventListener('click',event=>{const open=event.target.closest('[data-open-art]');if(open)openIllustration(open.dataset.openArt,Number(open.dataset.artIndex||0));if(event.target.closest('[data-close-art]'))$('#illustration-dialog').close()});
$('#illustration-dialog').addEventListener('click',event=>{if(event.target!==$('#illustration-dialog'))return;const box=event.target.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)event.target.close()});
