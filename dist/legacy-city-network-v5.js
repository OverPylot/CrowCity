// City infrastructure is planned before plots are occupied. Routing stays on
// dry land; the only water edges in the navigation graph are explicit bridges.
const STEP=8,WIDTH=125,HEIGHT=95,LINK_WIDTH=7;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function inside(p,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
function pointSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return distance(p,{x:a.x+dx*t,y:a.y+dy*t});}
function boundaryDistance(p,poly){let best=Infinity;for(let i=0;i<poly.length;i++)best=Math.min(best,pointSegment(p,poly[i],poly[(i+1)%poly.length]));return best;}
function roadsTouch(a,b){for(let i=1;i<a.points.length;i++)for(let j=1;j<b.points.length;j++){const p=a.points[i-1],q=a.points[i],r=b.points[j-1],s=b.points[j];if(cross(p,q,r)*cross(p,q,s)<0&&cross(r,s,p)*cross(r,s,q)<0)return true;if(Math.min(pointSegment(p,r,s),pointSegment(q,r,s),pointSegment(r,p,q),pointSegment(s,p,q))<=(a.width+b.width)/2)return true;}return false;}
export function housingScale(settings){return .65+settings.buildingSize*.13;}
export function streetSpacing(settings){return 2*(18*housingScale(settings)+5)+8;}
// Test complete house footprints, including setbacks, rather than only a
// center-point distance. A lane squeezed against a wall or bank fails here.
export function hasBuildingSpace(road,roads,boundary,water,settings){
 const scale=housingScale(settings),w=9*scale,h=10*scale;
 for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],length=distance(a,b);if(length<w+3)continue;
  const dx=(b.x-a.x)/length,dy=(b.y-a.y)/length,n=Math.ceil(length/Math.max(w,12));
  for(let j=0;j<n;j++)for(const side of[-1,1]){
   const t=(j+.5)/n,offset=road.width/2+h/2+3.8,x=a.x+(b.x-a.x)*t-dy*offset*side,y=a.y+(b.y-a.y)*t+dx*offset*side;
   const points=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([u,v])=>({x:x+dx*u-dy*v,y:y+dy*u+dx*v}));
   if(clearPlot(points,boundary,water,[...roads,road],2.2))return true;
  }
 }
 return false;
}
export function wet(p,water,margin=0){
 if(!water)return false;
 const polygon=water.kind==='lake'?water.points:water.fill;
 if(inside(p,polygon))return true;
 if(water.kind==='river'){for(let i=1;i<water.points.length;i++)if(pointSegment(p,water.points[i-1],water.points[i])<water.width/2+margin)return true;return false;}
 if(margin>0){const ps=water.points,end=water.kind==='lake'?ps.length:ps.length-1;for(let i=0;i<end;i++)if(pointSegment(p,ps[i],ps[(i+1)%ps.length])<margin)return true;}
 return false;
}
function samples(a,b,fn,step=3){const n=Math.max(1,Math.ceil(distance(a,b)/step));for(let k=0;k<=n;k++)if(!fn({x:a.x+(b.x-a.x)*k/n,y:a.y+(b.y-a.y)*k/n}))return false;return true;}
function simplify(ps){return ps.filter((p,i)=>i===0||i===ps.length-1||Math.abs(cross(ps[i-1],p,ps[i+1]))>1e-6);}
const cellPoint=id=>({x:(id%WIDTH)*STEP+STEP/2,y:Math.floor(id/WIDTH)*STEP+STEP/2});
class Heap{
 constructor(){this.items=[];}
 push(id,cost){const a=this.items,item={id,cost};let i=a.length;a.push(item);while(i){const p=(i-1)>>1;if(a[p].cost<=cost)break;a[i]=a[p];i=p;}a[i]=item;}
 pop(){const a=this.items,top=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].cost<a[c].cost)c++;if(a[c].cost>=last.cost)break;a[i]=a[c];i=c;}a[i]=last;}return top;}
}
function navigation(boundary,water){
 const land=(p,width=LINK_WIDTH)=>inside(p,boundary)&&boundaryDistance(p,boundary)>width/2+3&&!wet(p,water,width/2+2);
 const clear=(a,b,width=LINK_WIDTH)=>samples(a,b,p=>land(p,width));
 const valid=new Uint8Array(WIDTH*HEIGHT),edges=new Map(),jumps=new Map();
 for(let id=0;id<valid.length;id++)valid[id]=land(cellPoint(id))?1:0;
 function nearest(p,max=28){let best=null,d=max;const cx=Math.round((p.x-4)/STEP),cy=Math.round((p.y-4)/STEP),r=Math.ceil(max/STEP);for(let y=Math.max(0,cy-r);y<=Math.min(HEIGHT-1,cy+r);y++)for(let x=Math.max(0,cx-r);x<=Math.min(WIDTH-1,cx+r);x++){const id=y*WIDTH+x;if(!valid[id])continue;const q=cellPoint(id),n=distance(p,q);if(n<d&&clear(p,q)){best=id;d=n;}}return best;}
 function neighbors(id){if(!edges.has(id)){const x=id%WIDTH,y=Math.floor(id/WIDTH),p=cellPoint(id),out=[];for(const[dx,dy]of[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]]){const nx=x+dx,ny=y+dy,n=ny*WIDTH+nx;if(nx>=0&&ny>=0&&nx<WIDTH&&ny<HEIGHT&&valid[n]&&clear(p,cellPoint(n)))out.push([n,STEP*Math.hypot(dx,dy)]);}edges.set(id,out);}return [...edges.get(id),...(jumps.get(id)||[])];}
 function addBridge(a,b){const weight=distance(cellPoint(a),cellPoint(b));for(const[from,to]of[[a,b],[b,a]]){if(!jumps.has(from))jumps.set(from,[]);jumps.get(from).push([to,weight]);}}
 function reachable(start){const found=new Set([start]),queue=[start];for(let i=0;i<queue.length;i++)for(const[id]of neighbors(queue[i]))if(!found.has(id)){found.add(id);queue.push(id);}return found;}
 function route(starts,goals){
  const costs=new Float64Array(valid.length).fill(Infinity),parents=new Int32Array(valid.length).fill(-1),heap=new Heap();
  for(const id of starts){costs[id]=0;parents[id]=id;heap.push(id,0);}
  while(heap.items.length){const next=heap.pop();if(next.cost!==costs[next.id])continue;if(goals.has(next.id)){const result=[next.id];while(parents[result.at(-1)]!==result.at(-1))result.push(parents[result.at(-1)]);return result.reverse();}for(const[id,step]of neighbors(next.id)){const cost=next.cost+step;if(cost<costs[id]){costs[id]=cost;parents[id]=next.id;heap.push(id,cost);}}}
  return null;
 }
 return{land,clear,valid,nearest,neighbors,addBridge,reachable,route,jumps};
}
function chooseBridges(shape,water,nav,count){
 if(water?.kind!=='river')return[];
 const candidates=[];
 for(let i=1;i<water.points.length-1;i++){
  const p=water.points[i],a=water.points[i-1],b=water.points[i+1],len=distance(a,b),normal={x:(b.y-a.y)/len,y:-(b.x-a.x)/len};if(!inside(p,shape.boundary))continue;
  const banks=[];for(const sign of[-1,1]){let bank=null;for(let d=water.width/2+12;d<water.width+130;d+=4){const q={x:p.x+normal.x*d*sign,y:p.y+normal.y*d*sign};if(nav.land(q)){const id=nav.nearest(q,16);if(id!==null){bank=id;break;}}}banks.push(bank);}
  if(banks.some(id=>id===null)||banks[0]===banks[1])continue;
  const ends=banks.map(cellPoint),valid=samples(ends[0],ends[1],q=>inside(q,shape.boundary)&&boundaryDistance(q,shape.boundary)>16);if(!valid)continue;
  candidates.push({points:ends,cells:banks,width:16,main:true,kind:'bridge',score:distance(p,{x:shape.cx,y:shape.cy})});
 }
 candidates.sort((a,b)=>a.score-b.score);const chosen=[];
 for(const b of candidates){const mid={x:(b.points[0].x+b.points[1].x)/2,y:(b.points[0].y+b.points[1].y)/2};if(chosen.some(q=>pointSegment(mid,...q.points)<130))continue;chosen.push(b);nav.addBridge(...b.cells);if(chosen.length===count)break;}
 return chosen;
}
function trimRoad(road,nav){
 const out=[];let part=[];
 const flush=()=>{if(part.length>1){const ps=simplify(part);if(ps.reduce((n,p,i)=>n+(i?distance(ps[i-1],p):0),0)>22)out.push({...road,points:ps});}part=[];};
 for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],n=Math.max(1,Math.ceil(distance(a,b)/2));for(let k=i===1?0:1;k<=n;k++){const p={x:a.x+(b.x-a.x)*k/n,y:a.y+(b.y-a.y)*k/n};if(nav.land(p,road.width))part.push(p);else flush();}}
 flush();return out;
}
function anchors(road,nav,reachable){const list=new Map(),ps=road.points;for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[Math.min(i+1,ps.length-1)],n=Math.max(1,Math.ceil(distance(a,b)/10));for(let k=0;k<=n;k++){const p={x:a.x+(b.x-a.x)*k/n,y:a.y+(b.y-a.y)*k/n},id=nav.nearest(p,12);if(id!==null&&(!reachable||reachable.has(id))&&!list.has(id))list.set(id,p);}}return list;}
function addRoute(cells,start,end,roads,nav,root,extra={}){
 const parts=[];let part=[start,cellPoint(cells[0])];
 for(let i=1;i<cells.length;i++){const jump=nav.jumps.get(cells[i-1])?.some(([id])=>id===cells[i]);if(jump){parts.push(part);part=[cellPoint(cells[i])];}else part.push(cellPoint(cells[i]));}
 part.push(end);parts.push(part);
 for(const ps of parts){const compact=ps.filter((p,i)=>i===0||distance(p,ps[i-1])>.01),smooth=[];for(let i=0;i<compact.length;){smooth.push(compact[i]);if(i===compact.length-1)break;let next=i+1;for(let j=compact.length-1;j>i+1;j--)if(nav.clear(compact[i],compact[j])){next=j;break;}i=next;}if(smooth.length<2)continue;const road={points:smooth,width:LINK_WIDTH,main:true,kind:'connector',...extra};roads.push(road);for(const[id,p]of anchors(road,nav))root.set(id,p);}
}
function chooseGates(settings,shape,water,nav,reachable,root,roads,random){
 if(!settings.walls)return[];
 const boundary=shape.boundary,candidates=[];
 for(let i=0;i<boundary.length;i++){
  const p=boundary[i],before=boundary[(i+boundary.length-1)%boundary.length],after=boundary[(i+1)%boundary.length],len=distance(before,after);let inward={x:-(after.y-before.y)/len,y:(after.x-before.x)/len};if(!inside({x:p.x+inward.x*10,y:p.y+inward.y*10},boundary))inward={x:-inward.x,y:-inward.y};
  if(wet(p,water,20))continue;const inner={x:p.x+inward.x*26,y:p.y+inward.y*26},id=nav.nearest(inner,20);if(id===null||!reachable.has(id))continue;
  const endpoint=cellPoint(id);if(!samples(p,endpoint,q=>!wet(q,water,LINK_WIDTH/2+2)&&(inside(q,boundary)||distance(q,p)<.01)))continue;
  const outside={x:p.x-inward.x*64,y:p.y-inward.y*64};
  if(!samples(p,outside,q=>q.x>12&&q.x<988&&q.y>12&&q.y<748&&!wet(q,water,7)))continue;
  candidates.push({x:p.x,y:p.y,index:i,cell:id,angle:Math.atan2(-inward.y,-inward.x),outside});
 }
 const gates=[],phase=random()*boundary.length;
 for(let i=0;i<settings.gates;i++){
  const ideal=(phase+i/settings.gates*boundary.length)%boundary.length,rank=q=>Math.min(Math.abs(q.index-ideal),boundary.length-Math.abs(q.index-ideal));
  const available=candidates.filter(q=>gates.every(g=>distance(q,g)>32)).sort((a,b)=>rank(a)-rank(b));
  for(const g of available){const route=nav.route([g.cell],root);if(!route)continue;const endpoint=cellPoint(g.cell),gate={x:g.x,y:g.y,angle:g.angle,id:'gate-'+(gates.length+1)};addRoute(route,endpoint,root.get(route.at(-1)),roads,nav,root,{gateId:gate.id});roads.push({points:[{x:g.x,y:g.y},endpoint],width:10,main:true,kind:'gate',gateId:gate.id});roads.push({points:[{x:g.x,y:g.y},g.outside],width:10,main:true,kind:'approach',gateId:gate.id});root.set(g.cell,endpoint);gates.push(gate);break;}
 }
 return gates;
}
export function planCityNetwork(settings,shape,water,network,random){
 const nav=navigation(shape.boundary,water),bridges=chooseBridges(shape,water,nav,settings.size==='city'?2:1),fragments=network.roads.flatMap(road=>trimRoad(road,nav));
 fragments.sort((a,b)=>Number(b.main)-Number(a.main)||distance(b.points[0],b.points.at(-1))-distance(a.points[0],a.points.at(-1)));
 const planned=[...bridges,...fragments],roads=[],root=new Map();let reachable=null;
 for(const road of planned){const a=anchors(road,nav,reachable);if(!a.size)continue;if(!reachable)reachable=nav.reachable(a.keys().next().value);const valid=new Map([...a].filter(([id])=>reachable.has(id)));if(!valid.size)continue;
  if(road.kind!=='bridge'){
   if(!hasBuildingSpace(road,roads,shape.boundary,water,settings))continue;
   const crowded=roads.filter(old=>old.kind==='street'&&roadsTouch({...road,width:road.width+streetSpacing(settings)},old));
   if(crowded.some(old=>!hasBuildingSpace(old,[...roads,road],shape.boundary,water,settings)))continue;
   road.kind='street';
  }
  // Intersecting streets already belong to the network. Routing them again
  // created the short doubled lines and tiny loops visible in old maps.
  if(root.size&&!roads.some(existing=>roadsTouch(road,existing))){const route=nav.route([...valid.keys()],root);if(!route)continue;addRoute(route,valid.get(route[0]),root.get(route.at(-1)),roads,nav,root);}
  roads.push(road);for(const[id,p]of valid)root.set(id,p);
 }
 // Very sparse layouts still receive a dry, connected street before any gate.
 if(!root.size){for(let id=0;id<nav.valid.length;id++)if(nav.valid[id]){const edge=nav.neighbors(id)[0];if(!edge)continue;const road={points:[cellPoint(id),cellPoint(edge[0])],width:7,main:true,kind:'connector'};roads.push(road);root.set(id,road.points[0]);root.set(edge[0],road.points[1]);reachable=nav.reachable(id);break;}}
 const gates=chooseGates(settings,shape,water,nav,reachable||new Set(),root,roads,random);
 return{...network,roads,bridges:roads.filter(r=>r.kind==='bridge').map(({cells,score,...b},i)=>({...b,id:'bridge-'+(i+1)})),gates};
}

export function finishStreetPlots(network,buildings){
 const roads=[...network.roads],occupied=new Set(buildings.map(b=>network.roads[b.frontage.roadIndex]));
 const connected=list=>{if(!list.length)return false;const seen=new Set([list[0]]),queue=[list[0]];for(let i=0;i<queue.length;i++)for(const road of list)if(!seen.has(road)&&roadsTouch(queue[i],road)){seen.add(road);queue.push(road);}return seen.size===list.length;};
 for(let i=roads.length-1;i>=0;i--){const road=roads[i];if(road.kind!=='street'||occupied.has(road))continue;const rest=roads.filter(r=>r!==road);if(connected(rest))roads.splice(i,1);else road.kind='connector';}
 const index=new Map(roads.map((road,i)=>[road,i]));
 for(const building of buildings)building.frontage.roadIndex=index.get(network.roads[building.frontage.roadIndex]);
 return{...network,roads};
}

export function clearPlot(points,boundary,water,roads,margin=2){
 for(let i=0;i<points.length;i++)if(!samples(points[i],points[(i+1)%points.length],p=>inside(p,boundary)&&boundaryDistance(p,boundary)>4&&!wet(p,water,margin)))return false;
 for(const road of roads)for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i];if(inside(a,points)||inside(b,points))return false;for(let k=0;k<points.length;k++){const c=points[k],d=points[(k+1)%points.length];if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return false;if(Math.min(pointSegment(c,a,b),pointSegment(d,a,b),pointSegment(a,c,d),pointSegment(b,c,d))<road.width/2+margin)return false;}}
 return true;
}
