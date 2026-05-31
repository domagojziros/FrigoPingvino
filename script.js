// ─── FOOTER YEAR ───
document.getElementById('footerYear').textContent = new Date().getFullYear();

// ─── SNOWFLAKES ───
const sf = document.getElementById('snowflakes');
const snowSymbols = ['❄', '❅', '❆'];
// Fewer snowflakes on mobile = less GPU work
const snowCount = window.innerWidth < 768 ? 8 : 18;
for (let i = 0; i < snowCount; i++) {
  const s = document.createElement('div');
  s.className = 'snowflake';
  s.textContent = snowSymbols[i % 3];
  s.style.cssText = [
    `left:${Math.random() * 100}%`,
    `animation-duration:${7 + Math.random() * 9}s`,
    `animation-delay:${Math.random() * 10}s`,
    `font-size:${0.7 + Math.random() * 1.0}rem`
  ].join(';');
  sf.appendChild(s);
}

// ─── HAMBURGER / MOBILE MENU ───
const ham     = document.getElementById('hamburger');
const mob     = document.getElementById('mobileMenu');
const overlay = document.getElementById('mobileOverlay');

function openMobile() {
  mob.classList.add('open');
  overlay.classList.add('visible');
  ham.setAttribute('aria-expanded', 'true');
  ham.setAttribute('aria-label', 'Zatvori izbornik');
  mob.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeMobile() {
  mob.classList.remove('open');
  overlay.classList.remove('visible');
  ham.setAttribute('aria-expanded', 'false');
  ham.setAttribute('aria-label', 'Otvori izbornik');
  mob.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

ham.addEventListener('click', () => mob.classList.contains('open') ? closeMobile() : openMobile());
overlay.addEventListener('click', closeMobile);

// ─── SCROLL FADE-IN ───
const isMobile = window.innerWidth < 768;
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: isMobile ? 0.04 : 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));


// ════════════════════════════════════════════════════════
// UNIFIED CAROUSEL ENGINE
// All slide widths are set in PIXELS from wrapper.clientWidth
// so slides are always exactly the right size and never escape.
// ════════════════════════════════════════════════════════
function createCarousel(opts) {
  /*
    opts = {
      trackId,        // id of .carousel-track element
      prevBtnId,
      nextBtnId,
      dotsId,
      slideClass,     // CSS class to query for slides
      getSPV,         // function() → slides-per-view (optional, default auto)
    }
  */
  const track    = document.getElementById(opts.trackId);
  const prevBtn  = document.getElementById(opts.prevBtnId);
  const nextBtn  = document.getElementById(opts.nextBtnId);
  const dotsCont = document.getElementById(opts.dotsId);
  if (!track) return null;

  const GAP = 16; // px gap between slides — must match CSS gap
  const slides = Array.from(track.querySelectorAll('.' + opts.slideClass));
  let current = 0;

  // How many slides to show at once
  function getSPV() {
    if (opts.getSPV) return opts.getSPV();
    const w = window.innerWidth;
    if (w < 641) return 1;
    if (w < 900) return 2;
    return 3;
  }

  // Total number of "pages"
  function totalPages() {
    return Math.max(1, Math.ceil(slides.length / getSPV()));
  }

  // === KEY FUNCTION: set every slide to an exact pixel width ===
  function setSlideSizes() {
    const wrapperW = track.parentElement.clientWidth; // real px width of the visible area
    const spv      = getSPV();
    const slideW   = Math.floor((wrapperW - GAP * (spv - 1)) / spv);

    slides.forEach(slide => {
      slide.style.width    = slideW + 'px';
      slide.style.minWidth = slideW + 'px';
      slide.style.maxWidth = slideW + 'px';
    });

    // Also size the track itself so it doesn't stretch the wrapper
    // track width = all slides + all gaps
    track.style.width = (slideW * slides.length + GAP * (slides.length - 1)) + 'px';
  }

  // Compute translateX for a given page index
  function getOffset(pageIdx) {
    const wrapperW = track.parentElement.clientWidth;
    const spv      = getSPV();
    const slideW   = Math.floor((wrapperW - GAP * (spv - 1)) / spv);
    const step     = slideW + GAP; // one slide's stride
    return pageIdx * spv * step;
  }

  function buildDots() {
    const total = totalPages();
    dotsCont.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const d = document.createElement('button');
      d.className = 'dot' + (i === current ? ' active' : '');
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', `Stranica ${i + 1} od ${total}`);
      d.setAttribute('aria-selected', String(i === current));
      d.addEventListener('click', () => goTo(i));
      dotsCont.appendChild(d);
    }
  }

  function goTo(idx) {
    const max = totalPages() - 1;
    current = Math.max(0, Math.min(idx, max));
    track.style.transition = 'transform 0.52s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    track.style.transform  = `translateX(-${getOffset(current)}px)`;
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === max;
    buildDots();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  // ── SWIPE / DRAG ──
  let isDragging = false;
  let dragStartX = 0;
  let dragDelta  = 0;
  let didDrag    = false; // track whether mouse actually moved (for lightbox)

  function onDragStart(x) {
    isDragging = true;
    didDrag    = false;
    dragStartX = x;
    dragDelta  = 0;
    track.style.transition = 'none';
  }

  function onDragMove(x) {
    if (!isDragging) return;
    dragDelta = x - dragStartX;
    if (Math.abs(dragDelta) > 4) didDrag = true;
    track.style.transform = `translateX(${-getOffset(current) + dragDelta}px)`;
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    if (Math.abs(dragDelta) > 55) {
      dragDelta < 0 ? goTo(current + 1) : goTo(current - 1);
    } else {
      goTo(current); // snap back
    }
  }

  track.addEventListener('touchstart',  e => onDragStart(e.touches[0].clientX), { passive: true });
  track.addEventListener('touchmove',   e => onDragMove(e.touches[0].clientX),  { passive: true });
  track.addEventListener('touchend',    onDragEnd);
  track.addEventListener('mousedown',   e => onDragStart(e.clientX));
  window.addEventListener('mousemove',  e => { if (isDragging) onDragMove(e.clientX); });
  window.addEventListener('mouseup',    () => { if (isDragging) onDragEnd(); });
  track.addEventListener('dragstart',   e => e.preventDefault());

  // ── RESIZE ── debounced
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setSlideSizes();
      current = 0;
      buildDots();
      goTo(0);
    }, 150);
  });

  // ── INIT ──
  setSlideSizes();
  buildDots();
  goTo(0);

  return {
    goTo,
    getCurrent: () => current,
    wasDrag: () => didDrag,
  };
}


// ════════════════════════
// GALLERY CAROUSEL
// ════════════════════════
const galleryCarousel = createCarousel({
  trackId:   'carouselTrack',
  prevBtnId: 'prevBtn',
  nextBtnId: 'nextBtn',
  dotsId:    'carouselDots',
  slideClass: 'carousel-slide',
  // gallery track contains only .carousel-slide (no review-slide), so no conflict
});


// ════════════════════════
// REVIEWS CAROUSEL
// ════════════════════════
createCarousel({
  trackId:   'reviewsTrack',
  prevBtnId: 'reviewPrevBtn',
  nextBtnId: 'reviewNextBtn',
  dotsId:    'reviewDots',
  slideClass: 'review-slide',
});


// ════════════════════════
// LIGHTBOX
// ════════════════════════

// ── SHARED DRAG FLAG — declared first so all handlers can use it ──
let galleryTouchStartX = 0;
let galleryTouchStartY = 0;
let galleryTouchMoved  = false;

const galleryTrackEl = document.getElementById('carouselTrack');
galleryTrackEl.addEventListener('touchstart', e => {
  galleryTouchStartX = e.touches[0].clientX;
  galleryTouchStartY = e.touches[0].clientY;
  galleryTouchMoved  = false;
}, { passive: true });
galleryTrackEl.addEventListener('touchmove', e => {
  const dx = Math.abs(e.touches[0].clientX - galleryTouchStartX);
  const dy = Math.abs(e.touches[0].clientY - galleryTouchStartY);
  if (dx > 8 || dy > 8) galleryTouchMoved = true;
}, { passive: true });

// ── LIGHTBOX — handles images AND video ──
// Build a unified media list: { type:'img'|'video', src, alt }
const galleryMedia = Array.from(
  document.querySelectorAll('#carouselTrack .carousel-slide')
).map(slide => {
  const video = slide.querySelector('video');
  if (video) return { type: 'video', src: video.getAttribute('src') || 'klima10.mp4' };
  const img = slide.querySelector('img');
  if (img) return { type: 'img', src: img.getAttribute('src'), alt: img.alt };
  return null;
}).filter(Boolean);

let lbIdx = 0;

const lightboxEl    = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightboxImg');
const lightboxVideo = document.getElementById('lightboxVideo');
const lightboxCtr   = document.getElementById('lightboxCounter');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev  = document.getElementById('lightboxPrev');
const lightboxNext  = document.getElementById('lightboxNext');

function openLightbox(idx) {
  lbIdx = idx;
  const media = galleryMedia[idx];
  if (!media) return;

  if (media.type === 'video') {
    lightboxImg.style.display = 'none';
    lightboxVideo.style.display = 'block';
    lightboxVideo.src = media.src;
    lightboxVideo.load();
    lightboxVideo.play().catch(() => {});
  } else {
    lightboxVideo.pause();
    lightboxVideo.style.display = 'none';
    lightboxImg.style.display = 'block';
    lightboxImg.src = media.src;
    lightboxImg.alt = media.alt || '';
  }

  lightboxCtr.textContent = `${idx + 1} / ${galleryMedia.length}`;
  lightboxEl.classList.add('open');
  document.body.style.overflow = 'hidden';
  lightboxPrev.disabled = idx === 0;
  lightboxNext.disabled = idx === galleryMedia.length - 1;
}

function closeLightbox() {
  lightboxVideo.pause();
  lightboxVideo.src = '';
  lightboxEl.classList.remove('open');
  document.body.style.overflow = '';
}

function lbNav(dir) {
  const n = lbIdx + dir;
  if (n >= 0 && n < galleryMedia.length) openLightbox(n);
}

// Attach click on every gallery slide (images AND video)
document.querySelectorAll('#carouselTrack .carousel-slide').forEach((slide, i) => {
  let mouseDownX = 0;
  slide.addEventListener('mousedown', e => { mouseDownX = e.clientX; });
  slide.addEventListener('click', e => {
    if (Math.abs(e.clientX - mouseDownX) < 10) openLightbox(i);
  });

  slide.addEventListener('touchend', () => {
    setTimeout(() => {
      if (!galleryTouchMoved) openLightbox(i);
    }, 10);
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => lbNav(-1));
lightboxNext.addEventListener('click', () => lbNav(1));
lightboxEl.addEventListener('click', e => { if (e.target === lightboxEl) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (lightboxEl.classList.contains('open')) {
    if (e.key === 'ArrowLeft')  lbNav(-1);
    if (e.key === 'ArrowRight') lbNav(1);
    if (e.key === 'Escape')     closeLightbox();
    return;
  }
  if (e.key === 'Escape' && mob.classList.contains('open')) closeMobile();
});


// ─── RESTRUCTURE REVIEW CARDS: move author+stars to top ───
document.querySelectorAll('.review-slide .review-card').forEach(card => {
  const author = card.querySelector('.review-author');
  const quote  = card.querySelector('.review-quote');
  if (author && quote) {
    // Insert author block before the quote (top of card)
    card.insertBefore(author, quote);
  }
});

// ─── REVIEW EXPAND/COLLAPSE ───
function toggleReview(btn) {
  const wrap = btn.closest('.review-text-wrap');
  const text = wrap.querySelector('.review-text');
  const isExpanded = text.classList.contains('expanded');

  text.classList.toggle('expanded', !isExpanded);
  btn.classList.toggle('open', !isExpanded);
  btn.setAttribute('aria-expanded', String(!isExpanded));
  btn.querySelector('.expand-arrow').textContent = isExpanded ? '▾' : '▴';
  btn.firstChild.textContent = isExpanded ? 'Više ' : 'Manje ';
}

// Check which review cards actually overflow and hide button if not needed
function initExpandButtons() {
  document.querySelectorAll('.review-slide .review-text-wrap').forEach(wrap => {
    const text = wrap.querySelector('.review-text');
    const btn  = wrap.querySelector('.review-expand-btn');
    if (!btn || !text) return;

    // Show button by default, hide only if nothing is clamped
    // scrollHeight > clientHeight means text is being cut off
    btn.style.display = text.scrollHeight > text.clientHeight + 2 ? 'inline-flex' : 'none';
  });
}

// Run multiple times to catch different layout moments
window.addEventListener('load', () => {
  initExpandButtons();
  setTimeout(initExpandButtons, 300);
  setTimeout(initExpandButtons, 800);
});

// ─── LIGHTBOX SWIPE ───
let lbTouchStartX = 0;
let lbTouchStartY = 0;
let lbMouseStartX = 0;
let lbIsDragging  = false;

lightboxEl.addEventListener('touchstart', e => {
  lbTouchStartX = e.touches[0].clientX;
  lbTouchStartY = e.touches[0].clientY;
}, { passive: true });

lightboxEl.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - lbTouchStartX;
  const dy = e.changedTouches[0].clientY - lbTouchStartY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
    dx < 0 ? lbNav(1) : lbNav(-1);
  }
}, { passive: true });

lightboxEl.addEventListener('mousedown', e => {
  // Only track drag on the backdrop/img, not on buttons
  if (e.target === lightboxEl || e.target === lightboxImg || e.target.classList.contains('lightbox-inner')) {
    lbMouseStartX = e.clientX;
    lbIsDragging  = true;
  }
});

lightboxEl.addEventListener('mouseup', e => {
  if (!lbIsDragging) return;
  lbIsDragging = false;
  const dx = e.clientX - lbMouseStartX;
  if (Math.abs(dx) > 40 && !(e.target.closest('.lightbox-close') || e.target.closest('.lightbox-nav'))) {
    dx < 0 ? lbNav(1) : lbNav(-1);
  }
});

// ─── PRIVACY MODAL ───
const privacyModal   = document.getElementById('privacyModal');
const privacyOverlay = document.getElementById('privacyOverlay');
const privacyClose   = document.getElementById('privacyClose');
const privacyLink    = document.getElementById('privacyLink');

function openPrivacy(e) {
  e.preventDefault();
  privacyModal.hidden = false;
  privacyOverlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
  privacyClose.focus();
}

function closePrivacy() {
  privacyModal.hidden = true;
  privacyOverlay.classList.remove('visible');
  document.body.style.overflow = '';
}

if (privacyLink)    privacyLink.addEventListener('click', openPrivacy);
if (privacyClose)   privacyClose.addEventListener('click', closePrivacy);
if (privacyOverlay) privacyOverlay.addEventListener('click', closePrivacy);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && privacyModal && !privacyModal.hidden) closePrivacy();
});