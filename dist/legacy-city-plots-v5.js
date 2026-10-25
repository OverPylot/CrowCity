import {clearPlot} from './legacy-city-network-v5.js';

// Each selected type is a real footprint. Names and map markers remain manual.
export const SPECIAL_BUILDINGS=[
 {id:'temple',name:'Templom',w:48,h:34,shape:'temple',icon:'temple'},
 {id:'hall',name:'Nagycsarnok',w:46,h:30,shape:'rect',icon:'tower'},
 {id:'castle',name:'Vár / erőd',w:64,h:56,shape:'rect',icon:'tower'},
 {id:'manor',name:'Nemesi kúria',w:48,h:36,shape:'U',icon:'star'},
 {id:'inn',name:'Fogadó',w:38,h:30,shape:'L',icon:'inn'},
 {id:'market',name:'Piacház',w:52,h:28,shape:'rect',icon:'gem'},
 {id:'forge',name:'Kovácsműhely',w:32,h:27,shape:'L',icon:'forge'},
 {id:'barracks',name:'Őrség / kaszárnya',w:52,h:30,shape:'U',icon:'tower'},
 {id:'library',name:'Könyvtár',w:42,h:32,shape:'T',icon:'star'},
 {id:'tower',name:'Mágustorony',w:29,h:29,shape:'octagon',icon:'tower'},
 {id:'mill',name:'Malom',w:34,h:34,shape:'rect',icon:'circle'},
 {id:'stable',name:'Istálló',w:46,h:29,shape:'U',icon:'inn'},
 {id:'monastery',name:'Kolostor',w:54,h:44,shape:'rect',icon:'temple'},
 {id:'bath',name:'Fürdőház',w:39,h:32,shape:'octagon',icon:'circle'}
];
export function selectedSpecials(raw,fallback=['temple','hall']){
 const requested=Array.isArray(raw.specialBuildings)?raw.specialBuildings:
  raw.landmarks!==undefined?['temple','hall'].slice(0,Math.max(0,Math.min(2,Math.round(Number(raw.landmarks)||0)))):fallback;
 return SPECIAL_BUILDINGS.filter(b=>requested.includes(b.id)).map(b=>b.id);
}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function inside(p,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function pointSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return dist(p,{x:a.x+t*dx,y:a.y+t*dy});}
function overlap(a,b,gap=2.5){
 if(dist(a,b)>a.radius+b.radius+gap)return false;
 if(a.points.some(p=>inside(p,b.points))||b.points.some(p=>inside(p,a.points)))return true;
 for(let i=0;i<a.points.length;i++)for(let j=0;j<b.points.length;j++){
  const p=a.points[i],q=a.points[(i+1)%a.points.length],r=b.points[j],s=b.points[(j+1)%b.points.length];
  if(cross(p,q,r)*cross(p,q,s)<0&&cross(r,s,p)*cross(r,s,q)<0)return true;
  if(Math.min(pointSegment(p,r,s),pointSegment(q,r,s),pointSegment(r,p,q),pointSegment(s,p,q))<gap)return true;
 }
 return false;
}
function footprint(w,h,style){
 let ps;
 if(style==='temple')ps=[[-.5,-.2],[-.12,-.2],[-.12,-.5],[.12,-.5],[.12,-.2],[.38,-.2],[.5,-.12],[.5,.12],[.38,.2],[.12,.2],[.12,.5],[-.12,.5],[-.12,.2],[-.5,.2]];
 else if(style==='L')ps=[[-.5,-.5],[.5,-.5],[.5,0],[0,0],[0,.5],[-.5,.5]];
 else if(style==='T')ps=[[-.5,-.5],[.5,-.5],[.5,-1/6],[1/6,-1/6],[1/6,.5],[-1/6,.5],[-1/6,-1/6],[-.5,-1/6]];
 else if(style==='U')ps=[[-.5,-.5],[.5,-.5],[.5,.5],[.22,.5],[.22,-.12],[-.22,-.12],[-.22,.5],[-.5,.5]];
 else if(style==='octagon')ps=Array.from({length:8},(_,i)=>{const a=(i+.5)*Math.PI/4;return[Math.cos(a)*.5,Math.sin(a)*.5];});
 else ps=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
 return ps.map(([x,y])=>({x:x*w,y:y*h}));
}
function candidate(segment,t,w,h,style,side,setback=3.5){
 const {a,b,length,roadIndex,segmentIndex,width}=segment,angle=Math.atan2(b.y-a.y,b.x-a.x),front={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},offset=width/2+h/2+setback;
 const x=front.x-Math.sin(angle)*offset*side,y=front.y+Math.cos(angle)*offset*side;
 const points=footprint(w,h,style).map(p=>({x:x+p.x*Math.cos(angle)-p.y*Math.sin(angle),y:y+p.x*Math.sin(angle)+p.y*Math.cos(angle)}));
 return{x,y,w,h,angle,style,points,radius:Math.hypot(w,h)/2,frontage:{roadIndex,segmentIndex,x:front.x,y:front.y,side,setback}};
}
function streetSegments(roads){
 const segments=[];
 roads.forEach((road,roadIndex)=>{if(['bridge','gate','approach'].includes(road.kind))return;for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],length=dist(a,b);if(length>=9)segments.push({a,b,length,width:road.width,roadIndex,segmentIndex:i-1,main:road.main});}});
 return segments;
}
function shuffle(list,r){for(let i=list.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;}
export function placeCityBuildings(settings,shape,water,network,r){
 const segments=streetSegments(network.roads),buildings=[];
 const clear=b=>clearPlot(b.points,shape.boundary,water,network.roads,2.2)&&!buildings.some(other=>overlap(b,other));
 const specs=SPECIAL_BUILDINGS.filter(s=>settings.specialBuildings.includes(s.id)).sort((a,b)=>b.w*b.h-a.w*a.h);
 const sites=shuffle(segments.flatMap(segment=>Array.from({length:Math.ceil(segment.length/7)},(_,i)=>({segment,t:(i+.5)/Math.ceil(segment.length/7)}))),r);
 for(const spec of specs){
  let found=null;
  for(const factor of[1,.86,.72,.6,.5,.42]){
   const scale=factor*(.9+settings.buildingSize*.035);
   for(const site of sites){for(const side of[-1,1]){
    const b=candidate(site.segment,site.t,spec.w*scale,spec.h*scale,spec.shape,side,4.5);
    if(clear(b)){found={...b,id:'landmark-'+spec.id,landmark:spec.id};break;}
   }if(found)break;}
   if(found)break;
  }
  if(!found)throw new Error('A kiválasztott '+spec.name.toLocaleLowerCase('hu')+' nem fér el. Válassz nagyobb települést vagy ritkább utcahálózatot.');
  buildings.push(found);
 }
 // Keep the selection order stable, independent of placement priority.
 buildings.sort((a,b)=>settings.specialBuildings.indexOf(a.landmark)-settings.specialBuildings.indexOf(b.landmark));
 const scale=.65+settings.buildingSize*.13,target=Math.round(({village:100,town:245,city:440}[settings.size])*(.3+settings.density*.22));
 const ordered=shuffle([...segments],r).sort((a,b)=>Number(b.main)-Number(a.main));
 // Reserve one buildable frontage on every residential street before filling
 // rows. Sparse density settings still leave genuine, usable building plots.
 network.roads.forEach((road,roadIndex)=>{
  if(road.kind!=='street'||buildings.some(b=>b.frontage.roadIndex===roadIndex))return;
  const candidates=segments.filter(s=>s.roadIndex===roadIndex);
  for(const size of[1,.8])for(const segment of candidates){
   const w=11*scale*size,h=12*scale*size,n=Math.ceil(segment.length/7);
   for(let i=0;i<n;i++)for(const side of[-1,1]){
    if(buildings.some(b=>b.frontage.roadIndex===roadIndex))return;
    const b=candidate(segment,(i+.5)/n,w,h,'rect',side,3.8);
    if(clear(b))buildings.push({...b,id:'b'+(buildings.length+1)});
   }
  }
 });
 const occupancy=.27+settings.density*.145;
 for(const segment of ordered)for(const side of[-1,1]){
  let along=3+r()*8;
  while(along<segment.length-3&&buildings.length<target){
   const w=(9+r()*11)*scale,h=(10+r()*11)*scale,step=w+2.8+r()*2.8;
   if(along+w/2>segment.length-1)break;
   const draw=r(),style=settings.era==='victorian'?(draw<.18?'T':draw<.45?'L':'rect'):(draw<.2?'L':'rect');
   const b=candidate(segment,(along+w/2)/segment.length,w,h,style,side,3+r()*1.2);
   if(r()<occupancy&&clear(b))buildings.push({...b,id:'b'+(buildings.length+1)});
   along+=step;
  }
 }
 return buildings;
}
