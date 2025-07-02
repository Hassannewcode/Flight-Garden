// Global variables
let map;
let flightMarkers = [];
let allFlights = [];
let selectedFlight = null;
let updateInterval;
let isLoading = false;

// Configuration
const CONFIG = {
    updateInterval: 10000, // 10 seconds
    maxFlights: 1000, // Limit for performance
    defaultZoom: 6,
    defaultCenter: [39.8283, -98.5795], // Center of USA
    apiUrl: 'https://opensky-network.org/api/states/all',
    corsProxy: 'https://corsproxy.io/?', // CORS proxy for API calls
    minZoomForFlights: 4
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    loadFlightData();
    startAutoUpdate();
    showNotification('Welcome to SkyTracker Pro! 🛩️', 'success');
});

// Initialize the Leaflet map
function initializeMap() {
    map = L.map('map', {
        center: CONFIG.defaultCenter,
        zoom: CONFIG.defaultZoom,
        zoomControl: false,
        attributionControl: false
    });

    // Add tile layer with dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Add attribution
    L.control.attribution({
        position: 'bottomright',
        prefix: false
    }).addAttribution('Flight data: OpenSky Network').addTo(map);

    // Map event listeners
    map.on('zoomend', function() {
        updateFlightVisibility();
    });

    map.on('moveend', function() {
        updateStats();
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Header actions
    document.getElementById('refreshBtn').addEventListener('click', function() {
        this.style.transform = 'rotate(360deg)';
        setTimeout(() => this.style.transform = '', 600);
        loadFlightData();
    });

    // Map controls
    document.getElementById('zoomInBtn').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoomOutBtn').addEventListener('click', () => map.zoomOut());
    document.getElementById('centerBtn').addEventListener('click', () => {
        map.setView(CONFIG.defaultCenter, CONFIG.defaultZoom);
    });
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

    // Sidebar controls
    document.getElementById('closeSidebar').addEventListener('click', closeSidebar);

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar.contains(e.target) && !e.target.closest('.flight-marker')) {
            closeSidebar();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSidebar();
        } else if (e.key === 'r' && e.ctrlKey) {
            e.preventDefault();
            loadFlightData();
        }
    });
}

// Load flight data from OpenSky Network API
async function loadFlightData() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);

    try {
        const response = await fetch(`${CONFIG.corsProxy}${CONFIG.apiUrl}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.states) {
            allFlights = data.states.map(state => parseFlightData(state));
            displayFlights();
            updateStats();
            showNotification(`Updated ${allFlights.length} flights`, 'success');
        } else {
            throw new Error('No flight data received');
        }
    } catch (error) {
        console.error('Error loading flight data:', error);
        showNotification('Failed to load flight data. Retrying...', 'error');
        
        // Retry after 5 seconds
        setTimeout(() => {
            if (!isLoading) loadFlightData();
        }, 5000);
    } finally {
        isLoading = false;
        showLoading(false);
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

// Display flights on the map
function displayFlights() {
    // Clear existing markers
    flightMarkers.forEach(marker => map.removeLayer(marker));
    flightMarkers = [];

    // Filter flights with valid coordinates
    const validFlights = allFlights.filter(flight => 
        flight.latitude !== null && 
        flight.longitude !== null &&
        Math.abs(flight.latitude) <= 90 &&
        Math.abs(flight.longitude) <= 180
    );

    // Limit number of flights for performance
    const flightsToShow = validFlights.slice(0, CONFIG.maxFlights);

    flightsToShow.forEach(flight => {
        const marker = createFlightMarker(flight);
        if (marker) {
            flightMarkers.push(marker);
            marker.addTo(map);
        }
    });

    updateFlightVisibility();
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
}

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
}

// Handle search functionality
function handleSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) return;

    const matchingFlights = allFlights.filter(flight => {
        const callsign = (flight.callsign || '').toLowerCase();
        const country = flight.originCountry.toLowerCase();
        const icao = flight.icao24.toLowerCase();
        
        return callsign.includes(query) || 
               country.includes(query) || 
               icao.includes(query);
    });

    if (matchingFlights.length > 0) {
        const flight = matchingFlights[0];
        map.setView([flight.latitude, flight.longitude], 10);
        showFlightDetails(flight);
        showNotification(`Found ${matchingFlights.length} matching flight(s)`, 'success');
    } else {
        showNotification('No flights found matching your search', 'warning');
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

    document.getElementById('totalFlights').textContent = airborne.toLocaleString();
    document.getElementById('totalAirports').textContent = visibleFlights.length.toLocaleString();
    document.getElementById('totalCountries').textContent = countries.toLocaleString();
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

// Service worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function(error) {
        console.log('Service Worker registration failed:', error);
    });
}