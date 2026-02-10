/**
 * navigation-controller.js
 * Controla a navegação e validação de links
 * Vincular após header-manager.js
 */

(function() {
  'use strict';
  
  class NavigationController {
    constructor() {
      this.desktopNav = document.querySelector('.main-nav.desktop-nav');
      this.navLinks = document.querySelectorAll('.nav-list a, .mobile-nav-list a');
      this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
      this.init();
    }
    
    init() {
      // Ativar link da página atual
      this.setActiveLink();
      
      // Adicionar eventos de teclado para acessibilidade
      this.setupKeyboardNavigation();
      
      // Fechar menu mobile ao clicar em um link
      this.setupMobileLinkClose();
      
      // Prevenir comportamento padrão de links que apontam para a página atual
      this.preventSelfLinks();
    }
    
    setActiveLink() {
      // Remover classe active de todos os links
      this.navLinks.forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      });
      
      // Adicionar classe active ao link correspondente
      this.navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        
        // Comparar apenas o nome do arquivo
        if (linkHref === this.currentPage) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
        
        // Tratar index.html como página inicial
        if (this.currentPage === '' && linkHref === 'index.html') {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      });
    }
    
    setupKeyboardNavigation() {
      document.addEventListener('keydown', (e) => {
        // Navegação por Tab nos links
        if (e.key === 'Tab' && this.desktopNav) {
          this.handleTabNavigation(e);
        }
      });
    }
    
    handleTabNavigation(e) {
      const focusableElements = this.desktopNav.querySelectorAll(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // Manter foco dentro da navegação
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
    
    setupMobileLinkClose() {
      const mobileLinks = document.querySelectorAll('.mobile-nav-list a');
      const mobileMenuToggle = document.querySelector('.menu-toggle.mobile-nav-toggle');
      const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
      
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          // Fechar menu mobile se estiver aberto
          if (mobileMenuToggle && mobileMenuToggle.classList.contains('active')) {
            mobileMenuToggle.classList.remove('active');
            mobileNavOverlay?.classList.remove('active');
            document.querySelector('.mobile-nav')?.classList.remove('active');
            document.body.style.overflow = '';
          }
        });
      });
    }
    
    preventSelfLinks() {
      this.navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        
        if (linkHref === this.currentPage || 
            (this.currentPage === '' && linkHref === 'index.html')) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            // Scroll suave para o topo
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          });
        }
      });
    }
    
    // Método público para atualizar navegação
    updateNavigation() {
      this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
      this.setActiveLink();
    }
  }
  
  // Inicializar quando o DOM estiver carregado
  document.addEventListener('DOMContentLoaded', () => {
    window.navigationController = new NavigationController();
    
    // Atualizar navegação quando houver mudança de página (SPA-like)
    window.addEventListener('popstate', () => {
      window.navigationController.updateNavigation();
    });
  });
})();