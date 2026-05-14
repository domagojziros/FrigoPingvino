// Snowflakes
const sf = document.getElementById('snowflakes');
for (let i = 0; i < 18; i++) {
  const s = document.createElement('div');
  s.className = 'snowflake';
  s.textContent = ['❄','❅','❆'][Math.floor(Math.random()*3)];
  s.style.left = Math.random() * 100 + '%';
  s.style.animationDuration = (6 + Math.random() * 10) + 's';
  s.style.animationDelay = (Math.random() * 10) + 's';
  s.style.fontSize = (0.7 + Math.random() * 1.2) + 'rem';
  sf.appendChild(s);
}

// Hamburger
const ham = document.getElementById('hamburger');
const mob = document.getElementById('mobileMenu');
ham.addEventListener('click', () => mob.classList.toggle('open'));
function closeMobile() { mob.classList.remove('open'); }

// Scroll fade-in
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Carousel
const track = document.getElementById('carouselTrack');
const slides = track.children;
const dotsContainer = document.getElementById('carouselDots');
let current = 0;

function getSlidesPerView() {
  if (window.innerWidth < 640) return 1;
  if (window.innerWidth < 900) return 2;
  return 3;
}

function totalGroups() {
  return Math.ceil(slides.length / getSlidesPerView());
}

function buildDots() {
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalGroups(); i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i === current ? ' active' : '');
    d.onclick = () => goTo(i);
    dotsContainer.appendChild(d);
  }
}

function goTo(idx) {
  const spv = getSlidesPerView();
  const max = totalGroups() - 1;
  current = Math.max(0, Math.min(idx, max));
  const slideWidth = track.parentElement.clientWidth / spv;
  const gap = 16;
  track.style.transform = `translateX(-${current * (slideWidth * spv + gap * spv)}px)`;
  buildDots();
}

document.getElementById('prevBtn').onclick = () => goTo(current - 1);
document.getElementById('nextBtn').onclick = () => goTo(current + 1);
window.addEventListener('resize', () => { current = 0; buildDots(); goTo(0); });
buildDots();

// Form submit
function submitForm() {
  const btn = document.querySelector('.btn-submit');
  btn.textContent = '✅ Upit poslan! Kontaktirat ćemo vas uskoro.';
  btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
  setTimeout(() => {
    btn.textContent = 'Pošalji upit 🚀';
    btn.style.background = '';
  }, 4000);
}