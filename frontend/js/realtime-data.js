// Real-Time Data Integration for Frontend

class RealTimeDataManager {
    constructor() {
        this.realTimeEnabled = false;
        this.updateInterval = null;
        this.lastUpdate = null;
        this.apiStatus = null;
        this.init();
    }

    async init() {
        // Check if real-time APIs are available
        await this.checkApiStatus();
        
        // Start real-time updates if available
        if (this.realTimeEnabled) {
            this.startRealTimeUpdates();
        }
        
        console.log(`Real-time data: ${this.realTimeEnabled ? 'ENABLED' : 'DISABLED'}`);
    }

    async checkApiStatus() {
        try {
            const response = await fetch('/api/realtime/api-status');
            const data = await response.json();
            
            if (data.success) {
                this.apiStatus = data.api_status;
                this.realTimeEnabled = this.hasWorkingApis();
                console.log('API Status:', this.apiStatus);
            }
        } catch (error) {
            console.log('Real-time APIs not available, using mock data');
            this.realTimeEnabled = false;
        }
    }

    hasWorkingApis() {
        if (!this.apiStatus) return false;
        
        return Object.values(this.apiStatus).some(api => 
            api.status === 'healthy' && api.remaining > 0
        );
    }

    async fetchRealTimeData() {
        try {
            const response = await fetch('/api/realtime/current-aqi');
            const data = await response.json();
            
            if (data.success) {
                this.lastUpdate = new Date();
                return data;
            }
        } catch (error) {
            console.error('Error fetching real-time data:', error);
        }
        return null;
    }

    async fetchRealTimeForecast() {
        try {
            const response = await fetch('/api/realtime/forecast-real-time');
            const data = await response.json();
            
            if (data.success) {
                return data;
            }
        } catch (error) {
            console.error('Error fetching real-time forecast:', error);
        }
        return null;
    }

    startRealTimeUpdates() {
        // Update every 10 minutes to respect API limits
        this.updateInterval = setInterval(async () => {
            await this.updateAllComponents();
        }, 10 * 60 * 1000); // 10 minutes
        
        // Initial update
        this.updateAllComponents();
    }

    async updateAllComponents() {
        console.log('Updating real-time data...');
        
        // Update pollution map
        if (window.pollutionMap && typeof window.pollutionMap.updateWithRealTimeData === 'function') {
            const realTimeData = await this.fetchRealTimeData();
            if (realTimeData) {
                window.pollutionMap.updateWithRealTimeData(realTimeData.data);
            }
        } else if (window.pollutionMap) {
            console.warn('pollutionMap.updateWithRealTimeData is not available yet');
        }
        
        // Update forecast chart
        if (window.forecastChart && typeof window.forecastChart.updateWithRealTimeData === 'function') {
            const forecastData = await this.fetchRealTimeForecast();
            if (forecastData) {
                window.forecastChart.updateWithRealTimeData(forecastData.data);
            }
        } else if (window.forecastChart) {
            console.warn('forecastChart.updateWithRealTimeData is not available yet');
        }
        
        // Update overview dashboard
        if (window.overviewDashboard && typeof window.overviewDashboard.updateWithRealTimeData === 'function') {
            const realTimeData = await this.fetchRealTimeData();
            if (realTimeData) {
                window.overviewDashboard.updateWithRealTimeData(realTimeData.data);
            }
        } else if (window.overviewDashboard) {
            console.warn('overviewDashboard.updateWithRealTimeData is not available yet');
        }
        
        // Show real-time indicator
        this.showRealTimeIndicator();
    }

    showRealTimeIndicator() {
        // Create or update real-time indicator
        let indicator = document.getElementById('realtime-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'realtime-indicator';
            indicator.className = 'realtime-indicator';
            document.body.appendChild(indicator);
        }
        
        const timeSinceUpdate = this.lastUpdate ? 
            Math.floor((Date.now() - this.lastUpdate.getTime()) / 1000) : 0;
        
        indicator.innerHTML = `
            <div class="indicator-content">
                <div class="indicator-dot ${this.realTimeEnabled ? 'active' : 'inactive'}"></div>
                <div class="indicator-text">
                    <span class="indicator-label">${this.realTimeEnabled ? 'LIVE DATA' : 'MOCK DATA'}</span>
                    <span class="indicator-time">Updated ${timeSinceUpdate}s ago</span>
                </div>
            </div>
        `;
    }

    getApiUsageStats() {
        return this.apiStatus;
    }

    isRealTimeEnabled() {
        return this.realTimeEnabled;
    }

    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Enhanced Pollution Map with Real-Time Data
if (window.PollutionMap) {
    const originalUpdateData = window.PollutionMap.prototype.updateData;
    
    window.PollutionMap.prototype.updateWithRealTimeData = function(realTimeData) {
        console.log('Updating pollution map with real-time data');
        
        // Process real-time data
        this.data = realTimeData.map(station => ({
            id: station.station_id,
            name: station.station_name,
            latitude: station.latitude,
            longitude: station.longitude,
            aqi: station.aqi,
            pm25: station.pm25,
            pm10: station.pm10,
            category: station.category,
            temperature: station.temperature,
            humidity: station.humidity,
            windSpeed: station.wind_speed,
            windDirection: station.wind_direction,
            pressure: station.pressure,
            timestamp: station.timestamp,
            isRealTime: station.is_real_time,
            confidence: station.confidence,
            dataSources: station.data_sources
        }));
        
        // Update the map
        this.draw();
        
        // Show real-time data indicator
        this.showRealTimeDataIndicator();
    };
    
    window.PollutionMap.prototype.showRealTimeDataIndicator = function() {
        // Add real-time data indicators to stations
        this.data.forEach(station => {
            if (station.isRealTime) {
                // Add visual indicator for real-time stations
                console.log(`Station ${station.name} has real-time data`);
            }
        });
    };
}

// Enhanced Forecast Chart with Real-Time Data
if (window.ForecastChart) {
    window.ForecastChart.prototype.updateWithRealTimeData = function(realTimeForecast) {
        console.log('Updating forecast chart with real-time data');
        
        // Process real-time forecast data
        const processedData = {
            labels: realTimeForecast.forecast_hours.map(f => {
                const date = new Date(f.timestamp);
                return `${date.getHours()}:00`;
            }),
            datasets: [
                {
                    label: 'Real-Time AQI Forecast',
                    data: realTimeForecast.forecast_hours.map(f => f.aqi),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    type: 'line'
                },
                {
                    label: 'PM2.5 Forecast',
                    data: realTimeForecast.forecast_hours.map(f => f.pm25),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false,
                    type: 'line'
                },
                {
                    label: 'PM10 Forecast',
                    data: realTimeForecast.forecast_hours.map(f => f.pm10),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: false,
                    type: 'line'
                }
            ],
            confidence: realTimeForecast.forecast_hours.map(f => f.confidence),
            period: '24h',
            isRealTime: true,
            generatedAt: realTimeForecast.generated_at,
            basedOnRealData: realTimeForecast.based_on_real_data
        };
        
        this.data = processedData;
        this.isLoading = false;
        
        // Update the chart
        this.draw();
        
        // Show real-time forecast indicator
        this.showRealTimeForecastIndicator();
    };
    
    window.ForecastChart.prototype.showRealTimeForecastIndicator = function() {
        // Add real-time forecast indicator
        const indicator = document.querySelector('.forecast-real-time-indicator');
        if (indicator) {
            indicator.style.display = 'block';
            indicator.innerHTML = `
                <div class="real-time-badge">
                    <i class="fas fa-satellite-dish"></i>
                    Real-Time Forecast
                </div>
            `;
        }
    };
}

// Initialize Real-Time Data Manager
document.addEventListener('DOMContentLoaded', () => {
    window.realTimeManager = new RealTimeDataManager();
});

// Add CSS for real-time indicators
const realTimeStyles = `
<style>
.realtime-indicator {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 12px;
    padding: 12px 16px;
    backdrop-filter: blur(20px);
    z-index: 1000;
    font-family: Inter, sans-serif;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.indicator-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.indicator-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

.indicator-dot.active {
    background: #10b981;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.indicator-dot.inactive {
    background: #6b7280;
}

.indicator-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.indicator-label {
    font-size: 12px;
    font-weight: 600;
    color: #ffffff;
}

.indicator-time {
    font-size: 10px;
    color: #94a3b8;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.forecast-real-time-indicator {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.5);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    color: #10b981;
    font-weight: 600;
    display: none;
}

.real-time-badge {
    display: flex;
    align-items: center;
    gap: 6px;
}

.real-time-badge i {
    font-size: 14px;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', realTimeStyles);


