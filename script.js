// --- Desktop icon drag + open on dblclick ---
const desktop = document.getElementById('desktop');
const tasks = document.getElementById('tasks');

// Window factory
let z = 10;
function bringToFront(win){ win.style.zIndex = ++z; }
function makeWindow({title, tpl, x=140, y=90, w=420}){
  const node = document.getElementById('tpl-window').content.firstElementChild.cloneNode(true);
  node.style.left = x+'px'; node.style.top = y+'px'; node.style.width = w+'px';
  node.querySelector('.title span').textContent = title;
  node.querySelector('.content').append(document.getElementById(tpl).content.cloneNode(true));
  desktop.appendChild(node); bringToFront(node);

  // titlebar drag
  const bar = node.querySelector('.titlebar');
  let dragging=false, offX=0, offY=0;
  const move=(e)=>{ if(!dragging) return; node.style.left = Math.max(0, e.clientX-offX)+'px'; node.style.top = Math.max(0, e.clientY-offY)+'px'; };
  const up=()=>{ dragging=false; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  bar.addEventListener('mousedown', e=>{ dragging=true; offX=e.clientX-node.offsetLeft; offY=e.clientY-node.offsetTop; bringToFront(node); e.preventDefault(); window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); });

  // controls
  node.querySelector('.btn-close').addEventListener('click', ()=> { node.remove(); tb.remove(); });
  node.querySelector('.btn-min').addEventListener('click', ()=> node.style.display='none');
  node.querySelector('.btn-max').addEventListener('click', ()=>{
    if(node.dataset.max==='1'){
      node.style.left=node.dataset.l; node.style.top=node.dataset.t; node.style.width=node.dataset.w; node.style.height=node.dataset.h; node.dataset.max='0';
    } else {
      node.dataset.l=node.style.left; node.dataset.t=node.style.top; node.dataset.w=node.style.width; node.dataset.h=node.style.height; node.dataset.max='1';
      node.style.left='8px'; node.style.top='8px'; node.style.width=(window.innerWidth-16)+'px'; node.style.height=(window.innerHeight-48)+'px';
    }
    bringToFront(node);
  });

  // taskbar button
  const tb = document.createElement('button'); tb.className='btn task-btn'; tb.textContent=title; tasks.appendChild(tb);
  tb.addEventListener('click', ()=>{ if(node.style.display==='none'){ node.style.display='block'; bringToFront(node);} else { node.style.display='none'; } });

  node.addEventListener('mousedown', ()=> bringToFront(node));
  return node;
}

const openers = {
  about: () => makeWindow({title:'About', tpl:'tpl-about', x:200, y:100}),
  music: () => makeWindow({title:'Music', tpl:'tpl-music', x:260, y:120, w:520}),
  projects: () => makeWindow({title:'Projects', tpl:'tpl-projects', x:240, y:140, w:480}),
  contact: () => makeWindow({title:'Contact', tpl:'tpl-contact', x:220, y:160, w:360}),
  collaborators: () => makeWindow({title:'Collaborators', tpl:'tpl-collaborators', x:200, y:180, w:420}),
  publishers: () => makeWindow({title:'Publishers', tpl:'tpl-publishers', x:220, y:200, w:420})
};

// Sticky Notes
function createNote({x=260,y=100,w=220,h=160,text='New note…'}={}){
  const note = document.createElement('div');
  note.className='sticky-note';
  note.style.left=x+'px'; note.style.top=y+'px'; note.style.width=w+'px'; note.style.height=h+'px';
  note.innerHTML = '<div class="close" title="Delete">✕</div><div class="body" contenteditable="true">'+text+'</div>';
  desktop.appendChild(note);
  // drag (not when typing)
  let drag=false, ox=0, oy=0;
  note.addEventListener('mousedown', e=>{ if(e.target.closest('.body')||e.target.closest('.close')) return; drag=true; ox=e.clientX-note.offsetLeft; oy=e.clientY-note.offsetTop; e.preventDefault();
    const mv=(e)=>{ if(!drag) return; note.style.left=e.clientX-ox+'px'; note.style.top=e.clientY-oy+'px'; };
    const up=()=>{ drag=false; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  });
  note.querySelector('.close').addEventListener('click', ()=> note.remove());
  return note;
}

// Icon drag + dblclick handlers
document.querySelectorAll('.icon').forEach(icon => {
  let dragging=false, moved=false, offsetX=0, offsetY=0;
  icon.addEventListener('mousedown', e=>{
    dragging=true; moved=false; offsetX=e.clientX-icon.offsetLeft; offsetY=e.clientY-icon.offsetTop; icon.style.zIndex=1000;
    const mv=(e)=>{ if(!dragging) return; icon.style.left=e.clientX-offsetX+'px'; icon.style.top=e.clientY-offsetY+'px'; moved=true; };
    const up=()=>{ dragging=false; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  });
  icon.addEventListener('dblclick', e=>{
    if(moved) return;
    if(icon.classList.contains('sticky')){ createNote(); return; }
    const name = [...icon.classList].find(c=> openers[c]);
    if(name) openers[name]();
  });
  icon.addEventListener('keydown', e=>{
    if(e.key==='Enter'){
      if(icon.classList.contains('sticky')){ createNote(); return; }
      const name = [...icon.classList].find(c=> openers[c]);
      if(name) openers[name]();
    }
  });
});

// Tiny clock
function tick(){ const d=new Date(); document.getElementById('clock').textContent=d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
tick(); setInterval(tick, 1000);

// Marquee selection
(function(){
  const marquee = document.getElementById('marquee');
  let startX=0, startY=0, dragging=false;

  function rectFromPoints(x1,y1,x2,y2){
    const left=Math.min(x1,x2), top=Math.min(y1,y2), width=Math.abs(x2-x1), height=Math.abs(y2-y1);
    return {left, top, width, height, right:left+width, bottom:top+height};
  }
  function intersects(r,a){ return !(a.left>r.right || a.right<r.left || a.top>r.bottom || a.bottom<r.top); }

  desktop.addEventListener('mousedown', (e)=>{
    if(e.button!==0) return;
    if(e.target.closest('.icon, .window, .sticky-note, .taskbar, #startMenu')) return;
    const active = document.activeElement;
    if(active && active.classList && active.classList.contains('icon')){
      active.blur();
    }
    dragging=true; startX=e.clientX; startY=e.clientY;
    if(!e.shiftKey) document.querySelectorAll('.icon.selected').forEach(i=>i.classList.remove('selected'));
    marquee.style.left=startX+'px'; marquee.style.top=startY+'px'; marquee.style.width='0px'; marquee.style.height='0px'; marquee.style.display='block';
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    const r = rectFromPoints(startX,startY,e.clientX,e.clientY);
    marquee.style.left=r.left+'px'; marquee.style.top=r.top+'px'; marquee.style.width=r.width+'px'; marquee.style.height=r.height+'px';
    document.querySelectorAll('.icon').forEach(icon=>{
      const b = icon.getBoundingClientRect();
      const ir = {left:b.left, top:b.top, right:b.right, bottom:b.bottom};
      if(intersects(r, ir)) icon.classList.add('selected'); else if(!e.shiftKey) icon.classList.remove('selected');
    });
  });
  window.addEventListener('mouseup', ()=>{ if(!dragging) return; dragging=false; marquee.style.display='none'; });
})();

// Start button + menu
const startBtn = document.getElementById('startBtn');
const startMenu = document.getElementById('startMenu');
function toggleStart(force){
  const show = force!==undefined ? force : startMenu.style.display!=='block';
  startMenu.style.display = show ? 'block' : 'none';
}
startBtn.addEventListener('click', ()=> toggleStart());
document.addEventListener('click', (e)=>{
  if(e.target.closest('#startBtn') || e.target.closest('#startMenu')) return;
  toggleStart(false);
});
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') toggleStart(false); });

startMenu.addEventListener('click', (e)=>{
  const item = e.target.closest('.item'); if(!item) return;
  const op = item.getAttribute('data-open');
  if(op && openers[op]){ openers[op](); toggleStart(false); return; }
  if(item.getAttribute('data-sticky')==='new'){ createNote(); toggleStart(false); return; }
  if(item.getAttribute('data-cmd')==='closeAll'){
    document.querySelectorAll('.window').forEach(w=>w.remove());
    document.querySelectorAll('.task-btn').forEach(b=>b.remove());
    toggleStart(false);
  }
});
