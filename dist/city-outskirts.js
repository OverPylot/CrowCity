// Gate approaches continue to the map edge. The exterior routing grid shares
// no walkable cells with the settlement and never crosses unbridged water.
const STEP=10,W=100,H=76;
const point=id=>({x:id%W*STEP+STEP/2,y:Math.floor(id/W)*STEP+STEP/2});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function inside(p,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return distance(p,{x:a.x+t*dx,y:a.y+t*dy});}
function samples(a,b,fn,step=4){const n=Math.max(1,Math.ceil(distance(a,b)/step));for(let i=0;i<=n;i++)if(!fn({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}))return false;return true;}
class Heap{
 constructor(){this.items=[];}
 push(id,cost){const a=this.items,item={id,cost};let i=a.length;a.push(item);while(i){const p=(i-1)>>1;if(a[p].cost<=cost)break;a[i]=a[p];i=p;}a[i]=item;}
 pop(){const a=this.items,top=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].cost<a[c].cost)c++;if(a[c].cost>=last.cost)break;a[i]=a[c];i=c;}a[i]=last;}return top;}
}
function edgeFor(p,dir){const ts=[];if(dir.x>1e-8)ts.push((1000-p.x)/dir.x);if(dir.x<-1e-8)ts.push(-p.x/dir.x);if(dir.y>1e-8)ts.push((760-p.y)/dir.y);if(dir.y<-1e-8)ts.push(-p.y/dir.y);const t=Math.min(...ts.filter(t=>t>=0));return{x:Math.max(0,Math.min(1000,p.x+dir.x*t)),y:Math.max(0,Math.min(760,p.y+dir.y*t))};}
export function exteriorRoutes(boundary,water,isWet){
 const land=p=>!inside(p,boundary)&&!isWet(p,water,7)&&boundary.every((a,i)=>segmentDistance(p,a,boundary[(i+1)%boundary.length])>7);
 const clear=(a,b)=>samples(a,b,land);
 let routes=null;
 function build(){
  const valid=new Uint8Array(W*H),cost=new Float64Array(W*H).fill(Infinity),parent=new Int32Array(W*H).fill(-1),exits=new Map(),heap=new Heap();
  for(let id=0;id<valid.length;id++)valid[id]=land(point(id))?1:0;
  for(let id=0;id<valid.length;id++)if(valid[id]){const x=id%W,y=Math.floor(id/W),p=point(id);let edge=null;if(x===0)edge={x:0,y:p.y};else if(x===W-1)edge={x:1000,y:p.y};else if(y===0)edge={x:p.x,y:0};else if(y===H-1)edge={x:p.x,y:760};if(edge&&clear(p,edge)){cost[id]=5;parent[id]=id;exits.set(id,edge);heap.push(id,5);}}
  while(heap.items.length){const item=heap.pop();if(item.cost!==cost[item.id])continue;const x=item.id%W,y=Math.floor(item.id/W),a=point(item.id);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=x+dx,ny=y+dy,id=ny*W+nx;if(nx<0||ny<0||nx>=W||ny>=H||!valid[id])continue;const next=item.cost+STEP*Math.hypot(dx,dy);if(next>=cost[id]||!clear(a,point(id)))continue;cost[id]=next;parent[id]=item.id;heap.push(id,next);}}
  routes={valid,cost,parent,exits};
 }
 return gate=>{
  const dir={x:Math.cos(gate.angle),y:Math.sin(gate.angle)},start={x:gate.x+dir.x*25,y:gate.y+dir.y*25},end=edgeFor(gate,dir);
  if(!samples(gate,start,p=>!isWet(p,water,7)&&(!inside(p,boundary)||distance(p,gate)<.02)))return null;
  if(!land(start))return null;
  if(clear(start,end))return[{x:gate.x,y:gate.y},start,end];
  if(!routes)build();
  let best=-1,rank=Infinity;
  const cx=Math.floor(start.x/STEP),cy=Math.floor(start.y/STEP);
  for(let y=Math.max(0,cy-4);y<=Math.min(H-1,cy+4);y++)for(let x=Math.max(0,cx-4);x<=Math.min(W-1,cx+4);x++){const id=y*W+x,p=point(id),score=routes.cost[id]+distance(start,p);if(score<rank&&Number.isFinite(score)&&clear(start,p)){best=id;rank=score;}}
  if(best<0)return null;
  const raw=[start];let id=best;
  for(let count=0;count<W*H;count++){raw.push(point(id));if(routes.parent[id]===id){raw.push(routes.exits.get(id));break;}id=routes.parent[id];}
  const smoothed=[{x:gate.x,y:gate.y},start];
  for(let i=0;i<raw.length-1;){let next=i+1;for(let j=raw.length-1;j>i+1;j--)if(clear(raw[i],raw[j])){next=j;break;}smoothed.push(raw[next]);i=next;}
  return smoothed;
 };
}
