// Simple Navigation Functions for AirWatch AI

// Global navigation state
let currentPage = 'index.html';
let navigationHistory = [];

// Scroll to section function
function scrollToSection(sectionId) {
    try {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            // Update URL hash
            window.history.pushState({}, '', `#${sectionId}`);
            
            // Add to navigation history (only if not already there)
            if (navigationHistory.length === 0 || navigationHistory[navigationHistory.length - 1] !== sectionId) {
                navigationHistory.push(sectionId);
            }
            
            // Always show back button when not on home
            if (sectionId !== 'home') {
                const backButton = document.getElementById('backButton');
                if (backButton) {
                    backButton.style.display = 'flex';
                }
            } else {
                const backButton = document.getElementById('backButton');
                if (backButton) {
                    backButton.style.display = 'none';
                }
            }
            
            console.log(`Scrolled to section: ${sectionId}`);
        } else {
            console.warn(`Section with id '${sectionId}' not found`);
            // If section not found, try to go to home
            const homeSection = document.getElementById('home');
            if (homeSection) {
                scrollToSection('home');
            }
        }
    } catch (error) {
        console.error('Error in scrollToSection:', error);
        // Fallback: try to navigate to home
        window.location.href = 'index.html#home';
    }
}

// Make scrollToSection globally available
window.scrollToSection = scrollToSection;

// Navigate to specific page
function navigateToPage(page) {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    
    // Add current page to history before navigating
    if (currentPath !== page && currentPath !== 'index.html') {
        navigationHistory.push(currentPath);
    }
    
    // Initialize history if empty
    if (navigationHistory.length === 0) {
        navigationHistory.push('index.html');
    }
    
    console.log(`Navigating from ${currentPath} to ${page}, history:`, navigationHistory);
    
    // Map page identifiers to HTML files
    const pageMap = {
        'overview': 'index.html',
        'index.html': 'index.html',
        'index': 'index.html',
        'home': 'index.html',
        'source-analysis': 'source_analysis.html',
        'source_analysis': 'source_analysis.html',
        'source_analysis.html': 'source_analysis.html',
        'forecasting': 'forecasting.html',
        'forecasting.html': 'forecasting.html',
        'community': 'citizen_portal.html',
        'citizen_portal': 'citizen_portal.html',
        'citizen_portal.html': 'citizen_portal.html',
        'policy-dashboard': 'policy_dashboard.html',
        'policy_dashboard': 'policy_dashboard.html',
        'policy_dashboard.html': 'policy_dashboard.html'
    };
    
    // Get the target page, or use the page parameter directly if it's already an HTML file
    const targetPage = pageMap[page] || (page.endsWith('.html') ? page : 'index.html');
    
    console.log(`Navigating to: ${targetPage}`);
    window.location.href = targetPage;
}

// Make navigateToPage globally available
window.navigateToPage = navigateToPage;

// Go back to previous page/section
function goBack() {
    try {
        console.log('goBack() called, history:', navigationHistory);
        
        // Always allow going back to home/index
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        
        // If we're on a different page, always go to index.html
        if (currentPath !== 'index.html' && currentPath !== '') {
            console.log('Navigating back to index.html from:', currentPath);
            window.location.href = 'index.html';
            return;
        }
        
        // If we're on index.html, check if we're in a section
        const currentHash = window.location.hash.replace('#', '');
        
        // If we're in a section (not home), go to home
        if (currentHash && currentHash !== 'home' && currentHash !== '') {
            console.log('Going back to home section from:', currentHash);
            scrollToSection('home');
            window.history.pushState({}, '', 'index.html#home');
            return;
        }
        
        // If we're already at home, check history
        if (navigationHistory.length > 1) {
            // Remove current section from history
            navigationHistory.pop();
            const previousPage = navigationHistory[navigationHistory.length - 1];
            console.log(`Going back to: ${previousPage}`);
            
            if (previousPage && previousPage.includes('#')) {
                // It's a section, scroll to it
                const sectionId = previousPage.split('#')[1];
                scrollToSection(sectionId);
            } else if (previousPage && previousPage !== 'index.html' && previousPage !== 'home') {
                // It's a page, navigate to it
                navigateToPage(previousPage);
            } else {
                // Go to home section
                scrollToSection('home');
            }
        } else {
            // No history, ensure we're at home
            console.log('No history, ensuring we are at home');
            scrollToSection('home');
            navigationHistory = ['home'];
        }
        
        // Update back button visibility
        const backButton = document.getElementById('backButton');
        if (backButton) {
            const currentSection = window.location.hash.replace('#', '') || 'home';
            if (currentSection === 'home' || currentSection === '') {
                backButton.style.display = 'none';
            } else {
                backButton.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error in goBack():', error);
        // Fallback: always go to home
        window.location.href = 'index.html#home';
    }
}

// Make goBack globally available
window.goBack = goBack;

// Update navigation active state
function updateActiveNav(currentPage) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current page
    const activeLink = document.querySelector(`[href="${currentPage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Also check for data-section attributes
    document.querySelectorAll('[data-section]').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === currentPage.replace('.html', '')) {
            link.classList.add('active');
        }
    });
}

// Handle dashboard section buttons
function handleDashboardNavigation(action) {
    console.log(`Dashboard action: ${action}`);
    
    switch(action) {
        case 'view-source-analysis':
            navigateToPage('source-analysis');
            break;
        case 'view-forecasting':
            navigateToPage('forecasting');
            break;
        case 'view-community':
            navigateToPage('community');
            break;
        case 'view-policy-dashboard':
            navigateToPage('policy-dashboard');
            break;
        case 'scroll-to-dashboard':
            scrollToSection('dashboard');
            break;
        case 'scroll-to-alerts':
            scrollToSection('alerts');
            break;
        case 'scroll-to-forecast':
            scrollToSection('forecast');
            break;
        case 'scroll-to-pollution-monitoring':
        case 'scroll-to-pollution-sources':
            scrollToSection('pollution-monitoring');
            break;
        case 'scroll-to-community':
            scrollToSection('community');
            break;
        case 'go-back':
            goBack();
            break;
        default:
            console.warn(`Unknown dashboard action: ${action}`);
    }
}

// Reinitialize dashboard functionality
function reinitializeDashboard() {
    console.log('Reinitializing dashboard functionality...');
    
    // Re-setup all event listeners
    setupEventListeners();
    
    // Reinitialize charts if they exist
    if (typeof window.forecastChart !== 'undefined') {
        try {
            window.forecastChart.init();
        } catch (e) {
            console.log('Forecast chart not available');
        }
    }
    
    // Reinitialize pollution map if it exists
    if (typeof window.pollutionMap !== 'undefined') {
        try {
            window.pollutionMap.init();
        } catch (e) {
            console.log('Pollution map not available');
        }
    }
    
    // Reinitialize real-time data
    if (typeof window.realtimeDataFetcher !== 'undefined') {
        try {
            window.realtimeDataFetcher.init();
        } catch (e) {
            console.log('Real-time data fetcher not available');
        }
    }
    
    // Reinitialize theme toggle
    if (typeof window.themeToggle !== 'undefined') {
        try {
            window.themeToggle.init();
        } catch (e) {
            console.log('Theme toggle not available');
        }
    }
    
    // Reinitialize notifications
    if (typeof window.notifications !== 'undefined') {
        try {
            window.notifications.init();
        } catch (e) {
            console.log('Notifications not available');
        }
    }
    
    // Reinitialize hero animations
    if (typeof window.heroAnimations !== 'undefined') {
        try {
            window.heroAnimations.init();
        } catch (e) {
            console.log('Hero animations not available');
        }
    }
    
    // Force re-render of any charts or visualizations
    setTimeout(() => {
        // Trigger resize events for charts
        window.dispatchEvent(new Event('resize'));
        
        // Re-trigger any lazy-loaded components
        const lazyElements = document.querySelectorAll('[data-lazy]');
        lazyElements.forEach(element => {
            if (element.dataset.lazy === 'chart') {
                // Reinitialize chart
                const chartId = element.id;
                if (chartId && window[chartId]) {
                    try {
                        window[chartId].update();
                    } catch (e) {
                        console.log(`Chart ${chartId} not available for update`);
                    }
                }
            }
        });
    }, 100);
}

// Setup event listeners
function setupEventListeners() {
    // Remove existing listeners to prevent duplicates
    const oldHandler = window._navigationClickHandler;
    if (oldHandler) {
        document.removeEventListener('click', oldHandler, true);
    }
    
    // Store handler reference for cleanup
    window._navigationClickHandler = handleClick;
    
    // Add new listeners with capture phase for better reliability
    document.addEventListener('click', handleClick, true);
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', handlePopState);
    
    console.log('Navigation event listeners set up');
}

// Handle click events
function handleClick(e) {
    // Handle navigation links - FIXED: Let modern-ui.js handle section navigation
    if (e.target.closest('.nav-link')) {
        const navLink = e.target.closest('.nav-link');
        const href = navLink.getAttribute('href');
        
        // Only handle page navigation for external links, let modern-ui.js handle section scrolling
        if (href && href.includes('.html') && !href.startsWith('#')) {
            e.preventDefault();
            e.stopPropagation();
            
            // Use the full href directly, or extract page name properly
            let page = href;
            
            // Map HTML file names to page identifiers
            if (href === 'index.html') {
                page = 'overview';
            } else if (href === 'source_analysis.html') {
                page = 'source-analysis';
            } else if (href === 'forecasting.html') {
                page = 'forecasting';
            } else if (href === 'citizen_portal.html') {
                page = 'community';
            } else if (href === 'policy_dashboard.html') {
                page = 'policy-dashboard';
            } else {
                // Use the href as-is if it's already an HTML file
                page = href;
            }
            
            console.log(`Navigating to page: ${page} (from href: ${href})`);
            navigateToPage(page);
            return false;
        }
        // For hash links (#section), let modern-ui.js handle them
    }
    
    // Handle dashboard buttons
    if (e.target.closest('[onclick*="scrollToSection"]')) {
        const button = e.target.closest('[onclick*="scrollToSection"]');
        const onclick = button.getAttribute('onclick');
        
        if (onclick.includes('dashboard')) {
            e.preventDefault();
            handleDashboardNavigation('scroll-to-dashboard');
        } else if (onclick.includes('alerts')) {
            e.preventDefault();
            handleDashboardNavigation('scroll-to-alerts');
        } else if (onclick.includes('forecast')) {
            e.preventDefault();
            handleDashboardNavigation('scroll-to-forecast');
        } else if (onclick.includes('community')) {
            e.preventDefault();
            handleDashboardNavigation('scroll-to-community');
        }
    }
    
    // Handle feature buttons
    if (e.target.closest('.btn-feature')) {
        const button = e.target.closest('.btn-feature');
        const text = button.textContent.toLowerCase();
        
        e.preventDefault();
        
        if (text.includes('report') || text.includes('challenge') || text.includes('forum')) {
            handleDashboardNavigation('view-community');
        }
    }
    
    // Handle back button
    if (e.target.closest('.btn-back') || e.target.closest('#backButton')) {
        e.preventDefault();
        console.log('Back button clicked');
        goBack();
    }
}

// Handle browser back/forward
function handlePopState(e) {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        scrollToSection(hash);
    }
}

// Handle page visibility changes
function handleVisibilityChange() {
    if (!document.hidden) {
        console.log('Page became visible, reinitializing dashboard...');
        setTimeout(reinitializeDashboard, 100);
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing navigation system...');
    
    // Hide loading indicator quickly
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        setTimeout(() => {
            loadingIndicator.classList.add('hidden');
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 300);
        }, 500); // Reduced from 1000 to 500
    }
    
    // Update current page
    currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Initialize navigation history if empty
    if (navigationHistory.length === 0) {
        navigationHistory.push(currentPage);
    }
    
    // Update active navigation based on current page
    updateActiveNav(currentPage);
    
    // Setup event listeners
    setupEventListeners();
    document.documentElement.setAttribute('data-navigation-initialized', 'true');
    
    // Setup back button click handler
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Back button clicked via event listener');
            goBack();
        });
    }
    
    // Handle hash navigation
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        setTimeout(() => scrollToSection(hash), 100);
    }
    
    // Reinitialize dashboard functionality
    setTimeout(reinitializeDashboard, 300); // Reduced from 500
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for focus events (when user returns to tab)
    window.addEventListener('focus', () => {
        console.log('Window focused, checking dashboard state...');
        setTimeout(reinitializeDashboard, 100);
    });
    
    console.log('Navigation system initialized successfully');
});

// Also initialize when window loads (fallback for defer scripts)
window.addEventListener('load', function() {
    console.log('Window loaded, ensuring navigation is initialized...');
    
    // Double-check that event listeners are set up
    const root = document.documentElement || document.body;
    if (!root.hasAttribute('data-navigation-initialized')) {
        console.log('Re-initializing navigation system...');
        setupEventListeners();
        root.setAttribute('data-navigation-initialized', 'true');
    }
});

// Debug function to check navigation state
function debugNavigation() {
    console.log('=== Navigation Debug Info ===');
    console.log('Current page:', currentPage);
    console.log('Navigation history:', navigationHistory);
    console.log('Navigation links found:', document.querySelectorAll('.nav-link').length);
    console.log('Event listeners attached:', document.hasAttribute('data-navigation-initialized'));
    console.log('Back button found:', document.querySelector('.btn-back') ? 'Yes' : 'No');
    console.log('================================');
}

// Update back button visibility
function updateBackButtonVisibility(currentSection) {
    const backButton = document.getElementById('backButton');
    if (backButton) {
        if (currentSection === 'home' || navigationHistory.length <= 1) {
            backButton.style.display = 'none';
        } else {
            backButton.style.display = 'flex';
        }
    }
}

// Make debug function globally available
window.debugNavigation = debugNavigation;
