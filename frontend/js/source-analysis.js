// Source Analysis Page JavaScript - Simplified and Robust Version
(function() {
    'use strict';
    
    let holographicChart = null;
    let refreshInterval = null;
    
    console.log('=== Source Analysis Script Loading ===');
    
    // Initialize chart helper
    function initializeChart() {
        const container = document.getElementById('holographicContainer');
        if (!container) {
            console.warn('Container not found, retrying...');
            return false;
        }
        
        if (typeof HolographicCharts === 'undefined') {
            console.warn('HolographicCharts class not found, retrying...');
            return false;
        }
        
        try {
            holographicChart = new HolographicCharts('holographicContainer');
            console.log('✓ Chart initialized');
            return true;
        } catch (error) {
            console.error('ERROR initializing chart:', error);
            return false;
        }
    }
    
    // Wait for DOM to be fully ready
    function init() {
        console.log('Initializing source analysis...');
        
        // Find container with retry
        let container = document.getElementById('holographicContainer');
        if (!container) {
            console.warn('Container not found immediately, retrying in 500ms...');
            setTimeout(() => {
                container = document.getElementById('holographicContainer');
                if (container) {
                    console.log('✓ Container found on retry');
                    initializeChart();
                    setupButtons();
                    setTimeout(loadData, 300);
                } else {
                    console.error('ERROR: holographicContainer not found after retry!');
                    // Still try to load fallback data
                    setTimeout(() => {
                        if (initializeChart()) {
                            loadData();
                        }
                    }, 1000);
                }
            }, 500);
            return;
        }
        
        console.log('✓ Container found');
        
        // Initialize chart
        if (!initializeChart()) {
            // Retry after a delay
            setTimeout(() => {
                if (initializeChart()) {
                    setupButtons();
                    setTimeout(loadData, 300);
                }
            }, 500);
            return;
        }
        
        // Render placeholder immediately
        if (holographicChart) {
            holographicChart.renderPlaceholder();
        }
        
        // Setup button handlers
        setupButtons();
        
        // Load data immediately
        setTimeout(loadData, 300);
        
        // Auto-refresh every 30 seconds
        refreshInterval = setInterval(loadData, 30000);
    }
    
    function setupButtons() {
        const holographicToggle = document.getElementById('holographicToggle');
        const toggle3D = document.getElementById('3DToggle');
        const refreshBtn = document.getElementById('refreshHolographic');
        
        if (holographicToggle) {
            holographicToggle.addEventListener('click', function() {
                if (holographicChart) {
                    holographicChart.toggleHolographic();
                    this.classList.toggle('active');
                    this.style.background = this.classList.contains('active') 
                        ? 'var(--primary-color, #3b82f6)' 
                        : 'var(--bg-primary, #0f172a)';
                }
            });
        }
        
        if (toggle3D) {
            toggle3D.addEventListener('click', function() {
                if (holographicChart) {
                    holographicChart.toggle3D();
                    this.classList.toggle('active');
                    this.style.background = this.classList.contains('active') 
                        ? 'var(--primary-color, #3b82f6)' 
                        : 'var(--bg-primary, #0f172a)';
                }
            });
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                loadData();
                this.style.transform = 'rotate(360deg)';
                this.style.transition = 'transform 0.5s';
                setTimeout(() => {
                    this.style.transform = 'rotate(0deg)';
                }, 500);
            });
        }
    }
    
    async function loadData() {
        console.log('--- Loading Source Data ---');
        
        try {
            // Fetch from API
            const response = await fetch('http://localhost:5000/api/source-analysis/sources');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const sources = await response.json();
            console.log(`✓ API Response: ${sources.length} sources`);
            
            if (!sources || sources.length === 0) {
                throw new Error('No sources returned from API');
            }
            
            // Calculate total for normalization
            const total = sources.reduce((sum, s) => sum + (s.contribution || 0), 0);
            console.log(`Total contribution: ${total}%`);
            
            // Format data
            const formattedData = {
                source_impact_distribution: {
                    sources: sources.map(source => {
                        const contribution = source.contribution || 0;
                        const normalized = total > 0 ? (contribution / total) * 100 : contribution;
                        
                        return {
                            name: source.type || 'Unknown',
                            value: normalized,
                            percentage: normalized,
                            color: getColorForSource(source.type),
                            location: source.location || 'Delhi-NCR',
                            confidence: (source.confidence || 0.8) * 100,
                            impact_level: source.impact || 'Medium'
                        };
                    }),
                    total_contribution: 100
                },
                timestamp: new Date().toISOString(),
                analysis_type: 'Real-Time Source Analysis'
            };
            
            console.log('✓ Data formatted:', formattedData.source_impact_distribution.sources.length, 'sources');
            console.log('Sample:', formattedData.source_impact_distribution.sources[0]);
            
            // Update chart
            if (holographicChart) {
                console.log('Loading data into chart...');
                
                // Hide placeholder immediately
                const placeholder = document.querySelector('#holographicContainer .holographic-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                
                // Load data
                holographicChart.loadData(formattedData);
                
                // Force multiple re-renders to ensure it shows
                setTimeout(() => {
                    if (holographicChart && !holographicChart.is3DMode) {
                        console.log('Force re-rendering 2D chart (attempt 1)...');
                        holographicChart.render2D();
                    }
                }, 100);
                
                setTimeout(() => {
                    if (holographicChart && !holographicChart.is3DMode) {
                        console.log('Force re-rendering 2D chart (attempt 2)...');
                        holographicChart.render2D();
                    }
                }, 300);
                
                setTimeout(() => {
                    if (holographicChart && !holographicChart.is3DMode) {
                        console.log('Force re-rendering 2D chart (attempt 3)...');
                        holographicChart.render2D();
                    }
                }, 500);
                
                console.log('✓ Chart updated');
            } else {
                console.error('✗ Chart not initialized!');
                // Try to initialize it now
                if (initializeChart()) {
                    setTimeout(() => {
                        if (holographicChart) {
                            holographicChart.loadData(formattedData);
                            setTimeout(() => {
                                if (holographicChart && !holographicChart.is3DMode) {
                                    holographicChart.render2D();
                                }
                            }, 200);
                        }
                    }, 100);
                } else {
                    // If initialization fails, use fallback data
                    useFallbackData();
                }
            }
            
        } catch (error) {
            console.error('✗ Error loading data:', error);
            // Use fallback data
            useFallbackData();
        }
    }
    
    function useFallbackData() {
        console.log('Using fallback sample data...');
        const fallbackData = {
            source_impact_distribution: {
                sources: [
                    { name: 'Vehicular', value: 32, percentage: 32, color: '#ef4444', location: 'Delhi-NCR', confidence: 85, impact_level: 'High' },
                    { name: 'Industrial', value: 24, percentage: 24, color: '#f97316', location: 'Delhi-NCR', confidence: 80, impact_level: 'High' },
                    { name: 'Construction', value: 19, percentage: 19, color: '#8b5cf6', location: 'Delhi-NCR', confidence: 75, impact_level: 'Medium' },
                    { name: 'Stubble Burning', value: 12, percentage: 12, color: '#06b6d4', location: 'Delhi-NCR', confidence: 90, impact_level: 'High' },
                    { name: 'Power Plants', value: 8, percentage: 8, color: '#84cc16', location: 'Delhi-NCR', confidence: 70, impact_level: 'Medium' },
                    { name: 'Waste Burning', value: 5, percentage: 5, color: '#ec4899', location: 'Delhi-NCR', confidence: 65, impact_level: 'Low' }
                ],
                total_contribution: 100
            },
            timestamp: new Date().toISOString(),
            analysis_type: 'Fallback Sample Data'
        };
        
        // Ensure chart is initialized
        if (!holographicChart) {
            if (!initializeChart()) {
                // If still can't initialize, try one more time after delay
                setTimeout(() => {
                    if (initializeChart() && holographicChart) {
                        loadFallbackData(fallbackData);
                    }
                }, 500);
                return;
            }
        }
        
        loadFallbackData(fallbackData);
    }
    
    function loadFallbackData(fallbackData) {
        if (holographicChart) {
            // Hide placeholder
            const placeholder = document.querySelector('#holographicContainer .holographic-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            
            holographicChart.loadData(fallbackData);
            setTimeout(() => {
                if (holographicChart && !holographicChart.is3DMode) {
                    holographicChart.render2D();
                }
            }, 200);
            
            // Force additional renders
            setTimeout(() => {
                if (holographicChart && !holographicChart.is3DMode) {
                    holographicChart.render2D();
                }
            }, 500);
            
            setTimeout(() => {
                if (holographicChart && !holographicChart.is3DMode) {
                    holographicChart.render2D();
                }
            }, 1000);
        }
    }
    
    function getColorForSource(sourceType) {
        const colors = {
            'Vehicular': '#ef4444',
            'Industrial': '#f97316',
            'Construction': '#8b5cf6',
            'Stubble Burning': '#06b6d4',
            'Power Plants': '#84cc16',
            'Waste Burning': '#ec4899',
            'Dust': '#6b7280',
            'Domestic': '#f59e0b',
            'Biomass': '#10b981',
            'Other': '#6366f1'
        };
        return colors[sourceType] || '#6366f1';
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already ready
        init();
    }
    
    // Also try initialization after a delay to catch late-loading containers
    setTimeout(() => {
        const container = document.getElementById('holographicContainer');
        if (container && !holographicChart) {
            console.log('Late initialization: Container found, initializing chart...');
            if (initializeChart()) {
                setupButtons();
                loadData();
            }
        }
    }, 1000);
    
    // Final fallback - ensure data is loaded even if initialization failed
    setTimeout(() => {
        if (!holographicChart) {
            const container = document.getElementById('holographicContainer');
            if (container) {
                console.log('Final fallback: Attempting to initialize and load data...');
                if (initializeChart()) {
                    setupButtons();
                    useFallbackData();
                }
            }
        } else if (!holographicChart.data) {
            // Chart exists but no data loaded
            console.log('Chart exists but no data, loading fallback...');
            useFallbackData();
        }
    }, 2000);
    
    // Cleanup
    window.addEventListener('beforeunload', function() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
        if (holographicChart) {
            holographicChart.destroy();
        }
    });
    
    // Expose for debugging
    window.sourceAnalysisDebug = {
        loadData: loadData,
        chart: () => holographicChart
    };
    
})();
