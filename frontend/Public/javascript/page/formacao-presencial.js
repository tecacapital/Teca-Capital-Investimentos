/* ============================================================
   TECA — FORMAÇÕES PRESENCIAIS PREMIUM
   JavaScript Profissional
   ============================================================ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     1. FAQ ACCORDION
     ───────────────────────────────────────────── */
  function initFAQ() {
    const questions = document.querySelectorAll('.faq-question');
    if (!questions.length) return;

    questions.forEach(function (question) {
      question.addEventListener('click', function () {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        const answer = this.nextElementSibling;
        const item = this.closest('.faq-item');

        // Fechar todos os outros
        questions.forEach(function (q) {
          if (q !== question) {
            q.setAttribute('aria-expanded', 'false');
            const a = q.nextElementSibling;
            if (a) a.classList.remove('open');
            const it = q.closest('.faq-item');
            if (it) it.style.borderColor = '';
          }
        });

        // Toggle actual
        if (isExpanded) {
          this.setAttribute('aria-expanded', 'false');
          if (answer) answer.classList.remove('open');
          if (item) item.style.borderColor = '';
        } else {
          this.setAttribute('aria-expanded', 'true');
          if (answer) answer.classList.add('open');
          if (item) item.style.borderColor = 'rgba(214,174,100,0.4)';
        }
      });

      // Teclado acessível
      question.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });
  }

  /* ─────────────────────────────────────────────
     2. SCROLL REVEAL (IntersectionObserver)
     ───────────────────────────────────────────── */
  function initScrollReveal() {
    // Adiciona a classe .reveal a todos os elementos relevantes
    const targets = document.querySelectorAll(
      '.teca-page > section, .animated-border, .faq-item, .cta-card'
    );

    if (!targets.length) return;

    // Evita adicionar dupla animação se já entrou na viewport
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = Math.min(i * 0.055, 0.4) + 's';
    });

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ─────────────────────────────────────────────
     3. TABLE — HIGHLIGHT HOVERED ROW
     ───────────────────────────────────────────── */
  function initTableHighlight() {
    const tables = document.querySelectorAll('table tbody');
    tables.forEach(function (tbody) {
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(function (row) {
        row.addEventListener('mouseenter', function () {
          rows.forEach(function (r) { r.style.background = ''; });
          this.style.background = 'rgba(214,174,100,0.055)';
        });
        row.addEventListener('mouseleave', function () {
          this.style.background = '';
        });
      });
    });
  }

  /* ─────────────────────────────────────────────
     4. ANIMATED BORDER — MOUSE FOLLOW GLOW
     ───────────────────────────────────────────── */
  function initCardGlow() {
    const cards = document.querySelectorAll('.animated-border');
    if (window.matchMedia('(pointer: coarse)').matches) return; // skip mobile touch

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', x + '%');
        card.style.setProperty('--mouse-y', y + '%');
        card.style.background =
          'radial-gradient(circle at ' + x + '% ' + y + '%, ' +
          'rgba(214,174,100,0.055) 0%, var(--bg-card) 65%)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.background = '';
      });
    });
  }

  /* ─────────────────────────────────────────────
     5. BOTÕES — RIPPLE EFFECT
     ───────────────────────────────────────────── */
  function initRipple() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

    buttons.forEach(function (btn) {
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';

      btn.addEventListener('click', function (e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2;

        const ripple = document.createElement('span');
        Object.assign(ripple.style, {
          position: 'absolute',
          width: size + 'px',
          height: size + 'px',
          left: (x - size / 2) + 'px',
          top: (y - size / 2) + 'px',
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '50%',
          transform: 'scale(0)',
          animation: 'rippleAnim 0.55s ease-out forwards',
          pointerEvents: 'none',
        });

        btn.appendChild(ripple);
        setTimeout(function () { ripple.remove(); }, 600);
      });
    });

    // Injectar keyframe de ripple dinamicamente
    if (!document.getElementById('teca-ripple-style')) {
      const style = document.createElement('style');
      style.id = 'teca-ripple-style';
      style.textContent =
        '@keyframes rippleAnim {' +
        'to { transform: scale(1); opacity: 0; }' +
        '}';
      document.head.appendChild(style);
    }
  }

  /* ─────────────────────────────────────────────
     6. SCROLL PROGRESS BAR
     ───────────────────────────────────────────── */
  function initScrollProgress() {
    const bar = document.createElement('div');
    Object.assign(bar.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      height: '2.5px',
      width: '0%',
      background: 'linear-gradient(90deg, rgb(214,174,100), #f0d98a)',
      zIndex: '9999',
      transition: 'width 0.1s linear',
      boxShadow: '0 0 8px rgba(214,174,100,0.5)',
      pointerEvents: 'none',
    });
    document.body.appendChild(bar);

    window.addEventListener('scroll', function () {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────
     7. SECTION CATEGORY LABELS (acessibilidade)
        Garante que os cards de categoria tenham
        borda correta mesmo se classes forem
        carregadas tardiamente
     ───────────────────────────────────────────── */
  function initCategoryBorders() {
    const colorMap = {
      mercado:  'rgb(214,174,100)',
      gestao:   '#3a8ef6',
      economia: '#e04545',
    };
    Object.keys(colorMap).forEach(function (cls) {
      document.querySelectorAll('.card-categoria.' + cls).forEach(function (card) {
        card.style.borderLeftColor = colorMap[cls];
      });
    });
  }

  /* ─────────────────────────────────────────────
     8. TABELA — SCROLL HINT (mobile)
        Mostra uma sombra quando a tabela tem
        overflow horizontal
     ───────────────────────────────────────────── */
  function initTableScrollHint() {
    document.querySelectorAll('.table-responsive').forEach(function (wrapper) {
      function check() {
        const hasOverflow = wrapper.scrollWidth > wrapper.clientWidth;
        wrapper.style.boxShadow = hasOverflow
          ? 'inset -18px 0 18px -10px rgba(0,0,0,0.55), ' +
            '0 2px 24px rgba(0,0,0,0.55)'
          : '';
      }
      check();
      window.addEventListener('resize', check, { passive: true });
      wrapper.addEventListener('scroll', function () {
        const atEnd =
          wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 4;
        wrapper.style.boxShadow = atEnd
          ? ''
          : 'inset -18px 0 18px -10px rgba(0,0,0,0.55), ' +
            '0 2px 24px rgba(0,0,0,0.55)';
      }, { passive: true });
    });
  }

  /* ─────────────────────────────────────────────
     9. STAGGER ANIMATION — CARDS
     ───────────────────────────────────────────── */
  function initCardStagger() {
    document.querySelectorAll('.grid-cards').forEach(function (grid) {
      const cards = grid.querySelectorAll('.animated-border');
      cards.forEach(function (card, i) {
        card.style.animationDelay = (i * 0.12) + 's';
      });
    });
  }

  /* ─────────────────────────────────────────────
     10. ACTIVE SECTION HIGHLIGHT (opcional)
         Aplica um leve glow à secção visível
     ───────────────────────────────────────────── */
  function initActiveSectionGlow() {
    if (!('IntersectionObserver' in window)) return;
    const sections = document.querySelectorAll('.teca-page > section');

    const obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            sections.forEach(function (s) { s.style.setProperty('--section-active', '0'); });
            entry.target.style.setProperty('--section-active', '1');
          }
        });
      },
      { threshold: 0.25 }
    );

    sections.forEach(function (s) { obs.observe(s); });
  }

  /* ─────────────────────────────────────────────
     INIT — DOM ready
     ───────────────────────────────────────────── */
  function init() {
    initFAQ();
    initScrollReveal();
    initTableHighlight();
    initCardGlow();
    initRipple();
    initScrollProgress();
    initCategoryBorders();
    initTableScrollHint();
    initCardStagger();
    initActiveSectionGlow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

  
 
   
    