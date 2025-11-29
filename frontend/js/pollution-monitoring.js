// Pollution Source Monitoring JavaScript - Updated for 3 Features
class PollutionMonitoringManager {
    constructor() {
        this.apiBase = window.location.origin.includes('localhost') || 
                      window.location.hostname === '127.0.0.1'
                      ? 'http://localhost:5000' : '';
        this.updateInterval = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        const section = document.getElementById('pollution-monitoring');
        if (!section) {
            console.warn('Pollution monitoring section not found, will retry...');
            setTimeout(() => this.init(), 500);
            return;
        }
        
        // Force section to be visible
        section.style.display = 'block';
        section.style.visibility = 'visible';
        section.style.opacity = '1';
        section.style.minHeight = '100vh';
        
        // Load all data
        this.loadAllMonitoringData();
        
        // Set up auto-refresh every 30 seconds
        this.startAutoRefresh();
        
        this.isInitialized = true;
        console.log('Pollution Monitoring Manager initialized');
    }
    
    async loadAllMonitoringData() {
        try {
            await Promise.all([
                this.loadTransportEmissions(),
                this.loadStubbleBurning(),
                this.loadBiomassBurning()
            ]);
        } catch (error) {
            console.error('Error loading monitoring data:', error);
        }
    }
    
    // ========================================================================
    // 1. TRANSPORT EMISSIONS
    // ========================================================================
    
    async loadTransportEmissions() {
        try {
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/pollution-monitoring/transport-emissions${cacheBuster}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update statistics
            const totalVehiclesEl = document.getElementById('totalVehiclesDetected');
            if (totalVehiclesEl) {
                totalVehiclesEl.textContent = (data.total_vehicles_detected || 0).toLocaleString();
            }
            
            const violationsCountEl = document.getElementById('violationsCount');
            if (violationsCountEl) {
                violationsCountEl.textContent = (data.violations_count || 0);
            }
            
            const complianceRateEl = document.getElementById('complianceRate');
            if (complianceRateEl) {
                complianceRateEl.textContent = `${data.compliance_rate || 0}%`;
            }
            
            // Update violations/complaints list - Only show vehicles that should raise complaints
            // BS6, BS4 Diesel, and BS3 Petrol are NOT shown here (they are allowed)
            const violationsEl = document.getElementById('vehicleViolations');
            if (violationsEl && data.violations) {
                // Filter out any allowed vehicles that might have slipped through
                const allowedTypes = ['BS6', 'BS4 Diesel', 'BS3 Petrol'];
                const filteredViolations = data.violations.filter(v => !allowedTypes.includes(v.vehicle_type));
                
                // Get complaint statistics
                const complaintStats = data.complaint_statistics || {};
                const currentAqi = data.current_aqi || 250;
                const aqiCategory = data.aqi_category || 'Moderate';
                
                if (filteredViolations.length === 0) {
                    violationsEl.innerHTML = `
                        <div style="padding: 2rem; text-align: center; color: var(--text-secondary, #94a3b8);">
                            <i class="fas fa-check-circle" style="color: #10b981; font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                            <div>No complaints filed. All vehicles are compliant!</div>
                            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary, #64748b);">
                                Note: BS6, BS4 Diesel, and BS3 Petrol vehicles are allowed and do not appear in complaints.
                            </div>
                        </div>`;
                } else {
                    // Severity colors
                    const severityColors = {
                        'High': '#ef4444',
                        'Medium': '#f59e0b',
                        'Low': '#3b82f6'
                    };
                    
                    violationsEl.innerHTML = `
                        <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 4px solid #ef4444;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <div style="color: #ef4444; font-size: 0.9rem; font-weight: 600;">
                                    <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
                                    ${filteredViolations.length} Complaint${filteredViolations.length > 1 ? 's' : ''} Filed (Based on Real-time AQI: ${currentAqi})
                                </div>
                                <div style="font-size: 0.8rem; color: var(--text-secondary, #94a3b8);">
                                    AQI Category: ${aqiCategory}
                                </div>
                            </div>
                            ${complaintStats.high_severity > 0 || complaintStats.medium_severity > 0 || complaintStats.low_severity > 0 ? `
                            <div style="display: flex; gap: 1rem; font-size: 0.8rem; color: var(--text-secondary, #94a3b8);">
                                ${complaintStats.high_severity > 0 ? `<span><i class="fas fa-circle" style="color: ${severityColors.High}; font-size: 0.6rem;"></i> High: ${complaintStats.high_severity}</span>` : ''}
                                ${complaintStats.medium_severity > 0 ? `<span><i class="fas fa-circle" style="color: ${severityColors.Medium}; font-size: 0.6rem;"></i> Medium: ${complaintStats.medium_severity}</span>` : ''}
                                ${complaintStats.low_severity > 0 ? `<span><i class="fas fa-circle" style="color: ${severityColors.Low}; font-size: 0.6rem;"></i> Low: ${complaintStats.low_severity}</span>` : ''}
                            </div>
                            ` : ''}
                            <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-secondary, #64748b);">
                                BS6, BS4 Diesel, and BS3 Petrol vehicles are exempt from complaints
                            </div>
                        </div>
                        ${filteredViolations.map(v => {
                            const severity = v.severity || 'Medium';
                            const severityColor = severityColors[severity] || '#f59e0b';
                            const complaintId = v.complaint_id || `COMP-${Date.now()}`;
                            const complaintStatus = v.complaint_status || 'Filed';
                            
                            return `
                        <div style="padding: 1rem; margin-bottom: 1rem; background: var(--bg-primary, #0a0e27); border-radius: 8px; border: 1px solid var(--border-color, #2d3748); border-left: 4px solid ${severityColor};">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                <div>
                                    <strong style="color: var(--text-primary, #ffffff);">${v.plate_number}</strong>
                                    <span style="color: var(--text-secondary, #94a3b8); margin-left: 1rem;">${v.vehicle_type}</span>
                                </div>
                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                    <span style="padding: 0.25rem 0.75rem; background: ${severityColor}20; color: ${severityColor}; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">${severity} Severity</span>
                                    <span style="padding: 0.25rem 0.75rem; background: rgba(239, 68, 68, 0.2); color: #ef4444; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">Complaint Filed</span>
                                </div>
                            </div>
                            <div style="color: var(--text-secondary, #94a3b8); font-size: 0.85rem; margin-bottom: 0.5rem;">
                                <i class="fas fa-map-marker-alt" style="margin-right: 0.5rem;"></i>${v.location}
                            </div>
                            <div style="color: ${severityColor}; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 500;">
                                <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>${v.violation_reason}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color, #2d3748);">
                                <div style="color: var(--text-secondary, #94a3b8); font-size: 0.75rem;">
                                    <i class="fas fa-id-badge" style="margin-right: 0.5rem;"></i>${complaintId}
                                </div>
                                <div style="color: var(--text-secondary, #94a3b8); font-size: 0.75rem;">
                                    <i class="fas fa-clock" style="margin-right: 0.5rem;"></i>${new Date(v.timestamp).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    `;
                        }).join('')}`;
                }
            }
            
            // Update timestamp
            const updateTimeEl = document.getElementById('transportUpdateTime');
            if (updateTimeEl) {
                updateTimeEl.textContent = 'Updated just now';
            }
            
        } catch (error) {
            console.error('Error loading transport emissions:', error);
        }
    }
    
    // ========================================================================
    // 2. STUBBLE BURNING
    // ========================================================================
    
    async loadStubbleBurning() {
        try {
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/pollution-monitoring/stubble-burning${cacheBuster}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update statistics
            const totalHotspotsEl = document.getElementById('totalHotspots');
            if (totalHotspotsEl) {
                totalHotspotsEl.textContent = (data.summary?.total_hotspots || 0);
            }
            
            const highRiskEl = document.getElementById('highRiskHotspots');
            if (highRiskEl) {
                highRiskEl.textContent = (data.summary?.high_risk_hotspots || 0);
            }
            
            const totalFiresEl = document.getElementById('totalFires');
            if (totalFiresEl) {
                totalFiresEl.textContent = (data.summary?.total_fires || 0);
            }
            
            const estimatedImpactEl = document.getElementById('estimatedImpact');
            if (estimatedImpactEl) {
                const hours = data.summary?.estimated_delhi_impact_hours;
                estimatedImpactEl.textContent = hours ? `${Math.round(hours)}h` : 'N/A';
            }
            
            // Update hotspots list
            const hotspotsEl = document.getElementById('stubbleHotspots');
            if (hotspotsEl && data.hotspots) {
                if (data.hotspots.length === 0) {
                    hotspotsEl.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary, #94a3b8);">No active hotspots detected.</div>';
                } else {
                    hotspotsEl.innerHTML = data.hotspots.slice(0, 10).map(h => `
                        <div style="padding: 1rem; margin-bottom: 1rem; background: var(--bg-primary, #0a0e27); border-radius: 8px; border: 1px solid var(--border-color, #2d3748); border-left: 4px solid ${h.risk_level === 'high' ? '#ef4444' : h.risk_level === 'medium' ? '#f59e0b' : '#10b981'};">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                <div>
                                    <strong style="color: var(--text-primary, #ffffff);">${h.region}</strong>
                                    <span style="color: var(--text-secondary, #94a3b8); margin-left: 1rem;">${h.intensity} intensity</span>
                                </div>
                                <span style="padding: 0.25rem 0.75rem; background: ${h.risk_level === 'high' ? 'rgba(239, 68, 68, 0.2)' : h.risk_level === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${h.risk_level === 'high' ? '#ef4444' : h.risk_level === 'medium' ? '#f59e0b' : '#10b981'}; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">${h.risk_level.toUpperCase()}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-secondary, #94a3b8);">
                                <div><i class="fas fa-fire" style="margin-right: 0.5rem;"></i>${h.fire_count} fires</div>
                                <div><i class="fas fa-ruler" style="margin-right: 0.5rem;"></i>${h.area_affected_hectares} ha</div>
                                <div><i class="fas fa-map-marker-alt" style="margin-right: 0.5rem;"></i>${h.distance_to_delhi_km} km from Delhi</div>
                                <div><i class="fas fa-wind" style="margin-right: 0.5rem;"></i>${h.wind_speed_kmh} km/h ${h.wind_direction}</div>
                            </div>
                            ${h.estimated_arrival_hours ? `
                                <div style="color: ${h.risk_level === 'high' ? '#ef4444' : '#f59e0b'}; font-size: 0.9rem; font-weight: 600;">
                                    <i class="fas fa-clock" style="margin-right: 0.5rem;"></i>Estimated impact in ${Math.round(h.estimated_arrival_hours)} hours
                                </div>
                            ` : ''}
                        </div>
                    `).join('');
                }
            }
            
            // Load alerts
            this.loadStubbleAlerts();
            
            // Update timestamp
            const updateTimeEl = document.getElementById('stubbleUpdateTime');
            if (updateTimeEl) {
                updateTimeEl.textContent = 'Updated just now';
            }
            
        } catch (error) {
            console.error('Error loading stubble burning:', error);
        }
    }
    
    async loadStubbleAlerts() {
        try {
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/pollution-monitoring/stubble-burning/alerts${cacheBuster}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const alertsEl = document.getElementById('stubbleAlerts');
            
            if (alertsEl && data.alerts) {
                if (data.alerts.length === 0) {
                    alertsEl.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-secondary, #94a3b8);">No active alerts.</div>';
                } else {
                    alertsEl.innerHTML = data.alerts.map(alert => `
                        <div style="padding: 1.5rem; margin-bottom: 1rem; background: var(--bg-primary, #0a0e27); border-radius: 8px; border: 1px solid var(--border-color, #2d3748); border-left: 4px solid ${alert.severity === 'high' ? '#ef4444' : '#f59e0b'};">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                <i class="fas fa-exclamation-triangle" style="color: ${alert.severity === 'high' ? '#ef4444' : '#f59e0b'}; font-size: 1.5rem;"></i>
                                <h4 style="margin: 0; color: var(--text-primary, #ffffff);">${alert.title}</h4>
                            </div>
                            <p style="color: var(--text-secondary, #94a3b8); margin-bottom: 1rem;">${alert.message}</p>
                            ${alert.recommendations ? `
                                <div style="margin-top: 1rem;">
                                    <strong style="color: var(--text-primary, #ffffff); display: block; margin-bottom: 0.5rem;">Recommendations:</strong>
                                    <ul style="list-style: none; padding: 0; margin: 0; color: var(--text-secondary, #94a3b8);">
                                        ${alert.recommendations.map(rec => `<li style="padding: 0.5rem 0; padding-left: 1.5rem; position: relative;"><i class="fas fa-check-circle" style="position: absolute; left: 0; color: #10b981;"></i>${rec}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error loading stubble alerts:', error);
        }
    }
    
    // ========================================================================
    // 3. BIOMASS & DOMESTIC FUEL BURNING
    // ========================================================================
    
    async loadBiomassBurning() {
        try {
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${this.apiBase}/api/pollution-monitoring/biomass-burning${cacheBuster}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update statistics
            const biomassHouseholdsEl = document.getElementById('biomassHouseholds');
            if (biomassHouseholdsEl) {
                biomassHouseholdsEl.textContent = (data.summary?.total_biomass_households || 0).toLocaleString();
            }
            
            const eligibleForLPGEl = document.getElementById('eligibleForLPG');
            if (eligibleForLPGEl) {
                eligibleForLPGEl.textContent = (data.summary?.total_eligible_for_subsidy || 0).toLocaleString();
            }
            
            const biomassUsageRateEl = document.getElementById('biomassUsageRate');
            if (biomassUsageRateEl) {
                biomassUsageRateEl.textContent = `${data.summary?.overall_biomass_usage_percent || 0}%`;
            }
            
            // Update ward data
            const wardDataEl = document.getElementById('wardData');
            if (wardDataEl && data.wards) {
                wardDataEl.innerHTML = data.wards.map(ward => `
                    <div style="padding: 1rem; margin-bottom: 1rem; background: var(--bg-primary, #0a0e27); border-radius: 8px; border: 1px solid var(--border-color, #2d3748); border-left: 4px solid ${ward.priority_level === 'high' ? '#ef4444' : ward.priority_level === 'medium' ? '#f59e0b' : '#10b981'};">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                            <div>
                                <strong style="color: var(--text-primary, #ffffff);">${ward.ward_name}</strong>
                                <span style="color: var(--text-secondary, #94a3b8); margin-left: 0.5rem;">Ward ${ward.ward_number}</span>
                            </div>
                            <span style="padding: 0.25rem 0.75rem; background: ${ward.priority_level === 'high' ? 'rgba(239, 68, 68, 0.2)' : ward.priority_level === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${ward.priority_level === 'high' ? '#ef4444' : ward.priority_level === 'medium' ? '#f59e0b' : '#10b981'}; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">${ward.priority_level.toUpperCase()}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; font-size: 0.85rem; color: var(--text-secondary, #94a3b8);">
                            <div><i class="fas fa-home" style="margin-right: 0.5rem;"></i>Total: ${ward.total_households.toLocaleString()}</div>
                            <div><i class="fas fa-fire" style="margin-right: 0.5rem;"></i>Biomass: ${ward.biomass_households.toLocaleString()} (${ward.biomass_usage_percent}%)</div>
                            <div><i class="fas fa-check-circle" style="margin-right: 0.5rem; color: #10b981;"></i>Eligible for LPG: ${ward.eligible_for_lpg_subsidy.toLocaleString()}</div>
                            <div><i class="fas fa-gas-pump" style="margin-right: 0.5rem; color: #3b82f6;"></i>LPG Adoption: ${ward.lpg_adoption_rate}%</div>
                        </div>
                    </div>
                `).join('');
            }
            
            // Update LPG schemes
            const schemesListEl = document.getElementById('schemesList');
            if (schemesListEl && data.lpg_schemes) {
                schemesListEl.innerHTML = data.lpg_schemes.map(scheme => `
                    <div style="padding: 1.5rem; background: var(--bg-primary, #0a0e27); border-radius: 8px; border: 1px solid var(--border-color, #2d3748);">
                        <h5 style="margin: 0 0 0.75rem 0; color: var(--text-primary, #ffffff); font-size: 1.1rem;">${scheme.scheme_name}</h5>
                        <p style="color: var(--text-secondary, #94a3b8); margin-bottom: 0.75rem; font-size: 0.9rem;">
                            <strong>Eligibility:</strong> ${scheme.eligibility}
                        </p>
                        <p style="color: var(--text-secondary, #94a3b8); margin-bottom: 0.75rem; font-size: 0.9rem;">
                            <strong>Benefit:</strong> ${scheme.benefit}
                        </p>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <a href="${scheme.application_url}" target="_blank" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border-radius: 8px; text-decoration: none; font-size: 0.9rem; font-weight: 600;">
                                <i class="fas fa-external-link-alt" style="margin-right: 0.5rem;"></i>Apply Now
                            </a>
                            <a href="tel:${scheme.contact}" style="padding: 0.5rem 1rem; background: var(--bg-secondary, #1a1f3a); color: var(--text-primary, #ffffff); border: 1px solid var(--border-color, #2d3748); border-radius: 8px; text-decoration: none; font-size: 0.9rem;">
                                <i class="fas fa-phone" style="margin-right: 0.5rem;"></i>${scheme.contact}
                            </a>
                        </div>
                    </div>
                `).join('');
            }
            
            // Update timestamp
            const updateTimeEl = document.getElementById('biomassUpdateTime');
            if (updateTimeEl) {
                updateTimeEl.textContent = 'Updated just now';
            }
            
        } catch (error) {
            console.error('Error loading biomass burning:', error);
        }
    }
    
    startAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            if (!document.hidden) {
                this.loadAllMonitoringData();
            }
        }, 30000); // 30 seconds
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadAllMonitoringData();
            }
        });
    }
    
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Vehicle image upload handler
window.processVehicleImage = async function() {
    const fileInput = document.getElementById('vehicleImageUpload');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert('Please select an image file first');
        return;
    }
    
    const file = fileInput.files[0];
    
    // In production, this would upload the image and process it
    // For now, simulate ANPR processing
    try {
        const response = await fetch(`${window.pollutionMonitoringManager?.apiBase || 'http://localhost:5000'}/api/pollution-monitoring/transport-emissions/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: file.name,
                size: file.size
            })
        });
        
        const result = await response.json();
        
        if (result.is_violation) {
            alert(`VIOLATION DETECTED!\n\nPlate: ${result.plate_number}\nType: ${result.vehicle_type}\nReason: ${result.violation_reason}`);
        } else {
            alert(`Vehicle Compliant!\n\nPlate: ${result.plate_number}\nType: ${result.vehicle_type}\nStatus: ${result.compliance_status}`);
        }
        
        // Reload transport emissions data
        if (window.pollutionMonitoringManager) {
            window.pollutionMonitoringManager.loadTransportEmissions();
        }
    } catch (error) {
        console.error('Error processing vehicle image:', error);
        alert('Error processing image. Please try again.');
    }
};

// Initialize when DOM is ready
function initializePollutionMonitoring() {
    try {
        const section = document.getElementById('pollution-monitoring');
        if (!section) {
            console.warn('Pollution monitoring section not found, will retry...');
            setTimeout(initializePollutionMonitoring, 500);
            return;
        }
        
        section.style.display = 'block';
        section.style.visibility = 'visible';
        section.style.opacity = '1';
        
        window.pollutionMonitoringManager = new PollutionMonitoringManager();
        console.log('Pollution Monitoring Manager initialized successfully');
    } catch (error) {
        console.error('Error initializing pollution monitoring:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePollutionMonitoring);
} else {
    initializePollutionMonitoring();
}

window.addEventListener('load', () => {
    if (!window.pollutionMonitoringManager) {
        initializePollutionMonitoring();
    }
});

window.addEventListener('beforeunload', () => {
    if (window.pollutionMonitoringManager) {
        window.pollutionMonitoringManager.cleanup();
    }
});
