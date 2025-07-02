// Weather Integration for SkyTracker Pro
// Provides real-time weather data and overlays

class WeatherSystem {
    constructor() {
        this.weatherData = new Map();
        this.weatherLayer = null;
        this.isEnabled = false;
        this.lastUpdate = 0;
        this.updateInterval = 300000; // 5 minutes
        
        // Weather API configuration
        this.apiKey = 'demo'; // Use a demo key for illustration
        this.weatherApiUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.weatherMapUrl = 'https://api.openweathermap.org/data/2.5/map';
        
        this.init();
    }

    init() {
        this.setupWeatherLayer();
        this.setupEventListeners();
        console.log('🌤️ Weather system initialized');
    }

    setupWeatherLayer() {
        // Create weather overlay layer for the map
        this.weatherLayer = L.layerGroup();
        
        // Create weather tile layer (using OpenWeatherMap)
        this.precipitationLayer = L.tileLayer(
            `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${this.apiKey}`,
            {
                attribution: 'Weather data: OpenWeatherMap',
                opacity: 0.6,
                maxZoom: 18
            }
        );
        
        this.cloudsLayer = L.tileLayer(
            `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${this.apiKey}`,
            {
                attribution: 'Weather data: OpenWeatherMap',
                opacity: 0.4,
                maxZoom: 18
            }
        );
        
        this.temperatureLayer = L.tileLayer(
            `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${this.apiKey}`,
            {
                attribution: 'Weather data: OpenWeatherMap',
                opacity: 0.5,
                maxZoom: 18
            }
        );
    }

    setupEventListeners() {
        // Weather toggle button
        const weatherBtn = document.getElementById('weatherBtn');
        if (weatherBtn) {
            weatherBtn.addEventListener('click', () => {
                this.toggleWeatherOverlay();
            });
        }

        // Weather toggle switch
        const weatherToggle = document.getElementById('weatherToggle');
        if (weatherToggle) {
            weatherToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.enableWeatherOverlay();
                } else {
                    this.disableWeatherOverlay();
                }
            });
        }

        // Close weather panel
        const closeWeatherBtn = document.getElementById('closeWeather');
        if (closeWeatherBtn) {
            closeWeatherBtn.addEventListener('click', () => {
                this.hideWeatherPanel();
            });
        }
    }

    async getWeatherData(lat, lng) {
        const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
        const now = Date.now();
        
        // Check cache
        if (this.weatherData.has(cacheKey)) {
            const cached = this.weatherData.get(cacheKey);
            if (now - cached.timestamp < this.updateInterval) {
                return cached.data;
            }
        }
        
        try {
            // Use demo weather data for illustration
            const demoWeatherData = this.generateDemoWeatherData(lat, lng);
            
            this.weatherData.set(cacheKey, {
                data: demoWeatherData,
                timestamp: now
            });
            
            return demoWeatherData;
        } catch (error) {
            console.warn('Weather data unavailable:', error);
            return this.getDefaultWeatherData();
        }
    }

    generateDemoWeatherData(lat, lng) {
        // Generate realistic demo weather data based on location
        const temperature = 15 + Math.sin(lat * 0.1) * 10 + Math.random() * 10;
        const windSpeed = Math.random() * 30 + 5;
        const windDirection = Math.random() * 360;
        const visibility = 10 + Math.random() * 15;
        const humidity = 40 + Math.random() * 40;
        const pressure = 1000 + Math.random() * 50;
        
        const conditions = [
            'Clear Sky', 'Few Clouds', 'Scattered Clouds', 
            'Broken Clouds', 'Light Rain', 'Heavy Rain',
            'Thunderstorm', 'Mist', 'Fog'
        ];
        
        return {
            temperature: Math.round(temperature),
            windSpeed: Math.round(windSpeed),
            windDirection: Math.round(windDirection),
            visibility: Math.round(visibility),
            humidity: Math.round(humidity),
            pressure: Math.round(pressure),
            conditions: conditions[Math.floor(Math.random() * conditions.length)],
            icon: this.getWeatherIcon(conditions[0])
        };
    }

    getDefaultWeatherData() {
        return {
            temperature: 20,
            windSpeed: 15,
            windDirection: 270,
            visibility: 15,
            humidity: 55,
            pressure: 1013,
            conditions: 'Clear Sky',
            icon: '01d'
        };
    }

    getWeatherIcon(condition) {
        const iconMap = {
            'Clear Sky': '01d',
            'Few Clouds': '02d',
            'Scattered Clouds': '03d',
            'Broken Clouds': '04d',
            'Light Rain': '09d',
            'Heavy Rain': '10d',
            'Thunderstorm': '11d',
            'Mist': '50d',
            'Fog': '50d'
        };
        return iconMap[condition] || '01d';
    }

    async updateWeatherForLocation(lat, lng) {
        const weatherData = await this.getWeatherData(lat, lng);
        this.displayWeatherInfo(weatherData);
        return weatherData;
    }

    displayWeatherInfo(data) {
        const weatherPanel = document.getElementById('weatherPanel');
        
        // Update weather display elements
        document.getElementById('temperature').textContent = `${data.temperature}°C`;
        document.getElementById('windSpeed').textContent = `${data.windSpeed} km/h`;
        document.getElementById('visibility').textContent = `${data.visibility} km`;
        document.getElementById('conditions').textContent = data.conditions;
        
        // Show weather panel
        if (weatherPanel) {
            weatherPanel.style.display = 'block';
            weatherPanel.classList.add('visible');
        }
    }

    hideWeatherPanel() {
        const weatherPanel = document.getElementById('weatherPanel');
        if (weatherPanel) {
            weatherPanel.classList.remove('visible');
            setTimeout(() => {
                weatherPanel.style.display = 'none';
            }, 300);
        }
    }

    toggleWeatherOverlay() {
        if (this.isEnabled) {
            this.disableWeatherOverlay();
        } else {
            this.enableWeatherOverlay();
        }
    }

    enableWeatherOverlay() {
        if (!window.map) return;
        
        this.isEnabled = true;
        
        // Add weather layers to map
        this.precipitationLayer.addTo(window.map);
        this.cloudsLayer.addTo(window.map);
        
        // Update button state
        const weatherBtn = document.getElementById('weatherBtn');
        if (weatherBtn) {
            weatherBtn.classList.add('active');
            weatherBtn.style.background = 'var(--primary-color)';
        }
        
        // Show weather for current map center
        const center = window.map.getCenter();
        this.updateWeatherForLocation(center.lat, center.lng);
        
        // Add weather markers for major airports
        this.addWeatherMarkers();
        
        window.showNotification('Weather overlay enabled 🌦️', 'success');
    }

    disableWeatherOverlay() {
        if (!window.map) return;
        
        this.isEnabled = false;
        
        // Remove weather layers
        window.map.removeLayer(this.precipitationLayer);
        window.map.removeLayer(this.cloudsLayer);
        window.map.removeLayer(this.temperatureLayer);
        
        // Remove weather markers
        this.clearWeatherMarkers();
        
        // Update button state
        const weatherBtn = document.getElementById('weatherBtn');
        if (weatherBtn) {
            weatherBtn.classList.remove('active');
            weatherBtn.style.background = '';
        }
        
        // Hide weather panel
        this.hideWeatherPanel();
        
        window.showNotification('Weather overlay disabled', 'info');
    }

    addWeatherMarkers() {
        // Major airports for weather display
        const majorAirports = [
            { name: 'JFK', lat: 40.6413, lng: -73.7781 },
            { name: 'LAX', lat: 33.9425, lng: -118.4081 },
            { name: 'LHR', lat: 51.4700, lng: -0.4543 },
            { name: 'NRT', lat: 35.7647, lng: 140.3864 },
            { name: 'CDG', lat: 49.0097, lng: 2.5479 },
            { name: 'DXB', lat: 25.2532, lng: 55.3657 },
            { name: 'SIN', lat: 1.3644, lng: 103.9915 },
            { name: 'SYD', lat: -33.9399, lng: 151.1753 }
        ];

        majorAirports.forEach(async airport => {
            const weather = await this.getWeatherData(airport.lat, airport.lng);
            const weatherIcon = this.createWeatherMarker(weather, airport.name);
            
            if (weatherIcon) {
                weatherIcon.addTo(window.map);
                this.weatherLayer.addLayer(weatherIcon);
            }
        });
    }

    createWeatherMarker(weatherData, airportName) {
        const iconHtml = `
            <div class="weather-marker">
                <div class="weather-icon">
                    <i class="fas fa-${this.getWeatherIconClass(weatherData.conditions)}"></i>
                </div>
                <div class="weather-temp">${weatherData.temperature}°</div>
                <div class="weather-airport">${airportName}</div>
            </div>
        `;
        
        const weatherIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-weather-marker',
            iconSize: [60, 80],
            iconAnchor: [30, 40]
        });
        
        return L.marker([0, 0], { icon: weatherIcon }); // Position will be set by caller
    }

    getWeatherIconClass(condition) {
        const iconMap = {
            'Clear Sky': 'sun',
            'Few Clouds': 'cloud-sun',
            'Scattered Clouds': 'cloud',
            'Broken Clouds': 'clouds',
            'Light Rain': 'cloud-rain',
            'Heavy Rain': 'cloud-showers-heavy',
            'Thunderstorm': 'bolt',
            'Mist': 'smog',
            'Fog': 'smog'
        };
        return iconMap[condition] || 'sun';
    }

    clearWeatherMarkers() {
        if (this.weatherLayer) {
            this.weatherLayer.clearLayers();
        }
    }

    // Get weather impact on flight operations
    getFlightImpact(weatherData) {
        let impact = 'normal';
        let warnings = [];
        
        // Check visibility
        if (weatherData.visibility < 5) {
            impact = 'severe';
            warnings.push('Low visibility conditions');
        } else if (weatherData.visibility < 10) {
            impact = 'moderate';
            warnings.push('Reduced visibility');
        }
        
        // Check wind speed
        if (weatherData.windSpeed > 40) {
            impact = 'severe';
            warnings.push('High wind speeds');
        } else if (weatherData.windSpeed > 25) {
            impact = Math.max(impact, 'moderate');
            warnings.push('Strong winds');
        }
        
        // Check conditions
        if (weatherData.conditions.includes('Thunderstorm')) {
            impact = 'severe';
            warnings.push('Thunderstorm activity');
        } else if (weatherData.conditions.includes('Heavy Rain')) {
            impact = 'moderate';
            warnings.push('Heavy precipitation');
        }
        
        return { impact, warnings };
    }

    // Update weather for visible flights
    updateFlightWeatherData(flights) {
        if (!this.isEnabled) return;
        
        flights.forEach(async flight => {
            if (flight.latitude && flight.longitude) {
                const weather = await this.getWeatherData(flight.latitude, flight.longitude);
                const impact = this.getFlightImpact(weather);
                
                // Store weather data with flight
                flight.weather = {
                    ...weather,
                    impact: impact.impact,
                    warnings: impact.warnings
                };
                
                // Update flight marker if needed
                this.updateFlightMarkerWeather(flight);
            }
        });
    }

    updateFlightMarkerWeather(flight) {
        if (!flight.weather || !window.flightMarkers) return;
        
        // Find the flight marker and update its appearance based on weather
        const marker = window.flightMarkers.find(m => 
            m.flightData && m.flightData.icao24 === flight.icao24
        );
        
        if (marker && flight.weather.impact !== 'normal') {
            // Add weather warning indicator
            const markerElement = marker.getElement();
            if (markerElement) {
                markerElement.classList.add(`weather-${flight.weather.impact}`);
                
                // Add weather tooltip
                const weatherInfo = `Weather: ${flight.weather.conditions}\nVisibility: ${flight.weather.visibility}km\nWind: ${flight.weather.windSpeed}km/h`;
                marker.setTooltipContent(marker.getTooltip().getContent() + '\n' + weatherInfo);
            }
        }
    }

    // Weather-based flight filtering
    getFlightsInWeatherCondition(flights, condition) {
        return flights.filter(flight => {
            return flight.weather && 
                   flight.weather.conditions.toLowerCase().includes(condition.toLowerCase());
        });
    }

    // Generate weather report for a region
    generateWeatherReport(bounds) {
        const weatherSummary = {
            totalFlights: 0,
            weatherImpactedFlights: 0,
            severityBreakdown: {
                normal: 0,
                moderate: 0,
                severe: 0
            },
            commonConditions: new Map()
        };
        
        // This would analyze weather data for the given bounds
        // For demo purposes, return sample data
        return weatherSummary;
    }
}

// Initialize weather system
window.weatherSystem = null;

document.addEventListener('DOMContentLoaded', function() {
    window.weatherSystem = new WeatherSystem();
});

// Export for use in main app
window.WeatherSystem = WeatherSystem;