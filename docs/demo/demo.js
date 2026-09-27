'use strict';
const $ = id => document.getElementById(id);
const canvas = $('canvas'), ctx = canvas.getContext('2d');
const source = document.createElement('canvas'), ink = source.getContext('2d');
const low = document.createElement('canvas'), pixels = low.getContext('2d');
const image = new Image();
image.src = '../images/ch1-3-3.png';
let effect = 'blur', content = 'text';
let progress = 0, lastTime = performance.now(), lastPaint = 0;
let glyphs = [], imageReady = false;
const names = {blur:'模糊显影',type:'打字机',mosaic:'马赛克',decode:'字符解码'};
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
function prepare() {
  const text = $('sample').value.trim() || '沿着细节，继续寻找。';
  source.width = 800;
  glyphs = [];
  if(content === 'text') {
    const fontSize = text.length > 180 ? 28 : 36;
    ink.font = `${fontSize}px "Songti SC", serif`;
    let x=24,y=fontSize+12;
    for(const char of Array.from(text)) {
      if(char === '\n' || char === '\u2028') {x=24;y+=fontSize*1.7;continue;}
      const width=ink.measureText(char).width;
      if(x+width>776) {x=24;y+=fontSize*1.7;}
      glyphs.push({char,x,y,size:fontSize}); x+=width;
    }
    source.height = Math.max(390,Math.ceil(y+36));
    ink.font = `${fontSize}px "Songti SC", serif`;
    ink.fillStyle = '#343a30';
    for(const g of glyphs) ink.fillText(g.char,g.x,g.y);
  } else {
    source.height=534;
    if(imageReady) ink.drawImage(image,0,0,800,534);
    else {ink.fillStyle='#343a30';ink.font='26px sans-serif';ink.fillText('图片加载中…',30,250);}
  }
  canvas.width=source.width;canvas.height=source.height;
  canvas.style.aspectRatio=`${source.width} / ${source.height}`;
}
function draw() {
  const w=canvas.width,h=canvas.height;
  canvas.style.filter='none';
  ctx.clearRect(0,0,w,h);ctx.filter='none';ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;
  const p=reduced.matches && progress<1 ? 0 : progress;
  if(p>=1) {ctx.drawImage(source,0,0);return;}
  if(reduced.matches) {ctx.fillStyle='#868977';ctx.font='24px sans-serif';ctx.fillText('线索正在解锁…',24,60);return;}
  if(effect==='blur') {
    // CSS blur is Gaussian and works in Safari, including versions without Canvas filter.
    // Keep full opacity and strong blur until late in the reveal.
    const sigma=(content==='image'?28:20)*(1-Math.pow(p,5));
    canvas.style.filter=`blur(${sigma}px)`;
    ctx.drawImage(source,0,0);
  } else if(effect==='type') {
    if(content==='text') {
      ctx.fillStyle='#343a30';
      const count=Math.floor(glyphs.length*p);
      for(const g of glyphs.slice(0,count)) {ctx.font=`${g.size}px "Songti SC", serif`;ctx.fillText(g.char,g.x,g.y);}
      const next=glyphs[count];if(next) {ctx.fillStyle='#9a743b';ctx.fillRect(next.x,next.y-next.size,2,next.size);}
    } else {
      // Image equivalent of a typewriter: reveal narrow strips from left to right.
      ctx.save();ctx.beginPath();ctx.rect(0,0,w*p,h);ctx.clip();ctx.drawImage(source,0,0);ctx.restore();
      ctx.fillStyle='#9a743b';ctx.fillRect(w*p,0,2,h);
    }
  } else if(effect==='mosaic') {
    const cell=Math.max(1,Math.round(65*Math.pow(1-p,1.5)));
    low.width=Math.max(1,Math.ceil(w/cell));low.height=Math.max(1,Math.ceil(h/cell));
    pixels.clearRect(0,0,low.width,low.height);pixels.drawImage(source,0,0,low.width,low.height);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(low,0,0,w,h);
  } else {
    if(content==='text') {
      const solved=Math.floor(glyphs.length*p);
      glyphs.forEach((g,i)=>{
        const revealed=i<solved;
        ctx.fillStyle=revealed?'#343a30':'#989680';ctx.font=`${g.size}px "Songti SC", serif`;
        ctx.fillText(revealed?g.char:String.fromCodePoint(0x4e00+Math.floor(Math.random()*(0x9fff-0x4e00+1))),g.x,g.y);
      });
    } else {
      const cols=16,rows=11,total=cols*rows;
      for(let i=0;i<total;i++) {
        const x=(i%cols)*w/cols,y=Math.floor(i/cols)*h/rows;
        if(((i*53)%total)/total<p)ctx.drawImage(source,x,y,w/cols,h/rows,x,y,w/cols,h/rows);
        else {ctx.fillStyle=i%2?'#bcb8a5':'#c9c4b1';ctx.fillRect(x,y,w/cols+1,h/rows+1);}
      }
    }
  }
}
function updateUI() {
  const percent=Math.floor(progress*100),done=progress>=1;
  $('progress').style.width=`${percent}%`;$('percent').textContent=`${percent}%`;
  document.querySelector('[role=progressbar]').setAttribute('aria-valuenow',percent);
  $('phase').textContent=done?'线索已揭晓':progress>0?'正在显影':'等待探索';
  $('mode-label').textContent=`自动 · ${names[effect]}`;
}

function reset() {
  progress=0;lastTime=performance.now();
  $('accessible-clue').textContent='';canvas.setAttribute('aria-label','尚未揭晓的线索');
  $('status').textContent='体验已重置';
  $('instruction').textContent='无需操作，线索将自动浮现。';
  $('timing').textContent=effect==='decode'&&content==='text'?'从左到右 · 每字 0.2 秒':`自动显影 ${$('duration').value} 秒`;
  $('duration').disabled=effect==='decode'&&content==='text';
  if(content==='image'&&effect==='type')$('instruction').textContent+=' 图片以扫描线方式逐步展开。';
  prepare();draw();updateUI();
}
function advance(amount) {
  const previous=progress;progress=Math.min(1,progress+amount);
  if(progress>1-1e-10)progress=1;
  if(previous<1&&progress===1) {
    $('status').textContent='线索已完整揭晓';
    const description=content==='text'?($('sample').value.trim()||'沿着细节，继续寻找。'):'图片线索已揭晓：永定门石匾。';
    $('accessible-clue').textContent=description;canvas.setAttribute('aria-label',description);
  }
}
function frame(now) {
  const elapsed=Math.min(now-lastTime,100);lastTime=now;
  if(!document.hidden && progress<1 && (content!=='image'||imageReady)) advance(elapsed/(effect==='decode'&&content==='text'?Math.max(1,glyphs.length)*200:Number($('duration').value)*1000));
  if(now-lastPaint>32){draw();updateUI();lastPaint=now;}
  requestAnimationFrame(frame);
}
for(const group of ['effect','content']) {
  document.querySelectorAll(`[data-${group}]`).forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll(`[data-${group}]`).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    if(group==='effect')effect=button.dataset.effect;
    if(group==='content'){content=button.dataset.content;$('sample').disabled=content==='image';}
    reset();
  }));
}
document.addEventListener('visibilitychange',()=>{lastTime=performance.now();});
$('replay').addEventListener('click',reset);$('duration').addEventListener('change',reset);$('sample').addEventListener('input',reset);
image.onload=()=>{imageReady=true;if(content==='image')reset();};
image.onerror=()=>{$('status').textContent='图片加载失败，请刷新后重试';if(content==='image'){$('instruction').textContent='图片加载失败，请刷新后重试。';}};
reset();requestAnimationFrame(frame);
