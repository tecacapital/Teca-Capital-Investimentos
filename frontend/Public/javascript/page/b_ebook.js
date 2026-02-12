/* ================================================
   BIBLIOTECA DE E-BOOKS - TECA CAPITAL
   SISTEMA COMPLETO DE FUNCIONALIDADES
   Versão 2.0.0 - PRODUCTION READY
   ================================================ */

(function() {
    'use strict';

    // ================================================
    // CONFIGURAÇÕES GLOBAIS
    // ================================================
    const CONFIG = {
        version: '2.0.0',
        debug: false,
        animationsEnabled: window.matchMedia('(prefers-reduced-motion: no-preference)').matches,
        mobileBreakpoint: 768,
        extraSmallBreakpoint: 350,
        localStorageKeys: {
            favorites: 'teca_favorites_v2',
            filterPresets: 'teca_filter_presets_v2',
            viewPreference: 'teca_view_preference_v2',
            lastVisit: 'teca_last_visit_v2'
        },
        selectors: {
            ebookItem: '.ebook-item',
            ebookCard: '.ebook-card',
            ebookTitle: '.ebook-title',
            ebookSubtitle: '.ebook-subtitle',
            ebookMeta: '.ebook-meta',
            ebookTags: '.tag',
            ebookCollection: '.ebooks-collection',
            filterBtn: '.filter-btn',
            filterChip: '.filter-chip',
            searchInput: '#global-search-input',
            searchBtn: '#global-search-btn',
            sortSelect: '#sort-select-main',
            viewOptions: '.view-option',
            applyFiltersBtn: '#apply-filters-btn',
            clearFiltersBtn: '#clear-filters-btn',
            savePresetBtn: '#save-filter-preset',
            filtersToggle: '#filters-main-toggle',
            filtersPanel: '#filters-panel',
            toggleIcon: '#toggle-icon',
            favoriteBtn: '.btn-favorite',
            previewBtn: '.btn-preview',
            shareBtn: '.btn-share',
            downloadBtn: '.btn-primary[href$=".pdf"]',
            modal: '#modal-preview',
            modalClose: '#modal-preview-close',
            modalTitle: '#modal-ebook-title',
            pdfFilename: '#pdf-filename',
            downloadFromModal: '#download-from-modal',
            readFromModal: '#read-from-modal',
            libraryCollection: '#library-collection',
            libraryEmptyState: '#library-empty-state',
            exploreEbooksBtn: '#explore-ebooks-btn',
            statNumbers: '.stat-number[data-target]',
            countBadges: '[id^="count-"]'
        }
    };

    // ================================================
    // ESTADO DA APLICAÇÃO
    // ================================================
    const AppState = {
        ebooks: [],
        filteredEbooks: [],
        currentFilters: {
            category: 'todos',
            year: 'all',
            pages: 'all',
            language: 'all',
            type: 'all',
            author: 'all',
            popularity: 'all',
            searchTerm: ''
        },
        currentSort: 'relevance',
        currentView: 'grid',
        favorites: [],
        filterPanelOpen: false,
        initialized: false,
        lastSearch: '',
        downloadTracking: {}
    };

    // ================================================
    // UTILITÁRIOS
    // ================================================
    const Utils = {
        log: function(message, type = 'info') {
            if (CONFIG.debug) {
                console.log(`[Biblioteca v${CONFIG.version}] ${message}`);
            }
        },

        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        formatNumber: function(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        },

        getElement: function(selector) {
            return document.querySelector(selector);
        },

        getAllElements: function(selector) {
            return document.querySelectorAll(selector);
        },

        saveToLocalStorage: function(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('Erro ao salvar no localStorage:', e);
                return false;
            }
        },

        loadFromLocalStorage: function(key, defaultValue = null) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaultValue;
            } catch (e) {
                console.error('Erro ao carregar do localStorage:', e);
                return defaultValue;
            }
        },

        showToast: function(message, type = 'success', duration = 3000) {
            const existingToast = document.querySelector('.toast-notification');
            if (existingToast) existingToast.remove();

            const toast = document.createElement('div');
            toast.className = `toast-notification toast-${type}`;
            toast.innerHTML = `
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },

        generateId: function() {
            return 'ebook-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        },

        sanitizeText: function(text) {
            return text.replace(/[<>]/g, '');
        },

        isValidEbook: function(element) {
            return element && element.dataset && element.dataset.id;
        }
    };

    // ================================================
    // INICIALIZADOR DE DADOS
    // ================================================
    const DataInitializer = {
        init: function() {
            this.collectEbookData();
            this.loadFavorites();
            this.loadViewPreference();
            this.updateEbookCounts();
            this.updateFavoritesBadge();
            this.restoreLastSession();
            Utils.log(`${AppState.ebooks.length} e-books carregados, ${AppState.favorites.length} favoritos`);
        },

        collectEbookData: function() {
            const ebookItems = Utils.getAllElements(CONFIG.selectors.ebookItem);
            
            AppState.ebooks = Array.from(ebookItems).map(item => {
                if (!Utils.isValidEbook(item)) return null;
                
                return {
                    element: item,
                    id: item.dataset.id,
                    category: item.dataset.category || 'outros',
                    author: item.dataset.author || 'Autor desconhecido',
                    year: parseInt(item.dataset.year) || 0,
                    pages: parseInt(item.dataset.pages) || 0,
                    language: item.dataset.language || 'portugues',
                    type: item.dataset.type || 'resumo',
                    downloads: parseInt(item.dataset.downloads) || 0,
                    favorite: item.dataset.favorite === 'true',
                    recent: item.dataset.recent === 'true',
                    classic: item.dataset.classic === 'true',
                    title: item.querySelector(CONFIG.selectors.ebookTitle)?.textContent?.trim() || '',
                    subtitle: item.querySelector(CONFIG.selectors.ebookSubtitle)?.textContent?.trim() || '',
                    tags: Array.from(item.querySelectorAll(CONFIG.selectors.ebookTags)).map(t => t.textContent.trim().toLowerCase())
                };
            }).filter(Boolean);
            
            AppState.filteredEbooks = [...AppState.ebooks];
        },

        loadFavorites: function() {
            AppState.favorites = Utils.loadFromLocalStorage(CONFIG.localStorageKeys.favorites, []);
            
            AppState.favorites.forEach(id => {
                const btn = Utils.getElement(`${CONFIG.selectors.favoriteBtn}[data-id="${id}"]`);
                if (btn) {
                    btn.classList.add('favorite-active');
                    const icon = btn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        icon.style.color = '#ff4757';
                    }
                }
                
                const ebook = AppState.ebooks.find(e => e.id === id);
                if (ebook) ebook.favorite = true;
            });
        },

        loadViewPreference: function() {
            const savedView = Utils.loadFromLocalStorage(CONFIG.localStorageKeys.viewPreference, 'grid');
            AppState.currentView = savedView;
            
            const viewOptions = Utils.getAllElements(CONFIG.selectors.viewOptions);
            viewOptions.forEach(opt => {
                opt.classList.remove('active');
                if (opt.dataset.view === savedView) {
                    opt.classList.add('active');
                }
            });
            
            this.applyViewMode(savedView);
        },

        applyViewMode: function(mode) {
            const collections = Utils.getAllElements(CONFIG.selectors.ebookCollection);
            collections.forEach(collection => {
                collection.className = CONFIG.selectors.ebookCollection.substring(1);
                collection.classList.add(`view-${mode}`);
            });
        },

        updateEbookCounts: function() {
            const categories = ['financas', 'gestao', 'economia'];
            
            categories.forEach(cat => {
                const count = AppState.ebooks.filter(ebook => ebook.category === cat).length;
                const badge = Utils.getElement(`#count-${cat}`);
                if (badge) {
                    badge.textContent = `${count} ${count === 1 ? 'e-book' : 'e-books'}`;
                }
            });
        },

        updateFavoritesBadge: function() {
            const favoriteFilterBtn = Array.from(Utils.getAllElements(CONFIG.selectors.filterBtn)).find(
                btn => btn.dataset.filter === 'favoritos'
            );
            
            if (favoriteFilterBtn) {
                const count = AppState.favorites.length;
                const badge = favoriteFilterBtn.querySelector('.badge');
                
                if (count > 0) {
                    if (badge) {
                        badge.textContent = count;
                    } else {
                        const span = document.createElement('span');
                        span.className = 'badge';
                        span.textContent = count;
                        favoriteFilterBtn.appendChild(span);
                    }
                } else if (badge) {
                    badge.remove();
                }
            }
        },

        restoreLastSession: function() {
            const lastVisit = Utils.loadFromLocalStorage(CONFIG.localStorageKeys.lastVisit);
            if (lastVisit) {
                const now = new Date().toDateString();
                if (lastVisit !== now) {
                    Utils.showToast('Novos e-books disponíveis!', 'info', 5000);
                }
            }
            Utils.saveToLocalStorage(CONFIG.localStorageKeys.lastVisit, new Date().toDateString());
        }
    };

    // ================================================
    // GESTOR DE ANIMAÇÕES
    // ================================================
    const AnimationManager = {
        init: function() {
            if (!CONFIG.animationsEnabled) {
                document.documentElement.style.setProperty('--animation-speed', '0s');
                return;
            }
            
            this.observeElements();
            this.setupScrollEffects();
            this.optimizeForMobile();
        },

        observeElements: function() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '50px' });

            Utils.getAllElements('.ebook-card, .stat-card, .recommendation-card, .timeline-item').forEach(el => {
                observer.observe(el);
            });
        },

        setupScrollEffects: function() {
            let ticking = false;
            
            window.addEventListener('scroll', Utils.throttle(() => {
                const scrollPosition = window.scrollY;
                const header = Utils.getElement('.section-header');
                
                if (header) {
                    const scale = 1 - (scrollPosition * 0.0003);
                    header.style.transform = `scale(${Math.max(0.98, scale)})`;
                    header.style.opacity = Math.max(0.9, 1 - (scrollPosition * 0.0005));
                }
            }, 100), { passive: true });
        },

        optimizeForMobile: function() {
            const isExtraSmall = window.innerWidth < CONFIG.extraSmallBreakpoint;
            
            if (isExtraSmall) {
                document.documentElement.style.setProperty('--animation-duration', '8s');
                document.documentElement.style.setProperty('--animation-opacity', '0.3');
            }
        }
    };

    // ================================================
    // SISTEMA DE BUSCA
    // ================================================
    const SearchSystem = {
        init: function() {
            this.searchInput = Utils.getElement(CONFIG.selectors.searchInput);
            this.searchButton = Utils.getElement(CONFIG.selectors.searchBtn);
            
            if (!this.searchInput) return;
            
            this.bindEvents();
        },

        bindEvents: function() {
            this.searchButton?.addEventListener('click', () => this.performSearch());
            
            this.searchInput.addEventListener('input', Utils.debounce((e) => {
                AppState.currentFilters.searchTerm = e.target.value.toLowerCase().trim();
                this.filterEbooks();
            }, 300));
            
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });
        },

        performSearch: function() {
            AppState.currentFilters.searchTerm = this.searchInput.value.toLowerCase().trim();
            this.filterEbooks();
            
            this.searchButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.searchButton.style.transform = 'scale(1)';
            }, 200);
            
            if (AppState.currentFilters.searchTerm.length > 0) {
                this.activateFilterButton('todos');
            }
            
            Utils.showToast(`Busca: "${this.searchInput.value}"`, 'info', 2000);
        },

        filterEbooks: function() {
            const cards = Utils.getAllElements(CONFIG.selectors.ebookItem);
            let visibleCount = 0;
            
            cards.forEach(card => {
                const title = card.querySelector(CONFIG.selectors.ebookTitle)?.textContent?.toLowerCase() || '';
                const subtitle = card.querySelector(CONFIG.selectors.ebookSubtitle)?.textContent?.toLowerCase() || '';
                const author = card.dataset.author?.toLowerCase() || '';
                const tags = Array.from(card.querySelectorAll(CONFIG.selectors.ebookTags)).map(t => t.textContent.toLowerCase());
                
                const matchesSearch = AppState.currentFilters.searchTerm === '' || 
                                     title.includes(AppState.currentFilters.searchTerm) ||
                                     subtitle.includes(AppState.currentFilters.searchTerm) ||
                                     author.includes(AppState.currentFilters.searchTerm) ||
                                     tags.some(tag => tag.includes(AppState.currentFilters.searchTerm));
                
                if (matchesSearch) {
                    card.style.display = 'block';
                    visibleCount++;
                    
                    if (AppState.currentFilters.searchTerm.length > 0 && 
                        AppState.currentFilters.searchTerm !== AppState.lastSearch) {
                        this.highlightSearchTerm(card);
                    }
                } else {
                    card.style.display = 'none';
                }
            });
            
            AppState.lastSearch = AppState.currentFilters.searchTerm;
            this.updateNoResultsMessage(visibleCount === 0);
        },

        highlightSearchTerm: function(card) {
            const titleEl = card.querySelector(CONFIG.selectors.ebookTitle);
            if (titleEl && AppState.currentFilters.searchTerm.length > 0) {
                const originalText = titleEl.textContent;
                const regex = new RegExp(`(${AppState.currentFilters.searchTerm})`, 'gi');
                titleEl.innerHTML = originalText.replace(regex, '<span class="search-highlight">$1</span>');
            }
        },

        updateNoResultsMessage: function(show) {
            let messageEl = Utils.getElement('.no-results-message');
            
            if (show && !messageEl) {
                const firstCollection = Utils.getElement(CONFIG.selectors.ebookCollection);
                messageEl = document.createElement('div');
                messageEl.className = 'no-results-message';
                messageEl.innerHTML = `
                    <div class="no-results-content">
                        <i class="fas fa-search"></i>
                        <h3>Nenhum e-book encontrado</h3>
                        <p>Tente buscar por outros termos ou limpe os filtros.</p>
                        <button class="btn btn-primary" id="clear-search-btn">
                            <i class="fas fa-undo-alt"></i> Limpar busca
                        </button>
                    </div>
                `;
                
                firstCollection?.parentNode?.insertBefore(messageEl, firstCollection.nextSibling);
                
                const clearBtn = Utils.getElement('#clear-search-btn');
                clearBtn?.addEventListener('click', () => {
                    this.searchInput.value = '';
                    AppState.currentFilters.searchTerm = '';
                    this.filterEbooks();
                    messageEl.remove();
                });
            } else if (!show && messageEl) {
                messageEl.remove();
            }
        },

        activateFilterButton: function(category) {
            const buttons = Utils.getAllElements(CONFIG.selectors.filterBtn);
            buttons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === category) {
                    btn.classList.add('active');
                }
            });
            
            AppState.currentFilters.category = category;
        }
    };

    // ================================================
    // SISTEMA DE FILTROS PRINCIPAIS
    // ================================================
    const MainFilterSystem = {
        init: function() {
            this.filterButtons = Utils.getAllElements(CONFIG.selectors.filterBtn);
            this.bindEvents();
        },

        bindEvents: function() {
            this.filterButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.activateFilter(btn);
                    this.applyCategoryFilter(btn.dataset.filter);
                });
            });
        },

        activateFilter: function(activeBtn) {
            this.filterButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            activeBtn.classList.add('active');
        },

        applyCategoryFilter: function(category) {
            AppState.currentFilters.category = category;
            
            const sections = Utils.getAllElements('.category-section');
            const recSection = Utils.getElement('.section-recommendations');
            
            sections.forEach(section => section.style.display = 'none');
            
            if (category === 'todos') {
                sections.forEach(section => section.style.display = 'block');
                Utils.getAllElements(CONFIG.selectors.ebookItem).forEach(card => card.style.display = 'block');
                if (recSection) recSection.style.display = 'block';
                
            } else if (category === 'favoritos') {
                this.showFavoritesOnly();
                if (recSection) recSection.style.display = 'none';
                
            } else if (category === 'recentes') {
                this.showRecentOnly();
                if (recSection) recSection.style.display = 'none';
                
            } else {
                const targetSection = Utils.getElement(`#categoria-${category}`);
                if (targetSection) targetSection.style.display = 'block';
                if (recSection) recSection.style.display = 'none';
                
                Utils.getAllElements(CONFIG.selectors.ebookItem).forEach(card => {
                    card.style.display = card.dataset.category === category ? 'block' : 'none';
                });
            }
            
            this.updateResultCounts();
        },

        showFavoritesOnly: function() {
            const myLibrarySection = Utils.getElement('#my-library');
            if (myLibrarySection) {
                myLibrarySection.style.display = 'block';
                this.renderFavoritesCollection();
            }
            
            Utils.getAllElements(CONFIG.selectors.ebookItem).forEach(card => {
                card.style.display = 'none';
            });
        },

        renderFavoritesCollection: function() {
            const collection = Utils.getElement(CONFIG.selectors.libraryCollection);
            const emptyState = Utils.getElement(CONFIG.selectors.libraryEmptyState);
            
            if (!collection || !emptyState) return;
            
            if (AppState.favorites.length === 0) {
                collection.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }
            
            emptyState.style.display = 'none';
            collection.style.display = 'grid';
            collection.innerHTML = '';
            
            AppState.favorites.forEach(id => {
                const originalCard = Utils.getElement(`${CONFIG.selectors.ebookItem}[data-id="${id}"]`);
                if (originalCard) {
                    const clone = originalCard.cloneNode(true);
                    clone.classList.add('favorite-item');
                    collection.appendChild(clone);
                }
            });
        },

        showRecentOnly: function() {
            Utils.getAllElements(CONFIG.selectors.ebookItem).forEach(card => {
                const isRecent = card.dataset.recent === 'true';
                card.style.display = isRecent ? 'block' : 'none';
            });
        },

        updateResultCounts: function() {
            const categories = ['financas', 'gestao', 'economia'];
            
            categories.forEach(cat => {
                const section = Utils.getElement(`#categoria-${cat}`);
                if (section) {
                    const visibleCards = section.querySelectorAll(`${CONFIG.selectors.ebookItem}[style="display: block"], ${CONFIG.selectors.ebookItem}:not([style*="none"])`);
                    const count = visibleCards.length;
                    
                    const badge = section.querySelector('.ebook-count-badge');
                    if (badge) {
                        badge.textContent = `${count} ${count === 1 ? 'e-book' : 'e-books'}`;
                    }
                }
            });
        }
    };

    // ================================================
    // SISTEMA DE FILTROS AVANÇADOS
    // ================================================
    const AdvancedFilterSystem = {
        init: function() {
            this.filterChips = Utils.getAllElements(CONFIG.selectors.filterChip);
            this.applyButton = Utils.getElement(CONFIG.selectors.applyFiltersBtn);
            this.clearButton = Utils.getElement(CONFIG.selectors.clearFiltersBtn);
            this.savePresetButton = Utils.getElement(CONFIG.selectors.savePresetBtn);
            this.toggle = Utils.getElement(CONFIG.selectors.filtersToggle);
            this.panel = Utils.getElement(CONFIG.selectors.filtersPanel);
            this.toggleIcon = Utils.getElement(CONFIG.selectors.toggleIcon);
            
            this.bindEvents();
            if (this.panel) this.panel.style.display = 'none';
        },

        bindEvents: function() {
            this.setupFilterChips();
            this.setupToggle();
            this.setupActionButtons();
        },

        setupFilterChips: function() {
            this.filterChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const group = chip.closest('.filter-options-group');
                    if (!group) return;
                    
                    group.querySelectorAll('.filter-chip').forEach(c => {
                        c.classList.remove('active');
                    });
                    
                    chip.classList.add('active');
                });
            });
        },

        setupToggle: function() {
            this.toggle?.addEventListener('click', () => {
                const isOpen = this.panel.style.display === 'block';
                
                if (isOpen) {
                    this.panel.style.display = 'none';
                    if (this.toggleIcon) this.toggleIcon.style.transform = 'rotate(0deg)';
                    this.toggle.classList.remove('active');
                } else {
                    this.panel.style.display = 'block';
                    if (this.toggleIcon) this.toggleIcon.style.transform = 'rotate(180deg)';
                    this.toggle.classList.add('active');
                    
                    this.panel.style.opacity = '0';
                    this.panel.style.transform = 'translateY(-10px)';
                    
                    setTimeout(() => {
                        this.panel.style.opacity = '1';
                        this.panel.style.transform = 'translateY(0)';
                    }, 50);
                }
                
                AppState.filterPanelOpen = !isOpen;
            });
        },

        setupActionButtons: function() {
            this.applyButton?.addEventListener('click', () => this.applyAdvancedFilters());
            this.clearButton?.addEventListener('click', () => this.clearAdvancedFilters());
            this.savePresetButton?.addEventListener('click', () => this.saveFilterPreset());
        },

        applyAdvancedFilters: function() {
            this.collectFilterValues();
            this.filterEbooksByAdvanced();
            Utils.showToast('Filtros aplicados com sucesso', 'success');
            
            this.applyButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.applyButton.style.transform = 'scale(1)';
            }, 200);
        },

        collectFilterValues: function() {
            const yearGroup = Utils.getElement('#filter-year-group');
            const pagesGroup = Utils.getElement('#filter-pages-group');
            const langGroup = Utils.getElement('#filter-language-group');
            const typeGroup = Utils.getElement('#filter-type-group');
            const authorGroup = Utils.getElement('#filter-author-group');
            const popularityGroup = Utils.getElement('#filter-popularity-group');
            
            AppState.currentFilters.year = yearGroup?.querySelector('.filter-chip.active')?.dataset.value || 'all';
            AppState.currentFilters.pages = pagesGroup?.querySelector('.filter-chip.active')?.dataset.value || 'all';
            AppState.currentFilters.language = langGroup?.querySelector('.filter-chip.active')?.dataset.value || 'all';
            AppState.currentFilters.type = typeGroup?.querySelector('.filter-chip.active')?.dataset.value || 'all';
            AppState.currentFilters.author = authorGroup?.querySelector('.filter-chip.active')?.dataset.value || 'all';
            AppState.currentFilters.popularity = popularityGroup?.querySelector('.filter-chip.active')?.dataset.value || 'all';
        },

        filterEbooksByAdvanced: function() {
            const cards = Utils.getAllElements(CONFIG.selectors.ebookItem);
            
            cards.forEach(card => {
                let visible = true;
                
                if (visible && AppState.currentFilters.year !== 'all') {
                    const year = parseInt(card.dataset.year) || 0;
                    if (AppState.currentFilters.year === 'before') visible = year < 2000;
                    else if (AppState.currentFilters.year === 'after') visible = year > 2020;
                    else visible = year === parseInt(AppState.currentFilters.year);
                }
                
                if (visible && AppState.currentFilters.pages !== 'all') {
                    const pages = parseInt(card.dataset.pages) || 0;
                    switch(AppState.currentFilters.pages) {
                        case '1-10': visible = pages >= 1 && pages <= 10; break;
                        case '11-20': visible = pages >= 11 && pages <= 20; break;
                        case '21-30': visible = pages >= 21 && pages <= 30; break;
                        case '31-50': visible = pages >= 31 && pages <= 50; break;
                        case '51+': visible = pages > 50; break;
                    }
                }
                
                if (visible && AppState.currentFilters.language !== 'all') {
                    visible = card.dataset.language === AppState.currentFilters.language;
                }
                
                if (visible && AppState.currentFilters.type !== 'all') {
                    visible = card.dataset.type === AppState.currentFilters.type;
                }
                
                if (visible && AppState.currentFilters.author !== 'all') {
                    const authorSlug = card.dataset.author?.replace(/\s+/g, '-').toLowerCase() || '';
                    visible = authorSlug === AppState.currentFilters.author;
                }
                
                if (visible && AppState.currentFilters.popularity !== 'all') {
                    if (AppState.currentFilters.popularity === 'mais-baixados') {
                        const downloads = parseInt(card.dataset.downloads) || 0;
                        visible = downloads >= 50;
                    } else if (AppState.currentFilters.popularity === 'recentes') {
                        visible = card.dataset.recent === 'true';
                    } else if (AppState.currentFilters.popularity === 'classicos') {
                        visible = card.dataset.classic === 'true' || parseInt(card.dataset.year) < 2000;
                    }
                }
                
                card.style.display = visible ? 'block' : 'none';
            });
        },

        clearAdvancedFilters: function() {
            Utils.getAllElements('.filter-options-group').forEach(group => {
                const allChip = Array.from(group.querySelectorAll('.filter-chip')).find(
                    chip => chip.dataset.value === 'all'
                );
                
                if (allChip) {
                    group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                    allChip.classList.add('active');
                }
            });
            
            AppState.currentFilters = {
                ...AppState.currentFilters,
                year: 'all',
                pages: 'all',
                language: 'all',
                type: 'all',
                author: 'all',
                popularity: 'all'
            };
            
            const activeCategoryBtn = Utils.getElement(`${CONFIG.selectors.filterBtn}.active`);
            if (activeCategoryBtn) {
                MainFilterSystem.applyCategoryFilter(activeCategoryBtn.dataset.filter);
            }
            
            Utils.showToast('Filtros limpos', 'info');
        },

        saveFilterPreset: function() {
            const presetName = prompt('Digite um nome para este filtro:');
            
            if (presetName && presetName.trim()) {
                const preset = {
                    id: Date.now(),
                    name: presetName.trim(),
                    filters: { ...AppState.currentFilters },
                    timestamp: Date.now()
                };
                
                const presets = Utils.loadFromLocalStorage(CONFIG.localStorageKeys.filterPresets, []);
                presets.push(preset);
                Utils.saveToLocalStorage(CONFIG.localStorageKeys.filterPresets, presets);
                
                Utils.showToast(`Filtro "${preset.name}" salvo`, 'success');
            }
        }
    };

    // ================================================
    // SISTEMA DE ORDENAÇÃO
    // ================================================
    const SortingSystem = {
        init: function() {
            this.sortSelect = Utils.getElement(CONFIG.selectors.sortSelect);
            this.bindEvents();
        },

        bindEvents: function() {
            this.sortSelect?.addEventListener('change', () => {
                AppState.currentSort = this.sortSelect.value;
                this.sortEbooks();
            });
        },

        sortEbooks: function() {
            const containers = Utils.getAllElements(CONFIG.selectors.ebookCollection);
            
            containers.forEach(container => {
                const cards = Array.from(container.querySelectorAll(CONFIG.selectors.ebookItem));
                
                cards.sort((a, b) => {
                    switch(AppState.currentSort) {
                        case 'title-asc':
                            return this.compareText(a, b, CONFIG.selectors.ebookTitle);
                        case 'title-desc':
                            return this.compareText(b, a, CONFIG.selectors.ebookTitle);
                        case 'year-desc':
                            return this.compareNumber(b, a, 'year');
                        case 'year-asc':
                            return this.compareNumber(a, b, 'year');
                        case 'author-asc':
                            return this.compareText(a, b, null, 'author');
                        case 'downloads-desc':
                            return this.compareNumber(b, a, 'downloads');
                        case 'downloads-asc':
                            return this.compareNumber(a, b, 'downloads');
                        case 'pages-asc':
                            return this.compareNumber(a, b, 'pages');
                        case 'pages-desc':
                            return this.compareNumber(b, a, 'pages');
                        default:
                            return 0;
                    }
                });
                
                cards.forEach(card => container.appendChild(card));
            });
        },

        compareText: function(a, b, selector, datasetKey = null) {
            let textA, textB;
            
            if (datasetKey) {
                textA = a.dataset[datasetKey] || '';
                textB = b.dataset[datasetKey] || '';
            } else {
                textA = a.querySelector(selector)?.textContent?.trim() || '';
                textB = b.querySelector(selector)?.textContent?.trim() || '';
            }
            
            return textA.localeCompare(textB);
        },

        compareNumber: function(a, b, datasetKey) {
            const valA = parseInt(a.dataset[datasetKey]) || 0;
            const valB = parseInt(b.dataset[datasetKey]) || 0;
            return valA - valB;
        }
    };

    // ================================================
    // SISTEMA DE VISUALIZAÇÃO
    // ================================================
    const ViewSystem = {
        init: function() {
            this.viewOptions = Utils.getAllElements(CONFIG.selectors.viewOptions);
            this.bindEvents();
        },

        bindEvents: function() {
            this.viewOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const view = option.dataset.view;
                    if (view) this.setViewMode(view);
                });
            });
        },

        setViewMode: function(mode) {
            this.viewOptions.forEach(opt => {
                opt.classList.remove('active');
            });
            
            const activeOption = Utils.getElement(`${CONFIG.selectors.viewOptions}[data-view="${mode}"]`);
            if (activeOption) activeOption.classList.add('active');
            
            AppState.currentView = mode;
            
            const collections = Utils.getAllElements(CONFIG.selectors.ebookCollection);
            collections.forEach(collection => {
                collection.className = CONFIG.selectors.ebookCollection.substring(1);
                collection.classList.add(`view-${mode}`);
            });
            
            Utils.saveToLocalStorage(CONFIG.localStorageKeys.viewPreference, mode);
        }
    };

    // ================================================
    // SISTEMA DE FAVORITOS
    // ================================================
    const FavoritesSystem = {
        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            document.addEventListener('click', (e) => {
                const favoriteBtn = e.target.closest(CONFIG.selectors.favoriteBtn);
                if (favoriteBtn) {
                    e.preventDefault();
                    this.toggleFavorite(favoriteBtn);
                }
            });
        },

        toggleFavorite: function(btn) {
            const id = btn.dataset.id;
            if (!id) return;
            
            const icon = btn.querySelector('i');
            const isActive = btn.classList.contains('favorite-active');
            
            if (isActive) {
                btn.classList.remove('favorite-active');
                if (icon) {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    icon.style.color = '';
                }
                
                AppState.favorites = AppState.favorites.filter(favId => favId !== id);
                Utils.showToast('Removido dos favoritos', 'error');
            } else {
                btn.classList.add('favorite-active');
                if (icon) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    icon.style.color = '#ff4757';
                }
                
                AppState.favorites.push(id);
                Utils.showToast('Adicionado aos favoritos', 'success');
            }
            
            Utils.saveToLocalStorage(CONFIG.localStorageKeys.favorites, AppState.favorites);
            DataInitializer.updateFavoritesBadge();
            
            if (AppState.currentFilters.category === 'favoritos') {
                MainFilterSystem.renderFavoritesCollection();
            }
        }
    };

    // ================================================
    // SISTEMA DE MODAL
    // ================================================
    const ModalSystem = {
        init: function() {
            this.modal = Utils.getElement(CONFIG.selectors.modal);
            this.closeBtn = Utils.getElement(CONFIG.selectors.modalClose);
            this.downloadBtn = Utils.getElement(CONFIG.selectors.downloadFromModal);
            this.readBtn = Utils.getElement(CONFIG.selectors.readFromModal);
            this.modalTitle = Utils.getElement(CONFIG.selectors.modalTitle);
            this.pdfFilename = Utils.getElement(CONFIG.selectors.pdfFilename);
            
            this.bindEvents();
        },

        bindEvents: function() {
            document.addEventListener('click', (e) => {
                const previewBtn = e.target.closest(CONFIG.selectors.previewBtn);
                if (previewBtn) {
                    e.preventDefault();
                    this.openModal(previewBtn.dataset.id);
                }
            });
            
            this.closeBtn?.addEventListener('click', () => this.closeModal());
            
            this.modal?.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-preview-overlay') || 
                    e.target.classList.contains('modal-preview')) {
                    this.closeModal();
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
                    this.closeModal();
                }
            });
        },

        openModal: function(ebookId) {
            const ebook = AppState.ebooks.find(e => e.id === ebookId);
            if (!ebook || !this.modal) return;
            
            const title = ebook.title || 'E-book';
            const pdfLink = ebook.element.querySelector(CONFIG.selectors.downloadBtn)?.getAttribute('href');
            
            if (this.modalTitle) this.modalTitle.textContent = Utils.sanitizeText(title);
            if (this.pdfFilename) this.pdfFilename.textContent = Utils.sanitizeText(title);
            
            if (this.downloadBtn) {
                this.downloadBtn.onclick = () => {
                    if (pdfLink) window.open(pdfLink, '_blank');
                    this.closeModal();
                };
            }
            
            if (this.readBtn) {
                this.readBtn.onclick = () => {
                    if (pdfLink) window.open(pdfLink, '_blank');
                    this.closeModal();
                };
            }
            
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        closeModal: function() {
            if (this.modal) {
                this.modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    };

    // ================================================
    // SISTEMA DE COMPARTILHAMENTO
    // ================================================
    const ShareSystem = {
        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            document.addEventListener('click', (e) => {
                const shareBtn = e.target.closest(CONFIG.selectors.shareBtn);
                if (shareBtn) {
                    e.preventDefault();
                    this.shareEbook(shareBtn.dataset.id);
                }
            });
        },

        shareEbook: function(ebookId) {
            const ebook = AppState.ebooks.find(e => e.id === ebookId);
            if (!ebook) return;
            
            const title = ebook.title || 'E-book da Teca Capital';
            const url = window.location.href;
            
            if (navigator.share) {
                navigator.share({
                    title: title,
                    text: `Confira este e-book na Biblioteca Teca Capital: ${title}`,
                    url: url
                }).catch((error) => {
                    if (error.name !== 'AbortError') {
                        this.fallbackShare(title, url);
                    }
                });
            } else {
                this.fallbackShare(title, url);
            }
        },

        fallbackShare: function(title, url) {
            const text = `${title} - ${url}`;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    Utils.showToast('Link copiado para a área de transferência!', 'success');
                }).catch(() => {
                    this.execCopyFallback(text);
                });
            } else {
                this.execCopyFallback(text);
            }
        },

        execCopyFallback: function(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Utils.showToast('Link copiado para a área de transferência!', 'success');
        }
    };

    // ================================================
    // SISTEMA DE DOWNLOADS
    // ================================================
    const DownloadSystem = {
        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            document.addEventListener('click', (e) => {
                const downloadLink = e.target.closest(CONFIG.selectors.downloadBtn);
                if (downloadLink) {
                    this.trackDownload(downloadLink);
                }
            });
        },

        trackDownload: function(link) {
            const card = link.closest(CONFIG.selectors.ebookItem);
            if (!card) return;
            
            const id = card.dataset.id;
            const ebook = AppState.ebooks.find(e => e.id === id);
            
            if (ebook) {
                ebook.downloads = (ebook.downloads || 0) + 1;
                card.dataset.downloads = ebook.downloads;
                
                const downloadSpan = card.querySelector('.download-count');
                if (downloadSpan) {
                    downloadSpan.textContent = ebook.downloads;
                    
                    downloadSpan.style.transform = 'scale(1.3)';
                    downloadSpan.style.color = 'rgb(214, 174, 100)';
                    
                    setTimeout(() => {
                        downloadSpan.style.transform = 'scale(1)';
                        downloadSpan.style.color = '';
                    }, 300);
                }
                
                AppState.downloadTracking[id] = (AppState.downloadTracking[id] || 0) + 1;
            }
        }
    };

    // ================================================
    // SISTEMA DE CONTADORES
    // ================================================
    const CounterSystem = {
        init: function() {
            this.statNumbers = Utils.getAllElements(CONFIG.selectors.statNumbers);
            this.animateAll();
        },

        animateAll: function() {
            if (this.statNumbers.length === 0) return;
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            this.statNumbers.forEach(stat => observer.observe(stat));
        },

        animateCounter: function(element) {
            const target = parseInt(element.dataset.target) || 0;
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                
                if (current >= target) {
                    element.textContent = Utils.formatNumber(target);
                    clearInterval(timer);
                    
                    element.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                    }, 200);
                } else {
                    element.textContent = Utils.formatNumber(Math.floor(current));
                }
            }, 16);
        }
    };

    // ================================================
    // SISTEMA DE RECOMENDAÇÕES
    // ================================================
    const RecommendationSystem = {
        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            document.addEventListener('click', (e) => {
                const recBtn = e.target.closest('.recommendation-card .btn-outline');
                if (recBtn) {
                    e.preventDefault();
                    const ebookId = recBtn.dataset.id;
                    if (ebookId) {
                        const ebook = AppState.ebooks.find(e => e.id === ebookId);
                        if (ebook) {
                            ModalSystem.openModal(ebookId);
                        }
                    }
                }
            });
        }
    };

    // ================================================
    // SISTEMA DE RESPONSIVIDADE
    // ================================================
    const ResponsiveSystem = {
        init: function() {
            this.handleResize();
            window.addEventListener('resize', Utils.debounce(() => {
                this.handleResize();
            }, 250));
        },

        handleResize: function() {
            const width = window.innerWidth;
            
            if (width < CONFIG.extraSmallBreakpoint) {
                this.applyExtraSmallOptimizations();
            } else if (width < CONFIG.mobileBreakpoint) {
                this.applyMobileOptimizations();
            } else {
                this.applyDesktopOptimizations();
            }
        },

        applyExtraSmallOptimizations: function() {
            document.documentElement.classList.add('extra-small-screen');
            
            Utils.getAllElements('.ebook-badge').forEach(badge => {
                badge.style.position = 'static';
                badge.style.marginBottom = '15px';
                badge.style.display = 'inline-block';
            });
            
            Utils.getAllElements('.ebook-title').forEach(title => {
                title.style.paddingRight = '0';
            });
        },

        applyMobileOptimizations: function() {
            document.documentElement.classList.remove('extra-small-screen');
            document.documentElement.classList.add('mobile-screen');
        },

        applyDesktopOptimizations: function() {
            document.documentElement.classList.remove('extra-small-screen', 'mobile-screen');
            
            Utils.getAllElements('.ebook-badge').forEach(badge => {
                badge.style.position = '';
                badge.style.marginBottom = '';
                badge.style.display = '';
            });
            
            Utils.getAllElements('.ebook-title').forEach(title => {
                title.style.paddingRight = '';
            });
        }
    };

    // ================================================
    // INICIALIZAÇÃO PRINCIPAL
    // ================================================
    function init() {
        if (AppState.initialized) return;
        
        Utils.log('Inicializando Biblioteca de E-books...');
        
        if (!document.querySelector('main')) {
            Utils.log('Página sem main, encerrando inicialização.');
            return;
        }
        
        try {
            DataInitializer.init();
            AnimationManager.init();
            SearchSystem.init();
            MainFilterSystem.init();
            AdvancedFilterSystem.init();
            SortingSystem.init();
            ViewSystem.init();
            FavoritesSystem.init();
            ModalSystem.init();
            ShareSystem.init();
            DownloadSystem.init();
            CounterSystem.init();
            RecommendationSystem.init();
            ResponsiveSystem.init();
            
            AppState.initialized = true;
            Utils.log('Biblioteca de E-books inicializada com sucesso!');
            
        } catch (error) {
            console.error('Erro ao inicializar a biblioteca:', error);
            Utils.showToast('Erro ao carregar a biblioteca', 'error', 5000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();