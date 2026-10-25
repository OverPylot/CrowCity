// Ködvidék generator v1. No network calls. All generated content uses this seed.
export const VERSION = 1;
export const DEFAULTS = {
  city: { seed: 'HOLLÓRÉV-27', size: 'town', density: 3, terrain: 'river', era: 'medieval', walls: true },
  dungeon: { seed: 'HOLLÓRÉV-27', theme: 'crypt', rooms: 14, complexity: 'branching', danger: 'medium', secrets: true }
};
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n = value => Number(value.toFixed(2));
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export function hash(value) { let h = 2166136261; for (const c of String(value)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function random(seed) { let state = hash(seed); return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const int = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
const choose = (value, options, fallback) => options.includes(value) ? value : fallback;
export function normalizeSettings(type, raw = {}) {
  const base = DEFAULTS[type];
  const seed = String(raw.seed ?? base.seed).trim().slice(0, 80) || base.seed;
  if (type === 'city') return { seed, size: choose(raw.size, ['village','town','city'], base.size), density: clamp(Math.round(Number(raw.density) || 3), 1, 5), terrain: choose(raw.terrain, ['river','plain','hills'], base.terrain), era: choose(raw.era, ['medieval','victorian'], base.era), walls: typeof raw.walls === 'boolean' ? raw.walls : base.walls };
  return { seed, theme: choose(raw.theme, ['crypt','ruins','cave'], base.theme), rooms: clamp(Math.round(Number(raw.rooms) || 14), 8, 28), complexity: choose(raw.complexity, ['linear','branching','maze'], base.complexity), danger: choose(raw.danger, ['low','medium','high'], base.danger), secrets: typeof raw.secrets === 'boolean' ? raw.secrets : base.secrets };
}
const linePath = points => points.map((p,i) => `${i ? 'L' : 'M'}${n(p.x)},${n(p.y)}`).join(' ');
const polyPoints = points => points.map(p => `${n(p.x)},${n(p.y)}`).join(' ');
function segmentDistance(p, a, b) { const dx=b.x-a.x, dy=b.y-a.y; const t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy || 1),0,1); return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy); }
function roadDistance(p, roads) { let best={distance:Infinity,angle:0}; for (const road of roads) for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],d=segmentDistance(p,a,b)-road.width/2;if(d<best.distance)best={distance:d,angle:Math.atan2(b.y-a.y,b.x-a.x)};} return best; }
function outlinePoint(shape, angle, factor=1){const wobble=1+.035*Math.sin(3*angle+shape.phase)+.025*Math.sin(7*angle+shape.phase/2);return{x:shape.cx+Math.cos(angle)*shape.rx*wobble*factor,y:shape.cy+Math.sin(angle)*shape.ry*wobble*factor};}
function insideTown(shape,p,margin=0){const a=Math.atan2((p.y-shape.cy)/shape.ry,(p.x-shape.cx)/shape.rx),w=1+.035*Math.sin(3*a+shape.phase)+.025*Math.sin(7*a+shape.phase/2);return Math.hypot((p.x-shape.cx)/(shape.rx-margin),(p.y-shape.cy)/(shape.ry-margin))<w;}
const riverX = y => 789 + 24*Math.sin(y/123) + 13*Math.sin(y/60);

const cityNames = ['Hollórév','Kőrisvár','Ködkapu','Varjúhalom','Szürkerév','Fenyőliget','Deresvölgy','Holdkő','Borostyánvár','Ezüstgázló','Harmatvég','Feketefenyő'];
const cityDescriptions = [
  { type:'Fogadó', name:'Az Öreg Holló', description:'Alacsony gerendák, lassan parázsló kandalló és friss kenyér illata fogad. Az ablak melletti asztalnál mindig ül valaki, aki túl sokat tud.', fact:'Mara, a fogadós emlékszik minden vendég nevére.', secret:'A pince egyik boroshordója mögött régi csempészjárat nyílik. Mara csak azoknak mutatja meg, akik visszahozzák az eltűnt testvérét.' },
  { type:'Piactér', name:'A Harangok tere', description:'Vászonponyvákkal fedett standok sorakoznak a kőkút körül. Délben a kereskedők egy percre elhallgatnak, amíg megkondul az öreg harang.', fact:'A téren árusító vak jós érmék helyett történeteket kér.', secret:'A kút falán dagálykor friss karcolások jelennek meg. A víz alatti vasajtót belülről zárták be.' },
  { type:'Templom', name:'Az Őrző fénye', description:'Keskeny ablakokon érkezik a fény a csendes templomhajóba. A lépcsőn elkopott kövek mutatják, milyen sokan kerestek itt menedéket.', fact:'Elian gondnok minden este eggyel több gyertyát gyújt meg.', secret:'A legutóbbi felújításkor lefalaztak egy lépcsőt a szentély alatt. A gondnok éjjelente onnan hallja a nevét.' },
  { type:'Kúria', name:'Szélcsend-kúria', description:'Vaskapu mögött szigorú homlokzat és gondozott udvar áll. Az előcsarnok portréin a család minden tagja ugyanazt az ezüst jelvényt viseli.', fact:'Az intéző csak előzetes meghívóval enged be látogatót.', secret:'A család feje hónapok óta halott. Az intéző hamis levelekkel tartja fenn a rendet, amíg megtalálja az elveszett örököst.' },
  { type:'Műhely', name:'A Három Szikra', description:'Kalapácsütések és szénfüst jelzik a műhely helyét. A falon patkók, szerszámok és egy félbehagyott, szokatlanul keskeny kard függ.', fact:'Rovan kovács egy különös ércdarabért cserébe ingyen dolgozna.', secret:'A műhely alatt talált fekete érc meleg marad akkor is, ha napokra vízbe teszik. A kovács tanítványa álmában ugyanazt a föld alatti termet rajzolja.' },
  { type:'Temető', name:'A Csend kertje', description:'A kopott sírkövek között kavicsos ösvény kanyarog. A legrégebbi sírok neveit szándékosan vésték le, a virágok mégis mindig frissek.', fact:'Az öreg sírásó szerint a kertben sosem szólalnak meg madarak.', secret:'Három friss sír üres. A halottakat a városi őrség egyik tisztje vitette el hajnal előtt, lepecsételt paranccsal.' },
  { type:'Kikötő', name:'A Ködlámpás', description:'Kötelek nyikorognak a stég cölöpjein, raktárak tükröződnek a lassú vízen. A révész alkonyat után csak párosával visz utasokat.', fact:'Egy jelöletlen csónak minden harmadik éjszaka kiköt a hátsó stégnél.', secret:'A révész a folyó túlpartján eltűnt falu egyetlen túlélője. Az éjszakai utasok nem beszélnek, és sosem hagynak lábnyomot.' },
  { type:'Őrház', name:'Az Alkony kapuja', description:'A kapuőrség vaskályhája télen-nyáron meleg. A falon kifüggesztett térképen néhány útvonalat vastag tintával áthúztak.', fact:'Az őrkapitány fizetséget ajánl egy eltűnt futár felkutatásáért.', secret:'A futár üzenete az őrkapitány ellen szóló bizonyítékokat tartalmaz. A kapitány abban reménykedik, hogy a csapat bontatlanul hozza vissza.' }
];
export function generateCity(settings) {
  settings=normalizeSettings('city',settings);
  const rng=random('city-v1|'+JSON.stringify(settings));
  const factor={village:.76,town:.91,city:1}[settings.size];
  const shape={cx:478,cy:363,rx:326*factor,ry:266*factor,phase:rng()*6.28};
  const boundary=Array.from({length:128},(_,i)=>outlinePoint(shape,i/128*Math.PI*2));
  const gateCount=settings.size==='village'?4:7;
  const roads=[],gates=[];
  const offset=rng()*.2-.1;
  for(let i=0;i<gateCount;i++){
    const angle=i/gateCount*Math.PI*2+offset;
    const end=outlinePoint(shape,angle,1.015);
    const points=[{x:shape.cx,y:shape.cy}];
    for(let j=1;j<=4;j++){const p=outlinePoint(shape,angle,j/4*1.015);if(j<4){p.x+=(rng()-.5)*24;p.y+=(rng()-.5)*24;}points.push(p);}
    roads.push({points,width:i%2===0?12:9,main:true});
    gates.push({...end,angle});
  }
  for(const radius of [0.47,0.78]){
    const points=Array.from({length:65},(_,i)=>{const a=i/64*Math.PI*2;const p=outlinePoint(shape,a,radius*(1+.05*Math.sin(a*5+shape.phase)));return p;});
    roads.push({points,width:radius<.5?7:6,main:false});
  }
  for(let i=0;i<9;i++){
    const a=(i+.5)/9*Math.PI*2;
    roads.push({points:[outlinePoint(shape,a,.48),outlinePoint(shape,a+.09,.65),outlinePoint(shape,a+.04,.93)],width:5,main:false});
  }
  const f=(x,y)=>({x:shape.cx+(x-478)*factor,y:shape.cy+(y-363)*factor});
  const positions=[f(407,402),f(478,363),f(567,291),f(463,177),f(293,427),f(310,242),f(697,424),f(616,545)];
  const places=cityDescriptions.map((p,i)=>({...p,id:`c${i+1}`,number:i+1,...positions[i],hidden:false,notes:''}));
  if(settings.terrain!=='river'){places[6]={...places[6],type:'Csarnok',name:'A Vándorok csarnoka',description:'Utazó kereskedők és messziről érkezett hírnökök váltják egymást a boltíves csarnokban. A bejárat mellett minden nap új hirdetmények jelennek meg.',fact:'Egy térképész fizetne egy közeli romvidék pontos felméréséért.',secret:'A csarnok raktárában egy lefoglalt láda áll. Senki sem vállalja érte a felelősséget, bár minden éjjel hallatszik belőle valaki lélegzete.'};}
  if(settings.era==='victorian'){places[4].name='A Füst és Réz műhelye';places[4].type='Gépműhely';places[4].description='Szelepek sziszegnek és olajszag lengi be a téglafalú műhelyt. A munkapadon szétszerelt óraszerkezet és egy saját magát rajzoló mechanikus kéz hever.';places[2].name='A Hajnal kápolnája';}
  // Reserve landmark footprints and the main square before packing houses.
  const buildings=[];
  const target=Math.round(({village:110,town:220,city:340}[settings.size])*(.62+settings.density*.16));
  for(let i=0;i<target*65 && buildings.length<target;i++){
    const p={x:shape.cx+(rng()*2-1)*shape.rx,y:shape.cy+(rng()*2-1)*shape.ry};
    const w=int(rng,9,20),h=int(rng,8,15),radius=Math.hypot(w,h)/2;
    if(!insideTown(shape,p,radius+10))continue;
    if(settings.terrain==='river' && Math.abs(p.x-riverX(p.y))<53+radius)continue;
    if(Math.hypot((p.x-shape.cx)/1.3,p.y-shape.cy)<29+radius)continue;
    if(places.some(pl=>Math.hypot(p.x-pl.x,p.y-pl.y)<(pl.type==='Temető'?35:21)+radius))continue;
    const nearest=roadDistance(p,roads);if(nearest.distance<radius+1.8)continue;
    if(buildings.some(b=>Math.hypot(p.x-b.x,p.y-b.y)<radius+b.r+2))continue;
    buildings.push({...p,w,h,r:radius,angle:nearest.angle*180/Math.PI+(settings.era==='victorian'?0:(rng()-.5)*13),kind:rng()});
  }
  const trees=[];
  for(let i=0;i<120;i++){
    const p={x:60+rng()*870,y:70+rng()*580};
    if(insideTown(shape,p,-14))continue;
    if(settings.terrain==='river' && Math.abs(p.x-riverX(p.y))<58)continue;
    if(gates.some(g=>segmentDistance(p,g,{x:g.x+Math.cos(g.angle)*130,y:g.y+Math.sin(g.angle)*130})<17))continue;
    if(p.x>835&&p.y<230)continue;
    trees.push({...p,r:int(rng,4,8),kind:rng()});
  }
  const title=settings.seed==='HOLLÓRÉV-27'?'Hollórév':pick(rng,cityNames);
  const people=Math.round((buildings.length*int(rng,5,9)+int(rng,100,350))/10)*10;
  return {type:'city',settings,title,places,shape,boundary,roads,gates,buildings,trees,people,wards:settings.size==='village'?3:5,version:VERSION};
}

const roomNames={crypt:['Az alászállás','Őrök nyughelye','A néma kar','A gyertyák terme','Törött pecsét','Az emlékezés kútja','Csontok folyosója','Az utolsó fogadalom','Fekete ereklyetár','A kőbe zárt név','A hamvak oltára','A feledés terme','A Hold sírja','Árnyékok terme','A titkos ravatal','Az ezüst könnyek'],ruins:['A leszakadt kapu','Régi őrszoba','Az üres fegyvertár','A poros tanácsterem','A repedt ciszterna','Az elhagyott konyha','A parancsnok terme','Leomlott toronyalj','A lepecsételt raktár','A térképek terme','A hideg kovácsműhely','Az üzenetek szobája','Rejtett kincstár','Az utolsó menedék','A törött zászló','Az ódon fogda'],cave:['A szél torka','Cseppkövek csarnoka','A mélyfény ürege','A visszhang terme','Az alvó tó','Gyökerek terme','A zuhanás pereme','A csillámpala boltíve','A fekete homok','A kőfogak ürege','A halk morajlás','A föld szíve','A rejtett forrás','A csontfehér fészek','A kúszó köd','A néma szurdok']};
const cryptDesc=['A kőfülkékben névtelen szarkofágok sorakoznak. A padló porában egyetlen, friss csizma nyoma vezet a falig.','A mennyezetről fekete viasz csöpög, bár egyetlen gyertya sem ég. Az ajtó felett elkopott figyelmeztetés olvasható.','Kifakult freskó mutat be egy régi temetési szertartást. A festményen az egyik alak arca láthatóan újabb a többinél.','A terem közepén repedt kőasztal áll. Az asztal alatti porban valaki rendszeresen helyet söpör magának.','Lassan mozdul a hideg levegő. A falba faragott nevek közül egyet aprólékosan újravéstek.'];
const ruinsDesc=['A beszakadt mennyezet résein át gyökerek kúsznak a falra. A régi bútorokból csak egy feldöntött asztal maradt.','Rozsdás szegek és törött edények borítják a kövezetet. Az egyik sarokban valaki nemrég tüzet rakott.','A falon elmosódott címer látszik. A padlót átszelő repedésből hűvös levegő áramlik.','A kifeszített polcok nyomai még látszanak a falon. A bejárattal szemben egy vaskampón üres lámpás függ.','Víz csöpög egy málló oszlopra. A falba karcolt napok száma egy ponton hirtelen megszakad.'];
const caveDesc=['A nedves falakon halvány kristályerek futnak. A mennyezetről hulló vízcseppek szabályos ritmust vernek.','Kisebb kövek ropognak a talpak alatt. Egy keskeny résből földszagú, meleg légáram érkezik.','A barlang falát simára csiszolta a rég elapadt víz. Egy embermagasságú kő árnyéka szokatlanul messzire nyúlik.','Apró gombatelepek nőnek a sziklák között. A terem túlsó végében lábnyomok tűnnek el a kavicsos talajon.','Az üregben minden hang kétszer verődik vissza. A második visszhang feltűnően késik az elsőhöz képest.'];
const secretsText=['A falon futó karcolások egy rejtett rekesz körvonalát jelölik. Benne a hely korábbi őrének félbehagyott naplója lapul.','A kövek alá rejtett rézcsengő megszólal, ha a terem közepére lépnek. A hang egy távolabbi helyiségben is hallható.','A terem egyik tárgya egy közeli településről eltűnt személy tulajdona. A tulajdonos még életben lehet.','A repedésben egy másik szobából származó tárgy hever. A két helyszín története összefügg.','A falon lévő ábra nem díszítés, hanem egy útvonal hiányos rajza. A befejezéshez egy másik helyiségben található jel kell.','A legrégebbi kő alatt érintetlen ezüst tok rejlik. A pecsét tulajdonosa attól fél, hogy valaki megtalálja.'];
const roomFacts=['A levegőben füst és nedves kő illata keveredik.','A falakon derékmagasságig sötét víznyom látható.','Az egyik kövön friss, sáros kézlenyomat van.','A bejáratnál egy eltört viaszpecsét hever.','Valahonnan halk, fémes kopogás hallatszik.','Egy apró rongydarab akadt a bejárat kövébe.'];
function makeGrid(w,h){return Array.from({length:h},()=>Array(w).fill(0));}
function carveRoom(grid,room,theme,rng){for(let y=room.y;y<room.y+room.h;y++)for(let x=room.x;x<room.x+room.w;x++){const nx=(x+.5-room.cx)/(room.w/2),ny=(y+.5-room.cy)/(room.h/2);if(theme!=='cave'||nx*nx+ny*ny<.94+(rng()-.5)*.15 || Math.abs(x-room.cx)<1 || Math.abs(y-room.cy)<1)grid[y][x]=1;}}
function makeCorridor(a,b,rng,rooms,w,h){
  const ax=Math.floor(a.cx),ay=Math.floor(a.cy),bx=Math.floor(b.cx),by=Math.floor(b.cy),start=ay*w+ax,end=by*w+bx;
  const blocked=new Uint8Array(w*h);
  for(const room of rooms)if(room!==a&&room!==b)for(let y=room.y;y<room.y+room.h;y++)for(let x=room.x;x<room.x+room.w;x++)blocked[y*w+x]=1;
  const dirs=rng()>.5?[[1,0],[0,1],[-1,0],[0,-1]]:[[0,1],[1,0],[0,-1],[-1,0]];
  const queue=[start],parents=new Int32Array(w*h).fill(-1);parents[start]=start;
  for(let i=0;i<queue.length&&parents[end]===-1;i++){const id=queue[i],x=id%w,y=Math.floor(id/w);for(const[dx,dy]of dirs){const nx=x+dx,ny=y+dy,nid=ny*w+nx;if(nx<1||ny<1||nx>=w-1||ny>=h-1||blocked[nid]||parents[nid]!==-1)continue;parents[nid]=id;queue.push(nid);}}
  if(parents[end]===-1)throw new Error('Nem sikerült összekötni a dungeon szobáit.');
  const path=[];let cursor=end;while(cursor!==start){path.push({x:cursor%w,y:Math.floor(cursor/w)});cursor=parents[cursor];}path.push({x:ax,y:ay});return path.reverse();
}
const withinRoom=(p,r)=>p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h;
export function generateDungeon(settings){
  settings=normalizeSettings('dungeon',settings);
  const rng=random('dungeon-v1|'+JSON.stringify(settings));
  const w=76,h=52,rooms=[];
  // Partitioning guarantees the requested room count without overlap or retries.
  const leaves=[{x:2,y:2,w:w-4,h:h-4}];
  while(leaves.length<settings.rooms){
    const choices=leaves.map((leaf,index)=>({...leaf,index})).filter(leaf=>leaf.w>=16||leaf.h>=14).sort((a,b)=>b.w*b.h-a.w*a.h);
    const leaf=choices[0];if(!leaf)throw new Error('Nincs elegendő hely a szobáknak.');
    let vertical=leaf.w/leaf.h>1.3?true:leaf.h/leaf.w>1.3?false:rng()>.5;
    if(leaf.w<16)vertical=false;if(leaf.h<14)vertical=true;
    const cut=vertical?int(rng,Math.max(8,Math.floor(leaf.w*.38)),Math.min(leaf.w-8,Math.ceil(leaf.w*.62))):int(rng,Math.max(7,Math.floor(leaf.h*.38)),Math.min(leaf.h-7,Math.ceil(leaf.h*.62)));
    const first={x:leaf.x,y:leaf.y,w:vertical?cut:leaf.w,h:vertical?leaf.h:cut};
    const second={x:vertical?leaf.x+cut:leaf.x,y:vertical?leaf.y:leaf.y+cut,w:vertical?leaf.w-cut:leaf.w,h:vertical?leaf.h:leaf.h-cut};
    leaves.splice(leaf.index,1,first,second);
  }
  for(const leaf of leaves){const rw=int(rng,5,Math.min(11,leaf.w-2)),rh=int(rng,4,Math.min(9,leaf.h-2));const x=int(rng,leaf.x+1,leaf.x+leaf.w-rw-1),y=int(rng,leaf.y+1,leaf.y+leaf.h-rh-1);rooms.push({x,y,w:rw,h:rh,cx:x+rw/2,cy:y+rh/2});}
  rooms.sort((a,b)=>a.y-b.y||a.x-b.x);
  // A spanning tree connects every room; optional extra edges create loops.
  const edges=[],connected=new Set([0]);
  if(settings.complexity==='linear'){
    let current=0;while(connected.size<rooms.length){let next=-1,d=Infinity;for(let i=0;i<rooms.length;i++){if(connected.has(i))continue;const value=Math.hypot(rooms[i].cx-rooms[current].cx,rooms[i].cy-rooms[current].cy);if(value<d){d=value;next=i;}}edges.push({a:current,b:next});connected.add(next);current=next;}
  }else{
    while(connected.size<rooms.length){let best=null,d=Infinity;for(const a of connected)for(let b=0;b<rooms.length;b++){if(connected.has(b))continue;const value=Math.hypot(rooms[a].cx-rooms[b].cx,rooms[a].cy-rooms[b].cy);if(value<d){d=value;best={a,b};}}edges.push(best);connected.add(best.b);}
  }
  const degree=rooms.map((_,i)=>edges.filter(e=>e.a===i||e.b===i).length);
  const secretRooms=new Set();
  if(settings.secrets){const leaves=rooms.map((_,i)=>i).filter(i=>i!==0&&degree[i]===1).reverse();for(const i of leaves.slice(0,Math.max(1,Math.floor(rooms.length/8))))secretRooms.add(i);}
  if(settings.complexity==='maze')for(let i=0;i<Math.floor(rooms.length/3);i++){let best=null,d=Infinity;for(let a=0;a<rooms.length;a++)for(let b=a+1;b<rooms.length;b++){if(secretRooms.has(a)||secretRooms.has(b)||edges.some(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a)))continue;const value=Math.hypot(rooms[a].cx-rooms[b].cx,rooms[a].cy-rooms[b].cy);if(value<d){d=value;best={a,b};}}if(best)edges.push(best);}
  const publicGrid=makeGrid(w,h),secretGrid=makeGrid(w,h),doors=[];
  rooms.forEach((room,i)=>carveRoom(secretRooms.has(i)?secretGrid:publicGrid,room,settings.theme,rng));
  edges.forEach(edge=>{const points=makeCorridor(rooms[edge.a],rooms[edge.b],rng,rooms,w,h);const hidden=secretRooms.has(edge.a)||secretRooms.has(edge.b);const grid=hidden?secretGrid:publicGrid;points.forEach(p=>{grid[p.y][p.x]=1;});edge.points=points;edge.hidden=hidden;for(const roomIndex of [edge.a,edge.b]){const room=rooms[roomIndex];const reverse=roomIndex===edge.b;const route=reverse?[...points].reverse():points;for(let k=1;k<route.length;k++)if(withinRoom(route[k-1],room)&&!withinRoom(route[k],room)){doors.push({...route[k],horizontal:route[k].x!==route[k-1].x,hidden});break;}}});
  // Secret passages may cross another corridor. Build the public grid separately
  // so player exports close the secret route instead of revealing its footprint.
  const grid=publicGrid.map((row,y)=>row.map((v,x)=>v||secretGrid[y][x]?1:0));
  const hazardChance={low:.08,medium:.2,high:.39}[settings.danger];
  const places=rooms.map((room,i)=>{
    const danger=i>0&&rng()<hazardChance;
    const name=roomNames[settings.theme][i%roomNames[settings.theme].length]+(i>=16?' II.':'');
    return{id:`d${i+1}`,number:i+1,name,type:i===0?'Bejárat':secretRooms.has(i)?'Titkos szoba':danger?'Veszélyes terem':'Terem',x:44+room.cx*12,y:62+room.cy*12,description:pick(rng,settings.theme==='crypt'?cryptDesc:settings.theme==='cave'?caveDesc:ruinsDesc),fact:pick(rng,roomFacts),secret:danger?'Csapdaötlet: '+pick(rng,['Egy laza kőlap súlyt érzékel, és bezárja az ajtókat. A falon lévő retesz oldja a zárat.','Az elmozdított fedél egy közeli, ingatag falrészt tart. A repedések és a friss kőpor előre jelzik a veszélyt.','A padlóba süllyesztett fémrács alatt régi tűzcsapda húzódik. A szerkezet olajszaga és megfeketedett kövei árulkodóak.']):pick(rng,secretsText),hidden:secretRooms.has(i),danger,notes:'',roomIndex:i,decor:int(rng,0,4)};
  });
  const title=pick(rng,{crypt:['Az elfeledett kripta','A néma király sírja','A Hamvak csarnokai','A Fekete Fogadalom'],ruins:['A Viharbástya romjai','Az utolsó őrség','A leszakadt erőd','A Hallgató Citadella'],cave:['A Suttogó Mélység','A föld alatti éjszaka','A Kövek gyomra','Az Ezüstér barlangjai']}[settings.theme]);
  return{type:'dungeon',settings,title,places,rooms,edges,grid,publicGrid,doors,width:w,height:h,version:VERSION};
}
export function generate(type,settings){return type==='dungeon'?generateDungeon(settings):generateCity(settings);}

function svgDefs(){return `<defs><pattern id="water-hatch" width="17" height="12" patternUnits="userSpaceOnUse"><path d="M2 6q3-2 7 0t7 0" fill="none" stroke="#a5a5a5" stroke-width=".65"/></pattern><pattern id="stone-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0v6" stroke="#b3b3b3" stroke-width=".75"/></pattern><pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#bcbcbc" stroke-width=".45"/></pattern><pattern id="floor-grid" width="12" height="12" x="44" y="62" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="#bdbdbd" stroke-width=".5"/></pattern></defs>`;}
function compass(x,y){return `<g transform="translate(${x} ${y})" stroke="#333" fill="none"><circle r="25" stroke-width=".6"/><circle r="19" stroke-width=".4"/><path d="M0-34 5-5 0 0-5-5ZM0 34-5 5 0 0 5 5Z" fill="#333" stroke-width=".6"/><path d="M-34 0-5-5 0 0-5 5ZM34 0 5 5 0 0 5-5Z" fill="white" stroke-width=".6"/><path d="M-16-16 16 16M-16 16 16-16" stroke-width=".4"/><text y="-42" text-anchor="middle" fill="#333" stroke="none" font-family="Georgia,serif" font-size="11">É</text></g>`;}
function scaleBar(type){const city=type==='city',half=city?70:36,quarter=half/2,length=half*2;return `<g transform="translate(${city?785:850} 690)" font-family="Georgia,serif" font-size="8" fill="#686868"><path d="M0 0h${half}v5H0Zm${half} 0h${half}v5H${half}Z" fill="white" stroke="#555" stroke-width=".7"/><path d="M0 0h${quarter}v5H0Zm${half} 0h${quarter}v5H${half}Z" fill="#444"/><text x="0" y="18">0</text><text x="${half}" y="18" text-anchor="middle">${city?'50':'15'}</text><text x="${length}" y="18" text-anchor="end">${city?'100 m':'30 láb'}</text><text x="${half}" y="32" text-anchor="middle" font-size="6.5" fill="#999">${city?'TÁJÉKOZTATÓ LÉPTÉK':'1 MEZŐ = 5 LÁB'}</text></g>`;}
function treeSvg(t){return `<g transform="translate(${n(t.x)} ${n(t.y)})" stroke="#737373" stroke-width=".65" fill="white"><path d="M0 ${n(t.r)}v4"/><path d="M0 ${n(-t.r)}q${n(t.r)} -1 ${n(t.r)} ${n(t.r)}q2 ${n(t.r)} ${n(-t.r)} ${n(t.r)}q${n(-t.r)} 1 ${n(-t.r)} ${n(-t.r)}q-1 ${n(-t.r)} ${n(t.r)} ${n(-t.r)}Z"/><path d="M0 ${n(-t.r*.5)}v${n(t.r*1.1)}m0-3 3-2m-3 0-2-2" fill="none" stroke-width=".4"/></g>`;}
function cityLandmark(place){const x=n(place.x),y=n(place.y);if(place.type==='Piactér')return `<g transform="translate(${x} ${y})" stroke="#333" fill="white"><circle r="10" stroke-width="1"/><circle r="6" stroke-width=".7"/><path d="M-5 0H5M0-5V5" stroke-width=".6"/><path d="M-28-17h12v8h-12Zm42 0h12v8H14ZM-28 12h12v8h-12Zm42 0h12v8H14Z" stroke-width=".8"/><path d="M-28-13h12m30 0h12m-54 29h12m30 0h12" stroke-width=".4"/></g>`;
  if(place.type==='Temető')return `<g transform="translate(${x} ${y})" stroke="#555" fill="none"><path d="M-30-22h60v48h-60Z" stroke-width=".7" stroke-dasharray="2 2"/>${[-18,-5,8,21].map(dx=>[-12,3,17].map(dy=>`<path d="M${dx} ${dy-4}v8m-3-5h6" stroke-width="1.1"/>`).join('')).join('')}<path d="M-8-28h16v-11H-8Z" fill="white"/></g>`;
  if(place.type==='Templom')return `<g transform="translate(${x} ${y})" fill="white" stroke="#333" stroke-width="1.1"><path d="M-11-31h22v16h14V1H11v28h-22V1h-14v-16h14Z"/><path d="M0-31v60M-25-7h50M-11-15 0-7 11-15M-11 1 0-7 11 1" fill="none" stroke-width=".55"/><rect x="-6" y="-39" width="12" height="10"/><path d="M0-43v7m-3-4h6" stroke-width=".8"/></g>`;
  if(place.type==='Kúria')return `<g transform="translate(${x} ${y})" fill="white" stroke="#333"><path d="M-31-25h62v50h-62Z" stroke-width=".7"/><path d="M-23-18h46v20H12v15h-24V2h-11Z" stroke-width="1.2"/><path d="M-23-8h46M0-18v35M-12 2 0-8 12 2" stroke-width=".55"/><circle cx="-23" cy="17" r="4" stroke-width=".6"/><circle cx="23" cy="17" r="4" stroke-width=".6"/></g>`;
  return `<g transform="translate(${x} ${y}) rotate(${place.number%2?10:-12})" fill="white" stroke="#333" stroke-width="1.05"><path d="M-20-13h40v26H-20Z"/><path d="M-20 0h40m-40-13L-10 0-20 13m40-26L10 0l10 13" stroke-width=".55"/><path d="M-10-17h8v5h-8Z" stroke-width=".7"/></g>`;
}
function drawCity(doc,options){
  const{shape,settings}=doc,parts=[];
  if(options.grid)parts.push('<rect width="1000" height="760" fill="url(#map-grid)"/>');
  // The surrounding countryside stays light; ink is reserved for buildings.
  if(settings.terrain==='hills')for(let i=0;i<7;i++){let x=60+i*135,y=i%2?670:66;parts.push(`<g transform="translate(${x} ${y})" stroke="#aaa" stroke-width=".7" fill="none"><path d="M-40 12Q0-40 40 12M-30 17Q0-23 30 17M-20 22Q0-8 20 22"/></g>`);}
  parts.push(doc.trees.map(treeSvg).join(''));
  for(const g of doc.gates){const ex=g.x+Math.cos(g.angle)*115,ey=g.y+Math.sin(g.angle)*105;parts.push(`<path d="M${n(g.x)} ${n(g.y)}Q${n((g.x+ex)/2+8)} ${n((g.y+ey)/2-7)} ${n(ex)} ${n(ey)}" fill="none" stroke="#d3d3d3" stroke-width="10"/><path d="M${n(g.x)} ${n(g.y)}Q${n((g.x+ex)/2+8)} ${n((g.y+ey)/2-7)} ${n(ex)} ${n(ey)}" fill="none" stroke="white" stroke-width="8"/>`);}
  if(settings.terrain==='river'){
    const left=[],right=[];for(let y=-20;y<=780;y+=10){left.push({x:riverX(y)-34,y});right.push({x:riverX(y)+34,y});}
    parts.push(`<path d="${linePath(left)} ${right.reverse().map(p=>`L${n(p.x)} ${p.y}`).join(' ')}Z" fill="url(#water-hatch)" stroke="#777" stroke-width="1"/>`);
    for(let i=0;i<4;i++){const y=375+i*22,x=riverX(y)-35;parts.push(`<path d="M${n(x-29)} ${y}h43v5h-43Z" fill="white" stroke="#555" stroke-width=".7"/><path d="M${n(x-26)} ${y+2.5}h37" fill="none" stroke="#999" stroke-width=".4"/>`);}
    const y=shape.cy+8,x=riverX(y);parts.push(`<g transform="translate(${n(x)} ${n(y)}) rotate(-5)" fill="white" stroke="#444"><rect x="-47" y="-8" width="94" height="16" stroke-width="1"/>${Array.from({length:15},(_,i)=>`<path d="M${-42+i*6}-7V7" stroke-width=".45"/>`).join('')}</g>`);
    if(options.labels)parts.push('<text x="850" y="440" transform="rotate(83 850 440)" fill="#777" font-family="Georgia,serif" font-style="italic" letter-spacing="4" font-size="16">Köd-folyó</text>');
  }
  for(const road of doc.roads)parts.push(`<path d="${linePath(road.points)}" fill="none" stroke="#d8d8d8" stroke-width="${road.width+1.3}" stroke-linecap="round" stroke-linejoin="round"/><path d="${linePath(road.points)}" fill="none" stroke="white" stroke-width="${road.width}" stroke-linecap="round" stroke-linejoin="round"/>`);
  parts.push(`<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="32" ry="27" fill="white" stroke="#c4c4c4" stroke-width=".6"/>`);
  for(const b of doc.buildings){const w=n(b.w),h=n(b.h);parts.push(`<g transform="translate(${n(b.x)} ${n(b.y)}) rotate(${n(b.angle)})" stroke="#414141" stroke-width=".85" fill="${b.kind<.3?'#f1f1f1':'#fff'}"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}"/><path d="M${-w/2} 0H${w/2}M${-w/2} ${-h/2} ${-w/2+h/2} 0 ${-w/2} ${h/2}M${w/2} ${-h/2} ${w/2-h/2} 0 ${w/2} ${h/2}" stroke-width=".45" fill="none"/>${settings.era==='victorian'?`<rect x="${n(w/2-5)}" y="${n(-h/2-2)}" width="3" height="4" fill="white" stroke-width=".6"/>`:''}</g>`);}
  parts.push(doc.places.map(cityLandmark).join(''));
  if(settings.walls){parts.push(`<polygon points="${polyPoints(doc.boundary)}" fill="none" stroke="#292929" stroke-width="5.5" stroke-linejoin="round"/><polygon points="${polyPoints(doc.boundary)}" fill="none" stroke="white" stroke-width="2.8" stroke-linejoin="round"/>`);for(let i=0;i<doc.boundary.length;i+=9){const p=doc.boundary[i];parts.push(`<circle cx="${n(p.x)}" cy="${n(p.y)}" r="4.6" fill="white" stroke="#333" stroke-width="1.2"/><circle cx="${n(p.x)}" cy="${n(p.y)}" r="1.7" fill="none" stroke="#777" stroke-width=".5"/>`);}for(const g of doc.gates)parts.push(`<g transform="translate(${n(g.x)} ${n(g.y)}) rotate(${n(g.angle*180/Math.PI)})"><path d="M-6-6H6V6H-6" stroke="white" stroke-width="5" fill="white"/><rect x="-4" y="-12" width="8" height="7" fill="white" stroke="#333" stroke-width="1.2"/><rect x="-4" y="5" width="8" height="7" fill="white" stroke="#333" stroke-width="1.2"/></g>`);}
  if(options.labels){const wards=[{x:-94,y:-119,text:'ÉSZAKI NEGYED'},{x:-136,y:82,text:'KÉZMŰVESNEGYED'},{x:69,y:51,text:'ÓVÁROS'},{x:87,y:153,text:'DÉLI KERTEK'},{x:213,y:27,text:settings.terrain==='river'?'KIKÖTŐNEGYED':'VÁNDORNEGYED'}];for(const ward of wards.slice(0,doc.wards)){const x=shape.cx+ward.x*shape.rx/326,y=shape.cy+ward.y*shape.ry/266;parts.push(`<text x="${n(x)}" y="${n(y)}" text-anchor="middle" font-family="Georgia,serif" font-size="9" letter-spacing="1.7" fill="#686868" stroke="white" stroke-width="3" paint-order="stroke">${ward.text}</text>`);}}
  parts.push(compass(905,131));
  parts.push(`<g transform="translate(482 690)" fill="#333" font-family="Georgia,serif" text-anchor="middle"><path d="M-155-6h39m232 0h39" fill="none" stroke="#b0b0b0" stroke-width=".6"/><text y="0" font-size="22" letter-spacing="2">${esc(doc.title)}</text><text y="20" font-size="7" letter-spacing="2.2" fill="#929292">${{village:'FALU',town:'KISVÁROS',city:'NAGYVÁROS'}[settings.size]} · ${settings.era==='victorian'?'VIKTORIÁNUS VIDÉK':'KÖZÉPKORI VIDÉK'}</text></g>`);
  parts.push(scaleBar('city'));
  return parts.join('');
}

function drawDungeon(doc,options){
  const parts=[],grid=options.player?doc.publicGrid:doc.grid,tile=12,ox=44,oy=62;
  const isFloor=(x,y)=>x>=0&&y>=0&&x<doc.width&&y<doc.height&&grid[y][x]===1;
  // Hatch only the one-tile stone border, rather than darkening the whole page.
  let floor='',stone='',walls='';
  for(let y=0;y<doc.height;y++)for(let x=0;x<doc.width;x++){
    const px=ox+x*tile,py=oy+y*tile;
    if(grid[y][x]){floor+=`M${px} ${py}h12v12h-12Z`;if(!isFloor(x,y-1))walls+=`M${px} ${py}h12`;if(!isFloor(x+1,y))walls+=`M${px+12} ${py}v12`;if(!isFloor(x,y+1))walls+=`M${px} ${py+12}h12`;if(!isFloor(x-1,y))walls+=`M${px} ${py}v12`;}
    else if([-1,0,1].some(dx=>[-1,0,1].some(dy=>isFloor(x+dx,y+dy))))stone+=`M${px} ${py}h12v12h-12Z`;
  }
  parts.push(`<path d="${stone}" fill="url(#stone-hatch)"/><path d="${floor}" fill="${options.grid?'url(#floor-grid)':'white'}"/><path d="${walls}" fill="none" stroke="#313131" stroke-width="2.2" stroke-linecap="square"/>`);
  for(const p of doc.places){if(options.player&&p.hidden)continue;const r=doc.rooms[p.roomIndex],cx=ox+r.cx*tile,cy=oy+r.cy*tile;
    if(doc.settings.theme==='cave')parts.push(`<g fill="none" stroke="#aaa" stroke-width=".7"><path d="M${n(cx-17)} ${n(cy+12)}l-7-3-5 5 7 4Z M${n(cx+18)} ${n(cy-15)}l5 2 3-5-5-3Z"/></g>`);
    else if(p.decor===0)parts.push(`<g transform="translate(${n(cx)} ${n(cy)})" fill="white" stroke="#777" stroke-width=".75"><rect x="-22" y="-10" width="16" height="20" rx="2"/><rect x="6" y="-10" width="16" height="20" rx="2"/><path d="M-19-5h10m-10 10h10M9-5h10M9 5h10" stroke-width=".4"/></g>`);
    else if(p.decor===1)parts.push(`<g transform="translate(${n(cx)} ${n(cy)})" fill="white" stroke="#777" stroke-width=".75"><circle cx="-20" cy="-13" r="5"/><circle cx="20" cy="-13" r="5"/><circle cx="-20" cy="13" r="5"/><circle cx="20" cy="13" r="5"/></g>`);
    else if(p.decor===2)parts.push(`<g transform="translate(${n(cx)} ${n(cy)})" fill="white" stroke="#777" stroke-width=".75"><rect x="-18" y="-19" width="36" height="11"/><path d="M-16-14h32M-11-19v11M11-19v11" stroke-width=".4"/></g>`);
    else if(p.decor===3)parts.push(`<g transform="translate(${n(cx)} ${n(cy)})" fill="none" stroke="#999" stroke-width=".6"><circle r="20"/><circle r="17"/><path d="m0-17 10 31-26-19h32L-10 14Z"/></g>`);
    if(p.number===1){const x=ox+(r.x+1)*tile,y=oy+(r.y+1)*tile;parts.push(`<g transform="translate(${x} ${y})" fill="none" stroke="#666" stroke-width=".8"><path d="M0 0h21m-20 4h19m-17 4h15m-14 4h13m-12 4h11m-10 4h9"/></g>`);}
    if(p.danger&&!options.player){parts.push(`<g transform="translate(${n(cx+18)} ${n(cy+15)})" fill="white" stroke="#555" stroke-width=".8"><path d="m0-5 5 9H-5Z"/><path d="M0-2v3m0 1v1"/></g>`);}
  }
  if(doc.settings.theme!=='cave')for(const door of doc.doors){if(door.hidden&&options.player)continue;const x=ox+door.x*tile+6,y=oy+door.y*tile+6;parts.push(`<g transform="translate(${x} ${y}) rotate(${door.horizontal?90:0})" fill="white" stroke="#333" stroke-width=".9"><rect x="-6" y="-2" width="12" height="4" ${door.hidden?'stroke-dasharray="2 1"':''}/>${door.hidden?'<text x="0" y="-5" text-anchor="middle" fill="#777" stroke="none" font-size="8" font-family="Georgia,serif">S</text>':''}</g>`);}
  else if(!options.player)for(const door of doc.doors.filter(d=>d.hidden)){parts.push(`<text x="${ox+door.x*tile+6}" y="${oy+door.y*tile+4}" font-family="Georgia,serif" font-size="9" fill="#555">S</text>`);}
  parts.push(`<text x="55" y="718" font-family="Georgia,serif" font-size="17" letter-spacing=".7" fill="#444">${esc(doc.title)}</text><text x="55" y="736" font-family="Georgia,serif" font-size="7" letter-spacing="1.4" fill="#999">${options.player?'JÁTÉKOSTÉRKÉP':'MESÉLŐI ALAPRAJZ'} · ${esc(doc.settings.seed)}</text>`);
  parts.push(scaleBar('dungeon'));
  return parts.join('');
}
function markers(doc,options){if(!options.labels)return'';return doc.places.filter(p=>!options.player||!p.hidden).map(p=>`<g class="map-location${options.selected===p.id?' selected':''}" data-place="${p.id}" transform="translate(${n(p.x)} ${n(p.y)})" tabindex="0" role="button" aria-label="${esc(p.number+'. '+p.name)}"><title>${esc(p.number+'. '+p.name)}</title><circle class="marker-hit" r="18" fill="transparent"/><circle class="marker-halo" r="13.5" fill="white" stroke="#333" stroke-width=".9" opacity="${options.selected===p.id?1:0}"/><circle class="marker-disc" r="10" fill="${options.selected===p.id?'white':'#30332c'}" stroke="${options.selected===p.id?'#333':'white'}" stroke-width="1.5"/><text class="marker-text" fill="${options.selected===p.id?'#333':'white'}" text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-size="10">${p.number}</text></g>`).join('');}
export function renderSVG(doc,opts={}){
  const options={labels:true,grid:false,player:false,selected:null,...opts};
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="760" viewBox="0 0 1000 760" role="img" aria-label="${esc(doc.title)} térképe"><title>${esc(doc.title)}</title><desc>Seed: ${esc(doc.settings.seed)}. ${options.player?'Játékosnézet.':'Mesélői nézet.'} Ködvidék generátor v1.</desc>${svgDefs()}<rect width="1000" height="760" fill="white"/><g id="world-layer">${doc.type==='city'?drawCity(doc,options):drawDungeon(doc,options)}${markers(doc,options)}</g></svg>`;
}

export function snapshot(doc,id){return{format:'kodvidek-atlas',version:VERSION,id:id||null,type:doc.type,settings:{...doc.settings},title:doc.title,places:doc.places.map(({id,name,description,secret,notes})=>({id,name,description,secret,notes})),savedAt:new Date().toISOString()};}
export function restore(data){
  if(!data||data.format!=='kodvidek-atlas'||data.version!==VERSION||!['city','dungeon'].includes(data.type)||!data.settings||typeof data.settings!=='object'||!Array.isArray(data.places))throw new Error('Ez nem támogatott Ködvidék JSON-mentés (v1).');
  const doc=generate(data.type,normalizeSettings(data.type,data.settings));
  doc.title=String(data.title||doc.title).trim().slice(0,80)||doc.title;
  for(const place of doc.places){const saved=data.places.find(p=>p&&p.id===place.id);if(!saved)continue;for(const key of ['name','description','secret','notes'])if(typeof saved[key]==='string')place[key]=saved[key].slice(0,key==='name'?100:key==='notes'?6000:3000);if(!place.name.trim())place.name='Névtelen helyszín';}
  return doc;
}
