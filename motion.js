(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const running = new Set();
  let number;
  const reels = [];
  function track(animation) {
    running.add(animation);
    animation.onfinish = () => { running.delete(animation); animation.cancel(); };
  }
  // Keep the experience graphic alive while its section is on screen.
  const geometryObserver = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle('geometry-active', entry.isIntersecting);
  }, { threshold: .12 });
  document.querySelectorAll('.proof-grid,.creative-card,.case-evidence').forEach(element => geometryObserver.observe(element));
  const syncGeometryVisibility = () => document.body.classList.toggle('geometry-hidden', document.hidden);
  document.addEventListener('visibilitychange', syncGeometryVisibility);
  syncGeometryVisibility();
  const statistic = document.querySelector('.stat-value');
  if (statistic) {
    const text = [...statistic.childNodes].find(node => node.nodeType === 3 && node.textContent.includes('1,500'));
    if (text) {
      number = document.createElement('span');
      number.className = 'stat-number';
      number.setAttribute('aria-hidden', 'true');
      let digitIndex = 0;
      for (const char of '1,500') {
        if (char === ',') {
          const comma = document.createElement('span');
          comma.className = 'stat-comma';
          comma.textContent = ',';
          number.append(comma);
          continue;
        }
        const window = document.createElement('span');
        window.className = 'stat-digit';
        const strip = document.createElement('span');
        strip.className = 'stat-reel';
        const end = 20 + digitIndex * 10 + Number(char);
        for (let i = 0; i <= end; i++) {
          const digit = document.createElement('span');
          digit.textContent = String(i % 10);
          strip.append(digit);
        }
        // Percentage of the full strip keeps the last row aligned despite pixel rounding.
        const finalTransform = `translateY(-${100 * end / (end + 1)}%)`;
        strip.style.transform = finalTransform;
        window.append(strip);
        number.append(window);
        reels.push({ strip, finalTransform, index: digitIndex++ });
      }
      text.replaceWith(number);
      statistic.setAttribute('aria-label', '약 1,500억 원');
      statistic.setAttribute('role', 'img');
    }
  }
  function spinSlots() {
    if (!number || preference.matches) return;
    for (const { strip, finalTransform, index } of reels) {
      track(strip.animate([{ transform: 'translateY(0)' }, { transform: finalTransform }], {
        duration: 1900 + index * 260, delay: index * 90,
        easing: 'cubic-bezier(.12,.65,.18,1)', fill: 'both'
      }));
    }
  }
  // Preserve inline markup and intentional line breaks while lifting each title line.
  document.querySelectorAll('main h2').forEach(heading => {
    const nodes = [...heading.childNodes];
    let line = document.createElement('span');
    line.className = 'title-line-inner';
    const lines = [line];
    for (const node of nodes) {
      if (node.nodeName === 'BR') {
        node.remove();
        line = document.createElement('span');
        line.className = 'title-line-inner';
        lines.push(line);
      } else line.append(node);
    }
    for (const content of lines) {
      const mask = document.createElement('span');
      mask.className = 'title-line';
      mask.append(content);
      heading.append(mask);
    }
  });
  function revealTitle(heading, delay = 0) {
    heading.querySelectorAll('.title-line-inner').forEach((line, index) => {
      track(line.animate([
        { opacity: 0, transform: 'translateY(110%) rotate(2deg)' },
        { opacity: 1, transform: 'translateY(0) rotate(0)' }
      ], { duration: 1200, delay: delay + index * 180, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
    });
  }
  function revealCopy(group) {
    if (preference.matches || !group) return;
    const heading = group.querySelector('h2');
    if (heading) revealTitle(heading, 100);
    group.querySelectorAll(':scope > p,:scope > a').forEach((element, index) => {
      track(element.animate([
        { opacity: 0, transform: 'translateY(30px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 1050, delay: 200 + index * 170, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
    });
  }
  const story = document.querySelector('.portal-story');
  story?.addEventListener('portal:entered', () => revealCopy(story.querySelector('.portal-story-text')));
  if (story?.dataset.entered === 'true') revealCopy(story.querySelector('.portal-story-text'));
  const copyObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && !entry.target.dataset.copyVisible) {
        entry.target.dataset.copyVisible = 'true';
        revealCopy(entry.target);
      } else if (!entry.isIntersecting) delete entry.target.dataset.copyVisible;
    }
  }, { threshold: .3, rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.proof-copy').forEach(element => copyObserver.observe(element));
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      observer.unobserve(element);
      if (preference.matches) continue;
      element.classList.add('is-revealed');
      if (element.matches('h2')) {
        revealTitle(element);
        continue;
      }
      const card = element.matches('.approach-card,.creative-card,.result-card,.media-grid>li,.brand-grid>li');
      const index = card ? [...element.parentElement.children].indexOf(element) : 0;
      const animation = element.animate([
        { opacity: 0, transform: `translateY(${card ? 38 : 28}px)${card ? ' scale(.97)' : ''}` },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], { duration: card ? 750 : 900, delay: card ? (index % (innerWidth < 701 ? 2 : 4)) * 90 : 0, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      track(animation);
      if (element.matches('.stat-value')) spinSlots();
    }
  }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
  document.querySelectorAll('main h2,.section-label,.stat-value,.stat-caption,.stat-title,.stat-note,.section-heading>p,.portal-eyebrow,.portal-support>p,.approach-card,.creative-card,.creative-summary,.result-card,.case-story,.case-evidence,.contact-copy>p,.contact-channel,.inquiry-form,.media-grid>li,.brand-grid>li,.media-note,.brand-more,.closing p,.closing-cta,.closing-arrow,footer>div').forEach(element => {
    if (!element.closest('.portal-story-text,.proof-copy')) observer.observe(element);
  });
  preference.addEventListener('change', () => {
    if (!preference.matches) return;
    running.forEach(animation => animation.cancel());
    running.clear();
  });
})();
