// Force render script - ensures graph displays
(function() {
    'use strict';
    
    console.log('=== Force Render Script Loading ===');
    
    function forceRender() {
        console.log('Force rendering graph...');
        
        const container = document.getElementById('holographicContainer');
        if (!container) {
            console.error('Container not found!');
            return;
        }
        
        // Hide placeholder
        const placeholder = container.querySelector('.holographic-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
            placeholder.style.visibility = 'hidden';
        }
        
        // Check if chart exists
        if (window.sourceAnalysisDebug && window.sourceAnalysisDebug.chart()) {
            const chart = window.sourceAnalysisDebug.chart();
            if (chart && chart.data) {
                console.log('Chart has data, forcing render...');
                chart.render2D();
            } else {
                console.log('Chart exists but no data, triggering load...');
                if (window.sourceAnalysisDebug.loadData) {
                    window.sourceAnalysisDebug.loadData();
                }
            }
        } else {
            console.log('Chart not found, waiting for initialization...');
        }
    }
    
    // Run after page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(forceRender, 1000);
            setTimeout(forceRender, 2000);
            setTimeout(forceRender, 3000);
        });
    } else {
        setTimeout(forceRender, 1000);
        setTimeout(forceRender, 2000);
        setTimeout(forceRender, 3000);
    }
    
    // Also expose globally
    window.forceRenderGraph = forceRender;
})();

