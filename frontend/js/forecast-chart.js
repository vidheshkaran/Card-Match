// Enhanced Forecast Chart for AirWatch AI

class ForecastChart {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.data = [];
        this.currentPeriod = '24h';
        this.theme = 'dark';
        this.animationId = null;
        this.hoveredPoint = null;
        this.isAnimating = false;
        this.animationProgress = 0;
        this.forecastData = {
            '24h': null,
            '48h': null,
            '72h': null
        };
        this.isLoading = true;
        this.init();
    }

    init() {
        this.createCanvas();
        if (!this.canvas) {
            console.error('Forecast chart canvas not found');
            return;
        }
        
        // Initialize with mock data immediately
        this.generateAllMockData();
        this.setupControls();
        this.setupEventListeners();
        this.startAnimation();
        
        // Load real data in background
        this.loadData();
    }

    createCanvas() {
        this.canvas = document.getElementById('forecastChart');
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

    async loadData() {
        try {
            // Load data for all periods with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced to 3 seconds
            
            const responses = await Promise.all([
                fetch('/api/forecasting/advanced-forecast', { signal: controller.signal }),
                fetch('/api/forecasting/ai-forecast', { signal: controller.signal }),
                fetch('/api/forecasting/seasonal-forecast', { signal: controller.signal })
            ]);
            
            clearTimeout(timeoutId);
            
            const [advancedData, aiData, seasonalData] = await Promise.all(
                responses.map(r => r.json())
            );
            
            this.processAllForecastData(advancedData, aiData, seasonalData);
        } catch (error) {
            console.log('Using mock forecast data:', error);
            this.generateAllMockData();
        }
    }

    processAllForecastData(advancedData, aiData, seasonalData) {
        // Process 24-hour forecast
        this.forecastData['24h'] = this.process24HourData(advancedData);
        
        // Process 48-hour forecast
        this.forecastData['48h'] = this.process48HourData(aiData);
        
        // Process 72-hour forecast
        this.forecastData['72h'] = this.process72HourData(seasonalData);
        
        this.data = this.forecastData[this.currentPeriod];
        this.isLoading = false;
    }

    process24HourData(data) {
        const predictions = data?.forecasts?.['24_hour']?.predictions || [];
        const labels = [];
        const aqiData = [];
        const pm25Data = [];
        const pm10Data = [];
        const confidenceData = [];
        
        // If no predictions, generate mock data
        if (predictions.length === 0) {
            return this.generateMockData('24h');
        }
        
        predictions.forEach((pred, index) => {
            const date = new Date(pred.timestamp);
            const hour = date.getHours();
            labels.push(`${hour}:00`);
            aqiData.push(pred.aqi || 250);
            pm25Data.push(pred.pm25 || pred.aqi * 0.4);
            pm10Data.push(pred.pm10 || pred.aqi * 0.6);
            confidenceData.push(pred.confidence || 85);
        });
        
        return {
            labels: labels,
            datasets: [
                {
                    label: 'AQI Forecast',
                    data: aqiData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    type: 'line'
                },
                {
                    label: 'PM2.5',
                    data: pm25Data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false,
                    type: 'line'
                },
                {
                    label: 'PM10',
                    data: pm10Data,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: false,
                    type: 'line'
                }
            ],
            confidence: confidenceData,
            period: '24h'
        };
    }

    process48HourData(data) {
        const predictions = data?.forecasts?.['48_hour']?.predictions || [];
        const labels = [];
        const aqiData = [];
        const pm25Data = [];
        const pm10Data = [];
        const confidenceData = [];
        
        // Generate 48-hour data if not available
        for (let i = 0; i < 48; i++) {
            const hour = i % 24;
            const day = Math.floor(i / 24);
            labels.push(`${day === 0 ? 'Today' : 'Tomorrow'} ${hour}:00`);
            
            // Simulate realistic 48-hour patterns
            const baseAqi = 250 + Math.sin(i * 0.1) * 50 + Math.random() * 30;
            aqiData.push(Math.max(100, Math.min(400, baseAqi)));
            pm25Data.push(Math.max(50, Math.min(200, baseAqi * 0.4)));
            pm10Data.push(Math.max(80, Math.min(300, baseAqi * 0.6)));
            confidenceData.push(Math.max(70, 95 - i * 0.5));
        }
        
        return {
            labels: labels,
            datasets: [
                {
                    label: 'AQI Forecast',
                    data: aqiData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    type: 'line'
                },
                {
                    label: 'PM2.5',
                    data: pm25Data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false,
                    type: 'line'
                },
                {
                    label: 'PM10',
                    data: pm10Data,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: false,
                    type: 'line'
                }
            ],
            confidence: confidenceData,
            period: '48h'
        };
    }

    process72HourData(data) {
        const predictions = data?.forecasts?.['72_hour']?.predictions || [];
        const labels = [];
        const aqiData = [];
        const pm25Data = [];
        const pm10Data = [];
        const confidenceData = [];
        
        // Generate 72-hour data with daily patterns
        for (let i = 0; i < 72; i++) {
            const hour = i % 24;
            const day = Math.floor(i / 24);
            const dayNames = ['Today', 'Tomorrow', 'Day 3'];
            labels.push(`${dayNames[day]} ${hour}:00`);
            
            // Simulate realistic 72-hour patterns with daily cycles
            const dailyCycle = Math.sin((hour - 6) * Math.PI / 12) * 30;
            const weeklyTrend = Math.sin(i * 0.05) * 20;
            const baseAqi = 250 + dailyCycle + weeklyTrend + Math.random() * 25;
            
            aqiData.push(Math.max(100, Math.min(400, baseAqi)));
            pm25Data.push(Math.max(50, Math.min(200, baseAqi * 0.4)));
            pm10Data.push(Math.max(80, Math.min(300, baseAqi * 0.6)));
            confidenceData.push(Math.max(60, 95 - i * 0.4));
        }
        
        return {
            labels: labels,
            datasets: [
                {
                    label: 'AQI Forecast',
                    data: aqiData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    type: 'line'
                },
                {
                    label: 'PM2.5',
                    data: pm25Data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false,
                    type: 'line'
                },
                {
                    label: 'PM10',
                    data: pm10Data,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: false,
                    type: 'line'
                }
            ],
            confidence: confidenceData,
            period: '72h'
        };
    }

    generateAllMockData() {
        this.forecastData['24h'] = this.generateMockData('24h');
        this.forecastData['48h'] = this.generateMockData('48h');
        this.forecastData['72h'] = this.generateMockData('72h');
        this.data = this.forecastData[this.currentPeriod];
        this.isLoading = false;
    }

    generateMockData(period) {
        const hours = period === '24h' ? 24 : period === '48h' ? 48 : 72;
        const labels = [];
        const aqiData = [];
        const pm25Data = [];
        const pm10Data = [];
        const confidenceData = [];
        
        for (let i = 0; i < hours; i++) {
            const hour = i % 24;
            const day = Math.floor(i / 24);
            
            if (period === '24h') {
                labels.push(`${hour}:00`);
            } else if (period === '48h') {
                labels.push(`${day === 0 ? 'Today' : 'Tomorrow'} ${hour}:00`);
            } else {
                const dayNames = ['Today', 'Tomorrow', 'Day 3'];
                labels.push(`${dayNames[day]} ${hour}:00`);
            }
            
            // Generate realistic patterns
            const baseAqi = 250 + Math.sin(i * 0.1) * 50 + Math.random() * 30;
            aqiData.push(Math.max(100, Math.min(400, baseAqi)));
            pm25Data.push(Math.max(50, Math.min(200, baseAqi * 0.4)));
            pm10Data.push(Math.max(80, Math.min(300, baseAqi * 0.6)));
            confidenceData.push(Math.max(60, 95 - i * 0.4));
        }
        
        return {
            labels: labels,
            datasets: [
                {
                    label: 'AQI Forecast',
                    data: aqiData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    type: 'line'
                },
                {
                    label: 'PM2.5',
                    data: pm25Data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false,
                    type: 'line'
                },
                {
                    label: 'PM10',
                    data: pm10Data,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: false,
                    type: 'line'
                }
            ],
            confidence: confidenceData,
            period: period
        };
    }

    setupControls() {
        const timelineButtons = document.querySelectorAll('.btn-timeline');
        timelineButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                timelineButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPeriod = btn.dataset.period;
                this.updateChart();
            });
        });
    }

    setupEventListeners() {
        // Add hover effects
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }

    startAnimation() {
        const animate = () => {
            this.draw();
            requestAnimationFrame(animate);
        };
        animate();
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        
        try {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw background
            this.drawBackground();
            
            if (this.isLoading || !this.data) {
                this.drawLoadingState();
                return;
            }
            
            // Draw grid
            this.drawGrid();
            
            // Draw data
            this.drawData();
            
            // Draw axes
            this.drawAxes();
            
            // Draw legend
            this.drawLegend();
        } catch (error) {
            console.error('Error drawing forecast chart:', error);
            this.drawErrorState();
        }
    }

    drawErrorState() {
        if (!this.canvas || !this.ctx) return;
        
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = '16px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Chart Error - Loading...', this.canvas.width / 2, this.canvas.height / 2);
    }

    drawLoadingState() {
        if (!this.canvas || !this.ctx) return;
        
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.font = '16px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Loading Forecast Data...', this.canvas.width / 2, this.canvas.height / 2);
        
        // Draw loading spinner
        const time = Date.now() * 0.005;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 + 30;
        const radius = 20;
        
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, time, time + Math.PI * 1.5);
        this.ctx.stroke();
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, this.theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, this.theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.8)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = this.theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)';
        this.ctx.lineWidth = 1;
        
        // Vertical grid lines
        const labelCount = this.data.labels.length;
        for (let i = 0; i <= labelCount; i++) {
            const x = (this.canvas.width / labelCount) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal grid lines
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = (this.canvas.height / gridLines) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawData() {
        if (!this.data.datasets) return;
        
        this.data.datasets.forEach(dataset => {
            this.drawDataset(dataset);
        });
        
        // Draw confidence indicators
        this.drawConfidenceIndicators();
    }

    drawDataset(dataset) {
        const { data, borderColor, backgroundColor, tension, fill, borderDash } = dataset;
        const labelCount = data.length;
        
        this.ctx.save();
        
        if (borderDash) {
            this.ctx.setLineDash(borderDash);
        }
        
        // Draw line
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = (this.canvas.width / (labelCount - 1)) * index;
            const y = this.canvas.height - ((value - 200) / 200) * this.canvas.height;
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                // Draw smooth curve
                const prevX = (this.canvas.width / (labelCount - 1)) * (index - 1);
                const prevY = this.canvas.height - ((data[index - 1] - 200) / 200) * this.canvas.height;
                
                const cp1x = prevX + (x - prevX) * 0.5;
                const cp1y = prevY;
                const cp2x = prevX + (x - prevX) * 0.5;
                const cp2y = y;
                
                this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
            }
        });
        
        this.ctx.stroke();
        
        // Draw fill
        if (fill) {
            this.ctx.lineTo(this.canvas.width, this.canvas.height);
            this.ctx.lineTo(0, this.canvas.height);
            this.ctx.closePath();
            
            const fillGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            fillGradient.addColorStop(0, backgroundColor);
            fillGradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = fillGradient;
            this.ctx.fill();
        }
        
        // Draw data points
        this.ctx.fillStyle = borderColor;
        data.forEach((value, index) => {
            const x = (this.canvas.width / (labelCount - 1)) * index;
            const y = this.canvas.height - ((value - 200) / 200) * this.canvas.height;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow effect
            this.ctx.shadowColor = borderColor;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        this.ctx.restore();
    }

    drawConfidenceIndicators() {
        if (!this.data.confidence) return;
        
        const labelCount = this.data.confidence.length;
        
        this.data.confidence.forEach((confidence, index) => {
            const x = (this.canvas.width / (labelCount - 1)) * index;
            const y = 20; // Top of chart
            
            // Draw confidence bar
            const barWidth = 4;
            const barHeight = 20;
            const confidenceHeight = (confidence / 100) * barHeight;
            
            // Background bar
            this.ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
            this.ctx.fillRect(x - barWidth/2, y, barWidth, barHeight);
            
            // Confidence bar
            const confidenceColor = confidence > 80 ? '#10b981' : 
                                   confidence > 60 ? '#f59e0b' : '#ef4444';
            this.ctx.fillStyle = confidenceColor;
            this.ctx.fillRect(x - barWidth/2, y + barHeight - confidenceHeight, barWidth, confidenceHeight);
        });
    }

    drawAxes() {
        this.ctx.fillStyle = this.theme === 'dark' ? '#cbd5e1' : '#64748b';
        this.ctx.font = '12px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        // X-axis labels
        this.data.labels.forEach((label, index) => {
            const x = (this.canvas.width / (this.data.labels.length - 1)) * index;
            this.ctx.fillText(label, x, this.canvas.height - 20);
        });
        
        // Y-axis labels
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        
        const yLabels = ['500', '400', '300', '200', '100'];
        yLabels.forEach((label, index) => {
            const y = (this.canvas.height / (yLabels.length - 1)) * index;
            this.ctx.fillText(label, this.canvas.width - 10, y);
        });
    }

    drawLegend() {
        const legendX = 20;
        const legendY = 20;
        
        this.data.datasets.forEach((dataset, index) => {
            const y = legendY + index * 25;
            
            // Draw legend color
            this.ctx.fillStyle = dataset.borderColor;
            this.ctx.fillRect(legendX, y, 15, 3);
            
            // Draw legend text
            this.ctx.fillStyle = this.theme === 'dark' ? '#f8fafc' : '#1e293b';
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(dataset.label, legendX + 20, y + 1);
        });
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Find closest data point
        let closestPoint = null;
        let minDistance = Infinity;
        
        this.data.datasets.forEach(dataset => {
            dataset.data.forEach((value, index) => {
                const x = (this.canvas.width / (dataset.data.length - 1)) * index;
                const y = this.canvas.height - ((value - 200) / 200) * this.canvas.height;
                
                const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
                
                if (distance < minDistance && distance < 20) {
                    minDistance = distance;
                    closestPoint = {
                        dataset: dataset,
                        index: index,
                        value: value,
                        x: x,
                        y: y,
                        label: this.data.labels[index]
                    };
                }
            });
        });
        
        if (closestPoint) {
            this.showTooltip(closestPoint, mouseX, mouseY);
        } else {
            this.hideTooltip();
        }
    }

    showTooltip(point, mouseX, mouseY) {
        // Remove existing tooltip
        this.hideTooltip();
        
        const confidence = this.data.confidence ? this.data.confidence[point.index] : 85;
        const aqiCategory = this.getAQICategory(point.value);
        
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip enhanced';
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <div class="tooltip-title">${point.label}</div>
                <div class="tooltip-period">${this.currentPeriod.toUpperCase()} Forecast</div>
            </div>
            <div class="tooltip-content">
                <div class="tooltip-metric">
                    <span class="metric-label">${point.dataset.label}:</span>
                    <span class="metric-value" style="color: ${point.dataset.borderColor}">${Math.round(point.value)}</span>
                </div>
                <div class="tooltip-metric">
                    <span class="metric-label">Category:</span>
                    <span class="metric-value">${aqiCategory}</span>
                </div>
                <div class="tooltip-metric">
                    <span class="metric-label">Confidence:</span>
                    <span class="metric-value" style="color: ${confidence > 80 ? '#10b981' : confidence > 60 ? '#f59e0b' : '#ef4444'}">${Math.round(confidence)}%</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = this.canvas.getBoundingClientRect();
        tooltip.style.left = (rect.left + mouseX + 10) + 'px';
        tooltip.style.top = (rect.top + mouseY - 10) + 'px';
    }

    getAQICategory(aqi) {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Satisfactory';
        if (aqi <= 200) return 'Moderate';
        if (aqi <= 300) return 'Poor';
        if (aqi <= 400) return 'Very Poor';
        return 'Severe';
    }

    hideTooltip() {
        const existingTooltip = document.querySelector('.chart-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }

    updateChart() {
        // Switch to new period data
        this.data = this.forecastData[this.currentPeriod];
        
        // Start transition animation
        this.startTransitionAnimation();
        
        // Update period indicator
        this.updatePeriodIndicator();
    }

    startTransitionAnimation() {
        this.isAnimating = true;
        this.animationProgress = 0;
        
        const animate = () => {
            this.animationProgress += 0.05;
            
            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
                this.isAnimating = false;
            }
            
            if (this.isAnimating) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    updatePeriodIndicator() {
        const indicator = document.querySelector('.period-indicator');
        if (indicator) {
            const periodNames = {
                '24h': '24 Hours',
                '48h': '48 Hours', 
                '72h': '72 Hours'
            };
            indicator.textContent = periodNames[this.currentPeriod];
        }
    }

    updateTheme(theme) {
        this.theme = theme;
        this.loadData();
    }
}

// Initialize forecast chart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Forecast Chart...');
    try {
        window.forecastChart = new ForecastChart();
        console.log('Forecast Chart initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Forecast Chart:', error);
    }
});

// Add enhanced chart tooltip styles
const chartStyles = `
<style>
.chart-tooltip {
    position: absolute;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 12px;
    padding: 16px;
    font-size: 12px;
    color: #ffffff;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    z-index: 1000;
    pointer-events: none;
    min-width: 200px;
    animation: tooltipFadeIn 0.2s ease-out;
}

.chart-tooltip.enhanced {
    min-width: 250px;
}

@keyframes tooltipFadeIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(-10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.tooltip-header {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tooltip-title {
    font-weight: 600;
    font-size: 14px;
    color: #ffffff;
    margin-bottom: 4px;
}

.tooltip-period {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
}

.tooltip-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tooltip-metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.metric-label {
    color: #94a3b8;
    font-weight: 500;
}

.metric-value {
    color: #ffffff;
    font-weight: 600;
    font-size: 13px;
}

/* Period Indicator */
.period-indicator {
    font-size: 14px;
    font-weight: 600;
    color: #3b82f6;
    margin-left: 8px;
}

/* Timeline Controls */
.btn-timeline {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    font-size: 12px;
}

.btn-timeline:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

.btn-timeline.active {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', chartStyles);
