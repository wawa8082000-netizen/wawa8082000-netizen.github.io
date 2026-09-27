import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../template.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function run(text){
 let now=0,tick,cleared=false;
 const element=text===null?null:{textContent:text,setAttribute(){}};
 vm.runInNewContext(script,{document:{getElementById:()=>element},performance:{now:()=>now},Math,
 setInterval:fn=>{tick=fn;return 1;},clearInterval:()=>{cleared=true;}});
 return {element,step(ms){now=ms;tick?.();},cleared:()=>cleared};
}
const r=run('天地\n玄黄');
assert.match(r.element.textContent,/^[\u4e00-\u9fff]{2}\n[\u4e00-\u9fff]{2}$/);
assert.notEqual(r.element.textContent[0],'天');
r.step(199);assert.notEqual(r.element.textContent[0],'天');
r.step(200);assert.equal(r.element.textContent[0],'天');assert.notEqual(r.element.textContent[1],'地');
r.step(400);assert.equal(r.element.textContent.slice(0,3),'天地\n');
r.step(800);assert.equal(r.element.textContent,'天地\n玄黄');assert.ok(r.cleared());
run(null);run('');
assert.ok(!html.includes('id="countdown"'));
console.log('Sequential random Han decoding: 200 ms per character, whitespace, final text, and image-only pages passed');
