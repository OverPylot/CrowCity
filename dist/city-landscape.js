import {wet} from './city-network.js';

export const LANDSCAPES=[
 ['none','Üres környezet'],['meadow','Mezők és rétek'],['farmland','Művelt földek'],
 ['forest','Erdős vidék'],['hills','Dombvidék'],['mountains','Hegyvidék'],['mixed','Vegyes táj']
];
function inside(p,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
function distanceToSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
function polygonsOverlap(a,b){
 if(!a||!b)return false;
 for(const poly of[a,b])for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],axis={x:q.y-p.y,y:p.x-q.x},project=ps=>ps.map(v=>v.x*axis.x+v.y*axis.y),u=project(a),v=project(b);
  if(Math.max(...u)<Math.min(...v)||Math.max(...v)<Math.min(...u))return false;
 }
 return true;
}
export function makeLandscape(settings,shape,water,roads,r){
 const environment=settings.surroundings,features=[],patches=[];
 if(environment==='none')return{environment,features,patches};
 const density=settings.landscapeDensity,sites=[];
 const fits=(x,y,radius)=>{
  const p={x,y};if(x-radius<10||x+radius>990||y-radius<10||y+radius>750||inside(p,shape.boundary)||wet(p,water,radius+5))return false;
  if(shape.boundary.some((a,i)=>distanceToSegment(p,a,shape.boundary[(i+1)%shape.boundary.length])<radius+13))return false;
  return !roads.some(road=>road.points.some((a,i)=>i&&distanceToSegment(p,road.points[i-1],a)<radius+road.width/2+7));
 };
 for(let i=0;i<360;i++){const p={x:35+r()*930,y:35+r()*690};if(fits(p.x,p.y,30))sites.push(p);}
 const count=environment==='mixed'?9:environment==='farmland'?7:7,centers=[];
 for(let k=0;k<count&&sites.length;k++){
  let best=0,score=-1;
  for(let i=0;i<sites.length;i++){const p=sites[i],d=centers.length?Math.min(...centers.map(q=>Math.hypot(p.x-q.x,p.y-q.y))):1;const value=d*(.9+r()*.2);if(value>score){score=value;best=i;}}
  centers.push(sites.splice(best,1)[0]);
 }
 const families=environment==='mixed'?['forest','farmland','mountains','forest','meadow','hills','farmland','forest','meadow']:centers.map(()=>environment);
 const occupied=[];
 const add=(family,x,y,size,extra={})=>{
  const radius=extra.radius??(family==='mountains'?size*1.22:family==='hills'?size*1.1:family==='forest'?size*1.55:size);
  if(!fits(x,y,radius))return false;
  const spacing=family==='forest'?size*(2.35-density*.08):family==='meadow'?size*3:family==='mountains'?size*.8:size;
  if(family==='farmland'&&features.some(f=>f.kind==='farmland'&&polygonsOverlap(f.points,extra.points)))return false;
  if(occupied.some(f=>f.kind===family&&Math.hypot(f.x-x,f.y-y)<(spacing+f.spacing)/2))return false;
  const feature={id:'landscape-'+features.length,kind:family,x,y,size,radius,variant:Math.floor(r()*3),angle:(r()-.5)*.11,...extra};features.push(feature);occupied.push({...feature,spacing});return true;
 };
 centers.forEach((center,zone)=>{
  const before=features.length;
  const family=families[zone],angle=r()*Math.PI,rx=90+r()*90,ry=60+r()*85,phase=r()*6.28;
  const at=(x,y)=>({x:center.x+Math.cos(angle)*x-Math.sin(angle)*y,y:center.y+Math.sin(angle)*x+Math.cos(angle)*y});
  if(family==='forest'||family==='meadow'){
   const attempts=family==='forest'?180+density*65:65+density*20;
   const outline=Array.from({length:28},(_,i)=>{const a=i/28*Math.PI*2,scale=1+.13*Math.sin(a*3+phase)+.08*Math.sin(a*5-phase);return at(Math.cos(a)*rx*scale,Math.sin(a)*ry*scale);});
   if(family==='forest')patches.push({id:'grove-'+zone,kind:family,points:outline});
   for(let i=0;i<attempts;i++){
    const theta=r()*Math.PI*2,rad=Math.sqrt(r()),edge=1+.16*Math.sin(theta*3+phase),p=at(Math.cos(theta)*rx*rad*edge,Math.sin(theta)*ry*rad*edge);
    if(family==='forest'&&rad<.28&&zone%3===1)continue;
    const size=family==='forest'?6+r()*5.5:4+r()*3;
    add(family,p.x,p.y,size,{patchId:'zone-'+zone});
   }
  }else if(family==='mountains'||family==='hills'){
   const length=135+r()*125,steps=family==='mountains'?7+Math.floor(r()*4):5+Math.floor(r()*4);
   for(let i=0;i<steps;i++){
    const t=i/(steps-1),p=at((t-.5)*length,Math.sin(t*4+phase)*24+(r()-.5)*15),size=family==='mountains'?19+r()*21:22+r()*13;
    add(family,p.x,p.y,size,{rangeId:'range-'+zone});
    if(family==='mountains'&&i%2===0){const q=at((t-.45)*length,48+Math.sin(t*4+phase)*20);add(family,q.x,q.y,size*.67,{rangeId:'range-'+zone});}
   }
  }else{
   let fieldAngle=angle;let closest=Infinity;
   for(const road of roads.filter(road=>road.kind==='approach'))for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],d=distanceToSegment(center,a,b);if(d<closest){closest=d;fieldAngle=Math.atan2(b.y-a.y,b.x-a.x)+(r()-.5)*.2;}}
   const parcelAt=(x,y)=>({x:center.x+Math.cos(fieldAngle)*x-Math.sin(fieldAngle)*y,y:center.y+Math.sin(fieldAngle)*x+Math.cos(fieldAngle)*y});
   let rowY=-70;
   for(let row=0;row<4;row++){
    const h=24+r()*18;let x=-85+(r()-.5)*20;
    for(let col=0;col<4;col++){
     const w=30+r()*35,p=parcelAt(x+w/2,rowY+h/2),local=[[-.5,-.5],[.5,-.48],[.48,.5],[-.48,.47]].map(([u,v])=>({x:u*w+(r()-.5)*2,y:v*h+(r()-.5)*2})),radius=Math.hypot(w,h)/2+3;
     const points=local.map(q=>({x:p.x+q.x*Math.cos(fieldAngle)-q.y*Math.sin(fieldAngle),y:p.y+q.x*Math.sin(fieldAngle)+q.y*Math.cos(fieldAngle)}));
     add('farmland',p.x,p.y,w/2,{w,h,radius,angle:fieldAngle,points,localPoints:local,patchId:'farm-'+zone});x+=w+4;
    }
    rowY+=h+4;
   }
  }
  if(features.length===before){
   if(family==='farmland'){const w=36,h=25,local=[{x:-18,y:-12.5},{x:18,y:-12.5},{x:18,y:12.5},{x:-18,y:12.5}],points=local.map(p=>({x:center.x+p.x,y:center.y+p.y}));add(family,center.x,center.y,18,{w,h,angle:0,radius:24,points,localPoints:local,patchId:'farm-'+zone});}
   else add(family,center.x,center.y,family==='mountains'?19:family==='hills'?21:family==='forest'?8:6,{patchId:'zone-'+zone});
  }
 });
 return{environment,features,patches};
}

const n=v=>Math.round(v*100)/100;
const coords=ps=>ps.map(p=>`${n(p.x)},${n(p.y)}`).join(' ');
export function renderLandscape(doc){
 if(!doc.landscape?.features.length)return'';
 const boundary=coords(doc.boundary),water=doc.water&&(doc.water.kind==='lake'?doc.water.points:doc.water.fill);
 const mask=`<defs><mask id="landscape-mask"><rect width="1000" height="760" fill="white"/><polygon points="${boundary}" fill="black" stroke="black" stroke-width="22"/>${water?`<polygon points="${coords(water)}" fill="black" stroke="black" stroke-width="14"/>`:''}${doc.roads.map(road=>`<polyline points="${coords(road.points)}" fill="none" stroke="black" stroke-width="${road.width+13}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</mask></defs>`;
 const ground=(doc.landscape.patches||[]).map(p=>`<path d="${p.points.map((q,i)=>{const next=p.points[(i+1)%p.points.length],before=p.points[(i+p.points.length-1)%p.points.length];return `${i?'':'M'+n((before.x+q.x)/2)+' '+n((before.y+q.y)/2)}Q${n(q.x)} ${n(q.y)} ${n((q.x+next.x)/2)} ${n((q.y+next.y)/2)}`;}).join(' ')}Z" fill="#f5f6ef" stroke="none"/>`).join('');
 const ink=[...doc.landscape.features].sort((a,b)=>a.y-b.y).map(f=>{
  const s=f.size;let shape='';
  if(f.kind==='forest'){
   if(f.variant===0)shape=`<path d="M0 ${-s*1.3}L${s*.7} ${-s*.15}H${s*.34}L${s*.9} ${s*.58}H${-s*.9}L${-s*.34} ${-s*.15}H${-s*.7}Z" fill="#f0f1eb"/><path d="M0 ${s*.55}v${s*.44}M0 ${-s*.75}v${s*.95}" fill="none" stroke="#a1a595" stroke-width=".6"/>`;
   else shape=`<path d="M${-s*.75} ${s*.25}C${-s*1.4} ${s*.1} ${-s*1.1} ${-s*.65} ${-s*.58} ${-s*.69}C${-s*.54} ${-s*1.35} ${s*.27} ${-s*1.35} ${s*.46} ${-s*.83}C${s*1.17} ${-s*.88} ${s*1.32} ${-s*.13} ${s*.83} ${s*.13}C${s*.92} ${s*.66} ${-s*.45} ${s*.76} ${-s*.75} ${s*.25}Z" fill="#f1f2ec"/><path d="M0 ${s*.33}v${s*.67}M0 ${s*.44}l${-s*.3} ${-s*.27}M0 ${s*.28}l${s*.3} ${-s*.24}" fill="none" stroke="#9fa394" stroke-width=".65"/>`;
  }else if(f.kind==='mountains'){
   shape=`<path d="M${-s} ${s*.65}L${-s*.64} ${s*.02}L${-s*.4} ${-s*.13}L${-s*.15} ${-s*.95}L${s*.16} ${-s*.38}L${s*.36} ${-s*.22}L${s*.53} ${s*.13}L${s*.9} ${s*.65}Z" fill="#f5f4ef"/><path d="M${-s*.15} ${-s*.95}L${s*.05} ${-s*.1}L${s*.53} ${s*.42}M${-s*.47} ${-s*.35}l${s*.2} ${s*.08}l${s*.12} ${-s*.19}l${s*.27} ${s*.15}" fill="none" stroke="#a6a292" stroke-width=".75"/>${[.28,.43,.58].map(t=>`<path d="M${s*t} ${s*(t*1.5-.28)}l${-s*.1} ${s*.21}" stroke="#c0bdaf" stroke-width=".65"/>`).join('')}`;
  }else if(f.kind==='hills'){
   shape=`<path d="M${-s} ${s*.25}Q${-s*.2} ${-s*.92} ${s*.8} ${s*.25}M${-s*.7} ${s*.45}Q${-s*.13} ${-s*.4} ${s*.53} ${s*.45}" fill="none"/><path d="M${s*.2} ${s*.1}l${s*.12} ${s*.18}m${s*.1} ${-s*.12}l${s*.12} ${s*.19}" stroke="#c0bdaf" stroke-width=".6"/>`;
  }else if(f.kind==='meadow'){
   shape=`<path d="M${-s*.55} 0l${s*.15} ${s*.37}l${s*.18} ${-s*.55}m${s*.4} ${s*.06}l${s*.15} ${s*.36}l${s*.21} ${-s*.28}M${-s*.7} ${s*.75}q${s*.56} ${-s*.12} ${s*1.3} 0" fill="none" stroke="#babdae" stroke-width=".65"/>`;
  }else{
   const w=f.w,h=f.h,local=f.localPoints||[{x:-w*.5,y:-h*.5},{x:w*.48,y:-h*.45},{x:w*.5,y:h*.48},{x:-w*.47,y:h*.5}],id='field-'+f.id;
   shape=`<defs><clipPath id="${id}"><polygon points="${coords(local)}"/></clipPath></defs><polygon points="${coords(local)}" fill="#f8f7f0" stroke="#bab6a6" stroke-width=".7"/><g clip-path="url(#${id})" stroke="#c2beaf" stroke-width=".6">${Array.from({length:Math.ceil(w/6)+1},(_,i)=>`<path d="M${n(-w/2+i*6)} ${n(-h/2)}v${n(h)}"/>`).join('')}</g><path d="M${n(-w*.5)} ${n(h*.15)}L${n(w*.49)} ${n(h*.13)}" stroke="#b3b09e" stroke-width="1.2"/>`;
  }
  return `<g class="landscape-feature landscape-${f.kind}" transform="translate(${n(f.x)} ${n(f.y)}) rotate(${n(f.angle*180/Math.PI)})">${shape}</g>`;
 }).join('');
 return `${mask}<g class="surrounding-landscape" mask="url(#landscape-mask)" fill="none" stroke="#a5a795" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none">${ground}${ink}</g>`;
}
