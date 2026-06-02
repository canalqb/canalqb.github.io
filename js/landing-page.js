/**
 * LANDING PAGE — CanalQB Premium JS
 * Animações, Parallax, Microinterações, Scroll Reveal
 * @module LandingPage
 */

(function () {
  'use strict';

  /* =====================================================
     NAVBAR — Scroll Effect
     ===================================================== */
  const navbar = document.querySelector('.lp-navbar');
  let lastScroll = 0;

  function handleNavbarScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }

  /* =====================================================
     MOBILE MENU TOGGLE
     ===================================================== */
  const mobileToggle = document.querySelector('.lp-mobile-toggle');
  const navLinks = document.querySelector('.lp-nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.className = navLinks.classList.contains('open')
          ? 'fas fa-times'
          : 'fas fa-bars';
      }
    });

    // Fechar menu ao clicar em link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        const icon = mobileToggle.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      });
    });
  }

  /* =====================================================
     SCROLL REVEAL — IntersectionObserver
     ===================================================== */
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.lp-reveal, .lp-reveal-left, .lp-reveal-right');

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Delay escalonado para grid items
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, Number(delay));
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  }

  /* =====================================================
     PARALLAX — Efeito de profundidade no scroll
     ===================================================== */
  function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-lp-parallax]');

    if (!parallaxElements.length) return;

    // Respeitar prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function updateParallax() {
      const scrollY = window.scrollY;
      parallaxElements.forEach(el => {
        const speed = parseFloat(el.dataset.lpParallax) || 0.3;
        const rect = el.getBoundingClientRect();
        const offsetTop = rect.top + scrollY;
        const relativeScroll = scrollY - offsetTop;
        el.style.transform = `translateY(${relativeScroll * speed}px)`;
      });
    }

    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  /* =====================================================
     PARTÍCULAS — Hero Background
     ===================================================== */
  function initParticles() {
    const container = document.querySelector('.lp-hero-particles');
    if (!container) return;

    const particleCount = 25;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'lp-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${50 + Math.random() * 50}%`;
      particle.style.animationDelay = `${Math.random() * 6}s`;
      particle.style.animationDuration = `${4 + Math.random() * 4}s`;
      container.appendChild(particle);
    }
  }

  /* =====================================================
     CONTADOR ANIMADO — Stats
     ===================================================== */
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.countSuffix || '';
    const prefix = el.dataset.countPrefix || '';
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(eased * target);
      el.textContent = prefix + current.toLocaleString('pt-BR') + suffix;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  /* =====================================================
     SMOOTH SCROLL — Links âncora
     ===================================================== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const navHeight = navbar ? navbar.offsetHeight : 0;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /* =====================================================
     MATRIX CANVAS — Visual animado na seção Showcase
     ===================================================== */
  function initMatrixCanvas() {
    const canvas = document.getElementById('lp-matrix-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    const CELL_SIZE = 14;
    const cols = 20;
    const rows = 15;
    let grid = [];

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width;
      canvas.height = height;
    }

    function initGrid() {
      grid = [];
      for (let i = 0; i < rows * cols; i++) {
        grid.push(Math.random() > 0.7 ? 1 : 0);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const offsetX = (width - cols * CELL_SIZE) / 2;
      const offsetY = (height - rows * CELL_SIZE) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const x = offsetX + c * CELL_SIZE;
          const y = offsetY + r * CELL_SIZE;

          if (grid[idx]) {
            ctx.fillStyle = `rgba(247, 147, 26, ${0.3 + Math.random() * 0.5})`;
            ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          }
        }
      }
    }

    function animate() {
      // Random flip 2 cells per frame
      for (let i = 0; i < 2; i++) {
        const idx = Math.floor(Math.random() * grid.length);
        grid[idx] = grid[idx] ? 0 : 1;
      }
      draw();
      requestAnimationFrame(animate);
    }

    resize();
    initGrid();
    draw();

    // Observar visibilidade para não renderizar quando invisível
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animate();
      }
    }, { threshold: 0.1 });
    observer.observe(canvas);

    window.addEventListener('resize', () => {
      resize();
      draw();
    });
  }

  /* =====================================================
     TILT EFFECT — Microinteração nos cards
     ===================================================== */
  function initTiltEffect() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return; // Desabilitar em touch devices

    const cards = document.querySelectorAll('.lp-feature-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* =====================================================
     INIT
     ===================================================== */
  function init() {
    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll(); // Check initial state
    initScrollReveal();
    initParallax();
    initParticles();
    initCounters();
    initSmoothScroll();
    initMatrixCanvas();
    initTiltEffect();
    console.log('✅ Landing Page CanalQB inicializada');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
