/**
 * TECA CAPITAL - MOBILE MENU TOGGLE
 * Arquivo: frontend/Public/JS/mobile-menu-toggle.js
 * Descrição: Controle completo do menu mobile com acessibilidade
 * Instrução: Linkar em TODAS as páginas antes do fechamento do </body>
 * 
 * Funcionalidades:
 * - Toggle do menu mobile
 * - Botão X funcional
 * - Fechar ao clicar fora
 * - Tecla Escape para fechar
 * - ARIA attributes dinâmicos
 * - Foco gerenciado
 * - Animações suaves
 */

(function() {
  'use strict';

  // Configurações
  const CONFIG = {
    toggleSelector: '.menu-toggle',
    overlaySelector: '.mobile-nav-overlay',
    navSelector: '.mobile-nav',
    closeButtonSelector: '.mobile-nav__close',
    navLinkSelector: '.mobile-nav-list a',
    activeClass: 'active',
    bodyLockClass: 'menu-open'
  };

  // Estado
  let toggleButton = null;
  let overlay = null;
  let nav = null;
  let closeButton = null;
  let navLinks = [];
  let isOpen = false;
  let lastFocusedElement = null;

  /**
   * Inicializa o controle do menu mobile
   */
  function init() {
    // Seleciona elementos
    toggleButton = document.querySelector(CONFIG.toggleSelector);
    overlay = document.querySelector(CONFIG.overlaySelector);
    nav = document.querySelector(CONFIG.navSelector);
    closeButton = document.querySelector(CONFIG.closeButtonSelector);
    navLinks = document.querySelectorAll(CONFIG.navLinkSelector);

    // Verifica se elementos essenciais existem
    if (!toggleButton || !overlay) {
      console.warn('[MobileMenuToggle] Elementos essenciais não encontrados');
      return;
    }

    // Configura event listeners
    setupEventListeners();

    // Configura ARIA attributes iniciais
    setupAriaAttributes();

    console.log('[MobileMenuToggle] Inicializado com sucesso');
  }

  /**
   * Configura event listeners
   */
  function setupEventListeners() {
    // Botão toggle (hamburger)
    toggleButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // Botão fechar (X) - se existir no HTML
    if (closeButton) {
      closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
      });
    }

    // Clicar fora do menu fecha
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeMenu();
      }
    });

    // Links do menu fecham ao clicar
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        closeMenu();
      });
    });

    // Tecla Escape fecha menu
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    });

    // Previne scroll do body quando menu aberto
    preventBodyScroll();

    // Ajusta em resize
    window.addEventListener('resize', handleResize);
  }

  /**
   * Configura atributos ARIA para acessibilidade
   */
  function setupAriaAttributes() {
    // Botão toggle
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-controls', 'mobile-nav');

    // Overlay/Menu
    if (overlay) {
      overlay.setAttribute('id', 'mobile-nav');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Menu de navegação mobile');
    }

    // Botão fechar
    if (closeButton) {
      closeButton.setAttribute('aria-label', 'Fechar menu');
    }
  }

  /**
   * Abre o menu mobile
   */
  function openMenu() {
    if (isOpen) return;

    // Salva elemento focado para restaurar depois
    lastFocusedElement = document.activeElement;

    // Ativa classes
    overlay.classList.add(CONFIG.activeClass);
    toggleButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add(CONFIG.bodyLockClass);

    // Bloqueia scroll do body
    lockBodyScroll();

    // Move foco para o menu
    setTimeout(function() {
      if (closeButton) {
        closeButton.focus();
      } else if (navLinks.length > 0) {
        navLinks[0].focus();
      }
    }, 100);

    isOpen = true;

    // Dispara evento
    window.dispatchEvent(new CustomEvent('mobileMenuOpened'));

    console.log('[MobileMenuToggle] Menu aberto');
  }

  /**
   * Fecha o menu mobile
   */
  function closeMenu() {
    if (!isOpen) return;

    // Remove classes
    overlay.classList.remove(CONFIG.activeClass);
    toggleButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove(CONFIG.bodyLockClass);

    // Libera scroll do body
    unlockBodyScroll();

    // Restaura foco
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }

    isOpen = false;

    // Dispara evento
    window.dispatchEvent(new CustomEvent('mobileMenuClosed'));

    console.log('[MobileMenuToggle] Menu fechado');
  }

  /**
   * Toggle do menu
   */
  function toggleMenu() {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  /**
   * Bloqueia scroll do body
   */
  function lockBodyScroll() {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollY + 'px';
    document.body.style.width = '100%';
    document.body.dataset.scrollY = scrollY;
  }

  /**
   * Libera scroll do body
   */
  function unlockBodyScroll() {
    const scrollY = document.body.dataset.scrollY || '0';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, parseInt(scrollY || '0'));
    delete document.body.dataset.scrollY;
  }

  /**
   * Previne scroll do body quando menu está aberto
   */
  function preventBodyScroll() {
    // Previne scroll com touch no overlay
    overlay.addEventListener('touchmove', function(e) {
      if (e.target === overlay) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  /**
   * Manipula resize da janela
   */
  function handleResize() {
    // Se mudar para desktop (> 767px), fecha o menu
    if (window.innerWidth > 767 && isOpen) {
      closeMenu();
    }
  }

  /**
   * Verifica se menu está aberto
   * @returns {boolean}
   */
  function isMenuOpen() {
    return isOpen;
  }

  // API Pública
  window.MobileMenuToggle = {
    init: init,
    open: openMenu,
    close: closeMenu,
    toggle: toggleMenu,
    isOpen: isMenuOpen
  };

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();