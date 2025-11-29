/**
 * Map API Configuration for AirWatch AI
 * Replace the placeholder keys with your actual API keys for better satellite imagery
 */

const MapConfig = {
    // Google Maps API Key (for satellite imagery)
    // Get your key from: https://developers.google.com/maps/documentation/javascript/get-api-key
    googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
    
    // Mapbox API Key (for satellite imagery)
    // Get your key from: https://account.mapbox.com/access-tokens/
    mapboxApiKey: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
    
    // OpenStreetMap (no API key required)
    useOpenStreetMap: true,
    
    // Default settings
    defaultZoom: 10,
    defaultCenter: {
        lat: 28.6139,
        lon: 77.2090
    },
    
    // API endpoints
    endpoints: {
        googleMaps: (lat, lon, zoom, size) => 
            `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${size}&maptype=satellite&key=${MapConfig.googleMapsApiKey}`,
        
        mapbox: (lat, lon, zoom, size) => 
            `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lon},${lat},${zoom},0/${size}?access_token=${MapConfig.mapboxApiKey}`,
        
        openStreetMap: (x, y, z) => 
            `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapConfig;
}
