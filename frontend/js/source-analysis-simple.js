// Simple, guaranteed-to-work source analysis
(function() {
    'use strict';
    
    console.log('=== SIMPLE SOURCE ANALYSIS LOADING ===');
    
    let chart = null;
    
    function initChart() {
        const container = document.getElementById('holographicContainer');
        if (!container) {
            console.error('Container not found!');
            return null;
        }
        
        // Ensure container has proper size
        const rect = container.getBoundingClientRect();
        if (rect.height < 300) {
            container.style.minHeight = '400px';
            container.style.height = '400px';
        }
        
        // Hide placeholder
        const placeholder = container.querySelector('.holographic-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
            placeholder.style.visibility = 'hidden';
        }
        
        // Remove any existing canvas from HolographicCharts (if it exists)
        const existingCanvases = container.querySelectorAll('canvas');
        existingCanvases.forEach(canvas => {
            if (canvas.id !== 'sourceChartCanvas') {
                canvas.style.display = 'none';
            }
        });
        
        // Create or get canvas
        let canvas = container.querySelector('#sourceChartCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'sourceChartCanvas';
            container.appendChild(canvas);
        }
        
        // Set canvas styles to ensure visibility
        canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; display: block !important; visibility: visible !important; opacity: 1 !important; pointer-events: none;';
        
        const ctx = canvas.getContext('2d');
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width || 800;
        const height = containerRect.height || 400;
        
        // Set actual canvas size (not just CSS)
        canvas.width = width;
        canvas.height = height;
        
        console.log('Canvas created/updated:', canvas.width, 'x', canvas.height);
        
        return { canvas, ctx, container };
    }
    
    function drawPieChart(canvas, ctx, sources) {
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        if (!sources || sources.length === 0) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', width / 2, height / 2);
            return;
        }
        
        // Calculate total
        const total = sources.reduce((sum, s) => sum + (s.value || s.percentage || 0), 0);
        
        if (total === 0) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No data to display', width / 2, height / 2);
            return;
        }
        
        // Draw pie chart
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;
        let currentAngle = -Math.PI / 2;
        
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
        
        sources.forEach((source, index) => {
            const value = source.value || source.percentage || 0;
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            if (sliceAngle <= 0) return;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            
            const color = colors[source.name] || source.color || '#6366f1';
            ctx.fillStyle = color;
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            currentAngle += sliceAngle;
        });
        
        // Center circle
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Source Impact', centerX, centerY - 10);
        
        ctx.fillStyle = '#3b82f6';
        ctx.font = '14px Arial';
        ctx.fillText(sources.length + ' Sources', centerX, centerY + 10);
        
        console.log('✓ Pie chart drawn with', sources.length, 'sources');
    }
    
    function createLegend(container, sources) {
        // Find the parent panel to add legend below the container
        const panel = container.closest('.panel-content') || container.parentElement;
        
        // Remove existing legend (check both in container and in panel)
        const existingLegendInContainer = container.querySelector('.source-legend');
        const existingLegendInPanel = panel ? panel.querySelector('.source-legend') : null;
        
        if (existingLegendInContainer) {
            existingLegendInContainer.remove();
        }
        if (existingLegendInPanel) {
            existingLegendInPanel.remove();
        }
        
        // Create legend container - place it AFTER the graph container
        const legend = document.createElement('div');
        legend.className = 'source-legend';
        legend.style.cssText = 'margin-top: 1.5rem; padding: 1.5rem; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;';
        
        // Add title to legend
        const legendTitle = document.createElement('div');
        legendTitle.style.cssText = 'grid-column: 1 / -1; color: #ffffff; font-weight: 600; font-size: 16px; margin-bottom: 0.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(59, 130, 246, 0.2);';
        legendTitle.textContent = 'Source Impact Breakdown';
        legend.appendChild(legendTitle);
        
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
        
        // Sort sources by percentage (highest first)
        const sortedSources = [...sources].sort((a, b) => (b.value || b.percentage || 0) - (a.value || a.percentage || 0));
        
        sortedSources.forEach(source => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 6px; transition: all 0.3s;';
            item.onmouseenter = function() { this.style.background = 'rgba(15, 23, 42, 0.8)'; this.style.borderColor = 'rgba(59, 130, 246, 0.3)'; };
            item.onmouseleave = function() { this.style.background = 'rgba(15, 23, 42, 0.6)'; this.style.borderColor = 'rgba(59, 130, 246, 0.1)'; };
            
            // Color indicator
            const colorBox = document.createElement('div');
            const color = colors[source.name] || source.color || '#6366f1';
            colorBox.style.cssText = `width: 24px; height: 24px; background: ${color}; border-radius: 4px; flex-shrink: 0; box-shadow: 0 0 8px ${color}40;`;
            
            // Text content
            const text = document.createElement('div');
            text.style.cssText = 'flex: 1; display: flex; justify-content: space-between; align-items: center;';
            
            const name = document.createElement('span');
            name.textContent = source.name;
            name.style.cssText = 'color: #ffffff; font-weight: 500; font-size: 15px;';
            
            const value = document.createElement('span');
            const percentage = (source.value || source.percentage || 0).toFixed(1);
            value.textContent = percentage + '%';
            value.style.cssText = 'color: #3b82f6; font-weight: 700; font-size: 16px;';
            
            text.appendChild(name);
            text.appendChild(value);
            
            item.appendChild(colorBox);
            item.appendChild(text);
            legend.appendChild(item);
        });
        
        // Add legend after the container (below the graph)
        if (panel) {
            // Insert after the container
            container.parentNode.insertBefore(legend, container.nextSibling);
        } else {
            // Fallback: append to container's parent
            container.parentElement.appendChild(legend);
        }
        
        console.log('✓ Legend created below graph with', sources.length, 'items');
    }
    
    async function loadAndRender() {
        console.log('Loading data...');
        
        try {
            const response = await fetch('http://localhost:5000/api/source-analysis/sources');
            const sources = await response.json();
            
            console.log('Got', sources.length, 'sources from API');
            
            // Format data
            const total = sources.reduce((sum, s) => sum + (s.contribution || 0), 0);
            const formatted = sources.map(s => ({
                name: s.type || 'Unknown',
                value: total > 0 ? (s.contribution / total) * 100 : s.contribution,
                percentage: total > 0 ? (s.contribution / total) * 100 : s.contribution
            }));
            
            // Initialize chart
            if (!chart) {
                chart = initChart();
            }
            
            if (chart && chart.canvas && chart.ctx) {
                // Resize if needed
                const rect = chart.container.getBoundingClientRect();
                const width = Math.max(rect.width || 800, 400);
                const height = Math.max(rect.height || 400, 300);
                chart.canvas.width = width;
                chart.canvas.height = height;
                
                // Ensure canvas is visible
                chart.canvas.style.display = 'block';
                chart.canvas.style.visibility = 'visible';
                chart.canvas.style.opacity = '1';
                chart.canvas.style.zIndex = '1000';
                
                // Draw
                drawPieChart(chart.canvas, chart.ctx, formatted);
                
                // Create legend below graph
                createLegend(chart.container, formatted);
                
                console.log('✓✓✓ GRAPH RENDERED ✓✓✓');
            } else {
                console.error('Chart not initialized! Retrying...');
                // Retry initialization
                chart = initChart();
                if (chart && chart.canvas && chart.ctx) {
                    const rect = chart.container.getBoundingClientRect();
                    const width = Math.max(rect.width || 800, 400);
                    const height = Math.max(rect.height || 400, 300);
                    chart.canvas.width = width;
                    chart.canvas.height = height;
                    drawPieChart(chart.canvas, chart.ctx, formatted);
                    createLegend(chart.container, formatted);
                }
            }
            
        } catch (error) {
            console.error('Error:', error);
            
            // Use fallback data
            const fallback = [
                { name: 'Vehicular', value: 32, percentage: 32 },
                { name: 'Industrial', value: 24, percentage: 24 },
                { name: 'Construction', value: 19, percentage: 19 },
                { name: 'Stubble Burning', value: 12, percentage: 12 },
                { name: 'Power Plants', value: 8, percentage: 8 },
                { name: 'Waste Burning', value: 5, percentage: 5 }
            ];
            
            if (!chart) {
                chart = initChart();
            }
            
            if (chart && chart.canvas && chart.ctx) {
                const rect = chart.container.getBoundingClientRect();
                chart.canvas.width = rect.width || 800;
                chart.canvas.height = rect.height || 400;
                drawPieChart(chart.canvas, chart.ctx, fallback);
                
                // Create legend below graph
                createLegend(chart.container, fallback);
                
                console.log('✓ Fallback graph rendered');
            }
        }
    }
    
    // Initialize when ready with multiple retries
    function initializeWithRetries() {
        const container = document.getElementById('holographicContainer');
        if (container) {
            loadAndRender();
        } else {
            console.log('Container not found, will retry...');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeWithRetries, 100);
            setTimeout(initializeWithRetries, 500);
            setTimeout(initializeWithRetries, 1000);
            setTimeout(initializeWithRetries, 2000);
        });
    } else {
        setTimeout(initializeWithRetries, 100);
        setTimeout(initializeWithRetries, 500);
        setTimeout(initializeWithRetries, 1000);
        setTimeout(initializeWithRetries, 2000);
    }
    
    // Final fallback - ensure it loads even if everything else fails
    setTimeout(() => {
        const container = document.getElementById('holographicContainer');
        if (container) {
            console.log('Final fallback: Loading source graph...');
            loadAndRender();
        }
    }, 3000);
    
    // Expose for manual trigger
    window.renderSourceGraph = loadAndRender;
    
})();

