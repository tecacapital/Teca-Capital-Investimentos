// =============================================
// CONFIGURAÇÕES E CONSTANTES GLOBAIS
// =============================================

const CONFIG = {
    STORAGE_KEYS: {
        FAVORITOS: 'tecacapital_favoritos_audio',
        OUVIDOS: 'tecacapital_ouvidos_audio',
        VOLUME: 'tecacapital_volume',
        ULTIMO_AUDIO: 'tecacapital_ultimo_audio',
        ULTIMO_TEMPO: 'tecacapital_ultimo_tempo'
    },
    ANIMATION: {
        DURATION: 2000,
        STEP_INTERVAL: 16,
        TOAST_DURATION: 3000
    },
    VOLUME: {
        DEFAULT: 0.7,
        MIN: 0,
        MAX: 1
    },
    SELECTORS: {
        AUDIO_PLAYER: '.audio-player',
        PODCAST_CARD: '.podcast-card',
        PODCASTS_GRID: '.podcasts-grid',
        PLAY_BTN: '.play-btn',
        DETAILS_BTN: '.details-btn',
        SHARE_BTN: '.share-btn',
        FAVORITE_BTN: '.favorite-btn',
        CATEGORY_FILTER: '.category-filter-btn',
        SEARCH_INPUT: '#audio-search-input',
        SEARCH_BTN: '#audio-search-btn',
        SUGGESTION_BTN: '.suggestion-btn',
        RECOMMENDATION_LINK: '.recommendation-link',
        STAT_NUMBER: '.audio-stat-number',
        ADVANCED_PLAYER: '#advanced-player',
        PLAYER_CURRENT_TITLE: '#player-current-title',
        PLAYER_TIME: '#player-time',
        PLAYER_PLAY: '#player-play',
        PLAYER_PREV: '#player-prev',
        PLAYER_NEXT: '#player-next',
        PLAYER_PROGRESS_CONTAINER: '#player-progress-container',
        PLAYER_PROGRESS_BAR: '#player-progress-bar',
        PLAYER_VOLUME_BTN: '#player-volume-btn',
        VOLUME_SLIDER: '#volume-slider',
        VOLUME_LEVEL: '#volume-level',
        PLAYER_CLOSE: '#player-close',
        PLAYER_PLAYLIST: '#player-playlist',
        TOAST: '#toast'
    }
};

// =============================================
// BIBLIOTECA DE DADOS - PODCASTS
// =============================================

const PODCASTS_DB = [
    {
        id: 1,
        titulo: "Bitcoin: Alternativa ao Sistema Financeiro Tradicional",
        subtitulo: "Resumo do livro: Bitcoin – A Moeda Digital",
        autor: "Fernando Ulrich",
        ano: 2014,
        duracao: "13:46",
        duracaoSegundos: 930,
        categoria: "finanças",
        arquivo: "frontend/Public/asset/audio/Bitcoin_Crise_2008_Gasto_Duplo_Blockchain.m4a",
        tipo: "audio/mpeg",
        capa: null,
        descricao: "Entenda como o Bitcoin surgiu como alternativa ao sistema financeiro tradicional, resolvendo problemas como gasto duplo e confiança centralizada."
    },
    {
        id: 2,
        titulo: "Padrões de Sucesso e Fracasso na Psicologia do Dinheiro",
        subtitulo: "Resumo do livro: A Psicologia do Dinheiro",
        autor: "Morgan Housel",
        ano: 2021,
        duracao: "13:22",
        duracaoSegundos: 1125,
        categoria: "finanças",
        arquivo: "frontend/Public/asset/audio/Limpar_fortunas_Comportamento_vence_inteligência_financeira.m4a",
        tipo: "audio/mpeg",
        capa: null,
        descricao: "Descubra como o comportamento financeiro é mais importante que inteligência técnica para construir riqueza."
    },
    {
        id: 3,
        titulo: "Descodificando o Código Financeiro",
        subtitulo: "Resumo do livro: Os Segredos da Mente Milionária",
        autor: "T. Harv Eker",
        ano: 2005,
        duracao: "13:54",
        duracaoSegundos: 834,
        categoria: "finanças",
        arquivo: "frontend/Public/asset/audio/Segredos_da_Mente_Milionária_Descodificar_Código_Financeiro.m4a",
        tipo: "audio/mpeg",
        capa: null,
        descricao: "Aprenda a reprogramar sua mente para o sucesso financeiro através de 17 maneiras de pensar e agir."
    },
    {
        id: 4,
        titulo: "Do Templo à Tokenização dos Mercados Financeiros em Angola",
        subtitulo: "Resumo do E-book: Conheça o Mercado Financeiro",
        autor: "Alberto Teca Tomás",
        ano: 2025,
        duracao: "15:03",
        duracaoSegundos: 903,
        categoria: "finanças",
        arquivo: "frontend/Public/asset/audio/Do_Templo_à_Tokenização_dos_Mercados_Financeiros_em_Angola.m4a",
        tipo: "audio/mpeg",
        capa: null,
        descricao: "Uma jornada pela evolução dos mercados financeiros em Angola, desde os templos até a tokenização digital."
    }
];

// =============================================
// ESTADO GLOBAL DA APLICAÇÃO
// =============================================

const AppState = {
    audioAtual: null,
    audioAtualId: null,
    favoritos: [],
    ouvidos: [],
    volume: 0.7,
    isPlaying: false,
    statsAnimados: false,
    
    // Inicializar estado
    init() {
        this.favoritos = this.getStorage(CONFIG.STORAGE_KEYS.FAVORITOS, []);
        this.ouvidos = this.getStorage(CONFIG.STORAGE_KEYS.OUVIDOS, []);
        this.volume = this.getStorage(CONFIG.STORAGE_KEYS.VOLUME, CONFIG.VOLUME.DEFAULT);
    },
    
    // Getters/Setters localStorage
    getStorage(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`Erro ao ler ${key}:`, e);
            return defaultValue;
        }
    },
    
    setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Erro ao salvar ${key}:`, e);
        }
    },
    
    // Favoritos
    toggleFavorito(id) {
        id = Number(id);
        const index = this.favoritos.indexOf(id);
        
        if (index === -1) {
            this.favoritos.push(id);
        } else {
            this.favoritos.splice(index, 1);
        }
        
        this.setStorage(CONFIG.STORAGE_KEYS.FAVORITOS, this.favoritos);
        return index === -1; // true = adicionou, false = removeu
    },
    
    isFavorito(id) {
        return this.favoritos.includes(Number(id));
    },
    
    // Ouvidos
    marcarOuvido(id) {
        id = Number(id);
        if (!this.ouvidos.includes(id)) {
            this.ouvidos.push(id);
            this.setStorage(CONFIG.STORAGE_KEYS.OUVIDOS, this.ouvidos);
            return true;
        }
        return false;
    },
    
    isOuvido(id) {
        return this.ouvidos.includes(Number(id));
    },
    
    // Volume
    setVolume(valor) {
        this.volume = Math.max(CONFIG.VOLUME.MIN, Math.min(CONFIG.VOLUME.MAX, Number(valor) || 0));
        this.setStorage(CONFIG.STORAGE_KEYS.VOLUME, this.volume);
        
        if (this.audioAtual) {
            this.audioAtual.volume = this.volume;
        }
        
        return this.volume;
    }
};

// =============================================
// UTILITÁRIOS
// =============================================

const Utils = {
    // Formatar tempo (segundos -> MM:SS)
    formatarTempo(segundos) {
        if (!segundos || isNaN(segundos) || !isFinite(segundos)) return '0:00';
        const min = Math.floor(segundos / 60);
        const seg = Math.floor(segundos % 60);
        return `${min}:${seg.toString().padStart(2, '0')}`;
    },
    
    // Debounce para performance
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    // Encontrar podcast por ID
    getPodcastById(id) {
        return PODCASTS_DB.find(p => p.id === Number(id)) || null;
    },
    
    // Criar ID de áudio
    getAudioId(id) {
        return `audio-${id}`;
    },
    
    // Scroll suave para elemento
    scrollToElement(element, offset = 0) {
        if (!element) return;
        const y = element.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
};

// =============================================
// GESTOR DE UI - COMPONENTES VISUAIS
// =============================================

const UI = {
    elementos: {},
    
    // Inicializar elementos do DOM
    init() {
        Object.keys(CONFIG.SELECTORS).forEach(key => {
            const selector = CONFIG.SELECTORS[key];
            if (selector.startsWith('#')) {
                this.elementos[key] = document.querySelector(selector);
            } else {
                this.elementos[key] = document.querySelectorAll(selector);
            }
        });
        
        // Elementos específicos
        this.elementos.audioPlayers = document.querySelectorAll(CONFIG.SELECTORS.AUDIO_PLAYER);
        this.elementos.podcastCards = document.querySelectorAll(CONFIG.SELECTORS.PODCAST_CARD);
        this.elementos.playBtns = document.querySelectorAll(CONFIG.SELECTORS.PLAY_BTN);
        this.elementos.detailsBtns = document.querySelectorAll(CONFIG.SELECTORS.DETAILS_BTN);
        this.elementos.shareBtns = document.querySelectorAll(CONFIG.SELECTORS.SHARE_BTN);
        this.elementos.favoriteBtns = document.querySelectorAll(CONFIG.SELECTORS.FAVORITE_BTN);
        this.elementos.categoryFilters = document.querySelectorAll(CONFIG.SELECTORS.CATEGORY_FILTER);
        this.elementos.suggestionBtns = document.querySelectorAll(CONFIG.SELECTORS.SUGGESTION_BTN);
        this.elementos.recommendationLinks = document.querySelectorAll(CONFIG.SELECTORS.RECOMMENDATION_LINK);
        this.elementos.statNumbers = document.querySelectorAll(CONFIG.SELECTORS.STAT_NUMBER);
    },
    
    // Toast notification
    showToast(message, type = 'sucesso', duration = CONFIG.ANIMATION.TOAST_DURATION) {
        const toast = this.elementos.TOAST;
        if (!toast) return;
        
        // Definir ícone e cor
        let icon = '✓';
        let gradient = 'linear-gradient(135deg, rgb(214, 174, 100), #0066cc)';
        
        if (type === 'erro') {
            icon = '✕';
            gradient = 'linear-gradient(135deg, #cc3333, #ff6b6b)';
        } else if (type === 'aviso') {
            icon = '⚠';
            gradient = 'linear-gradient(135deg, #ff9900, #ffcc00)';
        }
        
        toast.textContent = `${icon} ${message}`;
        toast.style.background = gradient;
        toast.classList.add('show');
        
        clearTimeout(toast.timeout);
        toast.timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    },
    
    // Atualizar ícone de favorito
    updateFavoriteIcon(btn, isFavorito) {
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isFavorito ? 'fas fa-heart' : 'far fa-heart';
        }
        btn.classList.toggle('active', isFavorito);
        
        // Animação
        btn.style.animation = 'heartbeat 0.5s ease';
        setTimeout(() => { btn.style.animation = ''; }, 500);
    },
    
    // Atualizar classe favorito no card
    updateCardFavoriteClass(card, isFavorito) {
        if (!card) return;
        card.classList.toggle('favorito', isFavorito);
    },
    
    // Atualizar classe ouvido no card
    updateCardPlayedClass(card, isOuvido) {
        if (!card) return;
        card.classList.toggle('played', isOuvido);
    },
    
    // Atualizar ícone de volume
    updateVolumeIcon(volume) {
        const btn = this.elementos.PLAYER_VOLUME_BTN;
        if (!btn) return;
        
        let iconClass = 'fa-volume-up';
        if (volume === 0) {
            iconClass = 'fa-volume-mute';
        } else if (volume < 0.33) {
            iconClass = 'fa-volume-down';
        } else if (volume > 0.66) {
            iconClass = 'fa-volume-up';
        } else {
            iconClass = 'fa-volume-low';
        }
        
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = `fas ${iconClass}`;
        }
    },
    
    // Atualizar nível de volume visual
    updateVolumeLevel(volume) {
        const level = this.elementos.VOLUME_LEVEL;
        if (level) {
            level.style.width = `${volume * 100}%`;
        }
    }
};

// =============================================
// PLAYER DE ÁUDIO - CONTROLE CENTRAL
// =============================================

const AudioPlayer = {
    currentAudio: null,
    currentId: null,
    isPlaying: false,
    updateInterval: null,
    
    // Inicializar
    init() {
        this.setupAudioElements();
        this.setupEventListeners();
        this.setupUpdateInterval();
        this.restoreLastSession();
    },
    
    // Configurar elementos de áudio
    setupAudioElements() {
        UI.elementos.audioPlayers.forEach(player => {
            player.volume = AppState.volume;
            
            player.addEventListener('play', () => this.handlePlay(player));
            player.addEventListener('pause', () => this.handlePause(player));
            player.addEventListener('ended', () => this.handleEnded(player));
            player.addEventListener('timeupdate', () => this.handleTimeUpdate());
            player.addEventListener('error', () => this.handleError(player));
        });
    },
    
    // Event listeners do player avançado
    setupEventListeners() {
        const {
            PLAYER_PLAY,
            PLAYER_PREV,
            PLAYER_NEXT,
            PLAYER_PROGRESS_CONTAINER,
            PLAYER_VOLUME_BTN,
            VOLUME_SLIDER,
            PLAYER_CLOSE,
            PLAYER_PLAYLIST
        } = UI.elementos;
        
        if (PLAYER_PLAY) {
            PLAYER_PLAY.addEventListener('click', () => this.togglePlayPause());
        }
        
        if (PLAYER_PREV) {
            PLAYER_PREV.addEventListener('click', () => this.navigate('prev'));
        }
        
        if (PLAYER_NEXT) {
            PLAYER_NEXT.addEventListener('click', () => this.navigate('next'));
        }
        
        if (PLAYER_PROGRESS_CONTAINER) {
            PLAYER_PROGRESS_CONTAINER.addEventListener('click', (e) => this.seek(e));
        }
        
        if (PLAYER_VOLUME_BTN) {
            PLAYER_VOLUME_BTN.addEventListener('click', () => this.toggleMute());
        }
        
        if (VOLUME_SLIDER) {
            VOLUME_SLIDER.addEventListener('click', (e) => this.adjustVolume(e));
        }
        
        if (PLAYER_CLOSE) {
            PLAYER_CLOSE.addEventListener('click', () => this.close());
        }
        
        if (PLAYER_PLAYLIST) {
            PLAYER_PLAYLIST.addEventListener('click', () => {
                UI.showToast('📑 Lista de reprodução em breve', 'aviso');
            });
        }
    },
    
    // Restaurar última sessão
    restoreLastSession() {
        const ultimoId = AppState.getStorage(CONFIG.STORAGE_KEYS.ULTIMO_AUDIO, null);
        const ultimoTempo = AppState.getStorage(CONFIG.STORAGE_KEYS.ULTIMO_TEMPO, 0);
        
        if (ultimoId && ultimoTempo > 0) {
            const audio = document.getElementById(Utils.getAudioId(ultimoId));
            if (audio) {
                audio.currentTime = ultimoTempo;
            }
        }
    },
    
    // HANDLERS
    handlePlay(player) {
        const id = player.id.split('-')[1];
        this.setCurrentAudio(player, id);
        this.pauseOthers(player.id);
        this.updatePlayButtons(id, true);
        this.showPlayer();
        UI.updateCardPlayedClass(
            document.querySelector(`.podcast-card[data-id="${id}"]`),
            true
        );
        AppState.marcarOuvido(id);
        this.isPlaying = true;
    },
    
    handlePause(player) {
        const id = player.id.split('-')[1];
        this.updatePlayButtons(id, false);
        this.isPlaying = false;
    },
    
    handleEnded(player) {
        const id = player.id.split('-')[1];
        this.updatePlayButtons(id, false);
        UI.showToast('✅ Podcast marcado como ouvido!', 'sucesso', 2000);
        this.navigate('next');
    },
    
    handleTimeUpdate() {
        this.updatePlayerUI();
    },
    
    handleError(player) {
        console.error('Erro no áudio:', player.src);
        UI.showToast('❌ Erro ao carregar áudio', 'erro');
    },
    
    // Controles do player
    setCurrentAudio(audio, id) {
        this.currentAudio = audio;
        this.currentId = Number(id);
        AppState.audioAtual = audio;
        AppState.audioAtualId = Number(id);
        
        // Salvar na sessão
        AppState.setStorage(CONFIG.STORAGE_KEYS.ULTIMO_AUDIO, id);
    },
    
    pauseOthers(currentId) {
        UI.elementos.audioPlayers.forEach(player => {
            if (player.id !== currentId && !player.paused) {
                player.pause();
            }
        });
    },
    
    togglePlayPause() {
        if (!this.currentAudio) {
            UI.showToast('🎧 Selecione um podcast primeiro', 'aviso');
            return;
        }
        
        if (this.currentAudio.paused) {
            this.currentAudio.play();
        } else {
            this.currentAudio.pause();
        }
    },
    
    navigate(direction) {
        if (!this.currentId) return;
        
        let novoId = this.currentId;
        
        if (direction === 'prev') {
            novoId = novoId > 1 ? novoId - 1 : PODCASTS_DB.length;
        } else {
            novoId = novoId < PODCASTS_DB.length ? novoId + 1 : 1;
        }
        
        const novoAudio = document.getElementById(Utils.getAudioId(novoId));
        if (novoAudio) {
            this.currentAudio?.pause();
            novoAudio.play();
        }
    },
    
    seek(e) {
        if (!this.currentAudio?.duration) return;
        
        const container = UI.elementos.PLAYER_PROGRESS_CONTAINER;
        const rect = container.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        this.currentAudio.currentTime = pos * this.currentAudio.duration;
    },
    
    adjustVolume(e) {
        const slider = UI.elementos.VOLUME_SLIDER;
        const rect = slider.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newVolume = Math.max(0, Math.min(1, pos));
        
        AppState.setVolume(newVolume);
        UI.updateVolumeIcon(newVolume);
        UI.updateVolumeLevel(newVolume);
        
        if (this.currentAudio) {
            this.currentAudio.volume = newVolume;
        }
    },
    
    toggleMute() {
        const newVolume = AppState.volume > 0 ? 0 : CONFIG.VOLUME.DEFAULT;
        AppState.setVolume(newVolume);
        UI.updateVolumeIcon(newVolume);
        UI.updateVolumeLevel(newVolume);
        
        if (this.currentAudio) {
            this.currentAudio.volume = newVolume;
        }
    },
    
    // UI do player
    showPlayer() {
        const player = UI.elementos.ADVANCED_PLAYER;
        if (player && !player.classList.contains('active')) {
            player.classList.add('active');
        }
    },
    
    close() {
        const player = UI.elementos.ADVANCED_PLAYER;
        if (player) {
            player.classList.remove('active');
        }
        this.currentAudio?.pause();
    },
    
    updatePlayerUI() {
        if (!this.currentAudio) return;
        
        // Título
        const titleEl = UI.elementos.PLAYER_CURRENT_TITLE;
        const podcast = Utils.getPodcastById(this.currentId);
        if (titleEl && podcast) {
            titleEl.innerHTML = `<i class="fas fa-music"></i> ${podcast.titulo.substring(0, 50)}...`;
        }
        
        // Tempo
        const timeEl = UI.elementos.PLAYER_TIME;
        if (timeEl) {
            const current = this.currentAudio.currentTime || 0;
            const duration = this.currentAudio.duration || 0;
            timeEl.textContent = `${Utils.formatarTempo(current)} / ${Utils.formatarTempo(duration)}`;
        }
        
        // Barra de progresso
        const progressBar = UI.elementos.PLAYER_PROGRESS_BAR;
        if (progressBar && this.currentAudio.duration) {
            const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        // Botão play/pause
        const playBtn = UI.elementos.PLAYER_PLAY;
        if (playBtn) {
            const icon = playBtn.querySelector('i');
            if (icon) {
                icon.className = this.currentAudio.paused ? 'fas fa-play' : 'fas fa-pause';
            }
        }
    },
    
    updatePlayButtons(id, isPlaying) {
        UI.elementos.playBtns.forEach(btn => {
            if (btn.dataset.id === String(id)) {
                btn.innerHTML = isPlaying 
                    ? '<i class="fas fa-pause"></i> Ouvindo...' 
                    : '<i class="fas fa-play"></i> Ouvir Agora';
            }
        });
    },
    
    setupUpdateInterval() {
        this.updateInterval = setInterval(() => this.updatePlayerUI(), 500);
    },
    
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Salvar tempo atual
        if (this.currentAudio && this.currentId) {
            AppState.setStorage(CONFIG.STORAGE_KEYS.ULTIMO_TEMPO, this.currentAudio.currentTime);
        }
    }
};

// =============================================
// GESTOR DE FAVORITOS
// =============================================

const FavoritesManager = {
    init() {
        this.restoreFavorites();
        this.setupEventListeners();
    },
    
    restoreFavorites() {
        UI.elementos.favoriteBtns.forEach(btn => {
            const id = btn.dataset.id;
            const isFavorito = AppState.isFavorito(id);
            const card = document.querySelector(`.podcast-card[data-id="${id}"]`);
            
            UI.updateFavoriteIcon(btn, isFavorito);
            UI.updateCardFavoriteClass(card, isFavorito);
        });
    },
    
    setupEventListeners() {
        UI.elementos.favoriteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.dataset.id;
                const adicionou = AppState.toggleFavorito(id);
                const card = document.querySelector(`.podcast-card[data-id="${id}"]`);
                
                UI.updateFavoriteIcon(btn, adicionou);
                UI.updateCardFavoriteClass(card, adicionou);
                
                UI.showToast(
                    adicionou ? '❤️ Adicionado aos favoritos' : '💔 Removido dos favoritos',
                    adicionou ? 'sucesso' : 'aviso'
                );
            });
        });
    }

};

// =============================================
// GESTOR DE FILTROS E BUSCA
// =============================================

const FilterManager = {
    filtroAtivo: 'todos',
    
    init() {
        this.setupCategoryFilters();
        this.setupSearch();
        this.restoreActiveFilter();
    },
    
    setupCategoryFilters() {
        UI.elementos.categoryFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                const categoria = btn.dataset.category;
                
                UI.elementos.categoryFilters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.filtroAtivo = categoria;
                this.filterByCategory(categoria);
            });
        });
    },
    
    filterByCategory(categoria) {
        UI.elementos.podcastCards.forEach(card => {
            const cardCategoria = card.dataset.category;
            const shouldShow = categoria === 'todos' || cardCategoria === categoria;
            
            card.style.display = shouldShow ? 'block' : 'none';
            if (shouldShow) {
                card.style.animation = 'fadeIn 0.5s ease';
            }
        });
        
        // Gerenciar seções de placeholder
        const gestaoSection = document.getElementById('gestao-section');
        const economiaSection = document.getElementById('economia-section');
        
        if (gestaoSection) {
            gestaoSection.style.display = (categoria === 'todos' || categoria === 'gestão') ? 'block' : 'none';
        }
        
        if (economiaSection) {
            economiaSection.style.display = (categoria === 'todos' || categoria === 'economia') ? 'block' : 'none';
        }
    },
    
    setupSearch() {
        const searchInput = UI.elementos.SEARCH_INPUT;
        const searchBtn = UI.elementos.SEARCH_BTN;
        
        if (!searchInput || !searchBtn) return;
        
        const performSearch = Utils.debounce(() => {
            const termo = searchInput.value.toLowerCase().trim();
            
            if (!termo) {
                this.filterByCategory(this.filtroAtivo);
                return;
            }
            
            UI.elementos.podcastCards.forEach(card => {
                const titulo = card.querySelector('.podcast-title')?.textContent.toLowerCase() || '';
                const autor = card.querySelector('.podcast-meta span:first-child')?.textContent.toLowerCase() || '';
                const categoria = card.dataset.category?.toLowerCase() || '';
                
                const match = titulo.includes(termo) || autor.includes(termo) || categoria.includes(termo);
                card.style.display = match ? 'block' : 'none';
                
                if (match) {
                    card.style.animation = 'fadeIn 0.5s ease';
                }
            });
        }, 300);
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') performSearch();
        });
        searchInput.addEventListener('input', () => {
            if (!searchInput.value.trim()) {
                this.filterByCategory(this.filtroAtivo);
            }
        });
    },
    
    restoreActiveFilter() {
        const activeBtn = document.querySelector(`${CONFIG.SELECTORS.CATEGORY_FILTER}.active`);
        if (activeBtn) {
            this.filtroAtivo = activeBtn.dataset.category;
            this.filterByCategory(this.filtroAtivo);
        }
    }
};

// =============================================
// GESTOR DE RECOMENDAÇÕES
// =============================================

const RecommendationsManager = {
    init() {
        this.setupRecommendationLinks();
    },
    
    setupRecommendationLinks() {
        UI.elementos.recommendationLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                
                if (href && href.startsWith('#')) {
                    const audioId = href.replace('#podcast-', '');
                    const audioElement = document.getElementById(`audio-${audioId}`);
                    const card = document.querySelector(`.podcast-card[data-id="${audioId}"]`);
                    
                    if (audioElement) {
                        Utils.scrollToElement(card, -100);
                        setTimeout(() => {
                            audioElement.play();
                            UI.showToast(`▶️ Tocando: ${Utils.getPodcastById(audioId)?.titulo.substring(0, 30)}...`, 'sucesso');
                        }, 500);
                    }
                }
            });
        });
    }
};

// =============================================
// GESTOR DE ESTATÍSTICAS
// =============================================

const StatsManager = {
    init() {
        this.setupStatsObserver();
    },
    
    setupStatsObserver() {
        const statsSection = document.querySelector('.audio-stats-section');
        if (!statsSection) return;
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !AppState.statsAnimados) {
                        this.animateStats();
                        AppState.statsAnimados = true;
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.3 });
            
            observer.observe(statsSection);
        } else {
            this.animateStats();
        }
    },
    
    animateStats() {
        UI.elementos.statNumbers.forEach(stat => {
            const target = parseInt(stat.dataset.target || 0);
            let current = 0;
            
            const timer = setInterval(() => {
                current += target / (CONFIG.ANIMATION.DURATION / CONFIG.ANIMATION.STEP_INTERVAL);
                
                if (current >= target) {
                    stat.textContent = target + '+';
                    clearInterval(timer);
                    
                    // Animação de conclusão
                    stat.style.transform = 'scale(1.2)';
                    setTimeout(() => { stat.style.transform = 'scale(1)'; }, 300);
                } else {
                    stat.textContent = Math.floor(current) + '+';
                }
            }, CONFIG.ANIMATION.STEP_INTERVAL);
        });
    }
};

// =============================================
// GESTOR DE PLACEHOLDERS E SUGESTÕES
// =============================================

const SuggestionsManager = {
    init() {
        this.setupSuggestionButtons();
    },
    
    setupSuggestionButtons() {
        UI.elementos.suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const categoria = btn.dataset.categoria || 'geral';
                UI.showToast(`💡 Obrigado! Sua sugestão sobre ${categoria} foi enviada.`, 'sucesso');
            });
        });
    }
};

// =============================================
// INICIALIZADOR PRINCIPAL
// =============================================

function initApp() {
    console.log('🎵 Inicializando Biblioteca de Áudio - v2.0.0');
    
    try {
        // Inicializar estado
        AppState.init();
        
        // Inicializar UI
        UI.init();
        
        // Verificar elementos críticos
        if (!UI.elementos.podcastCards || UI.elementos.podcastCards.length === 0) {
            console.warn('Nenhum podcast encontrado no DOM');
        }
        
        // Inicializar módulos
        AudioPlayer.init();
        FavoritesManager.init();
        FilterManager.init();
        RecommendationsManager.init();
        StatsManager.init();
        SuggestionsManager.init();
        
        // Configurar volume inicial
        UI.updateVolumeIcon(AppState.volume);
        UI.updateVolumeLevel(AppState.volume);
        
        // Configurar cleanup
        window.addEventListener('beforeunload', () => {
            AudioPlayer.cleanup();
        });
        
        // Configurar keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                AudioPlayer.togglePlayPause();
            }
        });
        
        UI.showToast('🎧 Bem-vindo à Biblioteca de Áudio Teca Capital!', 'sucesso', 4000);
        console.log('Biblioteca de Áudio inicializada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro fatal na inicialização:', error);
        UI.showToast('Erro ao carregar a biblioteca', 'erro');
    }
}

// =============================================
// EXECUTAR INICIALIZAÇÃO
// =============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export para uso em módulos (opcional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppState,
        AudioPlayer,
        FavoritesManager,
        FilterManager,
        RecommendationsManager,
        StatsManager,
        SuggestionsManager,
        UI,
        Utils
    };
}

// Abrir playlist ao clicar no botão flutuante
document.getElementById('playlistFloatingBtn')?.addEventListener('click', () => {
    if (window.playlistManager) {
        window.playlistManager.togglePlaylist(true);
    }
});

// Atualizar badge
document.addEventListener('playlistUpdated', (e) => {
    const badge = document.getElementById('playlistBadge');
    if (badge) {
        badge.textContent = e.detail.count;
        badge.style.display = e.detail.count > 0 ? 'flex' : 'none';
    }
});

