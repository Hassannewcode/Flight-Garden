# SkyTracker Pro - Premium Flight Tracking

A premium, ad-free flight tracking application that provides real-time flight information from around the world. Built as a superior alternative to FlightRadar24 with no subscriptions required and a professional interface.

![SkyTracker Pro](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

## ✨ Features

### 🎯 **Core Functionality**
- **Real-time Flight Tracking**: Live aircraft positions updated every 10 seconds
- **Interactive Map**: Dark-themed map with smooth animations and controls
- **Flight Details**: Comprehensive information for each aircraft including:
  - Callsign and registration
  - Altitude (barometric and geometric)
  - Ground speed and heading
  - Origin country
  - Transponder code (squawk)
  - Flight status (airborne/grounded)

### 🚀 **Premium Features**
- **No Advertisements**: Clean, professional interface without distractions
- **No Subscriptions**: All features available for free
- **Advanced Search**: Find flights by callsign, country, or ICAO24 address
- **Real-time Statistics**: Live counts of active flights, visible aircraft, and countries
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Dark Theme**: Professional dark interface optimized for extended use

### 🎨 **User Experience**
- **Glassmorphism Design**: Modern, translucent interface elements
- **Smooth Animations**: Fluid transitions and hover effects
- **Keyboard Shortcuts**: 
  - `Ctrl+R`: Refresh flight data
  - `Escape`: Close sidebar
- **Progressive Loading**: Optimized performance with smart flight visibility
- **Notification System**: Real-time status updates and alerts
- **Fullscreen Mode**: Immersive viewing experience

## 🛠️ **Technology Stack**

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Mapping**: Leaflet.js with CartoDB dark tiles
- **Data Source**: OpenSky Network API (free, real-time flight data)
- **Icons**: Font Awesome
- **Fonts**: Inter (Google Fonts)
- **Architecture**: Single Page Application (SPA)

## 🚀 **Quick Start**

### Option 1: Direct File Access
1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. The application will start automatically and begin loading flight data

### Option 2: Local Server (Recommended)
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd skytracker-pro
   ```

2. Start a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. Open your browser and navigate to `http://localhost:8000`

## 🌍 **How It Works**

### Data Source
SkyTracker Pro uses the OpenSky Network API, which provides free access to real-time flight data collected from ADS-B (Automatic Dependent Surveillance–Broadcast) transponders. This is the same technology used by air traffic control systems worldwide.

### Real-time Updates
- Flight data refreshes every 10 seconds
- Automatic retry mechanism for failed requests
- Performance optimized to handle 1000+ aircraft simultaneously
- Smart visibility controls based on zoom level

### Cross-Origin Resource Sharing (CORS)
The application uses a CORS proxy to access the OpenSky Network API from the browser. This is necessary because the API doesn't include CORS headers for browser requests.

## 📱 **Responsive Design**

### Desktop Features
- Full sidebar with detailed flight information
- Advanced map controls and statistics panel
- Multi-column layout for optimal screen usage

### Mobile Optimizations
- Collapsible search bar
- Bottom-positioned map controls
- Full-screen sidebar on mobile devices
- Touch-optimized interface elements

## 🎯 **Usage Guide**

### Basic Navigation
1. **View Flights**: Zoom in on the map to see aircraft markers
2. **Get Details**: Click any aircraft icon to view detailed information
3. **Search**: Use the search bar to find specific flights or filter by country
4. **Refresh**: Click the refresh button or use `Ctrl+R` to update data

### Advanced Features
- **Flight Tracking**: Click on an aircraft to open the detailed sidebar
- **Map Controls**: Use zoom in/out, center, and fullscreen buttons
- **Search Functionality**: Search by flight callsign, country, or ICAO24 address
- **Statistics**: View real-time counts in the top-left statistics panel

### Performance Tips
- **Zoom Level**: Aircraft only appear at zoom level 4 or higher for performance
- **Mobile**: Use landscape mode for better viewing experience
- **Bandwidth**: Each update fetches data for all global flights (~5-10MB)

## 🔧 **Configuration**

You can modify the application behavior by editing the `CONFIG` object in `script.js`:

```javascript
const CONFIG = {
    updateInterval: 10000,           // Update frequency (milliseconds)
    maxFlights: 1000,               // Maximum flights to display
    defaultZoom: 6,                 // Initial map zoom level
    defaultCenter: [39.8283, -98.5795], // Initial map center [lat, lng]
    minZoomForFlights: 4,           // Minimum zoom to show flights
    corsProxy: 'https://corsproxy.io/?', // CORS proxy URL
    apiUrl: 'https://opensky-network.org/api/states/all' // OpenSky API endpoint
};
```

## 🌟 **Comparison with FlightRadar24**

| Feature | SkyTracker Pro | FlightRadar24 |
|---------|----------------|---------------|
| **Price** | ✅ Free | ❌ Premium subscription required |
| **Ads** | ✅ No ads | ❌ Heavy advertising |
| **Flight Limit** | ✅ Unlimited | ❌ Limited on free tier |
| **Update Frequency** | ✅ 10 seconds | ❌ 1+ minute on free tier |
| **Mobile Experience** | ✅ Fully responsive | ⚠️ App download required |
| **Data Source** | ✅ OpenSky Network | ⚠️ Proprietary |
| **Open Source** | ✅ Yes | ❌ No |

## 🔒 **Privacy & Data**

- **No User Tracking**: No analytics, cookies, or personal data collection
- **No Registration**: Use immediately without creating accounts
- **Open Source**: Complete transparency in code and functionality
- **Local Storage**: Only temporary data caching for performance
- **Data Source**: All flight data comes from OpenSky Network's public API

## 🤝 **Contributing**

Contributions are welcome! Here are some ways you can help:

### Bug Reports
- Check existing issues before reporting
- Provide detailed steps to reproduce
- Include browser/device information

### Feature Requests
- Describe the feature and its benefits
- Consider performance implications
- Check if it aligns with the "premium, ad-free" philosophy

### Development
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **OpenSky Network**: For providing free, real-time flight data
- **Leaflet**: For the excellent mapping library
- **CartoDB**: For beautiful map tiles
- **Font Awesome**: For the icon library
- **Inter Font**: For the clean, modern typography

## 🆘 **Support**

If you encounter any issues:

1. Check the browser console for error messages
2. Ensure you have a stable internet connection
3. Try refreshing the page
4. Check if the OpenSky Network API is operational
5. Report persistent issues in the GitHub issues section

## 🔮 **Future Enhancements**

- [ ] Historical flight tracking
- [ ] Airport information and schedules
- [ ] Flight path trajectories
- [ ] Weather overlay integration
- [ ] Multiple map themes
- [ ] Export functionality for flight data
- [ ] Push notifications for specific flights
- [ ] Offline mode with cached data

---

**Built with ❤️ for aviation enthusiasts who deserve a premium experience without the premium price.**