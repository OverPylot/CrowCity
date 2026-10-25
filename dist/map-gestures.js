const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Coordinates are in the SVG viewBox, before the world-layer transform.
export function zoomView(zoom,pan,next,anchor={x:500,y:380}){
 next=clamp(next,.65,8);
 const world={x:500+(anchor.x-500-pan.x)/zoom,y:380+(anchor.y-380-pan.y)/zoom};
 return{zoom:next,pan:{x:anchor.x-500-next*(world.x-500),y:anchor.y-380-next*(world.y-380)}};
}
export function pinchView(start,current){
 const ratio=current.distance/Math.max(1,start.distance),view=zoomView(start.zoom,start.pan,start.zoom*ratio,start.midpoint);
 view.pan.x+=current.midpoint.x-start.midpoint.x;view.pan.y+=current.midpoint.y-start.midpoint.y;
 return view;
}
