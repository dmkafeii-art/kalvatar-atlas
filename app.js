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
let rumors=[],timeline=[],entries=[],byId={},saved=new Set(),readingStorage=true,toastTimer,limit=18,currentCategory='all',directoryQuery='',directorySort='az',directoryKind='',directoryRegion='',mapZoom=1,mapX=0,mapY=0;
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
function articleArtFigure(e,a,index,comparison=false){
 const sizes=comparison?'(max-width: 720px) calc(100vw - 36px), (max-width: 1180px) calc((100vw - 300px) / 2), 550px':'(max-width: 720px) calc(100vw - 36px), (max-width: 1180px) calc(100vw - 260px), 1100px';
 return `<figure class="article-art${a.kind==='plate'?' field-guide-plate':''}"><button class="article-art-open" data-open-art="${e.id}" data-art-index="${index}" aria-label="Enlarge illustration of ${esc(a.label||e.title)}"><img src="${esc(a.src)}" srcset="${esc(a.thumb)} 480w, ${esc(a.src)} 960w, ${esc(a.full)} 1536w" sizes="${sizes}" width="${a.width}" height="${a.height}" alt="${esc(a.alt)}" decoding="async" ${index===0?'fetchpriority="high"':'loading="lazy"'}><span class="art-open-hint" aria-hidden="true">View illustration ⤢</span></button><figcaption>${comparison?`<strong>${esc(a.label||e.title)}</strong> — `:''}${esc(a.caption)}</figcaption></figure>`;
}
function articleIllustration(e){
 const scenes=articleImages(e).map((a,index)=>({a,index})).filter(({a})=>a.kind!=='plate'&&a.presentation!=='gallery');
 const figures=scenes.map(({a,index})=>articleArtFigure(e,a,index,scenes.length>1)).join('');
 return scenes.length>1?`<section class="art-comparison" aria-label="${esc(e.title)} illustrations">${figures}</section>`:figures;
}
function articleFieldPlates(e){
 const plates=articleImages(e).map((a,index)=>({a,index})).filter(({a})=>a.kind==='plate');if(!plates.length)return '';
 return `<section class="field-guide-gallery" aria-labelledby="field-guide-title"><div class="section-title"><div><p class="eyebrow">THE NATURALIST’S NOTES</p><h2 id="field-guide-title">In the field guide.</h2></div></div>${plates.map(({a,index})=>articleArtFigure(e,a,index)).join('')}</section>`;
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
function renderHome(){
 setNavigation('home');$('#breadcrumb').innerHTML='The world <span>/</span> An explorer’s guide';
 $('#content').innerHTML=`<div class="content-wrap home-wrap">
 <div class="edition-line"><span>THE CHARTED ISLES</span><span class="edition-star" aria-hidden="true">✦</span><span>AN ORIGINAL WORLD BY KAFEII</span></div>
 <section class="hero hero-port" aria-labelledby="hero-heading">
  <img class="hero-scene" src="assets/scenes/harbor-v1-1536.webp" srcset="assets/scenes/harbor-v1-960.webp 960w, assets/scenes/harbor-v1-1536.webp 1536w" sizes="(max-width:720px) 100vw, calc(100vw - 280px)" width="1536" height="1024" alt="A sunlit island harbor: barefoot travelers in flowing clothes, market awnings, and cream-sailed ships on turquoise water." fetchpriority="high" decoding="async">
  <div class="hero-copy"><p class="eyebrow"><span class="star" aria-hidden="true">✦</span> A WORLD BETWEEN SALT AND STARS</p><h1 id="hero-heading">Every island<br>has <em>a story.</em></h1><p class="hero-description">A sail on the horizon. A stranger at the tea table. A small light waiting on the dock.<br>Find your way into Kalvatar.</p><div class="hero-actions"><a class="button cream" href="#atlas">Unfold the atlas <span aria-hidden="true">↗</span></a><button class="text-link" data-random>Follow a thread <span aria-hidden="true">⤨</span></button></div></div>
  <span class="hero-corner">ARGENTUS / 175 EC</span><div class="hero-seal" aria-hidden="true">${icon('compass')}<span>LET CURIOSITY<br>BE YOUR COMPASS</span></div>
  <div class="hero-footnote"><span>FIELD NOTES FROM THE ARCHIPELAGO</span><span aria-hidden="true">— &nbsp; THE VOYAGE BEGINS HERE</span></div>
 </section>
 <div class="stats-strip"><div class="stat"><strong>5,800</strong><span>ISLANDS, GIVE<br>OR TAKE A TIDE</span></div><div class="stat"><strong>1 in 6</strong><span>ISLANDS WITHIN<br>THE COUNCIL’S REACH</span></div><div class="stat"><strong>2 moons</strong><span>TO GUIDE YOU<br>THROUGH THE DARK</span></div></div>
 <section class="section bestiary-shelf" aria-labelledby="small-wonders-heading"><div class="section-title"><div><p class="eyebrow">THE FIELD GUIDE / BEASTS & COMPANIONS</p><h2 id="small-wonders-heading">A little company.<br><em>A world of wonders.</em></h2></div><a class="text-link" href="#category/creature">Meet the creatures <span aria-hidden="true">→</span></a></div><p class="section-deck">Some warm your tea. Some carry your home. All have a place in island life.</p><div class="entry-grid creature-feature-grid">${['lampet','teacup-moth','chartback-tortoise','grommoth'].map(id=>articleCard(byId[id],true)).join('')}</div></section>
 <nav class="category-band" aria-label="Explore the atlas by subject">${visibleCategories().map(([id,c],i)=>`<a class="category-tile" href="#category/${id}"><span class="category-number">${String(i+1).padStart(2,'0')}</span>${icon(c.icon)}<strong>${c.name}</strong><span class="mono">${entries.filter(e=>e.category===id).length} ENTRIES <span aria-hidden="true">↗</span></span></a>`).join('')}</nav>
 <section class="chart-invitation" aria-labelledby="chart-invitation-title"><a class="chart-invitation-image" href="#atlas" aria-label="Open the world atlas">${mapSvg('invitation')}<span class="chart-compass" aria-hidden="true">${icon('compass')}</span></a><div class="chart-invitation-copy"><p class="eyebrow">A CHARTWRIGHT’S INVITATION</p><h2 id="chart-invitation-title">The sea between<br><em>everything.</em></h2><p>From the northern strait to the far ice, every crossing leads to another story. Unfold the original world chart and choose a shore.</p><a class="button" href="#atlas">Choose your next shore <span aria-hidden="true">↗</span></a></div></section>
 <section class="section"><div class="section-title"><div><p class="eyebrow">THE PEOPLE WHO CALL IT HOME</p><h2>Many shores.<br><em>Many ways to belong.</em></h2></div><a class="text-link" href="#category/people">Explore the peoples <span aria-hidden="true">→</span></a></div><div class="entry-grid home-feature-grid">${['tarvan','vorthani','pocchin'].map(id=>articleCard(byId[id],true)).join('')}</div></section>
 <section class="reading-trails" aria-label="A traveler’s shelf"><a href="#entry/companions"><span class="mono">01 / A LITTLE COMPANY</span><h3>Find someone small.</h3><p>Meet the companions that share island lives.</p><span aria-hidden="true">↗</span></a><a href="#entry/coinage"><span class="mono">02 / BEFORE YOU SET SAIL</span><h3>Learn the everyday.</h3><p>Coins, customs, and a place beside the fire.</p><span aria-hidden="true">↗</span></a><a href="#entry/saurians"><span class="mono">03 / THE LIVING SOUTH</span><h3>Follow the saurians.</h3><p>Seventeen kinds, from the table to the sky.</p><span aria-hidden="true">↗</span></a></section>
 <div class="discovery"><article class="quote-feature"><span class="quote-flower" aria-hidden="true">${icon('flower')}</span><p class="eyebrow">FROM THE MARGINS / THE FLORIANS</p><blockquote>“A whole life,<br>from dawn to dusk.”</blockquote><p>Not every story needs centuries. Meet the day-flowers, small kin of the Liriath who live entirely in the now.</p><a class="text-link" href="#entry/florians">Meet the Florians <span aria-hidden="true">→</span></a></article><section class="questions"><p class="eyebrow">BEGIN WITH A QUESTION</p><a class="question-link" href="#entry/king-tide">Why does the sea rise?<span aria-hidden="true">↗</span></a><a class="question-link" href="#entry/sea-pacts">Who keeps a harbor safe?<span aria-hidden="true">↗</span></a><a class="question-link" href="#entry/hospitality">What do you owe a stranger?<span aria-hidden="true">↗</span></a></section></div>
 </div>`;
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
 const valid=aliases.filter(([,id])=>id!==current&&Pack2.canRead(id));const re=new RegExp('\\b('+valid.map(([name])=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\b','gi');let result='',last=0;
 for(const m of text.matchAll(re)){const found=valid.find(([name])=>fold(name)===fold(m[0]));if(!found)continue;result+=esc(text.slice(last,m.index))+`<a class="wiki-link" href="#entry/${found[1]}">${esc(m[0])}</a>`;last=m.index+m[0].length}
 return emphasis(result+esc(text.slice(last)));
}
function emphasis(html){return html.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g,'$1<em>$2</em>')}
function renderArticleSection(s,i,current){
 if(s.title==='Rumors'||s.title==='Rumores')return Pack2.rumorSection(s,i,current);
 let body=(s.paragraphs||[]).map(p=>'<p>'+linkify(p,current)+'</p>').join('');
 if(s.list?.length)body+='<ul>'+s.list.map(p=>'<li>'+linkify(p,current)+'</li>').join('')+'</ul>';
 if(s.table){
  const t=s.table;
  body+='<div class="article-table-wrap" role="region" aria-label="'+esc(t.caption)+'" tabindex="0"><table class="article-table"><caption>'+esc(t.caption)+'</caption><thead><tr>'+t.headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+t.rows.map(row=>'<tr>'+row.map((cell,j)=>j===0?'<th scope="row">'+linkify(cell,current)+'</th>':'<td>'+linkify(cell,current)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 }
 const box={'Game Master’s secrets':'secret','The Code':'verse','Adventure hooks':'hooks','Tips':'tips','Did you know?':'curio','Ganchos de aventura':'hooks','Consejos':'tips','¿Sabías que?':'curio'}[s.title];
 return '<section id="article-section-'+i+'"'+(box?' class="article-box article-box-'+box+'"':'')+'><h2>'+esc(s.title)+'</h2>'+body+'</section>';
}
function renderArticle(id){
 const e=byId[id];if(!e){renderNotFound();return}if(!Pack2.canRead(id)){Pack2.renderLocked();return}const categoryHref=e.category==='folk'?NotableFolk.returnHref(e):e.foeParent?'#entry/'+e.foeParent:'#category/'+e.category;setNavigation(e.category);$('#breadcrumb').innerHTML=`<a href="#">The world</a><span>/</span><a href="${esc(categoryHref)}">${e.foeParent?esc(byId[e.foeParent].title):categories[e.category].name}</a><span>/</span>${esc(e.title)}`;
 $('#content').innerHTML=`<article class="content-wrap article-wrap"><header class="article-header"><p class="eyebrow">${categories[e.category].short.toUpperCase()} / ${esc(e.region.toUpperCase())}</p><h1>${esc(e.title)}</h1><p class="article-subtitle">${esc(e.subtitle)}</p>${Pack2.header(e)}<p class="article-lead">${esc(e.summary)}</p><div class="article-actions"><button id="save-article" data-save="${e.id}" class="${saved.has(e.id)?'saved':''}" aria-pressed="${saved.has(e.id)}"><span aria-hidden="true">${saved.has(e.id)?'◆':'◇'}</span>${saved.has(e.id)?'Saved to reading list':'Save for later'}</button><button id="copy-link"><span aria-hidden="true">⧉</span> Copy article link</button><span class="mono">THE CHARTED ISLES / 175 EC</span></div></header>${window.NotableFolk?.articleLinks(e)||''}${articleIllustration(e)}${e.id==='northern-frontier'?'<a class="frontier-article-cta" href="#map/northern-frontier">Explore the detailed Northern Frontier chart <span aria-hidden="true">↗</span></a>':''}${Pack2.music(e)}${articleCollection(e)}<div class="article-layout"><div class="article-prose">${e.sections.map((s,i)=>renderArticleSection(s,i,e.id)).join('')}<div class="article-source"><strong>FROM THE WORLD REFERENCE</strong>${esc(e.source)}<br>An explorer’s account of Kalvatar, set in 175 EC.</div></div><aside class="article-side" aria-label="Article reference"><div class="article-facts"><span class="mono">AT A GLANCE</span><dl>${e.facts.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div><nav class="article-toc" aria-label="On this page"><span class="mono">ON THIS PAGE</span>${e.sections.map((s,i)=>`<button data-scroll-section="${i}">${esc(s.title)}</button>`).join('')}</nav></aside></div>${Pack2.extraArt(e)}${articleFieldPlates(e)}${Pack2.notePanel(e)}<section class="article-related"><div class="section-title"><div><p class="eyebrow">ANOTHER THREAD TO FOLLOW</p><h2>Connected to this story.</h2></div></div><div class="related-links">${e.related.map(id=>{const r=byId[id];if(!Pack2.canRead(id))return '<span class="related-link">'+Pack2.text('Uncharted','Sin cartografiar')+'</span>';return `<a class="related-link" href="#entry/${id}"><span><small>${categories[r.category].short} / ${esc(r.region)}</small>${esc(r.title)}</span><span aria-hidden="true">↗</span></a>`}).join('')}</div></section><div class="article-back"><a href="${esc(categoryHref)}">← Back to ${e.foeParent?esc(byId[e.foeParent].title):categories[e.category].name.toLowerCase()}</a><button class="text-link" data-random>Another discovery ⤨</button></div></article>`;
 $('#save-article').addEventListener('click',()=>{const present=saved.has(e.id);if(present)saved.delete(e.id);else saved.add(e.id);saveList();const b=$('#save-article');b.classList.toggle('saved',!present);b.setAttribute('aria-pressed',String(!present));b.innerHTML=`<span aria-hidden="true">${!present?'◆':'◇'}</span>${!present?'Saved to reading list':'Save for later'}`;toast(readingStorage?(present?'Removed from your reading list.':'Saved for your next visit.'):'Saved for this visit. This browser could not keep the reading list.')});
 $('#copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);toast('Article link copied.')}catch(err){toast('Copy the article’s address from your browser to share it.')}});
}
const regions=[{id:'northern-frontier',x:30,y:34,places:['ironfort','tarvan','aurocs']},{id:'heartland',x:53,y:51,places:['goldwind','highspire','everfall']},{id:'southern-wilds',x:28,y:70,places:['jakupur','cathedral-green','liriath']},{id:'icy-expanse',x:59,y:89,places:['varan-port','auroral-vault','hospitality']},{id:'coral-kingdoms',x:77,y:64,places:['sea-pacts','coral-peoples','starfall-reef']},{id:'below',surface:false,places:['sporrn','haulbeetle','lantern-mouse']}];
function renderAtlas(){
 setNavigation('atlas');mapZoom=1;mapX=0;mapY=0;$('#breadcrumb').innerHTML='<a href="#">The world</a><span>/</span> World atlas';
 $('#content').innerHTML=`<div class="content-wrap"><div class="page-intro"><p class="eyebrow">THE WORLD / A REGIONAL CHART</p><h1>The sea between <em>everything.</em></h1><p>Follow the archipelago south, from the Frontier to the edge of the ice. Choose a region to see the stories waiting there.</p></div><nav class="map-region-tabs" aria-label="Regions of Kalvatar">${regions.map(r=>`<button data-region="${r.id}" aria-pressed="false">${esc(Pack2.canRead(r.id)?byId[r.id].title:Pack2.text('Uncharted','Sin cartografiar'))}</button>`).join('')}</nav><div class="map-layout"><div class="world-chart"><div class="map-viewport" id="map-viewport" tabindex="0" aria-label="Interactive regional map. Use the zoom buttons and drag to move. Arrow keys pan; plus and minus zoom."><div class="map-grid"></div><div class="map-layer" id="map-layer">${mapSvg('atlas')}${regions.filter(r=>r.surface!==false).map(r=>`<button class="region-pin" data-region="${r.id}" style="left:${r.x}%;top:${r.y}%" aria-label="Explore ${esc(Pack2.canRead(r.id)?byId[r.id].title:Pack2.text('Uncharted','Sin cartografiar'))}">${esc(Pack2.canRead(r.id)?byId[r.id].title.replace('The ',''):Pack2.text('Uncharted','Sin cartografiar'))}</button>`).join('')}</div><div class="map-frame"></div><div class="map-rose">${icon('compass')}</div><div class="map-controls" aria-label="Map controls"><button data-zoom="in" aria-label="Zoom in">+</button><button data-zoom="out" aria-label="Zoom out">−</button><button data-zoom="reset">RESET</button></div><span class="map-scale" id="map-scale">REGIONAL CHART / 100%</span></div><div class="map-caption">Original world geography. Choose a region for its named places. This chart shows the surface; Below has no surface position.</div></div><aside class="map-detail"><div class="region-detail" id="region-detail"></div><div class="map-tip"><span class="mono">A CHARTWRIGHT’S NOTE</span><p>A map tells you where to begin. The articles tell you what an islander knows, believes, or has heard.</p><p>Zoom with + and −. Drag the chart to follow the coastline. Reset returns to the full archipelago.</p></div></aside></div></div>`;
 setRegion('heartland');
 const vp=$('#map-viewport');let drag=null;
 vp.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,startX:mapX,startY:mapY};vp.setPointerCapture(e.pointerId)});
 vp.addEventListener('pointermove',e=>{if(!drag)return;mapX=drag.startX+e.clientX-drag.x;mapY=drag.startY+e.clientY-drag.y;applyMapTransform()});
 function release(){drag=null}vp.addEventListener('pointerup',release);vp.addEventListener('pointercancel',release);vp.addEventListener('lostpointercapture',release);
 vp.addEventListener('keydown',e=>{if(e.target.tagName==='BUTTON')return;const actions={ArrowUp:()=>mapY+=25,ArrowDown:()=>mapY-=25,ArrowLeft:()=>mapX+=25,ArrowRight:()=>mapX-=25,'+':()=>zoomMap('in'),'=':()=>zoomMap('in'),'-':()=>zoomMap('out')};if(actions[e.key]){e.preventDefault();actions[e.key]();applyMapTransform()}});
}
function setRegion(id){
 const e=byId[id],region=regions.find(r=>r.id===id);if(!e||!region)return;
 if(!Pack2.canRead(id)){$('#region-detail').innerHTML=Pack2.lockedCard();return}
 document.querySelectorAll('[data-region]').forEach(el=>{const yes=el.dataset.region===id;el.classList.toggle('active',yes);el.setAttribute('aria-pressed',String(yes))});
 const localIds=[...new Set([...region.places,...entries.filter(x=>x.category==='place'&&x.region===e.region&&x.id!==id).map(x=>x.id)])].filter(id=>byId[id]&&Pack2.canRead(id));
 $('#region-detail').innerHTML=`<p class="eyebrow">THE REGIONS / SELECTED</p><h2>${esc(e.title)}</h2><p>${esc(e.summary)}</p>${region.surface===false?'<p class="below-chart-note">This chart shows the surface. Below lies beneath the islands and has no surface marker.</p>':''}${id==='northern-frontier'?'<a class="button" href="#map/northern-frontier">Open detailed regional chart <span>↗</span></a>':''}<a class="button" href="#entry/${e.id}">Explore this region <span>↗</span></a><div class="map-region-list"><p>PLACES AND LOCAL THREADS</p>${localIds.map(id=>`<a class="question-link" style="font-size:17px;padding:12px 0;min-height:0" href="#entry/${id}">${esc(byId[id].title)}<span>↗</span></a>`).join('')}<p style="margin-top:23px">OR CHOOSE ANOTHER REGION</p>${regions.map(r=>`<button data-region="${r.id}" aria-pressed="${r.id===id}" class="${r.id===id?'active':''}">${esc(Pack2.canRead(r.id)?byId[r.id].title:Pack2.text('Uncharted','Sin cartografiar'))}<span>→</span></button>`).join('')}</div>`;
}
function applyMapTransform(){const layer=$('#map-layer');if(!layer)return;const box=$('#map-viewport').getBoundingClientRect();const maxX=box.width*(mapZoom-1)/2+box.width*.25;const maxY=box.height*(mapZoom-1)/2+box.height*.25;mapX=Math.max(-maxX,Math.min(maxX,mapX));mapY=Math.max(-maxY,Math.min(maxY,mapY));layer.style.transform=`translate(${mapX}px,${mapY}px) scale(${mapZoom})`;$('#map-scale').textContent=`REGIONAL CHART / ${Math.round(mapZoom*100)}%`}
function zoomMap(direction){if(direction==='reset'){mapZoom=1;mapX=0;mapY=0}else mapZoom=Math.max(1,Math.min(3.5,mapZoom+(direction==='in'?.35:-.35)));applyMapTransform()}

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
 else if(view==='atlas'){renderAtlas();document.title='World atlas | Kalvatar'}
 else if(view==='map'){renderRegionalChart(parts[1]);document.title='Northern Frontier chart | Kalvatar'}
 else if(view==='browse'){renderDirectory();document.title='All entries | Kalvatar'}
 else if(view==='category'&&parts[1]==='folk'){NotableFolk.render(parts[2]||'');document.title=NotableFolk.title(parts[2])+' | Kalvatar'}
 else if(view==='category'&&categories[parts[1]]){renderDirectory(parts[1]);document.title=categories[parts[1]].name+' | Kalvatar'}
 else if(view==='saved'){renderDirectory('all','',true);document.title='Your reading list | Kalvatar'}
 else if(view==='search'){let query='';try{query=decodeURIComponent(parts.slice(1).join('/'))}catch(e){}renderDirectory('all',query);document.title='Search | Kalvatar'}
 else if(!view){renderHome();document.title='Kalvatar | The Living Atlas'}else{renderNotFound();document.title='Uncharted | Kalvatar'}
 window.scrollTo({top:0,behavior:'instant'});$('#content').focus({preventScroll:true});Pack2.afterRoute();
}
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
document.addEventListener('click',e=>{const link=e.target.closest('a[href]');if(link?.getAttribute('href')==='#content'){e.preventDefault();$('#content').focus();$('#content').scrollIntoView();return}if(link){if($('#search-dialog').open)$('#search-dialog').close();if(link.getAttribute('href')===location.hash)closeMenu()}const close=e.target.closest('[data-close-search]');if(close)$('#search-dialog').close();const random=e.target.closest('[data-random]');if(random&&entries.length){const available=entries.filter(x=>Pack2.canRead(x.id)&&location.hash!==`#entry/${x.id}`);if(!available.length)return;location.hash=`entry/${available[Math.floor(Math.random()*available.length)].id}`}const pin=e.target.closest('[data-region]');if(pin)setRegion(pin.dataset.region);const zoom=e.target.closest('[data-zoom]');if(zoom)zoomMap(zoom.dataset.zoom);const section=e.target.closest('[data-scroll-section]');if(section)document.getElementById('article-section-'+section.dataset.scrollSection)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})});
$('#search-dialog').addEventListener('click',e=>{if(e.target===$('#search-dialog')){const r=$('#search-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#search-dialog').close()}});
window.addEventListener('hashchange',route);
const entryIllustrations = {
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
 'kaldmark': [['kaldmark-black-keep', 'The black keep', 'La fortaleza negra', 'Travelers approach the gate of Kaldmark beneath a bear-skull banner.', 'Unos viajeros se acercan al portón de Kaldmark bajo un estandarte con un cráneo de oso.']],
 'widows-teeth': [['widows-teeth-pilot-boat', 'A pilot boat through the Teeth', 'Una lancha de prácticos entre los Dientes', 'A pilot boat threads the channel between the jagged rocks of the Widow’s Teeth.', 'Una lancha de prácticos cruza el canal entre los farallones de los Dientes de la Viuda.']]
};

function applyEntryIllustrations(entries) {
 for (const entry of entries) {
  for (const [filename, label, labelEs, caption, captionEs] of galleryScenes[entry.id] ?? []) {
   const base = `assets/scenes/${filename}`;
   entry.gallery = [...(entry.gallery || []), {
    thumb: base + '-480.webp', src: base + '-960.webp', full: base + '-1536.webp',
    width: 1536, height: 1024,
    get label() { return Pack2.text(label, labelEs); },
    get alt() { return Pack2.text(caption, captionEs); },
    get caption() { return Pack2.text(caption, captionEs); }
   }];
  }
  const illustration = entryIllustrations[entry.id];
  if (!illustration) continue;
  const [directory, caption, captionEs, filename = entry.id] = illustration;
  const base = `assets/${directory}/${filename}`;
  entry.illustration = {
   thumb: base + '-480.webp', src: base + '-960.webp', full: base + '-1536.webp',
   width: 1536, height: 1024,
   get alt() { return Pack2.text(caption, captionEs); },
   get caption() { return Pack2.text(caption, captionEs); }
  };
 }
}
(async()=>{try{
 const response=await fetch('entries.json?v=53');if(!response.ok)throw new Error('Atlas unavailable');const input=await response.json();applyEntryIllustrations(input);entries=await Pack2.prepare(input);await window.AtlasLibrary?.ready;byId=Object.fromEntries(entries.map(e=>[e.id,e]));
 const optional=async name=>{try{const r=await fetch(name+'?v=53');const data=r.ok?await r.json():[];return Array.isArray(data)?data:[]}catch{return []}};
 [rumors,timeline]=await Promise.all([optional('rumors.json'),optional('timeline.json')]);
 for(const e of entries)e.searchText=fold([e.title,e.summary,e.subtitle,e.region,categories[e.category].name,...(e.aliases||[]),...e.sections.flatMap(s=>[s.title,...(s.paragraphs||[]),...(s.list||[]),...(s.table?[s.table.caption,...s.table.headers,...s.table.rows.flat()]:[])]),...e.facts.flat(),creatureKinds[e.creatureKind]||''].join(' '));
 saved=new Set([...saved].filter(id=>byId[id]));buildAliases();renderMainNavigation();Pack2.nav();updateSavedCount();route();
 }catch(error){$('#content').innerHTML='<div class="loading">The atlas could not be opened.<br>Please reload the page to try again.</div>';console.error(error)}})();

// The illustration viewer preserves the complete composition at every screen size.
document.addEventListener('click',event=>{const open=event.target.closest('[data-open-art]');if(open)openIllustration(open.dataset.openArt,Number(open.dataset.artIndex||0));if(event.target.closest('[data-close-art]'))$('#illustration-dialog').close()});
$('#illustration-dialog').addEventListener('click',event=>{if(event.target!==$('#illustration-dialog'))return;const box=event.target.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)event.target.close()});
