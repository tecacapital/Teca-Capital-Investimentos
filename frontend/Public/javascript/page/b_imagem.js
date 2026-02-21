// ============================================
// BIBLIOTECA DE SLIDES - SISTEMA DE CONJUNTOS AUTO-DETECTÁVEL
// Teca Capital Investimentos - 2025
// ============================================

class SlideLibrarySystem {
    constructor() {
        this.version = '2.0.0';
        this.debug = true;
        
        // ESTADO DA APLICAÇÃO
        this.state = {
            sets: [],              // Conjuntos de slides detectados
            filteredSets: [],      // Conjuntos após filtros
            categories: new Set(),
            authors: new Set(),
            years: new Set(),
            allTags: new Set(),
            favorites: [],
            currentFilters: {
                category: 'todos',
                year: 'all',
                author: 'all',
                size: 'all',
                tags: 'all',
                searchTerm: ''
            },
            currentSort: 'relevancia',
            currentSetId: null,
            currentSlideIndex: 0,
            filterPanelOpen: false,
            initialized: false,
            observer: null
        };

        this.init();
    }

    // ========== INICIALIZAÇÃO PRINCIPAL ==========
    init() {
        this.log('Iniciando SlideLibrarySystem v' + this.version);
        
        if (!document.querySelector('main')) {
            this.log('Main não encontrado. Abortando.', 'error');
            return;
        }

        // 1. CONFIGURAR OBSERVADOR DE MUTAÇÃO (AUTO-DETECT)
        this.setupMutationObserver();
        
        // 2. ESCANEAR TODOS OS CONJUNTOS DE SLIDES EXISTENTES
        this.scanAllSlideSets();
        
        // 3. CARREGAR DADOS DO LOCALSTORAGE
        this.loadFavorites();
        
        // 4. INICIALIZAR COMPONENTES
        this.initializeAllSliders();
        this.setupSearchSystem();
        this.setupFilterSystem();
        this.setupSortingSystem();
        this.setupFavoriteSystem();
        this.setupModalSystem();
        this.setupShareSystem();
        this.setupDownloadSystem();
        this.setupStatsSystem();
        
        // 5. ATUALIZAR UI
        this.updateCategoryFilters();
        this.updateStats();
        this.renderFilteredSets();
        
        this.state.initialized = true;
        this.log(`Sistema inicializado. ${this.state.sets.length} conjuntos detectados.`);
    }

    // ========== SISTEMA DE DETECÇÃO AUTOMÁTICA ==========
    setupMutationObserver() {
        this.state.observer = new MutationObserver((mutations) => {
            let hasNewSets = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            // Verificar se o novo nó é um conjunto de slides
                            if (node.classList && node.classList.contains('slide-set')) {
                                hasNewSets = true;
                            }
                            // Verificar se contém conjuntos de slides
                            if (node.querySelectorAll) {
                                if (node.querySelectorAll('.slide-set').length > 0) {
                                    hasNewSets = true;
                                }
                            }
                        }
                    });
                }
            });
            
            if (hasNewSets) {
                this.log('Novos conjuntos detectados! Reescaneando...');
                this.scanAllSlideSets();
                this.initializeAllSliders();
                this.updateCategoryFilters();
                this.updateStats();
            }
        });

        const mainElement = document.querySelector('main');
        if (mainElement) {
            this.state.observer.observe(mainElement, {
                childList: true,
                subtree: true
            });
        }
    }

    // ========== ESCANEAR TODOS OS CONJUNTOS DE SLIDES ==========
    scanAllSlideSets() {
        this.state.sets = [];
        this.state.categories.clear();
        this.state.authors.clear();
        this.state.years.clear();
        this.state.allTags.clear();

        const slideSets = document.querySelectorAll('.slide-set');
        
        slideSets.forEach((set, index) => {
            const setData = this.extractSetData(set, index);
            this.state.sets.push(setData);
            
            // Popular conjuntos para filtros
            if (setData.category) this.state.categories.add(setData.category);
            if (setData.author) this.state.authors.add(setData.author);
            if (setData.year) this.state.years.add(setData.year);
            if (setData.tags) {
                setData.tags.forEach(tag => this.state.allTags.add(tag));
            }
        });

        this.state.filteredSets = [...this.state.sets];
        this.log(`${this.state.sets.length} conjuntos escaneados.`);
    }

    // ========== EXTRAIR DADOS DO CONJUNTO ==========
    extractSetData(set, index) {
        // Extrair imagens do slider
        const sliderTrack = set.querySelector('.slider-track');
        const slides = sliderTrack ? sliderTrack.querySelectorAll('.slider-slide') : [];
        const images = Array.from(slides).map(slide => {
            const img = slide.querySelector('img');
            return {
                src: img ? img.src : '',
                alt: img ? img.alt : ''
            };
        });

        return {
            element: set,
            id: set.dataset.setId || `set-auto-${index}`,
            index: index,
            category: set.dataset.category || 'nao-categorizado',
            title: set.dataset.title || set.querySelector('.slide-title')?.textContent || 'Sem título',
            subtitle: set.dataset.subtitle || set.querySelector('.slide-subtitle')?.textContent || '',
            author: set.dataset.author || 'Alberto Teca Tomás',
            year: parseInt(set.dataset.year) || 2025,
            tags: set.dataset.tags ? set.dataset.tags.split(',') : [],
            totalImages: parseInt(set.dataset.totalImages) || images.length,
            images: images,
            views: parseInt(set.dataset.views) || Math.floor(Math.random() * 1000) + 100,
            favorite: false,
            sliderContainer: set.querySelector('.slider-container'),
            sliderTrack: sliderTrack,
            prevBtn: set.querySelector('.slider-prev'),
            nextBtn: set.querySelector('.slider-next'),
            indicatorsContainer: set.querySelector('.slider-indicators'),
            currentIndex: 0
        };
    }

    // ========== INICIALIZAR TODOS OS SLIDERS ==========
    initializeAllSliders() {
        this.state.sets.forEach(set => {
            this.initializeSlider(set);
        });
    }

    // ========== INICIALIZAR SLIDER INDIVIDUAL ==========
    initializeSlider(set) {
        if (!set.sliderTrack) return;
        
        const totalSlides = set.totalImages;
        set.currentIndex = 0;
        
        // Atualizar track position
        this.updateSliderPosition(set);
        
        // Gerar indicadores (dots)
        this.generateIndicators(set);
        
        // Configurar eventos dos botões
        if (set.prevBtn) {
            set.prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.prevSlide(set);
            });
        }
        
        if (set.nextBtn) {
            set.nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextSlide(set);
            });
        }
        
        // Ocultar controles se for conjunto single-image
        if (totalSlides <= 1) {
            if (set.prevBtn) set.prevBtn.style.display = 'none';
            if (set.nextBtn) set.nextBtn.style.display = 'none';
            if (set.indicatorsContainer) set.indicatorsContainer.style.display = 'none';
        }
    }

    // ========== CONTROLES DE SLIDE ==========
    nextSlide(set) {
        if (set.currentIndex < set.totalImages - 1) {
            set.currentIndex++;
            this.updateSliderPosition(set);
            this.updateActiveIndicator(set);
        }
    }

    prevSlide(set) {
        if (set.currentIndex > 0) {
            set.currentIndex--;
            this.updateSliderPosition(set);
            this.updateActiveIndicator(set);
        }
    }

    goToSlide(set, index) {
        if (index >= 0 && index < set.totalImages) {
            set.currentIndex = index;
            this.updateSliderPosition(set);
            this.updateActiveIndicator(set);
        }
    }

    updateSliderPosition(set) {
        if (set.sliderTrack) {
            set.sliderTrack.style.transform = `translateX(-${set.currentIndex * 100}%)`;
        }
    }

    generateIndicators(set) {
        if (!set.indicatorsContainer) return;
        
        let html = '';
        for (let i = 0; i < set.totalImages; i++) {
            html += `<span class="slider-dot ${i === 0 ? 'active' : ''}" data-slide-index="${i}"></span>`;
        }
        set.indicatorsContainer.innerHTML = html;
        
        // Adicionar eventos aos dots
        set.indicatorsContainer.querySelectorAll('.slider-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.goToSlide(set, index);
            });
        });
    }

    updateActiveIndicator(set) {
        if (!set.indicatorsContainer) return;
        
        const dots = set.indicatorsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, index) => {
            if (index === set.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // ========== SISTEMA DE BUSCA ==========
    setupSearchSystem() {
        const searchInput = document.getElementById('slide-search-input');
        const searchBtn = document.getElementById('slide-search-btn');
        
        if (!searchInput) return;
        
        searchBtn?.addEventListener('click', () => this.performSearch());
        
        searchInput.addEventListener('input', this.debounce((e) => {
            this.state.currentFilters.searchTerm = e.target.value.toLowerCase();
            this.filterSets();
        }, 300));
    }

    performSearch() {
        const input = document.getElementById('slide-search-input');
        this.state.currentFilters.searchTerm = input.value.toLowerCase();
        this.filterSets();
        
        const btn = document.getElementById('slide-search-btn');
        if (btn) {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => btn.style.transform = 'scale(1)', 200);
        }
    }

    // ========== SISTEMA DE FILTROS ==========
    setupFilterSystem() {
        this.setupAdvancedFilters();
        this.setupFilterToggle();
        
        document.getElementById('apply-filters-btn')?.addEventListener('click', () => this.applyAdvancedFilters());
        document.getElementById('clear-filters-btn')?.addEventListener('click', () => this.clearAdvancedFilters());
    }

    updateCategoryFilters() {
        const container = document.getElementById('dynamic-category-filters');
        if (!container) return;
        
        let html = '<button class="filter-btn active" data-filter="todos">Todos os conjuntos</button>';
        
        this.state.categories.forEach(category => {
            const categoryName = this.getCategoryDisplayName(category);
            html += `<button class="filter-btn" data-filter="${category}">${categoryName}</button>`;
        });
        
        html += '<button class="filter-btn" data-filter="favoritos">Meus favoritos</button>';
        
        container.innerHTML = html;
        
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.currentFilters.category = btn.dataset.filter;
                this.filterSets();
            });
        });
    }

    setupAdvancedFilters() {
        this.populateYearFilter();
        this.populateAuthorFilter();
        this.populateSizeFilter();
        this.populateTagsFilter();
    }

    populateYearFilter() {
        const container = document.getElementById('filter-year-group');
        if (!container) return;
        
        let html = '<span class="filter-chip active" data-value="all">Todos</span>';
        
        Array.from(this.state.years)
            .sort((a, b) => b - a)
            .forEach(year => {
                html += `<span class="filter-chip" data-value="${year}">${year}</span>`;
            });
        
        container.innerHTML = html;
        
        container.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    populateAuthorFilter() {
        const container = document.getElementById('filter-author-group');
        if (!container) return;
        
        let html = '<span class="filter-chip active" data-value="all">Todos</span>';
        
        this.state.authors.forEach(author => {
            html += `<span class="filter-chip" data-value="${author}">${author}</span>`;
        });
        
        container.innerHTML = html;
        
        container.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    populateSizeFilter() {
        const container = document.getElementById('filter-size-group');
        if (!container) return;
        
        container.innerHTML = `
            <span class="filter-chip active" data-value="all">Todos</span>
            <span class="filter-chip" data-value="single">Apenas 1 imagem</span>
            <span class="filter-chip" data-value="multi">Múltiplas imagens</span>
            <span class="filter-chip" data-value="small">2-5 imagens</span>
            <span class="filter-chip" data-value="medium">6-10 imagens</span>
            <span class="filter-chip" data-value="large">11+ imagens</span>
        `;
        
        container.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    populateTagsFilter() {
        const container = document.getElementById('filter-tags-group');
        if (!container) return;
        
        let html = '<span class="filter-chip active" data-value="all">Todas as tags</span>';
        
        Array.from(this.state.allTags)
            .sort()
            .slice(0, 20)
            .forEach(tag => {
                html += `<span class="filter-chip" data-value="${tag}">${tag}</span>`;
            });
        
        container.innerHTML = html;
        
        container.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    setupFilterToggle() {
        const toggle = document.getElementById('filters-toggle');
        const panel = document.getElementById('filters-panel');
        const icon = toggle?.querySelector('.toggle-icon');
        
        if (!toggle || !panel) return;
        
        panel.style.display = 'none';
        
        toggle.addEventListener('click', () => {
            const isOpen = panel.style.display === 'block';
            
            if (isOpen) {
                panel.style.display = 'none';
                icon.style.transform = 'rotate(0deg)';
                toggle.classList.remove('active');
            } else {
                panel.style.display = 'block';
                icon.style.transform = 'rotate(180deg)';
                toggle.classList.add('active');
            }
        });
    }

    applyAdvancedFilters() {
        this.collectAdvancedFilterValues();
        this.filterSets();
        
        const btn = document.getElementById('apply-filters-btn');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = 'scale(1)', 200);
        
        this.showToast('Filtros aplicados aos conjuntos', 'success');
    }

    collectAdvancedFilterValues() {
        // Ano
        const yearChip = document.querySelector('#filter-year-group .filter-chip.active');
        this.state.currentFilters.year = yearChip?.dataset.value || 'all';
        
        // Autor
        const authorChip = document.querySelector('#filter-author-group .filter-chip.active');
        this.state.currentFilters.author = authorChip?.dataset.value || 'all';
        
        // Tamanho
        const sizeChip = document.querySelector('#filter-size-group .filter-chip.active');
        this.state.currentFilters.size = sizeChip?.dataset.value || 'all';
        
        // Tags
        const tagChip = document.querySelector('#filter-tags-group .filter-chip.active');
        this.state.currentFilters.tags = tagChip?.dataset.value || 'all';
    }

    clearAdvancedFilters() {
        document.querySelectorAll('.filter-options-group').forEach(group => {
            const allChip = Array.from(group.querySelectorAll('.filter-chip')).find(
                chip => chip.dataset.value === 'all'
            );
            
            if (allChip) {
                group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                allChip.classList.add('active');
            }
        });
        
        this.state.currentFilters = {
            ...this.state.currentFilters,
            year: 'all',
            author: 'all',
            size: 'all',
            tags: 'all'
        };
        
        this.filterSets();
        this.showToast('Filtros limpos', 'info');
    }

    // ========== SISTEMA DE FILTRAGEM CENTRAL ==========
    filterSets() {
        this.state.filteredSets = this.state.sets.filter(set => {
            let visible = true;
            
            // Filtro de busca
            if (visible && this.state.currentFilters.searchTerm) {
                const term = this.state.currentFilters.searchTerm.toLowerCase();
                const title = set.title.toLowerCase();
                const subtitle = set.subtitle.toLowerCase();
                const author = set.author.toLowerCase();
                const tags = set.tags.join(' ').toLowerCase();
                
                visible = title.includes(term) || 
                         subtitle.includes(term) || 
                         author.includes(term) || 
                         tags.includes(term);
            }
            
            // Filtro de categoria
            if (visible && this.state.currentFilters.category !== 'todos') {
                if (this.state.currentFilters.category === 'favoritos') {
                    visible = this.state.favorites.includes(set.id);
                } else {
                    visible = set.category === this.state.currentFilters.category;
                }
            }
            
            // Filtro de ano
            if (visible && this.state.currentFilters.year !== 'all') {
                visible = set.year === parseInt(this.state.currentFilters.year);
            }
            
            // Filtro de autor
            if (visible && this.state.currentFilters.author !== 'all') {
                visible = set.author === this.state.currentFilters.author;
            }
            
            // Filtro de tamanho
            if (visible && this.state.currentFilters.size !== 'all') {
                switch(this.state.currentFilters.size) {
                    case 'single':
                        visible = set.totalImages === 1;
                        break;
                    case 'multi':
                        visible = set.totalImages > 1;
                        break;
                    case 'small':
                        visible = set.totalImages >= 2 && set.totalImages <= 5;
                        break;
                    case 'medium':
                        visible = set.totalImages >= 6 && set.totalImages <= 10;
                        break;
                    case 'large':
                        visible = set.totalImages >= 11;
                        break;
                }
            }
            
            // Filtro de tags
            if (visible && this.state.currentFilters.tags !== 'all') {
                visible = set.tags.includes(this.state.currentFilters.tags);
            }
            
            return visible;
        });
        
        this.sortSets();
        this.renderFilteredSets();
    }

    // ========== SISTEMA DE ORDENAÇÃO ==========
    setupSortingSystem() {
        const sortSelect = document.getElementById('sort-select');
        
        sortSelect?.addEventListener('change', () => {
            this.state.currentSort = sortSelect.value;
            this.sortSets();
            this.renderFilteredSets();
        });
    }

    sortSets() {
        switch(this.state.currentSort) {
            case 'titulo-asc':
                this.state.filteredSets.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'ano-desc':
                this.state.filteredSets.sort((a, b) => b.year - a.year);
                break;
            case 'ano-asc':
                this.state.filteredSets.sort((a, b) => a.year - b.year);
                break;
            case 'views-desc':
                this.state.filteredSets.sort((a, b) => b.views - a.views);
                break;
            case 'tamanho-desc':
                this.state.filteredSets.sort((a, b) => b.totalImages - a.totalImages);
                break;
            case 'tamanho-asc':
                this.state.filteredSets.sort((a, b) => a.totalImages - b.totalImages);
                break;
            default:
                // Relevância - manter ordem original
                break;
        }
    }

    renderFilteredSets() {
        // Esconder todos os conjuntos
        this.state.sets.forEach(set => {
            set.element.style.display = 'none';
        });
        
        // Mostrar apenas os filtrados
        this.state.filteredSets.forEach(set => {
            set.element.style.display = 'block';
        });
        
        this.updateNoResultsMessage();
    }

    // ========== SISTEMA DE FAVORITOS ==========
    setupFavoriteSystem() {
        document.addEventListener('click', (e) => {
            const favBtn = e.target.closest('.btn-favorite');
            if (favBtn) {
                e.preventDefault();
                this.toggleFavorite(favBtn);
            }
        });
    }

    toggleFavorite(btn) {
        const setId = btn.dataset.setId;
        const icon = btn.querySelector('i');
        
        if (this.state.favorites.includes(setId)) {
            // Remover
            this.state.favorites = this.state.favorites.filter(id => id !== setId);
            btn.classList.remove('favorite-active');
            icon.classList.remove('fas');
            icon.classList.add('far');
            icon.style.color = '';
            this.showToast('Removido dos favoritos', 'error');
        } else {
            // Adicionar
            this.state.favorites.push(setId);
            btn.classList.add('favorite-active');
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = '#ff4757';
            this.showToast('Adicionado aos favoritos', 'success');
            
            btn.style.transform = 'scale(1.3)';
            setTimeout(() => btn.style.transform = 'scale(1)', 200);
        }
        
        localStorage.setItem('teca_slide_favorites', JSON.stringify(this.state.favorites));
    }

    loadFavorites() {
        const saved = localStorage.getItem('teca_slide_favorites');
        this.state.favorites = saved ? JSON.parse(saved) : [];
        
        this.state.favorites.forEach(id => {
            const btn = document.querySelector(`.btn-favorite[data-set-id="${id}"]`);
            if (btn) {
                btn.classList.add('favorite-active');
                btn.querySelector('i').classList.remove('far');
                btn.querySelector('i').classList.add('fas');
                btn.querySelector('i').style.color = '#ff4757';
            }
        });
    }

    // ========== SISTEMA DE MODAL ==========
    setupModalSystem() {
        this.modal = document.getElementById('modal-set-viewer');
        this.modalTitle = document.getElementById('modal-set-title');
        this.modalTrack = document.getElementById('modal-slider-track');
        this.modalCounter = document.getElementById('modal-counter');
        this.modalInfo = document.getElementById('modal-info');
        
        document.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.btn-view-set');
            if (viewBtn) {
                e.preventDefault();
                this.openModal(viewBtn.dataset.setId);
            }
        });
        
        document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modal-prev')?.addEventListener('click', () => this.modalPrev());
        document.getElementById('modal-next')?.addEventListener('click', () => this.modalNext());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    openModal(setId) {
        const set = this.state.sets.find(s => s.id === setId);
        if (!set) return;
        
        this.state.currentSetId = setId;
        this.state.currentSlideIndex = 0;
        
        // Atualizar título
        this.modalTitle.textContent = set.title;
        
        // Construir slides do modal
        let slidesHtml = '';
        set.images.forEach((image, index) => {
            slidesHtml += `
                <div class="slider-slide ${index === 0 ? 'active' : ''}">
                    <img src="${image.src}" alt="${image.alt}" class="slider-image">
                </div>
            `;
        });
        this.modalTrack.innerHTML = slidesHtml;
        this.modalTrack.style.transform = 'translateX(0)';
        
        // Informações do conjunto
        this.modalInfo.innerHTML = `
            <div class="modal-set-details">
                <span class="detail-item"><i class="fas fa-user"></i> ${set.author}</span>
                <span class="detail-item"><i class="fas fa-calendar"></i> ${set.year}</span>
                <span class="detail-item"><i class="fas fa-tag"></i> ${this.getCategoryDisplayName(set.category)}</span>
                <span class="detail-item"><i class="fas fa-layer-group"></i> ${set.totalImages} imagens</span>
            </div>
            <p class="modal-set-tags">${set.tags.map(tag => `#${tag}`).join(' ')}</p>
        `;
        
        this.updateModalCounter(set.totalImages, 0);
        
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Incrementar visualizações
        this.incrementViews(setId);
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalNext() {
        const set = this.state.sets.find(s => s.id === this.state.currentSetId);
        if (!set) return;
        
        if (this.state.currentSlideIndex < set.totalImages - 1) {
            this.state.currentSlideIndex++;
            this.modalTrack.style.transform = `translateX(-${this.state.currentSlideIndex * 100}%)`;
            this.updateModalCounter(set.totalImages, this.state.currentSlideIndex);
        }
    }

    modalPrev() {
        const set = this.state.sets.find(s => s.id === this.state.currentSetId);
        if (!set) return;
        
        if (this.state.currentSlideIndex > 0) {
            this.state.currentSlideIndex--;
            this.modalTrack.style.transform = `translateX(-${this.state.currentSlideIndex * 100}%)`;
            this.updateModalCounter(set.totalImages, this.state.currentSlideIndex);
        }
    }

    updateModalCounter(total, current) {
        this.modalCounter.textContent = `${current + 1} / ${total}`;
    }

    incrementViews(setId) {
        const set = this.state.sets.find(s => s.id === setId);
        if (set) {
            set.views++;
            const viewElement = set.element.querySelector('.view-count');
            if (viewElement) {
                viewElement.textContent = set.views.toLocaleString();
            }
        }
    }

    // ========== SISTEMA DE ESTATÍSTICAS ==========
    setupStatsSystem() {
        this.animateStats();
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateStats();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        const statsSection = document.querySelector('.section-stats');
        if (statsSection) observer.observe(statsSection);
    }

    updateStats() {
        const statsGrid = document.getElementById('stats-grid');
        if (!statsGrid) return;
        
        const totalSets = this.state.sets.length;
        const totalImages = this.state.sets.reduce((sum, set) => sum + set.totalImages, 0);
        const totalViews = this.state.sets.reduce((sum, set) => sum + set.views, 0);
        const multiImageSets = this.state.sets.filter(s => s.totalImages > 1).length;
        const singleImageSets = this.state.sets.filter(s => s.totalImages === 1).length;
        
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
                <div class="stat-content">
                    <div class="stat-number" data-target="${totalSets}">0</div>
                    <div class="stat-label">Conjuntos</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-image"></i></div>
                <div class="stat-content">
                    <div class="stat-number" data-target="${totalImages}">0</div>
                    <div class="stat-label">Infográficos</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-eye"></i></div>
                <div class="stat-content">
                    <div class="stat-number" data-target="${totalViews}">0</div>
                    <div class="stat-label">Visualizações</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-chart-pie"></i></div>
                <div class="stat-content">
                    <div class="stat-number" data-target="${multiImageSets}">0</div>
                    <div class="stat-label">Conjuntos Multi-imagem</div>
                </div>
            </div>
        `;
    }

    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number[data-target]');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.dataset.target);
            if (isNaN(target)) return;
            
            let current = 0;
            const duration = 2000;
            const step = target / (duration / 16);
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    stat.textContent = target.toLocaleString();
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(current).toLocaleString();
                }
            }, 16);
        });
    }

    // ========== SISTEMA DE COMPARTILHAMENTO ==========
    setupShareSystem() {
        document.addEventListener('click', (e) => {
            const shareBtn = e.target.closest('.btn-share');
            if (shareBtn) {
                e.preventDefault();
                this.shareSet(shareBtn.dataset.setId);
            }
        });
    }

    shareSet(setId) {
        const set = this.state.sets.find(s => s.id === setId);
        if (!set) return;
        
        const title = set.title;
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: title,
                text: `Confira o conjunto "${title}" na Biblioteca Teca Capital`,
                url: url
            }).catch(() => this.fallbackShare(title, url));
        } else {
            this.fallbackShare(title, url);
        }
    }

    // ========== SISTEMA DE DOWNLOAD ==========
    setupDownloadSystem() {
        document.addEventListener('click', (e) => {
            const downloadBtn = e.target.closest('.btn-download-set');
            if (downloadBtn) {
                e.preventDefault();
                this.downloadSet(downloadBtn.dataset.setId);
            }
        });
    }

    downloadSet(setId) {
        const set = this.state.sets.find(s => s.id === setId);
        if (!set) return;
        
        this.showToast(`Download do conjunto "${set.title}" iniciado`, 'success');
        // Implementação real: download em ZIP ou redirecionamento
    }

    // ========== UTILITÁRIOS ==========
    getCategoryDisplayName(category) {
        const names = {
            'financas': 'Finanças',
            'gestao': 'Gestão',
            'economia': 'Economia'
        };
        return names[category] || category;
    }

    updateNoResultsMessage() {
        let messageEl = document.querySelector('.no-results-message');
        
        if (this.state.filteredSets.length === 0 && !messageEl) {
            const container = document.querySelector('.sets-grid')?.parentNode;
            messageEl = document.createElement('div');
            messageEl.className = 'no-results-message';
            messageEl.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-layer-group" style="font-size: 4rem; color: var(--primary-gold); opacity: 0.5;"></i>
                    <h3 style="color: white; margin: 20px 0 10px;">Nenhum conjunto encontrado</h3>
                    <p style="color: #CCCCCC; margin-bottom: 25px;">Tente buscar por outros termos ou limpe os filtros.</p>
                    <button class="btn btn-primary" id="clear-all-filters">
                        <i class="fas fa-undo-alt"></i> Limpar filtros
                    </button>
                </div>
            `;
            container?.appendChild(messageEl);
            
            document.getElementById('clear-all-filters')?.addEventListener('click', () => {
                this.clearAdvancedFilters();
                document.querySelector('.filter-btn[data-filter="todos"]')?.click();
            });
        } else if (this.state.filteredSets.length > 0 && messageEl) {
            messageEl.remove();
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? 'rgba(214,174,100,0.95)' : 'rgba(204,51,51,0.95)'};
            color: ${type === 'success' ? 'black' : 'white'};
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: 600;
            z-index: 10002;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    log(message, type = 'info') {
        if (this.debug) {
            console.log(`[SlideLibrary] ${message}`);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    window.slideLibrary = new SlideLibrarySystem();
});

