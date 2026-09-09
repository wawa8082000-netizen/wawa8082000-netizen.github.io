import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../template.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
let now = 0;
let tick;
let cleared = false;
const elements = {
  countdown: {style: {}, innerHTML: ''},
  'end-message': {style: {display: 'none'}},
};
vm.runInNewContext(script, {
  Date: {now: () => now},
  document: {getElementById: id => elements[id]},
  setInterval: fn => {tick = fn; return 1;},
  clearInterval: () => {cleared = true;},
});
assert.equal(elements.countdown.innerHTML, '01:00');
now = 59999;
tick();
assert.equal(elements['end-message'].style.display, 'none');
assert.equal(elements.countdown.innerHTML, '00:01');
now = 60000;
tick();
assert.equal(elements['end-message'].style.display, 'block');
assert.equal(elements.countdown.style.display, 'none');
assert.ok(cleared);
console.log('60-second timer boundary passed');
