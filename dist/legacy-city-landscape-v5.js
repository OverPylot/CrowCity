import {wet} from './legacy-city-network-v5.js';

export const LANDSCAPES=[
 ['none','Üres környezet'],['meadow','Mezők és rétek'],['farmland','Művelt földek'],
 ['forest','Erdős vidék'],['hills','Dombvidék'],['mountains','Hegyvidék'],['mixed','Vegyes táj']
];
function inside(p,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
function distanceToSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
export function makeLandscape(settings,shape,water,roads,r){
 const environment=settings.surroundings,features=[];
 if(environment==='none')return{environment,features};
 const density=settings.landscapeDensity,phase=r()*6.28,phase2=r()*6.28,angle=(r()-.5)*.9;
 const biome=(x,y)=>{if(environment!=='mixed')return environment;const v=Math.sin(x/175+phase)*.62+Math.cos(y/145+phase2)*.38;return v>.46?'mountains':v>.02?'forest':v>-.43?'farmland':'meadow';};
 const fits=(x,y,radius)=>{
  const p={x,y};if(x-radius<12||x+radius>988||y-radius<12||y+radius>748||inside(p,shape.boundary)||wet(p,water,radius+5))return false;
  if(shape.boundary.some((a,i)=>distanceToSegment(p,a,shape.boundary[(i+1)%shape.boundary.length])<radius+13))return false;
  return !roads.some(road=>road.points.some((a,i)=>i&&distanceToSegment(p,road.points[i-1],a)<radius+road.width/2+7));
 };
 for(const family of['farmland','mountains','hills','forest','meadow']){
  if(environment!=='mixed'&&environment!==family)continue;
  const gap=({farmland:102,mountains:64,hills:78,forest:34,meadow:58}[family])*(1.25-density*.10),originX=r()*gap,originY=r()*gap;
  for(let gy=originY;gy<760;gy+=gap)for(let gx=originX;gx<1000;gx+=gap){
   const row=Math.round((gy-originY)/gap),jitter=family==='farmland'?.12:.78;
   const x=gx+(family==='farmland'?0:row%2*gap*.47)+(r()-.5)*gap*jitter,y=gy+(r()-.5)*gap*jitter;
   if(biome(x,y)!==family)continue;
   if(family==='forest'&&Math.sin(x/67+phase)*Math.cos(y/83+phase2)>.62)continue;
   const size=family==='farmland'?gap*(.39+r()*.045):family==='mountains'?20+r()*9:family==='hills'?24+r()*8:family==='forest'?6.5+r()*3.8:5+r()*3;
   const radius=family==='farmland'?size*1.15:family==='mountains'?size*1.2:family==='hills'?size*1.1:family==='forest'?size*1.55:size;
   if(!fits(x,y,radius))continue;
   const feature={id:'landscape-'+features.length,kind:family,x,y,size,radius,variant:Math.floor(r()*3),angle:family==='farmland'?angle+(r()-.5)*.1:(r()-.5)*.12};
   if(family==='farmland'){
    const w=size*1.65,h=size*1.13;
    feature.w=w;feature.h=h;
    feature.points=[[-.5,-.5],[.48,-.45],[.5,.48],[-.47,.5]].map(([u,v])=>({x:x+u*w*Math.cos(feature.angle)-v*h*Math.sin(feature.angle),y:y+u*w*Math.sin(feature.angle)+v*h*Math.cos(feature.angle)}));
   }
   features.push(feature);
  }
 }
 return{environment,features};
}

const n=v=>Math.round(v*100)/100;
const coords=ps=>ps.map(p=>`${n(p.x)},${n(p.y)}`).join(' ');
export function renderLandscape(doc){
 if(!doc.landscape?.features.length)return'';
 const boundary=coords(doc.boundary),water=doc.water&&(doc.water.kind==='lake'?doc.water.points:doc.water.fill);
 const mask=`<defs><mask id="landscape-mask"><rect width="1000" height="760" fill="white"/><polygon points="${boundary}" fill="black" stroke="black" stroke-width="22"/>${water?`<polygon points="${coords(water)}" fill="black" stroke="black" stroke-width="14"/>`:''}${doc.roads.map(road=>`<polyline points="${coords(road.points)}" fill="none" stroke="black" stroke-width="${road.width+13}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</mask></defs>`;
 const ink=[...doc.landscape.features].sort((a,b)=>a.y-b.y).map(f=>{
  const s=f.size;let shape='';
  if(f.kind==='forest'){
   if(f.variant===0)shape=`<path d="M0 ${-s*1.3}L${s*.7} ${-s*.15}H${s*.34}L${s*.9} ${s*.58}H${-s*.9}L${-s*.34} ${-s*.15}H${-s*.7}Z" fill="#f0f1eb"/><path d="M0 ${s*.55}v${s*.44}M0 ${-s*.75}v${s*.95}" fill="none" stroke="#a1a595" stroke-width=".6"/>`;
   else shape=`<path d="M${-s*.75} ${s*.25}C${-s*1.4} ${s*.1} ${-s*1.1} ${-s*.65} ${-s*.58} ${-s*.69}C${-s*.54} ${-s*1.35} ${s*.27} ${-s*1.35} ${s*.46} ${-s*.83}C${s*1.17} ${-s*.88} ${s*1.32} ${-s*.13} ${s*.83} ${s*.13}C${s*.92} ${s*.66} ${-s*.45} ${s*.76} ${-s*.75} ${s*.25}Z" fill="#f1f2ec"/><path d="M0 ${s*.33}v${s*.67}M0 ${s*.44}l${-s*.3} ${-s*.27}M0 ${s*.28}l${s*.3} ${-s*.24}" fill="none" stroke="#9fa394" stroke-width=".65"/>`;
  }else if(f.kind==='mountains'){
   shape=`<path d="M${-s} ${s*.65}L${-s*.15} ${-s*.95}L${s*.9} ${s*.65}Z" fill="#f5f4ef"/><path d="M${-s*.15} ${-s*.95}L${s*.05} ${-s*.1}L${s*.53} ${s*.42}M${-s*.47} ${-s*.35}l${s*.2} ${s*.08}l${s*.12} ${-s*.19}l${s*.27} ${s*.15}" fill="none" stroke="#a6a292" stroke-width=".75"/>${[.28,.43,.58].map(t=>`<path d="M${s*t} ${s*(t*1.5-.28)}l${-s*.1} ${s*.21}" stroke="#c0bdaf" stroke-width=".65"/>`).join('')}`;
  }else if(f.kind==='hills'){
   shape=`<path d="M${-s} ${s*.25}Q${-s*.2} ${-s*.92} ${s*.8} ${s*.25}M${-s*.7} ${s*.45}Q${-s*.13} ${-s*.4} ${s*.53} ${s*.45}" fill="none"/><path d="M${s*.2} ${s*.1}l${s*.12} ${s*.18}m${s*.1} ${-s*.12}l${s*.12} ${s*.19}" stroke="#c0bdaf" stroke-width=".6"/>`;
  }else if(f.kind==='meadow'){
   shape=`<path d="M${-s*.55} 0l${s*.15} ${s*.37}l${s*.18} ${-s*.55}m${s*.4} ${s*.06}l${s*.15} ${s*.36}l${s*.21} ${-s*.28}M${-s*.7} ${s*.75}q${s*.56} ${-s*.12} ${s*1.3} 0" fill="none" stroke="#babdae" stroke-width=".65"/>`;
  }else{
   const w=f.w,h=f.h,local=[{x:-w*.5,y:-h*.5},{x:w*.48,y:-h*.45},{x:w*.5,y:h*.48},{x:-w*.47,y:h*.5}],id='field-'+f.id;
   shape=`<defs><clipPath id="${id}"><polygon points="${coords(local)}"/></clipPath></defs><polygon points="${coords(local)}" fill="#f8f7f0" stroke="#bab6a6" stroke-width=".7"/><g clip-path="url(#${id})" stroke="#c2beaf" stroke-width=".6">${Array.from({length:Math.ceil(w/6)+1},(_,i)=>`<path d="M${n(-w/2+i*6)} ${n(-h/2)}v${n(h)}"/>`).join('')}</g><path d="M${n(-w*.5)} ${n(h*.15)}L${n(w*.49)} ${n(h*.13)}" stroke="#b3b09e" stroke-width="1.2"/>`;
  }
  return `<g class="landscape-feature landscape-${f.kind}" transform="translate(${n(f.x)} ${n(f.y)}) rotate(${n(f.angle*180/Math.PI)})">${shape}</g>`;
 }).join('');
 return `${mask}<g class="surrounding-landscape" mask="url(#landscape-mask)" fill="none" stroke="#a5a795" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none">${ink}</g>`;
}
