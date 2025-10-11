function initYearStamp(){
  const yearEl = document.getElementById('year');
  if(yearEl){
    yearEl.textContent = String(new Date().getFullYear());
  }
}

function initAboutTabs(){
  const section = document.querySelector('.content-section.about');
  if(!section) return;

  const options = Array.from(section.querySelectorAll('.about-option'));
  if(!options.length) return;

  const panels = new Map();
  section.querySelectorAll('.about-panel').forEach(panel => {
    const key = panel.dataset.option;
    if(key){
      panels.set(key, panel);
      panel.hidden = !panel.classList.contains('is-active');
    }
  });

  if(!panels.size) return;

  const activate = (button) => {
    if(!button) return;
    const key = button.dataset.option;
    if(!key || !panels.has(key)) return;

    options.forEach(opt => {
      const isActive = opt === button;
      opt.classList.toggle('is-active', isActive);
      opt.setAttribute('aria-selected', String(isActive));
      opt.setAttribute('aria-expanded', String(isActive));
    });

    panels.forEach((panel, panelKey) => {
      const isActive = panelKey === key;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
  };

  const initial = options.find(opt => opt.classList.contains('is-active')) || options[0];
  if(initial){
    activate(initial);
  }

  options.forEach((btn, index) => {
    btn.addEventListener('click', () => activate(btn));
    btn.addEventListener('keydown', (event) => {
      const { key } = event;
      if(key === 'ArrowRight' || key === 'ArrowDown'){
        event.preventDefault();
        const next = options[(index + 1) % options.length];
        next.focus();
        activate(next);
      } else if(key === 'ArrowLeft' || key === 'ArrowUp'){
        event.preventDefault();
        const prev = options[(index - 1 + options.length) % options.length];
        prev.focus();
        activate(prev);
      } else if(key === 'Home'){
        event.preventDefault();
        const first = options[0];
        first.focus();
        activate(first);
      } else if(key === 'End'){
        event.preventDefault();
        const last = options[options.length - 1];
        last.focus();
        activate(last);
      }
    });
  });
}

function initPublisherCarousel(){
  const carousel = document.querySelector('.publisher-carousel');
  if(!carousel) return;

  const viewport = carousel.querySelector('.publisher-viewport');
  const track = carousel.querySelector('.publisher-track');
  const slides = track ? Array.from(track.children) : [];
  if(!viewport || !track || !slides.length) return;

  const prevBtn = carousel.querySelector('[data-carousel-prev]');
  const nextBtn = carousel.querySelector('[data-carousel-next]');
  const prefersReducedMotion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  let currentIndex = 0;
  let timerId = null;
  let isHovering = false;
  let hasFocus = false;
  let paddingLeft = 0;

  const totalSlides = slides.length;
  slides.forEach((slide, index) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${index + 1} of ${totalSlides}`);
  });

  const recalcMetrics = () => {
    const style = window.getComputedStyle(track);
    paddingLeft = parseFloat(style.paddingLeft) || 0;
  };

  const setSlideVisibility = () => {
    slides.forEach((slide, index) => {
      const isActive = index === currentIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });
  };

  const updateViewportLabel = () => {
    const label = slides[currentIndex]?.dataset.label || `Publisher ${currentIndex + 1}`;
    viewport.setAttribute('aria-label', `${label} (${currentIndex + 1} of ${totalSlides})`);
  };

  const updateTransform = () => {
    const activeSlide = slides[currentIndex];
    if(!activeSlide) return;
    const offset = Math.max(0, activeSlide.offsetLeft - paddingLeft);
    track.style.transform = `translateX(-${offset}px)`;
    setSlideVisibility();
    updateViewportLabel();
  };

  const stopTimer = () => {
    if(timerId !== null){
      clearInterval(timerId);
      timerId = null;
    }
  };

  const shouldAutoPlay = () => {
    return !prefersReducedMotion.matches && !isHovering && !hasFocus && !document.hidden;
  };

  const refreshTimer = () => {
    stopTimer();
    if(shouldAutoPlay()){
      timerId = window.setInterval(() => {
        setIndex(currentIndex + 1, { fromTimer: true });
      }, 6000);
    }
  };

  const setIndex = (index, { fromTimer = false } = {}) => {
    const normalized = (index + totalSlides) % totalSlides;
    if(normalized === currentIndex && !fromTimer){
      refreshTimer();
      return;
    }
    currentIndex = normalized;
    updateTransform();
    if(!fromTimer){
      refreshTimer();
    }
  };

  const handleKeydown = (event) => {
    const { key } = event;
    if(key === 'ArrowRight' || key === 'ArrowDown'){
      event.preventDefault();
      setIndex(currentIndex + 1);
    } else if(key === 'ArrowLeft' || key === 'ArrowUp'){
      event.preventDefault();
      setIndex(currentIndex - 1);
    } else if(key === 'Home'){
      event.preventDefault();
      setIndex(0);
    } else if(key === 'End'){
      event.preventDefault();
      setIndex(totalSlides - 1);
    }
  };

  const handleMouseEnter = () => { isHovering = true; refreshTimer(); };
  const handleMouseLeave = () => { isHovering = false; refreshTimer(); };
  const handleFocusIn = () => { hasFocus = true; refreshTimer(); };
  const handleFocusOut = (event) => {
    if(!carousel.contains(event.relatedTarget)){
      hasFocus = false;
      refreshTimer();
    }
  };
  const handleVisibilityChange = () => refreshTimer();
  const handleMotionChange = () => refreshTimer();
  const handleResize = () => {
    recalcMetrics();
    updateTransform();
  };

  const handlePrev = () => setIndex(currentIndex - 1);
  const handleNext = () => setIndex(currentIndex + 1);

  viewport.addEventListener('keydown', handleKeydown);
  carousel.addEventListener('mouseenter', handleMouseEnter);
  carousel.addEventListener('mouseleave', handleMouseLeave);
  carousel.addEventListener('focusin', handleFocusIn);
  carousel.addEventListener('focusout', handleFocusOut);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  if(typeof prefersReducedMotion.addEventListener === 'function'){
    prefersReducedMotion.addEventListener('change', handleMotionChange);
  } else if(typeof prefersReducedMotion.addListener === 'function'){
    prefersReducedMotion.addListener(handleMotionChange);
  }
  window.addEventListener('resize', handleResize);
  prevBtn?.addEventListener('click', handlePrev);
  nextBtn?.addEventListener('click', handleNext);

  recalcMetrics();
  updateTransform();
  refreshTimer();
}

document.addEventListener('DOMContentLoaded', () => {
  initYearStamp();
  initAboutTabs();
  initPublisherCarousel();
});
