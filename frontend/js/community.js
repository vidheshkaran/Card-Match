// Community Page JavaScript - Optimized
class CommunityDashboard {
    constructor() {
        this.currentUser = null;
        this.communityData = null;
        this.impactChart = null;
        this.updateInterval = null;
        this.isInitialized = false;
        
        // Initialize immediately with fallback data
        this.initWithFallback();
    }

    async initWithFallback() {
        // Show loading state
        this.showLoadingState();
        
        // Setup basic UI first
        this.setupEventListeners();
        this.setupBasicAnimations();
        
        // Load data in background
        try {
            await this.loadCommunityData();
        } catch (error) {
            console.warn('Using fallback data:', error);
            this.loadFallbackData();
        }
        
        // Initialize charts after data is ready
        this.initializeCharts();
        this.startRealTimeUpdates();
        this.isInitialized = true;
    }

    showLoadingState() {
        // Add loading indicators to key elements
        const elements = [
            '.challenges-list',
            '.leaderboard-list', 
            '.discussions-list',
            '.achievements-grid',
            '.impact-metrics'
        ];
        
        elements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.innerHTML = '<div class="loading-skeleton"></div>';
            }
        });
    }

    loadFallbackData() {
        // Fallback data for immediate display
        this.communityData = {
            gamification_stats: {
                user_level: "Air Quality Expert",
                user_points: 8750,
                user_badges: 7,
                next_level_points: 1250,
                contribution_streak: 12
            },
            challenges: [
                {
                    id: "clean_air_week",
                    title: "Clean Air Week Challenge",
                    description: "Report air quality issues in your area",
                    progress: 75,
                    target: 100,
                    reward: "Clean Air Champion Badge"
                }
            ],
            leaderboard: [
                { rank: 1, username: "EcoWarrior7", points: 12345, badges: 12, location: "South Delhi" },
                { rank: 2, username: "GreenCitizen", points: 11200, badges: 10, location: "Central Delhi" }
            ],
            discussions: [
                {
                    id: "disc_1",
                    title: "Best air purifiers for Delhi homes",
                    author: "CleanAirLover",
                    replies: 23,
                    views: 456,
                    last_activity: new Date().toISOString(),
                    tags: ["air-purifier", "home"]
                }
            ],
            user_achievements: [
                {
                    badge: "First Report",
                    description: "Submitted your first pollution report",
                    earned_date: "2024-01-10",
                    icon: "fas fa-flag"
                }
            ],
            community_impact: {
                total_reports_submitted: 25000,
                issues_resolved: 18500,
                active_contributors: 1250,
                total_points_earned: 456789
            }
        };
        
        this.updateDashboard(this.communityData);
    }

    async loadCommunityData() {
        try {
            // Set timeout for API call
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch('/api/citizen-portal/community-engagement', {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            this.communityData = data;
            this.currentUser = data.gamification_stats;
            this.updateDashboard(data);
            
        } catch (error) {
            console.error('Error loading community data:', error);
            throw error; // Re-throw to trigger fallback
        }
    }

    updateDashboard(data) {
        // Update user profile
        this.updateUserProfile(data.gamification_stats);
        
        // Update challenges
        this.updateChallenges(data.challenges);
        
        // Update leaderboard
        this.updateLeaderboard(data.leaderboard);
        
        // Update discussions
        this.updateDiscussions(data.discussions);
        
        // Update achievements
        this.updateAchievements(data.user_achievements);
        
        // Update community impact
        this.updateCommunityImpact(data.community_impact);
        
        // Update activity feed
        this.updateActivityFeed();
    }

    updateUserProfile(userStats) {
        document.getElementById('userName').textContent = 'EcoWarrior7'; // Mock username
        document.getElementById('userLevel').textContent = userStats.user_level;
        document.getElementById('userPoints').textContent = userStats.user_points.toLocaleString();
        document.getElementById('userBadges').textContent = userStats.user_badges;
        document.getElementById('userStreak').textContent = userStats.contribution_streak;
        
        // Update level progress
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const progressPercent = (userStats.user_points / (userStats.user_points + userStats.next_level_points)) * 100;
        
        progressFill.style.width = `${progressPercent}%`;
        progressText.textContent = `${userStats.next_level_points.toLocaleString()} points to go`;
    }

    updateChallenges(challenges) {
        const challengesList = document.getElementById('challengesList');
        const challengeCount = document.getElementById('challengeCount');
        
        challengeCount.textContent = `${challenges.length} Active`;
        
        challengesList.innerHTML = challenges.map(challenge => `
            <div class="challenge-item" data-challenge-id="${challenge.id}">
                <div class="challenge-icon">
                    <i class="fas fa-${this.getChallengeIcon(challenge.id)}"></i>
                </div>
                <div class="challenge-content">
                    <h4>${challenge.title}</h4>
                    <p>${challenge.description}</p>
                    <div class="challenge-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(challenge.progress / challenge.target) * 100}%"></div>
                        </div>
                        <span class="progress-text">${challenge.progress}/${challenge.target}</span>
                    </div>
                    <div class="challenge-reward">
                        <i class="fas fa-gift"></i>
                        <span>${challenge.reward}</span>
                    </div>
                </div>
                <div class="challenge-actions">
                    <button class="btn-primary btn-sm challenge-continue-btn" data-challenge-id="${challenge.id}">Continue</button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to challenge buttons
        challengesList.querySelectorAll('.challenge-continue-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const challengeId = btn.getAttribute('data-challenge-id');
                this.continueChallenge(challengeId);
            });
        });
    }

    updateLeaderboard(leaderboard) {
        const leaderboardList = document.getElementById('leaderboardList');
        
        leaderboardList.innerHTML = leaderboard.map((user, index) => `
            <div class="leaderboard-item rank-${index + 1}">
                <div class="rank">${user.rank}</div>
                <div class="user-info">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-details">
                        <h4>${user.username}</h4>
                        <p>${user.location}</p>
                    </div>
                </div>
                <div class="user-score">
                    <span class="points">${user.points.toLocaleString()}</span>
                    <span class="badges">${user.badges} badges</span>
                </div>
            </div>
        `).join('');
    }

    updateDiscussions(discussions) {
        const discussionsList = document.getElementById('discussionsList');
        
        discussionsList.innerHTML = discussions.map(discussion => `
            <div class="discussion-item" data-discussion-id="${discussion.id}">
                <div class="discussion-header">
                    <h4>${discussion.title}</h4>
                    <span class="discussion-stats">
                        <i class="fas fa-comment"></i> ${discussion.replies} replies
                        <i class="fas fa-eye"></i> ${discussion.views} views
                    </span>
                </div>
                <div class="discussion-meta">
                    <span class="author">${discussion.author}</span>
                    <span class="time">${this.formatTimeAgo(discussion.last_activity)}</span>
                    <div class="tags">
                        ${discussion.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers to all discussion items
        discussionsList.querySelectorAll('.discussion-item').forEach(item => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', (e) => {
                const discussionId = item.getAttribute('data-discussion-id');
                this.openDiscussion(discussionId);
            });
        });
    }

    updateAchievements(achievements) {
        const achievementsGrid = document.getElementById('achievementsGrid');
        const achievementCount = document.getElementById('achievementCount');
        
        achievementCount.textContent = `${achievements.length} Badges`;
        
        achievementsGrid.innerHTML = achievements.map(achievement => `
            <div class="achievement-item earned">
                <div class="achievement-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <div class="achievement-content">
                    <h4>${achievement.badge}</h4>
                    <p>${achievement.description}</p>
                    <span class="achievement-date">${this.formatDate(achievement.earned_date)}</span>
                </div>
            </div>
        `).join('');
    }

    updateCommunityImpact(impact) {
        if (!impact) {
            console.warn('No impact data provided');
            return;
        }
        
        // Update impact chart (metrics removed from UI)
        this.updateImpactChart(impact);
    }

    updateImpactChart(impact) {
        if (!impact) {
            console.warn('No impact data for chart');
            return;
        }
        
        // Initialize chart if not already initialized
        if (!this.impactChart) {
            const ctx = document.getElementById('impactChart');
            if (!ctx) {
                console.warn('Impact chart canvas not found');
                return;
            }
            
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js not loaded');
                return;
            }
            
            try {
                this.impactChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Reports', 'Resolved', 'Contributors', 'Points'],
                        datasets: [{
                            data: [0, 0, 0, 0],
                            backgroundColor: [
                                '#3b82f6',
                                '#10b981',
                                '#f59e0b',
                                '#8b5cf6'
                            ],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        },
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    color: function(context) {
                                        // Return white color for all legend labels
                                        return '#ffffff';
                                    },
                                    font: {
                                        size: 14,
                                        family: "'Inter', sans-serif",
                                        weight: '500'
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.parsed || 0;
                                        if (label === 'Points') {
                                            return label + ': ' + (value * 1000).toLocaleString();
                                        }
                                        return label + ': ' + value.toLocaleString();
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error initializing impact chart:', error);
                return;
            }
        }

        // Update chart data
        const reports = impact.total_reports_submitted || 0;
        const resolved = impact.issues_resolved || 0;
        const contributors = impact.active_contributors || 0;
        const points = (impact.total_points_earned || 0) / 1000; // Scale down for chart

        this.impactChart.data.datasets[0].data = [
            reports,
            resolved,
            contributors,
            points
        ];
        
        this.impactChart.update('active');
        
        // Ensure legend text is visible after update
        this.styleChartLegend();
    }
    
    styleChartLegend() {
        // Style the legend after chart renders
        setTimeout(() => {
            const chartContainer = document.getElementById('impactChart');
            if (!chartContainer) return;
            
            // Find the legend (Chart.js creates it as a sibling or parent element)
            const chartParent = chartContainer.closest('.impact-chart') || chartContainer.parentElement;
            if (!chartParent) return;
            
            // Find all legend items
            const legendItems = chartParent.querySelectorAll('ul li, .chartjs-legend li, [class*="legend"] li');
            legendItems.forEach(item => {
                const textElement = item.querySelector('span:not([style*="width"])') || item.childNodes[0];
                if (textElement && textElement.nodeType === Node.TEXT_NODE) {
                    // Wrap text in span if needed
                    const span = document.createElement('span');
                    span.textContent = textElement.textContent;
                    span.style.color = '#ffffff';
                    span.style.fontSize = '14px';
                    span.style.fontWeight = '500';
                    span.style.fontFamily = "'Inter', sans-serif";
                    textElement.replaceWith(span);
                } else if (textElement) {
                    textElement.style.color = '#ffffff';
                    textElement.style.fontSize = '14px';
                    textElement.style.fontWeight = '500';
                    textElement.style.fontFamily = "'Inter', sans-serif";
                }
                item.style.color = '#ffffff';
            });
            
            // Also style any text nodes directly
            const walker = document.createTreeWalker(
                chartParent,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let node;
            while (node = walker.nextNode()) {
                if (node.parentElement && node.parentElement.closest('ul')) {
                    const parent = node.parentElement;
                    if (parent.tagName === 'LI' || parent.closest('li')) {
                        const span = document.createElement('span');
                        span.textContent = node.textContent.trim();
                        if (span.textContent) {
                            span.style.color = '#ffffff';
                            span.style.fontSize = '14px';
                            span.style.fontWeight = '500';
                            span.style.fontFamily = "'Inter', sans-serif";
                            node.replaceWith(span);
                        }
                    }
                }
            }
        }, 100);
    }

    updateActivityFeed() {
        // Mock activity feed data
        const activities = [
            {
                type: 'report',
                user: 'You',
                action: 'submitted a pollution report for',
                location: 'Central Delhi',
                time: '2 hours ago',
                icon: 'fas fa-file-alt'
            },
            {
                type: 'challenge',
                user: 'EcoWarrior7',
                action: 'completed the',
                challenge: 'Clean Air Week Challenge',
                time: '4 hours ago',
                icon: 'fas fa-trophy'
            },
            {
                type: 'discussion',
                user: 'GreenCitizen',
                action: 'replied to',
                discussion: 'Best air purifiers for Delhi homes',
                time: '6 hours ago',
                icon: 'fas fa-comment'
            },
            {
                type: 'achievement',
                user: 'AirGuardian',
                action: 'earned the',
                badge: 'Data Contributor badge',
                time: '8 hours ago',
                icon: 'fas fa-medal'
            }
        ];

        const activityFeed = document.getElementById('activityFeed');
        activityFeed.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p><strong>${activity.user}</strong> ${activity.action} <strong>${activity.location || activity.challenge || activity.discussion || activity.badge}</strong></p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    initializeCharts() {
        // Lazy load charts only when Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, skipping chart initialization');
            // Retry after a delay
            setTimeout(() => this.initializeCharts(), 1000);
            return;
        }

        // Impact chart will be initialized when data is available
        // Just ensure the canvas exists
        const ctx = document.getElementById('impactChart');
        if (!ctx) {
            console.warn('Impact chart canvas not found');
            return;
        }
        
        // Chart will be created in updateImpactChart when data is available
        console.log('Chart canvas ready, waiting for data...');
    }

    setupEventListeners() {
        // New discussion button - with retry logic
        const newDiscussionBtn = document.getElementById('newDiscussionBtn');
        if (newDiscussionBtn) {
            // Remove any existing listeners by cloning
            const newBtn = newDiscussionBtn.cloneNode(true);
            newDiscussionBtn.parentNode.replaceChild(newBtn, newDiscussionBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('New Discussion button clicked');
                this.showNewDiscussionModal();
            });
            
            // Also add onclick as fallback
            newBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('New Discussion button clicked (onclick)');
                this.showNewDiscussionModal();
            };
        } else {
            console.warn('New Discussion button not found, retrying...');
            setTimeout(() => this.setupEventListeners(), 500);
        }

        // Activity filter
        document.getElementById('activityFilter').addEventListener('change', (e) => {
            this.filterActivity(e.target.value);
        });

        // Challenge continue buttons - handled in updateChallenges now
        // Also handle static HTML challenge buttons
        setTimeout(() => {
            const staticChallengeButtons = document.querySelectorAll('.challenges-list .btn-primary.btn-sm');
            staticChallengeButtons.forEach(btn => {
                if (btn.textContent.includes('Continue')) {
                    const challengeItem = btn.closest('.challenge-item');
                    if (challengeItem) {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            // Try to get challenge ID from data attribute or generate one
                            const challengeId = challengeItem.getAttribute('data-challenge-id') || 
                                             challengeItem.querySelector('h4')?.textContent.toLowerCase().replace(/\s+/g, '_') || 
                                             'challenge_' + Date.now();
                            this.continueChallenge(challengeId);
                        });
                    }
                }
            });
            
            // Handle static discussion items
            const staticDiscussions = document.querySelectorAll('.discussions-list .discussion-item');
            staticDiscussions.forEach(item => {
                if (!item.getAttribute('data-discussion-id')) {
                    item.setAttribute('data-discussion-id', 'disc_' + Math.random().toString(36).substr(2, 9));
                }
                item.style.cursor = 'pointer';
                item.addEventListener('click', (e) => {
                    const discussionId = item.getAttribute('data-discussion-id');
                    this.openDiscussion(discussionId);
                });
            });
        }, 100);
    }

    startRealTimeUpdates() {
        // Update every 2 minutes
        this.updateInterval = setInterval(() => {
            this.loadCommunityData();
        }, 2 * 60 * 1000);
    }

    setupBasicAnimations() {
        // Basic CSS animations without GSAP dependency
        const elements = document.querySelectorAll('.hero-content, .hero-stats .stat-item, .profile-card, .dashboard-card');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    setupAnimations() {
        // Enhanced animations with GSAP if available
        if (typeof gsap !== 'undefined') {
            gsap.from('.hero-content', {
                duration: 1,
                y: 50,
                opacity: 0,
                ease: 'power2.out'
            });

            gsap.from('.hero-stats .stat-item', {
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.2,
                delay: 0.5,
                ease: 'power2.out'
            });

            gsap.from('.profile-card', {
                duration: 0.6,
                y: 30,
                opacity: 0,
                delay: 0.8,
                ease: 'power2.out'
            });

            gsap.from('.dashboard-card', {
                duration: 0.6,
                y: 30,
                opacity: 0,
                stagger: 0.1,
                delay: 1.0,
                ease: 'power2.out'
            });

            gsap.to('.community-animation .avatar', {
                duration: 2,
                y: -10,
                repeat: -1,
                yoyo: true,
                stagger: 0.5,
                ease: 'power2.inOut'
            });

            gsap.to('.connection-lines .line', {
                duration: 1.5,
                scaleX: 1,
                repeat: -1,
                yoyo: true,
                stagger: 0.3,
                ease: 'power2.inOut'
            });
        }
    }

    // Helper methods
    getChallengeIcon(challengeId) {
        const icons = {
            'clean_air_week': 'leaf',
            'eco_warrior': 'recycle',
            'health_advocate': 'heart'
        };
        return icons[challengeId] || 'trophy';
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} days ago`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    showNewDiscussionModal() {
        // Check if modal already exists
        let modal = document.getElementById('newDiscussionModal');
        
        if (!modal) {
            // Create modal HTML
            modal = document.createElement('div');
            modal.id = 'newDiscussionModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content discussion-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-comments"></i> Start New Discussion</h3>
                        <button class="modal-close" onclick="window.communityDashboard && window.communityDashboard.closeNewDiscussionModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="newDiscussionForm">
                            <div class="form-group">
                                <label for="discussionTitle">Discussion Title *</label>
                                <input type="text" id="discussionTitle" name="title" required 
                                       placeholder="e.g., Best air purifiers for Delhi homes" 
                                       maxlength="100">
                            </div>
                            <div class="form-group">
                                <label for="discussionContent">Discussion Content *</label>
                                <textarea id="discussionContent" name="content" required 
                                          rows="6" 
                                          placeholder="Share your thoughts, questions, or experiences..."></textarea>
                            </div>
                            <div class="form-group">
                                <label for="discussionTags">Tags (comma-separated)</label>
                                <input type="text" id="discussionTags" name="tags" 
                                       placeholder="e.g., air-purifier, home, recommendations">
                                <small>Separate tags with commas</small>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="window.communityDashboard && window.communityDashboard.closeNewDiscussionModal()">
                                    Cancel
                                </button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-paper-plane"></i> Post Discussion
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add styles if not already present
            if (!document.getElementById('discussionModalStyles')) {
                const style = document.createElement('style');
                style.id = 'discussionModalStyles';
                style.textContent = `
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(5px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        animation: fadeIn 0.3s ease;
                    }
                    .discussion-modal {
                        background: var(--bg-secondary, #1e293b);
                        border: 1px solid var(--border-color, rgba(59, 130, 246, 0.2));
                        border-radius: 12px;
                        width: 90%;
                        max-width: 600px;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                        animation: slideUp 0.3s ease;
                    }
                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.5rem;
                        border-bottom: 1px solid var(--border-color, rgba(59, 130, 246, 0.2));
                    }
                    .modal-header h3 {
                        color: var(--text-primary, #ffffff);
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    .modal-close {
                        background: transparent;
                        border: none;
                        color: var(--text-secondary, #94a3b8);
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0.5rem;
                        border-radius: 4px;
                        transition: all 0.2s;
                    }
                    .modal-close:hover {
                        background: var(--bg-primary, #0f172a);
                        color: var(--text-primary, #ffffff);
                    }
                    .modal-body {
                        padding: 1.5rem;
                    }
                    .form-group {
                        margin-bottom: 1.5rem;
                    }
                    .form-group label {
                        display: block;
                        color: var(--text-primary, #ffffff);
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                        font-size: 0.9rem;
                    }
                    .form-group input,
                    .form-group textarea {
                        width: 100%;
                        padding: 0.75rem;
                        background: var(--bg-primary, #0f172a);
                        border: 1px solid var(--border-color, rgba(59, 130, 246, 0.2));
                        border-radius: 8px;
                        color: var(--text-primary, #ffffff);
                        font-family: inherit;
                        font-size: 1rem;
                        transition: all 0.2s;
                    }
                    .form-group input:focus,
                    .form-group textarea:focus {
                        outline: none;
                        border-color: var(--primary-color, #3b82f6);
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }
                    .form-group small {
                        display: block;
                        color: var(--text-secondary, #94a3b8);
                        font-size: 0.8rem;
                        margin-top: 0.25rem;
                    }
                    .form-actions {
                        display: flex;
                        gap: 1rem;
                        justify-content: flex-end;
                        margin-top: 2rem;
                    }
                    .btn-primary, .btn-secondary {
                        padding: 0.75rem 1.5rem;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    .btn-primary {
                        background: var(--primary-color, #3b82f6);
                        color: white;
                    }
                    .btn-primary:hover {
                        background: var(--primary-color, #2563eb);
                        transform: translateY(-2px);
                    }
                    .btn-secondary {
                        background: var(--bg-primary, #0f172a);
                        color: var(--text-primary, #ffffff);
                        border: 1px solid var(--border-color, rgba(59, 130, 246, 0.2));
                    }
                    .btn-secondary:hover {
                        background: var(--bg-tertiary, #334155);
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Setup form submission
            const form = modal.querySelector('#newDiscussionForm');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitNewDiscussion(form);
            });
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeNewDiscussionModal();
                }
            });
        }
        
        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on title input
        setTimeout(() => {
            const titleInput = modal.querySelector('#discussionTitle');
            if (titleInput) titleInput.focus();
        }, 100);
    }
    
    closeNewDiscussionModal() {
        const modal = document.getElementById('newDiscussionModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    async submitNewDiscussion(form) {
        const formData = new FormData(form);
        const title = formData.get('title').trim();
        const content = formData.get('content').trim();
        const tags = formData.get('tags').trim().split(',').map(t => t.trim()).filter(t => t);
        
        if (!title || !content) {
            alert('Please fill in both title and content.');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        
        try {
            // Try to submit to backend
            const response = await fetch('/api/citizen-portal/discussions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    content,
                    tags
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.showSuccessMessage('Discussion posted successfully!');
                this.closeNewDiscussionModal();
                
                // Add new discussion to the list
                this.addDiscussionToList({
                    id: data.id || `disc_${Date.now()}`,
                    title,
                    author: 'You',
                    replies: 0,
                    views: 0,
                    last_activity: new Date().toISOString(),
                    tags
                });
                
                // Reset form
                form.reset();
            } else {
                throw new Error('Failed to post discussion');
            }
        } catch (error) {
            console.error('Error posting discussion:', error);
            // For demo purposes, still add it locally
            this.showSuccessMessage('Discussion posted successfully! (Demo Mode)');
            this.closeNewDiscussionModal();
            
            this.addDiscussionToList({
                id: `disc_${Date.now()}`,
                title,
                author: 'You',
                replies: 0,
                views: 0,
                last_activity: new Date().toISOString(),
                tags
            });
            
            form.reset();
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
    
    addDiscussionToList(discussion) {
        const discussionsList = document.getElementById('discussionsList');
        if (!discussionsList) return;
        
        // Create new discussion element
        const discussionElement = document.createElement('div');
        discussionElement.className = 'discussion-item';
        discussionElement.onclick = () => this.openDiscussion(discussion.id);
        discussionElement.innerHTML = `
            <div class="discussion-header">
                <h4>${discussion.title}</h4>
                <span class="discussion-stats">
                    <i class="fas fa-comment"></i> ${discussion.replies} replies
                    <i class="fas fa-eye"></i> ${discussion.views} views
                </span>
            </div>
            <div class="discussion-meta">
                <span class="author">${discussion.author}</span>
                <span class="time">Just now</span>
                <div class="tags">
                    ${discussion.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
        
        // Add to top of list
        discussionsList.insertBefore(discussionElement, discussionsList.firstChild);
        
        // Add animation
        discussionElement.style.opacity = '0';
        discussionElement.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            discussionElement.style.transition = 'all 0.3s ease';
            discussionElement.style.opacity = '1';
            discussionElement.style.transform = 'translateY(0)';
        }, 10);
    }
    
    showSuccessMessage(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color, #10b981);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
        `;
        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
        // Add animation styles if not present
        if (!document.getElementById('toastAnimations')) {
            const style = document.createElement('style');
            style.id = 'toastAnimations';
            style.textContent = `
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
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    filterActivity(filter) {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;
        
        const allActivities = activityFeed.querySelectorAll('.activity-item');
        
        allActivities.forEach(item => {
            const icon = item.querySelector('.activity-icon i');
            const iconClass = icon ? icon.className : '';
            
            let shouldShow = false;
            
            if (filter === 'all') {
                shouldShow = true;
            } else if (filter === 'reports' && iconClass.includes('fa-file-alt')) {
                shouldShow = true;
            } else if (filter === 'challenges' && iconClass.includes('fa-trophy')) {
                shouldShow = true;
            } else if (filter === 'discussions' && iconClass.includes('fa-comment')) {
                shouldShow = true;
            }
            
            if (shouldShow) {
                item.style.display = 'flex';
                item.style.animation = 'fadeIn 0.3s ease';
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show message if no activities match
        const visibleActivities = Array.from(allActivities).filter(item => item.style.display !== 'none');
        if (visibleActivities.length === 0 && filter !== 'all') {
            const noResults = document.createElement('div');
            noResults.className = 'activity-item';
            noResults.style.cssText = 'justify-content: center; padding: 2rem; color: var(--text-secondary, #94a3b8);';
            noResults.innerHTML = `<p>No ${filter} activities found</p>`;
            activityFeed.appendChild(noResults);
        }
    }

    continueChallenge(challengeId) {
        console.log('Continuing challenge:', challengeId);
        
        // Show challenge details modal
        const challenge = this.communityData?.challenges?.find(c => c.id === challengeId);
        
        if (!challenge) {
            // Try to get from static HTML
            const challengeItem = document.querySelector(`[data-challenge-id="${challengeId}"]`);
            if (challengeItem) {
                const title = challengeItem.querySelector('h4')?.textContent || 'Challenge';
                const description = challengeItem.querySelector('p')?.textContent || '';
                const progress = challengeItem.querySelector('.progress-text')?.textContent || '0/0';
                
                this.showChallengeModal({
                    id: challengeId,
                    title: title,
                    description: description,
                    progress: progress
                });
            } else {
                this.showSuccessMessage('Challenge details will be shown here!');
            }
            return;
        }
        
        this.showChallengeModal(challenge);
    }

    showChallengeModal(challenge) {
        // Create or update challenge modal
        let modal = document.getElementById('challengeModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'challengeModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }
        
        const progressPercent = challenge.progress ? 
            (typeof challenge.progress === 'string' ? 
                parseInt(challenge.progress.split('/')[0]) / parseInt(challenge.progress.split('/')[1]) * 100 :
                (challenge.progress / challenge.target) * 100) : 0;
        
        modal.innerHTML = `
            <div class="modal-content challenge-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-trophy"></i> ${challenge.title || 'Challenge'}</h3>
                    <button class="modal-close" onclick="window.communityDashboard && window.communityDashboard.closeChallengeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-secondary, #94a3b8); margin-bottom: 1.5rem;">${challenge.description || ''}</p>
                    <div class="challenge-progress" style="margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: var(--text-primary, #ffffff); font-weight: 600;">Progress</span>
                            <span style="color: var(--text-secondary, #94a3b8);">${challenge.progress || '0/0'}</span>
                        </div>
                        <div class="progress-bar" style="height: 12px; background: var(--bg-primary, #0f172a); border-radius: 6px; overflow: hidden;">
                            <div class="progress-fill" style="height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); width: ${progressPercent}%; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                    <div class="challenge-reward" style="background: var(--bg-primary, #0f172a); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid var(--border-color, rgba(59, 130, 246, 0.2));">
                        <i class="fas fa-gift" style="color: #f59e0b; margin-right: 0.5rem;"></i>
                        <span style="color: var(--text-primary, #ffffff);">Reward: ${challenge.reward || 'Points and Badge'}</span>
                    </div>
                    <div class="challenge-actions" style="display: flex; gap: 1rem;">
                        <button class="btn-secondary" onclick="window.communityDashboard && window.communityDashboard.closeChallengeModal()" style="flex: 1;">
                            Close
                        </button>
                        <button class="btn-primary" onclick="window.communityDashboard && window.communityDashboard.startChallengeAction('${challenge.id}')" style="flex: 1;">
                            <i class="fas fa-play"></i> Start Action
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeChallengeModal();
            }
        });
    }
    
    closeChallengeModal() {
        const modal = document.getElementById('challengeModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    startChallengeAction(challengeId) {
        this.showSuccessMessage('Challenge action started! Keep contributing to complete the challenge.');
        this.closeChallengeModal();
    }

    openDiscussion(discussionId) {
        console.log('Opening discussion:', discussionId);
        
        // Find discussion data
        const discussion = this.communityData?.discussions?.find(d => d.id === discussionId);
        
        if (!discussion) {
            // Try to get from static HTML
            const discussionItem = document.querySelector(`[data-discussion-id="${discussionId}"]`);
            if (discussionItem) {
                const title = discussionItem.querySelector('h4')?.textContent || 'Discussion';
                const author = discussionItem.querySelector('.author')?.textContent || 'Unknown';
                const stats = discussionItem.querySelector('.discussion-stats')?.textContent || '';
                const time = discussionItem.querySelector('.time')?.textContent || '';
                const tags = Array.from(discussionItem.querySelectorAll('.tag')).map(t => t.textContent);
                
                this.showDiscussionModal({
                    id: discussionId,
                    title: title,
                    author: author,
                    replies: stats.match(/\d+/)?.[0] || '0',
                    views: stats.match(/\d+/)?.[1] || '0',
                    last_activity: time,
                    tags: tags
                });
            } else {
                this.showSuccessMessage('Discussion details will be shown here!');
            }
            return;
        }
        
        this.showDiscussionModal(discussion);
    }
    
    showDiscussionModal(discussion) {
        // Create or update discussion modal
        let modal = document.getElementById('discussionModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'discussionModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content discussion-detail-modal" style="max-width: 800px;">
                <div class="modal-header">
                    <h3><i class="fas fa-comments"></i> ${discussion.title || 'Discussion'}</h3>
                    <button class="modal-close" onclick="window.communityDashboard && window.communityDashboard.closeDiscussionModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="discussion-meta" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color, rgba(59, 130, 246, 0.2));">
                        <span class="author" style="color: var(--text-primary, #ffffff); font-weight: 600;">
                            <i class="fas fa-user"></i> ${discussion.author || 'Unknown'}
                        </span>
                        <span class="time" style="color: var(--text-secondary, #94a3b8);">
                            <i class="fas fa-clock"></i> ${discussion.last_activity || 'Recently'}
                        </span>
                        <span class="discussion-stats" style="color: var(--text-secondary, #94a3b8); margin-left: auto;">
                            <i class="fas fa-comment"></i> ${discussion.replies || 0} replies
                            <i class="fas fa-eye" style="margin-left: 1rem;"></i> ${discussion.views || 0} views
                        </span>
                    </div>
                    <div class="discussion-tags" style="margin-bottom: 1.5rem;">
                        ${(discussion.tags || []).map(tag => `<span class="tag" style="display: inline-block; padding: 0.25rem 0.75rem; background: var(--bg-primary, #0f172a); border: 1px solid var(--border-color, rgba(59, 130, 246, 0.2)); border-radius: 12px; color: var(--text-secondary, #94a3b8); font-size: 0.85rem; margin-right: 0.5rem;">${tag}</span>`).join('')}
                    </div>
                    <div class="discussion-content" style="background: var(--bg-primary, #0f172a); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; color: var(--text-primary, #ffffff); line-height: 1.6;">
                        <p>This is a community discussion about "${discussion.title}". Join the conversation and share your thoughts!</p>
                        <p style="margin-top: 1rem; color: var(--text-secondary, #94a3b8);">In a full implementation, this would show the full discussion thread with replies and comments.</p>
                    </div>
                    <div class="discussion-actions" style="display: flex; gap: 1rem;">
                        <button class="btn-secondary" onclick="window.communityDashboard && window.communityDashboard.closeDiscussionModal()" style="flex: 1;">
                            Close
                        </button>
                        <button class="btn-primary" onclick="window.communityDashboard && window.communityDashboard.replyToDiscussion('${discussion.id}')" style="flex: 1;">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDiscussionModal();
            }
        });
    }
    
    closeDiscussionModal() {
        const modal = document.getElementById('discussionModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    replyToDiscussion(discussionId) {
        this.showSuccessMessage('Reply feature coming soon!');
        this.closeDiscussionModal();
    }

    showError(message) {
        console.error(message);
        // You could implement a toast notification here
    }
}

// Initialize when DOM is loaded and expose globally so inline handlers can access it
document.addEventListener('DOMContentLoaded', () => {
    window.communityDashboard = new CommunityDashboard();
});
