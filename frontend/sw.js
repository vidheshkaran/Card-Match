/**
 * Service Worker for AirWatch AI PWA
 * Provides offline capabilities, caching, and push notifications
 */

const CACHE_NAME = 'airwatch-ai-v1.0.0';
const STATIC_CACHE = 'airwatch-static-v1.0.0';
const DYNAMIC_CACHE = 'airwatch-dynamic-v1.0.0';

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/modern-ui.css',
    '/css/mobile-responsive.css',
    '/js/api.js',
    '/js/charts.js',
    '/js/mobile-app.js',
    '/js/theme-toggle.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /\/api\/overview\/current-aqi/,
    /\/api\/overview\/live-metrics/,
    /\/api\/citizen-portal\/health-alerts/,
    /\/api\/forecasting\/ai-forecast/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // COMPLETELY SKIP service worker for localhost API requests
    // This prevents any interference with API calls during development
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        if (url.pathname.startsWith('/api/')) {
            // For API requests on localhost, DO NOT intercept at all
            // Let the browser handle it directly - don't call event.respondWith()
            return;
        }
        // For static files on localhost, still use service worker
        if (request.method === 'GET' && !url.pathname.startsWith('/api/')) {
            event.respondWith(handleStaticRequest(request));
            return;
        }
        // For other localhost requests, pass through
        return;
    }
    
    // Handle API requests (for production only)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle static file requests
    if (request.method === 'GET') {
        event.respondWith(handleStaticRequest(request));
        return;
    }
    
    // For other requests, try network first
    event.respondWith(fetch(request));
});

// Handle API requests with caching strategy
async function handleApiRequest(request) {
    const url = new URL(request.url);
    
    // Check if this API endpoint should be cached
    const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
    
    if (!shouldCache) {
        // For non-cacheable APIs, try network first, don't cache errors
        try {
            const response = await fetch(request.clone());
            
            // Delete from cache if it's an error response
            if (response.status >= 400) {
                const cache = await caches.open(DYNAMIC_CACHE);
                await cache.delete(request);
            }
            
            // Return response even if it's an error (let the app handle it)
            return response;
        } catch (error) {
            console.error('Network request failed:', error);
            // If network fails completely, try cache
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
            // Return fallback response only as last resort
            return createFallbackResponse(request);
        }
    }
    
    // For cacheable APIs, try network first, then cache
    try {
        // Always try network first for real-time data
        const networkResponse = await fetch(request.clone());
        
        // Only cache successful responses (200-299), not errors (4xx, 5xx)
        if (networkResponse.ok && networkResponse.status >= 200 && networkResponse.status < 300) {
            // Clone response and add cache timestamp
            const responseToCache = networkResponse.clone();
            
            // Cache the response
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put(request, responseToCache);
            
            return networkResponse;
        } else if (networkResponse.status >= 400) {
            // Don't cache error responses, delete from cache if exists
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.delete(request);
            
            // Try to serve from cache as fallback if network fails
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                console.log('Serving from cache due to network error');
                return cachedResponse;
            }
            
            // If no cache and network error, return the error response
            return networkResponse;
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('Network error:', error);
        
        // Try to serve from cache as fallback
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('Serving from cache due to network failure');
            return cachedResponse;
        }
        
        // Return fallback response only if no cache available
        console.log('Returning fallback response');
        return createFallbackResponse(request);
    }
}

// Handle static file requests
async function handleStaticRequest(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the response for future use
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('Error fetching static file:', error);
        
        // Return a fallback response
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
        
        return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Create fallback response for failed API requests
function createFallbackResponse(request) {
    const url = new URL(request.url);
    
    // Provide different fallback responses based on API endpoint
    if (url.pathname.includes('/current-aqi')) {
        return new Response(JSON.stringify({
            aqi: 250,
            category: 'Poor',
            primary_pollutant: 'PM2.5',
            pm25: 100,
            pm10: 150,
            timestamp: new Date().toISOString(),
            data_quality: 'Offline Fallback'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    if (url.pathname.includes('/live-metrics')) {
        return new Response(JSON.stringify([
            {"name": "PM2.5", "value": "112.5", "unit": "µg/m³", "status": "Unhealthy"},
            {"name": "PM10", "value": "198.3", "unit": "µg/m³", "status": "Unhealthy"},
            {"name": "Temperature", "value": "28.7", "unit": "°C", "status": "Normal"},
            {"name": "Humidity", "value": "42", "unit": "%", "status": "Normal"},
            {"name": "Wind Speed", "value": "8.3", "unit": "km/h", "status": "Moderate"}
        ]), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    if (url.pathname.includes('/station-data')) {
        return new Response(JSON.stringify([
            {
                "name": "Central Delhi",
                "aqi": "287",
                "primary_source": "Vehicular",
                "trend": "rising"
            },
            {
                "name": "East Delhi",
                "aqi": "265",
                "primary_source": "Industrial",
                "trend": "stable"
            }
        ]), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    if (url.pathname.includes('/health-alerts')) {
        return new Response(JSON.stringify({
            current_aqi: 250,
            aqi_category: 'Poor',
            general_alerts: [{
                category: 'General Population',
                health_advisory: 'Limit outdoor activities',
                recommended_actions: ['Use N95 masks', 'Keep windows closed'],
                affected_groups: ['All'],
                severity: 'High',
                timestamp: new Date().toISOString()
            }],
            personalized_alerts: [],
            emergency_contacts: {
                health_helpline: '104',
                emergency: '112'
            },
            last_updated: new Date().toISOString()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Default fallback response
    return new Response(JSON.stringify({
        error: 'Offline - Service temporarily unavailable',
        message: 'Please check your internet connection and try again',
        timestamp: new Date().toISOString()
    }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Handle push notifications
self.addEventListener('push', (event) => {
    console.log('Push event received:', event);
    
    let notificationData = {
        title: 'AirWatch AI',
        body: 'Air quality alert',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: {
            url: '/'
        }
    };
    
    if (event.data) {
        try {
            const pushData = event.data.json();
            notificationData = { ...notificationData, ...pushData };
        } catch (error) {
            console.error('Error parsing push data:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            data: notificationData.data,
            actions: [
                {
                    action: 'view',
                    title: 'View Details'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ],
            requireInteraction: true,
            vibrate: [200, 100, 200]
        })
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        client.navigate(urlToOpen);
                        return;
                    }
                }
                
                // Open new window if app is not open
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle background sync
self.addEventListener('sync', (event) => {
    console.log('Background sync event:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Sync critical data in background
        const response = await fetch('/api/overview/current-aqi');
        if (response.ok) {
            const data = await response.json();
            
            // Update cache with fresh data
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put('/api/overview/current-aqi', response.clone());
            
            console.log('Background sync completed successfully');
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Handle periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Periodic sync event:', event.tag);
    
    if (event.tag === 'air-quality-sync') {
        event.waitUntil(syncAirQualityData());
    }
});

async function syncAirQualityData() {
    try {
        const endpoints = [
            '/api/overview/current-aqi',
            '/api/overview/live-metrics',
            '/api/forecasting/ai-forecast'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    const cache = await caches.open(DYNAMIC_CACHE);
                    await cache.put(endpoint, response.clone());
                }
            } catch (error) {
                console.error(`Error syncing ${endpoint}:`, error);
            }
        }
        
        console.log('Periodic air quality sync completed');
    } catch (error) {
        console.error('Periodic sync failed:', error);
    }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(cacheUrls(event.data.urls));
    }
});

async function cacheUrls(urls) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.addAll(urls);
        console.log('URLs cached successfully:', urls);
    } catch (error) {
        console.error('Error caching URLs:', error);
    }
}
