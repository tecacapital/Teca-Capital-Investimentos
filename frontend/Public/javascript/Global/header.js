/**
 * TECA CAPITAL - HEADER MANAGER
 * Arquivo: frontend/Public/JS/header-manager.js
 * Descrição: Controle de scroll behavior e estado do header
 * Instrução: Linkar em TODAS as páginas antes do fechamento do </body>
 * 
 * Funcionalidades:
 * - Detecção de scroll para mudar aparência do header
 * - Cálculo dinâmico de altura do header
 * - Gerenciamento de estado fixo/transparente
 */

(function() {
  'use strict';

  // Configurações
  const CONFIG = {
    scrollThreshold: 50, // pixels para ativar estado scrolled
    headerSelector: '.site-header',
    scrolledClass: 'site-header--scrolled',
    transparentClass: 'site-header--transparent',
    resizeDebounce: 100 // ms
  };

  // Estado
  let headerElement = null;
  let lastScrollY = 0;
  let resizeTimeout = null;

  /**
   * Inicializa o gerenciador do header
   */
  function init() {
    headerElement = document.querySelector(CONFIG.headerSelector);

    if (!headerElement) {
      console.warn('[HeaderManager] Elemento header não encontrado');
      return;
    }

    // Configura event listeners
    setupEventListeners();

    // Verifica scroll inicial
    handleScroll();

    // Atualiza altura CSS custom property
    updateHeaderHeight();

    console.log('[HeaderManager] Inicializado com sucesso');
  }

  /**
   * Configura event listeners
   */
  function setupEventListeners() {
    // Scroll com throttle para performance
    let ticking = false;

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Resize com debounce
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        updateHeaderHeight();
      }, CONFIG.resizeDebounce);
    });

    // Verifica preferência de movimento reduzido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      headerElement.style.transition = 'none';
    }
  }

  /**
   * Manipula evento de scroll
   */
  function handleScroll() {
    const currentScrollY = window.scrollY || window.pageYOffset;

    // Adiciona/remove classe scrolled baseado no threshold
    if (currentScrollY > CONFIG.scrollThreshold) {
      headerElement.classList.add(CONFIG.scrolledClass);
    } else {
      headerElement.classList.remove(CONFIG.scrolledClass);
    }

    // Atualiza última posição
    lastScrollY = currentScrollY;
  }

  /**
   * Atualiza a altura do header como CSS custom property
   */
  function updateHeaderHeight() {
    if (!headerElement) return;

    const height = headerElement.offsetHeight;
    document.documentElement.style.setProperty('--header-height-current', height + 'px');

    // Dispara evento customizado para outros componentes
    window.dispatchEvent(new CustomEvent('headerHeightChanged', { 
      detail: { height: height } 
    }));
  }

  /**
   * Define modo transparente do header
   * @param {boolean} transparent - true para transparente, false para normal
   */
  function setTransparentMode(transparent) {
    if (!headerElement) return;

    if (transparent) {
      headerElement.classList.add(CONFIG.transparentClass);
    } else {
      headerElement.classList.remove(CONFIG.transparentClass);
    }
  }

  /**
   * Obtém altura atual do header
   * @returns {number} Altura em pixels
   */
  function getHeaderHeight() {
    return headerElement ? headerElement.offsetHeight : 0;
  }

  /**
   * Verifica se header está em modo scrolled
   * @returns {boolean}
   */
  function isScrolled() {
    return headerElement ? headerElement.classList.contains(CONFIG.scrolledClass) : false;
  }

  // API Pública
  window.HeaderManager = {
    init: init,
    setTransparentMode: setTransparentMode,
    getHeaderHeight: getHeaderHeight,
    isScrolled: isScrolled,
    updateHeight: updateHeaderHeight
  };

  // Auto-inicialização quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();