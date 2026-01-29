/**
 * TravelGlobe - 3D Interactive Globe for Travel Page
 * Uses globe.gl library (wrapper over three.js)
 */

class TravelGlobe {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = null;
        this.globe = null;
        this.isInitialized = false;
        this.isAutoRotating = true;
        this.markers = [];
        this.arcs = [];
        this.journeyArcs = [];
        this.currentArcIndex = 0;
        this.isAnimating = false;
        this.animationSpeed = 1;

        // Continent colors matching travel.js
        this.continentColors = {
            'asia': '#4CAF50',
            'africa': '#FFC107',
            'europe': '#2196F3',
            'wishlist': '#E91E63'
        };

        // Callbacks
        this.onMarkerClick = options.onMarkerClick || null;
        this.onAnimationStep = options.onAnimationStep || null;
        this.onAnimationComplete = options.onAnimationComplete || null;
    }

    /**
     * Initialize the globe with data
     * @param {Object} countriesData - Countries data from travel.js
     * @param {Object} locations - Location coordinates from travel.js
     * @param {Object} countryToContinentMap - Country to continent mapping
     */
    init(countriesData, locations, countryToContinentMap) {
        if (this.isInitialized) return;

        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error('Globe container not found:', this.containerId);
            return;
        }

        // Prepare markers data
        this.prepareMarkers(countriesData, locations, countryToContinentMap);

        // Create globe
        this.createGlobe();

        this.isInitialized = true;
    }

    /**
     * Prepare markers from countries data
     */
    prepareMarkers(countriesData, locations, countryToContinentMap) {
        this.markers = [];

        // Process visited countries
        for (const continent of Object.keys(countriesData)) {
            for (const country of countriesData[continent]) {
                const countryLocations = locations[country.name];
                if (countryLocations && countryLocations.length > 0) {
                    const loc = countryLocations[0];
                    if (!loc.wishlist) {
                        this.markers.push({
                            lat: loc.lat,
                            lng: loc.lng,
                            name: country.name,
                            flag: country.flag,
                            continent: continent,
                            visitDate: country.visitDate,
                            duration: country.duration,
                            rating: country.rating,
                            isWishlist: false,
                            size: 0.8,
                            color: this.continentColors[continent] || '#FF5722'
                        });
                    }
                }
            }
        }

        // Process wishlist countries
        for (const countryName of Object.keys(locations)) {
            const countryLocs = locations[countryName];
            for (const loc of countryLocs) {
                if (loc.wishlist) {
                    this.markers.push({
                        lat: loc.lat,
                        lng: loc.lng,
                        name: countryName,
                        flag: '🌟',
                        continent: 'wishlist',
                        isWishlist: true,
                        size: 0.6,
                        color: this.continentColors['wishlist']
                    });
                }
            }
        }
    }

    /**
     * Create the 3D globe
     */
    createGlobe() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 600;

        this.globe = Globe()
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
            .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
            .width(width)
            .height(height)
            .atmosphereColor('lightskyblue')
            .atmosphereAltitude(0.25)
            // Points (markers)
            .pointsData(this.markers)
            .pointLat('lat')
            .pointLng('lng')
            .pointColor('color')
            .pointAltitude(d => d.isWishlist ? 0.01 : 0.02)
            .pointRadius(d => d.size)
            .pointLabel(d => this.createPointLabel(d))
            .onPointClick(d => this.handleMarkerClick(d))
            // Arcs for journey animation
            .arcsData([])
            .arcColor(() => ['#FFD700', '#FF6B35'])
            .arcStroke(0.5)
            .arcDashLength(0.4)
            .arcDashGap(0.2)
            .arcDashAnimateTime(1500)
            .arcAltitudeAutoScale(0.3)
            (this.container);

        // Set initial camera position
        this.globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

        // Enable auto-rotation
        this.globe.controls().autoRotate = true;
        this.globe.controls().autoRotateSpeed = 0.5;

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Create HTML label for point tooltip
     */
    createPointLabel(marker) {
        if (marker.isWishlist) {
            return `
                <div style="background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px;">🌟</div>
                    <div style="font-weight: bold; margin-top: 5px;">${marker.name}</div>
                    <div style="color: #E91E63; font-size: 12px;">Wishlist</div>
                </div>
            `;
        }

        return `
            <div style="background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 8px; min-width: 150px;">
                <div style="font-size: 24px; text-align: center;">${marker.flag}</div>
                <div style="font-weight: bold; margin-top: 5px; text-align: center;">${marker.name}</div>
                <div style="color: ${marker.color}; font-size: 12px; text-transform: capitalize; text-align: center;">${marker.continent}</div>
                ${marker.visitDate ? `<div style="font-size: 11px; margin-top: 5px; opacity: 0.8;">Visited: ${marker.visitDate}</div>` : ''}
                ${marker.duration ? `<div style="font-size: 11px; opacity: 0.8;">Duration: ${marker.duration}</div>` : ''}
                ${marker.rating ? `<div style="font-size: 11px; margin-top: 3px;">${marker.rating}</div>` : ''}
            </div>
        `;
    }

    /**
     * Handle marker click
     */
    handleMarkerClick(marker) {
        if (this.onMarkerClick && !marker.isWishlist) {
            this.onMarkerClick(marker);
        }

        // Fly to clicked point
        this.flyTo(marker.lat, marker.lng, 1.5);
    }

    /**
     * Fly camera to specific coordinates
     */
    flyTo(lat, lng, altitude = 2) {
        this.globe.pointOfView({ lat, lng, altitude }, 1000);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.container || !this.globe) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 600;
        this.globe.width(width).height(height);
    }

    /**
     * Toggle auto-rotation
     */
    toggleAutoRotate() {
        this.isAutoRotating = !this.isAutoRotating;
        this.globe.controls().autoRotate = this.isAutoRotating;
        return this.isAutoRotating;
    }

    /**
     * Set auto-rotation state
     */
    setAutoRotate(state) {
        this.isAutoRotating = state;
        this.globe.controls().autoRotate = state;
    }

    /**
     * Zoom in
     */
    zoomIn() {
        const pov = this.globe.pointOfView();
        const newAltitude = Math.max(0.5, pov.altitude - 0.5);
        this.globe.pointOfView({ ...pov, altitude: newAltitude }, 500);
    }

    /**
     * Zoom out
     */
    zoomOut() {
        const pov = this.globe.pointOfView();
        const newAltitude = Math.min(4, pov.altitude + 0.5);
        this.globe.pointOfView({ ...pov, altitude: newAltitude }, 500);
    }

    /**
     * Filter markers by continent
     */
    filterByContinent(filter) {
        let filteredMarkers;

        if (filter === 'all') {
            filteredMarkers = this.markers;
        } else if (filter === 'wishlist') {
            filteredMarkers = this.markers.filter(m => m.isWishlist);
        } else {
            filteredMarkers = this.markers.filter(m => m.continent === filter && !m.isWishlist);
        }

        this.globe.pointsData(filteredMarkers);
    }

    /**
     * Prepare journey animation data
     * @param {Array} journeyData - Sorted array of countries with visit dates
     * @param {Object} locations - Location coordinates
     */
    prepareJourneyAnimation(journeyData, locations) {
        this.journeyArcs = [];

        for (let i = 0; i < journeyData.length - 1; i++) {
            const fromCountry = journeyData[i];
            const toCountry = journeyData[i + 1];

            const fromLocs = locations[fromCountry.name];
            const toLocs = locations[toCountry.name];

            if (fromLocs && fromLocs.length > 0 && toLocs && toLocs.length > 0) {
                const fromLoc = fromLocs[0];
                const toLoc = toLocs[0];

                if (!fromLoc.wishlist && !toLoc.wishlist) {
                    this.journeyArcs.push({
                        startLat: fromLoc.lat,
                        startLng: fromLoc.lng,
                        endLat: toLoc.lat,
                        endLng: toLoc.lng,
                        fromCountry: fromCountry.name,
                        toCountry: toCountry.name,
                        fromFlag: fromCountry.flag,
                        toFlag: toCountry.flag
                    });
                }
            }
        }
    }

    /**
     * Start journey animation
     */
    startJourneyAnimation() {
        if (this.isAnimating || this.journeyArcs.length === 0) return;

        this.isAnimating = true;
        this.currentArcIndex = 0;
        this.setAutoRotate(false);

        this.animateNextArc();
    }

    /**
     * Animate next arc in journey
     */
    animateNextArc() {
        if (!this.isAnimating || this.currentArcIndex >= this.journeyArcs.length) {
            this.stopJourneyAnimation();
            return;
        }

        const arc = this.journeyArcs[this.currentArcIndex];

        // Add arc to globe
        const currentArcs = this.globe.arcsData();
        this.globe.arcsData([...currentArcs, arc]);

        // Move camera to follow the journey
        const midLat = (arc.startLat + arc.endLat) / 2;
        const midLng = (arc.startLng + arc.endLng) / 2;
        this.flyTo(midLat, midLng, 2);

        // Callback
        if (this.onAnimationStep) {
            this.onAnimationStep(this.currentArcIndex, this.journeyArcs.length);
        }

        this.currentArcIndex++;

        // Schedule next arc
        const delay = 2000 / this.animationSpeed;
        this.animationTimeout = setTimeout(() => this.animateNextArc(), delay);
    }

    /**
     * Pause journey animation
     */
    pauseJourneyAnimation() {
        this.isAnimating = false;
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
    }

    /**
     * Resume journey animation
     */
    resumeJourneyAnimation() {
        if (this.currentArcIndex < this.journeyArcs.length) {
            this.isAnimating = true;
            this.animateNextArc();
        }
    }

    /**
     * Stop journey animation and reset
     */
    stopJourneyAnimation() {
        this.isAnimating = false;
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }

        if (this.onAnimationComplete) {
            this.onAnimationComplete();
        }
    }

    /**
     * Reset journey animation
     */
    resetJourneyAnimation() {
        this.stopJourneyAnimation();
        this.currentArcIndex = 0;
        this.globe.arcsData([]);
        this.setAutoRotate(true);
        this.globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
    }

    /**
     * Set animation speed
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }

    /**
     * Show/hide the globe
     */
    setVisible(visible) {
        if (this.container) {
            this.container.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Destroy the globe instance
     */
    destroy() {
        this.stopJourneyAnimation();
        if (this.globe) {
            this.globe._destructor && this.globe._destructor();
        }
        this.isInitialized = false;
    }
}

// Export for use in other modules
window.TravelGlobe = TravelGlobe;
