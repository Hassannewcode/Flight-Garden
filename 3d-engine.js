// 3D Engine for SkyTracker Pro
// Handles 3D aircraft rendering, terrain, and visual effects

class SkyTracker3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.aircraftModels = new Map();
        this.is3DMode = false;
        this.animationId = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedAircraft = null;
        
        // Aircraft types with different 3D models
        this.aircraftTypes = {
            'commercial': { 
                color: 0x3b82f6, 
                size: 1.0,
                model: 'boeing737'
            },
            'cargo': { 
                color: 0xf59e0b, 
                size: 1.2,
                model: 'cargo'
            },
            'private': { 
                color: 0x22c55e, 
                size: 0.6,
                model: 'cessna'
            },
            'military': { 
                color: 0x64748b, 
                size: 0.8,
                model: 'fighter'
            }
        };
        
        this.init();
    }

    init() {
        this.setupScene();
        this.setupLighting();
        this.setupEventListeners();
        this.setupParticleSystem();
    }

    setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        this.scene.fog = new THREE.Fog(0x0f172a, 1000, 10000);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            50000
        );
        this.camera.position.set(0, 5000, 10000);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        const canvas = document.getElementById('webgl-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            alpha: true,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.5;

        // Hide canvas initially (2D mode)
        canvas.style.display = 'none';
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1000, 2000, 1000);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point lights for atmospheric effect
        const pointLight1 = new THREE.PointLight(0x3b82f6, 0.5, 5000);
        pointLight1.position.set(2000, 1000, 2000);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xf59e0b, 0.3, 3000);
        pointLight2.position.set(-1500, 800, -1500);
        this.scene.add(pointLight2);
    }

    setupParticleSystem() {
        // Create cloud particles
        const cloudGeometry = new THREE.BufferGeometry();
        const cloudVertices = [];
        const cloudColors = [];

        for (let i = 0; i < 5000; i++) {
            cloudVertices.push(
                (Math.random() - 0.5) * 20000,
                Math.random() * 3000 + 1000,
                (Math.random() - 0.5) * 20000
            );
            
            const intensity = Math.random() * 0.5 + 0.3;
            cloudColors.push(intensity, intensity, intensity + 0.1);
        }

        cloudGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cloudVertices, 3));
        cloudGeometry.setAttribute('color', new THREE.Float32BufferAttribute(cloudColors, 3));

        const cloudMaterial = new THREE.PointsMaterial({
            size: 50,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const clouds = new THREE.Points(cloudGeometry, cloudMaterial);
        this.scene.add(clouds);
    }

    createAircraftModel(flight) {
        const aircraftType = this.determineAircraftType(flight);
        const config = this.aircraftTypes[aircraftType];
        
        // Create aircraft group
        const aircraftGroup = new THREE.Group();
        
        // Main fuselage
        const fuselageGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
        const fuselageMaterial = new THREE.MeshPhongMaterial({ 
            color: config.color,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        aircraftGroup.add(fuselage);

        // Wings
        const wingGeometry = new THREE.BoxGeometry(6, 0.1, 1.5);
        const wingMaterial = new THREE.MeshPhongMaterial({ 
            color: config.color,
            transparent: true,
            opacity: 0.8
        });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        aircraftGroup.add(wings);

        // Tail
        const tailGeometry = new THREE.BoxGeometry(0.1, 2, 1);
        const tail = new THREE.Mesh(tailGeometry, wingMaterial);
        tail.position.set(-1.5, 0.5, 0);
        aircraftGroup.add(tail);

        // Engine glow effects
        if (flight.velocity > 0) {
            const engineGlow1 = this.createEngineGlow();
            engineGlow1.position.set(0, 0, 1.5);
            aircraftGroup.add(engineGlow1);
            
            const engineGlow2 = this.createEngineGlow();
            engineGlow2.position.set(0, 0, -1.5);
            aircraftGroup.add(engineGlow2);
        }

        // Navigation lights
        const redLight = this.createNavLight(0xff0000, new THREE.Vector3(0, 0, -2));
        const greenLight = this.createNavLight(0x00ff00, new THREE.Vector3(0, 0, 2));
        const whiteLight = this.createNavLight(0xffffff, new THREE.Vector3(2, 0, 0));
        
        aircraftGroup.add(redLight);
        aircraftGroup.add(greenLight);
        aircraftGroup.add(whiteLight);

        // Scale based on aircraft type
        aircraftGroup.scale.setScalar(config.size * 20);
        
        // Store flight data
        aircraftGroup.userData = {
            flight: flight,
            type: aircraftType,
            created: Date.now()
        };

        return aircraftGroup;
    }

    createEngineGlow() {
        const glowGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.7,
            emissive: 0x0066aa
        });
        return new THREE.Mesh(glowGeometry, glowMaterial);
    }

    createNavLight(color, position) {
        const lightGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: color,
            emissive: color,
            transparent: true,
            opacity: 0.8
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.copy(position);
        return light;
    }

    createFlightTrail(flight) {
        const trailGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        // Create trail points (simulate historical path)
        for (let i = 0; i < 50; i++) {
            const offset = i * 0.01;
            positions.push(
                flight.longitude - offset,
                this.getAltitudeY(flight.baroAltitude || 10000),
                flight.latitude - offset * 0.5
            );
            
            const alpha = (50 - i) / 50;
            colors.push(0.2, 0.6, 1.0, alpha);
        }
        
        trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        trailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
        
        const trailMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            linewidth: 2,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Line(trailGeometry, trailMaterial);
    }

    determineAircraftType(flight) {
        const callsign = flight.callsign || '';
        
        if (callsign.match(/^(UAL|DAL|AAL|SWA|JBU)/)) {
            return 'commercial';
        } else if (callsign.match(/^(UPS|FDX|ATL)/)) {
            return 'cargo';
        } else if (callsign.match(/^(N[0-9])/)) {
            return 'private';
        } else if (flight.squawk === '7777' || callsign.match(/^(RCH|CNV)/)) {
            return 'military';
        }
        
        return 'commercial'; // default
    }

    worldToScreenPosition(worldPos, camera, renderer) {
        const vector = worldPos.clone();
        vector.project(camera);
        
        const x = (vector.x * 0.5 + 0.5) * renderer.domElement.width;
        const y = (vector.y * -0.5 + 0.5) * renderer.domElement.height;
        
        return { x, y };
    }

    convertCoordinates(lat, lng, altitude = 0) {
        // Convert lat/lng to 3D world coordinates
        // Simplified projection for demonstration
        return new THREE.Vector3(
            lng * 111, // Rough conversion: 1 degree ≈ 111 km
            this.getAltitudeY(altitude),
            lat * 111
        );
    }

    getAltitudeY(altitude) {
        // Convert altitude in meters to Y coordinate
        return Math.max(altitude * 0.001, 1); // Scale down and minimum height
    }

    updateAircraft(flight) {
        const key = flight.icao24;
        
        if (!this.aircraftModels.has(key)) {
            // Create new aircraft
            const model = this.createAircraftModel(flight);
            this.aircraftModels.set(key, model);
            this.scene.add(model);
            
            // Add trail if enabled
            if (window.routesEnabled) {
                const trail = this.createFlightTrail(flight);
                model.add(trail);
            }
        }
        
        // Update position and rotation
        const model = this.aircraftModels.get(key);
        const worldPos = this.convertCoordinates(
            flight.latitude, 
            flight.longitude, 
            flight.baroAltitude || 10000
        );
        
        // Smooth position interpolation
        if (model.position.distanceTo(worldPos) > 0.1) {
            model.position.lerp(worldPos, 0.1);
        }
        
        // Update rotation based on heading
        if (flight.trueTrack !== null) {
            const targetRotation = (flight.trueTrack * Math.PI) / 180;
            model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, targetRotation, 0.1);
        }
        
        // Update engine glow based on speed
        const engineGlows = model.children.filter(child => 
            child.material && child.material.emissive
        );
        const intensity = Math.min((flight.velocity || 0) / 300, 1);
        engineGlows.forEach(glow => {
            if (glow.material.emissive) {
                glow.material.emissive.setHex(intensity > 0.5 ? 0x0066aa : 0x003366);
                glow.material.opacity = intensity * 0.7 + 0.3;
            }
        });
        
        // Store updated flight data
        model.userData.flight = flight;
        model.userData.lastUpdate = Date.now();
    }

    removeOldAircraft() {
        const now = Date.now();
        const maxAge = 60000; // 1 minute
        
        for (const [key, model] of this.aircraftModels.entries()) {
            if (now - model.userData.lastUpdate > maxAge) {
                this.scene.remove(model);
                this.aircraftModels.delete(key);
            }
        }
    }

    setupEventListeners() {
        // Mouse interaction for 3D aircraft selection
        const canvas = document.getElementById('webgl-canvas');
        
        canvas.addEventListener('click', (event) => {
            if (!this.is3DMode) return;
            
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(
                Array.from(this.aircraftModels.values()), true
            );
            
            if (intersects.length > 0) {
                const aircraft = intersects[0].object.parent;
                if (aircraft.userData && aircraft.userData.flight) {
                    this.selectAircraft(aircraft);
                    // Trigger flight details in main app
                    window.showFlightDetails(aircraft.userData.flight);
                }
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.camera && this.renderer) {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });
    }

    selectAircraft(aircraft) {
        // Deselect previous
        if (this.selectedAircraft) {
            this.selectedAircraft.children.forEach(child => {
                if (child.material) {
                    child.material.emissive.setHex(0x000000);
                }
            });
        }
        
        // Select new aircraft
        this.selectedAircraft = aircraft;
        aircraft.children.forEach(child => {
            if (child.material) {
                child.material.emissive.setHex(0x333333);
            }
        });
        
        // Focus camera on selected aircraft
        this.focusOnAircraft(aircraft);
    }

    focusOnAircraft(aircraft) {
        const targetPos = aircraft.position.clone();
        targetPos.y += 500; // Offset above aircraft
        
        // Smooth camera movement using GSAP
        if (window.gsap) {
            gsap.to(this.camera.position, {
                duration: 2,
                x: targetPos.x,
                y: targetPos.y,
                z: targetPos.z + 1000,
                ease: "power2.inOut"
            });
        }
    }

    toggle3DMode() {
        this.is3DMode = !this.is3DMode;
        const canvas = document.getElementById('webgl-canvas');
        const mapDiv = document.getElementById('map');
        
        if (this.is3DMode) {
            canvas.style.display = 'block';
            mapDiv.style.opacity = '0.3';
            this.startRendering();
        } else {
            canvas.style.display = 'none';
            mapDiv.style.opacity = '1';
            this.stopRendering();
        }
        
        return this.is3DMode;
    }

    startRendering() {
        if (this.animationId) return;
        
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            
            // Update camera controls if available
            if (this.controls) {
                this.controls.update();
            }
            
            // Animate clouds
            this.scene.children.forEach(child => {
                if (child.type === 'Points') {
                    child.rotation.y += 0.001;
                }
            });
            
            // Update aircraft animations
            this.aircraftModels.forEach(aircraft => {
                // Subtle bobbing animation
                aircraft.position.y += Math.sin(Date.now() * 0.001) * 0.1;
                
                // Rotate propellers if it's a small aircraft
                if (aircraft.userData.type === 'private') {
                    aircraft.rotation.z += 0.1;
                }
            });
            
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }

    stopRendering() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    updateFlights(flights) {
        if (!this.is3DMode) return;
        
        // Update existing aircraft
        flights.forEach(flight => {
            if (flight.latitude && flight.longitude) {
                this.updateAircraft(flight);
            }
        });
        
        // Remove old aircraft
        this.removeOldAircraft();
    }

    getStats() {
        return {
            totalAircraft: this.aircraftModels.size,
            renderTime: this.renderer.info.render.frame,
            triangles: this.renderer.info.render.triangles,
            is3DMode: this.is3DMode
        };
    }
}

// Initialize 3D engine when DOM is loaded
window.skyTracker3D = null;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof THREE !== 'undefined') {
        window.skyTracker3D = new SkyTracker3D();
        console.log('✈️ SkyTracker 3D Engine initialized');
    } else {
        console.warn('Three.js not loaded - 3D features disabled');
    }
});