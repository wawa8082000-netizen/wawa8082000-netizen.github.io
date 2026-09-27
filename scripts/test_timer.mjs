import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../template.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function run(text){
 let now=0,tick,cleared=false;
 function node(text='') { return {_text:text,children:null,setAttribute(k,v){this[k]=v;},replaceChildren(...children){this.children=children;},get textContent(){return this.children?this.children.map(n=>n.textContent).join(''):this._text;},set textContent(v){this._text=v;this.children=null;}}; }
 const element=text===null?null:node(text);
 vm.runInNewContext(script,{document:{getElementById:()=>element,createElement:()=>node(),createTextNode:char=>node(char)},performance:{now:()=>now},Math,
 setInterval:fn=>{tick=fn;return 1;},clearInterval:()=>{cleared=true;}});
 return {element,step(ms){now=ms;tick?.();},cleared:()=>cleared};
}
const r=run('天地\n玄黄');
assert.equal(Array.from(r.element.textContent).length,5);
assert.equal(r.element.children[0].className,'decode-char');
assert.notEqual(r.element.textContent[0],'天');
r.step(199);assert.notEqual(r.element.textContent[0],'天');
r.step(200);assert.equal(r.element.textContent[0],'天');assert.notEqual(r.element.textContent[1],'地');
r.step(400);assert.equal(r.element.textContent.slice(0,3),'天地\n');
r.step(800);assert.equal(r.element.textContent,'天地\n玄黄');assert.ok(r.cleared());
run(null);run('');
assert.ok(!html.includes('id="countdown"'));
console.log('Sequential random Han decoding: 200 ms per character, whitespace, final text, and image-only pages passed');

const mixed=run('中A1!?');mixed.step(1000);assert.equal(mixed.element.textContent,'中A1!?');assert.ok(mixed.element.children.every(cell=>cell.className==='decode-char'));

const colors=run('中A');assert.equal(colors.element.children[0]['data-pending'],'true');colors.step(200);assert.equal(colors.element.children[0]['data-pending'],'false');assert.equal(colors.element.children[1]['data-pending'],'true');colors.step(400);assert.equal(colors.element.children[1]['data-pending'],'false');
