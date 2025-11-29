// Forecasting Page JavaScript - Optimized
class ForecastingDashboard {
    constructor() {
        this.chart = null;
        this.seasonalChart = null;
        this.gauges = {};
        this.currentData = null;
        this.updateInterval = null;
        this.alertsInterval = null;
        this.isInitialized = false;
        
        // Set API base URL
        this.apiBase = 
            window.location.origin.includes('localhost') || 
            window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000'
                : '';
        
        // Initialize immediately with fallback data
        this.initWithFallback();
    }

    async initWithFallback() {
        // Show loading state immediately
        this.showLoadingState();
        
        // Setup UI instantly
        this.setupEventListeners();
        this.setupBasicAnimations();
        this.initializeGauges();
        
        // Initialize charts as soon as Chart.js is ready
        this.waitForChartJS().then(() => {
            this.initializeCharts();
            if (this.currentData?.forecasts?.['24_hour']) {
                this.updateForecastChart({ '24_hour': this.currentData.forecasts['24_hour'] });
            }
        });
        
        // Load fallback data synchronously for instant content
        this.loadFallbackData();
        this.isInitialized = true;
        setTimeout(() => this.hideLoadingState(), 200);
        
        // Fetch real data in background without waiting
        this.loadForecastDataInBackground();
        
        // Start update loops
        this.startRealTimeUpdates();
        this.startAlertsUpdates();
    }
    
    waitForChartJS(maxRetries = 20) {
        return new Promise((resolve) => {
            let retries = 0;
            const checkChart = () => {
                if (typeof Chart !== 'undefined') {
                    resolve();
                } else if (retries < maxRetries) {
                    retries++;
                    setTimeout(checkChart, 100);
                } else {
                    console.warn('Chart.js not loaded after max retries, continuing anyway');
                    resolve(); // Continue even if Chart.js doesn't load
                }
            };
            checkChart();
        });
    }
    
    async loadForecastDataInBackground() {
        // Load real data without blocking the UI
        try {
            await this.loadForecastData();
            console.log('Real-time forecast data loaded successfully');
        } catch (error) {
            console.warn('Could not load real-time data, using fallback:', error);
            // Keep using fallback data, no need to reload
        }
    }

    showLoadingState() {
        // Add loading skeletons to key elements
        const elements = [
            { selector: '.chart-container', skeleton: 'chart' },
            { selector: '.insights-content', skeleton: 'insight' },
            { selector: '.seasonal-content', skeleton: 'chart' },
            { selector: '.alerts-list', skeleton: 'alert' }
        ];
        
        elements.forEach(({ selector, skeleton }) => {
            const element = document.querySelector(selector);
            if (element) {
                element.innerHTML = `<div class="loading-skeleton ${skeleton}"></div>`;
            }
        });
        
        // Add gauge skeletons
        const gaugeIds = ['accuracyGauge', 'confidenceGauge', 'uptimeGauge'];
        gaugeIds.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const container = canvas.parentElement;
                if (container) {
                    container.innerHTML = '<div class="loading-skeleton gauge"></div>';
                }
            }
        });
    }

    loadFallbackData() {
        // Fallback data for immediate display - generate realistic data
        const now = Date.now();
        const baseAQI = 245;
        
        this.currentData = {
            current_conditions: {
                aqi: baseAQI,
                category: "Unhealthy",
                primary_pollutant: "PM2.5",
                weather: {
                    temperature: 28.5,
                    humidity: 45,
                    wind_speed: 8.2,
                    wind_direction: "NW",
                    pressure: 1013
                }
            },
            forecasts: {
                "6_hour": {
                    predictions: Array.from({length: 6}, (_, i) => ({
                        timestamp: new Date(now + i * 60 * 60 * 1000).toISOString(),
                        aqi: Math.round(baseAQI + Math.sin(i / 2) * 20 + (Math.random() * 10 - 5)),
                        confidence: Math.max(85, 95 - i * 1.5)
                    }))
                },
                "24_hour": {
                    predictions: Array.from({length: 24}, (_, i) => ({
                        timestamp: new Date(now + i * 60 * 60 * 1000).toISOString(),
                        aqi: Math.round(baseAQI + Math.sin(i / 6) * 30 + (Math.random() * 15 - 7.5)),
                        confidence: Math.max(75, 90 - i * 0.6)
                    }))
                },
                "72_hour": {
                    predictions: Array.from({length: 72}, (_, i) => ({
                        timestamp: new Date(now + i * 60 * 60 * 1000).toISOString(),
                        aqi: Math.round(baseAQI + Math.sin(i / 12) * 40 + (Math.random() * 20 - 10)),
                        confidence: Math.max(65, 85 - i * 0.3)
                    }))
                }
            },
            ai_insights: {
                model_confidence: 92,
                key_factors: {
                    weather_impact: 0.7,
                    source_activity: 0.8,
                    seasonal_factors: 0.6
                },
                trend: "worsening",
                change_percent: 15
            },
            seasonal_context: {
                current_season: "Post-Monsoon (Stubble Burning)",
                seasonal_impact: "High",
                primary_seasonal_source: "Stubble Burning",
                description: "Peak stubble burning season in Punjab-Haryana affecting Delhi-NCR"
            },
            alerts: [
                {
                    type: "warning",
                    severity: "high",
                    title: "Unhealthy Conditions Predicted",
                    message: "AQI expected to reach 285 in next 24 hours",
                    timeframe: "Next 24 hours"
                }
            ],
            confidence_metrics: {
                overall_accuracy: 89.2,
                model_confidence: 92.5
            }
        };
        
        // Update all sections immediately
        try {
            // Update current conditions
            this.updateCurrentConditions(this.currentData.current_conditions);
            
            // Update AI insights
            this.updateAIInsights(this.currentData.ai_insights);
            
            // Update seasonal context
            this.updateSeasonalContext(this.currentData.seasonal_context);
            
            // Update alerts
            this.updateAlerts(this.currentData.alerts);
            
            // Update performance metrics
            this.updatePerformanceMetrics(this.currentData.confidence_metrics);
            
            // Update hero stats
            const currentAQIEl = document.getElementById('currentAQI');
            if (currentAQIEl) {
                currentAQIEl.textContent = Math.round(this.currentData.current_conditions.aqi || 245);
            }
            
            const forecastAccuracyEl = document.getElementById('forecastAccuracy');
            if (forecastAccuracyEl) {
                forecastAccuracyEl.textContent = `${this.currentData.confidence_metrics.overall_accuracy || 89}%`;
            }
            
            const modelConfidenceEl = document.getElementById('modelConfidence');
            if (modelConfidenceEl) {
                modelConfidenceEl.textContent = `${this.currentData.confidence_metrics.model_confidence || 92}%`;
            }
            
            // Full dashboard update
            this.updateDashboard(this.currentData);
            
            // Ensure chart is populated if it exists - with retry logic
            if (this.currentData.forecasts && this.currentData.forecasts['24_hour']) {
                if (this.chart) {
                    this.updateForecastChart({ '24_hour': this.currentData.forecasts['24_hour'] });
                } else {
                    // Chart not ready yet, try again after a short delay
                    setTimeout(() => {
                        if (this.chart && this.currentData.forecasts && this.currentData.forecasts['24_hour']) {
                            this.updateForecastChart({ '24_hour': this.currentData.forecasts['24_hour'] });
                        }
                    }, 500);
                }
            }
            
            this.hideLoadingState();
            console.log('Fallback data loaded and all sections updated');
        } catch (error) {
            console.error('Error updating dashboard with fallback data:', error);
            this.hideLoadingState();
        }
    }

    async loadForecastData() {
        try {
            // Get current selections
            const forecastType = document.getElementById('forecastType')?.value || 'advanced';
            const timeHorizon = document.getElementById('timeHorizon')?.value || '24h';
            const location = document.getElementById('location')?.value || 'delhi-ncr';
            
            // Build API endpoint based on forecast type
            let apiEndpoint = '/api/forecasting/advanced-forecast';
            if (forecastType === 'predictive') {
                apiEndpoint = '/api/forecasting/predictive-modeling';
            } else if (forecastType === 'seasonal') {
                apiEndpoint = '/api/forecasting/seasonal-forecast';
            }
            
            // Add cache-busting parameter
            const cacheBuster = `?t=${Date.now()}&horizon=${timeHorizon}&location=${location}`;
            
            // Use AbortController with reasonable timeout (5 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.apiBase}${apiEndpoint}${cacheBuster}`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            this.currentData = data;
            this.lastUpdateTime = new Date();
            
            // Update all sections with real data
            this.updateDashboard(data);
            
            // Ensure chart is updated with real data - wait for chart to be ready
            if (data.forecasts) {
                const timeHorizon = document.getElementById('timeHorizon')?.value || '24h';
                let forecastKey = '24_hour';
                if (timeHorizon === '6h') forecastKey = '6_hour';
                else if (timeHorizon === '72h') forecastKey = '72_hour';
                
                // Wait for chart to be ready, then update
                if (this.chart) {
                    if (data.forecasts[forecastKey]) {
                        this.updateForecastChart({ [forecastKey]: data.forecasts[forecastKey] });
                    } else if (data.forecasts['24_hour']) {
                        this.updateForecastChart({ '24_hour': data.forecasts['24_hour'] });
                    }
                } else {
                    // Chart not ready yet, retry after a delay
                    setTimeout(() => {
                        if (this.chart && data.forecasts) {
                            if (data.forecasts[forecastKey]) {
                                this.updateForecastChart({ [forecastKey]: data.forecasts[forecastKey] });
                            } else if (data.forecasts['24_hour']) {
                                this.updateForecastChart({ '24_hour': data.forecasts['24_hour'] });
                            }
                        }
                    }, 500);
                }
            }
            
            // Also update alerts from forecast data if available
            if (data.alerts && Array.isArray(data.alerts) && data.alerts.length > 0) {
                this.updateAlerts(data.alerts);
            }
            
            // Update last updated timestamp
            const lastUpdated = document.getElementById('lastUpdated');
            if (lastUpdated) {
                lastUpdated.textContent = 'Updated just now';
            }
            
            // Hide loading state
            this.hideLoadingState();
            
            console.log('Forecast data loaded and all sections updated successfully');
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('Request timeout, using fallback data');
            } else {
                console.error('Error loading forecast data:', error);
            }
            // Don't throw - keep using fallback data
            this.hideLoadingState();
        }
    }
    
    hideLoadingState() {
        // Remove loading skeletons
        document.querySelectorAll('.loading-skeleton').forEach(skeleton => {
            skeleton.style.opacity = '0';
            setTimeout(() => skeleton.remove(), 300);
        });
        
        // Ensure all content sections are visible
        const contentSections = [
            '.chart-container',
            '.insights-content',
            '.seasonal-content',
            '.alerts-list',
            '.performance-metrics'
        ];
        
        contentSections.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.opacity = '1';
                element.style.visibility = 'visible';
            }
        });
    }

    updateDashboard(data) {
        try {
            // Update current conditions
            if (data.current_conditions) {
                this.updateCurrentConditions(data.current_conditions);
            }
            
            // Update AI insights
            if (data.ai_insights) {
                this.updateAIInsights(data.ai_insights);
            }
            
            // Update seasonal context
            if (data.seasonal_context) {
                this.updateSeasonalContext(data.seasonal_context);
            }
            
            // Update alerts
            if (data.alerts && Array.isArray(data.alerts)) {
                this.updateAlerts(data.alerts);
            }
            
            // Update charts
            if (data.forecasts) {
                // Determine which forecast period to show based on current selection
                const timeHorizon = document.getElementById('timeHorizon')?.value || '24h';
                let forecastKey = '24_hour';
                if (timeHorizon === '6h') forecastKey = '6_hour';
                else if (timeHorizon === '72h') forecastKey = '72_hour';
                
                if (data.forecasts[forecastKey]) {
                    this.updateForecastChart({ [forecastKey]: data.forecasts[forecastKey] });
                } else if (data.forecasts['24_hour']) {
                    // Fallback to 24 hour if selected period not available
                    this.updateForecastChart({ '24_hour': data.forecasts['24_hour'] });
                }
            }
            
            // Update performance metrics
            if (data.confidence_metrics) {
                this.updatePerformanceMetrics(data.confidence_metrics);
            }
            
            // Update hero stats
            if (data.current_conditions) {
                const currentAQIEl = document.getElementById('currentAQI');
                if (currentAQIEl) {
                    currentAQIEl.textContent = Math.round(data.current_conditions.aqi || 245);
                }
            }
            
            if (data.confidence_metrics) {
                const forecastAccuracyEl = document.getElementById('forecastAccuracy');
                if (forecastAccuracyEl) {
                    forecastAccuracyEl.textContent = `${data.confidence_metrics.overall_accuracy || 89}%`;
                }
                
                const modelConfidenceEl = document.getElementById('modelConfidence');
                if (modelConfidenceEl) {
                    modelConfidenceEl.textContent = `${data.confidence_metrics.model_confidence || 92}%`;
                }
            }
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    updateCurrentConditions(conditions) {
        if (!conditions) return;
        
        const aqiEl = document.getElementById('currentAQI');
        if (aqiEl && conditions.aqi !== undefined) {
            aqiEl.textContent = Math.round(conditions.aqi);
            // Update AQI category styling
            aqiEl.className = `stat-value aqi-${this.getAQICategory(conditions.aqi).toLowerCase().replace(/\s+/g, '-')}`;
        }
        
        if (conditions.weather) {
            const windSpeedEl = document.getElementById('currentWindSpeed');
            if (windSpeedEl && conditions.weather.wind_speed !== undefined) {
                windSpeedEl.textContent = `${conditions.weather.wind_speed} km/h`;
            }
            
            const tempEl = document.getElementById('currentTemperature');
            if (tempEl && conditions.weather.temperature !== undefined) {
                tempEl.textContent = `${conditions.weather.temperature}°C`;
            }
            
            const humidityEl = document.getElementById('currentHumidity');
            if (humidityEl && conditions.weather.humidity !== undefined) {
                humidityEl.textContent = `${conditions.weather.humidity}%`;
            }
            
            const pressureEl = document.getElementById('currentPressure');
            if (pressureEl && conditions.weather.pressure !== undefined) {
                pressureEl.textContent = `${conditions.weather.pressure} hPa`;
            }
        }
    }

    updateAIInsights(insights) {
        if (!insights) {
            console.warn('No insights data provided');
            return;
        }
        
        try {
            const confidenceEl = document.getElementById('aiConfidence');
            if (confidenceEl) {
                const confidence = insights.model_confidence || insights.confidence || 92;
                confidenceEl.textContent = `${Math.round(confidence)}%`;
            }
            
            const keyFactorsEl = document.getElementById('keyFactors');
            if (keyFactorsEl) {
                if (insights.key_factors) {
                    if (typeof insights.key_factors === 'object') {
                        keyFactorsEl.textContent = this.formatKeyFactors(insights.key_factors);
                    } else {
                        keyFactorsEl.textContent = insights.key_factors;
                    }
                } else if (insights.identified_sources && insights.identified_sources.length > 0) {
                    const sources = insights.identified_sources.map(s => {
                        if (typeof s === 'object') return s.name || s.type || 'Unknown';
                        return s;
                    });
                    keyFactorsEl.textContent = `Primary sources: ${sources.join(', ')}`;
                } else if (insights.dominant_source) {
                    keyFactorsEl.textContent = `Primary source: ${insights.dominant_source}`;
                } else {
                    keyFactorsEl.textContent = 'Stubble burning intensity and temperature inversion are primary drivers';
                }
            }
            
            const trendAnalysisEl = document.getElementById('trendAnalysis');
            if (trendAnalysisEl) {
                trendAnalysisEl.textContent = this.getTrendAnalysis(insights);
            }
            
            const recommendationsEl = document.getElementById('recommendations');
            if (recommendationsEl) {
                recommendationsEl.textContent = this.getRecommendations(insights);
            }
            
            console.log('AI Insights updated successfully');
        } catch (error) {
            console.error('Error updating AI insights:', error);
        }
    }

    updateSeasonalContext(context) {
        if (!context) return;
        
        const currentSeasonEl = document.getElementById('currentSeason');
        if (currentSeasonEl && context.current_season) {
            currentSeasonEl.textContent = context.current_season;
        }
        
        const seasonNameEl = document.getElementById('seasonName');
        if (seasonNameEl && context.current_season) {
            seasonNameEl.textContent = context.current_season;
        }
        
        const seasonDescEl = document.getElementById('seasonDescription');
        if (seasonDescEl) {
            seasonDescEl.textContent = context.description || context.season || 'Seasonal air quality patterns';
        }
        
        const impactLevel = document.querySelector('.impact-level');
        if (impactLevel && context.seasonal_impact) {
            impactLevel.textContent = `${context.seasonal_impact} Impact`;
            impactLevel.className = `impact-level ${context.seasonal_impact.toLowerCase().replace(/\s+/g, '-')}`;
        }
        
        const impactSource = document.querySelector('.impact-source');
        if (impactSource && context.primary_seasonal_source) {
            impactSource.textContent = `Primary Source: ${context.primary_seasonal_source}`;
        }
    }

    updateAlerts(alerts) {
        const alertsList = document.getElementById('alertsList');
        const alertCount = document.getElementById('alertCount');
        
        if (!alertsList || !alertCount) {
            console.warn('Alert elements not found');
            return;
        }
        
        if (!Array.isArray(alerts) || alerts.length === 0) {
            // Show default alert if no alerts
            alertsList.innerHTML = `
                <div class="alert-item info">
                    <div class="alert-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="alert-content">
                        <h4>No Active Alerts</h4>
                        <p>Air quality conditions are being monitored</p>
                        <span class="alert-timeframe">Ongoing</span>
                    </div>
                </div>
            `;
            alertCount.textContent = '0 Active';
            return;
        }
        
        alertCount.textContent = `${alerts.length} Active`;
        
        alertsList.innerHTML = alerts.map(alert => {
            const severity = alert.severity || alert.type || 'info';
            const title = alert.title || alert.message || 'Alert';
            const message = alert.message || alert.description || '';
            const timeframe = alert.timeframe || alert.time || 'Ongoing';
            
            return `
                <div class="alert-item ${severity}">
                    <div class="alert-icon">
                        <i class="fas fa-${this.getAlertIcon(alert.type || severity)}"></i>
                    </div>
                    <div class="alert-content">
                        <h4>${title}</h4>
                        <p>${message}</p>
                        <span class="alert-timeframe">${timeframe}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`Updated ${alerts.length} alerts`);
    }
    
    async loadAlertsData() {
        try {
            // Try multiple alert endpoints for better coverage
            const endpoints = [
                '/api/overview/real-time-alerts',
                '/api/modern/alerts/realtime'
            ];
            
            let alerts = [];
            let lastError = null;
            
            // Try each endpoint until one succeeds
            for (const endpoint of endpoints) {
                try {
                    const cacheBuster = `?t=${Date.now()}`;
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    
                    const response = await fetch(`http://localhost:5000${endpoint}${cacheBuster}`, {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Handle different response formats
                        if (data.alerts && Array.isArray(data.alerts)) {
                            alerts = data.alerts;
                        } else if (Array.isArray(data)) {
                            alerts = data;
                        } else if (data.forecast_alerts) {
                            alerts = data.forecast_alerts;
                        }
                        
                        if (alerts.length > 0) {
                            console.log(`Loaded ${alerts.length} alerts from ${endpoint}`);
                            break;
                        }
                    }
                } catch (error) {
                    lastError = error;
                    if (error.name !== 'AbortError') {
                        console.warn(`Failed to load alerts from ${endpoint}:`, error);
                    }
                    continue;
                }
            }
            
            // If no alerts from API, get from forecast data
            if (alerts.length === 0 && this.currentData && this.currentData.alerts) {
                alerts = this.currentData.alerts;
                console.log('Using alerts from forecast data');
            }
            
            // Update alerts in UI
            this.updateAlerts(alerts);
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error loading alerts:', error);
            }
            // Don't show error, just keep existing alerts
        }
    }
    
    startAlertsUpdates() {
        // Load alerts immediately
        this.loadAlertsData();
        
        // Update alerts every 30 seconds (frequent updates)
        this.alertsInterval = setInterval(() => {
            // Only update if page is visible
            if (document.hidden) {
                return;
            }
            
            this.loadAlertsData();
        }, 30 * 1000); // 30 seconds
        
        // Also update alerts when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.alertsInterval) {
                // Page became visible, update alerts immediately
                this.loadAlertsData();
            }
        });
        
        console.log('Alerts auto-update started (every 30 seconds)');
    }
    
    cleanup() {
        // Clean up intervals when page unloads
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.alertsInterval) {
            clearInterval(this.alertsInterval);
            this.alertsInterval = null;
        }
        
        // Remove event listeners to prevent memory leaks
        const forecastTypeSelect = document.getElementById('forecastType');
        const timeHorizonSelect = document.getElementById('timeHorizon');
        const locationSelect = document.getElementById('location');
        const updateBtn = document.getElementById('updateForecast');
        
        // Note: We can't easily remove anonymous event listeners, but cleanup helps
        console.log('Forecasting dashboard cleaned up');
    }

    updateForecastChart(forecasts) {
        if (!this.chart) {
            console.warn('Chart not initialized yet, will retry');
            // Retry after chart is initialized
            setTimeout(() => {
                if (this.chart && forecasts) {
                    this.updateForecastChart(forecasts);
                }
            }, 500);
            return;
        }

        try {
            // Handle different forecast periods
            let forecastKey = Object.keys(forecasts)[0];
            let forecastData = forecasts[forecastKey];
            
            if (!forecastData || !forecastData.predictions) {
                console.warn('Invalid forecast data structure:', forecasts);
                // Try to use fallback data
                if (this.currentData && this.currentData.forecasts && this.currentData.forecasts['24_hour']) {
                    forecastData = this.currentData.forecasts['24_hour'];
                    forecastKey = '24_hour';
                } else {
                    return;
                }
            }

            const predictions = forecastData.predictions;
            if (!predictions || predictions.length === 0) {
                console.warn('No predictions in forecast data');
                return;
            }

            const timeLabels = predictions.map(pred => {
                try {
                    const date = new Date(pred.timestamp);
                    // Format based on period
                    if (forecastKey === 'weekly') {
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    } else {
                        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    }
                } catch (e) {
                    return '';
                }
            }).filter(label => label);
            
            const aqiValues = predictions.map(pred => {
                const aqi = pred.aqi || pred.aqi_prediction || 0;
                return typeof aqi === 'number' ? aqi : parseFloat(aqi) || 0;
            });
            
            const confidenceValues = predictions.map(pred => {
                const conf = pred.confidence || 85;
                return typeof conf === 'number' ? conf : parseFloat(conf) || 85;
            });

            if (timeLabels.length > 0 && aqiValues.length > 0) {
                this.chart.data.labels = timeLabels;
                this.chart.data.datasets[0].data = aqiValues;
                this.chart.data.datasets[1].data = confidenceValues;
                
                // Update chart with animation disabled for faster rendering
                this.chart.update('none');
                console.log('Chart updated with', predictions.length, 'data points');
            } else {
                console.warn('No valid data to display in chart');
            }
        } catch (error) {
            console.error('Error updating forecast chart:', error);
            // Try to show error message or fallback
            const chartContainer = document.querySelector('.chart-container');
            if (chartContainer && !chartContainer.querySelector('.error-message')) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent = 'Unable to load chart data. Please refresh.';
                errorMsg.style.cssText = 'padding: 20px; text-align: center; color: #ef4444;';
                chartContainer.appendChild(errorMsg);
            }
        }
    }

    updatePerformanceMetrics(metrics) {
        if (!metrics) return;
        
        try {
            // Update gauge values
            const accuracy = metrics.overall_accuracy || 89.2;
            const confidence = metrics.model_confidence || 92.5;
            
            this.updateGauge('accuracyGauge', accuracy);
            this.updateGauge('confidenceGauge', confidence);
            this.updateGauge('uptimeGauge', 99.1); // Mock uptime data
            
            // Update forecast accuracy
            const forecastAccuracyEl = document.getElementById('forecastAccuracy');
            if (forecastAccuracyEl) {
                forecastAccuracyEl.textContent = `${accuracy}%`;
            }
            
            const modelConfidenceEl = document.getElementById('modelConfidence');
            if (modelConfidenceEl) {
                modelConfidenceEl.textContent = `${confidence}%`;
            }
            
            console.log('Performance metrics updated');
        } catch (error) {
            console.error('Error updating performance metrics:', error);
        }
    }

    initializeCharts() {
        // Main forecast chart - initialize immediately with empty data
        const ctx = document.getElementById('forecastChart');
        if (!ctx) {
            console.warn('Forecast chart canvas not found');
            return;
        }
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded yet, will retry');
            setTimeout(() => this.initializeCharts(), 200);
            return;
        }
        
        try {
            this.chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'AQI Prediction',
                            data: [],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 4
                        }, {
                            label: 'Confidence',
                            data: [],
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 2,
                            fill: false,
                            yAxisID: 'y1',
                            pointRadius: 0,
                            pointHoverRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                            duration: 0 // Disable animation for faster rendering
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                enabled: true,
                                mode: 'index',
                                intersect: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                min: 50,
                                max: 400,
                                title: {
                                    display: true,
                                    text: 'AQI'
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                min: 0,
                                max: 100,
                                title: {
                                    display: true,
                                    text: 'Confidence %'
                                },
                                grid: {
                                    drawOnChartArea: false,
                                },
                            }
                        },
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        }
                    }
            });
            console.log('Chart initialized successfully');
        } catch (error) {
            console.error('Error initializing chart:', error);
            // Retry once more after a delay
            setTimeout(() => {
                if (typeof Chart !== 'undefined' && !this.chart) {
                    this.initializeCharts();
                }
            }, 500);
        }

        // Seasonal chart
        const seasonalCtx = document.getElementById('seasonalChart');
        if (seasonalCtx) {
            try {
                if (typeof Chart === 'undefined') {
                    setTimeout(() => {
                        if (typeof Chart !== 'undefined') {
                            this.initializeSeasonalChart();
                        }
                    }, 500);
                    return;
                }
                this.initializeSeasonalChart();
            } catch (error) {
                console.error('Error initializing seasonal chart:', error);
            }
        }
    }
    
    initializeSeasonalChart() {
        const seasonalCtx = document.getElementById('seasonalChart');
        if (!seasonalCtx) return;
        
        try {
            this.seasonalChart = new Chart(seasonalCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Stubble Burning', 'Industrial', 'Vehicular', 'Construction', 'Other'],
                    datasets: [{
                        data: [35, 25, 20, 12, 8],
                        backgroundColor: [
                            '#06b6d4',
                            '#f97316',
                            '#ef4444',
                            '#8b5cf6',
                            '#6b7280'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 0 // Disable animation for faster rendering
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
            console.log('Seasonal chart initialized');
        } catch (error) {
            console.error('Error creating seasonal chart:', error);
        }
    }

    initializeGauges() {
        // Initialize gauge charts
        this.gauges.accuracyGauge = this.createGauge('accuracyGauge', 89.2, '#10b981');
        this.gauges.confidenceGauge = this.createGauge('confidenceGauge', 92.5, '#3b82f6');
        this.gauges.uptimeGauge = this.createGauge('uptimeGauge', 99.1, '#8b5cf6');
    }

    createGauge(canvasId, value, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        // Set canvas size immediately for proper alignment
        const size = 120;
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = (size / 2) - 15; // Leave margin for stroke

        // Draw background arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#e5e7eb';
        ctx.stroke();

        // Draw value arc with animation
        const angle = (value / 100) * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + angle);
        ctx.lineWidth = 12;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw value text
        ctx.fillStyle = color;
        ctx.font = 'bold 20px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${value}%`, centerX, centerY + 5);

        return { canvas, ctx, centerX, centerY, radius };
    }

    updateGauge(gaugeId, value) {
        const gauge = this.gauges[gaugeId];
        if (!gauge) return;

        const { canvas, ctx, centerX, centerY, radius } = gauge;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Redraw with new value
        this.createGauge(gaugeId, value, gauge.ctx.strokeStyle);
    }

    setupEventListeners() {
        // Forecast type change
        const forecastTypeSelect = document.getElementById('forecastType');
        if (forecastTypeSelect) {
            forecastTypeSelect.addEventListener('change', async (e) => {
                console.log('Forecast type changed to:', e.target.value);
                this.showLoadingState();
                try {
                    await this.loadForecastData();
                } catch (error) {
                    console.error('Error loading forecast data:', error);
                    this.loadFallbackData();
                }
            });
        }

        // Time horizon change
        const timeHorizonSelect = document.getElementById('timeHorizon');
        if (timeHorizonSelect) {
            timeHorizonSelect.addEventListener('change', async (e) => {
                console.log('Time horizon changed to:', e.target.value);
                this.showLoadingState();
                try {
                    await this.loadForecastData();
                } catch (error) {
                    console.error('Error loading forecast data:', error);
                    this.loadFallbackData();
                }
            });
        }

        // Location change
        const locationSelect = document.getElementById('location');
        if (locationSelect) {
            locationSelect.addEventListener('change', async (e) => {
                console.log('Location changed to:', e.target.value);
                this.showLoadingState();
                try {
                    await this.loadForecastData();
                } catch (error) {
                    console.error('Error loading forecast data:', error);
                    this.loadFallbackData();
                }
            });
        }

        // Update forecast button
        const updateBtn = document.getElementById('updateForecast');
        if (updateBtn) {
            updateBtn.addEventListener('click', async () => {
                console.log('Update forecast button clicked');
                updateBtn.disabled = true;
                updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                this.showLoadingState();
                try {
                    await this.loadForecastData();
                    updateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Update Forecast';
                } catch (error) {
                    console.error('Error loading forecast data:', error);
                    this.loadFallbackData();
                    updateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Update Forecast';
                } finally {
                    updateBtn.disabled = false;
                }
            });
        }

        // Chart period buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const period = e.target.dataset.period;
                console.log('Chart period changed to:', period);
                this.updateChartPeriod(period);
            });
        });
    }

    updateChartPeriod(period) {
        if (!this.currentData) {
            // If no data, try to load it
            this.loadForecastData();
            return;
        }

        let forecasts;
        switch(period) {
            case '24h':
                forecasts = this.currentData.forecasts?.['24_hour'] || this.currentData.forecasts?.['24_hour'];
                if (!forecasts && this.currentData.forecasts) {
                    // Try alternative structure
                    forecasts = this.currentData.forecasts['6_hour'] || this.currentData.forecasts['24_hour'];
                }
                break;
            case '72h':
                forecasts = this.currentData.forecasts?.['72_hour'] || this.currentData.forecasts?.['72_hour'];
                break;
            case 'weekly':
                // Fetch weekly forecast from API
                this.loadWeeklyForecast();
                return;
        }

        if (forecasts) {
            this.updateForecastChart({ [period]: forecasts });
        } else {
            console.warn('No forecast data available for period:', period);
            // Try to reload data
            this.loadForecastData();
        }
    }

    async loadWeeklyForecast() {
        try {
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/forecasting/weekly-forecast${cacheBuster}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                const weeklyData = await response.json();
                // Convert weekly data to chart format
                const weeklyForecast = {
                    predictions: weeklyData.map(day => ({
                        timestamp: day.date,
                        aqi: day.aqi,
                        confidence: day.confidence || 85
                    }))
                };
                this.updateForecastChart({ weekly: weeklyForecast });
            }
        } catch (error) {
            console.error('Error loading weekly forecast:', error);
            // Fallback to generated data
            const forecasts = this.generateWeeklyData();
            this.updateForecastChart({ weekly: forecasts });
        }
    }

    generateWeeklyData() {
        const predictions = [];
        for (let i = 0; i < 7; i++) {
            predictions.push({
                timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
                aqi: 200 + Math.random() * 100,
                confidence: 85 - i * 2
            });
        }
        return { predictions };
    }

    startRealTimeUpdates() {
        // Update every 5 minutes with real-time data (only if page is visible)
        this.updateInterval = setInterval(async () => {
            // Only update if page is visible
            if (document.hidden) {
                return;
            }
            
            try {
                console.log('Auto-updating forecast data...');
                await this.loadForecastData();
                const lastUpdated = document.getElementById('lastUpdated');
                if (lastUpdated) {
                    lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString()}`;
                }
            } catch (error) {
                console.error('Error in auto-update:', error);
                // Don't show error to user, just log it
            }
        }, 5 * 60 * 1000);
        
        // Pause updates when page is hidden, resume when visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Page hidden, pausing updates');
            } else {
                console.log('Page visible, resuming updates');
            }
        });

        // Update last updated time every minute
        setInterval(() => {
            const lastUpdated = document.getElementById('lastUpdated');
            if (lastUpdated) {
                const now = new Date();
                const minutesAgo = Math.floor((now - (this.lastUpdateTime || now)) / 60000);
                if (minutesAgo < 1) {
                    lastUpdated.textContent = 'Updated just now';
                } else if (minutesAgo < 60) {
                    lastUpdated.textContent = `Updated ${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
                } else {
                    lastUpdated.textContent = `Updated ${now.toLocaleTimeString()}`;
                }
            }
        }, 60 * 1000);
    }

    setupBasicAnimations() {
        // Basic CSS animations without GSAP dependency
        const elements = document.querySelectorAll('.hero-content, .hero-stats .stat-item, .dashboard-card');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    setupAnimations() {
        // Enhanced animations with GSAP if available
        if (typeof gsap !== 'undefined') {
            gsap.from('.hero-content', {
                duration: 1,
                y: 50,
                opacity: 0,
                ease: 'power2.out'
            });

            gsap.from('.hero-stats .stat-item', {
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.2,
                delay: 0.5,
                ease: 'power2.out'
            });

            gsap.from('.dashboard-card', {
                duration: 0.6,
                y: 30,
                opacity: 0,
                stagger: 0.1,
                delay: 0.8,
                ease: 'power2.out'
            });

            gsap.to('.forecast-animation .weather-icon', {
                duration: 2,
                rotation: 360,
                repeat: -1,
                ease: 'none'
            });

            gsap.to('.prediction-bubbles .bubble', {
                duration: 3,
                y: -20,
                opacity: 0,
                repeat: -1,
                stagger: 1,
                ease: 'power2.out'
            });
        }
    }

    // Helper methods
    getAQICategory(aqi) {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
        if (aqi <= 200) return 'Unhealthy';
        if (aqi <= 300) return 'Very Unhealthy';
        return 'Hazardous';
    }

    formatKeyFactors(factors) {
        if (!factors) return 'Multiple factors influencing air quality';
        
        const factorNames = {
            'weather_impact': 'Weather Conditions',
            'source_activity': 'Pollution Sources',
            'seasonal_factors': 'Seasonal Patterns',
            'traffic_patterns': 'Traffic Patterns',
            'industrial_activity': 'Industrial Activity'
        };

        return Object.entries(factors)
            .filter(([key, value]) => value > 0.5)
            .map(([key, value]) => `${factorNames[key] || key} (${Math.round(value * 100)}%)`)
            .join(', ');
    }

    getTrendAnalysis(insights) {
        const trend = insights.trend || 'stable';
        const change = insights.change_percent || 0;
        
        if (trend === 'improving') {
            return `AQI expected to improve by ${Math.abs(change)}% in next 24 hours`;
        } else if (trend === 'worsening') {
            return `AQI expected to worsen by ${change}% in next 24 hours`;
        } else {
            return 'AQI expected to remain stable in next 24 hours';
        }
    }

    getRecommendations(insights) {
        const recommendations = insights.policy_recommendations || [];
        if (recommendations.length > 0) {
            return recommendations[0].description || 'Monitor conditions and implement appropriate measures';
        }
        return 'Continue monitoring air quality trends';
    }

    getAlertIcon(type) {
        const icons = {
            'emergency': 'exclamation-triangle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle',
            'success': 'check-circle',
            'health': 'heart',
            'seasonal': 'calendar-alt'
        };
        return icons[type] || 'info-circle';
    }

    showError(message) {
        console.error(message);
        // You could implement a toast notification here
    }
}

// Initialize when DOM and Chart.js are loaded
function initializeForecastingDashboard() {
    // Wait for Chart.js to be available
    if (typeof Chart === 'undefined') {
        // Chart.js is loaded with defer, wait a bit more
        setTimeout(initializeForecastingDashboard, 100);
        return;
    }
    
    // Initialize dashboard
    try {
        window.forecastingDashboard = new ForecastingDashboard();
        console.log('Forecasting dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing forecasting dashboard:', error);
        // Retry after a short delay
        setTimeout(initializeForecastingDashboard, 500);
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeForecastingDashboard);
} else {
    // DOM is already loaded
    initializeForecastingDashboard();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.forecastingDashboard) {
        window.forecastingDashboard.cleanup();
    }
});

// Also cleanup on page visibility change to prevent interference with navigation
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.forecastingDashboard) {
        // Pause updates when page is hidden
        if (window.forecastingDashboard.updateInterval) {
            clearInterval(window.forecastingDashboard.updateInterval);
        }
        if (window.forecastingDashboard.alertsInterval) {
            clearInterval(window.forecastingDashboard.alertsInterval);
        }
    }
});
