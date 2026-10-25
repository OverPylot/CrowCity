import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,SPECIAL_BUILDINGS,LANDSCAPES,PALETTE,generate,generateCity,generateDungeon,normalizeSettings,normalizeAnnotation,snapshot,restore,polygonArea,validPolygon,pointInPolygon,segmentDistance} from '../dist/generator.js';
import {renderSVG} from '../dist/render.js';
import {generate as generateV1,snapshot as snapshotV1} from '../dist/legacy-generator-v1.js';
import {generate as generateV2,snapshot as snapshotV2} from '../dist/legacy-generator-v2.js';
import {generate as generateV3,snapshot as snapshotV3} from '../dist/legacy-generator-v3.js';
import {generate as generateV4,snapshot as snapshotV4} from '../dist/legacy-generator-v4.js';
import {generate as generateV5,snapshot as snapshotV5} from '../dist/legacy-generator-v5.js';
import {wet} from '../dist/city-network.js';
function reach(grid){const h=grid.length,w=grid[0].length,flat=grid.flat(),start=flat.findIndex(Boolean),seen=new Set([start]),queue=[start];for(let i=0;i<queue.length;i++){const id=queue[i],x=id%w,y=Math.floor(id/w);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,nid=ny*w+nx;if(nx<0||ny<0||nx>=w||ny>=h||!grid[ny][nx]||seen.has(nid))continue;seen.add(nid);queue.push(nid);}}return{count:flat.filter(Boolean).length,seen:seen.size,reachable:seen,w};}
test('same seed and options reproduce the same clean base',()=>{for(const type of ['city','dungeon']){const a=generate(type,DEFAULTS[type]);assert.deepEqual(a,generate(type,DEFAULTS[type]));assert.notDeepEqual(a,generate(type,{...DEFAULTS[type],seed:'OTHER-SEED'}));assert.equal(a.annotations.length,0);assert.equal(a.title,'');const svg=renderSVG(a);assert.ok(!svg.includes('user-annotation'));assert.ok(!svg.includes('<text '));assert.ok(!svg.includes('Fogadó'));}});
test('different seeds change the overall city structure, not just house positions',()=>{const types=new Set(),outlines=new Set(),networks=new Set();for(let i=0;i<30;i++){const map=generateCity({...DEFAULTS.city,seed:'VARIETY-'+i});types.add(map.layout);outlines.add(map.shape.style);networks.add(JSON.stringify(map.roads.map(r=>r.points[0])));assert.ok(map.buildings.length>30);}assert.equal(types.size,5);assert.equal(outlines.size,4);assert.equal(networks.size,30);});
test('city options produce finite, selectable footprints for every street pattern and water type',()=>{for(const layout of ['organic','radial','grid','spine','clusters'])for(const terrain of ['plain','river','lake','coast']){const map=generateCity({...DEFAULTS.city,layout,terrain,seed:`${layout}/${terrain}`});assert.ok(map.buildings.length>15,`${layout}/${terrain}`);assert.equal(new Set(map.buildings.map(b=>b.id)).size,map.buildings.length);assert.ok(map.buildings.every(b=>b.points.length>=4&&b.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));}});
test('dungeons have exactly the requested rooms and every center and floor remains reachable',()=>{for(const arrangement of ['partition','scattered','clustered','ring'])for(const theme of ['ruins','crypt','cave'])for(const rooms of [6,18,36]){const map=generateDungeon({...DEFAULTS.dungeon,arrangement,theme,rooms,seed:`ROOM-QA-${rooms}`}),r=reach(map.grid);assert.equal(map.rooms.length,rooms,`${arrangement}/${theme}/${rooms}`);assert.equal(r.seen,r.count);for(const room of map.rooms)assert.ok(r.reachable.has(Math.floor(room.cy)*r.w+Math.floor(room.cx)));assert.equal(map.annotations.length,0);assert.equal(map.doors.length,0);}});
test('wide corridors, round rooms and loop paths remain connected',()=>{for(const complexity of ['linear','branching','maze'])for(const corridorWidth of [1,2,3]){const map=generateDungeon({...DEFAULTS.dungeon,rooms:28,roomShape:'round',complexity,corridorWidth,doors:true});const r=reach(map.grid);assert.equal(r.count,r.seen);assert.ok(map.doors.length>0);assert.ok(map.edges.length>=map.rooms.length-1);if(complexity==='maze')assert.ok(map.edges.length>map.rooms.length-1);}});
test('districts and building marks survive JSON round-trip, with manual colors and notes',()=>{const doc=generateCity(DEFAULTS.city);const b=doc.buildings[0];doc.title='Saját város';doc.annotations=[normalizeAnnotation({id:'quarter',kind:'district',name:'Kereskedők',color:PALETTE[2],opacity:.3,points:[{x:200,y:200},{x:500,y:210},{x:480,y:450},{x:230,y:430}],notes:'Privát negyedjegyzet'},doc),normalizeAnnotation({id:'inn',kind:'building',buildingId:b.id,x:b.x,y:b.y,name:'A Vándor',icon:'inn',category:'Fogadó',color:PALETTE[0],description:'Saját leírás',notes:'Titkos hátsó ajtó'},doc)];assert.deepEqual(restore(JSON.parse(JSON.stringify(snapshot(doc)))),doc);const svg=renderSVG(doc);assert.ok(svg.includes('Kereskedők'));assert.ok(svg.includes(PALETTE[2]));assert.ok(svg.includes('A Vándor'));assert.ok(!svg.includes('Titkos hátsó ajtó'));});
test('player export hides private annotations and all editor-only controls',()=>{const doc=generateDungeon(DEFAULTS.dungeon);doc.annotations=[normalizeAnnotation({id:'private-room',kind:'pin',name:'PRIVÁT-TITOK',x:300,y:300,hidden:true,notes:'SECRET'},doc),normalizeAnnotation({id:'public',kind:'text',name:'Bejárat',x:400,y:300},doc)];const svg=renderSVG(doc,{player:true,editor:false});assert.ok(!svg.includes('PRIVÁT-TITOK'));assert.ok(!svg.includes('SECRET'));assert.ok(!svg.includes('data-room='));assert.ok(!svg.includes('data-vertex='));assert.ok(svg.includes('Bejárat'));});
test('legacy saves keep their geometry and user edits while dropping automatic story markers',()=>{const old=generateV1('city',{seed:'OLD-MAP',size:'town',terrain:'plain'}),baseline=snapshotV1(old),plain=restore(baseline);assert.equal(plain.generatorVersion,1);assert.equal(plain.annotations.length,0);assert.deepEqual(plain.buildings.map(b=>({x:b.x,y:b.y})),old.buildings.map(b=>({x:b.x,y:b.y})));baseline.places[0].notes='SAJÁT RÉGI JEGYZET';const converted=restore(baseline);assert.equal(converted.annotations.length,1);assert.ok(converted.annotations[0].notes.includes('SAJÁT RÉGI JEGYZET'));const reopened=restore(snapshot(converted));assert.deepEqual(reopened.buildings,converted.buildings);assert.deepEqual(reopened.annotations,converted.annotations);});
test('polygon validation, bounded imports and escaped SVG text prevent malformed edits',()=>{const points=[{x:1,y:1},{x:100,y:1},{x:100,y:100},{x:1,y:100}];assert.equal(polygonArea(points),9801);assert.ok(validPolygon(points));assert.ok(!validPolygon([{x:0,y:0},{x:80,y:80},{x:0,y:80},{x:80,y:0}]));assert.throws(()=>restore({format:'invalid'}));assert.equal(normalizeSettings('dungeon',{rooms:999}).rooms,36);const map=generateCity(DEFAULTS.city);map.title='<script>bad</script>';map.annotations=[normalizeAnnotation({id:'x',kind:'text',name:'<script>bad</script>',x:50,y:100,color:'red" onload="bad'},map)];const svg=renderSVG(map);assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));assert.ok(!svg.includes('onload='));});

test('a cached base stays clean after edits, and hidden district layers have no editor handles',()=>{const map=generate('city',DEFAULTS.city);map.annotations.push(normalizeAnnotation({id:'district-cache-qa',kind:'district',name:'Saját negyed',points:[{x:200,y:200},{x:400,y:200},{x:400,y:400},{x:200,y:400}]},map));const fresh=generate('city',DEFAULTS.city);assert.equal(fresh.annotations.length,0);const svg=renderSVG(map,{editor:true,selected:'district-cache-qa',districts:false});assert.ok(!svg.includes('data-annotation='));assert.ok(!svg.includes('data-vertex='));const before=fresh.buildings[0].x;map.buildings[0].x+=100;assert.equal(generate('city',DEFAULTS.city).buildings[0].x,before);});

function eachSegment(points,fn){for(let i=1;i<points.length;i++)fn(points[i-1],points[i]);}
function edgeDistance(a,b,c,d){const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return 0;return Math.min(segmentDistance(a,c,d),segmentDistance(b,c,d),segmentDistance(c,a,b),segmentDistance(d,a,b));}
function connectedRoads(roads){const seen=new Set([0]),queue=[0];for(let i=0;i<queue.length;i++){const a=roads[queue[i]];for(let j=0;j<roads.length;j++){if(seen.has(j))continue;const b=roads[j];let touches=false;eachSegment(a.points,(p,q)=>eachSegment(b.points,(r,s)=>{if(!touches&&edgeDistance(p,q,r,s)<(a.width+b.width)/2+.01)touches=true;}));if(touches){seen.add(j);queue.push(j);}}}return seen.size===roads.length;}
test('temples and halls are optional real footprints, without automatic names or markers',()=>{
 for(const count of[0,1,2]){const m=generateCity({...DEFAULTS.city,specialBuildings:['temple','hall'].slice(0,count)}),special=m.buildings.filter(b=>b.landmark);assert.equal(special.length,count);assert.deepEqual(special.map(b=>b.landmark),['temple','hall'].slice(0,count));assert.equal(m.annotations.length,0);assert.ok(!renderSVG(m).includes('<text '));for(const b of special){assert.ok(polygonArea(b.points)>300);const mark=normalizeAnnotation({id:'special',kind:'building',buildingId:b.id,name:'Saját templom'},m);m.annotations=[mark];const opened=restore(JSON.parse(JSON.stringify(snapshot(m))));assert.deepEqual(opened.buildings,m.buildings);assert.equal(opened.annotations[0].buildingId,b.id);}}
});
test('new cities keep roads, gates and buildings clear of water and form a connected street network',()=>{
 for(const layout of['organic','radial','grid','spine','clusters'])for(const terrain of['plain','river','lake','coast']){
  const m=generateCity({...DEFAULTS.city,seed:'INFRA-'+layout+'-'+terrain,layout,terrain,walls:true,gates:8,waterWidth:5,streets:layout==='grid'?5:3,outline:layout==='spine'?'long':'organic'}),water=m.water&&(m.water.kind==='lake'?m.water.points:m.water.fill),tag=layout+'/'+terrain;
  assert.equal(m.gates.length,8,tag+' gate count');assert.equal(m.buildings.filter(b=>b.landmark).length,2,tag+' landmarks');assert.ok(connectedRoads(m.roads),tag+' street connectivity');
  for(const g of m.gates){const road=m.roads.find(r=>r.kind==='gate'&&r.gateId===g.id);assert.ok(road,tag+' gate road');assert.deepEqual(road.points[0],{x:g.x,y:g.y});assert.ok(!water||!pointInPolygon(g,water),tag+' dry gate');}
  for(const r of m.roads)eachSegment(r.points,(a,b)=>{const len=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(len/3);for(let i=0;i<=n;i++)for(const side of[-1,0,1]){const p={x:a.x+(b.x-a.x)*i/n-(b.y-a.y)/(len||1)*r.width/2*side,y:a.y+(b.y-a.y)*i/n+(b.x-a.x)/(len||1)*r.width/2*side};if(!water||!pointInPolygon(p,water))continue;assert.ok(m.bridges.some(bridge=>segmentDistance(p,bridge.points[0],bridge.points[1])<=bridge.width/2+.01),tag+' wet road outside a bridge');}});
  for(const building of m.buildings){const poly=[...building.points,building.points[0]];assert.ok(building.points.every(p=>pointInPolygon(p,m.boundary)&&(!water||!pointInPolygon(p,water))),tag+' dry building');for(const r of m.roads)eachSegment(r.points,(a,b)=>eachSegment(poly,(c,d)=>assert.ok(edgeDistance(a,b,c,d)>r.width/2+.5,tag+' building/road collision')));}
  for(let i=0;i<m.buildings.length;i++)for(let j=i+1;j<m.buildings.length;j++){const a=m.buildings[i],b=m.buildings[j];if(Math.hypot(a.x-b.x,a.y-b.y)>a.radius+b.radius+2)continue;assert.ok(!a.points.some(p=>pointInPolygon(p,b.points))&&!b.points.some(p=>pointInPolygon(p,a.points)),tag+' building overlap');}
 }
});
test('v2 saves and seed links retain the original plots, roads, and linked annotations',()=>{
 for(const type of['city','dungeon']){const old=generateV2(type,{...DEFAULTS[type],seed:'BEFORE-INFRA',terrain:'river',walls:true}),b=type==='city'?old.buildings[0]:null;if(b)old.annotations=[normalizeAnnotation({id:'old-inn',kind:'building',buildingId:b.id,x:b.x,y:b.y,name:'Régi fogadó',notes:'A jegyzet megmarad'},old)];const saved=snapshotV2(old),opened=restore(saved),link=generate(type,saved.settings,2);assert.equal(opened.generatorVersion,2);assert.deepEqual(opened.buildings,old.buildings);assert.deepEqual(opened.roads,old.roads);assert.deepEqual(opened.rooms,old.rooms);assert.deepEqual(opened.annotations,old.annotations);assert.deepEqual(link.buildings,old.buildings);assert.deepEqual(restore(snapshot(opened)),opened);}
});
test('both landmarks fit beside streets in cramped grids with large houses',()=>{
 for(const[size,terrain]of[['village','coast'],['town','river']]){const m=generateCity({...DEFAULTS.city,seed:`LIMIT-grid-${size}`,layout:'grid',size,terrain,walls:true,gates:8,waterWidth:5,buildingSize:5,streets:5,irregularity:5,outline:'long'});assert.deepEqual(m.buildings.filter(b=>b.landmark).map(b=>b.landmark),['temple','hall']);assert.equal(m.gates.length,8);assert.ok(connectedRoads(m.roads));}
});

test('every special building is individually selectable and all selected types fit together',()=>{
 const ids=SPECIAL_BUILDINGS.map(b=>b.id);
 assert.equal(normalizeSettings('city',{specialBuildings:[]}).specialBuildings.length,0);
 assert.deepEqual(normalizeSettings('city',{landmarks:1}).specialBuildings,['temple']);
 assert.deepEqual(normalizeSettings('city',{specialBuildings:['tower','tower','invalid']}).specialBuildings,['tower']);
 for(const id of ids){const m=generateCity({...DEFAULTS.city,specialBuildings:[id],seed:'ONE-'+id});assert.deepEqual(m.buildings.filter(b=>b.landmark).map(b=>b.landmark),[id]);}
 for(const layout of['organic','radial','grid','spine','clusters']){
  const m=generateCity({...DEFAULTS.city,layout,terrain:'river',walls:true,specialBuildings:ids,seed:'SELECT-ALL-'+layout});
  assert.deepEqual(m.buildings.filter(b=>b.landmark).map(b=>b.landmark),ids);
  assert.equal(m.annotations.length,0);assert.ok(!renderSVG(m).includes('<text '));
  assert.deepEqual(restore(JSON.parse(JSON.stringify(snapshot(m)))),m);
  for(const b of m.buildings){for(const road of m.roads)eachSegment(road.points,(p,q)=>eachSegment([...b.points,b.points[0]],(a,z)=>assert.ok(edgeDistance(p,q,a,z)>road.width/2+1,'selected landmark collision')));}
 }
});

test('all plots follow their street frontage and gates connect to dry roads outside the wall',()=>{
 for(const layout of['organic','radial','grid','spine','clusters']){
  const m=generateCity({...DEFAULTS.city,seed:'FRONTAGE-'+layout,layout,terrain:'river',walls:true,gates:6});
  for(const b of m.buildings){assert.ok(b.frontage);const road=m.roads[b.frontage.roadIndex],a=road.points[b.frontage.segmentIndex],z=road.points[b.frontage.segmentIndex+1];assert.ok(Math.abs(Math.sin(b.angle-Math.atan2(z.y-a.y,z.x-a.x)))<1e-9);assert.ok(segmentDistance(b.frontage,a,z)<1e-6);}
  for(const gate of m.gates){const inner=m.roads.find(r=>r.kind==='gate'&&r.gateId===gate.id),outer=m.roads.find(r=>r.kind==='approach'&&r.gateId===gate.id);assert.ok(inner&&outer);assert.deepEqual(inner.points[0],outer.points[0]);const exit=outer.points.at(-1);assert.ok(Math.min(Math.abs(exit.x),Math.abs(1000-exit.x),Math.abs(exit.y),Math.abs(760-exit.y))<1e-6,'gate road reaches map edge');assert.ok(!pointInPolygon(outer.points.at(-1),m.boundary));assert.ok(outer.points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-outer.points[i].x,p.y-outer.points[i].y),0)>40);}
  assert.ok(connectedRoads(m.roads));
 }
});

test('v3 saves preserve the exact old streets, landmarks, and linked notes after regeneration changes',()=>{
 const old=generateV3('city',{seed:'BEFORE-FRONTAGES',terrain:'coast',walls:true,landmarks:2}),b=old.buildings[0];
 old.annotations=[normalizeAnnotation({id:'v3-mark',kind:'building',buildingId:b.id,name:'Régi templom',notes:'Megőrzött jegyzet'},old)];
 const opened=restore(snapshotV3(old));assert.equal(opened.generatorVersion,3);assert.deepEqual(opened.buildings,old.buildings);assert.deepEqual(opened.roads,old.roads);assert.deepEqual(opened.annotations,old.annotations);assert.deepEqual(restore(snapshot(opened)),opened);
 assert.deepEqual(generate('city',old.settings,3).buildings,old.buildings);
});

test('residential streets have real house frontages even with large houses and dense roads',()=>{
 for(const layout of['organic','radial','grid','spine','clusters'])for(const terrain of['plain','river','coast']){
  const m=generateCity({...DEFAULTS.city,seed:'BUILDABLE-'+layout+'-'+terrain,layout,terrain,buildingSize:5,streets:5,walls:true,gates:6});
  assert.ok(connectedRoads(m.roads));
  const residential=m.roads.map((r,i)=>({r,i})).filter(({r})=>r.kind==='street');assert.ok(residential.length>0);
  for(const {i}of residential){const houses=m.buildings.filter(b=>b.frontage.roadIndex===i);assert.ok(houses.length>0,layout+'/'+terrain+' empty residential street');assert.ok(houses.every(b=>b.w>=8&&b.h>=8));}
  for(const b of m.buildings)assert.ok(Number.isInteger(b.frontage.roadIndex)&&m.roads[b.frontage.roadIndex],'remapped frontage');
 }
});

test('surrounding landscapes are reproducible, optional, and independent of the town layout',()=>{
 const base=generateCity({...DEFAULTS.city,seed:'LANDSCAPE-QA',terrain:'river',walls:true,surroundings:'none'});
 assert.deepEqual(base.landscape.features,[]);
 const maps=[];
 for(const [surroundings]of LANDSCAPES.filter(([id])=>id!=='none')){
  const m=generateCity({...base.settings,surroundings});maps.push(m);
  assert.deepEqual(m.buildings,base.buildings);assert.deepEqual(m.roads,base.roads);
  assert.ok(m.landscape.features.length>0,surroundings+' visible features');
  if(surroundings==='mixed')assert.ok(new Set(m.landscape.features.map(f=>f.kind)).size>=3);else assert.ok(m.landscape.features.every(f=>f.kind===surroundings));
  for(const f of m.landscape.features){
   assert.ok(!pointInPolygon(f,m.boundary)&&!wet(f,m.water,f.radius+4));
   assert.ok(m.boundary.every((a,i)=>segmentDistance(f,a,m.boundary[(i+1)%m.boundary.length])>f.radius+12));
   for(const road of m.roads)eachSegment(road.points,(a,b)=>assert.ok(segmentDistance(f,a,b)>f.radius+road.width/2+6));
   if(f.points)assert.ok(f.points.every(p=>!pointInPolygon(p,m.boundary)&&!wet(p,m.water)));
  }
  assert.deepEqual(restore(JSON.parse(JSON.stringify(snapshot(m)))),m);
  assert.ok(renderSVG(m).includes('surrounding-landscape'));assert.ok(!renderSVG(m).includes('<text '));
 }
 assert.equal(normalizeSettings('city',{surroundings:'bad'}).surroundings,DEFAULTS.city.surroundings);
 assert.equal(normalizeSettings('city',{landscapeDensity:999}).landscapeDensity,5);
});

test('v4 saves keep their plots and notes and do not acquire a landscape implicitly',()=>{
 const old=generateV4('city',{seed:'BEFORE-LANDSCAPE',terrain:'river',walls:true,specialBuildings:['castle','tower']}),b=old.buildings[0];
 old.annotations=[normalizeAnnotation({id:'v4-note',kind:'building',buildingId:b.id,name:'Régi vár',notes:'Őrzött jegyzet'},old)];
 const opened=restore(snapshotV4(old));assert.equal(opened.generatorVersion,4);assert.deepEqual(opened.buildings,old.buildings);assert.deepEqual(opened.roads,old.roads);assert.deepEqual(opened.annotations,old.annotations);assert.equal(opened.landscape,undefined);assert.deepEqual(restore(snapshot(opened)),opened);assert.deepEqual(generate('city',old.settings,4).buildings,old.buildings);
});


test('v5 saves preserve the old landscape and short gate approaches',()=>{
 const old=generateV5('city',{seed:'BEFORE-CROWCITY',surroundings:'mixed',terrain:'river',walls:true}),opened=restore(snapshotV5(old));
 assert.equal(opened.generatorVersion,5);assert.deepEqual(opened.roads,old.roads);assert.deepEqual(opened.buildings,old.buildings);assert.deepEqual(opened.landscape,old.landscape);assert.deepEqual(restore(snapshot(opened)),opened);
});

test('composed landscapes use groups and do not overlap farmland parcels',()=>{
 const m=generateCity({...DEFAULTS.city,seed:'CROW-LANDSCAPE',surroundings:'mixed'}),f=m.landscape.features;
 assert.ok(m.landscape.patches.length>0);assert.ok(f.some(p=>p.patchId));assert.ok(f.some(p=>p.rangeId));
 const fields=f.filter(p=>p.kind==='farmland');
 for(let i=0;i<fields.length;i++)for(let j=i+1;j<fields.length;j++){const a=fields[i].points,b=fields[j].points;assert.ok(!a.some(p=>pointInPolygon(p,b))&&!b.some(p=>pointInPolygon(p,a)),'farmland parcels overlap');}
});


test('unwalled settlements also have outbound roads ending at the map border',()=>{
 for(const terrain of ['plain','river','coast']){const m=generateCity({...DEFAULTS.city,seed:'OPEN-EXITS-'+terrain,terrain,walls:false,surroundings:'mixed'}),approaches=m.roads.filter(r=>r.kind==='approach');assert.equal(m.gates.length,0);assert.ok(approaches.length>=2);assert.ok(connectedRoads(m.roads));for(const road of approaches){const p=road.points.at(-1);assert.ok(Math.min(Math.abs(p.x),Math.abs(1000-p.x),Math.abs(p.y),Math.abs(760-p.y))<1e-6);assert.ok(road.exitId&&!road.gateId);}}
});
