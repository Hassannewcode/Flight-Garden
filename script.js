// Global variables
let map;
let flightMarkers = [];
let allFlights = [];
let selectedFlight = null;
let updateInterval;
let isLoading = false;
let performanceMonitor = new Map();
let flightHistory = new Map();
let connectionStatus = 'online';
let retryCount = 0;
let maxRetries = 3;

// Enhanced Configuration
const CONFIG = {
    updateInterval: 10000, // 10 seconds
    maxFlights: 1500, // Increased limit for better coverage
    defaultZoom: 6,
    defaultCenter: [39.8283, -98.5795], // Center of USA
    apiUrl: 'https://opensky-network.org/api/states/all',
    corsProxy: 'https://corsproxy.io/?', // CORS proxy for API calls
    minZoomForFlights: 3, // Lower threshold for better visibility
    performanceMode: 'auto', // auto, high, medium, low
    cacheTimeout: 300000, // 5 minutes cache
    animationDuration: 500,
    trackingEnabled: true,
    predictiveUpdates: true,
    offlineMode: false
};

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            updateTime: 0,
            memoryUsage: 0,
            fps: 0,
            apiResponseTime: 0
        };
        this.startTime = Date.now();
        this.frameCount = 0;
        this.lastFrameTime = Date.now();
    }

    recordMetric(name, value) {
        this.metrics[name] = value;
        this.updatePerformanceDisplay();
    }

    startTiming(operation) {
        return Date.now();
    }

    endTiming(operation, startTime) {
        const duration = Date.now() - startTime;
        this.recordMetric(operation, duration);
        return duration;
    }

    updateFPS() {
        this.frameCount++;
        const currentTime = Date.now();
        if (currentTime - this.lastFrameTime >= 1000) {
            this.metrics.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
        }
    }

    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            };
        }
        return null;
    }

    updatePerformanceDisplay() {
        const memory = this.getMemoryUsage();
        if (memory) {
            this.recordMetric('memoryUsage', memory.used);
        }
        
        // Update performance indicator in UI if exists
        const perfIndicator = document.getElementById('performanceIndicator');
        if (perfIndicator) {
            const status = this.getPerformanceStatus();
            perfIndicator.className = `performance-indicator ${status}`;
            perfIndicator.title = `Performance: ${status.toUpperCase()}\nFPS: ${this.metrics.fps}\nMemory: ${memory ? memory.used + 'MB' : 'N/A'}`;
        }
    }

    getPerformanceStatus() {
        if (this.metrics.fps > 50 && this.metrics.memoryUsage < 100) return 'excellent';
        if (this.metrics.fps > 30 && this.metrics.memoryUsage < 200) return 'good';
        if (this.metrics.fps > 15 && this.metrics.memoryUsage < 300) return 'fair';
        return 'poor';
    }
}

// Initialize performance monitor
const perfMonitor = new PerformanceMonitor();

// Enhanced flight data cache
class FlightDataCache {
    constructor() {
        this.cache = new Map();
        this.lastUpdate = 0;
        this.maxAge = CONFIG.cacheTimeout;
    }

    set(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    get(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.maxAge) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

const flightCache = new FlightDataCache();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    const initStart = perfMonitor.startTiming('initialization');
    
    initializeMap();
    setupEventListeners();
    setupModalEventListeners();
    setupPerformanceMonitoring();
    setupAdvancedFeatures();
    loadFlightData();
    startAutoUpdate();
    checkUrlParameters();
    setupOfflineSupport();
    
    perfMonitor.endTiming('initialization', initStart);
    showNotification('SkyTracker Pro initialized successfully! 🚀', 'success');
});

// Setup performance monitoring UI
function setupPerformanceMonitoring() {
    // Add performance indicator to header
    const perfIndicator = document.createElement('div');
    perfIndicator.id = 'performanceIndicator';
    perfIndicator.className = 'performance-indicator good';
    perfIndicator.innerHTML = '<i class="fas fa-tachometer-alt"></i>';
    
    const headerActions = document.querySelector('.header-actions');
    headerActions.appendChild(perfIndicator);
    
    // Add detailed performance panel
    const perfPanel = document.createElement('div');
    perfPanel.className = 'performance-panel';
    perfPanel.innerHTML = `
        <div class="performance-header">
            <h4>Performance Monitor</h4>
            <button class="close-btn" onclick="this.parentElement.parentElement.style.display='none'">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="performance-content">
            <div class="metric">
                <span class="metric-label">FPS:</span>
                <span class="metric-value" id="fpsValue">--</span>
            </div>
            <div class="metric">
                <span class="metric-label">Memory:</span>
                <span class="metric-value" id="memoryValue">--</span>
            </div>
            <div class="metric">
                <span class="metric-label">API Response:</span>
                <span class="metric-value" id="apiResponseValue">--</span>
            </div>
            <div class="metric">
                <span class="metric-label">Active Flights:</span>
                <span class="metric-value" id="activeFlightsValue">--</span>
            </div>
            <div class="metric">
                <span class="metric-label">Cache Size:</span>
                <span class="metric-value" id="cacheValue">--</span>
            </div>
        </div>
    `;
    document.body.appendChild(perfPanel);
    
    // Click handler for performance indicator
    perfIndicator.addEventListener('click', () => {
        perfPanel.style.display = perfPanel.style.display === 'block' ? 'none' : 'block';
    });
    
    // Update performance display every second
    setInterval(() => {
        perfMonitor.updateFPS();
        updatePerformancePanel();
    }, 1000);
}

function updatePerformancePanel() {
    document.getElementById('fpsValue').textContent = perfMonitor.metrics.fps || '--';
    document.getElementById('memoryValue').textContent = perfMonitor.metrics.memoryUsage ? `${perfMonitor.metrics.memoryUsage}MB` : '--';
    document.getElementById('apiResponseValue').textContent = perfMonitor.metrics.apiResponseTime ? `${perfMonitor.metrics.apiResponseTime}ms` : '--';
    document.getElementById('activeFlightsValue').textContent = allFlights.length || 0;
    document.getElementById('cacheValue').textContent = flightCache.size();
}

// Enhanced advanced features
function setupAdvancedFeatures() {
    // Flight prediction system
    setupFlightPrediction();
    
    // Real-time analytics
    setupRealTimeAnalytics();
    
    // Advanced filtering
    setupAdvancedFiltering();
    
    // Flight tracking
    setupFlightTracking();
    
    // Performance auto-tuning
    setupPerformanceAutoTuning();
}

function setupFlightPrediction() {
    window.flightPredictor = {
        predictPosition: function(flight, secondsAhead = 60) {
            if (!flight.velocity || !flight.trueTrack) return null;
            
            const speed = flight.velocity; // m/s
            const heading = flight.trueTrack * Math.PI / 180; // Convert to radians
            const distance = speed * secondsAhead; // meters
            
            // Calculate new position
            const deltaLat = (distance * Math.cos(heading)) / 111320; // Rough conversion
            const deltaLng = (distance * Math.sin(heading)) / (111320 * Math.cos(flight.latitude * Math.PI / 180));
            
            return {
                latitude: flight.latitude + deltaLat,
                longitude: flight.longitude + deltaLng,
                predictedTime: Date.now() + (secondsAhead * 1000)
            };
        },
        
        createPredictionTrail: function(flight) {
            const predictions = [];
            for (let i = 1; i <= 10; i++) {
                const pred = this.predictPosition(flight, i * 30); // 30-second intervals
                if (pred) predictions.push(pred);
            }
            return predictions;
        }
    };
}

function setupRealTimeAnalytics() {
    window.analytics = {
        trafficeMetrics: {
            peakHours: new Map(),
            busyRoutes: new Map(),
            altitudeDistribution: new Map(),
            speedAnalysis: new Map()
        },
        
        updateMetrics: function(flights) {
            const hour = new Date().getHours();
            this.trafficeMetrics.peakHours.set(hour, (this.trafficeMetrics.peakHours.get(hour) || 0) + flights.length);
            
            // Analyze altitude distribution
            flights.forEach(flight => {
                if (flight.baroAltitude) {
                    const altBand = Math.floor(flight.baroAltitude / 1000) * 1000;
                    this.trafficeMetrics.altitudeDistribution.set(altBand, 
                        (this.trafficeMetrics.altitudeDistribution.get(altBand) || 0) + 1);
                }
            });
        },
        
        generateReport: function() {
            return {
                peakHour: this.findPeakHour(),
                averageAltitude: this.calculateAverageAltitude(),
                totalFlights: allFlights.length,
                activeCountries: new Set(allFlights.map(f => f.originCountry)).size
            };
        },
        
        findPeakHour: function() {
            let maxHour = 0;
            let maxCount = 0;
            for (const [hour, count] of this.trafficeMetrics.peakHours) {
                if (count > maxCount) {
                    maxCount = count;
                    maxHour = hour;
                }
            }
            return maxHour;
        },
        
        calculateAverageAltitude: function() {
            const altitudes = allFlights.filter(f => f.baroAltitude && !f.onGround).map(f => f.baroAltitude);
            return altitudes.length > 0 ? altitudes.reduce((a, b) => a + b, 0) / altitudes.length : 0;
        }
    };
}

function setupAdvancedFiltering() {
    window.advancedFilter = {
        filters: {
            altitude: { min: 0, max: 50000 },
            speed: { min: 0, max: 1000 },
            countries: new Set(),
            aircraftTypes: new Set(['commercial', 'cargo', 'private', 'military']),
            onlyTracked: false,
            emergencyOnly: false
        },
        
        applyFilters: function(flights) {
            return flights.filter(flight => {
                // Altitude filter
                const alt = flight.baroAltitude || 0;
                if (alt < this.filters.altitude.min || alt > this.filters.altitude.max) return false;
                
                // Speed filter
                const speed = (flight.velocity || 0) * 3.6; // Convert to km/h
                if (speed < this.filters.speed.min || speed > this.filters.speed.max) return false;
                
                // Country filter
                if (this.filters.countries.size > 0 && !this.filters.countries.has(flight.originCountry)) return false;
                
                // Emergency filter
                if (this.filters.emergencyOnly && !['7700', '7600', '7500'].includes(flight.squawk)) return false;
                
                return true;
            });
        },
        
        updateFilters: function(newFilters) {
            Object.assign(this.filters, newFilters);
            this.refreshDisplay();
        },
        
        refreshDisplay: function() {
            const filteredFlights = this.applyFilters(allFlights);
            displayFlights(filteredFlights);
            showNotification(`Showing ${filteredFlights.length} of ${allFlights.length} flights`, 'info');
        }
    };
}

function setupFlightTracking() {
    window.flightTracker = {
        trackedFlights: new Set(),
        trackingData: new Map(),
        
        trackFlight: function(icao24) {
            this.trackedFlights.add(icao24);
            this.trackingData.set(icao24, {
                startTime: Date.now(),
                positions: [],
                alerts: []
            });
            showNotification(`Now tracking flight ${icao24}`, 'success');
        },
        
        untrackFlight: function(icao24) {
            this.trackedFlights.delete(icao24);
            this.trackingData.delete(icao24);
            showNotification(`Stopped tracking flight ${icao24}`, 'info');
        },
        
        updateTrackedFlights: function(flights) {
            flights.forEach(flight => {
                if (this.trackedFlights.has(flight.icao24)) {
                    const data = this.trackingData.get(flight.icao24);
                    data.positions.push({
                        lat: flight.latitude,
                        lng: flight.longitude,
                        alt: flight.baroAltitude,
                        time: Date.now()
                    });
                    
                    // Keep only last 100 positions
                    if (data.positions.length > 100) {
                        data.positions = data.positions.slice(-100);
                    }
                    
                    // Check for alerts
                    this.checkForAlerts(flight, data);
                }
            });
        },
        
        checkForAlerts: function(flight, data) {
            // Emergency squawk detection
            if (['7700', '7600', '7500'].includes(flight.squawk)) {
                data.alerts.push({
                    type: 'emergency',
                    message: `Emergency squawk ${flight.squawk} detected`,
                    time: Date.now()
                });
                this.showAlert(flight, `Emergency squawk ${flight.squawk}`, 'error');
            }
            
            // Rapid altitude change
            if (data.positions.length >= 2) {
                const current = data.positions[data.positions.length - 1];
                const previous = data.positions[data.positions.length - 2];
                const altChange = Math.abs(current.alt - previous.alt);
                const timeChange = (current.time - previous.time) / 1000; // seconds
                
                if (altChange > 1000 && timeChange < 60) { // 1000m in under 1 minute
                    this.showAlert(flight, 'Rapid altitude change detected', 'warning');
                }
            }
        },
        
        showAlert: function(flight, message, type) {
            const alertDiv = document.createElement('div');
            alertDiv.className = `flight-alert ${type}`;
            alertDiv.innerHTML = `
                <div class="alert-content">
                    <strong>${flight.callsign || flight.icao24}</strong>
                    <p>${message}</p>
                    <small>${new Date().toLocaleTimeString()}</small>
                </div>
                <button class="alert-close" onclick="this.parentElement.remove()">×</button>
            `;
            
            const container = document.getElementById('notificationContainer');
            container.appendChild(alertDiv);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 10000);
            
            // Play alert sound
            if (window.premiumUI) {
                window.premiumUI.playSound('alert');
            }
        }
    };
}

function setupPerformanceAutoTuning() {
    window.performanceTuner = {
        autoTuneEnabled: true,
        lastTuneTime: 0,
        tuneInterval: 30000, // 30 seconds
        
        autoTune: function() {
            if (!this.autoTuneEnabled || Date.now() - this.lastTuneTime < this.tuneInterval) return;
            
            const fps = perfMonitor.metrics.fps;
            const memory = perfMonitor.metrics.memoryUsage;
            
            // Reduce flight limit if performance is poor
            if (fps < 20 || memory > 300) {
                CONFIG.maxFlights = Math.max(500, CONFIG.maxFlights - 100);
                CONFIG.animationDuration = Math.max(200, CONFIG.animationDuration - 100);
                showNotification('Performance tuning: Reduced flight limit for better performance', 'info');
            }
            // Increase flight limit if performance is good
            else if (fps > 50 && memory < 150) {
                CONFIG.maxFlights = Math.min(2000, CONFIG.maxFlights + 100);
                CONFIG.animationDuration = Math.min(800, CONFIG.animationDuration + 100);
            }
            
            this.lastTuneTime = Date.now();
        },
        
        forceHighPerformance: function() {
            CONFIG.maxFlights = 2000;
            CONFIG.animationDuration = 800;
            CONFIG.updateInterval = 5000; // Faster updates
            showNotification('High performance mode enabled', 'success');
        },
        
        forceLowPerformance: function() {
            CONFIG.maxFlights = 300;
            CONFIG.animationDuration = 200;
            CONFIG.updateInterval = 15000; // Slower updates
            showNotification('Low performance mode enabled', 'info');
        }
    };
}

function setupOfflineSupport() {
    // Service worker for offline functionality
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
    
    // Network status monitoring
    window.addEventListener('online', () => {
        connectionStatus = 'online';
        showNotification('Connection restored - resuming live updates', 'success');
        loadFlightData();
    });
    
    window.addEventListener('offline', () => {
        connectionStatus = 'offline';
        showNotification('Offline mode - showing cached data', 'warning');
    });
}

// Setup modal event listeners
function setupModalEventListeners() {
    // Close modal buttons
    const closeModalBtns = document.querySelectorAll('.modal .close-btn');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Check URL parameters for shared flights
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const flightId = urlParams.get('flight');
    
    if (flightId) {
        // Wait for flights to load, then find and show the specific flight
        const checkForFlight = () => {
            const flight = allFlights.find(f => f.icao24 === flightId);
            if (flight) {
                map.setView([flight.latitude, flight.longitude], 10);
                showFlightDetails(flight);
                showNotification(`Viewing shared flight: ${flight.callsign || 'Unknown'}`, 'info');
            } else if (allFlights.length > 0) {
                showNotification('Shared flight not found or not currently active', 'warning');
            } else {
                // Retry in 2 seconds if flights haven't loaded yet
                setTimeout(checkForFlight, 2000);
            }
        };
        
        setTimeout(checkForFlight, 1000);
    }
}

// Initialize the Leaflet map
function initializeMap() {
    map = L.map('map', {
        center: CONFIG.defaultCenter,
        zoom: CONFIG.defaultZoom,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true, // Better performance for many markers
        maxZoom: 18,
        minZoom: 2
    });

    // Add tile layer with dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
        updateWhenIdle: true,
        keepBuffer: 2
    }).addTo(map);

    // Add attribution
    L.control.attribution({
        position: 'bottomright',
        prefix: false
    }).addAttribution('Flight data: OpenSky Network').addTo(map);

    // Map event listeners
    map.on('zoomend', function() {
        updateFlightVisibility();
        perfMonitor.updateFPS();
    });

    map.on('moveend', function() {
        updateStats();
        // Auto-tune performance based on visible area
        if (window.performanceTuner) {
            window.performanceTuner.autoTune();
        }
    });
    
    // Make map globally accessible
    window.map = map;
}

// Enhanced setup event listeners
function setupEventListeners() {
    // Search functionality with debouncing
    let searchTimeout;
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (e.target.value.length >= 2) {
                handleLiveSearch(e.target.value);
            }
        }, 300);
    });
    
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Header actions with enhanced feedback
    document.getElementById('refreshBtn').addEventListener('click', function() {
        this.style.transform = 'rotate(360deg)';
        this.disabled = true;
        setTimeout(() => {
            this.style.transform = '';
            this.disabled = false;
        }, 600);
        loadFlightData();
    });

    // Map controls with smooth animations
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        map.setZoom(map.getZoom() + 1, { animate: true, duration: CONFIG.animationDuration });
    });
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        map.setZoom(map.getZoom() - 1, { animate: true, duration: CONFIG.animationDuration });
    });
    document.getElementById('centerBtn').addEventListener('click', () => {
        map.setView(CONFIG.defaultCenter, CONFIG.defaultZoom, { animate: true, duration: CONFIG.animationDuration });
    });
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

    // Sidebar controls
    document.getElementById('closeSidebar').addEventListener('click', closeSidebar);

    // Enhanced keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Don't trigger shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case 'Escape':
                closeSidebar();
                break;
            case 'r':
                if (e.ctrlKey) {
                    e.preventDefault();
                    loadFlightData();
                }
                break;
            case 'f':
                if (e.ctrlKey) {
                    e.preventDefault();
                    document.getElementById('searchInput').focus();
                }
                break;
            case '=':
            case '+':
                e.preventDefault();
                map.zoomIn();
                break;
            case '-':
                e.preventDefault();
                map.zoomOut();
                break;
        }
    });
}

// Enhanced flight data loading with caching and better error handling
async function loadFlightData() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);
    const loadStart = perfMonitor.startTiming('apiResponseTime');

    try {
        // Check cache first if offline or recent data available
        const cachedData = flightCache.get('flights');
        if (connectionStatus === 'offline' && cachedData) {
            allFlights = cachedData;
            displayFlights();
            updateStats();
            showNotification('Showing cached flight data (offline mode)', 'warning');
            return;
        }

        const response = await fetch(`${CONFIG.corsProxy}${CONFIG.apiUrl}`, {
            signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.states && data.states.length > 0) {
            allFlights = data.states.map(state => parseFlightData(state));
            
            // Cache the data
            flightCache.set('flights', allFlights);
            
            // Update analytics
            if (window.analytics) {
                window.analytics.updateMetrics(allFlights);
            }
            
            // Update tracked flights
            if (window.flightTracker) {
                window.flightTracker.updateTrackedFlights(allFlights);
            }
            
            displayFlights();
            updateStats();
            
            // Reset retry count on success
            retryCount = 0;
            
            const flightCount = allFlights.length;
            const airborneCount = allFlights.filter(f => !f.onGround).length;
            showNotification(`✈️ ${airborneCount} airborne flights (${flightCount} total)`, 'success');
            
        } else {
            throw new Error('No flight data received from API');
        }
    } catch (error) {
        console.error('Error loading flight data:', error);
        retryCount++;
        
        let errorMessage = 'Failed to load flight data';
        if (error.name === 'TimeoutError') {
            errorMessage = 'Request timeout - server may be busy';
        } else if (error.message.includes('HTTP error')) {
            errorMessage = `Server error: ${error.message}`;
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Network connection failed';
        }
        
        showNotification(`${errorMessage}. Retry ${retryCount}/${maxRetries}`, 'error');
        
        // Progressive retry with exponential backoff
        if (retryCount < maxRetries) {
            const retryDelay = Math.min(5000 * Math.pow(2, retryCount - 1), 30000); // Max 30 seconds
            setTimeout(() => {
                if (!isLoading) loadFlightData();
            }, retryDelay);
        } else {
            // Max retries reached, show cached data if available
            const cachedData = flightCache.get('flights');
            if (cachedData) {
                allFlights = cachedData;
                displayFlights();
                updateStats();
                showNotification('Max retries reached. Showing cached data.', 'warning');
            }
            retryCount = 0; // Reset for next cycle
        }
    } finally {
        isLoading = false;
        showLoading(false);
        perfMonitor.endTiming('apiResponseTime', loadStart);
    }
}

// Parse flight data from OpenSky format
function parseFlightData(state) {
    return {
        icao24: state[0],
        callsign: state[1] ? state[1].trim() : null,
        originCountry: state[2],
        timePosition: state[3],
        lastContact: state[4],
        longitude: state[5],
        latitude: state[6],
        baroAltitude: state[7],
        onGround: state[8],
        velocity: state[9],
        trueTrack: state[10],
        verticalRate: state[11],
        sensors: state[12],
        geoAltitude: state[13],
        squawk: state[14],
        spi: state[15],
        positionSource: state[16]
    };
}

// Enhanced display flights with performance optimization and filtering
function displayFlights(flights = null) {
    const renderStart = perfMonitor.startTiming('renderTime');
    
    // Use provided flights or all flights
    const sourceFlights = flights || allFlights;
    
    // Clear existing markers efficiently
    flightMarkers.forEach(marker => {
        map.removeLayer(marker);
        // Clean up marker data to prevent memory leaks
        if (marker.flightData) {
            delete marker.flightData;
        }
    });
    flightMarkers = [];

    // Filter flights with valid coordinates and apply advanced filters
    let validFlights = sourceFlights.filter(flight => 
        flight.latitude !== null && 
        flight.longitude !== null &&
        Math.abs(flight.latitude) <= 90 &&
        Math.abs(flight.longitude) <= 180 &&
        !isNaN(flight.latitude) &&
        !isNaN(flight.longitude)
    );
    
    // Apply advanced filters if available
    if (window.advancedFilter) {
        validFlights = window.advancedFilter.applyFilters(validFlights);
    }

    // Limit number of flights for performance (with smart prioritization)
    const flightsToShow = prioritizeFlights(validFlights).slice(0, CONFIG.maxFlights);

    // Batch marker creation for better performance
    const markers = [];
    flightsToShow.forEach(flight => {
        const marker = createFlightMarker(flight);
        if (marker) {
            markers.push(marker);
        }
    });
    
    // Add markers to map in batches to prevent UI blocking
    const batchSize = 50;
    let batchIndex = 0;
    
    const addBatch = () => {
        const batch = markers.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
        batch.forEach(marker => {
            flightMarkers.push(marker);
            marker.addTo(map);
        });
        
        batchIndex++;
        if (batchIndex * batchSize < markers.length) {
            // Schedule next batch
            requestAnimationFrame(addBatch);
        } else {
            // All markers added, finalize
            updateFlightVisibility();
            perfMonitor.endTiming('renderTime', renderStart);
            
            // Update performance metrics
            perfMonitor.recordMetric('activeMarkers', flightMarkers.length);
        }
    };
    
    // Start batch processing
    if (markers.length > 0) {
        addBatch();
    } else {
        perfMonitor.endTiming('renderTime', renderStart);
    }
    
    // Update other systems
    updateConnectedSystems(validFlights);
    
    // Update display statistics
    updateDisplayStats(flightsToShow, validFlights);
}

// Prioritize flights for display based on importance
function prioritizeFlights(flights) {
    return flights.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        
        // Priority for tracked flights
        if (window.flightTracker && window.flightTracker.trackedFlights.has(a.icao24)) scoreA += 1000;
        if (window.flightTracker && window.flightTracker.trackedFlights.has(b.icao24)) scoreB += 1000;
        
        // Priority for emergency squawks
        if (['7700', '7600', '7500'].includes(a.squawk)) scoreA += 500;
        if (['7700', '7600', '7500'].includes(b.squawk)) scoreB += 500;
        
        // Priority for higher altitudes (more interesting)
        scoreA += (a.baroAltitude || 0) / 1000;
        scoreB += (b.baroAltitude || 0) / 1000;
        
        // Priority for faster flights
        scoreA += (a.velocity || 0) / 10;
        scoreB += (b.velocity || 0) / 10;
        
        return scoreB - scoreA;
    });
}

// Update connected systems efficiently
function updateConnectedSystems(validFlights) {
    // Update 3D engine if available
    if (window.skyTracker3D && window.skyTracker3D.updateFlights) {
        window.skyTracker3D.updateFlights(validFlights);
    }
    
    // Update weather data for flights if enabled
    if (window.weatherSystem && window.weatherSystem.isEnabled) {
        window.weatherSystem.updateFlightWeatherData(validFlights);
    }
    
    // Update advanced features
    if (window.advancedFeatures && window.advancedFeatures.updateFlights) {
        window.advancedFeatures.updateFlights(validFlights);
    }
}

// Update display statistics
function updateDisplayStats(displayedFlights, totalFlights) {
    const stats = {
        displayed: displayedFlights.length,
        total: totalFlights.length,
        airborne: displayedFlights.filter(f => !f.onGround).length,
        countries: new Set(displayedFlights.map(f => f.originCountry)).size
    };
    
    // Update UI elements if they exist
    const displayInfo = document.getElementById('displayInfo');
    if (displayInfo) {
        displayInfo.textContent = `Showing ${stats.displayed} of ${stats.total} flights`;
    }
}

// Create a flight marker
function createFlightMarker(flight) {
    if (!flight.latitude || !flight.longitude) return null;

    const isGrounded = flight.onGround;
    const rotation = flight.trueTrack || 0;
    
    // Create custom icon
    const icon = L.divIcon({
        className: 'flight-marker',
        html: `
            <div class="flight-icon ${isGrounded ? 'grounded' : 'airborne'}" 
                 style="transform: rotate(${rotation}deg)">
                <i class="fas fa-plane"></i>
            </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const marker = L.marker([flight.latitude, flight.longitude], { icon })
        .bindPopup(createFlightPopup(flight), {
            className: 'flight-popup',
            offset: [0, -10]
        });

    // Add click event
    marker.on('click', function() {
        selectedFlight = flight;
        showFlightDetails(flight);
    });

    // Store flight data with marker
    marker.flightData = flight;

    return marker;
}

// Create flight popup content
function createFlightPopup(flight) {
    const callsign = flight.callsign || 'Unknown';
    const altitude = flight.baroAltitude ? Math.round(flight.baroAltitude) + 'm' : 'N/A';
    const velocity = flight.velocity ? Math.round(flight.velocity * 3.6) + ' km/h' : 'N/A';
    const status = flight.onGround ? 'On Ground' : 'Airborne';

    return `
        <div class="flight-popup">
            <h4 class="callsign">${callsign}</h4>
            <p><strong>Country:</strong> ${flight.originCountry}</p>
            <p><strong>Altitude:</strong> ${altitude}</p>
            <p><strong>Speed:</strong> ${velocity}</p>
            <p><strong>Status:</strong> ${status}</p>
        </div>
    `;
}

// Show flight details in sidebar
function showFlightDetails(flight) {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('sidebarContent');
    
    content.innerHTML = createFlightDetailsHTML(flight);
    sidebar.classList.add('open');
    
    // Store globally for other systems
    window.selectedFlight = flight;
}

// Make showFlightDetails globally accessible
window.showFlightDetails = showFlightDetails;

// Create flight details HTML
function createFlightDetailsHTML(flight) {
    const callsign = flight.callsign || 'Unknown';
    const altitude = flight.baroAltitude ? Math.round(flight.baroAltitude) + ' m' : 'N/A';
    const geoAltitude = flight.geoAltitude ? Math.round(flight.geoAltitude) + ' m' : 'N/A';
    const velocity = flight.velocity ? Math.round(flight.velocity * 3.6) + ' km/h' : 'N/A';
    const verticalRate = flight.verticalRate ? flight.verticalRate.toFixed(1) + ' m/s' : 'N/A';
    const track = flight.trueTrack ? Math.round(flight.trueTrack) + '°' : 'N/A';
    const squawk = flight.squawk || 'N/A';
    const lastContact = flight.lastContact ? new Date(flight.lastContact * 1000).toLocaleString() : 'N/A';

    return `
        <div class="flight-details">
            <div class="flight-header">
                <div class="flight-icon">
                    <i class="fas fa-plane"></i>
                </div>
                <div class="flight-info">
                    <h4>${callsign}</h4>
                    <p>${flight.originCountry}</p>
                </div>
            </div>

            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="status-badge ${flight.onGround ? 'status-ground' : 'status-airborne'}">
                            ${flight.onGround ? 'On Ground' : 'Airborne'}
                        </span>
                    </div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">ICAO24</div>
                    <div class="detail-value">${flight.icao24.toUpperCase()}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Coordinates</div>
                    <div class="detail-value">${flight.latitude.toFixed(4)}, ${flight.longitude.toFixed(4)}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Barometric Altitude</div>
                    <div class="detail-value">${altitude}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Geometric Altitude</div>
                    <div class="detail-value">${geoAltitude}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Ground Speed</div>
                    <div class="detail-value">${velocity}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">True Track</div>
                    <div class="detail-value">${track}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Vertical Rate</div>
                    <div class="detail-value">${verticalRate}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Squawk</div>
                    <div class="detail-value">${squawk}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Last Contact</div>
                    <div class="detail-value">${lastContact}</div>
                </div>
            </div>
        </div>
    `;
}

// Close sidebar
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    selectedFlight = null;
    window.selectedFlight = null;
}

// Enhanced search functionality with live search
function handleLiveSearch(query) {
    if (!query || query.length < 2) return;
    
    const matchingFlights = allFlights.filter(flight => {
        const callsign = (flight.callsign || '').toLowerCase();
        const country = flight.originCountry.toLowerCase();
        const icao = flight.icao24.toLowerCase();
        
        return callsign.includes(query.toLowerCase()) || 
               country.includes(query.toLowerCase()) || 
               icao.includes(query.toLowerCase());
    });
    
    // Update search suggestions if premium UI is available
    if (window.premiumUI && window.premiumUI.updateSearchSuggestions) {
        window.premiumUI.updateSearchSuggestions(matchingFlights.slice(0, 5));
    }
}

// Handle search functionality
function handleSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) return;

    const searchStart = perfMonitor.startTiming('searchTime');
    
    const matchingFlights = allFlights.filter(flight => {
        const callsign = (flight.callsign || '').toLowerCase();
        const country = flight.originCountry.toLowerCase();
        const icao = flight.icao24.toLowerCase();
        
        return callsign.includes(query) || 
               country.includes(query) || 
               icao.includes(query);
    });

    perfMonitor.endTiming('searchTime', searchStart);

    if (matchingFlights.length > 0) {
        const flight = matchingFlights[0];
        
        // Smooth zoom animation to flight
        map.flyTo([flight.latitude, flight.longitude], 10, {
            animate: true,
            duration: 1.5
        });
        
        // Highlight the flight marker
        setTimeout(() => {
            showFlightDetails(flight);
            highlightFlightMarker(flight);
        }, 1000);
        
        showNotification(`🔍 Found ${matchingFlights.length} matching flight(s)`, 'success');
        
        // Track search analytics
        if (window.analytics) {
            window.analytics.recordSearch(query, matchingFlights.length);
        }
    } else {
        showNotification('❌ No flights found matching your search', 'warning');
        
        // Suggest similar searches
        const suggestions = generateSearchSuggestions(query);
        if (suggestions.length > 0) {
            showNotification(`💡 Try searching for: ${suggestions.join(', ')}`, 'info');
        }
    }
}

// Generate search suggestions based on available data
function generateSearchSuggestions(query) {
    const suggestions = [];
    const countries = [...new Set(allFlights.map(f => f.originCountry))];
    const airlines = [...new Set(allFlights.map(f => (f.callsign || '').substring(0, 3)).filter(Boolean))];
    
    // Find similar countries
    countries.forEach(country => {
        if (country.toLowerCase().includes(query.substring(0, 2))) {
            suggestions.push(country);
        }
    });
    
    // Find similar airlines
    airlines.forEach(airline => {
        if (airline.toLowerCase().includes(query.substring(0, 2))) {
            suggestions.push(airline);
        }
    });
    
    return suggestions.slice(0, 3);
}

// Highlight flight marker with animation
function highlightFlightMarker(flight) {
    const marker = flightMarkers.find(m => m.flightData && m.flightData.icao24 === flight.icao24);
    if (marker && marker.getElement) {
        const element = marker.getElement();
        element.classList.add('highlighted');
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
            element.classList.remove('highlighted');
        }, 3000);
    }
}

// Update flight visibility based on zoom level
function updateFlightVisibility() {
    const currentZoom = map.getZoom();
    const showFlights = currentZoom >= CONFIG.minZoomForFlights;

    flightMarkers.forEach(marker => {
        if (showFlights) {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
}

// Update statistics
function updateStats() {
    const bounds = map.getBounds();
    const visibleFlights = allFlights.filter(flight => 
        flight.latitude && flight.longitude &&
        bounds.contains([flight.latitude, flight.longitude])
    );

    const countries = new Set(allFlights.map(f => f.originCountry)).size;
    const airborne = allFlights.filter(f => !f.onGround).length;
    
    // Calculate average altitude
    const altitudes = allFlights
        .filter(f => f.baroAltitude && !f.onGround)
        .map(f => f.baroAltitude);
    const avgAltitude = altitudes.length > 0 
        ? Math.round(altitudes.reduce((a, b) => a + b, 0) / altitudes.length)
        : 0;

    document.getElementById('totalFlights').textContent = airborne.toLocaleString();
    document.getElementById('totalAirports').textContent = visibleFlights.length.toLocaleString();
    document.getElementById('totalCountries').textContent = countries.toLocaleString();
    
    // Update average altitude if element exists
    const avgAltElement = document.getElementById('avgAltitude');
    if (avgAltElement) {
        avgAltElement.textContent = avgAltitude > 0 ? `${(avgAltitude / 1000).toFixed(1)}k ft` : '---';
    }
    
    // Update mini map if available
    if (window.advancedFeatures) {
        window.advancedFeatures.updateMiniMap();
    }
}

// Start auto-update
function startAutoUpdate() {
    updateInterval = setInterval(() => {
        if (!isLoading) {
            loadFlightData();
        }
    }, CONFIG.updateInterval);
}

// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => container.removeChild(notification), 300);
    }, 4000);
}

// Toggle fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Add custom CSS for flight markers
const style = document.createElement('style');
style.textContent = `
    .flight-marker {
        background: transparent !important;
        border: none !important;
    }
    
    .flight-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .flight-icon.airborne {
        background: #3b82f6;
        color: white;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    }
    
    .flight-icon.grounded {
        background: #64748b;
        color: white;
        box-shadow: 0 0 10px rgba(100, 116, 139, 0.5);
    }
    
    .flight-icon:hover {
        transform: scale(1.3);
        z-index: 1000;
    }
    
    .flight-icon i {
        font-size: 12px;
    }
`;
document.head.appendChild(style);

// Handle visibility change
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        clearInterval(updateInterval);
    } else {
        startAutoUpdate();
        loadFlightData();
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (map) {
        map.invalidateSize();
    }
});

// Error handling for uncaught errors
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    showNotification('An error occurred. Please refresh the page.', 'error');
});