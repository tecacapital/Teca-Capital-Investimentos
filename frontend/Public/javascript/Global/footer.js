/**
 * TECA CAPITAL - FOOTER INTERACTIONS
 * Arquivo: /js/footer-interactions.js
 * Vincular em: antes do fechamento de </body>
 * 
 * Funcionalidades:
 * - Year auto-update no copyright
 * - Smooth scroll para links internos
 * - Validação de formulários se houver
 * - Animações de entrada no scroll
 */

(function() {
  'use strict';

  // Configurações
  const CONFIG = {
    yearSelector: '#current-year',
    smoothScrollSelector: 'a[href^="#"]',
    footerSelector: '.site-footer',
    animateOnScroll: true
  };

  /**
   * Inicializa as interações do footer
   */
  function init() {
    updateCopyrightYear();
    setupSmoothScroll();
    setupFooterAnimations();
    setupSocialLinksValidation();
  }

  /**
   * Atualiza ano do copyright automaticamente
   */
  function updateCopyrightYear() {
    const yearElement = document.querySelector(CONFIG.yearSelector);
    
    if (yearElement) {
      const currentYear = new Date().getFullYear();
      yearElement.textContent = currentYear;
    }
  }

  /**
   * Configura smooth scroll para links internos
   */
  function setupSmoothScroll() {
    const internalLinks = document.querySelectorAll(CONFIG.smoothScrollSelector);
    
    internalLinks.forEach(link => {
      link.addEventListener('click', handleSmoothScroll);
    });
  }

  /**
   * Handler de smooth scroll
   */
  function handleSmoothScroll(event) {
    const href = this.getAttribute('href');
    
    // Ignora links vazios ou apenas #
    if (href === '#' || !href) return;
    
    const target = document.querySelector(href);
    
    if (target) {
      event.preventDefault();
      
      const headerOffset = 80; // Altura do header fixo
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Atualiza URL sem recarregar
      history.pushState(null, null, href);
    }
  }

  /**
   * Configura animações de entrada no scroll
   */
  function setupFooterAnimations() {
    if (!CONFIG.animateOnScroll) return;
    
    const footer = document.querySelector(CONFIG.footerSelector);
    if (!footer) return;
    
    // Intersection Observer para animar quando footer entrar na viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('footer--visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    observer.observe(footer);
    
    // Adiciona estilos de animação dinamicamente
    addAnimationStyles();
  }

  /**
   * Adiciona estilos CSS para animações
   */
  function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .site-footer {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      
      .site-footer.footer--visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Valida links de redes sociais
   */
  function setupSocialLinksValidation() {
    const socialLinks = document.querySelectorAll('.social-icons a');
    
    socialLinks.forEach(link => {
      link.addEventListener('click', function(event) {
        const href = this.getAttribute('href');
        
        // Verifica se link está configurado corretamente
        if (!href || href === '#' || href === '') {
          event.preventDefault();
          console.warn('Footer: Link de rede social não configurado:', this.getAttribute('aria-label'));
          showNotification('Link em breve disponível', 'info');
        }
      });
    });
  }

  /**
   * Mostra notificação temporária
   */
  function showNotification(message, type = 'info') {
    // Cria elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    // Estilos inline (pode ser movido para CSS)
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'info' ? 'rgb(214, 174, 100)' : '#cc3333'};
      color: #000;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 9999;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove após 3 segundos
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Adiciona keyframes para animações
  const keyframes = document.createElement('style');
  keyframes.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(keyframes);

  // Inicializa quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();