// Enhanced UI System for SkyTracker Pro
// Ultra-premium interactions, animations, and effects

class PremiumUI {
    constructor() {
        this.soundEnabled = true;
        this.notifications = [];
        this.activeFilters = new Set();
        this.viewPresets = new Map();
        this.flightAlerts = new Map();
        this.keyboardShortcuts = new Map();
        this.isMobile = this.detectMobile();
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.lastTouchTime = 0;
        
        this.init();
    }

    init() {
        this.setupSoundSystem();
        this.setupKeyboardShortcuts();
        this.setupAdvancedSearch();
        this.setupFlightFilters();
        this.setupViewPresets();
        this.setupFlightAlerts();
        this.setupPremiumAnimations();
        this.setupContextMenus();
        this.setupTooltips();
        this.setupMobileSupport();
        console.log('🎨 Premium UI System activated');
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    setupMobileSupport() {
        if (!this.isMobile) return;
        
        console.log('📱 Mobile device detected - enabling touch features');
        
        // Setup touch gestures
        this.setupTouchGestures();
        
        // Setup pull-to-refresh
        this.setupPullToRefresh();
        
        // Setup mobile-optimized controls
        this.setupMobileControls();
        
        // Setup orientation handling
        this.setupOrientationHandling();
        
        // Add mobile-specific CSS class
        document.body.classList.add('mobile-device');
        
        // Disable hover effects on mobile
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: none) {
                .action-btn:hover,
                .control-btn:hover,
                .suggestion-item:hover,
                .preset-item:hover,
                .context-item:hover {
                    transform: none !important;
                    background: inherit !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupTouchGestures() {
        // Swipe to open/close sidebar
        const sidebar = document.getElementById('sidebar');
        const mapContainer = document.querySelector('.map-container');
        
        // Touch events for sidebar swipe
        mapContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.lastTouchTime = Date.now();
        }, { passive: true });
        
        mapContainer.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;
            const timeDelta = Date.now() - this.lastTouchTime;
            
            // Swipe left to open sidebar (from right edge)
            if (deltaX < -100 && Math.abs(deltaY) < 100 && timeDelta < 300 && this.touchStartX > window.innerWidth - 50) {
                if (window.selectedFlight) {
                    sidebar.classList.add('open');
                    this.playSound('click');
                }
            }
            
            // Swipe right to close sidebar
            if (deltaX > 100 && Math.abs(deltaY) < 100 && timeDelta < 300 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                this.playSound('click');
            }
        }, { passive: true });
        
        // Long press for context menu
        let longPressTimer;
        mapContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                longPressTimer = setTimeout(() => {
                    // Trigger vibration if available
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    
                    // Show mobile context menu
                    this.showMobileContextMenu(e.touches[0].clientX, e.touches[0].clientY);
                }, 500);
            }
        }, { passive: true });
        
        mapContainer.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        }, { passive: true });
        
        mapContainer.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        }, { passive: true });
    }

    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        const threshold = 80;
        
        // Create pull-to-refresh indicator
        const refreshIndicator = document.createElement('div');
        refreshIndicator.className = 'pull-refresh-indicator';
        refreshIndicator.innerHTML = `
            <div class="refresh-spinner">
                <i class="fas fa-sync-alt"></i>
            </div>
            <span>Pull to refresh</span>
        `;
        document.body.appendChild(refreshIndicator);
        
        // Add CSS for refresh indicator
        const style = document.createElement('style');
        style.textContent = `
            .pull-refresh-indicator {
                position: fixed;
                top: -80px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--glass-bg);
                backdrop-filter: blur(20px);
                border: 1px solid var(--border-color);
                border-radius: 0 0 12px 12px;
                padding: 1rem 2rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: var(--text-primary);
                font-size: 0.875rem;
                z-index: 10000;
                transition: top 0.3s ease;
            }
            
            .pull-refresh-indicator.visible {
                top: 0;
            }
            
            .pull-refresh-indicator.refreshing .refresh-spinner {
                animation: spin 1s linear infinite;
            }
            
            .refresh-spinner {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        document.head.appendChild(style);
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].pageY;
                isPulling = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (isPulling) {
                currentY = e.touches[0].pageY;
                const pullDistance = currentY - startY;
                
                if (pullDistance > 0 && pullDistance < threshold * 2) {
                    refreshIndicator.style.top = `${Math.min(pullDistance - 80, 0)}px`;
                    
                    if (pullDistance > threshold) {
                        refreshIndicator.querySelector('span').textContent = 'Release to refresh';
                        refreshIndicator.classList.add('ready');
                    } else {
                        refreshIndicator.querySelector('span').textContent = 'Pull to refresh';
                        refreshIndicator.classList.remove('ready');
                    }
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (isPulling) {
                const pullDistance = currentY - startY;
                
                if (pullDistance > threshold) {
                    // Trigger refresh
                    refreshIndicator.classList.add('visible', 'refreshing');
                    refreshIndicator.querySelector('span').textContent = 'Refreshing...';
                    
                    // Trigger data refresh
                    if (window.loadFlightData) {
                        window.loadFlightData().finally(() => {
                            setTimeout(() => {
                                refreshIndicator.classList.remove('visible', 'refreshing', 'ready');
                                refreshIndicator.style.top = '-80px';
                                refreshIndicator.querySelector('span').textContent = 'Pull to refresh';
                            }, 1000);
                        });
                    }
                    
                    this.playSound('success');
                } else {
                    refreshIndicator.classList.remove('ready');
                    refreshIndicator.style.top = '-80px';
                }
                
                isPulling = false;
                startY = 0;
                currentY = 0;
            }
        }, { passive: true });
    }

    setupMobileControls() {
        // Add mobile-specific control panel
        const mobileControls = document.createElement('div');
        mobileControls.className = 'mobile-controls';
        mobileControls.innerHTML = `
            <div class="mobile-control-row">
                <button class="mobile-control-btn" id="mobileSearch">
                    <i class="fas fa-search"></i>
                    <span>Search</span>
                </button>
                <button class="mobile-control-btn" id="mobileFilters">
                    <i class="fas fa-filter"></i>
                    <span>Filters</span>
                </button>
                <button class="mobile-control-btn" id="mobileWeather">
                    <i class="fas fa-cloud-rain"></i>
                    <span>Weather</span>
                </button>
                <button class="mobile-control-btn" id="mobile3D">
                    <i class="fas fa-cube"></i>
                    <span>3D</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(mobileControls);
        
        // Add mobile controls CSS
        const style = document.createElement('style');
        style.textContent = `
            .mobile-controls {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--glass-bg);
                backdrop-filter: blur(20px);
                border-top: 1px solid var(--border-color);
                padding: 0.75rem;
                z-index: 1000;
                display: none;
            }
            
            @media (max-width: 768px) {
                .mobile-controls {
                    display: block;
                }
                
                .map-container {
                    padding-bottom: 80px;
                }
            }
            
            .mobile-control-row {
                display: flex;
                gap: 0.5rem;
                justify-content: space-around;
            }
            
            .mobile-control-btn {
                flex: 1;
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 0.75rem 0.5rem;
                color: var(--text-secondary);
                font-size: 0.75rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.25rem;
                cursor: pointer;
                transition: all 0.3s ease;
                min-height: 60px;
            }
            
            .mobile-control-btn:active {
                background: var(--primary-color);
                color: white;
                transform: scale(0.95);
            }
            
            .mobile-control-btn i {
                font-size: 1.25rem;
            }
            
            .mobile-control-btn span {
                font-size: 0.6rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners for mobile controls
        document.getElementById('mobileSearch').addEventListener('click', () => {
            document.getElementById('searchInput').focus();
            this.playSound('click');
        });
        
        document.getElementById('mobileFilters').addEventListener('click', () => {
            // Trigger filters panel
            const filtersBtn = document.querySelector('.action-btn[title*="Filter"]');
            if (filtersBtn) filtersBtn.click();
        });
        
        document.getElementById('mobileWeather').addEventListener('click', () => {
            this.toggleWeather();
        });
        
        document.getElementById('mobile3D').addEventListener('click', () => {
            this.toggle3D();
        });
    }

    setupOrientationHandling() {
        const handleOrientationChange = () => {
            // Delay to ensure dimensions are updated
            setTimeout(() => {
                // Resize map if available
                if (window.map) {
                    window.map.invalidateSize();
                }
                
                // Update 3D canvas if available
                if (window.skyTracker3D) {
                    window.skyTracker3D.handleResize();
                }
                
                // Show orientation hint for landscape
                if (window.orientation === 90 || window.orientation === -90) {
                    this.showNotification('Landscape mode: Enhanced viewing experience', 'info');
                }
            }, 100);
        };
        
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
    }

    showMobileContextMenu(x, y) {
        // Remove existing context menu
        const existingMenu = document.querySelector('.mobile-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const contextMenu = document.createElement('div');
        contextMenu.className = 'mobile-context-menu';
        contextMenu.innerHTML = `
            <div class="context-header">Quick Actions</div>
            <div class="context-item" data-action="refresh">
                <i class="fas fa-sync-alt"></i>
                <span>Refresh Data</span>
            </div>
            <div class="context-item" data-action="center">
                <i class="fas fa-crosshairs"></i>
                <span>Center Map</span>
            </div>
            <div class="context-item" data-action="fullscreen">
                <i class="fas fa-expand"></i>
                <span>Fullscreen</span>
            </div>
            <div class="context-item" data-action="close">
                <i class="fas fa-times"></i>
                <span>Close</span>
            </div>
        `;
        
        // Position context menu
        contextMenu.style.position = 'fixed';
        contextMenu.style.left = `${Math.min(x, window.innerWidth - 200)}px`;
        contextMenu.style.top = `${Math.min(y, window.innerHeight - 200)}px`;
        
        document.body.appendChild(contextMenu);
        
        // Add mobile context menu styles
        if (!document.querySelector('style[data-mobile-context]')) {
            const style = document.createElement('style');
            style.setAttribute('data-mobile-context', '');
            style.textContent = `
                .mobile-context-menu {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 0.5rem;
                    z-index: 10001;
                    min-width: 180px;
                    box-shadow: var(--shadow-xl);
                    animation: slideUp 0.2s ease;
                }
                
                .context-header {
                    padding: 0.75rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 0.5rem;
                }
                
                .mobile-context-menu .context-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.875rem;
                }
                
                .mobile-context-menu .context-item:active {
                    background: var(--primary-color);
                    color: white;
                    transform: scale(0.98);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add event listeners
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action) {
                this.handleMobileContextAction(action);
                contextMenu.remove();
            }
        });
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            if (contextMenu.parentNode) {
                contextMenu.remove();
            }
        }, 5000);
    }

    handleMobileContextAction(action) {
        switch (action) {
            case 'refresh':
                if (window.loadFlightData) {
                    window.loadFlightData();
                }
                break;
            case 'center':
                if (window.map) {
                    window.map.setView([39.8283, -98.5795], 6);
                }
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
            case 'close':
                // Close any open panels
                this.closeAllModals();
                break;
        }
        this.playSound('click');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {
                // Fallback for iOS Safari
                if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                }
            });
        } else {
            document.exitFullscreen();
        }
    }

    setupSoundSystem() {
        // Create audio context for premium sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {
            click: this.createTone(800, 0.1, 'sine'),
            hover: this.createTone(600, 0.05, 'sine'),
            notification: this.createTone([523, 659, 784], 0.3, 'sine'),
            alert: this.createTone([440, 330], 0.5, 'square'),
            success: this.createTone([523, 659, 784, 1047], 0.4, 'sine'),
            newFlight: this.createTone([392, 523], 0.2, 'triangle')
        };
        
        // Add sound toggle
        this.createSoundToggle();
    }

    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.soundEnabled) return;
            
            const frequencies = Array.isArray(frequency) ? frequency : [frequency];
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = type;
                    
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + duration);
                }, index * 100);
            });
        };
    }

    createSoundToggle() {
        const soundBtn = document.createElement('button');
        soundBtn.className = 'action-btn sound-toggle';
        soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        soundBtn.title = 'Toggle Sound Effects';
        
        soundBtn.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            soundBtn.innerHTML = this.soundEnabled 
                ? '<i class="fas fa-volume-up"></i>' 
                : '<i class="fas fa-volume-mute"></i>';
            soundBtn.classList.toggle('sound-enabled', this.soundEnabled);
            this.playSound('click');
        });
        
        document.querySelector('.header-actions').appendChild(soundBtn);
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    setupKeyboardShortcuts() {
        this.keyboardShortcuts.set('Space', () => this.togglePlayPause());
        this.keyboardShortcuts.set('KeyF', () => this.focusSearch());
        this.keyboardShortcuts.set('KeyM', () => this.toggleMiniMap());
        this.keyboardShortcuts.set('KeyW', () => this.toggleWeather());
        this.keyboardShortcuts.set('Key3', () => this.toggle3D());
        this.keyboardShortcuts.set('KeyA', () => this.toggleAirports());
        this.keyboardShortcuts.set('KeyT', () => this.toggleTracking());
        this.keyboardShortcuts.set('Escape', () => this.closeAllModals());
        this.keyboardShortcuts.set('ArrowUp', () => this.selectPreviousFlight());
        this.keyboardShortcuts.set('ArrowDown', () => this.selectNextFlight());

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            const handler = this.keyboardShortcuts.get(e.code);
            if (handler) {
                e.preventDefault();
                handler();
                this.playSound('click');
            }
        });

        // Show keyboard shortcuts help
        this.createShortcutsHelp();
    }

    createShortcutsHelp() {
        const helpBtn = document.createElement('button');
        helpBtn.className = 'action-btn';
        helpBtn.innerHTML = '<i class="fas fa-keyboard"></i>';
        helpBtn.title = 'Keyboard Shortcuts (?)';
        
        helpBtn.addEventListener('click', () => {
            this.showShortcutsModal();
            this.playSound('click');
        });
        
        document.querySelector('.header-actions').appendChild(helpBtn);
    }

    showShortcutsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal shortcuts-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Keyboard Shortcuts</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-grid">
                        <div class="shortcut-item">
                            <kbd>Space</kbd>
                            <span>Toggle auto-update</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>F</kbd>
                            <span>Focus search</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>3</kbd>
                            <span>Toggle 3D view</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>W</kbd>
                            <span>Toggle weather</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>A</kbd>
                            <span>Toggle airports</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>T</kbd>
                            <span>Track selected flight</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>M</kbd>
                            <span>Toggle mini map</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>Close modals/sidebar</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>↑↓</kbd>
                            <span>Navigate flights</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl+R</kbd>
                            <span>Refresh data</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Close handlers
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    setupAdvancedSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        // Add autocomplete functionality
        const suggestions = document.createElement('div');
        suggestions.className = 'search-suggestions';
        searchInput.parentNode.appendChild(suggestions);

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.showSearchSuggestions(e.target.value, suggestions);
            }, 300);
        });

        // Enhanced search with filters
        this.createAdvancedSearchPanel();
    }

    showSearchSuggestions(query, container) {
        if (!query || query.length < 2) {
            container.style.display = 'none';
            return;
        }

        const suggestions = this.generateSearchSuggestions(query);
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = suggestions.map(item => `
            <div class="suggestion-item" data-type="${item.type}" data-value="${item.value}">
                <i class="fas fa-${item.icon}"></i>
                <span class="suggestion-text">${item.text}</span>
                <span class="suggestion-type">${item.type}</span>
            </div>
        `).join('');

        container.style.display = 'block';

        // Add click handlers
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectSuggestion(item.dataset.type, item.dataset.value);
                container.style.display = 'none';
                this.playSound('click');
            });
        });
    }

    generateSearchSuggestions(query) {
        const suggestions = [];
        const q = query.toLowerCase();

        // Flight callsigns
        window.allFlights?.forEach(flight => {
            if (flight.callsign && flight.callsign.toLowerCase().includes(q)) {
                suggestions.push({
                    type: 'flight',
                    value: flight.icao24,
                    text: `${flight.callsign} - ${flight.originCountry}`,
                    icon: 'plane'
                });
            }
        });

        // Countries
        const countries = new Set(window.allFlights?.map(f => f.originCountry) || []);
        countries.forEach(country => {
            if (country.toLowerCase().includes(q)) {
                suggestions.push({
                    type: 'country',
                    value: country,
                    text: country,
                    icon: 'flag'
                });
            }
        });

        // Airlines (from callsigns)
        const airlines = ['UAL', 'DAL', 'AAL', 'SWA', 'JBU', 'UPS', 'FDX'];
        airlines.forEach(airline => {
            if (airline.toLowerCase().includes(q)) {
                suggestions.push({
                    type: 'airline',
                    value: airline,
                    text: `${airline} flights`,
                    icon: 'building'
                });
            }
        });

        return suggestions.slice(0, 8); // Limit results
    }

    selectSuggestion(type, value) {
        switch (type) {
            case 'flight':
                const flight = window.allFlights?.find(f => f.icao24 === value);
                if (flight) {
                    window.map.setView([flight.latitude, flight.longitude], 10);
                    window.showFlightDetails(flight);
                }
                break;
            case 'country':
                this.filterByCountry(value);
                break;
            case 'airline':
                this.filterByAirline(value);
                break;
        }
    }

    setupFlightFilters() {
        const filtersPanel = document.createElement('div');
        filtersPanel.className = 'filters-panel';
        filtersPanel.innerHTML = `
            <div class="filters-header">
                <h4>Flight Filters</h4>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="filters-content">
                <div class="filter-group">
                    <h5>Altitude Range</h5>
                    <div class="range-slider">
                        <input type="range" id="altitudeMin" min="0" max="15000" value="0">
                        <input type="range" id="altitudeMax" min="0" max="15000" value="15000">
                        <div class="range-labels">
                            <span>0 ft</span>
                            <span>50,000 ft</span>
                        </div>
                    </div>
                </div>
                
                <div class="filter-group">
                    <h5>Speed Range</h5>
                    <div class="range-slider">
                        <input type="range" id="speedMin" min="0" max="1000" value="0">
                        <input type="range" id="speedMax" min="0" max="1000" value="1000">
                        <div class="range-labels">
                            <span>0 km/h</span>
                            <span>1000 km/h</span>
                        </div>
                    </div>
                </div>

                <div class="filter-group">
                    <h5>Aircraft Type</h5>
                    <div class="checkbox-group">
                        <label><input type="checkbox" value="commercial" checked> Commercial</label>
                        <label><input type="checkbox" value="cargo" checked> Cargo</label>
                        <label><input type="checkbox" value="private" checked> Private</label>
                        <label><input type="checkbox" value="military"> Military</label>
                    </div>
                </div>

                <div class="filter-group">
                    <h5>Flight Status</h5>
                    <div class="checkbox-group">
                        <label><input type="checkbox" value="airborne" checked> Airborne</label>
                        <label><input type="checkbox" value="ground"> On Ground</label>
                    </div>
                </div>

                <div class="filter-actions">
                    <button class="btn-primary" id="applyFilters">Apply Filters</button>
                    <button class="btn-secondary" id="clearFilters">Clear All</button>
                </div>
            </div>
        `;

        // Add filter button to header
        const filtersBtn = document.createElement('button');
        filtersBtn.className = 'action-btn';
        filtersBtn.innerHTML = '<i class="fas fa-filter"></i>';
        filtersBtn.title = 'Flight Filters';
        
        filtersBtn.addEventListener('click', () => {
            document.body.appendChild(filtersPanel);
            filtersPanel.style.display = 'block';
            this.playSound('click');
        });
        
        document.querySelector('.header-actions').appendChild(filtersBtn);
    }

    setupViewPresets() {
        this.viewPresets.set('worldwide', {
            center: [20, 0],
            zoom: 3,
            name: 'Worldwide View'
        });
        
        this.viewPresets.set('usa', {
            center: [39.8283, -98.5795],
            zoom: 5,
            name: 'United States'
        });
        
        this.viewPresets.set('europe', {
            center: [54.5260, 15.2551],
            zoom: 5,
            name: 'Europe'
        });
        
        this.viewPresets.set('asia', {
            center: [35.0, 105.0],
            zoom: 4,
            name: 'Asia'
        });

        // Create preset selector
        const presetsBtn = document.createElement('div');
        presetsBtn.className = 'view-presets';
        presetsBtn.innerHTML = `
            <button class="action-btn preset-toggle">
                <i class="fas fa-globe-americas"></i>
            </button>
            <div class="presets-dropdown">
                ${Array.from(this.viewPresets.entries()).map(([key, preset]) => 
                    `<div class="preset-item" data-preset="${key}">
                        <i class="fas fa-map-marked-alt"></i>
                        <span>${preset.name}</span>
                    </div>`
                ).join('')}
            </div>
        `;

        document.querySelector('.header-actions').appendChild(presetsBtn);

        // Add event listeners
        presetsBtn.querySelector('.preset-toggle').addEventListener('click', () => {
            presetsBtn.classList.toggle('open');
            this.playSound('click');
        });

        presetsBtn.querySelectorAll('.preset-item').forEach(item => {
            item.addEventListener('click', () => {
                const preset = this.viewPresets.get(item.dataset.preset);
                window.map.setView(preset.center, preset.zoom);
                presetsBtn.classList.remove('open');
                this.playSound('success');
                window.showNotification(`Switched to ${preset.name}`, 'success');
            });
        });
    }

    setupFlightAlerts() {
        // Create alerts panel
        const alertsBtn = document.createElement('button');
        alertsBtn.className = 'action-btn alerts-btn';
        alertsBtn.innerHTML = '<i class="fas fa-bell"></i>';
        alertsBtn.title = 'Flight Alerts';
        
        alertsBtn.addEventListener('click', () => {
            this.showAlertsPanel();
            this.playSound('click');
        });
        
        document.querySelector('.header-actions').appendChild(alertsBtn);

        // Monitor for interesting events
        this.startFlightMonitoring();
    }

    startFlightMonitoring() {
        setInterval(() => {
            if (!window.allFlights) return;

            // Check for emergency squawks
            window.allFlights.forEach(flight => {
                if (flight.squawk === '7700' || flight.squawk === '7600' || flight.squawk === '7500') {
                    this.triggerAlert('emergency', `Emergency squawk detected: ${flight.callsign || 'Unknown'} (${flight.squawk})`);
                }
                
                // Check for unusual altitudes
                if (flight.baroAltitude && flight.baroAltitude > 13000 && !flight.onGround) {
                    const key = `high_alt_${flight.icao24}`;
                    if (!this.flightAlerts.has(key)) {
                        this.flightAlerts.set(key, Date.now());
                        this.triggerAlert('info', `High altitude flight: ${flight.callsign || 'Unknown'} at ${Math.round(flight.baroAltitude)}m`);
                    }
                }
            });
        }, 30000); // Check every 30 seconds
    }

    triggerAlert(type, message) {
        this.playSound(type === 'emergency' ? 'alert' : 'notification');
        
        const alert = document.createElement('div');
        alert.className = `flight-alert alert-${type}`;
        alert.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-${type === 'emergency' ? 'exclamation-triangle' : 'info-circle'}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-message">${message}</div>
                <div class="alert-time">${new Date().toLocaleTimeString()}</div>
            </div>
            <button class="alert-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        const container = document.getElementById('notificationContainer');
        container.appendChild(alert);

        // Auto remove after 10 seconds
        setTimeout(() => {
            alert.remove();
        }, 10000);

        // Close button
        alert.querySelector('.alert-close').addEventListener('click', () => {
            alert.remove();
        });
    }

    setupPremiumAnimations() {
        // Parallax effect for background elements
        window.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            document.querySelectorAll('.stats-panel, .advanced-controls').forEach(el => {
                el.style.transform = `translate(${x * 5}px, ${y * 5}px)`;
            });
        });

        // Smooth hover animations for all interactive elements
        document.querySelectorAll('button, .control-btn, .action-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.playSound('hover');
                if (window.gsap) {
                    gsap.to(btn, { scale: 1.05, duration: 0.2, ease: "power2.out" });
                }
            });
            
            btn.addEventListener('mouseleave', () => {
                if (window.gsap) {
                    gsap.to(btn, { scale: 1, duration: 0.2, ease: "power2.out" });
                }
            });
        });

        // Stagger animations for flight markers
        if (window.gsap) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.classList && node.classList.contains('flight-marker')) {
                            gsap.from(node, {
                                scale: 0,
                                opacity: 0,
                                duration: 0.5,
                                ease: "back.out(1.7)"
                            });
                        }
                    });
                });
            });

            observer.observe(document.getElementById('map'), {
                childList: true,
                subtree: true
            });
        }
    }

    setupContextMenus() {
        // Right-click context menu for flights
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.flight-marker')) {
                e.preventDefault();
                this.showFlightContextMenu(e);
            }
        });
    }

    showFlightContextMenu(event) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-item" data-action="track">
                <i class="fas fa-crosshairs"></i>
                <span>Track Flight</span>
            </div>
            <div class="context-item" data-action="share">
                <i class="fas fa-share-alt"></i>
                <span>Share Flight</span>
            </div>
            <div class="context-item" data-action="alert">
                <i class="fas fa-bell"></i>
                <span>Set Alert</span>
            </div>
            <div class="context-item" data-action="details">
                <i class="fas fa-info-circle"></i>
                <span>View Details</span>
            </div>
        `;

        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';
        
        document.body.appendChild(menu);

        // Handle menu clicks
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action && window.selectedFlight) {
                this.handleContextAction(action, window.selectedFlight);
            }
            menu.remove();
        });

        // Remove menu on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }

    handleContextAction(action, flight) {
        switch (action) {
            case 'track':
                if (window.advancedFeatures) {
                    window.advancedFeatures.trackFlight(flight);
                }
                break;
            case 'share':
                if (window.advancedFeatures) {
                    window.advancedFeatures.shareFlight();
                }
                break;
            case 'alert':
                this.createFlightAlert(flight);
                break;
            case 'details':
                window.showFlightDetails(flight);
                break;
        }
        this.playSound('click');
    }

    setupTooltips() {
        // Enhanced tooltips with rich content
        document.querySelectorAll('[title]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.title);
                e.target.title = ''; // Remove default tooltip
            });
        });
    }

    showTooltip(element, content) {
        const tooltip = document.createElement('div');
        tooltip.className = 'premium-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">${content}</div>
            <div class="tooltip-arrow"></div>
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        
        setTimeout(() => tooltip.remove(), 2000);
    }

    // Utility methods for keyboard shortcuts
    togglePlayPause() {
        // Toggle auto-update
        if (window.updateInterval) {
            clearInterval(window.updateInterval);
            window.updateInterval = null;
            window.showNotification('Auto-update paused', 'info');
        } else {
            window.startAutoUpdate();
            window.showNotification('Auto-update resumed', 'success');
        }
    }

    focusSearch() {
        document.getElementById('searchInput').focus();
    }

    toggleMiniMap() {
        if (window.advancedFeatures) {
            window.advancedFeatures.toggleMiniMap();
        }
    }

    toggleWeather() {
        if (window.weatherSystem) {
            window.weatherSystem.toggleWeatherOverlay();
        }
    }

    toggle3D() {
        if (window.advancedFeatures) {
            window.advancedFeatures.toggle3DView();
        }
    }

    toggleAirports() {
        if (window.advancedFeatures) {
            window.advancedFeatures.toggleAirports();
        }
    }

    toggleTracking() {
        if (window.selectedFlight && window.advancedFeatures) {
            window.advancedFeatures.trackFlight(window.selectedFlight);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal, .sidebar.open').forEach(el => {
            if (el.classList.contains('sidebar')) {
                window.closeSidebar();
            } else {
                el.style.display = 'none';
            }
        });
    }

    selectPreviousFlight() {
        // Implement flight navigation
        const visibleFlights = window.allFlights?.filter(f => f.latitude && f.longitude) || [];
        if (visibleFlights.length === 0) return;
        
        const currentIndex = window.selectedFlight ? 
            visibleFlights.findIndex(f => f.icao24 === window.selectedFlight.icao24) : -1;
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : visibleFlights.length - 1;
        
        const flight = visibleFlights[prevIndex];
        window.map.setView([flight.latitude, flight.longitude], 10);
        window.showFlightDetails(flight);
    }

    selectNextFlight() {
        const visibleFlights = window.allFlights?.filter(f => f.latitude && f.longitude) || [];
        if (visibleFlights.length === 0) return;
        
        const currentIndex = window.selectedFlight ? 
            visibleFlights.findIndex(f => f.icao24 === window.selectedFlight.icao24) : -1;
        const nextIndex = currentIndex < visibleFlights.length - 1 ? currentIndex + 1 : 0;
        
        const flight = visibleFlights[nextIndex];
        window.map.setView([flight.latitude, flight.longitude], 10);
        window.showFlightDetails(flight);
    }

    // Performance monitoring
    getPerformanceStats() {
        return {
            notifications: this.notifications.length,
            activeFilters: this.activeFilters.size,
            soundEnabled: this.soundEnabled,
            viewPresets: this.viewPresets.size,
            flightAlerts: this.flightAlerts.size
        };
    }
}

// Initialize Premium UI
window.premiumUI = null;

document.addEventListener('DOMContentLoaded', function() {
    window.premiumUI = new PremiumUI();
});

// Export for global access
window.PremiumUI = PremiumUI;