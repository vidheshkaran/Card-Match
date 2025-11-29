// Advanced Notifications System for AirWatch AI

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.permission = 'default';
        this.soundEnabled = true;
        this.vibrationEnabled = true;
        this.autoHide = true;
        this.maxNotifications = 5;
        this.init();
    }

    init() {
        this.requestPermission();
        this.loadNotifications();
        this.setupEventListeners();
        this.startRealTimeUpdates();
    }

    async requestPermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
        }
    }

    loadNotifications() {
        // Load saved notifications
        const saved = localStorage.getItem('airwatch-notifications');
        if (saved) {
            this.notifications = JSON.parse(saved);
        } else {
            // Generate initial notifications
            this.generateInitialNotifications();
        }
    }

    generateInitialNotifications() {
        this.notifications = [
            {
                id: 1,
                type: 'critical',
                title: 'High AQI Alert',
                message: 'AQI levels have reached 287 in Central Delhi. Limit outdoor activities.',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                read: false,
                priority: 'high',
                actions: [
                    { label: 'View Details', action: 'view' },
                    { label: 'Set Alert', action: 'alert' }
                ]
            },
            {
                id: 2,
                type: 'warning',
                title: 'Stubble Burning Detected',
                message: 'Satellite imagery shows active fires in Haryana region.',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                read: false,
                priority: 'medium',
                actions: [
                    { label: 'View Map', action: 'map' }
                ]
            },
            {
                id: 3,
                type: 'info',
                title: 'Weather Update',
                message: 'Wind speed decreased to 8 km/h, pollution may persist.',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                read: true,
                priority: 'low'
            }
        ];
        this.saveNotifications();
    }

    setupEventListeners() {
        // Listen for real-time updates
        window.addEventListener('storage', (e) => {
            if (e.key === 'airwatch-notifications') {
                this.notifications = JSON.parse(e.newValue);
                this.updateNotificationBadge();
            }
        });
    }

    startRealTimeUpdates() {
        // Simulate real-time notifications
        setInterval(() => {
            this.checkForNewNotifications();
        }, 30000); // Check every 30 seconds
    }

    async checkForNewNotifications() {
        try {
            const response = await fetch('/api/modern/alerts/realtime');
            const data = await response.json();
            
            // Check for new alerts
            data.alerts.forEach(alert => {
                const exists = this.notifications.find(n => n.id === alert.id);
                if (!exists) {
                    this.addNotification({
                        id: alert.id,
                        type: alert.type,
                        title: alert.title,
                        message: alert.message,
                        timestamp: alert.timestamp,
                        read: false,
                        priority: alert.severity === 'High' ? 'high' : alert.severity === 'Medium' ? 'medium' : 'low',
                        actions: alert.recommendations ? [
                            { label: 'View Recommendations', action: 'recommendations' }
                        ] : []
                    });
                }
            });
        } catch (error) {
            console.log('Using mock notification updates');
            this.generateMockNotification();
        }
    }

    generateMockNotification() {
        const types = ['info', 'warning', 'critical'];
        const titles = [
            'AQI Update',
            'Weather Change',
            'Policy Alert',
            'Community Update',
            'Sensor Status'
        ];
        const messages = [
            'AQI levels have changed significantly',
            'Weather conditions are affecting air quality',
            'New policy measures have been implemented',
            'Community challenge completed',
            'Sensor network status update'
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        const title = titles[Math.floor(Math.random() * titles.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        this.addNotification({
            id: Date.now(),
            type: type,
            title: title,
            message: message,
            timestamp: new Date().toISOString(),
            read: false,
            priority: type === 'critical' ? 'high' : type === 'warning' ? 'medium' : 'low'
        });
    }

    addNotification(notification) {
        // Add to beginning of array
        this.notifications.unshift(notification);
        
        // Limit number of notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }
        
        this.saveNotifications();
        this.showNotification(notification);
        this.updateNotificationBadge();
        
        // Send browser notification
        this.sendBrowserNotification(notification);
    }

    showNotification(notification) {
        const container = this.getNotificationContainer();
        
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.type} ${notification.read ? 'read' : ''}`;
        notificationElement.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-header">
                    <h4 class="notification-title">${notification.title}</h4>
                    <span class="notification-time">${this.formatTime(notification.timestamp)}</span>
                </div>
                <p class="notification-message">${notification.message}</p>
                ${notification.actions ? `
                    <div class="notification-actions">
                        ${notification.actions.map(action => `
                            <button class="action-btn" data-action="${action.action}">${action.label}</button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="notification-controls">
                <button class="mark-read" title="Mark as read">
                    <i class="fas fa-check"></i>
                </button>
                <button class="delete-notification" title="Delete">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add click handlers
        notificationElement.querySelector('.mark-read').addEventListener('click', () => {
            this.markAsRead(notification.id);
        });
        
        notificationElement.querySelector('.delete-notification').addEventListener('click', () => {
            this.deleteNotification(notification.id);
        });
        
        if (notification.actions) {
            notificationElement.querySelectorAll('.action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.handleNotificationAction(notification, e.target.dataset.action);
                });
            });
        }
        
        container.appendChild(notificationElement);
        
        // Auto-hide after delay
        if (this.autoHide) {
            setTimeout(() => {
                if (notificationElement.parentNode) {
                    notificationElement.style.opacity = '0';
                    notificationElement.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notificationElement.parentNode) {
                            notificationElement.remove();
                        }
                    }, 300);
                }
            }, 5000);
        }
        
        // Add animation
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 100);
    }

    getNotificationContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    getNotificationIcon(type) {
        const icons = {
            critical: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle',
            success: 'check-circle'
        };
        return icons[type] || 'bell';
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationBadge();
            this.updateNotificationDisplay();
        }
    }

    deleteNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.updateNotificationBadge();
        this.updateNotificationDisplay();
    }

    handleNotificationAction(notification, action) {
        switch (action) {
            case 'view':
                // Navigate to relevant page
                window.location.href = '/source_analysis.html';
                break;
            case 'alert':
                // Show alert settings
                this.showAlertSettings();
                break;
            case 'map':
                // Show map with relevant data
                window.location.href = '/source_analysis.html#map';
                break;
            case 'recommendations':
                // Show recommendations
                this.showRecommendations(notification);
                break;
        }
    }

    showAlertSettings() {
        // Create alert settings modal
        const modal = document.createElement('div');
        modal.className = 'alert-settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Alert Settings</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="soundEnabled" ${this.soundEnabled ? 'checked' : ''}>
                            Enable notification sounds
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="vibrationEnabled" ${this.vibrationEnabled ? 'checked' : ''}>
                            Enable vibration
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="autoHide" ${this.autoHide ? 'checked' : ''}>
                            Auto-hide notifications
                        </label>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Event listeners
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => modal.remove());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Save settings
        const inputs = modal.querySelectorAll('input[type="checkbox"]');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.soundEnabled = document.getElementById('soundEnabled').checked;
                this.vibrationEnabled = document.getElementById('vibrationEnabled').checked;
                this.autoHide = document.getElementById('autoHide').checked;
                this.saveSettings();
            });
        });
    }

    showRecommendations(notification) {
        // Show recommendations based on notification
        const recommendations = [
            'Avoid outdoor activities',
            'Use N95 masks when going out',
            'Keep windows and doors closed',
            'Use air purifiers indoors'
        ];
        
        const modal = document.createElement('div');
        modal.className = 'recommendations-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Health Recommendations</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <ul class="recommendations-list">
                        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => modal.remove());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    sendBrowserNotification(notification) {
        if (this.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id.toString()
            });
            
            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();
            };
            
            // Auto-close browser notification
            setTimeout(() => {
                browserNotification.close();
            }, 5000);
        }
    }

    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const unreadCount = this.notifications.filter(n => !n.read).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    updateNotificationDisplay() {
        // Update notification panel if open
        const panel = document.querySelector('.notification-panel');
        if (panel) {
            this.showNotificationPanel();
        }
    }

    showNotificationPanel() {
        const panel = document.createElement('div');
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-header">
                <h3>Notifications</h3>
                <div class="notification-controls">
                    <button class="mark-all-read">Mark All Read</button>
                    <button class="close-notifications">&times;</button>
                </div>
            </div>
            <div class="notification-list">
                ${this.notifications.map(notification => `
                    <div class="notification-item ${notification.type} ${notification.read ? 'read' : ''}">
                        <div class="notification-icon">
                            <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                        </div>
                        <div class="notification-content">
                            <div class="notification-header">
                                <h4>${notification.title}</h4>
                                <span class="notification-time">${this.formatTime(notification.timestamp)}</span>
                            </div>
                            <p>${notification.message}</p>
                        </div>
                        <div class="notification-controls">
                            <button class="mark-read" data-id="${notification.id}">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="delete-notification" data-id="${notification.id}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Event listeners
        panel.querySelector('.close-notifications').addEventListener('click', () => {
            panel.remove();
        });
        
        panel.querySelector('.mark-all-read').addEventListener('click', () => {
            this.notifications.forEach(n => n.read = true);
            this.saveNotifications();
            this.updateNotificationBadge();
            panel.remove();
        });
        
        panel.querySelectorAll('.mark-read').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.markAsRead(id);
                panel.remove();
            });
        });
        
        panel.querySelectorAll('.delete-notification').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.deleteNotification(id);
                panel.remove();
            });
        });
    }

    saveNotifications() {
        localStorage.setItem('airwatch-notifications', JSON.stringify(this.notifications));
    }

    saveSettings() {
        localStorage.setItem('airwatch-notification-settings', JSON.stringify({
            soundEnabled: this.soundEnabled,
            vibrationEnabled: this.vibrationEnabled,
            autoHide: this.autoHide
        }));
    }

    loadSettings() {
        const saved = localStorage.getItem('airwatch-notification-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.soundEnabled = settings.soundEnabled;
            this.vibrationEnabled = settings.vibrationEnabled;
            this.autoHide = settings.autoHide;
        }
    }
}

// Initialize notification system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notificationSystem = new NotificationSystem();
});

// Add notification styles
const notificationStyles = `
<style>
.notification-container {
    position: fixed;
    top: 100px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 350px;
}

.notification-item {
    background: var(--bg-overlay);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    backdrop-filter: blur(20px);
    box-shadow: 0 10px 25px var(--shadow-color);
    display: flex;
    gap: 12px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    position: relative;
}

.notification-item.show {
    opacity: 1;
    transform: translateX(0);
}

.notification-item.critical {
    border-left: 4px solid var(--danger-color);
}

.notification-item.warning {
    border-left: 4px solid var(--warning-color);
}

.notification-item.info {
    border-left: 4px solid var(--primary-color);
}

.notification-item.success {
    border-left: 4px solid var(--success-color);
}

.notification-item.read {
    opacity: 0.7;
}

.notification-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.notification-item.critical .notification-icon {
    background: rgba(239, 68, 68, 0.2);
    color: var(--danger-color);
}

.notification-item.warning .notification-icon {
    background: rgba(245, 158, 11, 0.2);
    color: var(--warning-color);
}

.notification-item.info .notification-icon {
    background: rgba(59, 130, 246, 0.2);
    color: var(--primary-color);
}

.notification-item.success .notification-icon {
    background: rgba(16, 185, 129, 0.2);
    color: var(--success-color);
}

.notification-content {
    flex: 1;
}

.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4px;
}

.notification-title {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    margin: 0;
}

.notification-time {
    color: var(--text-muted);
    font-size: 12px;
    white-space: nowrap;
}

.notification-message {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.4;
    margin: 0 0 8px 0;
}

.notification-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.action-btn {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 6px;
    color: var(--primary-color);
    font-size: 12px;
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-btn:hover {
    background: rgba(59, 130, 246, 0.2);
}

.notification-controls {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.mark-read,
.delete-notification {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transition: all 0.2s ease;
}

.mark-read:hover {
    background: rgba(16, 185, 129, 0.2);
    color: var(--success-color);
}

.delete-notification:hover {
    background: rgba(239, 68, 68, 0.2);
    color: var(--danger-color);
}

.notification-panel {
    position: fixed;
    top: 100px;
    right: 20px;
    width: 400px;
    max-height: 500px;
    background: var(--bg-overlay);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    backdrop-filter: blur(20px);
    box-shadow: 0 30px 60px var(--shadow-color);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
}

.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
}

.notification-header h3 {
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.notification-controls {
    display: flex;
    gap: 10px;
    align-items: center;
}

.mark-all-read {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 6px;
    color: var(--primary-color);
    font-size: 12px;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mark-all-read:hover {
    background: rgba(59, 130, 246, 0.2);
}

.close-notifications {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.2s ease;
}

.close-notifications:hover {
    background: rgba(239, 68, 68, 0.2);
    color: var(--danger-color);
}

.notification-list {
    max-height: 400px;
    overflow-y: auto;
    padding: 10px;
}

.notification-list .notification-item {
    position: relative;
    margin-bottom: 10px;
    transform: none;
    opacity: 1;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@media (max-width: 768px) {
    .notification-container {
        right: 10px;
        left: 10px;
        max-width: none;
    }
    
    .notification-panel {
        right: 10px;
        left: 10px;
        width: auto;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', notificationStyles);
