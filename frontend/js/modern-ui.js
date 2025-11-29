// Modern UI JavaScript for AirWatch AI

class ModernUI {
    constructor() {
        this.isDarkMode = true; // Default to dark mode
        this.notifications = [];
        this.currentSection = 'home';
        this.apiBase =
            window.location.origin.includes('localhost') ||
            window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000'
                : '';
        this.previousAQI = null; // Store previous AQI for trend calculation
        this.init();
    }

    init() {
        // Show fallback data immediately for instant display
        this.showFallbackData();
        
        this.setupNavigation();
        this.setupScrollEffects();
        this.setupThemeToggle();
        this.setupNotifications();
        this.setupAnimations();
        
        // Load real data in background (non-blocking)
        setTimeout(() => {
            this.loadRealTimeData();
        }, 100);
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        // Handle navigation links - navigate to pages or scroll to sections
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // If it's a page link (contains .html), navigate to that page
                if (href && href.includes('.html')) {
                    // Let the browser handle the navigation
                    return;
                }
                
                // If it's a hash link, scroll to section
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    this.scrollToSection(targetId);
                    this.updateActiveNavLink(link);
                }
            });
        });

        // Mobile navigation toggle
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    setupScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    this.currentSection = entry.target.id;
                    this.updateActiveNavLink();
                }
            });
        }, observerOptions);

        // Observe all sections for scroll animations
        document.querySelectorAll('section').forEach(section => {
            section.classList.add('fade-in');
            observer.observe(section);
        });

        // Observe cards for staggered animations
        document.querySelectorAll('.stat-card, .feature-card, .insight-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            observer.observe(card);
        });
    }

    setupThemeToggle() {
        // Let theme-toggle.js handle theme management
        // Just ensure the button exists and is clickable
        const themeToggle = document.getElementById('themeToggle');
        
        if (themeToggle && !window.themeManager) {
            // Fallback if theme-toggle.js hasn't loaded yet
            themeToggle.addEventListener('click', () => {
                if (window.themeManager) {
                    window.themeManager.toggleTheme();
                } else {
                    // Simple fallback toggle
                    const isDark = document.body.classList.contains('dark-theme');
                    if (isDark) {
                        document.body.classList.remove('dark-theme');
                        document.body.classList.add('light-theme');
                        localStorage.setItem('airwatch-theme', 'light');
                    } else {
                        document.body.classList.remove('light-theme');
                        document.body.classList.add('dark-theme');
                        localStorage.setItem('airwatch-theme', 'dark');
                    }
                }
            });
        }
    }

    setupNotifications() {
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationBadge = document.querySelector('.notification-badge');
        
        notificationBtn.addEventListener('click', () => {
            this.showNotifications();
        });

        // Simulate real-time notifications
        this.startNotificationSimulation();
    }

    startNotificationSimulation() {
        const notifications = [
            {
                id: 1,
                title: 'High AQI Alert',
                message: 'AQI levels have reached 287 in Central Delhi',
                type: 'critical',
                timestamp: new Date()
            },
            {
                id: 2,
                title: 'Stubble Burning Detected',
                message: 'Satellite imagery shows active fires in Haryana',
                type: 'warning',
                timestamp: new Date()
            },
            {
                id: 3,
                title: 'Weather Update',
                message: 'Wind speed decreased to 8 km/h, pollution may persist',
                type: 'info',
                timestamp: new Date()
            }
        ];

        this.notifications = notifications;
        this.updateNotificationBadge();
    }

    showNotifications() {
        // Create notification panel
        const panel = document.createElement('div');
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-header">
                <h3>Notifications</h3>
                <button class="close-notifications">&times;</button>
            </div>
            <div class="notification-list">
                ${this.notifications.map(notification => `
                    <div class="notification-item ${notification.type}">
                        <div class="notification-icon">
                            <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                        </div>
                        <div class="notification-content">
                            <h4>${notification.title}</h4>
                            <p>${notification.message}</p>
                            <span class="notification-time">${this.formatTime(notification.timestamp)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(panel);

        // Close panel functionality
        const closeBtn = panel.querySelector('.close-notifications');
        closeBtn.addEventListener('click', () => {
            panel.remove();
        });

        // Close on outside click
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                panel.remove();
            }
        });
    }

    getNotificationIcon(type) {
        const icons = {
            critical: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle',
            success: 'check-circle'
        };
        return icons[type] || 'bell';
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return timestamp.toLocaleDateString();
    }

    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        const count = this.notifications.length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }

    setupAnimations() {
        // Parallax effect for hero section
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroBackground = document.querySelector('.hero-background');
            if (heroBackground) {
                heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });

        // Hover effects for cards
        document.querySelectorAll('.stat-card, .feature-card, .insight-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Button hover effects
        document.querySelectorAll('.btn-primary, .btn-secondary, .btn-action').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-3px)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
            });
        });
    }

    loadRealTimeData() {
        // Show fallback data immediately for instant display
        this.showFallbackData();
        
        // Load real data in background (non-blocking)
        setTimeout(() => {
            this.updateAQI();
            this.updateAlerts();
            this.updateStats();
            this.updateAIAnalysis();
        }, 100);
        
        // Set up real-time updates (less frequent to reduce load)
        setInterval(() => {
            this.updateAQI();
            this.updateAlerts();
            this.updateStats();
            this.updateAIAnalysis();
        }, 10000); // Changed from 5000 to 10000 for better performance
    }
    
    showFallbackData() {
        // Show immediate fallback data without waiting for API
        const aqiElement = document.getElementById('currentAQI');
        if (aqiElement && (!aqiElement.textContent || aqiElement.textContent === '0')) {
            aqiElement.textContent = '287';
            this.previousAQI = 287; // Initialize previous AQI
        }
        
        const alertsElement = document.getElementById('activeAlerts');
        if (alertsElement && (!alertsElement.textContent || alertsElement.textContent === '0')) {
            alertsElement.textContent = '12';
        }
        
        const stationsElement = document.getElementById('monitoringStations');
        if (stationsElement && (!stationsElement.textContent || stationsElement.textContent === '0')) {
            stationsElement.textContent = '45';
        }
        
        // Show fallback AI analysis
        const concernElement = document.getElementById('aiConcern');
        if (concernElement && (!concernElement.textContent || concernElement.textContent === 'Loading...' || concernElement.textContent.includes('[object'))) {
            concernElement.textContent = 'Stubble Burning';
        }
        
        const confidenceElement = document.getElementById('aiConfidenceValue');
        if (confidenceElement && !confidenceElement.textContent) {
            confidenceElement.textContent = '87%';
        }
        
        const peakTimeElement = document.getElementById('aiPeakTime');
        if (peakTimeElement && !peakTimeElement.textContent) {
            peakTimeElement.textContent = '6-9 AM';
        }
        
        const recommendationElement = document.getElementById('aiRecommendation');
        if (recommendationElement && !recommendationElement.textContent) {
            recommendationElement.textContent = 'Limit outdoor activities';
        }
    }

    async updateAQI() {
        try {
            // Use AbortController with timeout for faster failure
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
            
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/overview/current-aqi${cacheBuster}`, {
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            const aqiElement = document.getElementById('currentAQI');
            if (aqiElement) {
                const currentValue = parseInt(aqiElement.textContent) || 287;
                const newValue = data.aqi || data.current_aqi || 287;
                this.animateValue(aqiElement, currentValue, newValue, 500);
                
                // Store previous value for trend calculation
                if (!this.previousAQI) {
                    this.previousAQI = currentValue;
                }
                
                // Update trend indicator
                this.updateTrendIndicator(newValue, this.previousAQI);
                this.previousAQI = newValue;
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.log('Using fallback data for AQI:', error.message);
            }
            // Keep existing value, don't update
        }
    }
    
    updateTrendIndicator(currentAQI, previousAQI) {
        // Find the trend element - it's a sibling of the stat-content div
        const aqiElement = document.getElementById('currentAQI');
        if (!aqiElement) return;
        
        const statContent = aqiElement.closest('.stat-content');
        if (!statContent) return;
        
        const trendElement = statContent.querySelector('.stat-trend');
        if (!trendElement) return;
        
        // If no previous value, show stable
        if (previousAQI === null || previousAQI === undefined) {
            trendElement.classList.remove('trend-increasing', 'trend-decreasing', 'trend-stable');
            trendElement.classList.add('trend-stable');
            trendElement.innerHTML = '<i class="fas fa-minus"></i> Stable';
            return;
        }
        
        const difference = currentAQI - previousAQI;
        const absDifference = Math.abs(difference);
        
        // Remove all trend classes
        trendElement.classList.remove('trend-increasing', 'trend-decreasing', 'trend-stable');
        
        if (absDifference < 5) {
            // Stable (change less than 5)
            trendElement.classList.add('trend-stable');
            trendElement.innerHTML = '<i class="fas fa-minus"></i> Stable';
        } else if (difference > 0) {
            // Increasing
            trendElement.classList.add('trend-increasing');
            trendElement.innerHTML = `<i class="fas fa-arrow-up"></i> +${Math.round(difference)}`;
        } else {
            // Decreasing
            trendElement.classList.add('trend-decreasing');
            trendElement.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.round(difference)}`;
        }
    }

    async updateAlerts() {
        try {
            // Use AbortController with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const cacheBuster = `?t=${Date.now()}`;
            // Use real-time-alerts endpoint for better data
            const response = await fetch(`${this.apiBase}/api/overview/real-time-alerts${cacheBuster}`, {
                signal: controller.signal,
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            const alertsElement = document.getElementById('activeAlerts');
            if (alertsElement) {
                const currentValue = parseInt(alertsElement.textContent) || 12;
                let newValue = 12;
                let highestSeverity = 'none';
                
                if (data.alert_count !== undefined) {
                    newValue = data.alert_count;
                    highestSeverity = data.highest_severity || 'none';
                } else if (Array.isArray(data.alerts)) {
                    newValue = data.alerts.length;
                    if (data.alerts.length > 0) {
                        highestSeverity = data.alerts[0].severity || 'medium';
                    }
                } else if (Array.isArray(data)) {
                    newValue = data.length;
                }
                
                this.animateValue(alertsElement, currentValue, newValue, 500);
                
                // Update alert status indicator
                this.updateAlertStatus(newValue, highestSeverity);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.log('Using fallback data for alerts:', error.message);
            }
            // Keep existing value
        }
    }
    
    updateAlertStatus(alertCount, severity) {
        // Find the alert status element - it's a sibling of the stat-content div
        const alertsElement = document.getElementById('activeAlerts');
        if (!alertsElement) return;
        
        const statContent = alertsElement.closest('.stat-content');
        if (!statContent) return;
        
        const alertStatusElement = statContent.querySelector('.stat-trend');
        if (!alertStatusElement) return;
        
        // Remove all status classes
        alertStatusElement.classList.remove('trend-critical', 'trend-warning', 'trend-stable', 'trend-increasing');
        
        if (alertCount === 0) {
            alertStatusElement.classList.add('trend-stable');
            alertStatusElement.innerHTML = '<i class="fas fa-check-circle"></i> All Clear';
        } else if (severity === 'critical' || alertCount > 10) {
            alertStatusElement.classList.add('trend-critical');
            alertStatusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Critical';
        } else if (severity === 'high' || alertCount > 5) {
            alertStatusElement.classList.add('trend-warning');
            alertStatusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> High';
        } else {
            alertStatusElement.classList.add('trend-increasing');
            alertStatusElement.innerHTML = '<i class="fas fa-info-circle"></i> Active';
        }
    }

    async updateStats() {
        try {
            // Use AbortController with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/overview/station-data${cacheBuster}`, {
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            const stationsElement = document.getElementById('monitoringStations');
            if (stationsElement) {
                const currentValue = parseInt(stationsElement.textContent) || 45;
                const newValue = Array.isArray(data) ? data.length : 45;
                this.animateValue(stationsElement, currentValue, newValue, 500);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.log('Using fallback data for stations');
            }
            // Keep existing value
        }
    }

    async updateAIAnalysis() {
        try {
            // Use AbortController with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/forecasting/advanced-forecast${cacheBuster}`, {
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const insights = data.ai_insights || {};
            const concernElement = document.getElementById('aiConcern');
            const confidenceElement = document.getElementById('aiConfidenceValue');
            const peakTimeElement = document.getElementById('aiPeakTime');
            const recommendationElement = document.getElementById('aiRecommendation');

            // Extract dominant source - handle both string and object formats
            let dominantSource = 'Monitoring';
            
            if (insights.dominant_source) {
                dominantSource = typeof insights.dominant_source === 'string' 
                    ? insights.dominant_source 
                    : insights.dominant_source.name || insights.dominant_source.type || 'Monitoring';
            } else if (insights.primaryConcern) {
                dominantSource = typeof insights.primaryConcern === 'string' 
                    ? insights.primaryConcern 
                    : insights.primaryConcern.name || insights.primaryConcern.type || 'Monitoring';
            } else if (insights.identified_sources && Array.isArray(insights.identified_sources) && insights.identified_sources.length > 0) {
                const firstSource = insights.identified_sources[0];
                if (typeof firstSource === 'string') {
                    dominantSource = firstSource;
                } else if (typeof firstSource === 'object') {
                    dominantSource = firstSource.name || firstSource.type || firstSource.source_type || 'Monitoring';
                }
            }
            
            // Ensure it's a string, not an object
            if (typeof dominantSource !== 'string') {
                dominantSource = String(dominantSource);
                if (dominantSource === '[object Object]') {
                    dominantSource = 'Monitoring';
                }
            }

            const modelConfidence =
                insights.model_confidence ||
                data.confidence_metrics?.model_confidence ||
                90;

            // Determine peak time from 24-hour forecast
            let peakTime = '--';
            const predictions = data.forecasts?.['24_hour']?.predictions;
            if (Array.isArray(predictions) && predictions.length > 0) {
                const peakPrediction = predictions.reduce((max, curr) =>
                    (curr.aqi || 0) > (max?.aqi || 0) ? curr : max, predictions[0]);
                if (peakPrediction?.timestamp) {
                    peakTime = new Date(peakPrediction.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                    });
                }
            }

            const recommendation =
                data.policy_recommendations?.[0]?.description ||
                insights.recommendation ||
                'Monitor air quality conditions';

            if (concernElement) {
                // Ensure we set a string value, not an object
                const concernText = typeof dominantSource === 'string' ? dominantSource : 
                    (dominantSource?.name || dominantSource?.type || 'Monitoring');
                concernElement.textContent = concernText;
                console.log('Set Primary Concern to:', concernText);
            }
            if (confidenceElement) {
                confidenceElement.textContent = `${Math.round(modelConfidence)}%`;
            }
            if (peakTimeElement) {
                peakTimeElement.textContent = peakTime;
            }
            if (recommendationElement) {
                recommendationElement.textContent = recommendation;
            }
        } catch (error) {
            console.error('Error loading AI analysis:', error);
            const concernElement = document.getElementById('aiConcern');
            const confidenceElement = document.getElementById('aiConfidenceValue');
            const peakTimeElement = document.getElementById('aiPeakTime');
            const recommendationElement = document.getElementById('aiRecommendation');

            if (concernElement) concernElement.textContent = 'Stubble Burning';
            if (confidenceElement) confidenceElement.textContent = '87%';
            if (peakTimeElement) peakTimeElement.textContent = '6-9 AM';
            if (recommendationElement) recommendationElement.textContent = 'Limit outdoor activities';
        }
    }

    animateValue(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 16);
    }

    scrollToSection(sectionId) {
        try {
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Show back button when not on home
                const backButton = document.getElementById('backButton');
                if (backButton) {
                    if (sectionId === 'home' || sectionId === '') {
                        backButton.style.display = 'none';
                    } else {
                        backButton.style.display = 'flex';
                    }
                }
            } else {
                console.warn(`Section ${sectionId} not found`);
            }
        } catch (error) {
            console.error('Error scrolling to section:', error);
        }
    }

    navigateToPage(url) {
        window.location.href = url;
    }

    updateActiveNavLink(clickedLink = null) {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        if (clickedLink) {
            clickedLink.classList.add('active');
        } else {
            // Update based on current section
            const activeLink = document.querySelector(`.nav-link[href="#${this.currentSection}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }
}

// Global functions for HTML onclick handlers
window.scrollToSection = function(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
};

// Global navigation function
window.navigateToPage = function(page) {
    const pageMap = {
        'overview': 'index.html',
        'source-analysis': 'source_analysis.html',
        'forecasting': 'forecasting.html',
        'community': 'citizen_portal.html',
        'policy-dashboard': 'policy_dashboard.html'
    };
    
    if (pageMap[page]) {
        window.location.href = pageMap[page];
    } else {
        console.warn(`Unknown page: ${page}`);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ModernUI();
});

// Add notification panel styles
const notificationStyles = `
<style>
.notification-panel {
    position: fixed;
    top: 100px;
    right: 20px;
    width: 350px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 20px;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
}

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

.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.notification-header h3 {
    color: #ffffff;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
}

.close-notifications {
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

.close-notifications:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}

.notification-list {
    max-height: 400px;
    overflow-y: auto;
}

.notification-item {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    transition: background-color 0.3s ease;
}

.notification-item:last-child {
    border-bottom: none;
}

.notification-item:hover {
    background: rgba(59, 130, 246, 0.05);
}

.notification-item.critical {
    border-left: 4px solid #ef4444;
}

.notification-item.warning {
    border-left: 4px solid #f59e0b;
}

.notification-item.info {
    border-left: 4px solid #3b82f6;
}

.notification-item.success {
    border-left: 4px solid #10b981;
}

.notification-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.notification-item.critical .notification-icon {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}

.notification-item.warning .notification-icon {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
}

.notification-item.info .notification-icon {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
}

.notification-item.success .notification-icon {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.notification-content {
    flex: 1;
}

.notification-content h4 {
    color: #ffffff;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
}

.notification-content p {
    color: #94a3b8;
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0 0 0.5rem 0;
}

.notification-time {
    color: #64748b;
    font-size: 0.75rem;
}

/* Mobile navigation styles */
@media (max-width: 768px) {
    .nav-menu {
        position: fixed;
        top: 80px;
        left: 0;
        right: 0;
        background: rgba(15, 23, 42, 0.98);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(59, 130, 246, 0.2);
        flex-direction: column;
        padding: 2rem;
        transform: translateY(-100%);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
    
    .nav-menu.active {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
    }
    
    .nav-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .nav-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    .nav-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
    
    .notification-panel {
        right: 10px;
        left: 10px;
        width: auto;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', notificationStyles);
