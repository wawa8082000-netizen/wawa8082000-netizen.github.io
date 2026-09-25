import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const handlers = new Map(), elements = new Map();
const context2d = new Proxy({measureText:()=>({width:30})},{get:(o,k)=>o[k]??(()=>{})});
function element(id='') {
  return {id,value:id==='duration'?'10':id==='sample'?'测试线索文字':'',style:{},dataset:{},textContent:'',disabled:false,
    classList:{toggle(){},remove(){}},setAttribute(k,v){this[k]=v;},setPointerCapture(){},getContext:()=>context2d,
    addEventListener(event,fn){handlers.set(`${id}:${event}`,fn);}};
}
for(const id of ['canvas','sample','duration','action','progress','percent','phase','mode-label','accessible-clue','status','instruction','timing','replay','bar'])elements.set(id,element(id));
const groups={interaction:['hold','auto','tap'],effect:['blur','type','mosaic','decode'],content:['text','image']};
for(const [group,values] of Object.entries(groups)) for(const value of values){const e=element(value);e.dataset[group]=value;elements.set(value,e);}
let frame,now=0,image;
const document={hidden:false,getElementById:id=>elements.get(id),createElement:()=>element(),querySelector:()=>elements.get('bar'),querySelectorAll:s=>{const group=s.match(/data-(\w+)/)[1];return groups[group].map(v=>elements.get(v));},addEventListener(event,fn){handlers.set(`doc:${event}`,fn);}};
const sandbox={document,Image:class{constructor(){image=this;}},performance:{now:()=>now},matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>{frame=fn;},window:{addEventListener(event,fn){handlers.set(`window:${event}`,fn);}},console};
vm.runInNewContext(fs.readFileSync(new URL('../docs/demo/demo.js',import.meta.url),'utf8'),sandbox);
image.onload();
const fire=(id,event='click',extra={})=>handlers.get(`${id}:${event}`)?.({preventDefault(){},...extra});
const tick=(ms)=>{for(let elapsed=0;elapsed<ms;elapsed+=50){now+=50;frame(now);}};
const pct=()=>Number(elements.get('bar')['aria-valuenow']);
for(const content of groups.content)for(const effect of groups.effect){
  fire(content);fire(effect);fire('tap');
  for(let i=0;i<19;i++)fire('action');assert.ok(pct()<100);fire('action');assert.equal(pct(),100,`${content}/${effect}`);
  fire('replay');assert.equal(pct(),0);
}
fire('hold');fire('action','pointerdown',{button:0,pointerId:1});tick(1000);assert.equal(pct(),10);
fire('action','pointerup');tick(1000);assert.equal(pct(),10,'release pauses');
fire('action','keydown',{code:'Space',repeat:false});tick(1000);fire('action','keyup',{code:'Space'});assert.equal(pct(),20);
fire('auto');tick(1000);assert.equal(pct(),10);fire('action');tick(1000);assert.equal(pct(),10,'auto pause');fire('action');tick(9000);assert.equal(pct(),100);
fire('hold');fire('action','pointerdown',{button:0,pointerId:1});tick(500);fire('window','blur');tick(500);assert.equal(pct(),5,'window blur pauses hold');
console.log('Demo: eight content/effect combinations, 20 taps, hold/release, keyboard, auto pause/resume, reset and blur passed');
