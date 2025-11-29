/**
 * New Sections JavaScript for AirWatch AI
 * Handles functionality for hyperlocal, satellite, and policy sections
 */

class HyperlocalManager {
    constructor() {
        this.currentLocation = 'central-delhi';
        this.neighborhoodMap = null;
        this.apiBase = 
            window.location.origin.includes('localhost') || 
            window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000'
                : '';
        this.hyperlocalFallbackData = {
            'central-delhi': {
                latitude: 28.6139,
                longitude: 77.2090,
                aqi: 287,
                pollutants: { pm25: 112.5, pm10: 195.3, no2: 45.6 },
                confidence: 89
            },
            'east-delhi': {
                latitude: 28.6358,
                longitude: 77.3145,
                aqi: 245,
                pollutants: { pm25: 98.7, pm10: 176.4, no2: 38.7 },
                confidence: 84
            },
            'west-delhi': {
                latitude: 28.6139,
                longitude: 77.1025,
                aqi: 312,
                pollutants: { pm25: 125.8, pm10: 210.6, no2: 52.3 },
                confidence: 81
            },
            'south-delhi': {
                latitude: 28.4595,
                longitude: 77.0266,
                aqi: 178,
                pollutants: { pm25: 78.3, pm10: 145.2, no2: 29.4 },
                confidence: 88
            },
            'north-delhi': {
                latitude: 28.7041,
                longitude: 77.1025,
                aqi: 95,
                pollutants: { pm25: 42.6, pm10: 89.7, no2: 18.9 },
                confidence: 92
            }
        };
        this.customLocationSnapshot = null;
        
        console.log('HyperlocalManager constructor called');
        
        // Delay init to ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOMContentLoaded - initializing HyperlocalManager');
                this.init();
            });
        } else {
            console.log('DOM already loaded - initializing HyperlocalManager immediately');
            // Use setTimeout to ensure DOM is fully ready
            setTimeout(() => {
                this.init();
            }, 100);
        }
    }

    init() {
        console.log('HyperlocalManager init() called');
        this.setupLocationSelector();
        this.setupRouteFinder();
        this.setupActivityRecommendations();
        // Removed generateNeighborhoodMap() since map was removed
        this.loadHyperlocalData();
        // Removed loadDelhiAreasData() since map was removed
        
        // Set up real-time updates every 30 seconds
        this.updateInterval = setInterval(() => {
            this.loadHyperlocalData();
        }, 30000); // Update every 30 seconds
        
        console.log('HyperlocalManager initialization complete');
    }

    handleLocationClick(location, buttonElement) {
        console.log('Location clicked:', location);
        
        // Remove active class from all buttons
        document.querySelectorAll('.location-option').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        if (buttonElement) {
            buttonElement.classList.add('active');
        }
        
        // Update current location and optimistically refresh UI
        this.currentLocation = location;
        this.showFallbackSnapshot(location);
        this.loadHyperlocalData(location);
    }

    setupLocationSelector() {
        console.log('Setting up location selector...');
        
        // Retry logic to ensure buttons are found
        let retries = 0;
        const maxRetries = 5;
        
        const setupButtons = () => {
            const locationOptions = document.querySelectorAll('.location-option');
            const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
            
            console.log(`Found ${locationOptions.length} location buttons`);
            
            if (locationOptions.length === 0) {
                if (retries < maxRetries) {
                    retries++;
                    console.log(`No location buttons found, retrying... (${retries}/${maxRetries})`);
                    setTimeout(setupButtons, 500);
                    return;
                } else {
                    console.warn('Location buttons not found after retries');
                    return;
                }
            }

            locationOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const location = option.dataset.location;
                    if (location) {
                        this.handleLocationClick(location, option);
                    }
                });
            });

            if (getCurrentLocationBtn) {
                getCurrentLocationBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.getCurrentLocation();
                });
            }
            
            console.log('Location selector setup complete');
        };
        
        setupButtons();
    }

    setupRouteFinder() {
        console.log('Setting up route finder...');
        
        // Retry logic to ensure button is found
        let retries = 0;
        const maxRetries = 5;
        
        const setupButton = () => {
            const findRoutesBtn = document.getElementById('findRoutes');
            
            if (!findRoutesBtn) {
                if (retries < maxRetries) {
                    retries++;
                    console.log(`Find Routes button not found, retrying... (${retries}/${maxRetries})`);
                    setTimeout(setupButton, 500);
                    return;
                } else {
                    console.warn('Find Routes button not found after retries');
                    return;
                }
            }
            
            console.log('Find Routes button found, setting up event listener');
            
            findRoutesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Find Routes button clicked via event listener');
                this.findSafeRoutes();
            });
            
            console.log('Route finder setup complete');
        };
        
        setupButton();
    }

    handleActivityClick(activity, buttonElement) {
        console.log('Activity clicked:', activity);
        
        // Remove active class from all buttons
        document.querySelectorAll('.activity-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        if (buttonElement) {
            buttonElement.classList.add('active');
        }
        
        // Get recommendations for the selected activity
        this.getActivityRecommendations(activity);
    }

    setupActivityRecommendations() {
        console.log('Setting up activity recommendations...');
        
        // Retry logic to ensure buttons are found
        let retries = 0;
        const maxRetries = 5;
        
        const setupButtons = () => {
            const activityBtns = document.querySelectorAll('.activity-btn');
            console.log(`Found ${activityBtns.length} activity buttons`);
            
            if (activityBtns.length === 0) {
                if (retries < maxRetries) {
                    retries++;
                    console.log(`No activity buttons found, retrying... (${retries}/${maxRetries})`);
                    setTimeout(setupButtons, 500);
                    return;
                } else {
                    console.warn('Activity buttons not found after retries');
                    return;
                }
            }
            
            activityBtns.forEach(btn => {
                // Add event listener
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Activity button clicked:', btn.dataset.activity);
                    
                    const activity = btn.dataset.activity;
                    if (activity) {
                        this.handleActivityClick(activity, btn);
                    }
                });
            });
            
            console.log('Activity recommendation buttons setup complete');
        };
        
        setupButtons();
    }

    generateNeighborhoodMap() {
        console.log('Generating neighborhood map...');
        
        // Retry logic to ensure container is found
        let retries = 0;
        const maxRetries = 10;
        
        const tryGenerate = () => {
            const mapContainer = document.getElementById('neighborhoodMap');
            
            if (!mapContainer) {
                if (retries < maxRetries) {
                    retries++;
                    console.log(`Map container not found, retrying... (${retries}/${maxRetries})`);
                    setTimeout(tryGenerate, 500);
                    return;
                } else {
                    console.warn('Map container not found after retries');
                    return;
                }
            }
            
            console.log('Map container found, generating markers...');
            // Generate area markers directly with animated background
            this.createAreaMarkers(mapContainer);
        };
        
        tryGenerate();
    }

    createAreaMarkers(mapContainer) {
        console.log('Creating area markers, container:', mapContainer);
        
        // Ensure map container has the correct class
        if (!mapContainer.classList.contains('map-grid')) {
            mapContainer.classList.add('map-grid');
        }
        
        // Clear existing content first (but preserve structure)
        const existingControls = mapContainer.querySelector('.map-controls-overlay');
        const existingLegend = mapContainer.querySelector('.map-legend-enhanced');
        
        // Remove only the cells, not controls/legend
        const cells = mapContainer.querySelectorAll('.map-cell');
        cells.forEach(cell => cell.remove());
        
        // Delhi areas organized in a 6x5 grid layout for better organization
        const delhiAreas = [
            // Row 1 - North Delhi
            { name: 'Rohini', lat: 28.7406, lon: 77.0717, gridArea: 'rohini', type: 'residential', population: '850000' },
            { name: 'Pitampura', lat: 28.6981, lon: 77.1381, gridArea: 'pitampura', type: 'mixed', population: '320000' },
            { name: 'Shalimar Bagh', lat: 28.7169, lon: 77.1625, gridArea: 'shalimar-bagh', type: 'residential', population: '180000' },
            { name: 'Azadpur', lat: 28.7081, lon: 77.1881, gridArea: 'azadpur', type: 'commercial', population: '220000' },
            { name: 'Model Town', lat: 28.7281, lon: 77.2181, gridArea: 'model-town', type: 'mixed', population: '150000' },
            { name: 'Civil Lines', lat: 28.6581, lon: 77.2281, gridArea: 'civil-lines', type: 'administrative', population: '95000' },
            
            // Row 2 - North-Central Delhi
            { name: 'Kamla Nagar', lat: 28.6781, lon: 77.2081, gridArea: 'kamla-nagar', type: 'commercial', population: '180000' },
            { name: 'Karol Bagh', lat: 28.6481, lon: 77.1881, gridArea: 'karol-bagh', type: 'commercial', population: '250000' },
            { name: 'Rajiv Chowk', lat: 28.6381, lon: 77.2181, gridArea: 'rajiv-chowk', type: 'commercial', population: '120000' },
            { name: 'New Delhi', lat: 28.6139, lon: 77.2090, gridArea: 'new-delhi', type: 'administrative', population: '80000' },
            { name: 'Daryaganj', lat: 28.6481, lon: 77.2381, gridArea: 'daryaganj', type: 'commercial', population: '160000' },
            { name: 'Chandni Chowk', lat: 28.6581, lon: 77.2281, gridArea: 'chandni-chowk', type: 'commercial', population: '200000' },
            
            // Row 3 - Central Delhi
            { name: 'Red Fort', lat: 28.6562, lon: 77.2410, gridArea: 'red-fort', type: 'heritage', population: '45000' },
            { name: 'Jama Masjid', lat: 28.6508, lon: 77.2331, gridArea: 'jama-masjid', type: 'religious', population: '35000' },
            { name: 'Kashmere Gate', lat: 28.6681, lon: 77.2281, gridArea: 'kashmere-gate', type: 'transport', population: '65000' },
            { name: 'Connaught Place', lat: 28.6315, lon: 77.2167, gridArea: 'connaught-place', type: 'commercial', population: '85000' },
            { name: 'India Gate', lat: 28.6129, lon: 77.2295, gridArea: 'india-gate', type: 'monument', population: '25000' },
            { name: 'Lodhi Road', lat: 28.5936, lon: 77.2178, gridArea: 'lodhi-road', type: 'residential', population: '120000' },
            
            // Row 4 - South-Central Delhi
            { name: 'Lajpat Nagar', lat: 28.5681, lon: 77.2381, gridArea: 'lajpat-nagar', type: 'commercial', population: '220000' },
            { name: 'South Extension', lat: 28.5481, lon: 77.2181, gridArea: 'south-extension', type: 'commercial', population: '180000' },
            { name: 'Hauz Khas', lat: 28.5481, lon: 77.1881, gridArea: 'hauz-khas', type: 'mixed', population: '140000' },
            { name: 'Green Park', lat: 28.5281, lon: 77.1781, gridArea: 'green-park', type: 'residential', population: '95000' },
            { name: 'Saket', lat: 28.5281, lon: 77.2081, gridArea: 'saket', type: 'commercial', population: '160000' },
            { name: 'Greater Kailash', lat: 28.5481, lon: 77.2481, gridArea: 'greater-kailash', type: 'commercial', population: '180000' },
            
            // Row 5 - South Delhi
            { name: 'Vasant Kunj', lat: 28.5281, lon: 77.1481, gridArea: 'vasant-kunj', type: 'residential', population: '280000' },
            { name: 'Dwarka', lat: 28.5881, lon: 77.0481, gridArea: 'dwarka', type: 'residential', population: '420000' },
            { name: 'Janakpuri', lat: 28.6281, lon: 77.0781, gridArea: 'janakpuri', type: 'mixed', population: '340000' },
            { name: 'Rajouri Garden', lat: 28.6481, lon: 77.1181, gridArea: 'rajouri-garden', type: 'commercial', population: '190000' },
            { name: 'Punjabi Bagh', lat: 28.6681, lon: 77.1381, gridArea: 'punjabi-bagh', type: 'mixed', population: '210000' },
            { name: 'Malviya Nagar', lat: 28.5281, lon: 77.1881, gridArea: 'malviya-nagar', type: 'mixed', population: '150000' }
        ];

        // Generate enhanced area markers using CSS Grid positioning
        delhiAreas.forEach((area, index) => {
            const cell = document.createElement('div');
            cell.className = 'map-cell enhanced-marker';
            
            // Generate realistic AQI based on area characteristics and type
            const aqi = this.generateAreaSpecificAQI(area.name, area.type);
            const category = this.getAQICategory(aqi);
            
            const categoryClass = category.toLowerCase().replace(/\s+/g, '-');
            cell.classList.add(`aqi-${categoryClass}`);
            cell.classList.add(`area-type-${area.type}`);
            cell.dataset.areaName = area.name;
            cell.dataset.aqi = Math.round(aqi);
            cell.dataset.category = category;
            cell.dataset.type = area.type;
            cell.dataset.population = area.population;
            cell.dataset.lat = area.lat;
            cell.dataset.lon = area.lon;
            cell.dataset.area = area.gridArea;
            
            // Ensure data-area attribute is set for CSS grid positioning
            cell.setAttribute('data-area', area.gridArea);
            
            // Create enhanced cell content with type icon and better layout
            const typeIcon = this.getAreaTypeIcon(area.type);
            cell.innerHTML = `
                <div class="marker-header">
                    <div class="type-icon">${typeIcon}</div>
                    <div class="aqi-badge">${Math.round(aqi)}</div>
                </div>
                <div class="area-name-enhanced">${area.name}</div>
                <div class="aqi-category-enhanced">${category}</div>
                <div class="area-stats">
                    <div class="population">${this.formatPopulation(area.population)}</div>
                    <div class="area-type">${this.formatAreaType(area.type)}</div>
                </div>
            `;
            
            // Add enhanced hover effects
            cell.addEventListener('mouseenter', () => {
                this.showEnhancedTooltip(cell, area, aqi, category);
            });
            
            cell.addEventListener('mouseleave', () => {
                this.hideAreaTooltip();
            });
            
            cell.addEventListener('click', () => {
                this.showEnhancedAreaDetails(area, aqi, category, index);
            });
            
            // Add pulsing animation for high AQI areas
            if (aqi > 300) {
                cell.classList.add('high-pollution-pulse');
            }
            
            mapContainer.appendChild(cell);
            console.log(`Added cell for ${area.name} (${area.gridArea}) at position ${index + 1}, AQI: ${Math.round(aqi)}, Category: ${category}`);
        });
        
        // Add map controls and enhanced legend AFTER cells (so they're on top)
        if (!existingControls) {
            this.addMapControls(mapContainer);
        }
        if (!existingLegend) {
            this.addEnhancedLegend(mapContainer);
        }
        
        // Force a reflow to ensure CSS grid is applied
        mapContainer.offsetHeight;
        
        // Verify grid is applied
        const computedStyle = window.getComputedStyle(mapContainer);
        console.log(`Total cells created: ${delhiAreas.length}`);
        console.log(`Map container children count: ${mapContainer.children.length}`);
        console.log('Map generation complete!');
        console.log('Map container computed styles:', {
            display: computedStyle.display,
            gridTemplateColumns: computedStyle.gridTemplateColumns,
            gridTemplateRows: computedStyle.gridTemplateRows,
            width: computedStyle.width,
            height: computedStyle.height
        });
        
        // Verify cells are visible
        const cells = mapContainer.querySelectorAll('.map-cell');
        console.log(`Found ${cells.length} map cells in DOM`);
        if (cells.length > 0) {
            const firstCell = cells[0];
            const cellStyle = window.getComputedStyle(firstCell);
            console.log('First cell styles:', {
                display: cellStyle.display,
                width: cellStyle.width,
                height: cellStyle.height,
                backgroundColor: cellStyle.backgroundColor
            });
        }
    }
    
    // Manual trigger function for debugging
    forceMapGeneration() {
        console.log('Force map generation called');
        this.generateNeighborhoodMap();
    }

    getAreaTypeIcon(type) {
        const icons = {
            'residential': '<i class="fas fa-home"></i>',
            'commercial': '<i class="fas fa-building"></i>',
            'mixed': '<i class="fas fa-city"></i>',
            'administrative': '<i class="fas fa-landmark"></i>',
            'heritage': '<i class="fas fa-monument"></i>',
            'religious': '<i class="fas fa-place-of-worship"></i>',
            'transport': '<i class="fas fa-subway"></i>',
            'monument': '<i class="fas fa-memorial"></i>'
        };
        return icons[type] || '<i class="fas fa-map-marker-alt"></i>';
    }

    formatPopulation(population) {
        const pop = parseInt(population);
        if (pop >= 1000000) {
            return `${(pop / 1000000).toFixed(1)}M`;
        } else if (pop >= 1000) {
            return `${(pop / 1000).toFixed(0)}K`;
        }
        return pop.toString();
    }

    formatAreaType(type) {
        const types = {
            'residential': 'Residential',
            'commercial': 'Commercial',
            'mixed': 'Mixed Use',
            'administrative': 'Admin',
            'heritage': 'Heritage',
            'religious': 'Religious',
            'transport': 'Transport Hub',
            'monument': 'Monument'
        };
        return types[type] || type;
    }

    getHealthImpact(category) {
        const impacts = {
            'Good': 'Minimal health risk',
            'Moderate': 'Sensitive groups may experience minor breathing discomfort',
            'Unhealthy for Sensitive Groups': 'Sensitive groups should limit outdoor activities',
            'Poor': 'Everyone may experience health effects; sensitive groups at greater risk',
            'Very Poor': 'Health warnings for everyone; avoid outdoor activities',
            'Hazardous': 'Emergency conditions; everyone should avoid all outdoor activities'
        };
        return impacts[category] || 'Unknown health impact';
    }

    getDetailedHealthImpact(category) {
        const impacts = {
            'Good': 'Air quality is satisfactory and poses little or no risk to health.',
            'Moderate': 'Air quality is acceptable; however, some pollutants may cause breathing discomfort for sensitive people.',
            'Unhealthy for Sensitive Groups': 'Sensitive groups may experience health effects. The general public is not likely to be affected.',
            'Poor': 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
            'Very Poor': 'Health alert: everyone may experience more serious health effects.',
            'Hazardous': 'Health warning of emergency conditions. The entire population is more likely to be affected.'
        };
        return impacts[category] || 'Health impact information not available.';
    }

    getRecommendations(category, areaType) {
        const recommendations = {
            'Good': 'Perfect weather for outdoor activities! Enjoy your time outside.',
            'Moderate': 'Generally safe for outdoor activities. Consider wearing a mask if you have respiratory sensitivities.',
            'Unhealthy for Sensitive Groups': 'Sensitive groups should limit outdoor activities. Consider indoor alternatives.',
            'Poor': 'Limit outdoor activities. If you must go outside, wear an N95 mask.',
            'Very Poor': 'Avoid outdoor activities. Stay indoors with air purifiers if possible.',
            'Hazardous': 'Stay indoors. Use air purifiers and avoid any outdoor exposure.'
        };
        
        const baseRec = recommendations[category] || 'Follow local air quality guidelines.';
        const typeSpecific = areaType === 'commercial' ? ' Avoid high-traffic commercial areas.' : 
                           areaType === 'residential' ? ' Residential areas may have slightly better air quality.' : '';
        
        return baseRec + typeSpecific;
    }

    getPollutantBreakdown(aqi, areaType) {
        // Generate realistic pollutant breakdown based on AQI and area type
        const basePM25 = aqi * 0.4; // PM2.5 typically contributes 40% to AQI
        const basePM10 = aqi * 0.3; // PM10 typically contributes 30% to AQI
        const baseNO2 = aqi * 0.2;  // NO2 typically contributes 20% to AQI
        const baseO3 = aqi * 0.1;   // O3 typically contributes 10% to AQI
        
        // Adjust based on area type
        const typeMultipliers = {
            'commercial': { PM25: 1.2, PM10: 1.3, NO2: 1.4, O3: 0.9 },
            'residential': { PM25: 0.9, PM10: 0.9, NO2: 0.8, O3: 1.1 },
            'transport': { PM25: 1.3, PM10: 1.4, NO2: 1.5, O3: 0.8 },
            'mixed': { PM25: 1.0, PM10: 1.0, NO2: 1.0, O3: 1.0 }
        };
        
        const multiplier = typeMultipliers[areaType] || typeMultipliers['mixed'];
        
        return [
            { name: 'PM2.5', value: Math.round(basePM25 * multiplier.PM25) },
            { name: 'PM10', value: Math.round(basePM10 * multiplier.PM10) },
            { name: 'NO₂', value: Math.round(baseNO2 * multiplier.NO2) },
            { name: 'O₃', value: Math.round(baseO3 * multiplier.O3) }
        ];
    }

    getAQIDescription(category) {
        const descriptions = {
            'Good': 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
            'Moderate': 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people.',
            'Unhealthy for Sensitive Groups': 'Members of sensitive groups may experience health effects.',
            'Poor': 'Everyone may begin to experience health effects.',
            'Very Poor': 'Health warnings of emergency conditions.',
            'Hazardous': 'Health alert: everyone may experience more serious health effects.'
        };
        return descriptions[category] || 'Air quality information is not available.';
    }

    getDelhiZone(lat, lon) {
        if (lat > 28.7) return 'North Delhi';
        if (lat < 28.5) return 'South Delhi';
        if (lon > 77.25) return 'East Delhi';
        if (lon < 77.15) return 'West Delhi';
        return 'Central Delhi';
    }

    addMapControls(mapContainer) {
        // Remove existing controls
        const existingControls = mapContainer.querySelector('.map-controls-overlay');
        if (existingControls) {
            existingControls.remove();
        }

        const controlsOverlay = document.createElement('div');
        controlsOverlay.className = 'map-controls-overlay';
        
        controlsOverlay.innerHTML = `
            <button class="map-control-btn" id="toggleMolecules" title="Toggle Molecule Animation">
                <i class="fas fa-atom"></i>
            </button>
            <button class="map-control-btn" id="toggleHeatmap" title="Toggle Heat Map">
                <i class="fas fa-fire"></i>
            </button>
            <button class="map-control-btn" id="toggleTraffic" title="Toggle Traffic Data">
                <i class="fas fa-car"></i>
            </button>
            <button class="map-control-btn" id="toggleWeather" title="Toggle Weather Overlay">
                <i class="fas fa-cloud-sun"></i>
            </button>
            <button class="map-control-btn" id="refreshData" title="Refresh Air Quality Data">
                <i class="fas fa-sync-alt"></i>
            </button>
        `;

        mapContainer.appendChild(controlsOverlay);

        // Add control event listeners
        this.setupMapControls();
    }

    addEnhancedLegend(mapContainer) {
        // Remove existing legend
        const existingLegend = mapContainer.querySelector('.map-legend-enhanced');
        if (existingLegend) {
            existingLegend.remove();
        }

        const legend = document.createElement('div');
        legend.className = 'map-legend-enhanced';
        
        legend.innerHTML = `
            <div class="legend-title">Air Quality Index</div>
            <div class="legend-items">
                <div class="legend-item-enhanced">
                    <div class="legend-color-enhanced good"></div>
                    <span>Good (0-50)</span>
                </div>
                <div class="legend-item-enhanced">
                    <div class="legend-color-enhanced moderate"></div>
                    <span>Moderate (51-100)</span>
                </div>
                <div class="legend-item-enhanced">
                    <div class="legend-color-enhanced poor"></div>
                    <span>Poor (101-200)</span>
                </div>
                <div class="legend-item-enhanced">
                    <div class="legend-color-enhanced very-poor"></div>
                    <span>Very Poor (201-300)</span>
                </div>
                <div class="legend-item-enhanced">
                    <div class="legend-color-enhanced hazardous"></div>
                    <span>Hazardous (301+)</span>
                </div>
            </div>
            <div style="margin-top: 0.75rem; font-size: 0.7rem; color: var(--text-secondary); text-align: center;">
                Real-time Delhi Air Quality Monitoring
            </div>
        `;

        mapContainer.appendChild(legend);
    }

    setupMapControls() {
        // Toggle Molecule Animation
        document.getElementById('toggleMolecules')?.addEventListener('click', () => {
            this.toggleMoleculeAnimation();
        });

        // Toggle Heat Map
        document.getElementById('toggleHeatmap')?.addEventListener('click', () => {
            this.toggleHeatMap();
        });

        // Toggle Traffic Data
        document.getElementById('toggleTraffic')?.addEventListener('click', () => {
            this.toggleTrafficData();
        });

        // Toggle Weather Overlay
        document.getElementById('toggleWeather')?.addEventListener('click', () => {
            this.toggleWeatherOverlay();
        });

        // Refresh Data
        document.getElementById('refreshData')?.addEventListener('click', () => {
            this.refreshAirQualityData();
        });
    }

    toggleMoleculeAnimation() {
        const mapGrid = document.querySelector('.map-grid');
        const btn = document.getElementById('toggleMolecules');
        
        if (mapGrid.classList.contains('molecules-paused')) {
            mapGrid.classList.remove('molecules-paused');
            btn.innerHTML = '<i class="fas fa-atom"></i>';
            btn.style.background = 'rgba(59, 130, 246, 0.3)';
            btn.title = 'Pause Molecule Animation';
        } else {
            mapGrid.classList.add('molecules-paused');
            btn.innerHTML = '<i class="fas fa-pause"></i>';
            btn.style.background = 'rgba(239, 68, 68, 0.3)';
            btn.title = 'Resume Molecule Animation';
        }
    }

    toggleHeatMap() {
        const mapGrid = document.querySelector('.map-grid');
        const btn = document.getElementById('toggleHeatmap');
        
        if (mapGrid.classList.contains('heatmap-mode')) {
            mapGrid.classList.remove('heatmap-mode');
            btn.style.background = 'rgba(15, 23, 42, 0.9)';
        } else {
            mapGrid.classList.add('heatmap-mode');
            btn.style.background = 'rgba(239, 68, 68, 0.3)';
            this.generateHeatMap();
        }
    }

    toggleTrafficData() {
        const btn = document.getElementById('toggleTraffic');
        btn.style.background = btn.style.background.includes('59, 130, 246') ? 
            'rgba(15, 23, 42, 0.9)' : 'rgba(59, 130, 246, 0.3)';
        
        // Simulate traffic data overlay
        console.log('Traffic data toggled');
    }

    toggleWeatherOverlay() {
        const btn = document.getElementById('toggleWeather');
        btn.style.background = btn.style.background.includes('59, 130, 246') ? 
            'rgba(15, 23, 42, 0.9)' : 'rgba(59, 130, 246, 0.3)';
        
        // Simulate weather overlay
        console.log('Weather overlay toggled');
    }

    refreshAirQualityData() {
        const btn = document.getElementById('refreshData');
        btn.style.animation = 'spin 1s linear infinite';
        
        // Refresh all area data
        setTimeout(() => {
            this.refreshGridWithNewData();
            btn.style.animation = '';
        }, 1500);
    }

    generateHeatMap() {
        const mapContainer = document.querySelector('.map-grid');
        const heatmapCanvas = document.createElement('canvas');
        heatmapCanvas.id = 'heatmap-canvas';
        heatmapCanvas.style.position = 'absolute';
        heatmapCanvas.style.top = '0';
        heatmapCanvas.style.left = '0';
        heatmapCanvas.style.width = '100%';
        heatmapCanvas.style.height = '100%';
        heatmapCanvas.style.pointerEvents = 'none';
        heatmapCanvas.style.zIndex = '5';
        
        mapContainer.appendChild(heatmapCanvas);
        
        const ctx = heatmapCanvas.getContext('2d');
        const rect = mapContainer.getBoundingClientRect();
        heatmapCanvas.width = rect.width;
        heatmapCanvas.height = rect.height;
        
        // Generate heat map based on AQI values
        const cells = mapContainer.querySelectorAll('.map-cell');
        cells.forEach(cell => {
            const aqi = parseInt(cell.dataset.aqi);
            const x = parseFloat(cell.style.left) / 100 * rect.width;
            const y = parseFloat(cell.style.top) / 100 * rect.height;
            
            // Create radial gradient for heat map
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
            
            if (aqi < 100) {
                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            } else if (aqi < 200) {
                gradient.addColorStop(0, 'rgba(245, 158, 11, 0.6)');
                gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
            } else if (aqi < 300) {
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(139, 92, 246, 0.6)');
                gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
            }
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 80, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    generateAreaSpecificAQI(areaName, areaType = 'mixed') {
        // Generate more realistic AQI based on area characteristics and type
        const typeFactors = {
            'commercial': 1.3,    // Higher pollution due to traffic and businesses
            'administrative': 1.1, // Moderate pollution
            'residential': 0.9,    // Lower pollution
            'mixed': 1.0,         // Baseline
            'transport': 1.4,     // High pollution from vehicles
            'heritage': 1.2,      // Moderate pollution from tourism
            'religious': 1.0,     // Baseline
            'monument': 1.1       // Moderate pollution from tourism
        };

        const areaFactors = {
            // Commercial/High traffic areas - higher AQI
            'Rajiv Chowk': 280, 'Karol Bagh': 320, 'Chandni Chowk': 350, 'New Delhi': 290,
            'Red Fort': 300, 'Jama Masjid': 340, 'Daryaganj': 310, 'Civil Lines': 270,
            'Connaught Place': 285, 'India Gate': 275, 'Greater Kailash': 295,
            
            // Residential areas - moderate AQI
            'Rohini': 180, 'Pitampura': 200, 'Shalimar Bagh': 190, 'Model Town': 210,
            'Kamla Nagar': 220, 'Lajpat Nagar': 240, 'South Extension': 230,
            'Vasant Kunj': 160, 'Dwarka': 170, 'Janakpuri': 185, 'Rajouri Garden': 195,
            'Lodhi Road': 155, 'Malviya Nagar': 185,
            
            // Green/Parks areas - lower AQI
            'Hauz Khas': 140, 'Green Park': 130, 'Saket': 150, 'Punjabi Bagh': 175,
            
            // Industrial/Mixed areas - higher AQI
            'Azadpur': 250, 'Kashmere Gate': 260
        };
        
        const baseAQI = areaFactors[areaName] || 200;
        const typeMultiplier = typeFactors[areaType] || 1.0;
        
        // Add some random variation (±20) and apply type multiplier
        const variation = (Math.random() - 0.5) * 40;
        const adjustedAQI = baseAQI * typeMultiplier + variation;
        return Math.max(50, Math.min(500, Math.round(adjustedAQI)));
    }

    showEnhancedTooltip(cell, area, aqi, category) {
        // Remove existing tooltip
        const existingTooltip = document.querySelector('.area-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        // Create enhanced tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'area-tooltip enhanced-tooltip';
        
        const healthImpact = this.getHealthImpact(category);
        const recommendations = this.getRecommendations(category, area.type);
        
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <div class="tooltip-title">${area.name}</div>
                <div class="tooltip-subtitle">${this.formatAreaType(area.type)} • ${this.formatPopulation(area.population)} people</div>
            </div>
            <div class="tooltip-content">
                <div class="aqi-display">
                    <div class="aqi-value">${Math.round(aqi)}</div>
                    <div class="aqi-category">${category}</div>
                </div>
                <div class="health-impact">
                    <div class="impact-label">Health Impact:</div>
                    <div class="impact-level ${category.toLowerCase().replace(' ', '-')}">${healthImpact}</div>
                </div>
                <div class="coordinates">
                    <div class="coord">${area.lat.toFixed(4)}°N, ${area.lon.toFixed(4)}°E</div>
                </div>
                <div class="recommendations">
                    <div class="rec-label">Recommendations:</div>
                    <div class="rec-text">${recommendations}</div>
                </div>
            </div>
        `;

        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = cell.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        tooltip.style.transform = 'translate(-50%, -100%)';

        // Add animation
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translate(-50%, -100%) scale(0.8)';
        
        setTimeout(() => {
            tooltip.style.transition = 'all 0.2s ease-out';
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translate(-50%, -100%) scale(1)';
        }, 10);
    }

    showEnhancedAreaDetails(area, aqi, category, index) {
        // Create enhanced modal
        const modal = document.createElement('div');
        modal.className = 'area-modal enhanced-modal';
        
        const healthImpact = this.getHealthImpact(category);
        const recommendations = this.getRecommendations(category, area.type);
        const pollutants = this.getPollutantBreakdown(aqi, area.type);
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">
                        <div class="area-icon">${this.getAreaTypeIcon(area.type)}</div>
                        <div class="title-text">
                            <h3>${area.name}</h3>
                            <p>${this.formatAreaType(area.type)} • Population: ${this.formatPopulation(area.population)}</p>
                        </div>
                    </div>
                    <button class="modal-close">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="aqi-section">
                        <div class="aqi-main">
                            <div class="aqi-number-large">${Math.round(aqi)}</div>
                            <div class="aqi-category-large">${category}</div>
                        </div>
                        <div class="aqi-description">
                            ${this.getAQIDescription(category)}
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-card">
                            <div class="detail-header">
                                <i class="fas fa-heartbeat"></i>
                                <h4>Health Impact</h4>
                            </div>
                            <div class="detail-content">
                                <div class="impact-level ${category.toLowerCase().replace(' ', '-')}">${healthImpact}</div>
                                <p>${this.getDetailedHealthImpact(category)}</p>
                            </div>
                        </div>
                        
                        <div class="detail-card">
                            <div class="detail-header">
                                <i class="fas fa-map-marker-alt"></i>
                                <h4>Location</h4>
                            </div>
                            <div class="detail-content">
                                <div class="coordinates">${area.lat.toFixed(4)}°N, ${area.lon.toFixed(4)}°E</div>
                                <p>Located in ${this.getDelhiZone(area.lat, area.lon)}</p>
                            </div>
                        </div>
                        
                        <div class="detail-card">
                            <div class="detail-header">
                                <i class="fas fa-flask"></i>
                                <h4>Pollutants</h4>
                            </div>
                            <div class="detail-content">
                                ${pollutants.map(p => `
                                    <div class="pollutant-item">
                                        <span class="pollutant-name">${p.name}</span>
                                        <span class="pollutant-value">${p.value}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="detail-card">
                            <div class="detail-header">
                                <i class="fas fa-lightbulb"></i>
                                <h4>Recommendations</h4>
                            </div>
                            <div class="detail-content">
                                <p>${recommendations}</p>
                                <div class="action-buttons">
                                    <button class="btn-small primary">Get Directions</button>
                                    <button class="btn-small secondary">Share Location</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add animation
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.transition = 'opacity 0.3s ease-out';
            modal.style.opacity = '1';
        }, 10);

        // Close modal handlers
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        });

        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        });
    }

    showAreaTooltip(cell, areaName, aqi, category) {
        // Remove existing tooltip
        const existingTooltip = document.querySelector('.area-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'area-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">${areaName}</div>
            <div class="tooltip-aqi">AQI: ${Math.round(aqi)}</div>
            <div class="tooltip-category">${category}</div>
            <div class="tooltip-action">Click for details</div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = cell.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    }

    hideAreaTooltip() {
        const tooltip = document.querySelector('.area-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    showAreaDetails(areaName, aqi, category, cellIndex) {
        // Create detailed modal for area
        const modal = document.createElement('div');
        modal.className = 'area-details-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${areaName} Air Quality Details</h3>
                    <button class="modal-close" onclick="this.closest('.area-details-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="area-stats">
                        <div class="stat-item">
                            <div class="stat-label">Current AQI</div>
                            <div class="stat-value aqi-${category.toLowerCase().replace(' ', '-')}">${Math.round(aqi)}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Air Quality</div>
                            <div class="stat-value">${category}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Health Impact</div>
                            <div class="stat-value">${this.getHealthImpact(category)}</div>
                        </div>
                    </div>
                    <div class="area-recommendations">
                        <h4>Recommendations for ${areaName}:</h4>
                        <ul>
                            ${this.getAreaRecommendations(areaName, aqi, category).map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="area-pollutants">
                        <h4>Pollutant Breakdown:</h4>
                        <div class="pollutant-grid">
                            ${this.getPollutantBreakdown(aqi).map(pollutant => `
                                <div class="pollutant-item">
                                    <span class="pollutant-name">${pollutant.name}</span>
                                    <span class="pollutant-value">${pollutant.value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    getHealthImpact(category) {
        const impacts = {
            'Good': 'Minimal health risk',
            'Moderate': 'Sensitive people may experience minor issues',
            'Poor': 'Health risks for sensitive groups',
            'Unhealthy': 'Health risks for everyone',
            'Hazardous': 'Serious health risks - avoid outdoor activities'
        };
        return impacts[category] || 'Unknown health impact';
    }

    getAreaRecommendations(areaName, aqi, category) {
        const recommendations = [];
        
        if (category === 'Good') {
            recommendations.push('Perfect for outdoor activities');
            recommendations.push('No mask required');
            recommendations.push('Ideal for exercise and sports');
        } else if (category === 'Moderate') {
            recommendations.push('Sensitive people should limit outdoor activities');
            recommendations.push('Consider wearing a mask if exercising outdoors');
            recommendations.push('Good for light outdoor activities');
        } else if (category === 'Poor') {
            recommendations.push('Limit outdoor activities');
            recommendations.push('Wear N95 mask if going outside');
            recommendations.push('Avoid outdoor exercise');
            recommendations.push('Keep windows closed');
        } else if (category === 'Unhealthy') {
            recommendations.push('Avoid outdoor activities');
            recommendations.push('Wear N95 mask if necessary to go outside');
            recommendations.push('Use air purifiers indoors');
            recommendations.push('Stay indoors as much as possible');
        } else {
            recommendations.push('Stay indoors - emergency conditions');
            recommendations.push('Wear N95 mask if going outside is necessary');
            recommendations.push('Use air purifiers with HEPA filters');
            recommendations.push('Consider temporary relocation if possible');
        }
        
        // Area-specific recommendations
        if (areaName.includes('Chowk') || areaName.includes('Market')) {
            recommendations.push('Avoid during peak traffic hours (8-10 AM, 6-8 PM)');
        }
        
        if (areaName.includes('Park') || areaName.includes('Garden')) {
            recommendations.push('Parks may have slightly better air quality');
        }
        
        return recommendations;
    }

    getPollutantBreakdown(aqi) {
        // Generate realistic pollutant breakdown based on AQI
        const pm25 = (aqi * 0.4 + Math.random() * 20).toFixed(1);
        const pm10 = (aqi * 0.7 + Math.random() * 30).toFixed(1);
        const no2 = (aqi * 0.15 + Math.random() * 10).toFixed(1);
        const co = (aqi * 0.02 + Math.random() * 2).toFixed(1);
        const o3 = (aqi * 0.1 + Math.random() * 5).toFixed(1);
        
        return [
            { name: 'PM2.5', value: `${pm25} μg/m³` },
            { name: 'PM10', value: `${pm10} μg/m³` },
            { name: 'NO₂', value: `${no2} ppb` },
            { name: 'CO', value: `${co} ppm` },
            { name: 'O₃', value: `${o3} ppb` }
        ];
    }

    async loadHyperlocalData(locationOverride) {
        try {
            const targetLocation = locationOverride || this.currentLocation;
            const coords = this.getLocationCoordinates(targetLocation);
            const cacheBuster = `&t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/advanced/hyperlocal-aqi?lat=${coords.lat}&lon=${coords.lon}&radius=2.0${cacheBuster}`, {
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success' && data.hyperlocal_aqi) {
                console.log('Hyperlocal data loaded from backend:', data.hyperlocal_aqi);
                this.updateHyperlocalDisplay(data.hyperlocal_aqi);
                // Refresh grid with new data while preserving area names
                this.updateNeighborhoodMap(data.hyperlocal_aqi);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error loading hyperlocal data:', error);
            // Try to use mock data as fallback
            console.log('Using fallback mock data for hyperlocal display');
            this.showFallbackSnapshot(locationOverride || this.currentLocation);
        }
    }

    getLocationCoordinates(location) {
        const locations = {
            'central-delhi': { lat: 28.6139, lon: 77.2090 },
            'east-delhi': { lat: 28.6358, lon: 77.3145 },
            'west-delhi': { lat: 28.6139, lon: 77.1025 },
            'south-delhi': { lat: 28.4595, lon: 77.0266 },
            'north-delhi': { lat: 28.7041, lon: 77.1025 }
        };
        if (location === 'current-location' && this.customLocationSnapshot) {
            return { lat: this.customLocationSnapshot.lat, lon: this.customLocationSnapshot.lon };
        }
        return locations[location] || locations['central-delhi'];
    }

    async loadDelhiAreasData() {
        try {
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/advanced/delhi-areas-aqi${cacheBuster}`, {
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success' && data.areas) {
                console.log('Delhi areas data loaded from backend:', data.areas.length, 'areas');
                this.updateNeighborhoodMapWithBackendData(data.areas, data.statistics);
                return;
            }
            
            throw new Error('Invalid response format');
        } catch (error) {
            console.error('Error loading Delhi areas data:', error);
            // Fallback to static data if backend fails
            this.updateNeighborhoodMap(this.getMockData(this.currentLocation));
        }
    }

    updateNeighborhoodMap(aqiData) {
        // Refresh the grid with new AQI data while preserving area names
        this.refreshGridWithNewData(aqiData);
    }

    updateNeighborhoodMapWithBackendData(areasData, statistics) {
        const mapContainer = document.getElementById('neighborhoodMap');
        if (!mapContainer) return;

        // Create a map of area name to data for quick lookup
        const areasMap = {};
        areasData.forEach(area => {
            areasMap[area.name] = area;
        });

        const cells = mapContainer.querySelectorAll('.map-cell');
        cells.forEach((cell) => {
            const areaName = cell.dataset.areaName;
            if (areaName && areasMap[areaName]) {
                const areaData = areasMap[areaName];
                const aqi = areaData.aqi;
                const category = areaData.category;
                const type = areaData.type;
                
                // Update the cell data
                cell.dataset.aqi = aqi;
                cell.dataset.category = category;
                cell.dataset.type = type;
                
                // Update the visual appearance
                const categoryClass = category.toLowerCase().replace(' ', '-');
                cell.className = `map-cell enhanced-marker aqi-${categoryClass} area-type-${type}`;
                
                // Get type icon
                const typeIcon = this.getAreaTypeIcon(type);
                
                // Update the content with enhanced layout
                cell.innerHTML = `
                    <div class="marker-header">
                        <div class="type-icon">${typeIcon}</div>
                        <div class="aqi-badge">${aqi}</div>
                    </div>
                    <div class="area-name-enhanced">${areaName}</div>
                    <div class="aqi-category-enhanced">${category}</div>
                    <div class="area-stats">
                        <div class="population">${this.formatPopulation(cell.dataset.population || '0')}</div>
                        <div class="area-type">${this.formatAreaType(type)}</div>
                    </div>
                `;
                
                // Add pulsing animation for high AQI areas
                if (aqi > 300) {
                    cell.classList.add('high-pollution-pulse');
                } else {
                    cell.classList.remove('high-pollution-pulse');
                }
            }
        });
        
        // Update statistics
        if (statistics) {
            const totalAreasEl = document.getElementById('totalAreas');
            const avgAQIEl = document.getElementById('avgAQI');
            const highRiskEl = document.getElementById('highRisk');
            
            if (totalAreasEl) totalAreasEl.textContent = statistics.total_areas || 30;
            if (avgAQIEl) avgAQIEl.textContent = statistics.average_aqi || 245;
            if (highRiskEl) highRiskEl.textContent = statistics.high_risk_areas || 8;
        }
        
        console.log('Neighborhood map updated with backend data');
    }

    refreshGridWithNewData(aqiData) {
        const mapContainer = document.getElementById('neighborhoodMap');
        if (!mapContainer) return;

        const cells = mapContainer.querySelectorAll('.map-cell');
        cells.forEach((cell, index) => {
            const areaName = cell.dataset.areaName;
            if (areaName) {
                // Generate new AQI based on area characteristics
                const newAqi = this.generateAreaSpecificAQI(areaName);
                const newCategory = this.getAQICategory(newAqi);
                
                // Update the cell data
                cell.dataset.aqi = Math.round(newAqi);
                cell.dataset.category = newCategory;
                
                // Update the visual appearance
                cell.className = `map-cell aqi-${newCategory.toLowerCase().replace(' ', '-')}`;
                
                // Update the content
                cell.innerHTML = `
                    <div class="area-name-large">${areaName}</div>
                    <div class="aqi-indicator">${newCategory}</div>
                    <div class="aqi-number">${Math.round(newAqi)}</div>
                `;
                
                // Ensure positioning is maintained
                if (!cell.style.left || !cell.style.top) {
                    // If positioning is lost, regenerate the map
                    this.generateNeighborhoodMap();
                }
            }
        });
    }

    updateHyperlocalDisplay(data) {
        const elements = {
            aqi: document.getElementById('hyperlocalAQI'),
            category: document.getElementById('hyperlocalCategory'),
            confidence: document.getElementById('hyperlocalConfidence'),
            pm25: document.getElementById('hyperlocalPM25'),
            pm10: document.getElementById('hyperlocalPM10'),
            no2: document.getElementById('hyperlocalNO2')
        };

        // Handle both old format (data.aqi) and new format (data.current_aqi)
        const aqiValue = data.current_aqi || data.aqi;
        const categoryValue = data.category || 'Poor';
        const confidenceValue = data.confidence || 85;
        const pollutants = data.pollutants || {};

        if (elements.aqi) elements.aqi.textContent = Math.round(aqiValue);
        if (elements.category) elements.category.textContent = categoryValue;
        if (elements.confidence) {
            const confidencePercent = typeof confidenceValue === 'number' ? confidenceValue : parseFloat(confidenceValue);
            elements.confidence.textContent = `${Math.round(confidencePercent)}%`;
        }
        if (elements.pm25) {
            const pm25Value = pollutants.pm25 || pollutants.PM25;
            elements.pm25.textContent = typeof pm25Value === 'number' ? pm25Value.toFixed(1) : (pm25Value || 'N/A');
        }
        if (elements.pm10) {
            const pm10Value = pollutants.pm10 || pollutants.PM10;
            elements.pm10.textContent = typeof pm10Value === 'number' ? pm10Value.toFixed(1) : (pm10Value || 'N/A');
        }
        if (elements.no2) {
            const no2Value = pollutants.no2 || pollutants.NO2;
            elements.no2.textContent = typeof no2Value === 'number' ? no2Value.toFixed(1) : (no2Value || 'N/A');
        }
        
        console.log('Hyperlocal display updated with data:', { aqiValue, categoryValue, confidenceValue, pollutants });
    }

    showFallbackSnapshot(location, overrides = {}) {
        const fallbackData = this.getMockData(location, overrides);
        this.updateHyperlocalDisplay(fallbackData);
    }

    async findSafeRoutes() {
        console.log('Find Safe Routes button clicked');
        
        const from = document.getElementById('routeFrom')?.value || 'Home';
        const to = document.getElementById('routeTo')?.value || 'Office';
        
        // Show loading state
        const routesList = document.getElementById('routesList');
        if (routesList) {
            routesList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">Finding safe routes...</div>';
        }
        
        try {
            const fromCoords = this.getLocationCoordinates(this.currentLocation);
            // Try to get destination coordinates from input or use default
            let toCoords;
            if (to.toLowerCase().includes('east')) {
                toCoords = this.getLocationCoordinates('east-delhi');
            } else if (to.toLowerCase().includes('west')) {
                toCoords = this.getLocationCoordinates('west-delhi');
            } else if (to.toLowerCase().includes('south')) {
                toCoords = this.getLocationCoordinates('south-delhi');
            } else if (to.toLowerCase().includes('north')) {
                toCoords = this.getLocationCoordinates('north-delhi');
            } else {
                toCoords = this.getLocationCoordinates('east-delhi'); // Default destination
            }
            
            const cacheBuster = `&t=${Date.now()}`;
            console.log('Fetching routes from:', fromCoords, 'to:', toCoords);
            
            const response = await fetch(`${this.apiBase}/api/advanced-enhanced/safe-routes?start_lat=${fromCoords.lat}&start_lon=${fromCoords.lon}&end_lat=${toCoords.lat}&end_lon=${toCoords.lon}${cacheBuster}`, {
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Routes data received:', data);
                if (data.status === 'success' && data.routes && data.routes.length > 0) {
                    this.updateRoutesDisplay(data.routes);
                    return;
                } else {
                    console.warn('No routes in response:', data);
                }
            } else {
                console.warn('Routes API returned error:', response.status, response.statusText);
                // Try alternative endpoint
                try {
                    const altResponse = await fetch(`${this.apiBase}/api/health-guidance/safe-routes?origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&mode=all&t=${Date.now()}`);
                    if (altResponse.ok) {
                        const altData = await altResponse.json();
                        if (altData.routes && altData.routes.length > 0) {
                            // Convert format
                            const convertedRoutes = altData.routes.map((r, i) => ({
                                route_id: r.id || `route_${i+1}`,
                                route_type: r.mode || 'mixed',
                                total_duration: `${r.duration_minutes || 0} min`,
                                total_distance: `${r.distance_km || 0} km`,
                                avg_aqi: r.estimated_aqi || 200,
                                max_aqi: (r.estimated_aqi || 200) + 20,
                                pollution_exposure: r.quality || 'Moderate',
                                route_score: r.safety_score || 70
                            }));
                            this.updateRoutesDisplay(convertedRoutes);
                            return;
                        }
                    }
                } catch (altError) {
                    console.warn('Alternative endpoint also failed:', altError);
                }
            }
        } catch (error) {
            console.error('Error finding routes:', error);
        }
        
        // Fallback to mock routes with real-time AQI
        console.log('Using fallback mock routes with real-time data');
        try {
            const aqiResponse = await fetch(`${this.apiBase}/api/overview/current-aqi?t=${Date.now()}`);
            if (aqiResponse.ok) {
                const aqiData = await aqiResponse.json();
                const currentAqi = aqiData.aqi || aqiData.current_aqi || 250;
                this.updateRoutesDisplay(this.getMockRoutes(currentAqi));
            } else {
                this.updateRoutesDisplay(this.getMockRoutes());
            }
        } catch (e) {
            this.updateRoutesDisplay(this.getMockRoutes());
        }
    }

    updateRoutesDisplay(routes) {
        const routesList = document.getElementById('routesList');
        if (!routesList) {
            console.warn('routesList element not found');
            return;
        }

        if (!routes || routes.length === 0) {
            routesList.innerHTML = '<div class="route-option" style="text-align: center; padding: 2rem; color: var(--text-secondary, #94a3b8);">No safe routes available currently.</div>';
            return;
        }

        routesList.innerHTML = '';
        
        routes.slice(0, 3).forEach((route, index) => {
            const routeElement = this.createRouteElement(route, index);
            routesList.appendChild(routeElement);
        });
    }

    createRouteElement(route, index) {
        const div = document.createElement('div');
        div.className = 'route-option';
        
        // Handle different route data formats
        const routeType = route.route_type || route.mode || 'mixed';
        const routeTypeClass = routeType === 'metro' ? 'metro' : 
                              routeType === 'cycling' ? 'cycling' : 
                              routeType === 'walking' ? 'walking' : 'mixed';
        
        // Extract duration - handle both string and number formats
        let duration = route.total_duration || route.duration_minutes || 0;
        if (typeof duration === 'string') {
            // Extract number from string like "25 min" or "25"
            duration = parseInt(duration.replace(/[^0-9]/g, '')) || 0;
        }
        const durationText = `${duration} min`;
        
        // Extract distance - handle both string and number formats
        let distance = route.total_distance || route.distance_km || 0;
        if (typeof distance === 'string') {
            // Extract number from string like "12.5 km" or "12.5"
            distance = parseFloat(distance.replace(/[^0-9.]/g, '')) || 0;
        }
        const distanceText = `${distance.toFixed(1)} km`;
        
        // Extract AQI
        const aqi = route.avg_aqi || route.estimated_aqi || route.aqi || 200;
        const aqiText = `${Math.round(aqi)} AQI`;
        
        // Extract route score
        const routeScore = route.route_score || route.safety_score || 70;
        
        div.innerHTML = `
            <div class="route-info">
                <div class="route-type ${routeTypeClass}">
                    <i class="fas fa-${this.getRouteIcon(routeType)}"></i>
                    <span>${this.getRouteTypeName(routeType)}</span>
                </div>
                <div class="route-stats">
                    <span class="route-duration">${durationText}</span>
                    <span class="route-aqi">${aqiText}</span>
                    <span class="route-distance">${distanceText}</span>
                </div>
            </div>
            <div class="route-score ${this.getScoreClass(routeScore)}">${this.getScoreLabel(routeScore)}</div>
        `;
        
        return div;
    }

    async getActivityRecommendations(activity) {
        console.log('Getting activity recommendations for:', activity);
        
        try {
            const coords = this.getLocationCoordinates(this.currentLocation);
            const cacheBuster = `&t=${Date.now()}`;
            const url = `${this.apiBase}/api/advanced/activity-recommendations?lat=${coords.lat}&lon=${coords.lon}&activity=${activity}&duration=60${cacheBuster}`;
            
            console.log('Fetching activity recommendations from:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Activity recommendations data:', data);
                if (data.status === 'success' && data.activity_recommendations) {
                    this.updateActivityRecommendations(data.activity_recommendations);
                    return;
                }
            } else {
                console.warn('Activity recommendations API returned error:', response.status);
            }
        } catch (error) {
            console.error('Error getting activity recommendations:', error);
        }
        
        // Fallback to mock data with real-time AQI
        console.log('Using fallback activity recommendations with real-time data');
        const mockData = await this.getMockActivityData(activity);
        this.updateActivityRecommendations(mockData);
    }

    updateActivityRecommendations(data) {
        const container = document.getElementById('activityRecommendation');
        if (!container) {
            console.warn('Activity recommendation container not found');
            return;
        }

        const status = this.getActivityStatus(data.current_location.aqi);
        const statusClass = status === 'good' ? 'good' : status === 'moderate' ? 'moderate' : 'poor';
        const locationTip = data.location_tip || 'Try parks and green areas';
        
        container.innerHTML = `
            <div class="recommendation-status ${statusClass}">
                <i class="fas fa-${this.getStatusIcon(status)}"></i>
                <span>${this.getStatusText(status)}</span>
            </div>
            <div class="recommendation-details">
                <p>${data.recommendations[0]?.message || 'Check current air quality before outdoor activities.'}</p>
                <div class="recommendation-tips">
                    <div class="tip-item">
                        <i class="fas fa-clock"></i>
                        <span>Best time: ${data.time_recommendations[0]?.best_time || '6-8 AM'}</span>
                    </div>
                    <div class="tip-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${locationTip}</span>
                    </div>
                </div>
            </div>
        `;
        
        console.log('Activity recommendations updated:', data);
    }

    async getCurrentLocation() {
        console.log('Get Current Location button clicked');
        
        // Show loading state
        const locationInput = document.getElementById('locationInput');
        if (locationInput) {
            locationInput.value = 'Getting location...';
        }
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    console.log('Current location obtained:', lat, lon);
                    this.customLocationSnapshot = { lat, lon };
                    
                    // Update location input
                    if (locationInput) {
                        locationInput.value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                    }
                    
                    // Update current location for route finding
                    this.currentLocation = 'current-location';
                    
                    // Load hyperlocal data for current location
                    try {
                        const cacheBuster = `&t=${Date.now()}`;
                        console.log('Fetching hyperlocal data for current location...');
                        
                        const response = await fetch(`${this.apiBase}/api/advanced/hyperlocal-aqi?lat=${lat}&lon=${lon}&radius=2.0${cacheBuster}`, {
                            headers: {
                                'Cache-Control': 'no-cache'
                            }
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            if (data.status === 'success' && data.hyperlocal_aqi) {
                                console.log('Hyperlocal data loaded for current location:', data.hyperlocal_aqi);
                                this.updateHyperlocalDisplay(data.hyperlocal_aqi);
                                
                                // Show success message
                                if (locationInput) {
                                    locationInput.value = `Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                                }
                            } else {
                                throw new Error('Invalid response format');
                            }
                        } else {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                    } catch (error) {
                        console.error('Error loading location data:', error);
                        // Use fallback data
                        this.customLocationSnapshot = { lat, lon };
                        this.showFallbackSnapshot('current-location', { latitude: lat, longitude: lon });
                        if (locationInput) {
                            locationInput.value = `Location: ${lat.toFixed(4)}, ${lon.toFixed(4)} (using fallback data)`;
                        }
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    let errorMessage = 'Unable to get your location. ';
                    if (error.code === 1) {
                        errorMessage += 'Permission denied. Please allow location access.';
                    } else if (error.code === 2) {
                        errorMessage += 'Location unavailable.';
                    } else if (error.code === 3) {
                        errorMessage += 'Request timeout.';
                    } else {
                        errorMessage += 'Please select a location manually.';
                    }
                    
                    alert(errorMessage);
                    
                    if (locationInput) {
                        locationInput.value = 'Delhi, India';
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            alert('Geolocation is not supported by your browser. Please select a location manually.');
            if (locationInput) {
                locationInput.value = 'Delhi, India';
            }
        }
    }

    getAQICategory(aqi) {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Satisfactory';
        if (aqi <= 200) return 'Moderate';
        if (aqi <= 300) return 'Poor';
        if (aqi <= 400) return 'Very Poor';
        return 'Severe';
    }

    getRouteIcon(type) {
        const icons = {
            metro: 'subway',
            cycling: 'bicycle',
            walking: 'walking',
            road: 'car',
            fastest: 'tachometer-alt',
            safest: 'shield-alt',
            balanced: 'balance-scale',
            mixed: 'route',
            highway: 'road',
            residential: 'home'
        };
        return icons[type] || 'route';
    }

    getRouteTypeName(type) {
        const names = {
            metro: 'Metro Route',
            cycling: 'Cycling Route',
            walking: 'Walking Route',
            road: 'Direct Route',
            fastest: 'Fastest Route',
            safest: 'Safest Route',
            balanced: 'Balanced Route',
            mixed: 'Mixed Route',
            highway: 'Highway Route',
            residential: 'Residential Route'
        };
        return names[type] || 'Route';
    }

    getScoreClass(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'moderate';
        return 'poor';
    }

    getScoreLabel(score) {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Moderate';
        return 'Fair';
    }

    getActivityStatus(aqi) {
        if (aqi <= 100) return 'good';
        if (aqi <= 200) return 'moderate';
        return 'poor';
    }

    getStatusIcon(status) {
        const icons = {
            good: 'check-circle',
            moderate: 'exclamation-triangle',
            poor: 'times-circle'
        };
        return icons[status] || 'question-circle';
    }

    getStatusText(status) {
        const texts = {
            good: 'Safe for outdoor activities',
            moderate: 'Moderate air quality - take precautions',
            poor: 'Poor air quality - limit outdoor activities'
        };
        return texts[status] || 'Check air quality';
    }

    showCellDetails(aqi, category, index) {
        // Get area name from the positioned areas array
        const delhiAreas = [
            // North Delhi areas
            { name: 'Rohini', x: 15, y: 10 },
            { name: 'Pitampura', x: 25, y: 15 },
            { name: 'Shalimar Bagh', x: 35, y: 12 },
            { name: 'Azadpur', x: 45, y: 18 },
            { name: 'Model Town', x: 55, y: 20 },
            
            // North-Central areas
            { name: 'Civil Lines', x: 20, y: 30 },
            { name: 'Kamla Nagar', x: 30, y: 35 },
            { name: 'Karol Bagh', x: 40, y: 32 },
            { name: 'Rajiv Chowk', x: 50, y: 38 },
            { name: 'New Delhi', x: 60, y: 40 },
            
            // Central Delhi areas
            { name: 'Daryaganj', x: 25, y: 50 },
            { name: 'Chandni Chowk', x: 35, y: 48 },
            { name: 'Red Fort', x: 45, y: 52 },
            { name: 'Jama Masjid', x: 55, y: 55 },
            { name: 'Kashmere Gate', x: 65, y: 50 },
            
            // South-Central areas
            { name: 'Lajpat Nagar', x: 30, y: 70 },
            { name: 'South Extension', x: 40, y: 72 },
            { name: 'Hauz Khas', x: 50, y: 68 },
            { name: 'Green Park', x: 60, y: 70 },
            { name: 'Saket', x: 70, y: 75 },
            
            // South Delhi areas
            { name: 'Vasant Kunj', x: 20, y: 85 },
            { name: 'Dwarka', x: 10, y: 80 },
            { name: 'Janakpuri', x: 25, y: 88 },
            { name: 'Rajouri Garden', x: 45, y: 85 },
            { name: 'Punjabi Bagh', x: 55, y: 88 }
        ];
        
        const areaName = delhiAreas[index] ? delhiAreas[index].name : `Area ${index + 1}`;
        
        // Use the enhanced showAreaDetails function
        this.showAreaDetails(areaName, aqi, category, index);
    }

    getMockData(location = this.currentLocation, overrides = {}) {
        const normalizedLocation = location || this.currentLocation;
        const baseData = this.hyperlocalFallbackData[normalizedLocation] || this.hyperlocalFallbackData['central-delhi'];
        const jitter = (value, variance = 12) => {
            const delta = (Math.random() - 0.5) * variance;
            return Math.max(0, +(value + delta).toFixed(1));
        };

        // Allow custom coordinates for geolocated fallback
        const latitude = overrides.latitude ?? baseData.latitude;
        const longitude = overrides.longitude ?? baseData.longitude;
        const aqi = overrides.aqi ?? jitter(baseData.aqi, 18);
        const pm25 = overrides.pm25 ?? jitter(baseData.pollutants.pm25, 8);
        const pm10 = overrides.pm10 ?? jitter(baseData.pollutants.pm10, 12);
        const no2 = overrides.no2 ?? jitter(baseData.pollutants.no2, 4);
        const confidence = overrides.confidence ?? baseData.confidence;
        const pollutantOverrides = overrides.pollutants || {};

        return {
            latitude,
            longitude,
            aqi,
            current_aqi: aqi,
            category: overrides.category || this.getAQICategory(aqi),
            confidence,
            pollutants: {
                pm25,
                pm10,
                no2,
                ...pollutantOverrides
            },
            nearby_stations: overrides.nearby_stations || [],
            timestamp: new Date().toISOString()
        };
    }

    getMockRoutes(currentAqi = null) {
        // Use real-time AQI if provided, otherwise use default
        const baseAqi = currentAqi || 250;
        
        return [
            {
                route_type: 'safest',
                total_duration: 45,
                avg_aqi: Math.max(50, baseAqi - 40),
                total_distance: 12.5,
                route_score: Math.min(100, Math.max(0, 100 - (baseAqi - 40) / 5))
            },
            {
                route_type: 'balanced',
                total_duration: 35,
                avg_aqi: Math.max(50, baseAqi - 20),
                total_distance: 10.2,
                route_score: Math.min(100, Math.max(0, 100 - (baseAqi - 20) / 5))
            },
            {
                route_type: 'fastest',
                total_duration: 25,
                avg_aqi: Math.max(50, baseAqi + 20),
                total_distance: 8.5,
                route_score: Math.min(100, Math.max(0, 100 - (baseAqi + 20) / 5))
            }
        ];
    }

    async getMockActivityData(activity) {
        // Try to get real-time AQI
        let baseAQI = 287;
        try {
            const aqiResponse = await fetch(`${this.apiBase}/api/overview/current-aqi?t=${Date.now()}`);
            if (aqiResponse.ok) {
                const aqiData = await aqiResponse.json();
                baseAQI = aqiData.aqi || aqiData.current_aqi || 287;
            }
        } catch (e) {
            console.warn('Could not fetch current AQI for mock data:', e);
        }
        
        let message, bestTime, location, status;
        
        switch(activity) {
            case 'walking':
                if (baseAQI <= 100) {
                    status = 'good';
                    message = 'Current air quality is suitable for walking. Consider wearing a mask if you have respiratory sensitivities.';
                } else if (baseAQI <= 200) {
                    status = 'moderate';
                    message = 'Air quality is moderate for walking. Limit outdoor walking time and consider wearing a mask.';
                } else {
                    status = 'poor';
                    message = 'Air quality is poor for walking. Consider indoor alternatives or wear an N95 mask if you must go outside.';
                }
                bestTime = '6-8 AM';
                location = 'Try parks and green areas';
                break;
            case 'running':
                if (baseAQI <= 100) {
                    status = 'good';
                    message = 'Good conditions for outdoor running. Stay hydrated and monitor your breathing.';
                } else if (baseAQI <= 150) {
                    status = 'moderate';
                    message = 'Air quality is moderate for running. Reduce intensity and duration. Consider indoor alternatives.';
                } else {
                    status = 'poor';
                    message = 'Avoid outdoor running due to poor air quality. Use indoor treadmill or gym instead.';
                }
                bestTime = '5-7 AM';
                location = 'Avoid high-traffic areas';
                break;
            case 'cycling':
                if (baseAQI <= 150) {
                    status = 'good';
                    message = 'Good conditions for cycling. Use dedicated cycling lanes away from traffic.';
                } else if (baseAQI <= 200) {
                    status = 'moderate';
                    message = 'Air quality is moderate for cycling. Wear an N95 mask and choose routes through parks.';
                } else {
                    status = 'poor';
                    message = 'Air quality is poor for cycling. Consider wearing an N95 mask or choose indoor cycling alternatives.';
                }
                bestTime = '6-8 AM';
                location = 'Use dedicated cycling lanes away from traffic';
                break;
            default:
                status = 'moderate';
                message = 'Current air quality is suitable for outdoor activities. Consider wearing a mask if you have respiratory sensitivities.';
                bestTime = '6-8 AM';
                location = 'Try parks and green areas';
        }
        
        return {
            current_location: { aqi: baseAQI },
            recommendations: [
                { message: message, type: status }
            ],
            time_recommendations: [
                { best_time: bestTime }
            ],
            location_tip: location
        };
    }
}

class SatelliteManager {
    constructor() {
        this.currentTracking = 'stubble-burning';
        this.currentTimeframe = '3d'; // Default to "This Week"
        this.activeTrackingFilter = null;
        this.refreshInterval = null;
        this.apiBase =
            window.location.origin.includes('localhost') ||
            window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000'
                : '';
        this.init();
    }

    init() {
        try {
            console.log('SatelliteManager init() called');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initializeAfterDOMReady();
                });
            } else {
                // DOM is already ready
                setTimeout(() => {
                    this.initializeAfterDOMReady();
                }, 100);
            }
        } catch (error) {
            console.error('Error initializing SatelliteManager:', error);
        }
    }
    
    initializeAfterDOMReady() {
        try {
            console.log('Initializing SatelliteManager after DOM ready');
            
            // Ensure default view shows all cards before user interaction
            if (typeof window.updateSatelliteTrackingDisplay === 'function') {
                window.updateSatelliteTrackingDisplay(null);
            } else {
                this.updateTrackingUI(null);
            }
            this.syncTimeframeButtons();
            
            // Show fallback data immediately with current tracking type
            const mockData = this.getMockSatelliteData(this.currentTimeframe, this.currentTracking);
            console.log('Initial mock data loaded:', mockData);
            this.updateSatelliteDisplay(mockData);
            this.updateSatelliteVisualizations(mockData);
            
            // Setup controls with retry logic
            this.setupControlsWithRetry();
            
            // Load real data in background (non-blocking)
            setTimeout(() => {
                try {
                    this.loadSatelliteData();
                } catch (error) {
                    console.error('Error loading satellite data:', error);
                }
            }, 200);
            
            this.startDataRefresh();
        } catch (error) {
            console.error('Error in initializeAfterDOMReady:', error);
        }
    }
    
    setupControlsWithRetry(retries = 5) {
        const trackingBtns = document.querySelectorAll('[data-tracking]');
        const timeframeBtns = document.querySelectorAll('[data-timeframe]');
        
        console.log('Looking for buttons - Tracking:', trackingBtns.length, 'Timeframe:', timeframeBtns.length);
        
        if ((trackingBtns.length === 0 && timeframeBtns.length === 0) && retries > 0) {
            console.log(`Buttons not found, retrying... (${retries} retries left)`);
            setTimeout(() => {
                this.setupControlsWithRetry(retries - 1);
            }, 500);
            return;
        }
        
        if (trackingBtns.length > 0 || timeframeBtns.length > 0) {
            this.setupControls();
        } else {
            console.error('Satellite buttons not found after all retries');
        }
    }

    updateTrackingUI(selectedTracking) {
        window.__satelliteTrackingState = window.__satelliteTrackingState || { activeFilter: null };
        window.__satelliteTrackingState.activeFilter = selectedTracking || null;
        
        if (typeof window.updateSatelliteTrackingDisplay === 'function') {
            window.updateSatelliteTrackingDisplay(selectedTracking);
            return;
        }
        
        const trackingBtns = document.querySelectorAll('[data-tracking]');
        const cards = {
            'stubble-burning': document.querySelector('.stubble-burning-card'),
            'industrial': document.querySelector('.industrial-hotspots-card'),
            'aerosol': document.querySelector('.aerosol-depth-card')
        };
        
        trackingBtns.forEach(btn => {
            if (!selectedTracking) {
                btn.classList.remove('active');
            } else {
                btn.classList.toggle('active', btn.dataset.tracking === selectedTracking);
            }
        });
        
        Object.entries(cards).forEach(([key, card]) => {
            if (!card) return;
            if (!selectedTracking) {
                card.classList.remove('active-tracking');
                card.style.display = '';
            } else {
                card.classList.toggle('active-tracking', key === selectedTracking);
                card.style.display = key === selectedTracking ? '' : 'none';
            }
        });
    }

    syncTimeframeButtons() {
        const timeframeBtns = document.querySelectorAll('[data-timeframe]');
        timeframeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.timeframe === this.currentTimeframe);
        });
    }

    clearTrackingFilter() {
        this.activeTrackingFilter = null;
        this.updateTrackingUI(null);
    }

    toggleTrackingSelection(tracking) {
        if (this.activeTrackingFilter === tracking) {
            this.clearTrackingFilter();
            return;
        }
        this.setTracking(tracking);
    }

    setTimeframe(timeframe) {
        console.log('=== setTimeframe called with:', timeframe, '===');
        console.log('Previous timeframe was:', this.currentTimeframe);
        
        // Update current timeframe BEFORE loading data
        const oldTimeframe = this.currentTimeframe;
        this.currentTimeframe = timeframe;
        console.log('✓ Timeframe changed:', oldTimeframe, '→', this.currentTimeframe);
        this.syncTimeframeButtons();
        
        // Show loading state
        this.showLoadingState();
        
        // Load new data with updated timeframe - use explicit value
        console.log('Loading satellite data with timeframe:', timeframe);
        console.log('this.currentTimeframe is now:', this.currentTimeframe);
        
        // Force immediate reload with new timeframe
        this.loadSatelliteData();
    }
    
    setTracking(tracking) {
        console.log('=== setTracking called with:', tracking, '===');
        
        this.activeTrackingFilter = tracking;
        this.currentTracking = tracking;
        this.updateTrackingUI(tracking);
        
        // Show loading state
        this.showLoadingState();
        
        // Load new data with updated tracking
        console.log('Loading satellite data with new tracking...');
        this.loadSatelliteData();
    }
    
    showLoadingState() {
        // Show loading indicator in the main display area
        const mainCard = document.querySelector('.stubble-burning-card.active-tracking, .industrial-hotspots-card.active-tracking, .aerosol-depth-card.active-tracking');
        if (mainCard) {
            const loadingIndicator = mainCard.querySelector('.loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }
        }
    }

    setupControls() {
        console.log('Setting up satellite controls...');
        const trackingBtns = document.querySelectorAll('[data-tracking]');
        const timeframeBtns = document.querySelectorAll('[data-timeframe]');

        console.log('Found tracking buttons:', trackingBtns.length);
        console.log('Found timeframe buttons:', timeframeBtns.length);

        // Setup tracking buttons
        trackingBtns.forEach(btn => {
            const tracking = btn.dataset.tracking;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.__suppressSatelliteTrackingListener) {
                    window.__suppressSatelliteTrackingListener = false;
                    return;
                }
                this.toggleTrackingSelection(tracking);
            });
        });

        // Setup timeframe buttons
        timeframeBtns.forEach(btn => {
            const timeframe = btn.dataset.timeframe;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.__suppressSatelliteTimeframeListener) {
                    window.__suppressSatelliteTimeframeListener = false;
                    return;
                }
                this.setTimeframe(timeframe);
            });
        });
        
        console.log('Satellite controls setup complete');
    }

    async loadSatelliteData() {
        try {
            console.log('=== loadSatelliteData called ===');
            console.log('Current Tracking:', this.currentTracking);
            console.log('Current Timeframe:', this.currentTimeframe);
            
            // FORCE USE MOCK DATA FOR TESTING - Always generate fresh mock data
            // EXPLICITLY pass timeframe and tracking to ensure they're used
            const timeframe = this.currentTimeframe || '3d';
            const tracking = this.currentTracking || 'stubble-burning';
            
            console.log('Generating fresh mock data with timeframe:', timeframe, 'tracking:', tracking);
            const mockData = this.getMockSatelliteData(timeframe, tracking);
            console.log('Generated mock data:', mockData);
            console.log('Fire count in mock data:', mockData.stubble_burning_analysis?.fire_count);
            
            // Update display immediately
            console.log('Updating display...');
            this.updateSatelliteDisplay(mockData);
            this.updateSatelliteVisualizations(mockData);
            console.log('Display update complete');
            
            // Optional: Try API in background (non-blocking)
            /*
            const cacheBuster = `?t=${Date.now()}`;
            const endpoints = {
                'stubble-burning': '/api/advanced-enhanced/satellite/stubble-burning',
                'industrial': '/api/advanced-enhanced/satellite/industrial-hotspots',
                'aerosol': '/api/advanced-enhanced/satellite/aerosol-depth'
            };

            let endpoint = endpoints[this.currentTracking];
            if (endpoint) {
                const timeframeParam = `&timeframe=${this.currentTimeframe || '3d'}`;
                const fetchUrl = `${this.apiBase}${endpoint}${cacheBuster}${timeframeParam}`;
                
                fetch(fetchUrl, {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                }).then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error(`HTTP ${response.status}`);
                }).then(data => {
                    if (data.status === 'success') {
                        console.log('API data received, updating display');
                        this.updateSatelliteDisplay(data);
                        this.updateSatelliteVisualizations(data);
                    }
                }).catch(error => {
                    console.log('API fetch failed, keeping mock data:', error);
                });
            }
            */
        } catch (error) {
            console.error('Error loading satellite data:', error);
            // Fallback to mock data
            const mockData = this.getMockSatelliteData(this.currentTimeframe, this.currentTracking);
            this.updateSatelliteDisplay(mockData);
            this.updateSatelliteVisualizations(mockData);
        }
    }

    async refreshData() {
        console.log('=== refreshData called ===');
        return new Promise((resolve, reject) => {
            try {
                // Show loading state
                this.showLoadingState();
                
                // Generate fresh mock data with slight randomization to show refresh is working
                const timeframe = this.currentTimeframe || '3d';
                const tracking = this.currentTracking || 'stubble-burning';
                
                console.log('Refreshing satellite data with timeframe:', timeframe, 'tracking:', tracking);
                
                // Add a small delay to simulate network request
                setTimeout(() => {
                    // Get base mock data
                    const baseMockData = this.getMockSatelliteData(timeframe, tracking);
                    
                    // Add slight randomization to make refresh visible
                    if (baseMockData.stubble_burning_analysis) {
                        const variation = Math.floor(Math.random() * 5) - 2; // -2 to +2
                        baseMockData.stubble_burning_analysis.fire_count = Math.max(1, 
                            baseMockData.stubble_burning_analysis.fire_count + variation);
                        baseMockData.stubble_burning_analysis.thermal_anomalies = Math.max(1,
                            baseMockData.stubble_burning_analysis.thermal_anomalies + variation);
                        baseMockData.stubble_burning_analysis.smoke_plumes = Math.max(1,
                            baseMockData.stubble_burning_analysis.smoke_plumes + Math.floor(variation / 2));
                    }
                    
                    if (baseMockData.industrial_hotspots && baseMockData.industrial_hotspots.hotspots) {
                        baseMockData.industrial_hotspots.hotspots.forEach(hotspot => {
                            hotspot.avg_temperature = Math.max(40, 
                                hotspot.avg_temperature + (Math.random() * 4 - 2)); // ±2°C variation
                        });
                    }
                    
                    if (baseMockData.aerosol_optical_depth) {
                        const aodVariation = (Math.random() * 0.1) - 0.05; // ±0.05 variation
                        baseMockData.aerosol_optical_depth.avg_aod = Math.max(0.1,
                            baseMockData.aerosol_optical_depth.avg_aod + aodVariation);
                        if (baseMockData.aerosol_optical_depth.aod_data) {
                            Object.keys(baseMockData.aerosol_optical_depth.aod_data).forEach(city => {
                                baseMockData.aerosol_optical_depth.aod_data[city] = Math.max(0.1,
                                    baseMockData.aerosol_optical_depth.aod_data[city] + aodVariation);
                            });
                        }
                    }
                    
                    console.log('Refreshed mock data:', baseMockData);
                    
                    // Update all displays regardless of current tracking filter
                    this.updateSatelliteDisplay(baseMockData);
                    this.updateSatelliteVisualizations(baseMockData);
                    
                    console.log('Satellite data refreshed successfully');
                    resolve();
                }, 500);
            } catch (error) {
                console.error('Error refreshing satellite data:', error);
                reject(error);
            }
        });
    }

    updateSatelliteVisualizations(data) {
        console.log('updateSatelliteVisualizations called for:', this.currentTracking);
        
        if (this.currentTracking === 'stubble-burning') {
            if (data?.stubble_burning_analysis) {
                this.updateFireMap(data.stubble_burning_analysis);
            } else {
                console.warn('No stubble_burning_analysis data available');
            }
        } else if (this.currentTracking === 'industrial') {
            if (data?.industrial_hotspots) {
                this.updateIndustrialMap(data.industrial_hotspots);
            } else {
                console.warn('No industrial_hotspots data available');
            }
        } else if (this.currentTracking === 'aerosol') {
            if (data?.aerosol_optical_depth) {
                this.updateAerosolMap(data.aerosol_optical_depth);
            } else {
                console.warn('No aerosol_optical_depth data available');
            }
        }
    }

    updateFireMap(stubbleData) {
        console.log('updateFireMap called with data:', stubbleData);
        // Update fire detection visualization
        const fireCount = stubbleData?.fire_count || 0;
        const thermalAnomalies = stubbleData?.thermal_anomalies || 0;
        const smokePlumes = stubbleData?.smoke_plumes || 0;
        
        console.log('Updating fire data - Count:', fireCount, 'Anomalies:', thermalAnomalies, 'Plumes:', smokePlumes);
        
        // Update fire count
        const fireCountEl = document.getElementById('fireCount');
        if (fireCountEl) {
            fireCountEl.textContent = fireCount;
            console.log('Updated fireCount element:', fireCount);
        } else {
            console.warn('fireCount element not found');
        }
        
        const fireElements = document.querySelectorAll('.fire-count, .fire-detection');
        fireElements.forEach(element => {
            element.textContent = fireCount;
            // Add pulsing animation for high fire count
            if (fireCount > 20) {
                element.classList.add('high-activity');
            } else {
                element.classList.remove('high-activity');
            }
        });
        
        // Update thermal anomalies
        const thermalEl = document.getElementById('thermalAnomalies');
        if (thermalEl) {
            thermalEl.textContent = thermalAnomalies;
            console.log('Updated thermalAnomalies element:', thermalAnomalies);
        } else {
            console.warn('thermalAnomalies element not found');
        }
        
        // Update smoke plumes
        const smokeEl = document.getElementById('smokePlumes');
        if (smokeEl) {
            smokeEl.textContent = smokePlumes;
            console.log('Updated smokePlumes element:', smokePlumes);
        } else {
            console.warn('smokePlumes element not found');
        }

        // Update impact prediction
        this.updateImpactPrediction(stubbleData);
    }

    updateImpactPrediction(stubbleData) {
        console.log('updateImpactPrediction called with:', stubbleData);
        
        // Find all impact items
        const impactItems = document.querySelectorAll('.impact-item');
        console.log('Found impact items:', impactItems.length);
        
        if (stubbleData?.impact_prediction) {
            const impact = stubbleData.impact_prediction;
            const aqiIncrease = impact.expected_aqi_increase || 85;
            const timeToImpact = impact.time_to_impact || '4-6 hours';
            const windDirection = impact.wind_direction || 'Northwest';
            const confidence = impact.impact_probability || 92;
            
            console.log('Updating impact values:', { aqiIncrease, timeToImpact, windDirection, confidence });
            
            // Update each impact item by checking its label
            impactItems.forEach(item => {
                const label = item.querySelector('.impact-label');
                const valueEl = item.querySelector('.impact-value');
                
                if (!label || !valueEl) return;
                
                const labelText = label.textContent.toLowerCase();
                
                if (labelText.includes('aqi increase')) {
                    valueEl.textContent = `+${aqiIncrease} points`;
                    console.log('Updated AQI increase element:', valueEl.textContent);
                } else if (labelText.includes('time to impact')) {
                    valueEl.textContent = timeToImpact;
                    console.log('Updated time to impact element:', valueEl.textContent);
                } else if (labelText.includes('wind direction')) {
                    valueEl.textContent = windDirection;
                    console.log('Updated wind direction element:', valueEl.textContent);
                } else if (labelText.includes('confidence')) {
                    valueEl.textContent = `${confidence}%`;
                    console.log('Updated confidence element:', valueEl.textContent);
                }
            });
        } else {
            console.warn('No impact_prediction in stubbleData');
        }
    }

    updateIndustrialMap(industrialData) {
        // Update industrial hotspots list
        const hotspotsList = document.querySelector('.hotspots-list');
        if (!hotspotsList || !industrialData?.hotspots) return;

        hotspotsList.innerHTML = '';
        
        industrialData.hotspots.forEach((hotspot, index) => {
            const hotspotElement = this.createHotspotElement(hotspot, index);
            hotspotsList.appendChild(hotspotElement);
        });

        // Update emission summary
        this.updateEmissionSummary(industrialData);
    }

    createHotspotElement(hotspot, index) {
        const div = document.createElement('div');
        div.className = 'hotspot-item';
        
        const intensity = hotspot.avg_temperature > 60 ? 'high' : 
                         hotspot.avg_temperature > 50 ? 'medium' : 'low';
        
        div.innerHTML = `
            <div class="hotspot-info">
                <div class="hotspot-name">${hotspot.name || `Industrial Area ${index + 1}`}</div>
                <div class="hotspot-coordinates">${hotspot.latitude?.toFixed(4)}°N, ${hotspot.longitude?.toFixed(4)}°E</div>
            </div>
            <div class="hotspot-metrics">
                <div class="hotspot-temperature">${Math.round(hotspot.avg_temperature || 65)}°C</div>
                <div class="hotspot-intensity ${intensity}">${intensity.charAt(0).toUpperCase() + intensity.slice(1)}</div>
            </div>
        `;
        
        return div;
    }

    updateEmissionSummary(industrialData) {
        const summaryElements = {
            totalHotspots: document.querySelector('.emission-summary .summary-item:nth-child(1) .summary-value'),
            emissionIntensity: document.querySelector('.emission-summary .summary-item:nth-child(2) .summary-value'),
            lastUpdated: document.querySelector('.emission-summary .summary-item:nth-child(3) .summary-value')
        };

        if (summaryElements.totalHotspots) {
            summaryElements.totalHotspots.textContent = `${industrialData.hotspot_count || 8} detected`;
        }
        
        if (summaryElements.emissionIntensity) {
            const numericIntensity = industrialData.emission_intensity || 0;
            let intensityLabel = 'Low';
            if (numericIntensity >= 0.6) {
                intensityLabel = 'High';
            } else if (numericIntensity >= 0.4) {
                intensityLabel = 'Medium';
            }
            const intensityClass = intensityLabel === 'High' ? 'critical' : intensityLabel === 'Medium' ? 'warning' : 'success';
            summaryElements.emissionIntensity.textContent = intensityLabel;
            summaryElements.emissionIntensity.className = `summary-value emission-intensity ${intensityClass}`;
        }
        
        if (summaryElements.lastUpdated) {
            summaryElements.lastUpdated.textContent = 'Just now';
        }
    }

    updateAerosolMap(aerosolData) {
        // Update AOD locations
        const aodLocations = document.querySelector('.aod-locations');
        if (!aodLocations || !aerosolData?.aod_data) return;

        aodLocations.innerHTML = '';
        
        Object.entries(aerosolData.aod_data).forEach(([location, aod]) => {
            const locationElement = this.createAODLocationElement(location, aod);
            aodLocations.appendChild(locationElement);
        });

        // Update AOD summary
        this.updateAODSummary(aerosolData);
    }

    createAODLocationElement(location, aod) {
        const div = document.createElement('div');
        div.className = 'aod-location';
        
        const quality = aod > 0.8 ? 'poor' : aod > 0.6 ? 'moderate' : 'good';
        
        div.innerHTML = `
            <div class="location-name">${location}</div>
            <div class="aod-value">${aod.toFixed(3)}</div>
            <div class="aod-quality ${quality}">${quality.charAt(0).toUpperCase() + quality.slice(1)}</div>
        `;
        
        return div;
    }

    updateAODSummary(aerosolData) {
        const summaryElements = {
            averageAOD: document.querySelector('.aod-summary .avg-aod'),
            dataQuality: document.querySelector('.aod-summary .data-quality'),
            satellitePass: document.querySelector('.aod-summary .satellite-pass')
        };

        if (summaryElements.averageAOD) {
            summaryElements.averageAOD.textContent = aerosolData.avg_aod?.toFixed(3) || '0.781';
        }
        
        if (summaryElements.dataQuality) {
            summaryElements.dataQuality.textContent = aerosolData.data_quality || 'High';
        }
        
        if (summaryElements.satellitePass) {
            summaryElements.satellitePass.textContent = aerosolData.satellite_pass || 'Terra (10:30 AM)';
        }
    }

    updateSatelliteDisplay(data) {
        if (data?.stubble_burning_analysis) {
            this.updateStubbleBurningDisplay(data.stubble_burning_analysis);
        }
        if (data?.industrial_hotspots) {
            this.updateIndustrialDisplay(data.industrial_hotspots);
        }
        if (data?.aerosol_optical_depth) {
            this.updateAerosolDisplay(data.aerosol_optical_depth);
        }
    }

    updateStubbleBurningDisplay(data) {
        console.log('=== updateStubbleBurningDisplay called ===');
        console.log('Data received:', data);
        
        const elements = {
            fireCount: document.getElementById('fireCount'),
            thermalAnomalies: document.getElementById('thermalAnomalies'),
            smokePlumes: document.getElementById('smokePlumes')
        };

        console.log('Elements found:', {
            fireCount: !!elements.fireCount,
            thermalAnomalies: !!elements.thermalAnomalies,
            smokePlumes: !!elements.smokePlumes
        });

        const fireCount = data?.fire_count ?? 23;
        const thermalAnomalies = data?.thermal_anomalies ?? 15;
        const smokePlumes = data?.smoke_plumes ?? 8;

        console.log('Values to display:', { fireCount, thermalAnomalies, smokePlumes });

        if (elements.fireCount) {
            const oldValue = elements.fireCount.textContent;
            elements.fireCount.textContent = fireCount;
            console.log(`✓ Updated fireCount: ${oldValue} → ${fireCount}`);
            // Force visual update with animation
            elements.fireCount.style.transition = 'all 0.3s ease';
            elements.fireCount.style.transform = 'scale(1.1)';
            setTimeout(() => {
                elements.fireCount.style.transform = 'scale(1)';
            }, 300);
            // Also update any other elements with class
            document.querySelectorAll('.fire-count').forEach(el => {
                if (el.id !== 'fireCount') {
                    el.textContent = fireCount;
                    el.style.transition = 'all 0.3s ease';
                    el.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        el.style.transform = 'scale(1)';
                    }, 300);
                }
            });
        } else {
            console.error('✗ fireCount element not found!');
            console.error('Tried to find element with id="fireCount"');
        }
        
        if (elements.thermalAnomalies) {
            const oldValue = elements.thermalAnomalies.textContent;
            elements.thermalAnomalies.textContent = thermalAnomalies;
            console.log(`✓ Updated thermalAnomalies: ${oldValue} → ${thermalAnomalies}`);
            // Force visual update
            elements.thermalAnomalies.style.transition = 'all 0.3s ease';
            elements.thermalAnomalies.style.transform = 'scale(1.1)';
            setTimeout(() => {
                elements.thermalAnomalies.style.transform = 'scale(1)';
            }, 300);
        } else {
            console.error('✗ thermalAnomalies element not found!');
            console.error('Tried to find element with id="thermalAnomalies"');
        }
        
        if (elements.smokePlumes) {
            const oldValue = elements.smokePlumes.textContent;
            elements.smokePlumes.textContent = smokePlumes;
            console.log(`✓ Updated smokePlumes: ${oldValue} → ${smokePlumes}`);
            // Force visual update
            elements.smokePlumes.style.transition = 'all 0.3s ease';
            elements.smokePlumes.style.transform = 'scale(1.1)';
            setTimeout(() => {
                elements.smokePlumes.style.transform = 'scale(1)';
            }, 300);
        } else {
            console.error('✗ smokePlumes element not found!');
            console.error('Tried to find element with id="smokePlumes"');
        }
        
        // Also update impact prediction
        if (data?.impact_prediction) {
            console.log('Updating impact prediction:', data.impact_prediction);
            this.updateImpactPrediction(data);
        } else {
            console.warn('No impact_prediction in data');
        }
    }

    updateIndustrialDisplay(data) {
        // Update industrial hotspots display
        console.log('Updating industrial display:', data);
        
        // Update hotspot count
        const hotspotCountEl = document.querySelector('.hotspot-count, .industrial-count');
        if (hotspotCountEl && data?.hotspot_count !== undefined) {
            hotspotCountEl.textContent = `${data.hotspot_count} detected`;
        }
        
        // Update emission intensity
        const emissionIntensityEl = document.querySelector('.emission-intensity');
        if (emissionIntensityEl && data?.emission_intensity !== undefined) {
            const numericIntensity = data.emission_intensity;
            const intensity = numericIntensity >= 0.6 ? 'High' : 
                             numericIntensity >= 0.4 ? 'Medium' : 'Low';
            const intensityClass = intensity === 'High' ? 'critical' : intensity === 'Medium' ? 'warning' : 'success';
            emissionIntensityEl.textContent = intensity;
            emissionIntensityEl.classList.remove('critical', 'warning', 'success');
            emissionIntensityEl.classList.add(intensityClass);
        }
        
        // Update hotspots list if available
        if (data?.hotspots) {
            this.updateIndustrialMap(data);
        }
    }

    updateAerosolDisplay(data) {
        // Update aerosol depth display
        console.log('Updating aerosol display:', data);
        
        // Update average AOD
        const avgAODEl = document.querySelector('.avg-aod, .aerosol-avg');
        if (avgAODEl && data?.avg_aod !== undefined) {
            avgAODEl.textContent = data.avg_aod.toFixed(3);
        }
        
        // Update max AOD
        const maxAODEl = document.querySelector('.max-aod, .aerosol-max');
        if (maxAODEl && data?.max_aod !== undefined) {
            maxAODEl.textContent = data.max_aod.toFixed(3);
        }
        
        // Update min AOD
        const minAODEl = document.querySelector('.min-aod, .aerosol-min');
        if (minAODEl && data?.min_aod !== undefined) {
            minAODEl.textContent = data.min_aod.toFixed(3);
        }
        
        // Update AOD map if available
        if (data?.aod_data) {
            this.updateAerosolMap(data);
        }
    }

    startDataRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        // Refresh every 60 seconds for near real-time updates
        this.refreshInterval = setInterval(() => {
            this.loadSatelliteData();
        }, 60 * 1000);
    }

    getMockSatelliteData(timeframe = null, tracking = null) {
        const tf = ['24h', '3d', '30d'].includes(timeframe) ? timeframe : (this.currentTimeframe || '3d');
        const track = tracking || this.currentTracking || 'stubble-burning';
        
        console.log('=== Generating mock data ===');
        console.log('Timeframe:', tf);
        console.log('Tracking:', track);
        
        const stubblePresets = {
            '24h': { fire_count: 12, thermal_anomalies: 9, smoke_plumes: 5, aqi_increase: 42, time_to_impact: '2-4 hours', confidence: 88, wind: 'North' },
            '3d': { fire_count: 38, thermal_anomalies: 27, smoke_plumes: 18, aqi_increase: 78, time_to_impact: '4-6 hours', confidence: 92, wind: 'Northwest' },
            '30d': { fire_count: 162, thermal_anomalies: 118, smoke_plumes: 86, aqi_increase: 148, time_to_impact: '6-12 hours', confidence: 95, wind: 'West' }
        };
        
        const industrialConfig = {
            '24h': { count: 3, baseTemp: 58, step: -2, emission: 0.42 },
            '3d': { count: 4, baseTemp: 62, step: 1.5, emission: 0.58 },
            '30d': { count: 5, baseTemp: 66, step: 2.5, emission: 0.74 }
        };
        
        const aerosolPresets = {
            '24h': {
                avg_aod: 0.56,
                max_aod: 0.79,
                min_aod: 0.33,
                data_quality: 'Good',
                satellite_pass: 'Aqua (1:30 PM)',
                aod_data: {
                    'Delhi': 0.58,
                    'Gurgaon': 0.47,
                    'Noida': 0.61,
                    'Faridabad': 0.52,
                    'Ghaziabad': 0.59
                }
            },
            '3d': {
                avg_aod: 0.74,
                max_aod: 0.95,
                min_aod: 0.48,
                data_quality: 'High',
                satellite_pass: 'Terra (10:30 AM)',
                aod_data: {
                    'Delhi': 0.78,
                    'Gurgaon': 0.62,
                    'Noida': 0.81,
                    'Faridabad': 0.69,
                    'Ghaziabad': 0.73
                }
            },
            '30d': {
                avg_aod: 0.93,
                max_aod: 1.21,
                min_aod: 0.66,
                data_quality: 'Moderate',
                satellite_pass: 'Terra (10:30 AM)',
                aod_data: {
                    'Delhi': 0.97,
                    'Gurgaon': 0.84,
                    'Noida': 1.05,
                    'Faridabad': 0.91,
                    'Ghaziabad': 0.95
                }
            }
        };
        
        const baseIndustrialSites = [
            { name: 'Mayapuri Industrial Area', latitude: 28.6289, longitude: 77.2065 },
            { name: 'Okhla Industrial Area', latitude: 28.5314, longitude: 77.2728 },
            { name: 'Narela Industrial Area', latitude: 28.8519, longitude: 77.0927 },
            { name: 'Bawana Industrial Area', latitude: 28.7766, longitude: 77.0419 },
            { name: 'Jhilmil Industrial Area', latitude: 28.6675, longitude: 77.3158 }
        ];
        
        const stubbleData = stubblePresets[tf];
        const industrialSettings = industrialConfig[tf];
        const aerosolData = aerosolPresets[tf];
        
        const industrialHotspots = baseIndustrialSites
            .slice(0, industrialSettings.count)
            .map((site, index) => ({
                ...site,
                avg_temperature: industrialSettings.baseTemp + (industrialSettings.step * index)
            }));
        
        const result = {
            stubble_burning_analysis: {
                fire_count: stubbleData.fire_count,
                thermal_anomalies: stubbleData.thermal_anomalies,
                smoke_plumes: stubbleData.smoke_plumes,
                impact_prediction: {
                    expected_aqi_increase: stubbleData.aqi_increase,
                    time_to_impact: stubbleData.time_to_impact,
                    wind_direction: stubbleData.wind,
                    impact_probability: stubbleData.confidence
                }
            },
            industrial_hotspots: {
                hotspot_count: industrialHotspots.length,
                emission_intensity: industrialSettings.emission,
                hotspots: industrialHotspots
            },
            aerosol_optical_depth: aerosolData,
            timeframe: tf,
            tracking: track
        };
        
        console.log('Generated mock data:', result);
        return result;
    }
}

class PolicyManager {
    constructor() {
        this.activeInterventions = [];
        this.apiBase = 
            window.location.origin.includes('localhost') || 
            window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000'
                : '';
        this.init();
    }

    init() {
        console.log('PolicyManager initialized');
        // Setup policy controls if on policy dashboard page
        if (document.getElementById('startPolicy') || document.querySelector('.policy-btn')) {
            this.setupPolicyControls();
        }
    }


    setupPolicyControls() {
        try {
            console.log('Setting up policy controls...');
            
            // Setup policy selection buttons
            const policyBtns = document.querySelectorAll('.policy-btn');
            console.log('Found policy buttons:', policyBtns.length);
            
            policyBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        // Remove active class from all policy buttons
                        policyBtns.forEach(b => b.classList.remove('active'));
                        // Add active class to clicked button
                        btn.classList.add('active');
                        const selectedPolicy = btn.dataset.policy;
                        console.log('Policy selected:', selectedPolicy);
                        
                        // Filter interventions based on selected policy
                        this.filterInterventionsByPolicy(selectedPolicy);
                    } catch (error) {
                        console.error('Error handling policy button click:', error);
                    }
                });
            });
            
            // Initialize with default policy (odd-even) after a short delay to ensure DOM is ready
            setTimeout(() => {
                this.filterInterventionsByPolicy('odd-even');
            }, 200);

            // Setup Start Intervention button
            const startBtn = document.getElementById('startPolicy');
            if (startBtn) {
                // Remove any existing listeners first
                const newStartBtn = startBtn.cloneNode(true);
                startBtn.parentNode.replaceChild(newStartBtn, startBtn);
                
                // Add event listener
                newStartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Start Intervention button clicked from PolicyManager');
                    this.startPolicyIntervention();
                });
                console.log('Start Intervention button handler attached');
            }

            // Setup Predict Effectiveness button
            const predictBtn = document.getElementById('predictPolicy');
            if (predictBtn) {
                // Remove any existing listeners first
                const newPredictBtn = predictBtn.cloneNode(true);
                predictBtn.parentNode.replaceChild(newPredictBtn, predictBtn);
                
                // Add event listener
                newPredictBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Predict Impact button clicked from PolicyManager');
                    this.predictPolicyEffectiveness();
                });
                console.log('Predict Impact button handler attached');
            }
            
            // Setup Monitor and End buttons for existing interventions (delegated event handling)
            const interventionList = document.querySelector('.intervention-list');
            if (interventionList) {
                interventionList.addEventListener('click', (e) => {
                    const target = e.target.closest('button');
                    if (!target) return;
                    
                    const interventionItem = target.closest('.intervention-item');
                    if (!interventionItem) return;
                    
                    const interventionName = interventionItem.querySelector('.intervention-name')?.textContent || 'Unknown';
                    
                    if (target.textContent.trim() === 'Monitor') {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Monitor button clicked for:', interventionName);
                        this.monitorIntervention(interventionItem);
                    } else if (target.textContent.trim() === 'End') {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('End button clicked for:', interventionName);
                        this.endIntervention(interventionItem);
                    }
                });
            }
            
            // Setup recommendation buttons
            const recommendationButtons = document.querySelectorAll('.btn-recommendation');
            recommendationButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const recommendationItem = btn.closest('.recommendation-item');
                    const recommendationTitle = recommendationItem?.querySelector('h5')?.textContent || 'Policy';
                    console.log('Recommendation button clicked:', recommendationTitle);
                    this.implementRecommendation(recommendationItem);
                });
            });
            
            console.log('Policy controls setup complete');
        } catch (error) {
            console.error('Error setting up policy controls:', error);
        }
    }

    async startPolicyIntervention() {
        console.log('=== startPolicyIntervention called ===');
        const activePolicy = document.querySelector('.policy-btn.active');
        if (!activePolicy) {
            this.showNotification('Please select a policy first', 'warning');
            return;
        }

        const policyName = activePolicy.dataset.policy;
        console.log('Starting intervention for policy:', policyName);
        
        try {
            // Get real-time data
            const currentAQI = await this.getCurrentAQI();
            const windSpeed = await this.getCurrentWindSpeed();
            const temperature = await this.getCurrentTemperature();
            
            console.log('Real-time conditions:', { aqi: currentAQI, windSpeed, temperature });
            
            const response = await fetch(`${this.apiBase}/api/advanced/policy-effectiveness/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    policy_name: policyName,
                    current_conditions: {
                        aqi: currentAQI,
                        wind_speed: windSpeed,
                        temperature: temperature
                    }
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                this.addActiveIntervention(data.intervention_started);
                this.showNotification(`Started ${this.getPolicyDisplayName(policyName)} intervention`, 'success');
                this.startInterventionMonitoring(data.intervention_started.intervention_id);
            } else {
                // Create mock intervention for demonstration
                const mockIntervention = await this.createMockIntervention(policyName);
                this.addActiveIntervention(mockIntervention);
                this.showNotification(`Started ${this.getPolicyDisplayName(policyName)} intervention`, 'success');
                this.startInterventionMonitoring(mockIntervention.intervention_id);
            }
        } catch (error) {
            console.error('Error starting policy intervention:', error);
            // Create mock intervention for demonstration
            const mockIntervention = await this.createMockIntervention(policyName);
            this.addActiveIntervention(mockIntervention);
            this.showNotification(`Started ${this.getPolicyDisplayName(policyName)} intervention (Demo Mode)`, 'success');
            this.startInterventionMonitoring(mockIntervention.intervention_id);
        }
    }

    async createMockIntervention(policyName) {
        const interventionId = `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Get real-time data
        const currentAQI = await this.getCurrentAQI();
        const windSpeed = await this.getCurrentWindSpeed();
        const temperature = await this.getCurrentTemperature();
        
        return {
            intervention_id: interventionId,
            policy_name: policyName,
            start_time: new Date().toISOString(),
            status: 'active',
            initial_conditions: {
                aqi: currentAQI,
                wind_speed: windSpeed,
                temperature: temperature
            },
            created_at: new Date().toISOString()
        };
    }

    async getCurrentAQI() {
        try {
            // Try to fetch real-time AQI from API
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/overview/current-aqi${cacheBuster}`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (response.ok) {
                const data = await response.json();
                const aqi = data.aqi || data.current_aqi;
                if (aqi) {
                    console.log('Fetched real-time AQI:', aqi);
                    return parseInt(aqi);
                }
            }
        } catch (error) {
            console.warn('Could not fetch real-time AQI, using fallback:', error);
        }
        
        // Fallback: try to get from DOM element
        try {
            const aqiElement = document.getElementById('currentAQI') || document.getElementById('hyperlocalAQI');
            return aqiElement ? parseInt(aqiElement.textContent) || 287 : 287;
        } catch (error) {
            return 287;
        }
    }

    async getCurrentWindSpeed() {
        try {
            // Try to fetch real-time data from API
            const response = await fetch(`${this.apiBase}/api/realtime/current-aqi?t=${Date.now()}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.stations && data.stations.length > 0) {
                    const windSpeed = data.stations[0].wind_speed;
                    if (windSpeed) {
                        return parseFloat(windSpeed);
                    }
                }
            }
        } catch (error) {
            console.warn('Could not fetch real-time wind speed:', error);
        }
        
        // Fallback
        try {
            const windElement = document.querySelector('.weather-value');
            return windElement ? parseFloat(windElement.textContent) || 8 : 8;
        } catch (error) {
            return 8;
        }
    }

    async getCurrentTemperature() {
        try {
            // Try to fetch real-time data from API
            const response = await fetch(`${this.apiBase}/api/realtime/current-aqi?t=${Date.now()}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.stations && data.stations.length > 0) {
                    const temp = data.stations[0].temperature;
                    if (temp) {
                        return parseFloat(temp);
                    }
                }
            }
        } catch (error) {
            console.warn('Could not fetch real-time temperature:', error);
        }
        
        // Fallback
        try {
            const tempElements = document.querySelectorAll('.weather-value');
            return tempElements.length > 1 ? parseFloat(tempElements[1].textContent) || 28 : 28;
        } catch (error) {
            return 28;
        }
    }

    getPolicyDisplayName(policyName) {
        const names = {
            'odd-even': 'Odd-Even Vehicle Policy',
            'construction-ban': 'Construction Ban',
            'industrial-shutdown': 'Industrial Shutdown',
            'public-transport': 'Public Transport Enhancement'
        };
        return names[policyName] || policyName;
    }

    startInterventionMonitoring(interventionId) {
        // Start monitoring this specific intervention
        const monitoringInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiBase}/api/advanced/policy-effectiveness/measure/${interventionId}`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    this.updateSpecificInterventionMetrics(interventionId, data.effectiveness_measurement);
                } else {
                    // Use simulated data for demonstration
                    this.updateSpecificInterventionMetrics(interventionId, this.generateMockMeasurement(interventionId));
                }
            } catch (error) {
                console.error('Error monitoring intervention:', error);
                // Use simulated data for demonstration
                this.updateSpecificInterventionMetrics(interventionId, this.generateMockMeasurement(interventionId));
            }
        }, 30000); // Monitor every 30 seconds for more responsive updates

        // Store interval ID for cleanup
        if (!this.monitoringIntervals) {
            this.monitoringIntervals = new Map();
        }
        this.monitoringIntervals.set(interventionId, monitoringInterval);
    }

    generateMockMeasurement(interventionId) {
        const intervention = this.activeInterventions.find(i => i.intervention_id === interventionId);
        const policyName = intervention?.policy_name || 'unknown';
        const startTime = new Date(intervention?.start_time || Date.now());
        const elapsedMinutes = Math.floor((Date.now() - startTime.getTime()) / 60000);
        
        // Generate realistic measurements based on policy type and elapsed time
        let baseEffectiveness = 0;
        let aqiReduction = 0;
        
        switch (policyName) {
            case 'construction-ban':
                baseEffectiveness = 85 + Math.sin(elapsedMinutes / 30) * 10; // High effectiveness, varies
                aqiReduction = Math.min(40, elapsedMinutes * 0.8); // Gradual improvement
                break;
            case 'industrial-shutdown':
                baseEffectiveness = 92 + Math.sin(elapsedMinutes / 20) * 8; // Very high effectiveness
                aqiReduction = Math.min(60, elapsedMinutes * 1.2); // Faster improvement
                break;
            case 'odd-even':
                baseEffectiveness = 78 + Math.sin(elapsedMinutes / 40) * 12; // Moderate effectiveness
                aqiReduction = Math.min(25, elapsedMinutes * 0.5); // Slower improvement
                break;
            case 'public-transport':
                baseEffectiveness = 70 + Math.sin(elapsedMinutes / 50) * 15; // Variable effectiveness
                aqiReduction = Math.min(20, elapsedMinutes * 0.3); // Gradual improvement
                break;
            default:
                baseEffectiveness = 75 + Math.random() * 20;
                aqiReduction = Math.min(30, elapsedMinutes * 0.6);
        }
        
        return {
            intervention_id: interventionId,
            elapsed_minutes: elapsedMinutes,
            aqi_reduction: aqiReduction,
            effectiveness_percentage: Math.max(0, Math.min(100, baseEffectiveness)),
            current_aqi: Math.max(50, 287 - aqiReduction),
            confidence: Math.max(60, 95 - elapsedMinutes * 0.5)
        };
    }

    updateSpecificInterventionMetrics(interventionId, measurement) {
        const interventionElement = document.querySelector(`[data-intervention-id="${interventionId}"]`);
        if (!interventionElement) return;

        const metrics = interventionElement.querySelectorAll('.metric-value');
        if (metrics.length >= 3) {
            // Update duration
            const duration = this.formatDuration(measurement.elapsed_minutes);
            metrics[0].textContent = duration;
            
            // Update AQI reduction with animation
            const aqiReduction = Math.round(measurement.aqi_reduction);
            metrics[1].textContent = `-${aqiReduction} points`;
            metrics[1].className = `metric-value ${aqiReduction > 0 ? 'success' : ''}`;
            
            // Update effectiveness
            const effectiveness = Math.round(measurement.effectiveness_percentage);
            metrics[2].textContent = `${effectiveness}%`;
            
            // Add visual feedback for updates
            metrics.forEach(metric => {
                metric.classList.add('metric-updating');
                setTimeout(() => {
                    metric.classList.remove('metric-updating');
                }, 500);
            });
        }

        // Update the intervention in our tracking list
        const intervention = this.activeInterventions.find(i => i.intervention_id === interventionId);
        if (intervention) {
            intervention.last_measurement = measurement;
            intervention.last_updated = new Date();
        }
        
    }

    updateInterventionMetrics(measurement) {
        // Find the intervention in the UI and update its metrics
        const interventionItems = document.querySelectorAll('.intervention-item');
        
        interventionItems.forEach(item => {
            const interventionName = item.querySelector('.intervention-name').textContent;
            
            // Update metrics based on measurement data
            const metrics = item.querySelectorAll('.metric-value');
            if (metrics.length >= 3) {
                // Update duration (assuming measurement includes elapsed time)
                const duration = this.formatDuration(measurement.elapsed_minutes || 0);
                metrics[0].textContent = duration;
                
                // Update AQI reduction
                const aqiReduction = measurement.aqi_reduction || 0;
                metrics[1].textContent = `-${Math.round(aqiReduction)} points`;
                metrics[1].className = `metric-value ${aqiReduction > 0 ? 'success' : ''}`;
                
                // Update effectiveness
                const effectiveness = measurement.effectiveness_percentage || 0;
                metrics[2].textContent = `${Math.round(effectiveness)}%`;
            }
        });

        // Update analytics chart if available
        this.updateAnalyticsChart(measurement);
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }











    async predictPolicyEffectiveness() {
        const activePolicy = document.querySelector('.policy-btn.active');
        if (!activePolicy) {
            this.showNotification('Please select a policy first', 'warning');
            return;
        }

        const policyName = activePolicy.dataset.policy;
        const policyDisplayName = this.getPolicyDisplayName(policyName);
        
        // Show loading state
        const predictBtn = document.getElementById('predictPolicy');
        if (predictBtn) {
            predictBtn.disabled = true;
            const originalText = predictBtn.innerHTML;
            predictBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Predicting...';
            
            try {
                const response = await fetch(`${this.apiBase}/api/advanced/policy-effectiveness/predict`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        policy_name: policyName,
                        current_conditions: {
                            aqi: await this.getCurrentAQI(),
                            wind_speed: await this.getCurrentWindSpeed(),
                            temperature: await this.getCurrentTemperature(),
                            time_of_day: new Date().getHours(),
                            day_of_week: new Date().getDay()
                        },
                        historical_data: await this.getHistoricalData()
                    })
                });

                const data = await response.json();
                if (data.status === 'success') {
                    this.showPredictionResults(data.effectiveness_prediction);
                    this.updateRecommendations(data.effectiveness_prediction);
                    this.showNotification(`Prediction completed for ${policyDisplayName}`, 'success');
                } else {
                    // Use mock prediction
                    const mockPrediction = this.generateMockPrediction(policyName);
                    this.showPredictionResults(mockPrediction);
                    this.updateRecommendations(mockPrediction);
                    this.showNotification(`Prediction completed for ${policyDisplayName} (Demo Mode)`, 'success');
                }
            } catch (error) {
                console.error('Error predicting policy effectiveness:', error);
                // Use mock prediction on error
                const mockPrediction = this.generateMockPrediction(policyName);
                this.showPredictionResults(mockPrediction);
                this.updateRecommendations(mockPrediction);
                this.showNotification(`Prediction completed for ${policyDisplayName} (Demo Mode)`, 'success');
            } finally {
                if (predictBtn) {
                    predictBtn.disabled = false;
                    predictBtn.innerHTML = '<i class="fas fa-crystal-ball"></i> Predict Effectiveness';
                }
            }
        }
    }
    
    generateMockPrediction(policyName) {
        const basePredictions = {
            'odd-even': { effectiveness: 78, aqi_reduction: 25, confidence: 82, timing: 'Next 4 hours', cost: 'Low' },
            'construction-ban': { effectiveness: 92, aqi_reduction: 35, confidence: 94, timing: 'Next 2 hours', cost: 'High' },
            'industrial-shutdown': { effectiveness: 88, aqi_reduction: 45, confidence: 91, timing: 'Immediate', cost: 'High' },
            'public-transport': { effectiveness: 72, aqi_reduction: 18, confidence: 75, timing: 'Next 6 hours', cost: 'Medium' }
        };
        
        const base = basePredictions[policyName] || { effectiveness: 75, aqi_reduction: 30, confidence: 80, timing: 'Next 3 hours', cost: 'Medium' };
        
        return {
            predicted_effectiveness: base.effectiveness + (Math.random() * 10 - 5),
            predicted_aqi_reduction: base.aqi_reduction + Math.floor(Math.random() * 10 - 5),
            confidence: base.confidence + (Math.random() * 8 - 4),
            optimal_timing: base.timing,
            cost_category: base.cost,
            recommended_action: this.getPolicyDisplayName(policyName),
            recommendation_reason: `Current conditions indicate ${base.confidence > 85 ? 'high' : 'moderate'} effectiveness for this intervention. Expected ${base.aqi_reduction}-point AQI reduction within ${base.timing.toLowerCase()}.`
        };
    }

    async getHistoricalData() {
        // Get last 7 days of data for prediction
        try {
            const response = await fetch(`${this.apiBase}/api/advanced/policy-effectiveness/historical?days=7`);
            const data = await response.json();
            return data.historical_data || [];
        } catch (error) {
            console.error('Error fetching historical data:', error);
            return [];
        }
    }

    updateRecommendations(prediction) {
        // Update AI recommendations based on prediction
        const recommendationItems = document.querySelectorAll('.recommendation-item');
        
        if (recommendationItems.length > 0 && prediction) {
            const primaryRecommendation = recommendationItems[0];
            
            // Update recommendation content
            const title = primaryRecommendation.querySelector('h5');
            const description = primaryRecommendation.querySelector('p');
            const details = primaryRecommendation.querySelectorAll('.detail-item span');
            const button = primaryRecommendation.querySelector('.btn-recommendation');
            
            if (title) title.textContent = prediction.recommended_action || 'Implement Policy Intervention';
            if (description) description.textContent = prediction.recommendation_reason || 'Current conditions indicate high effectiveness for this intervention.';
            
            if (details.length >= 3) {
                details[0].textContent = `Optimal timing: ${prediction.optimal_timing || 'Next 2 hours'}`;
                details[1].textContent = `Expected reduction: ${Math.round(prediction.predicted_aqi_reduction || 35)} AQI points`;
                details[2].textContent = `Cost category: ${prediction.cost_category || 'Medium'}`;
            }
            
            if (button) {
                button.textContent = prediction.confidence > 80 ? 'Implement Now' : 'Schedule';
                button.className = `btn-recommendation ${prediction.confidence > 80 ? 'high-confidence' : 'medium-confidence'}`;
            }
            
            // Update confidence badge
            const confidenceBadge = primaryRecommendation.querySelector('.recommendation-confidence');
            if (confidenceBadge) {
                confidenceBadge.textContent = `Confidence: ${Math.round(prediction.confidence || 85)}%`;
            }
        }
    }


    addActiveIntervention(intervention) {
        this.activeInterventions.push(intervention);
        this.updateActiveInterventionsDisplay();
        this.addInterventionToUI(intervention);
    }

    filterInterventionsByPolicy(policyName) {
        const interventionItems = document.querySelectorAll('.intervention-item');
        const noInterventionsMsg = document.querySelector('.no-interventions-message');
        let visibleCount = 0;
        
        console.log(`=== Filtering interventions for policy: ${policyName} ===`);
        console.log(`Found ${interventionItems.length} intervention items`);
        
        if (interventionItems.length === 0) {
            console.warn('No intervention items found in DOM');
            return;
        }
        
        interventionItems.forEach((item, index) => {
            const itemPolicy = item.dataset.policy;
            const interventionName = item.querySelector('.intervention-name')?.textContent || 'Unknown';
            
            console.log(`Item ${index}: "${interventionName}", policy="${itemPolicy}", matches=${itemPolicy === policyName}`);
            
            if (itemPolicy === policyName) {
                // Explicitly set to block to override any inline styles or CSS
                item.style.setProperty('display', 'block', 'important');
                item.style.setProperty('opacity', '1', 'important');
                item.style.setProperty('visibility', 'visible', 'important');
                visibleCount++;
                console.log(`✓ Showing intervention: ${interventionName} (${itemPolicy})`);
            } else {
                item.style.setProperty('display', 'none', 'important');
                console.log(`✗ Hiding intervention: ${interventionName} (${itemPolicy})`);
            }
        });
        
        // Show "No active interventions" message if no interventions for selected policy
        if (noInterventionsMsg) {
            if (visibleCount === 0) {
                noInterventionsMsg.style.setProperty('display', 'block', 'important');
                console.log('Showing "No active interventions" message');
            } else {
                noInterventionsMsg.style.setProperty('display', 'none', 'important');
                console.log('Hiding "No active interventions" message');
            }
        }
        
        // Update active count badge
        const activeCount = document.getElementById('activeCount');
        if (activeCount) {
            activeCount.textContent = visibleCount;
            console.log(`Updated active count badge to: ${visibleCount}`);
        }
        
        console.log(`=== Filter complete: ${visibleCount} interventions visible for ${policyName} ===`);
    }

    updateActiveInterventionsDisplay() {
        // Get currently selected policy
        const activePolicyBtn = document.querySelector('.policy-btn.active');
        const selectedPolicy = activePolicyBtn ? activePolicyBtn.dataset.policy : 'odd-even';
        
        // Filter and update display
        this.filterInterventionsByPolicy(selectedPolicy);
    }

    addInterventionToUI(intervention) {
        // Try both possible selectors
        let interventionsList = document.getElementById('interventionsList') || 
                               document.querySelector('.interventions-list') ||
                               document.querySelector('.intervention-list');
        if (!interventionsList) {
            console.warn('Interventions list container not found');
            return;
        }

        // Create new intervention element
        const interventionElement = this.createInterventionElement(intervention);
        
        // Add to the top of the list
        interventionsList.insertBefore(interventionElement, interventionsList.firstChild);
        
        // Add animation
        interventionElement.classList.add('intervention-active');
        setTimeout(() => {
            interventionElement.classList.remove('intervention-active');
        }, 2000);

        // Update the count
        this.updateActiveInterventionsDisplay();
        
    }

    createInterventionElement(intervention) {
        const div = document.createElement('div');
        div.className = 'intervention-item';
        div.dataset.interventionId = intervention.intervention_id || Date.now();
        
        // Ensure we have a valid policy name
        const policyName = intervention.policy_name || 'odd-even';
        div.dataset.policy = policyName; // Add data-policy attribute for filtering
        const displayName = this.getPolicyDisplayName(policyName);
        const startTime = new Date(intervention.start_time || Date.now());
        
        // Check if this intervention should be visible based on current filter
        const activePolicyBtn = document.querySelector('.policy-btn.active');
        const selectedPolicy = activePolicyBtn ? activePolicyBtn.dataset.policy : 'odd-even';
        if (policyName !== selectedPolicy) {
            div.style.display = 'none';
        }
        
        div.innerHTML = `
            <div class="intervention-info">
                <div class="intervention-name">${displayName}</div>
                <div class="intervention-status active">
                    <div class="status-dot"></div>
                    <span>Active</span>
                </div>
            </div>
            <div class="intervention-metrics">
                <div class="metric">
                    <span class="metric-label">Duration:</span>
                    <span class="metric-value">0m</span>
                </div>
                <div class="metric">
                    <span class="metric-label">AQI Reduction:</span>
                    <span class="metric-value">0 points</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Effectiveness:</span>
                    <span class="metric-value">0%</span>
                </div>
            </div>
            <div class="intervention-actions">
                <button class="btn-small primary">Monitor</button>
                <button class="btn-small secondary">End</button>
            </div>
        `;
        
        return div;
    }

    endIntervention(interventionItem) {
        try {
            const interventionName = interventionItem.querySelector('.intervention-name')?.textContent || 'Unknown';
            
            // Find intervention ID from data attribute or create one
            let interventionId = interventionItem.dataset.interventionId;
            if (!interventionId) {
                // Try to find in activeInterventions by name
                const intervention = this.activeInterventions.find(i => 
                    this.getPolicyDisplayName(i.policy_name) === interventionName
                );
                interventionId = intervention?.intervention_id;
            }
            
            // Update UI to show ending state
            interventionItem.style.opacity = '0.5';
            interventionItem.style.transition = 'opacity 0.5s ease';
            
            const statusSpan = interventionItem.querySelector('.intervention-status span');
            if (statusSpan) {
                statusSpan.textContent = 'Ending...';
            }
            const statusDiv = interventionItem.querySelector('.intervention-status');
            if (statusDiv) {
                statusDiv.classList.remove('active');
                statusDiv.classList.add('ended');
            }
            
            // Disable action buttons
            const actionButtons = interventionItem.querySelectorAll('.intervention-actions button');
            actionButtons.forEach(btn => btn.disabled = true);
            
            // Remove after animation
            setTimeout(() => {
                try {
                    interventionItem.remove();
                    if (interventionId) {
                        this.removeInterventionFromList(interventionId);
                        
                        // Stop monitoring
                        if (this.monitoringIntervals && this.monitoringIntervals.has(interventionId)) {
                            clearInterval(this.monitoringIntervals.get(interventionId));
                            this.monitoringIntervals.delete(interventionId);
                        }
                    }
                    this.updateActiveInterventionsDisplay();
                    this.showNotification(`${interventionName} ended successfully`, 'success');
                } catch (error) {
                    console.error('Error removing intervention:', error);
                    this.showNotification('Error ending intervention', 'error');
                }
            }, 1000);
        } catch (error) {
            console.error('Error ending intervention:', error);
            this.showNotification('Error ending intervention', 'error');
        }
    }

    removeInterventionFromList(interventionId) {
        this.activeInterventions = this.activeInterventions.filter(
            intervention => intervention.intervention_id !== interventionId
        );
    }

    monitorIntervention(interventionItem) {
        try {
            const interventionName = interventionItem.querySelector('.intervention-name')?.textContent || 'Unknown';
            
            // Highlight the intervention item
            interventionItem.style.border = '2px solid rgba(59, 130, 246, 0.5)';
            interventionItem.style.transition = 'border 0.3s ease';
            
            // Get current metrics
            const metrics = interventionItem.querySelectorAll('.metric-value');
            const duration = metrics[0]?.textContent || '0m';
            const aqiReduction = metrics[1]?.textContent || '0 points';
            const effectiveness = metrics[2]?.textContent || '0%';
            
            // Show detailed monitoring info
            const message = `Monitoring ${interventionName}: Duration ${duration}, AQI Reduction ${aqiReduction}, Effectiveness ${effectiveness}`;
            this.showNotification(message, 'info');
            
            // Reset border after 2 seconds
            setTimeout(() => {
                interventionItem.style.border = '';
            }, 2000);
            
            console.log('Monitoring intervention:', interventionName);
        } catch (error) {
            console.error('Error monitoring intervention:', error);
            this.showNotification('Error starting monitoring', 'error');
        }
    }

    showPredictionResults(prediction) {
        console.log('Policy prediction results:', prediction);
        const reduction = Math.round(prediction.predicted_aqi_reduction || 0);
        const effectiveness = Math.round(prediction.predicted_effectiveness || prediction.confidence || 85);
        
        // Display chart in Policy Effectiveness section
        this.renderEffectivenessChart(prediction);
        
        this.showNotification(`Prediction: ${reduction} AQI reduction expected, ${effectiveness}% effectiveness`, 'success');
    }
    
    renderEffectivenessChart(prediction) {
        const canvas = document.getElementById('effectivenessChart');
        if (!canvas) {
            console.warn('Effectiveness chart canvas not found');
            return;
        }
        
        const effectiveness = Math.round(prediction.predicted_effectiveness || prediction.confidence || 85);
        const aqiReduction = Math.round(prediction.predicted_aqi_reduction || 0);
        
        // Wait for Chart.js to be available
        const checkChartJS = () => {
            if (typeof Chart !== 'undefined') {
                const ctx = canvas.getContext('2d');
                
                // Destroy existing chart if it exists
                if (this.effectivenessChart) {
                    this.effectivenessChart.destroy();
                }
                
                // Create bar chart showing effectiveness
                this.effectivenessChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Effectiveness %', 'AQI Reduction'],
                        datasets: [{
                            label: 'Predicted Impact',
                            data: [effectiveness, aqiReduction],
                            backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(16, 185, 129, 0.8)'
                            ],
                            borderColor: [
                                'rgba(59, 130, 246, 1)',
                                'rgba(16, 185, 129, 1)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: 'rgba(59, 130, 246, 0.5)',
                                borderWidth: 1
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: Math.max(100, aqiReduction + 20),
                                ticks: {
                                    color: '#94a3b8',
                                    font: {
                                        size: 12
                                    }
                                },
                                grid: {
                                    color: 'rgba(59, 130, 246, 0.1)'
                                }
                            },
                            x: {
                                ticks: {
                                    color: '#94a3b8',
                                    font: {
                                        size: 12
                                    }
                                },
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                });
            } else {
                // Chart.js not loaded yet, show text fallback
                const chartContainer = canvas.parentElement;
                chartContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-primary, #ffffff);">
                        <h4 style="color: var(--primary-color, #3b82f6); margin-bottom: 1rem;">Prediction Results</h4>
                        <div style="font-size: 2rem; color: var(--success-color, #10b981); margin-bottom: 0.5rem;">
                            ${effectiveness}%
                        </div>
                        <div style="color: var(--text-secondary, #94a3b8);">Expected Effectiveness</div>
                        <div style="margin-top: 1rem; font-size: 1.2rem; color: var(--success-color, #10b981);">
                            AQI Reduction: -${aqiReduction} points
                        </div>
                    </div>
                `;
            }
        };
        
        // Try immediately, then retry if Chart.js is loading
        checkChartJS();
        if (typeof Chart === 'undefined') {
            setTimeout(checkChartJS, 500);
            setTimeout(checkChartJS, 1000);
        }
    }
    
    implementRecommendation(recommendationItem) {
        try {
            const recommendationTitle = recommendationItem.querySelector('h5')?.textContent || 'Policy';
            const button = recommendationItem.querySelector('.btn-recommendation');
            
            // Find matching policy button
            let policyName = null;
            if (recommendationTitle.includes('Industrial')) {
                policyName = 'industrial-shutdown';
            } else if (recommendationTitle.includes('Public Transport') || recommendationTitle.includes('Transport')) {
                policyName = 'public-transport';
            } else if (recommendationTitle.includes('Construction')) {
                policyName = 'construction-ban';
            } else if (recommendationTitle.includes('Odd-Even')) {
                policyName = 'odd-even';
            }
            
            if (policyName) {
                // Activate the corresponding policy button
                const policyBtn = document.querySelector(`.policy-btn[data-policy="${policyName}"]`);
                if (policyBtn) {
                    document.querySelectorAll('.policy-btn').forEach(b => b.classList.remove('active'));
                    policyBtn.classList.add('active');
                    
                    // Automatically start the intervention
                    setTimeout(() => {
                        this.startPolicyIntervention();
                    }, 300);
                }
            } else {
                // If no matching policy, just show notification
                this.showNotification(`Implementing ${recommendationTitle}...`, 'info');
                setTimeout(() => {
                    this.showNotification(`${recommendationTitle} implemented successfully`, 'success');
                }, 1500);
            }
            
            // Update button state
            if (button) {
                const originalText = button.textContent;
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Implementing...';
                
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = 'Implemented';
                    button.style.opacity = '0.7';
                }, 2000);
            }
        } catch (error) {
            console.error('Error implementing recommendation:', error);
            this.showNotification('Error implementing recommendation', 'error');
        }
    }
    
    // Removed duplicate loadPolicyData - using async version below

    showNotification(message, type = 'info') {
        // Enhanced notification system - show toast notifications (not alerts)
        console.log(`[PolicyManager] Notification: ${message} (${type})`);
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 
                         type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                         type === 'warning' ? 'rgba(245, 158, 11, 0.9)' : 
                         'rgba(59, 130, 246, 0.9)'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-size: 0.9rem;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        if (!document.getElementById('notification-styles')) {
            style.id = 'notification-styles';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    async loadPolicyData() {
        try {
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/advanced/policy-effectiveness/analytics${cacheBuster}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.status === 'success') {
                    // Update active interventions
                    if (data.active_interventions && data.active_interventions.length > 0) {
                        this.activeInterventions = data.active_interventions;
                        this.updateActiveInterventionsDisplay();
                    } else {
                        this.updateActiveInterventionsDisplay([]);
                    }
                    
                    // Update recommendations
                    if (data.recommendations && data.recommendations.length > 0) {
                        this.updateRecommendationsDisplay(data.recommendations);
                    }
                    
                    // Update timing analysis
                    if (data.current_aqi) {
                        this.updateTimingAnalysis(data.current_aqi);
                    }
                    
                    console.log('Policy data loaded successfully:', data);
                } else {
                    console.warn('Policy analytics API returned error:', data.message);
                    this.updateActiveInterventionsDisplay();
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading policy data:', error);
            // Use fallback data
            this.updateActiveInterventionsDisplay();
        }
    }

    updateActiveInterventionsDisplay(interventions = null) {
        const interventionList = document.querySelector('.intervention-list');
        const noInterventionsMsg = document.querySelector('.no-interventions-message');
        const activeCountEl = document.getElementById('activeCount');
        
        if (!interventionList) {
            console.warn('Intervention list element not found, retrying...');
            setTimeout(() => this.updateActiveInterventionsDisplay(interventions), 500);
            return;
        }
        
        const interventionsToShow = interventions || this.activeInterventions || [];
        
        if (interventionsToShow.length === 0) {
            // Show no interventions message
            if (noInterventionsMsg) {
                noInterventionsMsg.style.display = 'block';
            }
            interventionList.innerHTML = '';
            
            // Update active count
            if (activeCountEl) {
                activeCountEl.textContent = '0';
            }
        } else {
            // Hide no interventions message
            if (noInterventionsMsg) {
                noInterventionsMsg.style.display = 'none';
            }
            
            // Render interventions
            interventionList.innerHTML = interventionsToShow.map(intervention => {
                const reductionClass = (intervention.aqi_reduction || 0) > 0 ? 'success' : '';
                const effectiveness = intervention.effectiveness || 0;
                const effectivenessColor = effectiveness >= 80 ? '#10b981' : 
                                          effectiveness >= 60 ? '#f59e0b' : '#ef4444';
                
                // Format duration display
                let durationDisplay = '';
                if (intervention.duration_display) {
                    durationDisplay = intervention.duration_display;
                } else if (intervention.duration_hours !== undefined) {
                    const hours = Math.floor(intervention.duration_hours);
                    const minutes = Math.floor((intervention.duration_hours % 1) * 60);
                    durationDisplay = `${hours}h ${minutes}m`;
                } else {
                    durationDisplay = '0h 0m';
                }
                
                return `
                    <div class="intervention-item" data-policy="${intervention.policy_type || 'unknown'}" data-id="${intervention.id || ''}">
                        <div class="intervention-info">
                            <div class="intervention-name">${intervention.name || 'Unknown Policy'}</div>
                            <div class="intervention-status active">
                                <div class="status-dot"></div>
                                <span>Active</span>
                            </div>
                        </div>
                        <div class="intervention-metrics">
                            <div class="metric">
                                <span class="metric-label">Duration:</span>
                                <span class="metric-value">${durationDisplay}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">AQI Reduction:</span>
                                <span class="metric-value ${reductionClass}">-${(intervention.aqi_reduction || 0).toFixed(1)} points</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Effectiveness:</span>
                                <span class="metric-value" style="color: ${effectivenessColor}">${effectiveness.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div class="intervention-actions">
                            <button class="btn-small primary">Monitor</button>
                            <button class="btn-small secondary">End</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Update active count
            if (activeCountEl) {
                activeCountEl.textContent = interventionsToShow.length.toString();
            }
            
            // Re-attach event listeners
            this.attachInterventionListeners();
        }
    }

    updateRecommendationsDisplay(recommendations) {
        const recommendationsCard = document.querySelector('.ai-recommendations-card .card-content');
        if (!recommendationsCard) return;
        
        const priorityColors = {
            'high': '#ef4444',
            'medium': '#f59e0b',
            'low': '#10b981'
        };
        
        const priorityLabels = {
            'high': 'High Priority',
            'medium': 'Medium Priority',
            'low': 'Low Priority'
        };
        
        recommendationsCard.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item ${rec.priority}-priority">
                <div class="recommendation-header">
                    <div class="priority-badge ${rec.priority}" style="background: ${priorityColors[rec.priority]}20; color: ${priorityColors[rec.priority]};">${priorityLabels[rec.priority]}</div>
                    <div class="recommendation-confidence">Confidence: ${rec.confidence}%</div>
                </div>
                <div class="recommendation-content">
                    <h5>${rec.title}</h5>
                    <p>${rec.description}</p>
                    <div class="recommendation-details">
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>Optimal timing: ${rec.timing}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-chart-line"></i>
                            <span>Expected reduction: ${rec.expected_reduction} AQI points</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-dollar-sign"></i>
                            <span>Cost category: ${rec.cost}</span>
                        </div>
                    </div>
                    <button class="btn-recommendation">${rec.priority === 'high' ? 'Implement Now' : 'Schedule'}</button>
                </div>
            </div>
        `).join('');
        
        // Re-attach recommendation button listeners
        const recommendationButtons = recommendationsCard.querySelectorAll('.btn-recommendation');
        recommendationButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const recommendationItem = btn.closest('.recommendation-item');
                const recommendationTitle = recommendationItem?.querySelector('h5')?.textContent || 'Policy';
                console.log('Recommendation button clicked:', recommendationTitle);
                this.implementRecommendation(recommendationItem);
            });
        });
    }

    updateTimingAnalysis(currentAqi) {
        const timingCard = document.querySelector('.intervention-timing-card .current-conditions');
        if (!timingCard) return;
        
        const aqiCategory = currentAqi <= 50 ? 'Good' : 
                           currentAqi <= 100 ? 'Moderate' : 
                           currentAqi <= 150 ? 'Unhealthy for Sensitive' :
                           currentAqi <= 200 ? 'Unhealthy' :
                           currentAqi <= 300 ? 'Very Unhealthy' : 'Hazardous';
        
        const aqiColor = currentAqi <= 100 ? '#10b981' : 
                        currentAqi <= 150 ? '#f59e0b' : '#ef4444';
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        // Update AQI display
        const aqiValueEl = timingCard.querySelector('.condition-value.critical, .condition-value');
        if (aqiValueEl) {
            aqiValueEl.textContent = `${Math.round(currentAqi)} (${aqiCategory})`;
            aqiValueEl.style.color = aqiColor;
            aqiValueEl.classList.remove('critical');
            if (currentAqi > 200) {
                aqiValueEl.classList.add('critical');
            }
        }
        
        // Update time display
        const timeValueEl = timingCard.querySelector('.condition-item:last-child .condition-value');
        if (timeValueEl) {
            timeValueEl.textContent = timeString;
        }
    }

    attachInterventionListeners() {
        const interventionList = document.querySelector('.intervention-list');
        if (!interventionList) return;
        
        interventionList.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            
            const interventionItem = target.closest('.intervention-item');
            if (!interventionItem) return;
            
            const interventionId = interventionItem.dataset.id;
            const interventionName = interventionItem.querySelector('.intervention-name')?.textContent || 'Unknown';
            
            if (target.textContent.trim() === 'Monitor') {
                e.preventDefault();
                e.stopPropagation();
                console.log('Monitor button clicked for:', interventionName);
                this.monitorIntervention(interventionItem);
            } else if (target.textContent.trim() === 'End') {
                e.preventDefault();
                e.stopPropagation();
                console.log('End button clicked for:', interventionName);
                this.endIntervention(interventionItem);
            }
        });
    }

    startPolicyMonitoring() {
        // Monitor active interventions every minute
        setInterval(() => {
            this.activeInterventions.forEach(intervention => {
                this.measureInterventionEffectiveness(intervention.intervention_id);
            });
        }, 60 * 1000);
    }

    async measureInterventionEffectiveness(interventionId) {
        try {
            const response = await fetch(`/api/advanced/policy-effectiveness/measure/${interventionId}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                this.updateInterventionMetrics(data.effectiveness_measurement);
            }
        } catch (error) {
            console.error('Error measuring intervention effectiveness:', error);
        }
    }

    updateInterventionMetrics(measurement) {
        // Update intervention metrics display
        console.log('Intervention measurement:', measurement);
    }
}

// Initialize managers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers with error handling
    // HyperlocalManager now handles its own initialization timing
    if (!window.hyperlocalManager) {
        try {
            console.log('DOMContentLoaded - Creating HyperlocalManager instance');
            window.hyperlocalManager = new HyperlocalManager();
        } catch (error) {
            console.error('Error initializing HyperlocalManager:', error);
        }
    } else {
        console.log('HyperlocalManager already exists, skipping initialization');
        // If it exists but map isn't showing, try to regenerate
        if (window.hyperlocalManager && !document.querySelector('#neighborhoodMap .map-cell')) {
            console.log('Map cells not found, forcing regeneration...');
            setTimeout(() => {
                window.hyperlocalManager.forceMapGeneration();
            }, 1000);
        }
    }
    
    // Initialize SatelliteManager immediately if section exists
    function initSatelliteManager() {
        try {
            const satelliteSection = document.getElementById('satellite');
            if (satelliteSection && !window.satelliteManager) {
                console.log('Satellite section found, initializing SatelliteManager');
                window.satelliteManager = new SatelliteManager();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error initializing SatelliteManager:', error);
            return false;
        }
    }
    
    // Try to initialize immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initSatelliteManager, 100);
        });
    } else {
        setTimeout(initSatelliteManager, 100);
    }
    
    // Also try after a delay as fallback
    setTimeout(() => {
        if (!window.satelliteManager) {
            initSatelliteManager();
        }
    }, 1000);
    
// Make SatelliteManager class available globally and notify when ready
window.SatelliteManager = SatelliteManager;
window.dispatchEvent(new CustomEvent('satellite-manager-ready'));

// Make PolicyManager class available globally
window.PolicyManager = PolicyManager;
window.dispatchEvent(new CustomEvent('policy-manager-ready'));

// Initialize PolicyManager - DISABLED (Policy Effectiveness section removed)
function initializePolicyManager() {
    // Policy Effectiveness section has been removed, so don't initialize PolicyManager
    // This prevents any alerts or errors from appearing
    return;
}

// Don't initialize PolicyManager since the section was removed
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initializePolicyManager);
// } else {
//     initializePolicyManager();
// }
// setTimeout(initializePolicyManager, 1000);
});

// Add CSS for tooltips
const tooltipCSS = `
.cell-tooltip {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 1rem;
    z-index: 1000;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.tooltip-content h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
}

.tooltip-content p {
    margin: 0.25rem 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: var(--border-radius);
    color: white;
    font-weight: 600;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
}

.notification-success {
    background: #10b981;
}

.notification-error {
    background: #ef4444;
}

.notification-info {
    background: #3b82f6;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = tooltipCSS;
document.head.appendChild(style);
