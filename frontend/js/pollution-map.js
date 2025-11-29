// Enhanced Interactive Pollution Heat Map for AirWatch AI

class PollutionMap {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.data = [];
        this.historicalData = [];
        this.currentLayer = 'aqi';
        this.currentTime = 'current';
        this.mousePosition = { x: 0, y: 0 };
        this.selectedStation = null;
        this.animationId = null;
        this.particles = [];
        this.windVectors = [];
        this.heatmapIntensity = 0.8;
        this.isPlaying = false;
        this.playbackSpeed = 1;
        this.currentTimeIndex = 0;
        this.timeRange = 24; // hours
        this.updateInterval = null;
        this.lastUpdate = Date.now();
        this.init();
    }

    init() {
        this.createCanvas();
        this.setupControls();
        this.loadData();
        this.setupEventListeners();
        this.initializeParticles();
        this.initializeWindVectors();
        this.startAnimation();
        this.startRealTimeUpdates();
    }

    createCanvas() {
        this.canvas = document.getElementById('pollutionMapCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    setupControls() {
        const layerButtons = document.querySelectorAll('.control-btn[data-layer]');
        const timeButtons = document.querySelectorAll('.control-btn[data-time]');

        layerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                layerButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentLayer = btn.dataset.layer;
                this.updateVisualization();
            });
        });

        timeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                timeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTime = btn.dataset.time;
                this.updateVisualization();
            });
        });
    }

    async loadData() {
        try {
            // Load current data
            const currentResponse = await fetch('/api/overview/current-aqi');
            const currentData = await currentResponse.json();
            this.data = currentData.stations || this.generateMockData();
            
            // Load historical data for time-lapse
            const historicalResponse = await fetch('/api/overview/visualization-data');
            const historicalData = await historicalResponse.json();
            this.historicalData = historicalData.time_series || this.generateHistoricalData();
            
        } catch (error) {
            console.log('Using mock data for pollution map');
            this.data = this.generateMockData();
            this.historicalData = this.generateHistoricalData();
        }
    }

    generateMockData() {
        const stations = [];
        const locations = [
            { name: 'Central Delhi', x: 0.4, y: 0.3, aqi: 287, pm25: 145, pm10: 234 },
            { name: 'East Delhi', x: 0.6, y: 0.4, aqi: 312, pm25: 167, pm10: 289 },
            { name: 'West Delhi', x: 0.3, y: 0.5, aqi: 298, pm25: 152, pm10: 267 },
            { name: 'North Delhi', x: 0.5, y: 0.2, aqi: 275, pm25: 138, pm10: 245 },
            { name: 'South Delhi', x: 0.5, y: 0.7, aqi: 265, pm25: 128, pm10: 223 },
            { name: 'Noida', x: 0.7, y: 0.6, aqi: 334, pm25: 178, pm10: 312 },
            { name: 'Gurgaon', x: 0.2, y: 0.6, aqi: 289, pm25: 148, pm10: 256 },
            { name: 'Faridabad', x: 0.6, y: 0.8, aqi: 301, pm25: 156, pm10: 278 },
            { name: 'Ghaziabad', x: 0.8, y: 0.3, aqi: 345, pm25: 189, pm10: 334 },
            { name: 'Dwarka', x: 0.2, y: 0.4, aqi: 278, pm25: 142, pm10: 251 }
        ];

        locations.forEach(location => {
            stations.push({
                ...location,
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toISOString(),
                status: Math.random() > 0.1 ? 'active' : 'maintenance'
            });
        });

        return stations;
    }

    generateHistoricalData() {
        const historicalData = [];
        const now = new Date();
        
        for (let i = 0; i < this.timeRange; i++) {
            const timestamp = new Date(now.getTime() - (this.timeRange - i) * 60 * 60 * 1000);
            const hourData = [];
            
            this.data.forEach(station => {
                // Simulate realistic pollution patterns
                const baseAqi = station.aqi;
                const hourVariation = Math.sin((i / this.timeRange) * Math.PI * 2) * 50;
                const randomVariation = (Math.random() - 0.5) * 30;
                
                hourData.push({
                    ...station,
                    aqi: Math.max(0, Math.min(500, baseAqi + hourVariation + randomVariation)),
                    pm25: Math.max(0, station.pm25 + hourVariation * 0.5 + randomVariation * 0.3),
                    pm10: Math.max(0, station.pm10 + hourVariation * 0.7 + randomVariation * 0.4),
                    timestamp: timestamp.toISOString()
                });
            });
            
            historicalData.push({
                timestamp: timestamp.toISOString(),
                stations: hourData
            });
        }
        
        return historicalData;
    }

    initializeParticles() {
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.2,
                color: this.getRandomPollutionColor()
            });
        }
    }

    initializeWindVectors() {
        this.windVectors = [];
        const gridSize = 50;
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            for (let y = 0; y < this.canvas.height; y += gridSize) {
                this.windVectors.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    strength: Math.random() * 0.8 + 0.2
                });
            }
        }
    }

    getRandomPollutionColor() {
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#dc2626', '#7c2d12'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateRealTimeData();
        }, 30000); // Update every 30 seconds
    }

    updateRealTimeData() {
        // Simulate real-time updates
        this.data.forEach(station => {
            const variation = (Math.random() - 0.5) * 20;
            station.aqi = Math.max(0, Math.min(500, station.aqi + variation));
            station.pm25 = Math.max(0, station.pm25 + variation * 0.5);
            station.pm10 = Math.max(0, station.pm10 + variation * 0.7);
            station.timestamp = new Date().toISOString();
        });
        
        this.lastUpdate = Date.now();
    }

    setupEventListeners() {
        if (!this.canvas) return;

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePosition.x = e.clientX - rect.left;
            this.mousePosition.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            this.handleClick(clickX, clickY);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.selectedStation = null;
        });
    }

    startAnimation() {
        const animate = () => {
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw wind vectors
        this.drawWindVectors();
        
        // Draw pollution heatmap
        this.drawHeatmap();
        
        // Draw particles
        this.drawParticles();
        
        // Draw stations
        this.drawStations();
        
        // Draw connections
        this.drawConnections();
        
        // Draw mouse interaction
        this.drawMouseInteraction();
        
        // Draw time controls
        this.drawTimeControls();
        
        // Draw real-time indicator
        this.drawRealTimeIndicator();
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.8)');
        gradient.addColorStop(1, 'rgba(30, 41, 59, 0.8)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawWindVectors() {
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        this.ctx.lineWidth = 1;
        
        this.windVectors.forEach(vector => {
            const length = Math.sqrt(vector.vx * vector.vx + vector.vy * vector.vy) * 10;
            const angle = Math.atan2(vector.vy, vector.vx);
            
            this.ctx.save();
            this.ctx.translate(vector.x, vector.y);
            this.ctx.rotate(angle);
            
            // Draw arrow
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(length, 0);
            this.ctx.moveTo(length - 5, -3);
            this.ctx.lineTo(length, 0);
            this.ctx.lineTo(length - 5, 3);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            // Update particle position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Draw particle
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    drawHeatmap() {
        this.data.forEach(station => {
            const x = station.x * this.canvas.width;
            const y = station.y * this.canvas.height;
            const value = this.getStationValue(station);
            const color = this.getValueColor(value);
            
            // Enhanced heatmap with multiple layers
            const radius = 100;
            const intensity = this.heatmapIntensity;
            
            // Outer glow
            const outerGradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
            outerGradient.addColorStop(0, color + Math.floor(60 * intensity).toString(16).padStart(2, '0'));
            outerGradient.addColorStop(0.3, color + Math.floor(40 * intensity).toString(16).padStart(2, '0'));
            outerGradient.addColorStop(0.7, color + Math.floor(20 * intensity).toString(16).padStart(2, '0'));
            outerGradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = outerGradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Inner core
            const innerGradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 0.5);
            innerGradient.addColorStop(0, color + Math.floor(80 * intensity).toString(16).padStart(2, '0'));
            innerGradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = innerGradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawStations() {
        this.data.forEach(station => {
            const x = station.x * this.canvas.width;
            const y = station.y * this.canvas.height;
            const value = this.getStationValue(station);
            const color = this.getValueColor(value);
            const size = this.getStationSize(value);
            
            // Draw station circle
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw station border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw pulsing effect for active stations
            if (station.status === 'active') {
                const time = Date.now() * 0.005;
                const pulseSize = size + Math.sin(time + station.x * 10) * 3;
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }
            
            // Draw station label if selected or near mouse
            const distance = Math.sqrt(
                Math.pow(this.mousePosition.x - x, 2) + 
                Math.pow(this.mousePosition.y - y, 2)
            );
            
            if (distance < 50 || this.selectedStation === station) {
                this.drawStationLabel(station, x, y, value);
            }
        });
    }

    drawStationLabel(station, x, y, value) {
        const label = `${station.name}\n${this.currentLayer.toUpperCase()}: ${value}`;
        const lines = label.split('\n');
        const lineHeight = 16;
        const padding = 8;
        
        // Calculate label dimensions
        this.ctx.font = '12px Inter, sans-serif';
        const textWidth = Math.max(...lines.map(line => this.ctx.measureText(line).width));
        const labelWidth = textWidth + padding * 2;
        const labelHeight = lines.length * lineHeight + padding * 2;
        
        // Position label
        let labelX = x + 20;
        let labelY = y - labelHeight / 2;
        
        if (labelX + labelWidth > this.canvas.width) {
            labelX = x - labelWidth - 20;
        }
        if (labelY < 0) {
            labelY = 10;
        }
        if (labelY + labelHeight > this.canvas.height) {
            labelY = this.canvas.height - labelHeight - 10;
        }
        
        // Draw label background
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        this.ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
        
        // Draw label border
        this.ctx.strokeStyle = this.getValueColor(value);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
        
        // Draw label text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        lines.forEach((line, index) => {
            this.ctx.fillText(line, labelX + padding, labelY + padding + index * lineHeight);
        });
    }

    drawConnections() {
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < this.data.length; i++) {
            for (let j = i + 1; j < this.data.length; j++) {
                const dx = this.data[i].x - this.data[j].x;
                const dy = this.data[i].y - this.data[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 0.3) {
                    const x1 = this.data[i].x * this.canvas.width;
                    const y1 = this.data[i].y * this.canvas.height;
                    const x2 = this.data[j].x * this.canvas.width;
                    const y2 = this.data[j].y * this.canvas.height;
                    
                    const opacity = (0.3 - distance) / 0.3 * 0.3;
                    this.ctx.globalAlpha = opacity;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x1, y1);
                    this.ctx.lineTo(x2, y2);
                    this.ctx.stroke();
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }

    drawMouseInteraction() {
        const distance = Math.sqrt(
            Math.pow(this.mousePosition.x - this.canvas.width / 2, 2) + 
            Math.pow(this.mousePosition.y - this.canvas.height / 2, 2)
        );
        
        if (distance < 300) {
            // Mouse hover glow
            const glowGradient = this.ctx.createRadialGradient(
                this.mousePosition.x, this.mousePosition.y, 0,
                this.mousePosition.x, this.mousePosition.y, 50
            );
            glowGradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
            glowGradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(this.mousePosition.x, this.mousePosition.y, 50, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    getStationValue(station) {
        switch (this.currentLayer) {
            case 'pm25':
                return station.pm25;
            case 'pm10':
                return station.pm10;
            case 'aqi':
            default:
                return station.aqi;
        }
    }

    getValueColor(value) {
        if (this.currentLayer === 'aqi') {
            if (value <= 50) return '#10b981';
            if (value <= 100) return '#3b82f6';
            if (value <= 200) return '#f59e0b';
            if (value <= 300) return '#ef4444';
            if (value <= 400) return '#dc2626';
            return '#7c2d12';
        } else {
            // For PM2.5 and PM10, use similar color scheme
            if (value <= 25) return '#10b981';
            if (value <= 50) return '#3b82f6';
            if (value <= 100) return '#f59e0b';
            if (value <= 150) return '#ef4444';
            if (value <= 200) return '#dc2626';
            return '#7c2d12';
        }
    }

    getStationSize(value) {
        const baseSize = 8;
        const maxSize = 20;
        
        if (this.currentLayer === 'aqi') {
            return baseSize + (value / 500) * (maxSize - baseSize);
        } else {
            return baseSize + (value / 200) * (maxSize - baseSize);
        }
    }

    handleClick(x, y) {
        // Find closest station
        let closestStation = null;
        let minDistance = Infinity;
        
        this.data.forEach(station => {
            const stationX = station.x * this.canvas.width;
            const stationY = station.y * this.canvas.height;
            const distance = Math.sqrt(Math.pow(x - stationX, 2) + Math.pow(y - stationY, 2));
            
            if (distance < minDistance && distance < 30) {
                minDistance = distance;
                closestStation = station;
            }
        });
        
        if (closestStation) {
            this.selectedStation = closestStation;
            this.showStationDetails(closestStation);
        }
    }

    showStationDetails(station) {
        // Create or update station details modal
        let modal = document.getElementById('stationModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'stationModal';
            modal.className = 'station-modal';
            document.body.appendChild(modal);
        }
        
        const value = this.getStationValue(station);
        const color = this.getValueColor(value);
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${station.name}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="station-status ${station.status}">
                        <i class="fas fa-circle"></i>
                        ${station.status.charAt(0).toUpperCase() + station.status.slice(1)}
                    </div>
                    <div class="station-metrics">
                        <div class="metric">
                            <span class="metric-label">AQI</span>
                            <span class="metric-value" style="color: ${color}">${station.aqi}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">PM2.5</span>
                            <span class="metric-value">${station.pm25} μg/m³</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">PM10</span>
                            <span class="metric-value">${station.pm10} μg/m³</span>
                        </div>
                    </div>
                    <div class="station-actions">
                        <button class="btn-action">
                            <i class="fas fa-chart-line"></i>
                            View History
                        </button>
                        <button class="btn-action">
                            <i class="fas fa-bell"></i>
                            Set Alert
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Close modal functionality
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            this.selectedStation = null;
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                this.selectedStation = null;
            }
        });
        
        // Add event listeners to action buttons
        const viewHistoryBtn = modal.querySelector('[data-action="view-history"]');
        const setAlertBtn = modal.querySelector('[data-action="set-alert"]');
        
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showHistoryModal(station);
            });
        }
        
        if (setAlertBtn) {
            setAlertBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showAlertModal(station);
            });
        }
        
        // Also add listeners using class selector as fallback
        const allActionBtns = modal.querySelectorAll('.btn-action');
        allActionBtns.forEach((btn, index) => {
            if (index === 0 && !viewHistoryBtn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showHistoryModal(station);
                });
            } else if (index === 1 && !setAlertBtn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showAlertModal(station);
                });
            }
        });
    }
    
    async showHistoryModal(station) {
        // Create or get history modal
        let historyModal = document.getElementById('historyModal');
        if (!historyModal) {
            historyModal = document.createElement('div');
            historyModal.id = 'historyModal';
            historyModal.className = 'modal';
            historyModal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 10000; justify-content: center; align-items: center;';
            document.body.appendChild(historyModal);
        }
        
        // Show loading
        historyModal.innerHTML = `
            <div class="modal-content" style="background: #1e293b; border-radius: 12px; padding: 2rem; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; color: #ffffff;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #ffffff;">Historical Data - ${station.station_name || 'Station'}</h2>
                    <button class="close-modal" style="background: none; border: none; color: #ffffff; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                <div id="historyChartContainer" style="min-height: 400px;">
                    <div style="text-align: center; color: #94a3b8;">Loading historical data...</div>
                </div>
            </div>
        `;
        
        historyModal.style.display = 'flex';
        
        // Close button
        const closeBtn = historyModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            historyModal.style.display = 'none';
        });
        
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) {
                historyModal.style.display = 'none';
            }
        });
        
        // Load historical data with better error handling
        const container = historyModal.querySelector('#historyChartContainer');
        
        try {
            let timeSeries = [];
            let dataLoaded = false;
            let errorMessage = '';
            
            // Update loading message
            container.innerHTML = `
                <div style="text-align: center; color: #94a3b8; padding: 2rem;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid rgba(59, 130, 246, 0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
                    <p>Loading historical data from real-time sources...</p>
                </div>
            `;
            
            // Add spinner animation
            const style = document.createElement('style');
            style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
            
            // Try multiple endpoints for historical data
            const endpoints = [
                // Try visualization-data endpoint first (most reliable)
                { 
                    url: 'http://localhost:5000/api/overview/visualization-data', 
                    extract: (data) => {
                        console.log('Visualization data structure:', data);
                        if (data.visualization_data && data.visualization_data.time_series) {
                            return data.visualization_data.time_series;
                        }
                        if (data.time_series) {
                            return data.time_series;
                        }
                        return [];
                    }
                },
                // Try real-time station history endpoint
                { 
                    url: `http://localhost:5000/api/realtime/station/${station.station_id || station.id || 'DL001'}/history?hours=24`, 
                    extract: (data) => {
                        if (data.success && data.time_series) {
                            return data.time_series;
                        }
                        return data.time_series || [];
                    }
                }
            ];
            
            // Try each endpoint
            for (let i = 0; i < endpoints.length; i++) {
                const endpoint = endpoints[i];
                try {
                    console.log(`Attempting to load from: ${endpoint.url}`);
                    const response = await fetch(endpoint.url, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Cache-Control': 'no-cache'
                        }
                    });
                    
                    if (!response.ok) {
                        console.warn(`Response not OK: ${response.status} ${response.statusText}`);
                        continue;
                    }
                    
                    const data = await response.json();
                    console.log(`Response from ${endpoint.url}:`, data);
                    
                    const extracted = endpoint.extract(data);
                    console.log(`Extracted data:`, extracted);
                    
                    if (extracted && Array.isArray(extracted) && extracted.length > 0) {
                        timeSeries = extracted;
                        dataLoaded = true;
                        console.log(`✓ Successfully loaded ${timeSeries.length} historical data points from ${endpoint.url}`);
                        break;
                    } else {
                        console.warn(`No valid data extracted from ${endpoint.url}`);
                    }
                } catch (e) {
                    errorMessage = e.message;
                    console.error(`Error loading from ${endpoint.url}:`, e);
                    continue;
                }
            }
            
            // If no data loaded, generate from current station data with real-time values
            if (!dataLoaded || timeSeries.length === 0) {
                console.log('Generating historical data from current station values...');
                
                // Try to get current real-time AQI first
                let currentAqiData = null;
                try {
                    const currentResponse = await fetch('http://localhost:5000/api/overview/current-aqi');
                    if (currentResponse.ok) {
                        currentAqiData = await currentResponse.json();
                        console.log('Got current AQI data:', currentAqiData);
                    }
                } catch (e) {
                    console.warn('Could not fetch current AQI:', e);
                }
                
                const baseAqi = currentAqiData?.aqi || currentAqiData?.current_aqi || station.aqi || 200;
                const basePM25 = currentAqiData?.pollutants?.pm25 || station.pm25 || baseAqi / 2.5;
                const basePM10 = currentAqiData?.pollutants?.pm10 || station.pm10 || baseAqi / 1.2;
                const baseTemp = currentAqiData?.weather?.temperature || station.temperature || 28.5;
                const baseHumidity = currentAqiData?.weather?.humidity || station.humidity || 45;
                
                const now = new Date();
                
                // Generate 24 hours of data with realistic variation based on real-time values
                for (let i = 23; i >= 0; i--) {
                    const hourAgo = new Date(now.getTime() - i * 60 * 60 * 1000);
                    const hour = hourAgo.getHours();
                    
                    // Create realistic variation (higher in morning/evening, lower in afternoon)
                    const variation = hour >= 6 && hour <= 9 ? 40 : hour >= 18 && hour <= 21 ? 35 : -20;
                    
                    timeSeries.push({
                        timestamp: hourAgo.toISOString(),
                        aqi: Math.round(Math.max(50, Math.min(400, baseAqi + variation + (Math.random() - 0.5) * 30))),
                        pm25: Math.round(Math.max(20, basePM25 + variation / 2.5 + (Math.random() - 0.5) * 15)),
                        pm10: Math.round(Math.max(30, basePM10 + variation / 1.2 + (Math.random() - 0.5) * 25)),
                        temperature: Math.round((baseTemp + (Math.random() - 0.5) * 6) * 10) / 10,
                        humidity: Math.round((baseHumidity + (Math.random() - 0.5) * 20))
                    });
                }
                console.log(`✓ Generated ${timeSeries.length} historical data points from real-time station data`);
            }
            
            // Render chart if we have data
            if (timeSeries.length > 0) {
                console.log('Rendering chart with', timeSeries.length, 'data points');
                this.renderHistoryChart(container, timeSeries, station);
            } else {
                container.innerHTML = `
                    <div style="text-align: center; color: #94a3b8; padding: 2rem;">
                        <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No historical data available for this station.</p>
                        ${errorMessage ? `<p style="font-size: 0.875rem; margin-top: 0.5rem; color: #ef4444;">Error: ${errorMessage}</p>` : ''}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading history:', error);
            container.innerHTML = `
                <div style="text-align: center; color: #ef4444; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Error loading historical data. Please try again.</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem; color: #94a3b8;">${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Retry</button>
                </div>
            `;
        }
    }
    
    renderHistoryChart(container, timeSeries, station) {
        console.log('Rendering chart with data:', timeSeries);
        
        // Clear container and create canvas
        container.innerHTML = `
            <canvas id="historyChart" style="width: 100%; height: 400px; display: block;"></canvas>
        `;
        
        const canvas = document.getElementById('historyChart');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context!');
            return;
        }
        
        // Wait for container to be properly sized
        setTimeout(() => {
            const width = container.offsetWidth || 700;
            const height = 400;
            canvas.width = width;
            canvas.height = height;
            
            console.log(`Canvas size: ${width}x${height}, Data points: ${timeSeries.length}`);
            
            this.drawHistoryChart(ctx, canvas, width, height, timeSeries, station);
        }, 100);
    }
    
    drawHistoryChart(ctx, canvas, width, height, timeSeries, station) {
        
        // Draw chart
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        // Grid lines
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Find min/max AQI
        const aqiValues = timeSeries.map(d => d.aqi || 0);
        const minAqi = Math.min(...aqiValues, 0);
        const maxAqi = Math.max(...aqiValues, 500);
        const range = maxAqi - minAqi || 1;
        
        // Draw line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        timeSeries.forEach((point, index) => {
            const x = padding + (chartWidth / (timeSeries.length - 1)) * index;
            const y = padding + chartHeight - ((point.aqi - minAqi) / range) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = '#3b82f6';
        timeSeries.forEach((point, index) => {
            const x = padding + (chartWidth / (timeSeries.length - 1)) * index;
            const y = padding + chartHeight - ((point.aqi - minAqi) / range) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // X-axis labels (time)
        timeSeries.forEach((point, index) => {
            if (index % Math.ceil(timeSeries.length / 6) === 0 || index === timeSeries.length - 1) {
                const x = padding + (chartWidth / (timeSeries.length - 1)) * index;
                const time = new Date(point.timestamp);
                const label = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                ctx.fillText(label, x, height - 10);
            }
        });
        
        // Y-axis labels (AQI)
        for (let i = 0; i <= 5; i++) {
            const aqiValue = minAqi + (range / 5) * (5 - i);
            const y = padding + (chartHeight / 5) * i;
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(aqiValue).toString(), padding - 10, y + 4);
        }
        
        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AQI History (Last 24 Hours)', width / 2, 25);
        
        // Stats
        const avgAqi = aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length;
        const currentAqi = aqiValues[aqiValues.length - 1];
        const change = currentAqi - aqiValues[0];
        
        container.innerHTML += `
            <div style="margin-top: 1rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                <div style="text-align: center; padding: 1rem; background: rgba(15, 23, 42, 0.5); border-radius: 8px;">
                    <div style="color: #94a3b8; font-size: 0.875rem;">Current AQI</div>
                    <div style="color: #3b82f6; font-size: 1.5rem; font-weight: bold;">${Math.round(currentAqi)}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: rgba(15, 23, 42, 0.5); border-radius: 8px;">
                    <div style="color: #94a3b8; font-size: 0.875rem;">Average</div>
                    <div style="color: #ffffff; font-size: 1.5rem; font-weight: bold;">${Math.round(avgAqi)}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: rgba(15, 23, 42, 0.5); border-radius: 8px;">
                    <div style="color: #94a3b8; font-size: 0.875rem;">Change</div>
                    <div style="color: ${change >= 0 ? '#ef4444' : '#10b981'}; font-size: 1.5rem; font-weight: bold;">
                        ${change >= 0 ? '+' : ''}${Math.round(change)}
                    </div>
                </div>
            </div>
        `;
    }
    
    showAlertModal(station) {
        // Create or get alert modal
        let alertModal = document.getElementById('alertModal');
        if (!alertModal) {
            alertModal = document.createElement('div');
            alertModal.id = 'alertModal';
            alertModal.className = 'modal';
            alertModal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 10000; justify-content: center; align-items: center;';
            document.body.appendChild(alertModal);
        }
        
        const currentAqi = station.aqi || 0;
        
        alertModal.innerHTML = `
            <div class="modal-content" style="background: #1e293b; border-radius: 12px; padding: 2rem; max-width: 500px; width: 90%; color: #ffffff;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #ffffff;">Set Alert - ${station.station_name || 'Station'}</h2>
                    <button class="close-modal" style="background: none; border: none; color: #ffffff; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <div style="background: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 0.5rem;">Current AQI</div>
                        <div style="color: #3b82f6; font-size: 2rem; font-weight: bold;">${currentAqi}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.5rem;">${this.getAqiCategory(currentAqi)}</div>
                    </div>
                    
                    <label style="display: block; margin-bottom: 0.5rem; color: #ffffff; font-weight: 500;">
                        Alert when AQI exceeds:
                    </label>
                    <input type="number" id="alertThreshold" value="${Math.max(150, currentAqi + 50)}" min="0" max="500" 
                           style="width: 100%; padding: 0.75rem; background: #0f172a; border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #ffffff; font-size: 1rem; margin-bottom: 1rem;">
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; color: #ffffff; cursor: pointer;">
                            <input type="checkbox" id="enableNotifications" checked style="width: 18px; height: 18px;">
                            <span>Enable browser notifications</span>
                        </label>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; color: #ffffff; cursor: pointer;">
                            <input type="checkbox" id="enableEmail" style="width: 18px; height: 18px;">
                            <span>Send email alerts</span>
                        </label>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button id="saveAlertBtn" style="flex: 1; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                        Save Alert
                    </button>
                    <button id="cancelAlertBtn" style="flex: 1; padding: 0.75rem; background: #475569; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        alertModal.style.display = 'flex';
        
        // Close button
        const closeBtn = alertModal.querySelector('.close-modal');
        const cancelBtn = alertModal.querySelector('#cancelAlertBtn');
        const saveBtn = alertModal.querySelector('#saveAlertBtn');
        
        const closeModal = () => {
            alertModal.style.display = 'none';
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        alertModal.addEventListener('click', (e) => {
            if (e.target === alertModal) {
                closeModal();
            }
        });
        
        // Save alert
        saveBtn.addEventListener('click', async () => {
            const thresholdInput = document.getElementById('alertThreshold');
            const threshold = parseInt(thresholdInput.value);
            const enableNotifications = document.getElementById('enableNotifications').checked;
            const enableEmail = document.getElementById('enableEmail').checked;
            
            // Validate threshold
            if (isNaN(threshold) || threshold < 0 || threshold > 500) {
                alert('Please enter a valid AQI threshold (0-500)');
                thresholdInput.focus();
                return;
            }
            
            // Disable button during request
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            
            try {
                // Prepare request data
                const requestData = {
                    station_id: station.station_id || station.id || 'unknown',
                    station_name: station.station_name || station.name || 'Unknown Station',
                    threshold: threshold,
                    enable_notifications: enableNotifications,
                    enable_email: enableEmail,
                    current_aqi: currentAqi
                };
                
                console.log('Saving alert with data:', requestData);
                
                // Save alert to backend
                console.log('Making request to:', 'http://localhost:5000/api/citizen-portal/create-alert');
                
                const response = await fetch('http://localhost:5000/api/citizen-portal/create-alert', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'omit',
                    body: JSON.stringify(requestData)
                });
                
                console.log('Response received:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                });
                
                // Get response text first for debugging
                const responseText = await response.text();
                console.log('Response text:', responseText);
                
                // Parse response
                let responseData;
                try {
                    responseData = JSON.parse(responseText);
                    console.log('Parsed response data:', responseData);
                } catch (e) {
                    console.error('Failed to parse response as JSON:', e);
                    console.error('Response text was:', responseText);
                    throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}`);
                }
                
                if (response.ok && responseData.success) {
                    console.log('Alert saved successfully!');
                    
                    // Request notification permission if needed
                    if (enableNotifications && Notification.permission === 'default') {
                        try {
                            const permission = await Notification.requestPermission();
                            console.log('Notification permission:', permission);
                        } catch (e) {
                            console.warn('Could not request notification permission:', e);
                        }
                    }
                    
                    // Show success message
                    this.showAlertSuccess(threshold, station.station_name || station.name);
                    closeModal();
                } else {
                    // Show specific error message
                    const errorMsg = responseData.error || responseData.message || `Server error (${response.status})`;
                    console.error('Alert save failed:', {
                        status: response.status,
                        error: errorMsg,
                        fullResponse: responseData
                    });
                    alert(`Failed to save alert: ${errorMsg}`);
                }
            } catch (error) {
                console.error('Error saving alert:', error);
                alert(`Failed to save alert: ${error.message || 'Please check your connection and try again.'}`);
            } finally {
                // Re-enable button
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Alert';
            }
        });
    }
    
    getAqiCategory(aqi) {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
        if (aqi <= 200) return 'Unhealthy';
        if (aqi <= 300) return 'Very Unhealthy';
        return 'Hazardous';
    }
    
    showAlertSuccess(threshold, stationName) {
        const toast = document.createElement('div');
        toast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 1rem 1.5rem; border-radius: 8px; z-index: 10001; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);';
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-check-circle"></i>
                <span>Alert set for ${stationName} when AQI exceeds ${threshold}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    updateVisualization() {
        // Update legend colors based on current layer
        this.updateLegend();
    }

    updateLegend() {
        const legend = document.querySelector('.map-legend');
        if (!legend) return;
        
        const title = legend.querySelector('.legend-title');
        title.textContent = this.currentLayer.toUpperCase() + ' Levels';
        
        const items = legend.querySelectorAll('.legend-item');
        items.forEach((item, index) => {
            const colorElement = item.querySelector('.legend-color');
            const ranges = [
                { min: 0, max: 50, color: '#10b981', label: 'Good' },
                { min: 51, max: 100, color: '#3b82f6', label: 'Satisfactory' },
                { min: 101, max: 200, color: '#f59e0b', label: 'Moderate' },
                { min: 201, max: 300, color: '#ef4444', label: 'Poor' },
                { min: 301, max: 400, color: '#dc2626', label: 'Very Poor' },
                { min: 401, max: 500, color: '#7c2d12', label: 'Severe' }
            ];
            
            if (ranges[index]) {
                const range = ranges[index];
                colorElement.style.backgroundColor = range.color;
                
                if (this.currentLayer === 'aqi') {
                    item.querySelector('span').textContent = `${range.label} (${range.min}-${range.max})`;
                } else {
                    const pmRanges = [
                        { min: 0, max: 25 },
                        { min: 26, max: 50 },
                        { min: 51, max: 100 },
                        { min: 101, max: 150 },
                        { min: 151, max: 200 },
                        { min: 201, max: 300 }
                    ];
                    const pmRange = pmRanges[index];
                    item.querySelector('span').textContent = `${range.label} (${pmRange.min}-${pmRange.max} μg/m³)`;
                }
            }
        });
    }

    drawTimeControls() {
        if (this.currentTime !== 'current') {
            const controlsY = 20;
            const controlsX = this.canvas.width - 200;
            
            // Draw time control panel
            this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            this.ctx.fillRect(controlsX, controlsY, 180, 60);
            
            this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(controlsX, controlsY, 180, 60);
            
            // Draw play/pause button
            const playX = controlsX + 20;
            const playY = controlsY + 20;
            this.ctx.fillStyle = this.isPlaying ? '#ef4444' : '#10b981';
            this.ctx.beginPath();
            if (this.isPlaying) {
                // Pause icon
                this.ctx.fillRect(playX, playY, 4, 20);
                this.ctx.fillRect(playX + 8, playY, 4, 20);
            } else {
                // Play icon
                this.ctx.moveTo(playX, playY);
                this.ctx.lineTo(playX + 20, playY + 10);
                this.ctx.lineTo(playX, playY + 20);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            // Draw time info
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Time: ${this.currentTimeIndex + 1}/${this.timeRange}h`, playX + 30, playY + 15);
        }
    }

    drawRealTimeIndicator() {
        const indicatorX = 20;
        const indicatorY = 20;
        const indicatorSize = 8;
        
        // Draw pulsing indicator
        const time = Date.now() * 0.005;
        const pulseSize = indicatorSize + Math.sin(time) * 2;
        
        this.ctx.fillStyle = '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(indicatorX, indicatorY, pulseSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw "LIVE" text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Inter, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('LIVE', indicatorX + 15, indicatorY + 5);
        
        // Draw last update time
        const lastUpdateSeconds = Math.floor((Date.now() - this.lastUpdate) / 1000);
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '10px Inter, sans-serif';
        this.ctx.fillText(`Updated ${lastUpdateSeconds}s ago`, indicatorX + 15, indicatorY + 18);
    }

    togglePlayback() {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            this.startTimeLapse();
        } else {
            this.stopTimeLapse();
        }
    }

    startTimeLapse() {
        this.timeLapseInterval = setInterval(() => {
            this.currentTimeIndex = (this.currentTimeIndex + 1) % this.timeRange;
            this.updateTimeLapseData();
        }, 1000 / this.playbackSpeed);
    }

    stopTimeLapse() {
        if (this.timeLapseInterval) {
            clearInterval(this.timeLapseInterval);
            this.timeLapseInterval = null;
        }
    }

    updateTimeLapseData() {
        if (this.historicalData[this.currentTimeIndex]) {
            this.data = this.historicalData[this.currentTimeIndex].stations;
        }
    }

    setPlaybackSpeed(speed) {
        this.playbackSpeed = speed;
        if (this.isPlaying) {
            this.stopTimeLapse();
            this.startTimeLapse();
        }
    }

    setHeatmapIntensity(intensity) {
        this.heatmapIntensity = Math.max(0, Math.min(1, intensity));
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.timeLapseInterval) {
            clearInterval(this.timeLapseInterval);
        }
    }
}

// Initialize pollution map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PollutionMap();
});

// Add modal styles
const modalStyles = `
<style>
.station-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(10px);
}

.modal-content {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 20px;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    backdrop-filter: blur(20px);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
    color: #ffffff;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
}

.close-modal {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.close-modal:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}

.station-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    border-radius: 10px;
    font-weight: 600;
}

.station-status.active {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.station-status.maintenance {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
}

.station-metrics {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.metric-label {
    color: #94a3b8;
    font-weight: 500;
}

.metric-value {
    color: #ffffff;
    font-weight: 600;
    font-size: 1.125rem;
}

.station-actions {
    display: flex;
    gap: 1rem;
}

.btn-action {
    flex: 1;
    padding: 0.75rem 1rem;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.5);
    border-radius: 10px;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 500;
}

.btn-action:hover {
    background: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', modalStyles);
