/**
 * Glyph Portal © 2026 Christian Katzmann. MIT.
 * Origin: UsefulPortal.astro on https://ktzm.dk → UsefulPortal.tsx → ClarityPortal.tsx.
 * A scroll-driven camera through live type. Keep this notice with copies.
 * Vanilla JS adaptation: Nine Eleven dot symbol and English wordmark.
 */
(() => {
  'use strict';
  const section = document.querySelector('.logo-portal');
  if (!section) return;
  const art = section.querySelector('.portal-art');
  const camera = section.querySelector('.portal-camera');
  const front = section.querySelector('.portal-front');
  const story = section.querySelector('.portal-story');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const motionToggle = section.querySelector('.portal-motion-toggle');
  let backgroundPaused = false;
  let visible = true;
  function updateBackground() {
    section.dataset.backgroundPaused = String(backgroundPaused || !visible || document.hidden);
  }
  motionToggle.addEventListener('click', () => {
    backgroundPaused = !backgroundPaused;
    motionToggle.setAttribute('aria-pressed', String(backgroundPaused));
    motionToggle.setAttribute('aria-label', backgroundPaused ? '배경 모션 재생하기' : '배경 모션 멈추기');
    motionToggle.querySelector('span').textContent = backgroundPaused ? 'OFF' : 'ON';
    updateBackground();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateBackground();
    }).observe(section.querySelector('.portal-pin'));
  }
  document.addEventListener('visibilitychange', updateBackground);
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };
  let width = 0, height = 0, start = 1, end = 1, frame = 0;
  let storyEntered = false;

  function paint() {
    frame = 0;
    if (motion.matches) return;
    const p = clamp(-section.getBoundingClientRect().top / (height * 2.4));
    const t = clamp(p / .78);
    const eased = t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    const scale = Math.exp(Math.log(start) + Math.log(end / start) * eased);
    const blend = (1 / scale - 1 / start) / (1 / end - 1 / start);
    // Enter the middle-right lime dot. Its safe radius is known exactly.
    const cx = 450 + (126 - 450) * blend;
    const roll = -4 * smooth(.06, .5, t) * (1 - smooth(.62, .92, t));
    camera.setAttribute('transform', `translate(${width / 2} ${height * (.46 + .04 * eased)}) scale(${scale}) rotate(${roll}) translate(${-cx} -80)`);
    section.style.setProperty('--portal-caption', 1 - smooth(.01, .16, p));
    section.style.setProperty('--portal-reveal', smooth(.78, .9, p));
    front.inert = p > .12;
    story.inert = p < .9;
    const entered = p >= .9 && section.getBoundingClientRect().bottom > 0;
    story.dataset.entered = String(entered);
    if (entered && !storyEntered) story.dispatchEvent(new Event('portal:entered'));
    storyEntered = entered;
    story.classList.toggle('geometry-active', p >= .78 && section.getBoundingClientRect().bottom > 0);
    // The pin background replaces the artwork only once the dot fills the viewport.
    section.querySelector('.portal-pin').style.background = t >= 1 ? 'var(--accent)' : '';
    art.style.visibility = t >= 1 ? 'hidden' : '';
  }

  function layout() {
    cancelAnimationFrame(frame);
    frame = 0;
    section.dataset.motion = motion.matches ? 'off' : 'on';
    if (motion.matches) {
      art.setAttribute('viewBox', '-10 -10 920 180');
      camera.removeAttribute('transform');
      art.style.visibility = '';
      section.querySelector('.portal-pin').style.background = '';
      section.style.removeProperty('--portal-caption');
      front.inert = false;
      story.inert = false;
      story.classList.remove('geometry-active');
      return;
    }
    width = section.clientWidth;
    // Stable small viewport units avoid jumping when mobile browser chrome collapses.
    section.style.setProperty('--portal-height', '100svh');
    height = section.querySelector('.portal-pin').clientHeight || innerHeight;
    section.style.setProperty('--portal-height', `${height}px`);
    start = Math.min(width * .87 / 900, height * .24 / 160);
    end = Math.hypot(width, height) / 36 * 1.12;
    section.style.setProperty('--portal-half', `${80 * start}px`);
    art.setAttribute('viewBox', `0 0 ${width} ${height}`);
    paint();
  }

  addEventListener('scroll', () => { if (!frame && !motion.matches) frame = requestAnimationFrame(paint); }, { passive: true });
  addEventListener('resize', layout);
  motion.addEventListener('change', layout);
  layout();
})();
