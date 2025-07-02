// Advanced Features for SkyTracker Pro
// Includes mini-map, flight tracking, animations, and premium interactions

class AdvancedFeatures {
    constructor() {
        this.miniMap = null;
        this.trackedFlight = null;
        this.flightPaths = new Map();
        this.airportMarkers = new Map();
        this.recordingPath = false;
        this.pathHistory = [];
        this.soundEnabled = true;
        
        this.init();
    }

    init() {
        this.setupMiniMap();
        this.setupFlightTracking();
        this.setupAirportOverlay();
        this.setupEventListeners();
        this.setupAnimations();
        console.log('✨ Advanced features initialized');
    }

    setupMiniMap() {
        const miniMapContainer = document.getElementById('miniMapContent');
        if (!miniMapContainer) return;

        // Create mini map instance
        this.miniMap = L.map(miniMapContainer, {
            center: [20, 0],
            zoom: 2,
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false
        });

        // Add dark tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 8
        }).addTo(this.miniMap);

        // Add flight density overlay
        this.setupFlightDensityOverlay();
    }

    setupFlightDensityOverlay() {
        // Create heat map style overlay for flight density
        this.densityLayer = L.layerGroup().addTo(this.miniMap);
        this.updateFlightDensity();
    }

    updateFlightDensity() {
        if (!this.miniMap || !window.allFlights) return;

        this.densityLayer.clearLayers();

        // Group flights by region
        const regions = new Map();
        const gridSize = 10; // degrees

        window.allFlights.forEach(flight => {
            if (!flight.latitude || !flight.longitude) return;
            
            const gridLat = Math.floor(flight.latitude / gridSize) * gridSize;
            const gridLng = Math.floor(flight.longitude / gridSize) * gridSize;
            const key = `${gridLat},${gridLng}`;
            
            if (!regions.has(key)) {
                regions.set(key, { count: 0, lat: gridLat + gridSize/2, lng: gridLng + gridSize/2 });
            }
            regions.get(key).count++;
        });

        // Add density markers
        regions.forEach(region => {
            if (region.count < 5) return; // Filter low density areas
            
            const intensity = Math.min(region.count / 50, 1);
            const radius = 20 + (intensity * 30);
            
            const circle = L.circle([region.lat, region.lng], {
                radius: radius * 1000, // Convert to meters
                fillColor: '#3b82f6',
                fillOpacity: intensity * 0.7,
                stroke: false
            });
            
            circle.bindTooltip(`${region.count} flights in this region`);
            this.densityLayer.addLayer(circle);
        });
    }

    setupFlightTracking() {
        this.trackingOverlay = L.layerGroup();
        this.followMode = false;
    }

    trackFlight(flight) {
        if (this.trackedFlight === flight) {
            this.stopTracking();
            return;
        }

        this.trackedFlight = flight;
        this.followMode = true;
        
        // Visual feedback
        this.highlightTrackedFlight(flight);
        
        // Start following
        this.startFollowing();
        
        // Show tracking UI
        this.showTrackingUI(flight);
        
        window.showNotification(`Now tracking ${flight.callsign || 'Unknown flight'}`, 'info');
    }

    highlightTrackedFlight(flight) {
        // Add special styling to tracked flight
        const marker = this.findFlightMarker(flight);
        if (marker) {
            marker.getElement().classList.add('tracked-flight');
        }
    }

    findFlightMarker(flight) {
        return window.flightMarkers?.find(marker => 
            marker.flightData && marker.flightData.icao24 === flight.icao24
        );
    }

    startFollowing() {
        if (!this.trackedFlight || !window.map) return;
        
        const updatePosition = () => {
            if (!this.followMode || !this.trackedFlight) return;
            
            // Smooth camera movement to tracked flight
            const lat = this.trackedFlight.latitude;
            const lng = this.trackedFlight.longitude;
            
            if (lat && lng) {
                const currentCenter = window.map.getCenter();
                const distance = window.map.distance([lat, lng], [currentCenter.lat, currentCenter.lng]);
                
                // Only move if flight has moved significantly
                if (distance > 1000) {
                    window.map.panTo([lat, lng], {
                        animate: true,
                        duration: 2,
                        easeLinearity: 0.1
                    });
                }
            }
            
            // Continue following
            if (this.followMode) {
                setTimeout(updatePosition, 5000);
            }
        };
        
        updatePosition();
    }

    stopTracking() {
        this.followMode = false;
        
        if (this.trackedFlight) {
            // Remove highlight
            const marker = this.findFlightMarker(this.trackedFlight);
            if (marker) {
                marker.getElement().classList.remove('tracked-flight');
            }
        }
        
        this.trackedFlight = null;
        this.hideTrackingUI();
        
        window.showNotification('Flight tracking stopped', 'info');
    }

    showTrackingUI(flight) {
        const trackingBtn = document.getElementById('trackingBtn');
        if (trackingBtn) {
            trackingBtn.classList.add('active');
            trackingBtn.title = 'Stop tracking flight';
        }
    }

    hideTrackingUI() {
        const trackingBtn = document.getElementById('trackingBtn');
        if (trackingBtn) {
            trackingBtn.classList.remove('active');
            trackingBtn.title = 'Follow selected flight';
        }
    }

    setupAirportOverlay() {
        this.airportLayer = L.layerGroup();
        
        // Major international airports
        this.majorAirports = [
            { code: 'JFK', name: 'John F. Kennedy International', lat: 40.6413, lng: -73.7781, country: 'US' },
            { code: 'LAX', name: 'Los Angeles International', lat: 33.9425, lng: -118.4081, country: 'US' },
            { code: 'LHR', name: 'London Heathrow', lat: 51.4700, lng: -0.4543, country: 'UK' },
            { code: 'CDG', name: 'Charles de Gaulle', lat: 49.0097, lng: 2.5479, country: 'FR' },
            { code: 'NRT', name: 'Narita International', lat: 35.7647, lng: 140.3864, country: 'JP' },
            { code: 'DXB', name: 'Dubai International', lat: 25.2532, lng: 55.3657, country: 'AE' },
            { code: 'SIN', name: 'Singapore Changi', lat: 1.3644, lng: 103.9915, country: 'SG' },
            { code: 'SYD', name: 'Sydney Kingsford Smith', lat: -33.9399, lng: 151.1753, country: 'AU' },
            { code: 'FRA', name: 'Frankfurt am Main', lat: 50.0379, lng: 8.5622, country: 'DE' },
            { code: 'AMS', name: 'Amsterdam Schiphol', lat: 52.3105, lng: 4.7683, country: 'NL' }
        ];
    }

    toggleAirports() {
        if (window.map.hasLayer(this.airportLayer)) {
            this.hideAirports();
        } else {
            this.showAirports();
        }
    }

    showAirports() {
        this.airportLayer.clearLayers();
        
        this.majorAirports.forEach(airport => {
            const marker = this.createAirportMarker(airport);
            this.airportLayer.addLayer(marker);
            this.airportMarkers.set(airport.code, marker);
        });
        
        this.airportLayer.addTo(window.map);
        window.showNotification('Airport overlay enabled', 'success');
    }

    hideAirports() {
        window.map.removeLayer(this.airportLayer);
        this.airportMarkers.clear();
        window.showNotification('Airport overlay disabled', 'info');
    }

    createAirportMarker(airport) {
        const iconHtml = `
            <div class="airport-marker">
                <div class="airport-icon">
                    <i class="fas fa-plane-departure"></i>
                </div>
                <div class="airport-code">${airport.code}</div>
            </div>
        `;
        
        const airportIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-airport-marker',
            iconSize: [40, 50],
            iconAnchor: [20, 50]
        });
        
        const marker = L.marker([airport.lat, airport.lng], { icon: airportIcon });
        
        // Add popup with airport information
        marker.bindPopup(`
            <div class="airport-popup">
                <h4>${airport.code}</h4>
                <p><strong>${airport.name}</strong></p>
                <p>Country: ${airport.country}</p>
                <div class="airport-stats">
                    <div class="stat">
                        <i class="fas fa-plane-departure"></i>
                        <span>Departures: ${Math.floor(Math.random() * 200 + 50)}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-plane-arrival"></i>
                        <span>Arrivals: ${Math.floor(Math.random() * 200 + 50)}</span>
                    </div>
                </div>
            </div>
        `);
        
        return marker;
    }

    setupEventListeners() {
        // 3D view toggle
        const view3DBtn = document.getElementById('view3DBtn');
        if (view3DBtn) {
            view3DBtn.addEventListener('click', () => {
                this.toggle3DView();
            });
        }

        // Mode buttons
        const mode2D = document.getElementById('mode2D');
        const mode3D = document.getElementById('mode3D');
        
        if (mode2D) {
            mode2D.addEventListener('click', () => {
                this.setViewMode('2d');
            });
        }
        
        if (mode3D) {
            mode3D.addEventListener('click', () => {
                this.setViewMode('3d');
            });
        }

        // Map style buttons
        document.querySelectorAll('[data-style]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeMapStyle(e.target.dataset.style);
            });
        });

        // Overlay toggles
        const airportsToggle = document.getElementById('airportsToggle');
        if (airportsToggle) {
            airportsToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.showAirports();
                } else {
                    this.hideAirports();
                }
            });
        }

        const routesToggle = document.getElementById('routesToggle');
        if (routesToggle) {
            routesToggle.addEventListener('change', (e) => {
                window.routesEnabled = e.target.checked;
                if (e.target.checked) {
                    this.showFlightPaths();
                } else {
                    this.hideFlightPaths();
                }
            });
        }

        // Flight tracking
        const trackingBtn = document.getElementById('trackingBtn');
        if (trackingBtn) {
            trackingBtn.addEventListener('click', () => {
                if (window.selectedFlight) {
                    this.trackFlight(window.selectedFlight);
                } else if (this.trackedFlight) {
                    this.stopTracking();
                } else {
                    window.showNotification('Please select a flight first', 'warning');
                }
            });
        }

        // Recording
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                this.toggleRecording();
            });
        }

        // Mini map toggle
        const miniMapToggle = document.getElementById('miniMapToggle');
        if (miniMapToggle) {
            miniMapToggle.addEventListener('click', () => {
                this.toggleMiniMap();
            });
        }

        // Flight actions
        const trackFlightBtn = document.getElementById('trackFlightBtn');
        if (trackFlightBtn) {
            trackFlightBtn.addEventListener('click', () => {
                if (window.selectedFlight) {
                    this.trackFlight(window.selectedFlight);
                }
            });
        }

        const shareFlightBtn = document.getElementById('shareFlightBtn');
        if (shareFlightBtn) {
            shareFlightBtn.addEventListener('click', () => {
                this.shareFlight();
            });
        }
    }

    toggle3DView() {
        if (window.skyTracker3D) {
            const is3D = window.skyTracker3D.toggle3DMode();
            
            const btn = document.getElementById('view3DBtn');
            if (btn) {
                btn.classList.toggle('active', is3D);
                btn.style.background = is3D ? 'var(--primary-color)' : '';
            }
            
            // Update mode buttons
            document.getElementById('mode2D').classList.toggle('active', !is3D);
            document.getElementById('mode3D').classList.toggle('active', is3D);
            
            window.showNotification(`${is3D ? 'Enabled' : 'Disabled'} 3D view`, 'success');
        } else {
            window.showNotification('3D engine not available', 'error');
        }
    }

    setViewMode(mode) {
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        if (mode === '3d') {
            this.toggle3DView();
        }
    }

    changeMapStyle(style) {
        if (!window.map) return;
        
        // Remove current tile layer
        window.map.eachLayer(layer => {
            if (layer._url && layer._url.includes('tile')) {
                window.map.removeLayer(layer);
            }
        });
        
        // Add new tile layer based on style
        let tileUrl;
        switch (style) {
            case 'satellite':
                tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
                break;
            case 'terrain':
                tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
                break;
            default: // dark
                tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        }
        
        L.tileLayer(tileUrl, {
            attribution: style === 'satellite' ? 'Esri' : style === 'terrain' ? 'OpenTopoMap' : 'CartoDB',
            subdomains: style === 'dark' ? 'abcd' : undefined,
            maxZoom: 19
        }).addTo(window.map);
        
        // Update button states
        document.querySelectorAll('[data-style]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-style="${style}"]`).classList.add('active');
        
        window.showNotification(`Map style changed to ${style}`, 'success');
    }

    showFlightPaths() {
        // Add animated flight paths for visible flights
        window.allFlights.forEach(flight => {
            if (flight.latitude && flight.longitude) {
                this.createFlightPath(flight);
            }
        });
        
        window.showNotification('Flight paths enabled', 'success');
    }

    hideFlightPaths() {
        this.flightPaths.forEach(path => {
            window.map.removeLayer(path);
        });
        this.flightPaths.clear();
        
        window.showNotification('Flight paths disabled', 'info');
    }

    createFlightPath(flight) {
        // Create animated path based on flight heading
        const path = this.generateFlightPath(flight);
        const polyline = L.polyline(path, {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.7,
            dashArray: '5, 10'
        });
        
        polyline.addTo(window.map);
        this.flightPaths.set(flight.icao24, polyline);
        
        // Animate the path
        this.animateFlightPath(polyline);
    }

    generateFlightPath(flight) {
        const points = [];
        const heading = (flight.trueTrack || 0) * Math.PI / 180;
        const distance = 0.5; // degrees
        
        // Generate path points based on heading
        for (let i = -5; i <= 20; i++) {
            const offset = i * distance / 20;
            const lat = flight.latitude + offset * Math.cos(heading);
            const lng = flight.longitude + offset * Math.sin(heading);
            points.push([lat, lng]);
        }
        
        return points;
    }

    animateFlightPath(polyline) {
        let dashOffset = 0;
        const animate = () => {
            dashOffset += 2;
            polyline.setStyle({ dashOffset: dashOffset + 'px' });
            
            if (dashOffset < 100) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    toggleRecording() {
        this.recordingPath = !this.recordingPath;
        
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            recordBtn.classList.toggle('active', this.recordingPath);
            recordBtn.style.background = this.recordingPath ? '#ef4444' : '';
        }
        
        if (this.recordingPath) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    startRecording() {
        this.pathHistory = [];
        window.showNotification('Recording flight paths...', 'info');
        
        // Record flight positions every 5 seconds
        this.recordingInterval = setInterval(() => {
            if (this.trackedFlight) {
                this.pathHistory.push({
                    timestamp: Date.now(),
                    lat: this.trackedFlight.latitude,
                    lng: this.trackedFlight.longitude,
                    altitude: this.trackedFlight.baroAltitude
                });
            }
        }, 5000);
    }

    stopRecording() {
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
        }
        
        if (this.pathHistory.length > 0) {
            this.showRecordedPath();
            window.showNotification(`Recorded ${this.pathHistory.length} waypoints`, 'success');
        } else {
            window.showNotification('No flight data recorded', 'warning');
        }
    }

    showRecordedPath() {
        const modal = document.getElementById('flightPathModal');
        if (modal) {
            modal.style.display = 'block';
            this.renderPathChart();
        }
    }

    renderPathChart() {
        const canvas = document.getElementById('pathChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Simple altitude chart
        if (this.pathHistory.length > 1) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            this.pathHistory.forEach((point, index) => {
                const x = (index / (this.pathHistory.length - 1)) * canvas.width;
                const y = canvas.height - ((point.altitude || 0) / 15000) * canvas.height;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        }
    }

    toggleMiniMap() {
        const miniMapEl = document.getElementById('miniMap');
        if (miniMapEl) {
            miniMapEl.classList.toggle('collapsed');
            
            const icon = document.querySelector('#miniMapToggle i');
            if (icon) {
                icon.className = miniMapEl.classList.contains('collapsed') 
                    ? 'fas fa-expand' 
                    : 'fas fa-compress';
            }
        }
    }

    shareFlight() {
        if (!window.selectedFlight) {
            window.showNotification('No flight selected', 'warning');
            return;
        }
        
        const flight = window.selectedFlight;
        const shareData = {
            title: `Flight ${flight.callsign || 'Unknown'}`,
            text: `Check out this flight: ${flight.callsign || 'Unknown'} from ${flight.originCountry}`,
            url: `${window.location.origin}${window.location.pathname}?flight=${flight.icao24}`
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback: copy to clipboard
            const url = `${window.location.origin}${window.location.pathname}?flight=${flight.icao24}`;
            navigator.clipboard.writeText(url).then(() => {
                window.showNotification('Flight link copied to clipboard', 'success');
            }).catch(() => {
                window.showNotification('Failed to copy link', 'error');
            });
        }
    }

    setupAnimations() {
        // Smooth loading animations
        if (window.gsap) {
            gsap.from('.stats-panel', { y: -50, opacity: 0, duration: 1, delay: 0.5 });
            gsap.from('.map-controls', { x: 50, opacity: 0, duration: 1, delay: 0.7 });
            gsap.from('.advanced-controls', { x: -50, opacity: 0, duration: 1, delay: 0.9 });
        }
    }

    // Update mini map when main map changes
    updateMiniMap() {
        if (!this.miniMap || !window.map) return;
        
        // Update flight density every 30 seconds
        if (!this.lastDensityUpdate || Date.now() - this.lastDensityUpdate > 30000) {
            this.updateFlightDensity();
            this.lastDensityUpdate = Date.now();
        }
    }

    // Get advanced statistics
    getAdvancedStats() {
        return {
            trackedFlight: this.trackedFlight?.callsign || null,
            isRecording: this.recordingPath,
            pathHistoryPoints: this.pathHistory.length,
            visibleAirports: this.airportMarkers.size,
            flightPaths: this.flightPaths.size
        };
    }
}

// Initialize advanced features
window.advancedFeatures = null;

document.addEventListener('DOMContentLoaded', function() {
    window.advancedFeatures = new AdvancedFeatures();
});

// Export for global access
window.AdvancedFeatures = AdvancedFeatures;