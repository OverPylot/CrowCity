import test from 'node:test';
import assert from 'node:assert/strict';
import {zoomView,pinchView} from '../dist/map-gestures.js';
import {translate} from '../dist/i18n.js';

const world=(anchor,zoom,pan)=>({x:500+(anchor.x-500-pan.x)/zoom,y:380+(anchor.y-380-pan.y)/zoom});
test('zoom preserves the point underneath the cursor after panning',()=>{
 const anchor={x:270,y:600},pan={x:155,y:-82},before=world(anchor,1.7,pan),after=zoomView(1.7,pan,3.2,anchor),actual=world(anchor,after.zoom,after.pan);
 assert.ok(Math.hypot(actual.x-before.x,actual.y-before.y)<1e-9);
 assert.equal(zoomView(1,pan,99,anchor).zoom,8);assert.equal(zoomView(1,pan,.01,anchor).zoom,.65);
});
test('pinching follows both the finger separation and the moving midpoint',()=>{
 const start={zoom:1.5,pan:{x:60,y:-30},midpoint:{x:210,y:530},distance:100},current={midpoint:{x:275,y:490},distance:220},before=world(start.midpoint,start.zoom,start.pan),view=pinchView(start,current),after=world(current.midpoint,view.zoom,view.pan);
 assert.equal(view.zoom,3.3000000000000003);assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<1e-9);
 const bounded=pinchView({...start,distance:0},{midpoint:current.midpoint,distance:900});assert.equal(bounded.zoom,8);assert.ok(Number.isFinite(bounded.pan.x));
});
test('English and Hungarian UI messages do not alter custom names or seeds',()=>{
 assert.equal(translate('Környező táj','en'),'Surrounding landscape');assert.equal(translate('Környező táj','hu'),'Környező táj');
 assert.equal(translate('104 épület · Rácsos szerkezet · 3 saját negyed','en'),'104 buildings · Grid layout · 3 custom districts');
 assert.equal(translate('GENERÁTOR V6','en'),'GENERATOR V6');assert.equal(translate('  Mentés  ','en'),'  Save  ');
 assert.equal(translate('Őrszemvár','en'),'Őrszemvár');assert.equal(translate('CROWCITY-23','en'),'CROWCITY-23');
});
