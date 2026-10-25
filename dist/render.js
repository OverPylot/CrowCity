import {esc,num,pointInPolygon,hash} from './generator.js';
import {renderLandscape} from './city-landscape.js';
const points=ps=>ps.map(p=>`${num(p.x)},${num(p.y)}`).join(' ');
const path=ps=>ps.map((p,i)=>`${i?'L':'M'}${num(p.x)} ${num(p.y)}`).join(' ');
function iconShape(icon){return({circle:'<circle r="3" fill="currentColor" stroke="none"/>',star:'<path d="m0-6 1.9 3.9 4.3.6-3.1 3 .7 4.3L0 3.8-3.8 2.8l.7-4.3-3.1-3 4.3-.6Z" fill="currentColor" stroke="none"/>',flag:'<path d="M-3 6V-6h8L2-2l3 3h-8"/>',door:'<path d="M-5 6V-6H5V6M-2 6V-3h5v9M1 1h1"/>',stairs:'<path d="M-6 6h4V2h4v-4h4v-4"/>',skull:'<path d="M-3 5V2a5 5 0 1 1 6 0v3ZM-2-1h.1M2-1h.1M-1 3v2m2-2v2"/>',gem:'<path d="m-6-2 3-4h6l3 4L0 6Zm0 0H6M-3-6 0 6 3-6"/>',temple:'<path d="m-6-2 6-5 6 5ZM-5 5H5M-3-2v7m6-7v7M-6 7H6"/>',inn:'<path d="M-4-4H3V5H-4ZM3-2H6V2H3M-5 7H5M-2-7v2m3-2v2"/>',forge:'<path d="m-5 5 8-8m-3-2 4-2 3 3-2 4Z"/>',tower:'<path d="M-5 6V-6h3v3h4v-3h3V6ZM-2 6V2h4v4"/>'})[icon]||'';}
function defs(doc){return `<defs><pattern id="water-hatch" width="17" height="12" patternUnits="userSpaceOnUse"><path d="M2 6q3-2 7 0t7 0" fill="none" stroke="#b4b4b4" stroke-width=".6"/></pattern><pattern id="stone-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0v6" stroke="#b8b8b8" stroke-width=".65"/></pattern><pattern id="map-grid" width="${doc.type==='city'?24:doc.tile}" height="${doc.type==='city'?24:doc.tile}" x="${doc.origin?.x||0}" y="${doc.origin?.y||0}" patternUnits="userSpaceOnUse"><path d="M${doc.type==='city'?24:doc.tile} 0H0V${doc.type==='city'?24:doc.tile}" fill="none" stroke="#aaa" stroke-width=".4"/></pattern><clipPath id="settlement-clip"><polygon points="${doc.boundary?points(doc.boundary):''}"/></clipPath></defs>`;}
// Roof details are ink only. The stored footprint and hit target stay identical.
function roofDetails(building,seed){
 const b=building,w=b.w,h=b.h,cut=Math.min(h*.28,w*.22),ridges=[],planes=[];
 if(b.landmark&&b.landmark!=='temple'&&b.landmark!=='hall')return specialRoof(b);
 if(b.landmark==='temple'){
  const tower=Math.min(w*.2,h*.29);
  planes.push(`<path d="M${-w/2} ${-h*.2}H${w*.38}L${w/2} ${-h*.12}V0H${-w/2}Z" fill="#e0e0e0" stroke="none"/><rect x="${-w/2+tower*.1}" y="${-tower/2}" width="${tower}" height="${tower}" fill="#fff" stroke="#555" stroke-width=".8"/><path d="M${-w/2+tower*.1} ${-tower/2}l${tower} ${tower}m0 ${-tower}l${-tower} ${tower}" fill="none" stroke="#999" stroke-width=".6"/>`);
  ridges.push(`M${-w/2+tower*1.1} 0H${w*.42}M${w*.01} ${-h/2}V${h/2}M${w*.38} ${-h*.2}L${w*.42} 0L${w*.38} ${h*.2}M${-w*.1} ${-h/2}L${w*.01} ${-h*.36}L${w*.12} ${-h/2}M${-w*.1} ${h/2}L${w*.01} ${h*.36}L${w*.12} ${h/2}`);
 }else if(b.style==='L'){
  ridges.push(`M${-w/2} ${-h/2}L${-w/4} ${-h/4}H${w/2-cut}M${w/2} ${-h/2}L${w/2-cut} ${-h/4}L${w/2} 0M${-w/4} ${-h/4}V${h/2-cut}M${-w/2} ${h/2}L${-w/4} ${h/2-cut}L0 ${h/2}M0 0L${-w/4} ${-h/4}`);
 }else if(b.style==='T'){
  const y=-h/3;
  ridges.push(`M${-w/2} ${-h/2}L${-w/2+cut} ${y}H${w/2-cut}L${w/2} ${-h/2}M${-w/2} ${-h/6}L${-w/2+cut} ${y}M${w/2} ${-h/6}L${w/2-cut} ${y}M0 ${y}V${h/2-cut}M${-w/6} ${h/2}L0 ${h/2-cut}L${w/6} ${h/2}`);
 }else{
  const left=-w/2+cut,right=w/2-cut;
  planes.push(`<path d="M${-w/2} ${-h/2}H${w/2}L${right} 0H${left}Z" fill="#e9e9e9" stroke="none"/>`);
  ridges.push(`M${left} 0H${right}M${-w/2} ${-h/2}L${left} 0L${-w/2} ${h/2}M${w/2} ${-h/2}L${right} 0L${w/2} ${h/2}`);
 }
 const chimney=!b.landmark&&hash(seed+'|'+b.id)%7===0?`<rect x="${num(w*.16)}" y="${num(-h*.34)}" width="2.2" height="3.3" fill="#fbfbfb" stroke="#777" stroke-width=".55"/>`:'';
 const hall=b.landmark==='hall'?[-.24,0,.24].map(x=>`<rect x="${w*x-2}" y="${h*.18}" width="4" height="${h*.18}" fill="#fafafa" stroke="#888" stroke-width=".6"/>`).join(''):'';
 return `<g transform="translate(${num(b.x)} ${num(b.y)}) rotate(${num(b.angle*180/Math.PI)})" pointer-events="none">${planes.join('')}<path d="${ridges.join('')}" fill="none" stroke="#8d8d8d" stroke-width=".55" stroke-linejoin="round"/>${chimney}${hall}</g>`;
}
function specialRoof(b){
 const w=b.w,h=b.h,kind=b.landmark;
 const rect=(x,y,rw,rh,fill='#f4f4f0')=>`<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="${fill}" stroke="#6e6e67" stroke-width=".65"/>`;
 const line=d=>`<path d="${d}" fill="none" stroke="#8c8c84" stroke-width=".65" stroke-linejoin="round"/>`;
 let ink='';
 if(kind==='castle'){
  ink+=rect(-w*.3,-h*.29,w*.6,h*.58,'white');
  for(const x of[-1,1])for(const y of[-1,1]){ink+=rect(x*w*.37-w*.1,y*h*.35-h*.12,w*.2,h*.24,'#e6e6e0');ink+=line(`M${x*w*.37-w*.1} ${y*h*.35-h*.12}l${w*.2} ${h*.24}m0 ${-h*.24}l${-w*.2} ${h*.24}`);}
  ink+=rect(-w*.12,-h*.19,w*.24,h*.32);ink+=line(`M${-w*.12} ${-h*.19}L0 ${-h*.03}L${w*.12} ${-h*.19}M0 ${-h*.03}V${h*.13}`);
 }else if(['manor','barracks','stable'].includes(kind)){
  ink+=line(`M${-w*.36} ${h*.5}V${-h*.31}H${w*.36}V${h*.5}M${-w*.5} ${-h*.5}L${-w*.36} ${-h*.31}M${w*.5} ${-h*.5}L${w*.36} ${-h*.31}`);
  const bays=kind==='stable'?6:kind==='barracks'?8:4;
  for(let i=0;i<bays;i++)ink+=line(`M${-w*.44+i/(bays-1)*w*.88} ${-h*.5}V${-h*.14}`);
  if(kind==='manor')ink+=rect(-w*.13,-h*.11,w*.26,h*.11,'#e1e1dc');
 }else if(kind==='tower'||kind==='bath'){
  const radius=Math.min(w,h)*.34;ink+=`<circle r="${radius}" fill="#e9e9e4" stroke="#77776f" stroke-width=".7"/>`;
  if(kind==='tower'){for(let i=0;i<8;i++){const a=(i+.5)*Math.PI/4;ink+=line(`M0 0L${Math.cos(a)*radius} ${Math.sin(a)*radius}`);}ink+=`<circle r="${radius*.13}" fill="#fafaf7" stroke="#6e6e67" stroke-width=".7"/>`;}
  else{ink+=`<circle r="${radius*.55}" fill="white" stroke="#98988e" stroke-width=".6"/>`;for(const x of[-1,1])ink+=rect(x*w*.3-w*.065,-h*.12,w*.13,h*.24);}
 }else if(kind==='mill'){
  ink+=rect(-w*.22,-h*.22,w*.44,h*.44);for(let i=0;i<4;i++)ink+=`<g transform="rotate(${45+i*90})">${rect(w*.05,-h*.045,w*.4,h*.09,'#e3e3dd')}${line(`M${w*.14} ${-h*.045}v${h*.09}m${w*.1} ${-h*.09}v${h*.09}m${w*.1} ${-h*.09}v${h*.09}`)}</g>`;ink+=`<circle r="${w*.065}" fill="white" stroke="#666" stroke-width=".7"/>`;
 }else if(kind==='monastery'){
  ink+=rect(-w*.27,-h*.25,w*.54,h*.5,'white');ink+=line(`M${-w*.39} ${-h*.38}H${w*.39}V${h*.38}H${-w*.39}Z`);
  for(let i=0;i<7;i++){const x=-w*.24+i*w*.08;ink+=line(`M${x} ${-h*.25}v${-h*.11}M${x} ${h*.25}v${h*.11}`);}ink+=rect(-w*.08,-h*.08,w*.16,h*.16,'#ededdf');
 }else if(kind==='market'){
  ink+=line(`M${-w*.43} ${-h*.25}H${w*.43}M${-w*.43} ${h*.25}H${w*.43}M${-w*.5} 0H${w*.5}`);
  for(let i=1;i<7;i++){const x=-w*.5+i*w/7;ink+=line(`M${x} ${-h*.5}V${h*.5}`);}
 }else if(kind==='library'){
  ink+=line(`M${-w*.43} ${-h*.33}H${w*.43}M0 ${-h*.33}V${h*.43}M${-w*.5} ${-h*.5}L${-w*.43} ${-h*.33}M${w*.5} ${-h*.5}L${w*.43} ${-h*.33}`);
  for(const x of[-.32,-.16,.16,.32])ink+=rect(w*x-w*.035,-h*.47,w*.07,h*.1,'#dfdfda');
 }else{
  ink+=line(`M${-w*.36} ${h*.5}V${-h*.25}H${w*.5}M${-w*.5} ${-h*.5}L${-w*.36} ${-h*.25}M0 0L${-w*.36} ${-h*.25}`);
  if(kind==='forge')ink+=rect(-w*.43,-h*.42,w*.23,h*.23,'#cdcdc7');
  if(kind==='inn')ink+=rect(w*.16,-h*.41,w*.11,h*.18,'#e0e0d9');
 }
 return `<g transform="translate(${num(b.x)} ${num(b.y)}) rotate(${num(b.angle*180/Math.PI)})" pointer-events="none">${ink}</g>`;
}
function streets(roads){
 // Draw every casing first, then every surface. The surfaces erase internal
 // borders at all joins, including joins between different street widths.
 return `<g class="street-casings" fill="none" stroke="#c7c7bf" stroke-linecap="round" stroke-linejoin="round">${roads.map(r=>`<path d="${path(r.points)}" stroke-width="${num(r.width+1.35)}"/>`).join('')}</g><g class="street-surfaces" fill="none" stroke="#fcfcf9" stroke-linecap="round" stroke-linejoin="round">${roads.map(r=>`<path d="${path(r.points)}" stroke-width="${num(r.width)}"/>`).join('')}</g>`;
}
function city(doc,o){
 const out=[renderLandscape(doc)];
 if(doc.water){const w=doc.water,d=path(w.kind==='lake'?w.points:w.fill)+'Z';out.push(`<path d="${d}" fill="url(#water-hatch)" stroke="#dadada" stroke-width="4"/><path d="${d}" fill="url(#water-hatch)" stroke="#777" stroke-width=".9"/>`);}
 out.push(streets(doc.roads.filter(r=>r.kind==='approach')));
 out.push('<g clip-path="url(#settlement-clip)">');
 out.push(streets(doc.roads.filter(r=>r.kind!=='approach')));
 for(const b of doc.bridges||[]){const a=b.points[0],z=b.points.at(-1),len=Math.hypot(z.x-a.x,z.y-a.y),angle=Math.atan2(z.y-a.y,z.x-a.x)*180/Math.PI;out.push(`<g class="city-bridge" transform="translate(${num(a.x)} ${num(a.y)}) rotate(${num(angle)})"><rect x="-2" y="${-b.width/2}" width="${num(len+4)}" height="${b.width}" fill="#fff" stroke="#555" stroke-width="1.1"/>${Array.from({length:Math.floor(len/5)},(_,i)=>`<path d="M${(i+1)*5} ${-b.width/2+2}v${b.width-4}" stroke="#c3c3c3" stroke-width=".6"/>`).join('')}<path d="M-3 ${-b.width/2-1.8}H${num(len+3)}M-3 ${b.width/2+1.8}H${num(len+3)}" fill="none" stroke="#555" stroke-width="1"/></g>`);}
 for(const building of doc.buildings){
  const b=building,shadow=b.points.map(p=>({x:p.x+1.4,y:p.y+1.8}));
  out.push(`<polygon points="${points(shadow)}" fill="#dedede" stroke="none" pointer-events="none"/><g ${o.editor?`data-building="${b.id}" class="base-building"`:''}><polygon class="building-outline" points="${points(b.points)}" fill="#f7f7f7" stroke="#424242" stroke-width="1.05" stroke-linejoin="round"/>${roofDetails(b,doc.settings.seed)}</g>`);
 }
 out.push('</g>');
 if(doc.settings.walls){
  const water=doc.water,waterPath=water?path(water.kind==='lake'?water.points:water.fill)+'Z':'';
  out.push(`<defs><mask id="wall-land"><rect width="1000" height="760" fill="white"/>${waterPath?`<path d="${waterPath}" fill="black" stroke="black" stroke-width="12"/>`:''}</mask></defs><g mask="url(#wall-land)"><polygon points="${points(doc.boundary.map(p=>({x:p.x+1.8,y:p.y+2.2})))}" fill="none" stroke="#d9d9d9" stroke-width="7" stroke-linejoin="round"/><polygon points="${points(doc.boundary)}" fill="none" stroke="#343434" stroke-width="6" stroke-linejoin="round"/><polygon points="${points(doc.boundary)}" fill="none" stroke="#fafafa" stroke-width="3.6" stroke-linejoin="round"/>`);
  for(let i=0;i<doc.boundary.length;i+=9){const p=doc.boundary[i];if(doc.gates.some(g=>Math.hypot(g.x-p.x,g.y-p.y)<20))continue;out.push(`<circle cx="${num(p.x+1)}" cy="${num(p.y+1)}" r="5" fill="#d5d5d5"/><circle cx="${num(p.x)}" cy="${num(p.y)}" r="4.8" fill="#fafafa" stroke="#3b3b3b" stroke-width="1"/><circle cx="${num(p.x)}" cy="${num(p.y)}" r="2.1" fill="none" stroke="#a0a0a0" stroke-width=".55"/>`);}
  out.push('</g>');
  for(const g of doc.gates){const angle=(g.angle??Math.atan2(g.y-(doc.shape?.cy||375),g.x-(doc.shape?.cx||500)))*180/Math.PI;out.push(`<g class="city-gate" transform="translate(${num(g.x)} ${num(g.y)}) rotate(${num(angle)})"><rect x="-7" y="-7" width="14" height="14" fill="white"/><path d="M-8 0H8" stroke="#dedede" stroke-width="9"/><path d="M-8 0H8" stroke="white" stroke-width="7"/><rect x="-5" y="-14" width="10" height="7" fill="#f5f5f5" stroke="#3f3f3f" stroke-width="1"/><rect x="-5" y="7" width="10" height="7" fill="#f5f5f5" stroke="#3f3f3f" stroke-width="1"/><path d="M-3-11H3M-3 11H3" stroke="#999" stroke-width=".6"/></g>`);}
 }
 return out.join('');
}
function roomPath(doc,room){return room.cells.map(p=>`M${doc.origin.x+p.x*doc.tile} ${doc.origin.y+p.y*doc.tile}h${doc.tile}v${doc.tile}h-${doc.tile}Z`).join('');}
// Trace the union of floor cells. Ink can round cave corners without modifying
// room positions, walkable cells, editing coordinates, or the reproducible seed.
function floorContours(doc){
 const {grid,width:w,height:h}=doc,edges=[],starts=new Map(),isFloor=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&grid[y][x];
 function add(x,y,nx,ny,direction){const e={x,y,nx,ny,direction,used:false},key=x+','+y;edges.push(e);if(!starts.has(key))starts.set(key,[]);starts.get(key).push(e);}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(grid[y][x]){
  if(!isFloor(x,y-1))add(x,y,x+1,y,0);
  if(!isFloor(x+1,y))add(x+1,y,x+1,y+1,1);
  if(!isFloor(x,y+1))add(x+1,y+1,x,y+1,2);
  if(!isFloor(x-1,y))add(x,y+1,x,y,3);
 }
 const loops=[],priority=[1,0,3,2];
 for(const first of edges){if(first.used)continue;const loop=[];let edge=first;
  for(let steps=0;edge&&steps<=edges.length;steps++){
   edge.used=true;loop.push({x:edge.x,y:edge.y});
   if(edge.nx===first.x&&edge.ny===first.y)break;
   const candidates=(starts.get(edge.nx+','+edge.ny)||[]).filter(e=>!e.used),previous=edge.direction;
   candidates.sort((a,b)=>priority.indexOf((a.direction-previous+4)%4)-priority.indexOf((b.direction-previous+4)%4));edge=candidates[0];
  }
  const simplified=loop.filter((p,i)=>{const a=loop[(i+loop.length-1)%loop.length],b=loop[(i+1)%loop.length];return(p.x-a.x)*(b.y-p.y)!==(p.y-a.y)*(b.x-p.x);});
  if(simplified.length>=3)loops.push(simplified.map(p=>({x:doc.origin.x+p.x*doc.tile,y:doc.origin.y+p.y*doc.tile})));
 }
 return loops;
}
function roundedLoop(loop,radius){
 if(!radius)return path(loop)+'Z';
 const corners=loop.map((p,i)=>{const before=loop[(i+loop.length-1)%loop.length],after=loop[(i+1)%loop.length],a=Math.hypot(before.x-p.x,before.y-p.y),b=Math.hypot(after.x-p.x,after.y-p.y),r=Math.min(radius,a*.45,b*.45);return{p,input:{x:p.x+(before.x-p.x)*r/a,y:p.y+(before.y-p.y)*r/a},output:{x:p.x+(after.x-p.x)*r/b,y:p.y+(after.y-p.y)*r/b}};});
 return corners.map((c,i)=>`${i?'L':'M'}${num(c.input.x)} ${num(c.input.y)}Q${num(c.p.x)} ${num(c.p.y)} ${num(c.output.x)} ${num(c.output.y)}`).join(' ')+'Z';
}
function dungeon(doc,o){
 const cave=doc.settings.theme==='cave',radius=cave?doc.tile*.29:0,outline=floorContours(doc).map(loop=>roundedLoop(loop,radius)).join(' '),out=[];
 out.push(`<defs><clipPath id="dungeon-floor-clip"><path d="${outline}" clip-rule="evenodd"/></clipPath></defs><path d="${outline}" fill="#fff" fill-rule="evenodd" stroke="url(#stone-hatch)" stroke-width="${doc.tile*1.9}" stroke-linejoin="round"/><path d="${outline}" fill="#fcfcfc" fill-rule="evenodd" stroke="#d3d3d3" stroke-width="4.6" stroke-linejoin="round"/><path d="${outline}" fill="none" stroke="#333" stroke-width="${cave?2.2:2.35}" stroke-linejoin="round"/>`);
 if(o.editor)for(const room of doc.rooms)out.push(`<path d="${roomPath(doc,room)}" fill="transparent" data-room="${room.id}" class="base-room"/>`);
 if(doc.settings.doors)for(const door of doc.doors){out.push(`<g transform="translate(${doc.origin.x+(door.x+.5)*doc.tile} ${doc.origin.y+(door.y+.5)*doc.tile}) rotate(${door.horizontal?90:0})"><rect x="${-doc.tile/2}" y="-2" width="${doc.tile}" height="4" fill="white" stroke="#333" stroke-width=".85"/></g>`);}
 return out.join('');
}
function center(polygon){let x=0,y=0,a=0;for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length],c=p.x*q.y-q.x*p.y;a+=c;x+=(p.x+q.x)*c;y+=(p.y+q.y)*c;}const c=Math.abs(a)>.001?{x:x/(3*a),y:y/(3*a)}:{x:polygon[0].x,y:polygon[0].y};if(pointInPolygon(c,polygon))return c;return{x:polygon.reduce((s,p)=>s+p.x,0)/polygon.length,y:polygon.reduce((s,p)=>s+p.y,0)/polygon.length};}
function labelInk(color){const channels=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));if(channels.some(Number.isNaN))return '#33422d';const luminance=channels.map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);return luminance>.18?'#'+channels.map(c=>Math.round(c*.65).toString(16).padStart(2,'0')).join(''):color;}
function label(a,x,y,o,dy=-17){return o.labels&&a.showLabel&&a.name?`<text x="${num(x)}" y="${num(y+dy)}" text-anchor="middle" font-family="Georgia,serif" font-size="${a.fontSize||16}" fill="${labelInk(a.color)}" stroke="white" stroke-width="3.5" paint-order="stroke" letter-spacing="${a.kind==='district'?'.6':'.1'}" pointer-events="none">${esc(a.name)}</text>`:'';}
function annotation(doc,a,o){const selected=o.editor&&a.id===o.selected,attr=o.editor?`data-annotation="${esc(a.id)}" tabindex="0" role="button" aria-label="${esc(a.name||a.category||'Jelölés')}"`:'';let content='';
 if(a.kind==='district'){if(o.districts===false)return'';const c=center(a.points);content=`<polygon points="${points(a.points)}" fill="${a.color}" fill-opacity="${a.opacity}" stroke="${labelInk(a.color)}" stroke-opacity=".65" stroke-width="${selected?2.5:1.3}" stroke-dasharray="${selected?'5 3':'none'}"/>${label(a,c.x,c.y,o,4)}`;}
 else if(a.kind==='building'){if(o.buildings===false)return'';let x=a.x,y=a.y;const b=doc.buildings?.find(b=>b.id===a.buildingId),room=doc.rooms?.find(r=>r.id===a.roomId);if(b){x=b.x;y=b.y;content+=`<polygon points="${points(b.points)}" fill="${a.color}" fill-opacity=".72" stroke="${a.color}" stroke-width="${selected?3:1.8}"/>`;}else if(room){x=doc.origin.x+room.cx*doc.tile;y=doc.origin.y+room.cy*doc.tile;content+=`<path d="${roomPath(doc,room)}" fill="${a.color}" fill-opacity=".4" stroke="${a.color}" stroke-width=".3" clip-path="url(#dungeon-floor-clip)"/>`;}
 content+=`<g transform="translate(${num(x)} ${num(y)})" style="color:${a.color}"><circle r="9" fill="white" stroke="${a.color}" stroke-width="${selected?2.8:1.4}"/><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${iconShape(a.icon)}</g></g>${label(a,x,y,o)}`;
 }else if(a.kind==='pin'){if(o.pins===false)return'';content=`<g transform="translate(${num(a.x)} ${num(a.y)})" style="color:white"><path d="M0 15C-4 7-10 4-10-2a10 10 0 0 1 20 0c0 6-6 9-10 17Z" fill="${a.color}" stroke="${selected?'#272923':'white'}" stroke-width="${selected?2:1.5}"/><g transform="translate(0 -2)" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${iconShape(a.icon)}</g></g>${label(a,a.x,a.y,o,-20)}`;
 }else{if(o.pins===false)return'';content=`<text x="${num(a.x)}" y="${num(a.y)}" text-anchor="middle" font-family="Georgia,serif" font-size="${a.fontSize}" fill="${labelInk(a.color)}" stroke="white" stroke-width="3" paint-order="stroke">${esc(a.name)}</text>${selected?`<circle cx="${num(a.x)}" cy="${num(a.y+8)}" r="3" fill="${a.color}"/>`:''}`;}
 return `<g ${attr} class="user-annotation ${selected?'selected':''}"><title>${esc(a.name||a.category||'Jelölés')}</title>${content}</g>`;
}
export function renderSVG(doc,opts={}){const o={editor:false,labels:true,grid:false,player:false,districts:true,buildings:true,pins:true,selected:null,draft:[],...opts};const annotations=doc.annotations.filter(a=>!o.player||!a.hidden),districts=annotations.filter(a=>a.kind==='district'),other=annotations.filter(a=>a.kind!=='district');let handles='';const selected=annotations.find(a=>a.id===o.selected);if(o.editor&&o.districts!==false&&selected?.kind==='district')handles=selected.points.map((p,i)=>`<circle cx="${num(p.x)}" cy="${num(p.y)}" r="10" fill="transparent" data-vertex="${i}" data-owner="${esc(selected.id)}" class="vertex-hit"/><circle cx="${num(p.x)}" cy="${num(p.y)}" r="5" fill="white" stroke="${selected.color}" stroke-width="2" data-vertex="${i}" data-owner="${esc(selected.id)}" class="vertex-handle"/>`).join('');const draft=o.draft.length?`<g pointer-events="none"><polyline points="${points(o.draft)}" fill="#7196c9" fill-opacity=".15" stroke="#577da5" stroke-width="1.5" stroke-dasharray="5 3"/>${o.draft.map((p,i)=>`<circle cx="${num(p.x)}" cy="${num(p.y)}" r="${i===0?6:4}" fill="white" stroke="#577da5" stroke-width="1.5"/>`).join('')}</g>`:'';
 const mapTitle=doc.title||(o.language==='en'?'Untitled map':'Névtelen térkép');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="760" viewBox="0 0 1000 760" role="img" aria-label="${esc(mapTitle)}"><title>${esc(mapTitle)}</title><desc>CrowCity. Seed: ${esc(doc.settings.seed)}. ${o.language==='en'?(o.player?'Player view.':'Editor view.'):(o.player?'Játékosnézet.':'Szerkesztői nézet.')}</desc>${defs(doc)}<rect width="1000" height="760" fill="white"/><g id="world-layer">${doc.type==='city'?city(doc,o):dungeon(doc,o)}${o.grid?'<rect width="1000" height="760" fill="url(#map-grid)" pointer-events="none"/>':''}${districts.map(a=>annotation(doc,a,o)).join('')}${other.map(a=>annotation(doc,a,o)).join('')}${handles}${draft}</g></svg>`;
 const namespace='kv-'+hash(doc.type+'|'+JSON.stringify(doc.settings)+'|'+(doc.generatorVersion||2));
 return svg.replace(/ id="(?!world-layer)([^"]+)"/g,(_,id)=>` id="${namespace}-${id}"`).replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${namespace}-${id})`);
}
