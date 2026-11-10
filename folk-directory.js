/* Public editorial circles. Membership is explicit, never inferred from a name or rumor. */
(function () {
 'use strict';
 const groups = [
  {id:'arbiters',name:'Arbiters',icon:'book',description:'The newly chosen public officers of the 175 EC term.',members:['radan-sunmere','lysandra-vellune','kettik-ninth-step']},
  {id:'nobles',name:'Nobles & houses',icon:'shield',description:'Rulers, heirs and lives shaped by a great house.',members:['hadros-morvain','johann-faust','halsof-varselis','horace-goldspire','maera-blackstrand','ottilie-veldane','edran-holst','zyanya-greymoor','runa-kaldmark','lucan-alastor','reinhardt-holst','caelan-caelius','hyacinth-alastor']},
  {id:'hunters',name:'Hunters',icon:'compass',description:'Lodge names, celebrated captains and crews of the Board.',members:['albion-tempest','johann-faust','lactinius-windcaller','reinhardt-holst','titania-and-the-iron-swan','captain-magnus-and-leoric','captain-bramgard','banestorm-brothers','khaz-aimar-maa-iq','sandros-magnus','avalan-grant','odessa-braith','rhona-cravoch','lucan-alastor','robin-faust','crys','erulisse','silver-stingray','dalan-sylenas']},
  {id:'armada',name:'The Armada',icon:'map',description:'The High Command, fleet officers and names from naval history.',members:['arios-and-alina-fafner','kalivos-durant','serane-marr','brigid-thane','edran-holst','the-shroud','dastan-graylock','falken-brightsight','zeras-durant','enara-torraflame','uha-farsight','zyanya-greymoor','runa-kaldmark','skarrei-ninth-squall','zophiel','hoskelis-torraflame','maelis-windleaf','asim-kelu-manutar','kizur-malekium','innaro-of-the-fifteenth','admiral-thulissa']},
  {id:'university',name:'University & scholars',icon:'book',description:'The University’s leadership, librarians and keepers of learning.',members:['thessaly-kane','elizabeth-ravenwolf']},
  {id:'council',name:'The Council',icon:'shield',description:'The five seats and the people who speak at their table.',members:['halsof-varselis','lactinius-windcaller','horace-goldspire','arios-and-alina-fafner','thessaly-kane']},
  {id:'trade',name:'Merchants & guilds',icon:'map',description:'Exchange voices, guild leaders and traders on the road.',members:['hugo-goldvein','viktor-goldvein','rhal','horace-goldspire','maera-blackstrand','imelda-roque','morgha-wall-holder','ioranger-lyrianis']},
  {id:'faith',name:'Faith & folklore',icon:'moon',description:'Priests, keepers of rites and the islands’ stranger stories.',members:['alesse-brightwater','ondrel-greywake','noel','nikya','fishbread']},
  {id:'adventurers',name:'Adventurers & wanderers',icon:'compass',description:'Traveling companions, independent blades and unfinished journeys.',members:['lyle-lynch','mithras-steelheart','agari','cassian-virel','otto-van-galen','beck','grolsh','reinhardt-holst','ninthalarion','noel','merla-ciel-tealeaf','mako-rodis-patches','coralie-calloway','robin-faust','crys','araye-moss','astra','harkmir','juanillo','zumito','ibraprime','art-losa','nikya','ioranger-lyrianis','elizabeth-ravenwolf','silver-stingray','dalan-sylenas','caelan-caelius','kiel-keyron','hyacinth-alastor','luralana-nightingale']},
  {id:'underworld',name:'Underworld & mysteries',icon:'moon',description:'Black-market power and names whispered in the fog.',members:['veyren-quill','mother-kess','midnight-patron','the-registrar']}
 ];
 const index = new Map(groups.map(group=>[group.id,group]));
 const PAGE_SIZE = 12;
 const returnLinks = new Map();
 const h = value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const href = (id, {query='', region='', sort='az', limit=PAGE_SIZE}={}) => {
  const params = new URLSearchParams();
  if(query.trim()) params.set('q',query.trim());
  if(region) params.set('region',region);
  if(sort!=='az') params.set('sort',sort);
  if(limit>PAGE_SIZE) params.set('show',limit);
  const suffix=params.toString().replace(/\+/g,'%20');
  return '#category/folk'+(id||suffix?'/'+(id||'all'):'')+(suffix?'?'+suffix:'');
 };
 function forPerson(id) { return groups.filter(group=>group.members.includes(id)); }
 function select(list,id,canRead=()=>true) {
  const group=index.get(id);
  return list.filter(entry=>entry.category==='folk'&&canRead(entry.id)&&(!id||group?.members.includes(entry.id)));
 }
 function title(id='') { return index.get(id.split('?')[0])?.name||'Notable folk'; }
 function returnHref(entry) {
  return returnLinks.get(entry.id)||href('');
 }
 function articleLinks(entry) {
  if(entry.category!=='folk')return '';
  return '<nav class="folk-article-groups" aria-label="Explore this person’s circles"><span class="mono">FILED UNDER</span>'+forPerson(entry.id).map(group=>'<a href="'+href(group.id)+'">'+h(group.name)+' <span aria-hidden="true">↗</span></a>').join('')+'</nav>';
 }
 function render(request='') {
  const [routeId,queryString='']=request.split('?');
  const groupId=routeId==='all'?'':routeId;
  const params=new URLSearchParams(queryString);
  const requestedRegion=params.get('region');
  if(groupId&&!index.has(groupId)){renderNotFound();return;}
  const group=index.get(groupId);
  const state={query:(params.get('q')||'').slice(0,120),region:'',sort:params.get('sort')==='illustrated'?'illustrated':'az',limit:PAGE_SIZE};
  const all=entries.filter(entry=>entry.category==='folk');
  const readable=()=>select(all,'',id=>Pack2.canRead(id));
  const scope=()=>select(all,groupId,id=>Pack2.canRead(id));
  const sourceRegions=[...new Set(readable().flatMap(entry=>[entry.region,...(entry.regions||[])]))].filter(region=>region!=='All regions').sort();
  if(sourceRegions.includes(requestedRegion))state.region=requestedRegion;
  const requestedLimit=Number(params.get('show'));
  if(Number.isSafeInteger(requestedLimit)&&requestedLimit>PAGE_SIZE)state.limit=Math.min(requestedLimit,all.length);
  const overviewHref=href('',{...state,limit:PAGE_SIZE});
  function update() {
   history.replaceState(history.state,'',href(groupId,state));
   draw();
  }
  setNavigation('folk');
  $('#breadcrumb').innerHTML='<a href="#">The world</a><span>/</span>'+(group?'<a href="'+overviewHref+'">Notable folk</a><span>/</span>'+h(group.name):'Notable folk');
  $('#content').innerHTML='<div class="content-wrap folk-directory"><header class="folk-heading"><div><p class="eyebrow">THE PEOPLE OF KALVATAR</p><h1>'+h(title(groupId))+'</h1><p>'+(group?h(group.description):'Find your way through the houses, Lodges, fleets and lives that shape the islands.')+'</p></div><span class="folk-heading-mark" aria-hidden="true">'+icon(group?.icon||'leaf')+'</span></header>'+
   (group?'<a class="folk-back text-link" href="'+overviewHref+'">← All notable folk groups</a>':'')+
   '<div class="folk-tools"><label class="directory-search"><span aria-hidden="true">⌕</span><input id="folk-search" type="search" maxlength="120" aria-label="'+(group?'Search '+h(group.name):'Search all notable folk')+'" placeholder="'+(group?'Find someone in this group…':'Find someone across all groups…')+'"></label><div class="folk-refinements">'+
   '<label>Group<select id="folk-group" aria-label="Notable folk group"><option value="">All groups</option>'+groups.map(item=>'<option value="'+item.id+'" '+(item.id===groupId?'selected':'')+'>'+h(item.name)+'</option>').join('')+'</select></label>'+
   '<label>Region<select id="folk-region" aria-label="Notable folk region"><option value="">All regions</option>'+sourceRegions.map(region=>'<option value="'+h(region)+'" '+(region===state.region?'selected':'')+'>'+h(region)+'</option>').join('')+'</select></label><label id="folk-sort-label" '+(!group?'hidden':'')+'>Sort<select id="folk-sort" aria-label="Sort notable folk"><option value="az">Title A to Z</option><option value="illustrated">Illustrated first</option></select></label><button id="folk-reset" type="button" disabled>Clear filters</button></div></div>'+
   '<div class="folk-result-status"><p class="mono" id="folk-status" role="status" aria-live="polite"></p><p id="folk-overlap-note">People can appear in more than one group.</p></div><nav class="folk-group-grid" id="folk-groups" aria-label="Notable folk groups"></nav><section id="folk-results" aria-label="Notable folk results"></section><div id="folk-uncharted"></div></div>';
  $('#folk-search').value=state.query;
  $('#folk-sort').value=state.sort;
  const matchesFilters=entry=>(!state.region||entry.region===state.region||entry.region==='All regions'||entry.regions?.includes(state.region))&&matches(entry,state.query);
  function draw() {
   const searching=state.query.trim().length>0;
   const overview=!group&&!searching;
   const count=readable().filter(matchesFilters).length;
   $('#folk-sort-label').hidden=overview;
   $('#folk-overlap-note').hidden=!overview;
   $('#folk-groups').hidden=!overview;
   $('#folk-reset').disabled=!state.query&&!state.region&&state.sort==='az';
   $('#folk-uncharted').innerHTML='';
   if(overview){
    $('#folk-status').textContent=count+' '+(count===1?'PERSON':'PEOPLE')+' / '+groups.length+' GROUPS';
    $('#folk-groups').innerHTML=groups.map((item,i)=>{
     const total=select(all,item.id,id=>Pack2.canRead(id)).filter(matchesFilters).length;
     return '<a class="folk-group-card" href="'+href(item.id,{region:state.region,sort:state.sort})+'"><div class="folk-group-top"><span class="folk-group-icon">'+icon(item.icon)+'</span><span class="mono">'+total+' '+(total===1?'PERSON':'PEOPLE')+'</span></div><h2>'+h(item.name)+'</h2><p>'+h(item.description)+'</p><span class="folk-group-open">Explore group <span aria-hidden="true">↗</span></span></a>';
    }).join('');
    $('#folk-results').innerHTML='';
    const locked=all.length-readable().length;
    if(locked)$('#folk-uncharted').innerHTML='<p class="folk-locked-note">✧ '+locked+' '+Pack2.text('people remain uncharted for this campaign.','personajes siguen sin cartografiar en esta campaña.')+'</p>';
    return;
   }
   const found=scope().filter(matchesFilters).sort((a,b)=>(state.sort==='illustrated'?Number(!!b.illustration)-Number(!!a.illustration):0)||a.title.localeCompare(b.title));
   $('#folk-status').textContent=found.length+' '+(found.length===1?'PERSON':'PEOPLE')+(searching||state.region?' FOUND':' IN THIS GROUP');
   if(!found.length){
    $('#folk-results').innerHTML='<div class="empty-state"><span aria-hidden="true">✦</span><h2>No one on this trail yet.</h2><p>Try another name or region. In a campaign, only discovered people appear.</p><a class="button" href="'+href('')+'">Browse the groups <span aria-hidden="true">→</span></a></div>';
    return;
   }
   $('#folk-results').innerHTML='<div class="entry-grid directory-grid">'+found.slice(0,state.limit).map(entry=>articleCard(entry)).join('')+'</div>'+(found.length>state.limit?'<button id="folk-more" class="load-more">Show more people ('+(found.length-state.limit)+' remaining) ↓</button>':'');
   $('#folk-more')?.addEventListener('click',()=>{const previous=state.limit;state.limit+=PAGE_SIZE;update();document.querySelectorAll('#folk-results .entry-card')[previous]?.focus({preventScroll:true});});
  }
  $('#folk-results').addEventListener('click',event=>{
   const card=event.target.closest('.entry-card');
   const destination=card?.getAttribute('href')||'';
   if(destination.startsWith('#entry/'))returnLinks.set(destination.slice(7),href(groupId,state));
  });
  $('#folk-search').addEventListener('input',event=>{state.query=event.target.value;state.limit=PAGE_SIZE;update();});
  $('#folk-region').addEventListener('change',event=>{state.region=event.target.value;state.limit=PAGE_SIZE;update();});
  $('#folk-sort').addEventListener('change',event=>{state.sort=event.target.value;state.limit=PAGE_SIZE;update();});
  $('#folk-group')?.addEventListener('change',event=>{location.hash=href(event.target.value,{...state,limit:PAGE_SIZE});});
  $('#folk-reset').addEventListener('click',()=>{state.query='';state.region='';state.sort='az';state.limit=PAGE_SIZE;$('#folk-search').value='';$('#folk-region').value='';$('#folk-sort').value='az';update();});
  draw();
 }
 window.NotableFolk={groups,select,forPerson,title,articleLinks,returnHref,render};
})();

