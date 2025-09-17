const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const audio = $('#audio');
const playPauseBtn = $('#playPauseBtn');
const prevBtn = $('#prevBtn');
const nextBtn = $('#nextBtn');
const titleEl = $('.player-title');
const progressWrap = $('.progress-wrap');
const progress = $('.progress');
const timeEl = $('.time');
const volume = $('#volume');
$('#year').textContent = new Date().getFullYear();

const cards = $$('.project');
let current = -1;

function formatTime(sec){
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec/60);
  const s = Math.floor(sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function load(i){
  current = i;
  const card = cards[i];
  const src = card.dataset.audio;
  const title = card.dataset.title || card.querySelector('.project-title')?.textContent || 'Untitled';
  audio.src = src;
  titleEl.textContent = title;
  audio.play().catch(()=>{ /* autoplay blocked */ });
  playPauseBtn.textContent = '⏸';
  cards.forEach(c => c.classList.remove('playing'));
  card.classList.add('playing');
}

cards.forEach((card, i) => {
  card.querySelector('.thumb').addEventListener('click', () => {
    if (current === i && !audio.paused){ audio.pause(); playPauseBtn.textContent = '▶'; return; }
    load(i);
  });
});

playPauseBtn.addEventListener('click', () => {
  if (!audio.src) { load(0); return; }
  if (audio.paused) { audio.play(); playPauseBtn.textContent = '⏸'; }
  else { audio.pause(); playPauseBtn.textContent = '▶'; }
});

prevBtn.addEventListener('click', () => {
  if (!cards.length) return;
  const i = current <= 0 ? cards.length - 1 : current - 1;
  load(i);
});

nextBtn.addEventListener('click', () => {
  if (!cards.length) return;
  const i = current >= cards.length - 1 ? 0 : current + 1;
  load(i);
});

audio.addEventListener('timeupdate', () => {
  const pct = (audio.currentTime / audio.duration) * 100;
  progress.style.width = `${pct || 0}%`;
  timeEl.textContent = `${formatTime(audio.currentTime)}`;
  progressWrap.setAttribute('aria-valuenow', Math.floor(pct || 0));
});

progressWrap.addEventListener('click', (e) => {
  if (!audio.duration) return;
  const rect = progressWrap.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

volume.addEventListener('input', () => {
  audio.volume = volume.value;
});

// Keyboard shortcuts: space to toggle, left/right for scrub
window.addEventListener('keydown', (e) => {
  if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.code === 'Space'){ e.preventDefault(); playPauseBtn.click(); }
  if (e.code === 'ArrowRight'){ audio.currentTime = Math.min((audio.currentTime||0)+5, audio.duration||0); }
  if (e.code === 'ArrowLeft'){ audio.currentTime = Math.max((audio.currentTime||0)-5, 0); }
});

