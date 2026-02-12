/**
 * ===========================================
 * BIBLIOTECA FUTURISTA - CONTROLLER
 * TECA CAPITAL - VÍDEO LIBRARY
 * Design Futurista com Animações 3D
 * ===========================================
 */

class VideoBibliotecaFuturista {
    constructor() {
        // Estado da aplicação
        this.videos = [];
        this.currentVideo = null;
        this.favorites = JSON.parse(localStorage.getItem('teca-favorites-futurista')) || [];
        this.comments = this.loadComments();
        this.currentCategory = 'todos';
        this.searchTerm = '';
        
        // Inicialização
        this.init();
    }

    /**
     * INICIALIZAÇÃO COMPLETA DO SISTEMA
     */
    init() {
        console.log('🚀 Inicializando Biblioteca Futurista...');
        
        this.loadVideoDatabase();
        this.setupVideoDetection();
        this.setupSearchAndFilters();
        this.setupPlayer();
        this.setupFavorites();
        this.setupComments();
        this.setupStatsAnimation();
        this.setupRecommendedVideos();
        this.setupResponsiveBehaviors();
        this.setupVideoPreviews();
        this.setupKeyboardControls();
        this.setupParticlesEffect();
        
        console.log('✅ Biblioteca Futurista inicializada com sucesso!');
    }

    /**
     * 1. DETECTAR TODOS OS VÍDEOS DO HTML
     */
    setupVideoDetection() {
        const videoElements = document.querySelectorAll('video[src]');
        
        videoElements.forEach((video, index) => {
            const src = video.getAttribute('src');
            if (src && src !== '#' && src !== '') {
                
                // Configurar vídeo para não cortar
                video.style.objectFit = 'contain';
                video.setAttribute('preload', 'metadata');
                video.setAttribute('playsinline', '');
                
                // Adicionar eventos de preview
                video.addEventListener('mouseenter', () => {
                    if (window.innerWidth > 768) {
                        video.play().catch(e => console.log('Preview não disponível'));
                    }
                });
                
                video.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0;
                });
                
                // Extrair informações do card pai
                const card = video.closest('.video-card');
                if (card) {
                    const id = card.dataset.id;
                    const title = card.querySelector('.video-title-card')?.textContent || 'Vídeo sem título';
                    const duration = card.querySelector('.video-duration')?.textContent || '00:00';
                    const description = card.querySelector('.video-description')?.textContent || '';
                    const category = card.dataset.category || 'geral';
                    
                    this.videos.push({
                        id,
                        src,
                        title,
                        duration,
                        description,
                        category,
                        card,
                        videoElement: video,
                        views: this.getRandomViews(index)
                    });
                }
            }
        });
        
        console.log(`🎬 ${this.videos.length} vídeos detectados`);
    }

    /**
     * 2. PLAYER MODAL UNIFICADO COM VÍDEOS REAIS
     */
    setupPlayer() {
        const watchButtons = document.querySelectorAll('.watch-btn');
        const modal = document.getElementById('video-player-modal');
        const closeBtn = document.getElementById('close-player-btn');
        
        watchButtons.forEach(btn => {
            // Remover listeners antigos
            btn.removeEventListener('click', this.boundPlayHandler);
            
            // Criar novo handler bound
            this.boundPlayHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const videoId = btn.dataset.id;
                this.playVideo(videoId);
            };
            
            btn.addEventListener('click', this.boundPlayHandler);
        });
        
        // Fechar modal
        if (closeBtn) {
            closeBtn.removeEventListener('click', this.boundCloseHandler);
            this.boundCloseHandler = () => this.closePlayer();
            closeBtn.addEventListener('click', this.boundCloseHandler);
        }
        
        // Fechar ao clicar no backdrop
        if (modal) {
            const backdrop = modal.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.removeEventListener('click', this.boundCloseHandler);
                backdrop.addEventListener('click', this.boundCloseHandler);
            }
        }
        
        // Fechar com ESC
        document.removeEventListener('keydown', this.boundEscapeHandler);
        this.boundEscapeHandler = (e) => {
            if (e.key === 'Escape' && modal?.classList.contains('active')) {
                this.closePlayer();
            }
        };
        document.addEventListener('keydown', this.boundEscapeHandler);
    }

    /**
     * PLAY VIDEO - Função principal de reprodução
     */
    playVideo(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (!video) {
            console.error('Vídeo não encontrado:', videoId);
            return;
        }
        
        this.currentVideo = video;
        
        const modal = document.getElementById('video-player-modal');
        const playerPlaceholder = document.getElementById('player-placeholder');
        const titleElement = document.getElementById('current-video-title');
        
        if (!modal || !playerPlaceholder) return;
        
        // Limpar placeholder
        playerPlaceholder.innerHTML = '';
        
        // Criar elemento de vídeo
        const videoElement = document.createElement('video');
        videoElement.src = video.src;
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'contain';
        videoElement.setAttribute('playsinline', '');
        
        // Adicionar ao placeholder
        playerPlaceholder.appendChild(videoElement);
        
        // Atualizar título
        if (titleElement) {
            titleElement.textContent = video.title;
        }
        
        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Atualizar recomendações baseado no vídeo atual
        this.renderRecommendedVideos(video.id);
        
        console.log(`▶️ Reproduzindo: ${video.title}`);
    }

    /**
     * CLOSE PLAYER - Fechar modal
     */
    closePlayer() {
        const modal = document.getElementById('video-player-modal');
        const playerPlaceholder = document.getElementById('player-placeholder');
        
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        // Parar vídeo
        if (playerPlaceholder) {
            const video = playerPlaceholder.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
                video.remove();
            }
            
            // Restaurar estado inicial
            playerPlaceholder.innerHTML = `
                <div class="player-initial-state">
                    <i class="fas fa-play-circle"></i>
                    <span>Selecione um vídeo para assistir</span>
                </div>
            `;
        }
    }

    /**
     * 3. SISTEMA DE BUSCA E FILTROS
     */
    setupSearchAndFilters() {
        const searchInput = document.getElementById('video-search-input');
        const filterBtns = document.querySelectorAll('.video-filter-btn');
        
        // Busca com debounce
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value;
                this.filterVideos(this.searchTerm, this.currentCategory);
            }, 300));
        }
        
        // Filtros
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                
                // Atualizar estado ativo
                filterBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                this.currentCategory = category;
                this.filterVideos(this.searchTerm, category);
            });
        });
    }

    /**
     * FILTER VIDEOS - Filtragem em tempo real
     */
    filterVideos(searchTerm = '', category = 'todos') {
        const cards = document.querySelectorAll('.video-card');
        let visibleCount = 0;
        
        cards.forEach(card => {
            const title = card.querySelector('.video-title-card')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.video-description')?.textContent.toLowerCase() || '';
            const cardCategory = card.dataset.category;
            const cardId = card.dataset.id;
            
            const matchesSearch = searchTerm === '' || 
                title.includes(searchTerm.toLowerCase()) || 
                description.includes(searchTerm.toLowerCase());
            
            let matchesCategory = false;
            
            if (category === 'todos') {
                matchesCategory = true;
            } else if (category === 'favoritos') {
                matchesCategory = this.favorites.includes(cardId);
            } else {
                matchesCategory = category === cardCategory;
            }
            
            if (matchesSearch && matchesCategory) {
                card.style.display = 'flex';
                visibleCount++;
                
                // Adicionar animação de fade in
                card.style.animation = 'fadeIn 0.5s ease';
            } else {
                card.style.display = 'none';
            }
        });
        
        this.showEmptyState(visibleCount === 0);
        
        // Atualizar contadores visuais
        this.updateCategoryCounters();
    }

    /**
     * 4. SISTEMA DE FAVORITOS COM LOCALSTORAGE
     */
    setupFavorites() {
        const favoriteBtns = document.querySelectorAll('.favorite-btn');
        
        favoriteBtns.forEach(btn => {
            const videoId = btn.dataset.id;
            
            // Estado inicial
            this.updateFavoriteButton(btn, videoId);
            
            // Event listener
            btn.removeEventListener('click', this.boundFavoriteHandler);
            this.boundFavoriteHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFavorite(videoId, btn);
            };
            btn.addEventListener('click', this.boundFavoriteHandler);
        });
    }

    /**
     * TOGGLE FAVORITE - Adicionar/remover favoritos
     */
    toggleFavorite(videoId, btn) {
        const icon = btn.querySelector('i');
        
        if (this.favorites.includes(videoId)) {
            // Remover dos favoritos
            this.favorites = this.favorites.filter(id => id !== videoId);
            icon.classList.remove('fas');
            icon.classList.add('far');
            btn.classList.remove('active');
            
            // Feedback visual
            this.showToast('❌ Removido dos favoritos');
        } else {
            // Adicionar aos favoritos
            this.favorites.push(videoId);
            icon.classList.remove('far');
            icon.classList.add('fas');
            btn.classList.add('active');
            
            // Feedback visual
            this.showToast('⭐ Adicionado aos favoritos');
        }
        
        // Salvar no localStorage
        localStorage.setItem('teca-favorites-futurista', JSON.stringify(this.favorites));
        
        // Atualizar contador de favoritos
        this.updateFavoritesCounter();
    }

    /**
     * UPDATE FAVORITE BUTTON - Atualizar estado do botão
     */
    updateFavoriteButton(btn, videoId) {
        const icon = btn.querySelector('i');
        if (this.favorites.includes(videoId)) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            btn.classList.add('active');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            btn.classList.remove('active');
        }
    }

    /**
     * 5. ANIMAÇÃO DE ESTATÍSTICAS COM INTERSECTION OBSERVER
     */
    setupStatsAnimation() {
        const statNumbers = document.querySelectorAll('.video-stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    this.animateNumber(target);
                    observer.unobserve(target);
                }
            });
        }, { 
            threshold: 0.3,
            rootMargin: '0px'
        });
        
        statNumbers.forEach(stat => observer.observe(stat));
    }

    /**
     * ANIMATE NUMBER - Contador progressivo
     */
    animateNumber(element) {
        const target = parseInt(element.dataset.target) || 0;
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    /**
     * 6. SISTEMA DE COMENTÁRIOS DINÂMICO
     */
    setupComments() {
        const submitBtn = document.getElementById('submit-comment');
        const commentInput = document.getElementById('comment-input');
        
        if (submitBtn) {
            submitBtn.removeEventListener('click', this.boundCommentHandler);
            this.boundCommentHandler = () => {
                const text = commentInput?.value.trim();
                if (text) {
                    this.addComment(text);
                    commentInput.value = '';
                } else {
                    this.showToast('💬 Digite um comentário', 'warning');
                }
            };
            submitBtn.addEventListener('click', this.boundCommentHandler);
        }
        
        // Permitir enviar com Ctrl+Enter
        if (commentInput) {
            commentInput.removeEventListener('keydown', this.boundCommentKeyHandler);
            this.boundCommentKeyHandler = (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    submitBtn?.click();
                }
            };
            commentInput.addEventListener('keydown', this.boundCommentKeyHandler);
            
            // Auto-resize textarea
            commentInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
    }

    /**
     * ADD COMMENT - Adicionar novo comentário
     */
    addComment(text) {
        const commentsList = document.getElementById('comments-list');
        const currentVideoId = this.currentVideo?.id || 'geral';
        
        if (!this.comments[currentVideoId]) {
            this.comments[currentVideoId] = [];
        }
        
        const newComment = {
            id: Date.now(),
            author: 'Visitante Teca',
            avatar: 'fa-user-astronaut',
            date: 'Agora mesmo',
            text: text,
            likes: 0,
            liked: false
        };
        
        this.comments[currentVideoId].unshift(newComment);
        this.renderComments(currentVideoId);
        this.saveComments();
        
        // Atualizar contador
        const commentCount = document.querySelector('.comment-count');
        if (commentCount) {
            const total = this.comments[currentVideoId]?.length || 0;
            commentCount.textContent = `${total} comentários`;
        }
        
        this.showToast('✅ Comentário publicado!');
    }

    /**
     * RENDER COMMENTS - Renderizar comentários
     */
    renderComments(videoId) {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        
        const videoComments = this.comments[videoId] || [];
        
        if (videoComments.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-comments">
                    <i class="fas fa-comment-dots"></i>
                    <p>Seja o primeiro a comentar</p>
                </div>
            `;
            return;
        }
        
        commentsList.innerHTML = videoComments.map(comment => `
            <div class="comment-item animated-3d-border" data-comment-id="${comment.id}">
                <div class="comment-avatar">
                    <i class="fas ${comment.avatar || 'fa-user-circle'}"></i>
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-date">${comment.date}</span>
                    </div>
                    <p class="comment-text">${this.escapeHTML(comment.text)}</p>
                    <div class="comment-actions">
                        <button class="comment-like ${comment.liked ? 'liked' : ''}" data-comment-id="${comment.id}">
                            <i class="${comment.liked ? 'fas' : 'far'} fa-heart"></i>
                            ${comment.likes || 0}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Adicionar eventos de like
        this.setupCommentLikes(videoId);
    }

    /**
     * 7. VÍDEOS RECOMENDADOS DINÂMICOS
     */
    setupRecommendedVideos() {
        this.renderRecommendedVideos();
    }

    /**
     * RENDER RECOMMENDED VIDEOS - Recomendações inteligentes
     */
    renderRecommendedVideos(excludeVideoId = null) {
        const container = document.getElementById('recommended-container');
        if (!container) return;
        
        // Pegar vídeos aleatórios
        let recommended = [...this.videos];
        
        if (excludeVideoId) {
            recommended = recommended.filter(v => v.id !== excludeVideoId);
        }
        
        // Embaralhar e pegar 3
        recommended = this.shuffleArray(recommended).slice(0, 3);
        
        if (recommended.length === 0) {
            container.innerHTML = `
                <div class="no-recommendations">
                    <i class="fas fa-video"></i>
                    <p>Mais vídeos em breve</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recommended.map(video => `
            <div class="recommended-card" data-id="${video.id}">
                <div class="recommended-thumbnail">
                    <i class="fas fa-play-circle"></i>
                </div>
                <div class="recommended-info">
                    <h4>${video.title}</h4>
                    <span>${video.duration}</span>
                </div>
            </div>
        `).join('');
        
        // Adicionar eventos aos cards recomendados
        container.querySelectorAll('.recommended-card').forEach(card => {
            card.addEventListener('click', () => {
                const videoId = card.dataset.id;
                this.playVideo(videoId);
            });
        });
    }

    /**
     * 8. PREVIEWS DE VÍDEO
     */
    setupVideoPreviews() {
        // Já configurado no setupVideoDetection
    }

    /**
     * 9. RESPONSIVIDADE AVANÇADA
     */
    setupResponsiveBehaviors() {
        const handleResize = () => {
            const width = window.innerWidth;
            
            if (width < 350) {
                document.body.classList.add('extra-small-screen');
                this.optimizeForSmallScreen();
            } else {
                document.body.classList.remove('extra-small-screen');
                this.restoreAnimations();
            }
        };
        
        window.addEventListener('resize', this.debounce(handleResize, 150));
        handleResize(); // Executar uma vez
    }

    /**
     * OPTIMIZE FOR SMALL SCREEN - Otimizações para telas pequenas
     */
    optimizeForSmallScreen() {
        // Desativar animações pesadas via CSS
        const style = document.createElement('style');
        style.id = 'small-screen-optimizations';
        style.textContent = `
            .animated-3d-border::before {
                animation: none !important;
            }
            .video-card:hover {
                transform: none !important;
            }
            .particle {
                display: none !important;
            }
        `;
        
        if (!document.getElementById('small-screen-optimizations')) {
            document.head.appendChild(style);
        }
        
        // Ajustar grids
        document.querySelectorAll('.videos-grid, .stats-grid, .recommended-grid').forEach(grid => {
            grid.style.gridTemplateColumns = '1fr';
        });
    }

    /**
     * RESTORE ANIMATIONS - Restaurar animações
     */
    restoreAnimations() {
        const style = document.getElementById('small-screen-optimizations');
        if (style) {
            style.remove();
        }
    }

    /**
     * 10. CONTROLES DE TECLADO
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('video-player-modal');
            if (!modal?.classList.contains('active')) return;
            
            switch(e.key) {
                case ' ':
                case 'Space':
                    e.preventDefault();
                    const video = modal.querySelector('video');
                    if (video) {
                        if (video.paused) {
                            video.play();
                        } else {
                            video.pause();
                        }
                    }
                    break;
                case 'f':
                    e.preventDefault();
                    const videoEl = modal.querySelector('video');
                    if (videoEl) {
                        if (videoEl.requestFullscreen) {
                            videoEl.requestFullscreen();
                        }
                    }
                    break;
            }
        });
    }

    /**
     * 11. EFEITO DE PARTÍCULAS
     */
    setupParticlesEffect() {
        // Já implementado no CSS com animações
    }

    /**
     * 12. SISTEMA DE TOAST NOTIFICATIONS
     */
    showToast(message, type = 'success') {
        // Remover toast existente
        const existingToast = document.querySelector('.futuristic-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Criar novo toast
        const toast = document.createElement('div');
        toast.className = `futuristic-toast ${type}`;
        toast.innerHTML = message;
        
        document.body.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remover após 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * 13. ESTADO VAZIO PARA BUSCA
     */
    showEmptyState(isEmpty) {
        let emptyState = document.querySelector('.empty-search-state');
        const container = document.querySelector('.videos-grid')?.parentElement;
        
        if (isEmpty) {
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'empty-search-state';
                emptyState.innerHTML = `
                    <i class="fas fa-video-slash"></i>
                    <h3>Nenhum vídeo encontrado</h3>
                    <p>Tente buscar por outros termos ou categorias</p>
                    <button class="btn-primary clear-search">
                        <i class="fas fa-times"></i>
                        Limpar filtros
                    </button>
                `;
                
                container?.appendChild(emptyState);
                
                // Evento para limpar busca
                const clearBtn = emptyState.querySelector('.clear-search');
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        const searchInput = document.getElementById('video-search-input');
                        if (searchInput) {
                            searchInput.value = '';
                            this.searchTerm = '';
                            this.currentCategory = 'todos';
                            
                            // Resetar filtros ativos
                            document.querySelectorAll('.video-filter-btn').forEach(btn => {
                                btn.classList.remove('active');
                                if (btn.dataset.category === 'todos') {
                                    btn.classList.add('active');
                                }
                            });
                            
                            this.filterVideos('', 'todos');
                        }
                    });
                }
            }
            emptyState.style.display = 'flex';
        } else {
            if (emptyState) {
                emptyState.style.display = 'none';
            }
        }
    }

    /**
     * 14. ATUALIZAR CONTADORES DE CATEGORIA
     */
    updateCategoryCounters() {
        const categories = {
            financas: 0,
            economia: 0,
            gestao: 0
        };
        
        document.querySelectorAll('.video-card').forEach(card => {
            if (card.style.display !== 'none') {
                const cat = card.dataset.category;
                if (cat && categories.hasOwnProperty(cat)) {
                    categories[cat]++;
                }
            }
        });
        
        // Atualizar contadores visuais
        document.querySelectorAll('.category-stats .video-count').forEach(el => {
            const section = el.closest('.category-section');
            if (section) {
                const category = section.dataset.category;
                if (category) {
                    el.textContent = `${categories[category] || 0} vídeos`;
                }
            }
        });
    }

    /**
     * 15. ATUALIZAR CONTADOR DE FAVORITOS
     */
    updateFavoritesCounter() {
        const favoritesCount = this.favorites.length;
        
        // Atualizar estatísticas
        const favoritesStat = document.querySelector('.video-stat-card .fa-star')?.closest('.video-stat-card');
        if (favoritesStat) {
            const numberEl = favoritesStat.querySelector('.video-stat-number');
            if (numberEl) {
                numberEl.dataset.target = favoritesCount;
                this.animateNumber(numberEl);
            }
        }
    }

    /**
     * 16. SETUP COMMENT LIKES
     */
    setupCommentLikes(videoId) {
        document.querySelectorAll('.comment-like').forEach(btn => {
            btn.removeEventListener('click', this.boundLikeHandler);
            this.boundLikeHandler = (e) => {
                e.preventDefault();
                const commentId = btn.dataset.commentId;
                this.toggleCommentLike(videoId, commentId);
            };
            btn.addEventListener('click', this.boundLikeHandler);
        });
    }

    /**
     * TOGGLE COMMENT LIKE
     */
    toggleCommentLike(videoId, commentId) {
        const comments = this.comments[videoId];
        if (!comments) return;
        
        const comment = comments.find(c => c.id == commentId);
        if (comment) {
            if (comment.liked) {
                comment.likes--;
                comment.liked = false;
            } else {
                comment.likes++;
                comment.liked = true;
            }
            
            this.renderComments(videoId);
            this.saveComments();
        }
    }

    /**
     * 17. CARREGAR COMENTÁRIOS DO LOCALSTORAGE
     */
    loadComments() {
        const saved = localStorage.getItem('teca-comments-futurista');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Erro ao carregar comentários');
            }
        }
        
        // Comentários iniciais
        return {
            'vid-001': [
                {
                    id: 1,
                    author: 'Carlos Mendes',
                    avatar: 'fa-user-tie',
                    date: '2 dias atrás',
                    text: 'Excelente análise sobre o mercado financeiro! A didática está impecável.',
                    likes: 12,
                    liked: false
                }
            ],
            'vid-002': [
                {
                    id: 2,
                    author: 'Ana Souza',
                    avatar: 'fa-user-astronaut',
                    date: '5 dias atrás',
                    text: 'O vídeo sobre Bitcoin finalmente esclareceu minhas dúvidas sobre blockchain. Muito obrigada!',
                    likes: 8,
                    liked: false
                }
            ],
            'vid-004': [
                {
                    id: 3,
                    author: 'Ricardo Alves',
                    avatar: 'fa-user-ninja',
                    date: '1 semana atrás',
                    text: 'As 48 Leis do Poder é um livro transformador. Ótima interpretação e exemplos práticos!',
                    likes: 24,
                    liked: false
                }
            ],
            'geral': []
        };
    }

    /**
     * 18. SALVAR COMENTÁRIOS
     */
    saveComments() {
        localStorage.setItem('teca-comments-futurista', JSON.stringify(this.comments));
    }

    /**
     * 19. CARREGAR BASE DE VÍDEOS
     */
    loadVideoDatabase() {
        // Já carregado via HTML
        console.log('📚 Base de vídeos carregada');
    }

    /**
     * 20. UTILITÁRIOS
     */
    
    // Debounce para performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Embaralhar array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Escapar HTML para segurança
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Views aleatórias para estatísticas
    getRandomViews(index) {
        const views = [1200, 3500, 892, 2100];
        return views[index] || 1500;
    }

    /**
     * DESTRUCTOR - Limpar eventos
     */
    destroy() {
        // Remover todos os event listeners
        document.removeEventListener('keydown', this.boundEscapeHandler);
        window.removeEventListener('resize', this.boundResizeHandler);
        
        console.log('🧹 Biblioteca Futurista - Eventos limpos');
    }
}

/**
 * ===========================================
 * INICIALIZAÇÃO
 * ===========================================
 */

// Aguardar DOM completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar a biblioteca futurista
    window.videoLibrary = new VideoBibliotecaFuturista();
    
    // Adicionar animação de entrada
    document.querySelector('.biblioteca-futurista')?.classList.add('loaded');
});

// Adicionar estilos para toast se não existirem
if (!document.querySelector('#toast-styles')) {
    const toastStyles = document.createElement('style');
    toastStyles.id = 'toast-styles';
    toastStyles.textContent = `
        .futuristic-toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary-black);
            border: 1px solid var(--primary-gold);
            color: var(--primary-white);
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 0.9rem;
            z-index: 99999;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 0 20px var(--gold-transparent);
            backdrop-filter: blur(5px);
            pointer-events: none;
        }
        
        .futuristic-toast.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .futuristic-toast.success {
            border-color: var(--primary-gold);
        }
        
        .futuristic-toast.warning {
            border-color: var(--accent-red);
        }
        
        .empty-comments {
            text-align: center;
            padding: 3rem;
            color: rgba(255,255,255,0.5);
        }
        
        .empty-comments i {
            font-size: 2.5rem;
            color: var(--primary-gold);
            margin-bottom: 1rem;
        }
        
        .no-recommendations {
            text-align: center;
            padding: 2rem;
            color: rgba(255,255,255,0.5);
            border: 1px dashed var(--gold-transparent);
            border-radius: 12px;
        }
        
        .no-recommendations i {
            font-size: 2rem;
            color: var(--primary-gold);
            margin-bottom: 0.5rem;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(toastStyles);
}