// Advanced Theme Toggle System for AirWatch AI

class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.systemPreference = 'dark';
        this.themeHistory = [];
        this.autoSwitchEnabled = false;
        this.scheduleData = null;
        
        this.init();
    }

    init() {
        this.detectSystemPreference();
        this.loadSavedTheme();
        this.createThemeToggle();
        this.setupEventListeners();
        this.applyTheme();
        this.setupAutoSwitch();
        this.initializeThemeAnimations();
    }

    detectSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.systemPreference = 'dark';
        } else {
            this.systemPreference = 'light';
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                this.systemPreference = e.matches ? 'dark' : 'light';
                if (this.currentTheme === 'auto') {
                    this.applyTheme();
                }
            });
        }
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('airwatch-theme');
        const savedSchedule = localStorage.getItem('airwatch-theme-schedule');
        
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            this.currentTheme = 'dark'; // Default to dark mode instead of auto
        }

        if (savedSchedule) {
            this.scheduleData = JSON.parse(savedSchedule);
            this.setupScheduledTheme();
        }
    }

    createThemeToggle() {
        // Check if theme toggle already exists in HTML
        const existingToggle = document.getElementById('themeToggle');
        const existingContainer = document.querySelector('.theme-toggle-container');
        
        if (existingToggle && existingContainer) {
            // Use existing toggle, ensure menu exists
            let themeMenu = document.getElementById('themeMenu');
            if (!themeMenu) {
                themeMenu = document.createElement('div');
                themeMenu.className = 'theme-menu';
                themeMenu.id = 'themeMenu';
                themeMenu.innerHTML = `
                    <div class="theme-option ${this.currentTheme === 'light' ? 'active' : ''}" data-theme="light">
                        <i class="fas fa-sun"></i>
                        <span>Light</span>
                    </div>
                    <div class="theme-option ${this.currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">
                        <i class="fas fa-moon"></i>
                        <span>Dark</span>
                    </div>
                    <div class="theme-option ${this.currentTheme === 'auto' ? 'active' : ''}" data-theme="auto">
                        <i class="fas fa-adjust"></i>
                        <span>Auto</span>
                    </div>
                    <div class="theme-separator"></div>
                    <div class="theme-option" id="themeSchedule">
                        <i class="fas fa-clock"></i>
                        <span>Schedule</span>
                    </div>
                `;
                existingContainer.appendChild(themeMenu);
            }
            console.log('Using existing theme toggle from HTML');
            return;
        }

        // Create new theme toggle if it doesn't exist
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;

        const themeToggleContainer = document.createElement('div');
        themeToggleContainer.className = 'theme-toggle-container';
        themeToggleContainer.innerHTML = `
            <button class="btn-theme-toggle" id="themeToggle" title="Toggle Theme">
                <i class="fas fa-moon"></i>
            </button>
            <div class="theme-menu" id="themeMenu">
                <div class="theme-option ${this.currentTheme === 'light' ? 'active' : ''}" data-theme="light">
                    <i class="fas fa-sun"></i>
                    <span>Light</span>
                </div>
                <div class="theme-option ${this.currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">
                    <i class="fas fa-moon"></i>
                    <span>Dark</span>
                </div>
                <div class="theme-option ${this.currentTheme === 'auto' ? 'active' : ''}" data-theme="auto">
                    <i class="fas fa-adjust"></i>
                    <span>Auto</span>
                </div>
                <div class="theme-separator"></div>
                <div class="theme-option" id="themeSchedule">
                    <i class="fas fa-clock"></i>
                    <span>Schedule</span>
                </div>
            </div>
        `;

        // Insert before existing buttons
        navActions.insertBefore(themeToggleContainer, navActions.firstChild);
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        const themeMenu = document.getElementById('themeMenu');
        
        if (!themeToggle) {
            console.error('Theme toggle button not found!');
            return;
        }

        // Remove any existing listeners by using a named function
        const toggleHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Theme toggle clicked');
            this.toggleThemeMenu();
        };
        
        // Remove old listener if exists
        themeToggle.removeEventListener('click', this._toggleHandler);
        this._toggleHandler = toggleHandler;
        themeToggle.addEventListener('click', toggleHandler);

        // Setup theme option listeners
        const themeOptions = document.querySelectorAll('.theme-option[data-theme]');
        themeOptions.forEach((option, index) => {
            const optionHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const theme = option.dataset.theme;
                console.log('Theme selected:', theme);
                this.setTheme(theme);
                this.closeThemeMenu();
            };
            
            // Remove old listener
            option.removeEventListener('click', this[`_optionHandler${index}`]);
            this[`_optionHandler${index}`] = optionHandler;
            option.addEventListener('click', optionHandler);
        });

        // Setup schedule option
        const scheduleOption = document.getElementById('themeSchedule');
        if (scheduleOption) {
            const scheduleHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showScheduleModal();
            };
            
            scheduleOption.removeEventListener('click', this._scheduleHandler);
            this._scheduleHandler = scheduleHandler;
            scheduleOption.addEventListener('click', scheduleHandler);
        }

        // Close menu when clicking outside
        const closeHandler = (e) => {
            if (themeMenu && themeMenu.classList.contains('active')) {
                // Don't close if clicking inside the menu or toggle button
                if (!themeMenu.contains(e.target) && !themeToggle.contains(e.target)) {
                    this.closeThemeMenu();
                }
            }
        };
        
        // Remove old listener and add new one
        document.removeEventListener('click', this._closeHandler);
        this._closeHandler = closeHandler;
        document.addEventListener('click', closeHandler);

        // Prevent menu from closing when clicking inside
        if (themeMenu) {
            themeMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        console.log('Theme toggle event listeners set up successfully');
    }

    toggleThemeMenu() {
        const themeMenu = document.getElementById('themeMenu');
        if (themeMenu) {
            const isActive = themeMenu.classList.contains('active');
            if (isActive) {
                themeMenu.classList.remove('active');
                console.log('Theme menu closed');
            } else {
                themeMenu.classList.add('active');
                console.log('Theme menu opened');
            }
        } else {
            console.error('Theme menu not found!');
        }
    }

    closeThemeMenu() {
        const themeMenu = document.getElementById('themeMenu');
        if (themeMenu) {
            themeMenu.classList.remove('active');
        }
    }

    setTheme(theme) {
        if (this.currentTheme === theme) return;

        this.themeHistory.push({
            from: this.currentTheme,
            to: theme,
            timestamp: Date.now()
        });

        // Keep only last 10 theme changes
        if (this.themeHistory.length > 10) {
            this.themeHistory.shift();
        }

        this.currentTheme = theme;
        this.applyTheme();
        this.saveTheme();
        this.updateThemeToggle();
        this.animateThemeTransition();
    }

    applyTheme() {
        const body = document.body;
        const html = document.documentElement;
        const effectiveTheme = this.currentTheme === 'auto' ? this.systemPreference : this.currentTheme;
        
        console.log('Applying theme:', effectiveTheme);
        
        // Remove existing theme classes
        body.classList.remove('light-theme', 'dark-theme', 'auto-theme');
        html.classList.remove('light-theme', 'dark-theme', 'auto-theme');
        
        // Add new theme class
        body.classList.add(`${effectiveTheme}-theme`);
        html.classList.add(`${effectiveTheme}-theme`);
        
        // Set data attribute for CSS
        body.setAttribute('data-theme', effectiveTheme);
        html.setAttribute('data-theme', effectiveTheme);
        
        // Update theme toggle icon
        this.updateThemeIcon(effectiveTheme);
        
        // Apply theme-specific animations
        this.applyThemeAnimations(effectiveTheme);
        
        // Update charts and visualizations
        this.updateVisualizations(effectiveTheme);
    }

    updateThemeIcon(effectiveTheme) {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const icon = themeToggle.querySelector('i');
        if (!icon) return;

        const icons = {
            light: 'fas fa-sun',
            dark: 'fas fa-moon',
            auto: 'fas fa-adjust'
        };

        icon.className = icons[effectiveTheme] || icons.dark;
    }

    updateThemeToggle() {
        const themeOptions = document.querySelectorAll('.theme-option[data-theme]');
        themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === this.currentTheme) {
                option.classList.add('active');
            }
        });
    }

    animateThemeTransition() {
        const body = document.body;
        body.classList.add('theme-transition');
        
        setTimeout(() => {
            body.classList.remove('theme-transition');
        }, 300);
    }

    applyThemeAnimations(theme) {
        // Add theme-specific particle effects
        const heroParticles = document.querySelector('.hero-particles');
        if (heroParticles) {
            heroParticles.className = `hero-particles theme-${theme}`;
        }

        // Update gradient animations
        const gradientElements = document.querySelectorAll('.gradient-text');
        gradientElements.forEach(element => {
            element.className = `gradient-text theme-${theme}`;
        });

        // Update card hover effects
        const cards = document.querySelectorAll('.holographic-card, .stat-card, .feature-card');
        cards.forEach(card => {
            card.className = `${card.className.split(' ')[0]} theme-${theme}`;
        });
    }

    updateVisualizations(theme) {
        // Update chart colors if charts are loaded
        if (window.pollutionMap && window.pollutionMap.updateTheme) {
            window.pollutionMap.updateTheme(theme);
        }
        
        if (window.forecastChart && window.forecastChart.updateTheme) {
            window.forecastChart.updateTheme(theme);
        }

        // Update particle system colors
        if (window.heroAnimations && window.heroAnimations.updateTheme) {
            window.heroAnimations.updateTheme(theme);
        }
    }

    setupAutoSwitch() {
        // Set up automatic theme switching based on time
        if (this.scheduleData) {
            this.scheduleThemeSwitching();
        }

        // Check for automatic switching every minute
        setInterval(() => {
            if (this.autoSwitchEnabled) {
                this.checkAutoSwitch();
            }
        }, 60000);
    }

    scheduleThemeSwitching() {
        if (!this.scheduleData) return;

        const now = new Date();
        const currentHour = now.getHours();
        
        // Check if current time matches schedule
        if (this.scheduleData.lightStart <= currentHour && currentHour < this.scheduleData.darkStart) {
            if (this.currentTheme !== 'light') {
                this.setTheme('light');
            }
        } else if (this.scheduleData.darkStart <= currentHour || currentHour < this.scheduleData.lightStart) {
            if (this.currentTheme !== 'dark') {
                this.setTheme('dark');
            }
        }
    }

    checkAutoSwitch() {
        // Implement automatic switching logic based on various factors
        const now = new Date();
        const hour = now.getHours();
        
        // Simple time-based switching
        if (hour >= 6 && hour < 18) {
            // Daytime - prefer light theme
            if (this.currentTheme === 'auto' && this.systemPreference === 'dark') {
                this.setTheme('light');
            }
        } else {
            // Nighttime - prefer dark theme
            if (this.currentTheme === 'auto' && this.systemPreference === 'light') {
                this.setTheme('dark');
            }
        }
    }

    showScheduleModal() {
        const modal = document.createElement('div');
        modal.className = 'theme-schedule-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Theme Schedule</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="schedule-option">
                        <label>
                            <input type="checkbox" id="enableSchedule" ${this.scheduleData ? 'checked' : ''}>
                            Enable automatic theme switching
                        </label>
                    </div>
                    <div class="schedule-times" id="scheduleTimes" style="display: ${this.scheduleData ? 'block' : 'none'}">
                        <div class="time-input">
                            <label>Switch to Light Theme at:</label>
                            <input type="time" id="lightStart" value="${this.scheduleData?.lightStart || '06:00'}" ${!this.scheduleData ? 'disabled' : ''}>
                        </div>
                        <div class="time-input">
                            <label>Switch to Dark Theme at:</label>
                            <input type="time" id="darkStart" value="${this.scheduleData?.darkStart || '18:00'}" ${!this.scheduleData ? 'disabled' : ''}>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-secondary" id="cancelSchedule">Cancel</button>
                        <button class="btn-primary" id="saveSchedule">Save Schedule</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Event listeners
        const enableSchedule = document.getElementById('enableSchedule');
        const scheduleTimes = document.getElementById('scheduleTimes');
        const lightStart = document.getElementById('lightStart');
        const darkStart = document.getElementById('darkStart');
        const cancelBtn = document.getElementById('cancelSchedule');
        const saveBtn = document.getElementById('saveSchedule');
        const closeBtn = modal.querySelector('.close-modal');

        enableSchedule.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            scheduleTimes.style.display = enabled ? 'block' : 'none';
            lightStart.disabled = !enabled;
            darkStart.disabled = !enabled;
        });

        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        saveBtn.addEventListener('click', () => {
            const enabled = enableSchedule.checked;
            
            if (enabled) {
                this.scheduleData = {
                    lightStart: lightStart.value,
                    darkStart: darkStart.value
                };
                localStorage.setItem('airwatch-theme-schedule', JSON.stringify(this.scheduleData));
                this.autoSwitchEnabled = true;
            } else {
                this.scheduleData = null;
                localStorage.removeItem('airwatch-theme-schedule');
                this.autoSwitchEnabled = false;
            }
            
            closeModal();
        });
    }

    initializeThemeAnimations() {
        // Add CSS for theme transitions
        const style = document.createElement('style');
        style.textContent = `
            .theme-transition {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
            }
            
            .theme-transition * {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
            }
            
            .theme-light .hero-particles {
                background: 
                    radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 30%),
                    radial-gradient(circle at 90% 80%, rgba(147, 51, 234, 0.08) 0%, transparent 30%),
                    radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 40%);
            }
            
            .theme-dark .hero-particles {
                background: 
                    radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 30%),
                    radial-gradient(circle at 90% 80%, rgba(147, 51, 234, 0.05) 0%, transparent 30%),
                    radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.03) 0%, transparent 40%);
            }
        `;
        document.head.appendChild(style);
    }

    saveTheme() {
        localStorage.setItem('airwatch-theme', this.currentTheme);
    }

    getThemeHistory() {
        return this.themeHistory;
    }

    resetTheme() {
        localStorage.removeItem('airwatch-theme');
        localStorage.removeItem('airwatch-theme-schedule');
        this.currentTheme = 'dark'; // Default to dark mode instead of auto
        this.scheduleData = null;
        this.autoSwitchEnabled = false;
        this.applyTheme();
        this.createThemeToggle();
    }

    // Public methods for external use
    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getEffectiveTheme() {
        return this.currentTheme === 'auto' ? this.systemPreference : this.currentTheme;
    }
}

// Initialize theme manager
function initThemeManager() {
    if (!window.themeManager) {
        try {
            window.themeManager = new ThemeManager();
            // Update icon immediately
            const effectiveTheme = window.themeManager.getEffectiveTheme();
            window.themeManager.updateThemeIcon(effectiveTheme);
            console.log('Theme Manager initialized successfully');
            
            // Verify button is clickable
            const btn = document.getElementById('themeToggle');
            if (btn) {
                console.log('Theme toggle button found and ready');
            } else {
                console.error('Theme toggle button not found after initialization!');
            }
        } catch (error) {
            console.error('Error initializing Theme Manager:', error);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initThemeManager, 300);
    });
} else {
    // DOM already loaded
    setTimeout(initThemeManager, 300);
}

// Also try after a longer delay as fallback
setTimeout(() => {
    if (!window.themeManager) {
        console.warn('Theme Manager not initialized, retrying...');
        initThemeManager();
    }
}, 1000);

// Add theme toggle styles
const themeToggleStyles = `
<style>
.theme-toggle-container {
    position: relative;
    display: inline-block;
}

.btn-theme-toggle {
    width: 40px;
    height: 40px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    color: var(--text-primary);
    cursor: pointer;
    transition: var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
}

.btn-theme-toggle:hover {
    background: rgba(59, 130, 246, 0.2);
    transform: translateY(-2px);
}

.theme-menu {
    position: absolute;
    top: 50px;
    right: 0;
    background: var(--bg-overlay);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 8px;
    min-width: 120px;
    box-shadow: 0 20px 40px var(--shadow-color);
    backdrop-filter: blur(20px);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    z-index: 1000;
}

.theme-menu.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.theme-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: var(--transition-fast);
    color: var(--text-secondary);
    font-size: 14px;
}

.theme-option:hover {
    background: rgba(59, 130, 246, 0.1);
    color: var(--text-primary);
}

.theme-option.active {
    background: rgba(59, 130, 246, 0.2);
    color: var(--text-primary);
}

.theme-separator {
    height: 1px;
    background: var(--border-color);
    margin: 4px 0;
}

.theme-schedule-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(10px);
}

.modal-content {
    background: var(--bg-overlay);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    backdrop-filter: blur(20px);
    box-shadow: 0 30px 60px var(--shadow-color);
    animation: modalSlideIn 0.3s ease-out;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
}

.close-modal {
    background: none;
    border: none;
    color: var(--text-muted);
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

.close-modal:hover {
    background: rgba(239, 68, 68, 0.2);
    color: var(--danger-color);
}

.schedule-option {
    margin-bottom: 1.5rem;
}

.schedule-option label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);
    font-weight: 500;
    cursor: pointer;
}

.schedule-times {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.time-input {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.time-input label {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
}

.time-input input {
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-card);
    color: var(--text-primary);
    font-size: 14px;
    transition: var(--transition-fast);
}

.time-input input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.time-input input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@media (max-width: 768px) {
    .theme-menu {
        right: -50px;
    }
    
    .modal-content {
        margin: 1rem;
        padding: 1.5rem;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', themeToggleStyles);
