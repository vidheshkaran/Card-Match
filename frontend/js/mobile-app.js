/**
 * Mobile App Features and PWA Capabilities
 * Progressive Web App implementation for AirWatch AI
 */

class MobileApp {
    constructor() {
        this.isInstalled = false;
        this.deferredPrompt = null;
        this.swRegistration = null;
        this.notificationPermission = 'default';
        this.locationPermission = false;
        this.offlineData = null;
        
        this.init();
    }
    
    async init() {
        await this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupPushNotifications();
        this.setupGeolocation();
        this.setupOfflineCapabilities();
        this.setupTouchGestures();
        this.setupHapticFeedback();
    }
    
    async registerServiceWorker() {
        // Don't register service worker on localhost to prevent API interference
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Unregister any existing service workers
            if ('serviceWorker' in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                        console.log('Service worker unregistered for localhost');
                    }
                } catch (error) {
                    console.log('Error unregistering service worker:', error);
                }
            }
            return;
        }
        
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                this.swRegistration = registration;
                console.log('Service Worker registered successfully');
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
    
    setupInstallPrompt() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        // Listen for the appinstalled event
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstallSuccessMessage();
        });
    }
    
    showInstallButton() {
        const installButton = document.createElement('button');
        installButton.id = 'install-button';
        installButton.className = 'install-app-btn';
        installButton.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Install AirWatch AI</span>
        `;
        
        installButton.addEventListener('click', () => this.installApp());
        
        // Add to header
        const header = document.querySelector('.navbar');
        if (header && !document.getElementById('install-button')) {
            header.appendChild(installButton);
        }
    }
    
    async installApp() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            
            this.deferredPrompt = null;
            this.hideInstallButton();
        }
    }
    
    hideInstallButton() {
        const installButton = document.getElementById('install-button');
        if (installButton) {
            installButton.remove();
        }
    }
    
    showInstallSuccessMessage() {
        this.showToast('AirWatch AI installed successfully! You can now access it from your home screen.', 'success');
    }
    
    showUpdateNotification() {
        this.showToast('New version available! Refresh to update.', 'info', {
            action: 'Refresh',
            actionHandler: () => window.location.reload()
        });
    }
    
    async setupPushNotifications() {
        if ('Notification' in window) {
            this.notificationPermission = Notification.permission;
            
            if (this.notificationPermission === 'default') {
                await this.requestNotificationPermission();
            }
            
            if (this.notificationPermission === 'granted') {
                this.subscribeToPushNotifications();
            }
        }
    }
    
    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            
            if (permission === 'granted') {
                this.showToast('Notifications enabled! You\'ll receive air quality alerts.', 'success');
                this.subscribeToPushNotifications();
            } else {
                this.showToast('Notifications disabled. You can enable them in settings.', 'warning');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }
    
    async subscribeToPushNotifications() {
        if (this.swRegistration) {
            try {
                const subscription = await this.swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
                });
                
                // Send subscription to server
                await this.sendSubscriptionToServer(subscription);
            } catch (error) {
                console.error('Error subscribing to push notifications:', error);
            }
        }
    }
    
    async sendSubscriptionToServer(subscription) {
        try {
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription)
            });
        } catch (error) {
            console.error('Error sending subscription to server:', error);
        }
    }
    
    setupGeolocation() {
        if ('geolocation' in navigator) {
            this.requestLocationPermission();
        } else {
            console.warn('Geolocation not supported');
        }
    }
    
    async requestLocationPermission() {
        try {
            const position = await this.getCurrentPosition();
            this.locationPermission = true;
            this.updateLocationBasedFeatures(position.coords);
        } catch (error) {
            console.warn('Location permission denied or error:', error);
            this.showLocationPermissionPrompt();
        }
    }
    
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            });
        });
    }
    
    updateLocationBasedFeatures(coords) {
        // Update hyperlocal AQI based on user location
        this.updateHyperlocalAQI(coords.latitude, coords.longitude);
        
        // Update safe routes based on location
        this.updateSafeRoutes(coords.latitude, coords.longitude);
        
        // Update nearby facilities
        this.updateNearbyFacilities(coords.latitude, coords.longitude);
    }
    
    async updateHyperlocalAQI(lat, lon) {
        try {
            const response = await fetch(`/api/citizen-portal/hyperlocal-aqi?lat=${lat}&lon=${lon}`);
            const data = await response.json();
            
            // Update UI with hyperlocal data
            if (typeof this.updateHyperlocalUI === 'function') {
                this.updateHyperlocalUI(data);
            } else if (window.hyperlocalManager?.updateHyperlocalDisplay) {
                const payload = data?.hyperlocal_aqi || data;
                if (payload) {
                    window.hyperlocalManager.updateHyperlocalDisplay(payload);
                }
            } else {
                console.warn('updateHyperlocalUI is not available');
            }
        } catch (error) {
            console.error('Error fetching hyperlocal AQI:', error);
        }
    }
    
    async updateSafeRoutes(lat, lon) {
        try {
            const response = await fetch(`/api/citizen-portal/safe-routes?lat=${lat}&lon=${lon}`);
            const data = await response.json();
            
            // Update UI with safe routes
            if (typeof this.updateSafeRoutesUI === 'function') {
                this.updateSafeRoutesUI(data);
            } else if (window.hyperlocalManager?.updateRoutesDisplay) {
                window.hyperlocalManager.updateRoutesDisplay(data?.routes || []);
            } else {
                console.warn('updateSafeRoutesUI is not available');
            }
        } catch (error) {
            console.error('Error fetching safe routes:', error);
        }
    }
    
    async updateNearbyFacilities(lat, lon) {
        try {
            const response = await fetch(`/api/citizen-portal/nearby-facilities?lat=${lat}&lon=${lon}`);
            const data = await response.json();
            
            // Update UI with nearby facilities
            if (typeof this.updateNearbyFacilitiesUI === 'function') {
                this.updateNearbyFacilitiesUI(data);
            } else {
                const facilities = data?.facilities || data?.nearby_facilities || [];
                if (facilities.length > 0) {
                    console.warn('updateNearbyFacilitiesUI missing, logging facilities list instead', facilities);
                } else {
                    console.warn('updateNearbyFacilitiesUI missing and no facilities data available');
                }
            }
        } catch (error) {
            console.error('Error fetching nearby facilities:', error);
        }
    }

    updateHyperlocalUI(data) {
        if (!data) return;
        const payload = data.hyperlocal_aqi || data;
        if (!payload) return;

        if (window.hyperlocalManager && typeof window.hyperlocalManager.updateHyperlocalDisplay === 'function') {
            window.hyperlocalManager.updateHyperlocalDisplay(payload);
            return;
        }

        const aqiElement = document.getElementById('hyperlocalAQI');
        const categoryElement = document.getElementById('hyperlocalCategory');
        const confidenceElement = document.getElementById('hyperlocalConfidence');
        const pm25Element = document.getElementById('hyperlocalPM25');
        const pm10Element = document.getElementById('hyperlocalPM10');
        const no2Element = document.getElementById('hyperlocalNO2');

        if (aqiElement) aqiElement.textContent = Math.round(payload.aqi || payload.current_aqi || 0);
        if (categoryElement) categoryElement.textContent = payload.category || 'Unknown';
        if (confidenceElement && payload.confidence) {
            confidenceElement.textContent = `${Math.round(payload.confidence * (payload.confidence > 1 ? 1 : 100))}%`;
        }

        const pollutants = payload.pollutants || {};
        if (pm25Element && pollutants.pm25) pm25Element.textContent = typeof pollutants.pm25 === 'number' ? pollutants.pm25.toFixed(1) : pollutants.pm25;
        if (pm10Element && pollutants.pm10) pm10Element.textContent = typeof pollutants.pm10 === 'number' ? pollutants.pm10.toFixed(1) : pollutants.pm10;
        if (no2Element && pollutants.no2) no2Element.textContent = typeof pollutants.no2 === 'number' ? pollutants.no2.toFixed(1) : pollutants.no2;
    }

    updateSafeRoutesUI(data) {
        const routes = data?.routes || [];
        if (window.hyperlocalManager && typeof window.hyperlocalManager.updateRoutesDisplay === 'function') {
            window.hyperlocalManager.updateRoutesDisplay(routes);
            return;
        }

        const routesList = document.getElementById('routesList');
        if (!routesList) return;

        if (routes.length === 0) {
            routesList.innerHTML = '<div class="route-option">No safe routes available currently.</div>';
            return;
        }

        routesList.innerHTML = '';
        routes.slice(0, 3).forEach((route) => {
            const div = document.createElement('div');
            div.className = 'route-option';
            div.innerHTML = `
                <div class="route-info">
                    <div class="route-type ${route.route_type || 'road'}">
                        <i class="fas fa-route"></i>
                        <span>${(route.route_type || 'Route').replace(/_/g, ' ')}</span>
                    </div>
                    <div class="route-stats">
                        <span class="route-duration">${route.total_duration || '--'} min</span>
                        <span class="route-aqi">${route.avg_aqi || '--'} AQI</span>
                        <span class="route-distance">${route.total_distance || '--'} km</span>
                    </div>
                </div>
                <div class="route-score">${route.route_score ? Math.round(route.route_score) : '--'}</div>
            `;
            routesList.appendChild(div);
        });
    }

    updateNearbyFacilitiesUI(data) {
        const facilities = data?.facilities || data?.nearby_facilities || [];
        const listElement = document.getElementById('nearbyFacilitiesList');

        if (!listElement) {
            console.log('Nearby facilities data:', facilities);
            return;
        }

        if (facilities.length === 0) {
            listElement.innerHTML = '<li>No nearby facilities found.</li>';
            return;
        }

        listElement.innerHTML = '';
        facilities.slice(0, 5).forEach((facility) => {
            const li = document.createElement('li');
            li.className = 'facility-item';
            li.innerHTML = `
                <div class="facility-name">${facility.name || 'Facility'}</div>
                <div class="facility-details">
                    <span>${facility.type || 'General'}</span>
                    <span>${facility.distance ? `${facility.distance.toFixed(1)} km` : ''}</span>
                </div>
            `;
            listElement.appendChild(li);
        });
    }
    
    setupOfflineCapabilities() {
        // Cache critical data for offline use
        this.cacheCriticalData();
        
        // Setup offline indicator
        this.setupOfflineIndicator();
        
        // Handle online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }
    
    async cacheCriticalData() {
        try {
            // Cache current AQI data
            const aqiResponse = await fetch('/api/overview/current-aqi');
            const aqiData = await aqiResponse.json();
            
            // Cache health alerts
            const alertsResponse = await fetch('/api/citizen-portal/health-alerts');
            const alertsData = await alertsResponse.json();
            
            // Store in IndexedDB
            await this.storeInIndexedDB('airwatch_cache', {
                aqi: aqiData,
                alerts: alertsData,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('Error caching data:', error);
        }
    }
    
    async storeInIndexedDB(dbName, data) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['cache'], 'readwrite');
                const store = transaction.objectStore('cache');
                store.put(data, 'critical_data');
                resolve();
            };
            
            request.onupgradeneeded = () => {
                const db = request.result;
                db.createObjectStore('cache');
            };
        });
    }
    
    setupOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.className = 'offline-indicator';
        indicator.innerHTML = `
            <i class="fas fa-wifi"></i>
            <span>You're offline</span>
        `;
        
        document.body.appendChild(indicator);
    }
    
    handleOnline() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
        
        // Sync cached data
        this.syncCachedData();
    }
    
    handleOffline() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
        
        // Load cached data
        this.loadCachedData();
    }
    
    setupTouchGestures() {
        // Swipe gestures for navigation
        this.setupSwipeGestures();
        
        // Pull to refresh
        this.setupPullToRefresh();
        
        // Touch feedback
        this.setupTouchFeedback();
    }
    
    setupSwipeGestures() {
        let startX, startY, endX, endY;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            this.handleSwipe(startX, startY, endX, endY);
        });
    }
    
    handleSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const minSwipeDistance = 50;
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                this.handleSwipeRight();
            } else {
                this.handleSwipeLeft();
            }
        }
    }
    
    handleSwipeRight() {
        // Navigate to previous section
        this.navigateToPrevious();
    }
    
    handleSwipeLeft() {
        // Navigate to next section
        this.navigateToNext();
    }
    
    setupPullToRefresh() {
        let startY = 0;
        let pullDistance = 0;
        const pullThreshold = 100;
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && startY > 0) {
                pullDistance = e.touches[0].clientY - startY;
                
                if (pullDistance > 0) {
                    e.preventDefault();
                    this.updatePullToRefreshUI(pullDistance, pullThreshold);
                }
            }
        });
        
        document.addEventListener('touchend', () => {
            if (pullDistance > pullThreshold) {
                this.refreshData();
            }
            this.resetPullToRefreshUI();
            startY = 0;
            pullDistance = 0;
        });
    }
    
    setupHapticFeedback() {
        // Haptic feedback for supported devices
        if ('vibrate' in navigator) {
            this.hapticEnabled = true;
        }
    }
    
    vibrate(pattern) {
        if (this.hapticEnabled && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
    
    setupTouchFeedback() {
        // Add touch feedback to interactive elements
        const interactiveElements = document.querySelectorAll('button, .clickable, .nav-link');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
                this.vibrate([50]); // Short vibration
            });
            
            element.addEventListener('touchend', () => {
                element.classList.remove('touch-active');
            });
        });
    }
    
    showToast(message, type = 'info', options = {}) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
                ${options.action ? `<button class="toast-action">${options.action}</button>` : ''}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
        
        // Handle action button
        if (options.action && options.actionHandler) {
            const actionBtn = toast.querySelector('.toast-action');
            actionBtn.addEventListener('click', options.actionHandler);
        }
    }
    
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    // Utility methods
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
    
    // Navigation methods
    navigateToPrevious() {
        const currentSection = this.getCurrentSection();
        const sections = ['home', 'dashboard', 'forecast', 'hyperlocal', 'satellite', 'policy-dashboard', 'alerts', 'community'];
        const currentIndex = sections.indexOf(currentSection);
        
        if (currentIndex > 0) {
            this.navigateToSection(sections[currentIndex - 1]);
        }
    }
    
    navigateToNext() {
        const currentSection = this.getCurrentSection();
        const sections = ['home', 'dashboard', 'forecast', 'hyperlocal', 'satellite', 'policy-dashboard', 'alerts', 'community'];
        const currentIndex = sections.indexOf(currentSection);
        
        if (currentIndex < sections.length - 1) {
            this.navigateToSection(sections[currentIndex + 1]);
        }
    }
    
    getCurrentSection() {
        const activeLink = document.querySelector('.nav-link.active');
        return activeLink ? activeLink.getAttribute('href').substring(1) : 'home';
    }
    
    navigateToSection(section) {
        const link = document.querySelector(`.nav-link[href="#${section}"]`);
        if (link) {
            link.click();
        }
    }
    
    async refreshData() {
        this.showToast('Refreshing data...', 'info');
        
        try {
            // Refresh all critical data
            await this.cacheCriticalData();
            this.showToast('Data refreshed successfully!', 'success');
        } catch (error) {
            this.showToast('Failed to refresh data', 'error');
        }
    }
}

// Initialize mobile app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileApp = new MobileApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileApp;
}
