(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.getElementById('siteHeader');
  const nav = document.getElementById('primaryNav');
  const navToggle = document.getElementById('navToggle');

  /* Header elevation ------------------------------------------------------ */
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile navigation ----------------------------------------------------- */
  const label = (key) => (window.dtLang ? window.dtLang.label(key) : '');
  const isMenuOpen = () => Boolean(nav && nav.classList.contains('is-open'));

  const syncMenuLabel = () => {
    if (!navToggle) return;
    navToggle.setAttribute('aria-label', label(isMenuOpen() ? 'a11y.menuClose' : 'a11y.menuOpen'));
  };

  const setMenu = (open) => {
    if (!nav || !navToggle) return;
    nav.classList.toggle('is-open', open);
    navToggle.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    syncMenuLabel();
    document.body.style.overflow = open ? 'hidden' : '';
  };

  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      setMenu(!nav.classList.contains('is-open'));
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        navToggle.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('is-open')) return;
      if (event.target.closest('#primaryNav, #navToggle')) return;
      setMenu(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && nav.classList.contains('is-open')) setMenu(false);
    });

    document.addEventListener('dt:lang', syncMenuLabel);
  }

  /* Scroll reveals -------------------------------------------------------- */
  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  } else {
    revealItems.forEach((el) => {
      const siblings = Array.from(el.parentElement.children).filter((c) => c.hasAttribute('data-reveal'));
      const index = siblings.indexOf(el);
      if (index > 0) el.style.transitionDelay = `${Math.min(index, 6) * 65}ms`;
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((el) => revealObserver.observe(el));
  }

  /* Active nav link ------------------------------------------------------- */
  const sections = ['top', 'features', 'how', 'faq']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  if (sections.length && 'IntersectionObserver' in window) {
    const linkFor = (id) => navLinks.find((a) => a.getAttribute('href') === `#${id}`);
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.remove('is-active'));
        const link = linkFor(entry.target.id);
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach((section) => activeObserver.observe(section));
  }

  /* FAQ accordion --------------------------------------------------------- */
  const accordion = document.getElementById('faqAccordion');

  if (accordion) {
    const triggers = Array.from(accordion.querySelectorAll('.acc-trigger'));

    const close = (trigger) => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel || trigger.getAttribute('aria-expanded') !== 'true') return;
      trigger.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = `${panel.scrollHeight}px`;
      requestAnimationFrame(() => {
        panel.classList.remove('is-open');
        panel.style.maxHeight = '0px';
      });
      const done = () => {
        panel.hidden = true;
        panel.style.maxHeight = '';
        panel.removeEventListener('transitionend', done);
      };
      panel.addEventListener('transitionend', done);
    };

    const open = (trigger) => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;
      trigger.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      panel.style.maxHeight = '0px';
      requestAnimationFrame(() => {
        panel.classList.add('is-open');
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      });
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        triggers.forEach((other) => {
          if (other !== trigger) close(other);
        });
        if (isOpen) close(trigger);
        else open(trigger);
      });
    });

    const syncOpenPanels = () => {
      triggers.forEach((trigger) => {
        if (trigger.getAttribute('aria-expanded') !== 'true') return;
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        if (panel && !panel.hidden) panel.style.maxHeight = `${panel.scrollHeight}px`;
      });
    };

    window.addEventListener('resize', syncOpenPanels);
    document.addEventListener('dt:lang', syncOpenPanels);
  }

  /* Ambient embers -------------------------------------------------------- */
  const canvas = document.getElementById('embers');

  if (canvas && !reducedMotion.matches) {
    const ctx = canvas.getContext('2d', { alpha: true });
    let width = 0;
    let height = 0;
    let particles = [];
    let rafId = 0;
    let last = 0;

    const makeParticle = (initial) => {
      const depth = Math.random();
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : height + 12 + Math.random() * 60,
        r: 0.6 + depth * 2.2,
        vy: -(0.09 + depth * 0.3),
        sway: 6 + Math.random() * 22,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.55,
        alpha: 0.12 + depth * 0.4,
        tone: Math.random() < 0.28 ? 'gold' : Math.random() < 0.5 ? 'ember' : 'fire'
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(Math.max(width / 30, 18), 54));
      particles = Array.from({ length: count }, () => makeParticle(true));
    };

    const color = (p) => {
      if (p.tone === 'gold') return `rgba(255, 194, 77, ${p.alpha})`;
      if (p.tone === 'ember') return `rgba(255, 138, 61, ${p.alpha})`;
      return `rgba(255, 77, 26, ${p.alpha})`;
    };

    const frame = (time) => {
      const dt = Math.min((time - last) / 16.67, 3) || 1;
      last = time;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      for (const p of particles) {
        p.y += p.vy * dt;
        p.phase += 0.006 * p.speed * dt;
        const x = p.x + Math.sin(p.phase) * p.sway;

        const fade = p.y < height * 0.18 ? Math.max(p.y / (height * 0.18), 0) : 1;
        ctx.globalAlpha = fade;
        ctx.beginPath();
        ctx.fillStyle = color(p);
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        if (p.r > 1.6) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 236, 214, ${p.alpha * 0.5})`;
          ctx.arc(x, p.y, p.r * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }

        if (p.y < -24) Object.assign(p, makeParticle(false));
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      rafId = requestAnimationFrame(frame);
    };

    const start = () => {
      if (rafId) return;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    };

    const stop = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    resize();
    start();

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 180);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    if ('addEventListener' in reducedMotion) {
      reducedMotion.addEventListener('change', (event) => {
        if (event.matches) {
          stop();
          ctx.clearRect(0, 0, width, height);
        } else {
          start();
        }
      });
    }
  }
})();
