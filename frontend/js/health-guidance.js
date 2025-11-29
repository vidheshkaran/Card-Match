// Health Guidance JavaScript - Mask Guidance and Safe Routes
class HealthGuidanceManager {
    constructor() {
        this.apiBase = window.location.origin.includes('localhost') || 
                      window.location.hostname === '127.0.0.1'
                      ? 'http://localhost:5000' : '';
        this.init();
    }
    
    init() {
        console.log('Health Guidance Manager initialized');
    }
    
    async getMaskGuidance(aqi = null, profile = 'general') {
        try {
            // Get current AQI if not provided
            if (!aqi) {
                try {
                    const aqiResponse = await fetch(`${this.apiBase}/api/overview/current-aqi`);
                    const aqiData = await aqiResponse.json();
                    aqi = aqiData.aqi || 287;
                } catch (e) {
                    aqi = 287; // Default fallback
                }
            }
            
            const cacheBuster = `?t=${Date.now()}`;
            const url = `${this.apiBase}/api/health-guidance/mask-guidance${cacheBuster}&aqi=${aqi}&profile=${profile}`;
            console.log('Fetching mask guidance from:', url);
            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching mask guidance:', error);
            // Return fallback data
            return this.getFallbackMaskGuidance(aqi || 287);
        }
    }
    
    getFallbackMaskGuidance(aqi) {
        let maskType = "N95 or KN95 mask";
        let recommendation = "Air quality is unhealthy. N95/KN95 mask strongly recommended.";
        
        if (aqi <= 50) {
            maskType = "No mask required";
            recommendation = "Air quality is good. No mask needed.";
        } else if (aqi <= 100) {
            maskType = "Cloth mask (optional)";
            recommendation = "Air quality is satisfactory. Cloth mask optional.";
        } else if (aqi <= 150) {
            maskType = "Surgical mask";
            recommendation = "Air quality is moderate. Surgical mask recommended.";
        } else if (aqi <= 200) {
            maskType = "N95 or KN95 mask";
            recommendation = "Air quality is unhealthy. N95/KN95 mask strongly recommended.";
        } else if (aqi <= 300) {
            maskType = "N95 or N99 mask";
            recommendation = "Air quality is very poor. N95/N99 mask essential.";
        } else {
            maskType = "N99 or P100 respirator";
            recommendation = "Air quality is hazardous. N99/P100 respirator required.";
        }
        
        return {
            status: 'success',
            current_aqi: aqi,
            recommendation: {
                mask_type: maskType,
                message: recommendation
            },
            usage_tips: [
                'Ensure mask covers nose and mouth completely',
                'Check for proper fit - no gaps around edges',
                'Replace mask if it becomes wet or damaged'
            ],
            purchase_options: [
                { store: 'Online - Amazon', url: 'https://amazon.in/masks' },
                { store: 'Local Pharmacy', url: null }
            ]
        };
    }
    
    async getSafeRoutes(origin = 'Current Location', destination = 'Connaught Place, Delhi', mode = 'all') {
        try {
            const cacheBuster = `?t=${Date.now()}`;
            const url = `${this.apiBase}/api/health-guidance/safe-routes${cacheBuster}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}`;
            console.log('Fetching safe routes from:', url);
            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching safe routes:', error);
            return this.getFallbackSafeRoutes(origin, destination);
        }
    }
    
    getFallbackSafeRoutes(origin, destination) {
        return {
            status: 'success',
            origin: origin,
            destination: destination,
            routes: [
                {
                    id: 'route_1',
                    mode: 'metro',
                    distance_km: 12.5,
                    duration_minutes: 35,
                    estimated_aqi: 120,
                    safety_score: 76,
                    quality: 'Good',
                    quality_color: '#3b82f6',
                    recommendations: ['Use metro for lowest AQI exposure', 'Wear N95 mask']
                },
                {
                    id: 'route_2',
                    mode: 'driving',
                    distance_km: 15.2,
                    duration_minutes: 45,
                    estimated_aqi: 180,
                    safety_score: 64,
                    quality: 'Moderate',
                    quality_color: '#f59e0b',
                    recommendations: ['Keep windows closed', 'Use car air purifier if available']
                }
            ]
        };
    }
    
    showMaskGuidanceModal(data) {
        // Remove existing modal if any
        const existingModal = document.getElementById('maskGuidanceModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'maskGuidanceModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;
        
        const rec = data.recommendation || {};
        const maskDetails = data.mask_details || {};
        const tips = data.usage_tips || [];
        const purchase = data.purchase_options || [];
        
        modal.innerHTML = `
            <div style="background: var(--bg-secondary, #1a1f3a); border-radius: 16px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid var(--border-color, #2d3748); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                <div style="padding: 2rem; border-bottom: 1px solid var(--border-color, #2d3748); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: var(--text-primary, #ffffff); font-size: 1.8rem; display: flex; align-items: center; gap: 1rem;">
                        <i class="fas fa-mask" style="color: #3b82f6;"></i>
                        Mask Guidance
                    </h2>
                    <button onclick="closeMaskGuidanceModal()" style="background: transparent; border: none; color: var(--text-secondary, #94a3b8); font-size: 1.5rem; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.3s;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="padding: 2rem;">
                    <div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-primary, #0a0e27); border-radius: 12px; border-left: 4px solid #3b82f6;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <div style="font-size: 2.5rem; font-weight: 700; color: #3b82f6;">${data.current_aqi || 287}</div>
                            <div>
                                <div style="font-size: 1.2rem; font-weight: 600; color: var(--text-primary, #ffffff);">Current AQI</div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary, #94a3b8);">${this.getAQICategory(data.current_aqi || 287)}</div>
                            </div>
                        </div>
                        <div style="font-size: 1.1rem; color: var(--text-primary, #ffffff); font-weight: 600; margin-bottom: 0.5rem;">
                            Recommended: ${rec.mask_type || 'N95 mask'}
                        </div>
                        <div style="color: var(--text-secondary, #94a3b8);">
                            ${rec.message || 'Wear appropriate mask based on AQI level'}
                        </div>
                    </div>
                    
                    ${maskDetails.name ? `
                    <div style="margin-bottom: 2rem;">
                        <h3 style="color: var(--text-primary, #ffffff); margin-bottom: 1rem;">Mask Details</h3>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                            <div style="padding: 1rem; background: var(--bg-primary, #0a0e27); border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: var(--text-secondary, #94a3b8); margin-bottom: 0.5rem;">Filtration</div>
                                <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary, #ffffff);">${maskDetails.filtration || '95%+'}</div>
                            </div>
                            <div style="padding: 1rem; background: var(--bg-primary, #0a0e27); border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: var(--text-secondary, #94a3b8); margin-bottom: 0.5rem;">Price Range</div>
                                <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary, #ffffff);">${maskDetails.price_range || '₹200-500'}</div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 2rem;">
                        <h3 style="color: var(--text-primary, #ffffff); margin-bottom: 1rem;">Usage Tips</h3>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            ${tips.map(tip => `
                                <li style="padding: 0.75rem 0; padding-left: 2rem; position: relative; color: var(--text-secondary, #94a3b8);">
                                    <i class="fas fa-check-circle" style="position: absolute; left: 0; color: #10b981; top: 0.75rem;"></i>
                                    ${tip}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    ${purchase.length > 0 ? `
                    <div>
                        <h3 style="color: var(--text-primary, #ffffff); margin-bottom: 1rem;">Where to Buy</h3>
                        <div style="display: grid; gap: 1rem;">
                            ${purchase.map(option => `
                                <div style="padding: 1rem; background: var(--bg-primary, #0a0e27); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 600; color: var(--text-primary, #ffffff);">${option.store}</div>
                                        ${option.price_range ? `<div style="font-size: 0.85rem; color: var(--text-secondary, #94a3b8);">${option.price_range}</div>` : ''}
                                    </div>
                                    ${option.url ? `
                                        <a href="${option.url}" target="_blank" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
                                            <i class="fas fa-external-link-alt"></i> Visit
                                        </a>
                                    ` : '<span style="color: var(--text-secondary, #94a3b8);">Local Store</span>'}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeMaskGuidanceModal();
            }
        });
    }
    
    showSafeRoutesModal(data) {
        // Remove existing modal if any
        const existingModal = document.getElementById('safeRoutesModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'safeRoutesModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;
        
        const routes = data.routes || [];
        
        modal.innerHTML = `
            <div style="background: var(--bg-secondary, #1a1f3a); border-radius: 16px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid var(--border-color, #2d3748); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                <div style="padding: 2rem; border-bottom: 1px solid var(--border-color, #2d3748); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: var(--text-primary, #ffffff); font-size: 1.8rem; display: flex; align-items: center; gap: 1rem;">
                        <i class="fas fa-route" style="color: #10b981;"></i>
                        Safe Routes
                    </h2>
                    <button onclick="closeSafeRoutesModal()" style="background: transparent; border: none; color: var(--text-secondary, #94a3b8); font-size: 1.5rem; cursor: pointer; padding: 0.5rem; border-radius: 8px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="padding: 2rem;">
                    <div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-primary, #0a0e27); border-radius: 12px;">
                        <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: center;">
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary, #94a3b8); margin-bottom: 0.5rem;">From</div>
                                <div style="font-weight: 600; color: var(--text-primary, #ffffff);">${data.origin || 'Current Location'}</div>
                            </div>
                            <div style="text-align: center;">
                                <i class="fas fa-arrow-right" style="color: #3b82f6; font-size: 1.5rem;"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary, #94a3b8); margin-bottom: 0.5rem;">To</div>
                                <div style="font-weight: 600; color: var(--text-primary, #ffffff);">${data.destination || 'Destination'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <h3 style="color: var(--text-primary, #ffffff); margin-bottom: 1rem;">Available Routes</h3>
                    </div>
                    
                    <div style="display: grid; gap: 1rem;">
                        ${routes.map((route, index) => `
                            <div style="padding: 1.5rem; background: var(--bg-primary, #0a0e27); border-radius: 12px; border: 1px solid var(--border-color, #2d3748); border-left: 4px solid ${route.quality_color || '#3b82f6'};">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                    <div style="display: flex; align-items: center; gap: 1rem;">
                                        <div style="width: 50px; height: 50px; border-radius: 12px; background: ${route.quality_color || '#3b82f6'}; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                                            ${this.getModeIcon(route.mode)}
                                        </div>
                                        <div>
                                            <div style="font-weight: 600; color: var(--text-primary, #ffffff); text-transform: capitalize; font-size: 1.1rem;">${route.mode} Route</div>
                                            ${index === 0 ? '<div style="font-size: 0.8rem; color: #10b981; margin-top: 0.25rem;"><i class="fas fa-star"></i> Best Route</div>' : ''}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="padding: 0.5rem 1rem; background: ${route.quality_color || '#3b82f6'}; color: white; border-radius: 20px; font-weight: 600; font-size: 0.9rem;">
                                            ${route.quality || 'Good'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem;">
                                    <div>
                                        <div style="font-size: 0.85rem; color: var(--text-secondary, #94a3b8); margin-bottom: 0.25rem;">Distance</div>
                                        <div style="font-weight: 600; color: var(--text-primary, #ffffff);">${route.distance_km} km</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.85rem; color: var(--text-secondary, #94a3b8); margin-bottom: 0.25rem;">Duration</div>
                                        <div style="font-weight: 600; color: var(--text-primary, #ffffff);">${route.duration_minutes} min</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.85rem; color: var(--text-secondary, #94a3b8); margin-bottom: 0.25rem;">Est. AQI</div>
                                        <div style="font-weight: 600; color: ${route.estimated_aqi > 200 ? '#ef4444' : route.estimated_aqi > 150 ? '#f59e0b' : '#10b981'};">${route.estimated_aqi}</div>
                                    </div>
                                </div>
                                
                                <div style="margin-bottom: 1rem;">
                                    <div style="font-size: 0.85rem; color: var(--text-secondary, #94a3b8); margin-bottom: 0.5rem;">Safety Score</div>
                                    <div style="display: flex; align-items: center; gap: 1rem;">
                                        <div style="flex: 1; height: 8px; background: var(--bg-secondary, #1a1f3a); border-radius: 4px; overflow: hidden;">
                                            <div style="height: 100%; width: ${route.safety_score}%; background: ${route.quality_color || '#3b82f6'}; transition: width 0.3s;"></div>
                                        </div>
                                        <div style="font-weight: 600; color: var(--text-primary, #ffffff); min-width: 50px; text-align: right;">${route.safety_score}%</div>
                                    </div>
                                </div>
                                
                                ${route.recommendations && route.recommendations.length > 0 ? `
                                    <div style="padding-top: 1rem; border-top: 1px solid var(--border-color, #2d3748);">
                                        <div style="font-size: 0.85rem; color: var(--text-secondary, #94a3b8); margin-bottom: 0.5rem;">Recommendations:</div>
                                        <ul style="list-style: none; padding: 0; margin: 0;">
                                            ${route.recommendations.map(rec => `
                                                <li style="padding: 0.5rem 0; padding-left: 1.5rem; position: relative; color: var(--text-secondary, #94a3b8); font-size: 0.9rem;">
                                                    <i class="fas fa-check-circle" style="position: absolute; left: 0; color: #10b981; top: 0.5rem;"></i>
                                                    ${rec}
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    ${routes.length === 0 ? `
                        <div style="padding: 3rem; text-align: center; color: var(--text-secondary, #94a3b8);">
                            <i class="fas fa-route" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <div>No routes found. Please try different locations.</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSafeRoutesModal();
            }
        });
    }
    
    getModeIcon(mode) {
        const icons = {
            'driving': '<i class="fas fa-car"></i>',
            'metro': '<i class="fas fa-subway"></i>',
            'walking': '<i class="fas fa-walking"></i>',
            'cycling': '<i class="fas fa-bicycle"></i>'
        };
        return icons[mode] || '<i class="fas fa-route"></i>';
    }
    
    getAQICategory(aqi) {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Satisfactory';
        if (aqi <= 200) return 'Moderate';
        if (aqi <= 300) return 'Poor';
        if (aqi <= 400) return 'Very Poor';
        return 'Severe';
    }
}

// Global functions for button clicks
window.showMaskGuidance = async function() {
    console.log('showMaskGuidance called');
    try {
        if (!window.healthGuidanceManager) {
            console.log('Creating new HealthGuidanceManager');
            window.healthGuidanceManager = new HealthGuidanceManager();
        }
        
        console.log('Fetching mask guidance data...');
        const data = await window.healthGuidanceManager.getMaskGuidance();
        console.log('Mask guidance data received:', data);
        window.healthGuidanceManager.showMaskGuidanceModal(data);
    } catch (error) {
        console.error('Error showing mask guidance:', error);
        // Show fallback
        if (!window.healthGuidanceManager) {
            window.healthGuidanceManager = new HealthGuidanceManager();
        }
        const fallbackData = window.healthGuidanceManager.getFallbackMaskGuidance(287);
        window.healthGuidanceManager.showMaskGuidanceModal(fallbackData);
    }
};

window.showSafeRoutes = async function() {
    console.log('showSafeRoutes called');
    try {
        if (!window.healthGuidanceManager) {
            console.log('Creating new HealthGuidanceManager');
            window.healthGuidanceManager = new HealthGuidanceManager();
        }
        
        // Get current location if available
        let origin = 'Current Location';
        let destination = 'Connaught Place, Delhi';
        
        // Try to get user's current location
        const loadRoutes = async () => {
            try {
                console.log('Fetching safe routes data...');
                const data = await window.healthGuidanceManager.getSafeRoutes(origin, destination, 'all');
                console.log('Safe routes data received:', data);
                window.healthGuidanceManager.showSafeRoutesModal(data);
            } catch (error) {
                console.error('Error showing safe routes:', error);
                const fallbackData = window.healthGuidanceManager.getFallbackSafeRoutes(origin, destination);
                window.healthGuidanceManager.showSafeRoutesModal(fallbackData);
            }
        };
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    origin = `${position.coords.latitude}, ${position.coords.longitude}`;
                    loadRoutes();
                },
                () => loadRoutes(),
                { timeout: 3000 }
            );
        } else {
            loadRoutes();
        }
    } catch (error) {
        console.error('Error in showSafeRoutes:', error);
        // Show fallback even on error
        if (!window.healthGuidanceManager) {
            window.healthGuidanceManager = new HealthGuidanceManager();
        }
        const fallbackData = window.healthGuidanceManager.getFallbackSafeRoutes('Current Location', 'Connaught Place, Delhi');
        window.healthGuidanceManager.showSafeRoutesModal(fallbackData);
    }
};

window.closeMaskGuidanceModal = function() {
    const modal = document.getElementById('maskGuidanceModal');
    if (modal) {
        modal.remove();
    }
};

window.closeSafeRoutesModal = function() {
    const modal = document.getElementById('safeRoutesModal');
    if (modal) {
        modal.remove();
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - Initializing HealthGuidanceManager');
    window.healthGuidanceManager = new HealthGuidanceManager();
    console.log('HealthGuidanceManager initialized, functions available:', {
        showMaskGuidance: typeof window.showMaskGuidance,
        showSafeRoutes: typeof window.showSafeRoutes
    });
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded
    console.log('DOM already loaded - Initializing HealthGuidanceManager immediately');
    window.healthGuidanceManager = new HealthGuidanceManager();
    console.log('HealthGuidanceManager initialized immediately');
}

