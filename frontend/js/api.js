// API functions to communicate with the backend
class AirWatchAPI {
    static baseURL = 'http://localhost:5000/api';
    
    // Overview endpoints
    static async getCurrentAQI() {
        const response = await fetch(`${this.baseURL}/overview/current-aqi`);
        return await response.json();
    }
    
    static async getLiveMetrics() {
        const response = await fetch(`${this.baseURL}/overview/live-metrics`);
        return await response.json();
    }
    
    static async getStationData() {
        const response = await fetch(`${this.baseURL}/overview/station-data`);
        return await response.json();
    }
    
    static async getSourceBreakdown() {
        const response = await fetch(`${this.baseURL}/overview/source-breakdown`);
        return await response.json();
    }
    
    // Source Analysis endpoints
    static async getPollutionSources() {
        const response = await fetch(`${this.baseURL}/source-analysis/sources`);
        return await response.json();
    }
    
    static async getSourceDetections() {
        const response = await fetch(`${this.baseURL}/source-analysis/detections`);
        return await response.json();
    }
    
    static async getMonitoringData() {
        const response = await fetch(`${this.baseURL}/source-analysis/monitoring-data`);
        return await response.json();
    }
    
    // Forecasting endpoints
    static async getForecastMetrics() {
        const response = await fetch(`${this.baseURL}/forecasting/forecast-metrics`);
        return await response.json();
    }
    
    static async getWeatherImpact() {
        const response = await fetch(`${this.baseURL}/forecasting/weather-impact`);
        return await response.json();
    }
    
    static async getWeeklyForecast() {
        const response = await fetch(`${this.baseURL}/forecasting/weekly-forecast`);
        return await response.json();
    }
    
    // Citizen Portal endpoints
    static async getCitizenReports() {
        const response = await fetch(`${this.baseURL}/citizen-portal/reports`);
        return await response.json();
    }
    
    static async getCommunityAlerts() {
        const response = await fetch(`${this.baseURL}/citizen-portal/alerts`);
        return await response.json();
    }
    
    static async getCommunityInitiatives() {
        const response = await fetch(`${this.baseURL}/citizen-portal/initiatives`);
        return await response.json();
    }
    
    static async submitReport(reportData) {
        const response = await fetch(`${this.baseURL}/citizen-portal/submit-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        });
        return await response.json();
    }
    
    // Policy Dashboard endpoints
    static async getPolicyMetrics() {
        const response = await fetch(`${this.baseURL}/policy-dashboard/metrics`);
        return await response.json();
    }
    
    static async getPolicies() {
        const response = await fetch(`${this.baseURL}/policy-dashboard/policies`);
        return await response.json();
    }
    
    static async getRecommendations() {
        const response = await fetch(`${this.baseURL}/policy-dashboard/recommendations`);
        return await response.json();
    }
    
    // Comprehensive Source Analysis endpoints
    static async getComprehensiveAnalysis() {
        const response = await fetch(`${this.baseURL}/source-analysis/comprehensive-analysis`);
        return await response.json();
    }
    
    static async getAISourceAnalysis() {
        const response = await fetch(`${this.baseURL}/source-analysis/ai-source-analysis`);
        return await response.json();
    }
    
    // Enhanced API endpoints (v2)
    static async getAdvancedSourceAnalysis() {
        const response = await fetch(`${this.baseURL}/v2/advanced-source-analysis`);
        return await response.json();
    }
    
    static async getRealTimeData() {
        const response = await fetch(`${this.baseURL}/v2/real-time-data`);
        return await response.json();
    }
}