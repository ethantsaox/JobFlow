// Job Application Tracker - Popup JavaScript

class JobTrackerPopup {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.stats = null;
        
        this.init();
    }

    async init() {
        // Check authentication status
        await this.checkAuthStatus();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        if (this.isAuthenticated) {
            await this.loadDashboardData();
            this.showDashboard();
        } else {
            this.showLoginForm();
        }
        
        // Set up periodic auth check (every 2 minutes)
        this.startAuthMonitoring();
        
        this.hideLoading();
    }

    startAuthMonitoring() {
        // Check auth status every 2 minutes to handle token expiration
        setInterval(async () => {
            const wasAuthenticated = this.isAuthenticated;
            await this.checkAuthStatus();
            
            // If auth status changed, update UI
            if (wasAuthenticated && !this.isAuthenticated) {
                console.log('🔐 Authentication expired, showing login form');
                this.showMessage('Session expired. Please login again.', 'error');
                this.showLoginForm();
            }
        }, 120000); // 2 minutes
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.handleRefresh());
        }

        // Track job button
        const trackJobBtn = document.getElementById('trackJobBtn');
        if (trackJobBtn) {
            trackJobBtn.addEventListener('click', () => this.handleTrackJob());
        }

        // Open dashboard button
        const openDashboardBtn = document.getElementById('openDashboard');
        if (openDashboardBtn) {
            openDashboardBtn.addEventListener('click', () => this.openWebPage('/dashboard'));
        }

        // Open gamification button
        const openGamificationBtn = document.getElementById('openGamification');
        if (openGamificationBtn) {
            openGamificationBtn.addEventListener('click', () => this.openWebPage('/gamification'));
        }

        // Open analytics button
        const openAnalyticsBtn = document.getElementById('openAnalytics');
        if (openAnalyticsBtn) {
            openAnalyticsBtn.addEventListener('click', () => this.openWebPage('/analytics'));
        }

        // Goal editing
        const editGoalBtn = document.getElementById('editGoalBtn');
        const saveGoalBtn = document.getElementById('saveGoalBtn');
        const cancelGoalBtn = document.getElementById('cancelGoalBtn');
        
        if (editGoalBtn) {
            editGoalBtn.addEventListener('click', () => this.startGoalEdit());
        }
        if (saveGoalBtn) {
            saveGoalBtn.addEventListener('click', () => this.saveGoal());
        }
        if (cancelGoalBtn) {
            cancelGoalBtn.addEventListener('click', () => this.cancelGoalEdit());
        }

        // View achievements
        const viewAllAchievementsBtn = document.getElementById('viewAllAchievements');
        if (viewAllAchievementsBtn) {
            viewAllAchievementsBtn.addEventListener('click', () => this.openWebPage('/gamification'));
        }

        // Create account button
        const openWebAppBtn = document.getElementById('openWebApp');
        if (openWebAppBtn) {
            openWebAppBtn.addEventListener('click', () => this.openWebPage('/register'));
        }
    }

    async checkAuthStatus() {
        try {
            const response = await this.sendMessageToBackground('CHECK_AUTH');
            this.isAuthenticated = response.success && response.authenticated;
            
            if (this.isAuthenticated) {
                // Get user info from storage
                const result = await chrome.storage.local.get(['user']);
                this.currentUser = result.user;
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.isAuthenticated = false;
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = event.target.querySelector('button[type="submit"]');
        
        if (!email || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        // Show loading state
        this.setButtonLoading(submitBtn, true);

        try {
            const response = await this.sendMessageToBackground('LOGIN', {
                email: email,
                password: password
            });

            console.log('Login response:', response); // Debug log

            if (response.success) {
                this.isAuthenticated = true;
                this.currentUser = response.data.user;
                this.showMessage(response.message || 'Login successful!', 'success');
                
                // Load dashboard data and switch views
                await this.loadDashboardData();
                setTimeout(() => {
                    this.showDashboard();
                }, 1000);
            } else {
                console.error('Login failed:', response); // Debug log
                let errorMessage = 'Login failed';
                
                if (response.error) {
                    if (typeof response.error === 'string') {
                        errorMessage = response.error;
                    } else if (response.error.message) {
                        errorMessage = response.error.message;
                    } else if (response.error.detail) {
                        errorMessage = response.error.detail;
                    }
                } else if (response.message) {
                    errorMessage = response.message;
                }
                
                this.showMessage(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    async handleLogout() {
        try {
            await this.sendMessageToBackground('LOGOUT');
            this.isAuthenticated = false;
            this.currentUser = null;
            this.stats = null;
            
            this.showMessage('Logged out successfully', 'success');
            setTimeout(() => {
                this.showLoginForm();
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            this.showMessage('Logout failed', 'error');
        }
    }

    async handleRefresh() {
        try {
            // Show loading state
            const refreshBtn = document.getElementById('refreshBtn');
            if (refreshBtn) {
                refreshBtn.textContent = '⟳';
                refreshBtn.style.animation = 'spin 1s linear infinite';
            }

            // Re-check authentication and reload data
            await this.checkAuthStatus();
            
            if (this.isAuthenticated) {
                await this.loadDashboardData();
                this.showDashboard();
                this.showMessage('Data refreshed', 'success');
            } else {
                this.showLoginForm();
                this.showMessage('Session expired. Please login again.', 'error');
            }

        } catch (error) {
            console.error('Refresh error:', error);
            this.showMessage('Refresh failed', 'error');
        } finally {
            // Reset refresh button
            const refreshBtn = document.getElementById('refreshBtn');
            if (refreshBtn) {
                refreshBtn.style.animation = '';
                refreshBtn.textContent = '⟳';
            }
        }
    }

    async handleTrackJob() {
        const trackBtn = document.getElementById('trackJobBtn');
        
        if (!this.isAuthenticated) {
            this.showMessage('Please log in first', 'error');
            return;
        }

        // Check if we're on a job page
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!this.isJobSite(tab.url)) {
                this.showMessage('Please navigate to a job posting to track it', 'error');
                return;
            }

            this.setButtonLoading(trackBtn, true);

            // Send message to content script to extract job data
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'EXTRACT_JOB_DATA'
            });

            console.log('Content script response:', response); // Debug log

            if (response && response.success) {
                // Send job data to background script to save
                const saveResponse = await this.sendMessageToBackground('TRACK_JOB', response.data);
                
                console.log('Background save response:', saveResponse); // Debug log
                
                if (saveResponse.success) {
                    this.showMessage('Job tracked successfully!', 'success');
                    // Refresh stats
                    await this.loadDashboardData();
                    this.updateStatsDisplay();
                } else {
                    const errorMessage = typeof saveResponse.error === 'string' 
                        ? saveResponse.error 
                        : (saveResponse.error?.message || 'Failed to track job');
                    this.showMessage(errorMessage, 'error');
                }
            } else {
                const errorMessage = response?.error || 'Could not extract job data from this page';
                this.showMessage(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Track job error:', error);
            this.showMessage('Failed to track job. Please try again.', 'error');
        } finally {
            this.setButtonLoading(trackBtn, false);
        }
    }

    async loadDashboardData() {
        try {
            const response = await this.sendMessageToBackground('GET_STATS');
            if (response.success) {
                this.stats = response.data;
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    showDashboard() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Update user info
        if (this.currentUser) {
            document.getElementById('userName').textContent = 
                this.currentUser.first_name || this.currentUser.email;
        }
        
        // Update stats
        this.updateStatsDisplay();
    }

    showLoginForm() {
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        
        // Clear form
        const form = document.getElementById('loginFormElement');
        if (form) {
            form.reset();
        }
    }

    updateStatsDisplay() {
        if (!this.stats) return;

        // Update stats numbers
        document.getElementById('totalApps').textContent = this.stats.total_applications || 0;
        document.getElementById('currentStreak').textContent = this.stats.current_streak || 0;
        document.getElementById('todayApps').textContent = this.stats.applications_today || 0;

        // Update progress
        const progressText = `${this.stats.applications_today || 0}/${this.stats.daily_goal || 5}`;
        document.getElementById('progressText').textContent = progressText;
        
        const progressPercent = this.stats.goal_progress_today || 0;
        document.getElementById('progressFill').style.width = `${progressPercent}%`;

        // Update recent applications
        this.updateRecentApps();
        
        // Update goal display
        this.updateGoalDisplay();
        
        // Update achievement preview
        this.updateAchievementPreview();
    }

    updateRecentApps() {
        const recentAppsContainer = document.getElementById('recentApps');
        
        if (!this.stats.recent_applications || this.stats.recent_applications.length === 0) {
            recentAppsContainer.innerHTML = '<p style="text-align: center; color: #666; font-size: 12px;">No recent applications</p>';
            return;
        }

        const recentAppsHtml = this.stats.recent_applications.slice(0, 3).map(app => `
            <div class="recent-app">
                <div class="recent-app-info">
                    <div class="recent-app-title">${this.escapeHtml(app.title)}</div>
                    <div class="recent-app-company">${this.escapeHtml(app.company || 'Unknown Company')}</div>
                </div>
                <span class="recent-app-status status-${app.status}">${app.status}</span>
            </div>
        `).join('');

        recentAppsContainer.innerHTML = recentAppsHtml;
    }

    updateAchievementPreview() {
        const achievementContainer = document.getElementById('recentAchievement');
        
        if (!this.stats.recent_achievements || this.stats.recent_achievements.length === 0) {
            achievementContainer.innerHTML = `
                <div class="no-achievement">
                    <span class="achievement-icon">🎯</span>
                    <div class="achievement-text">
                        <div class="achievement-title">Start tracking jobs to unlock achievements!</div>
                        <div class="achievement-desc">Your first application is just one click away</div>
                    </div>
                </div>
            `;
            return;
        }

        const latestAchievement = this.stats.recent_achievements[0];
        achievementContainer.innerHTML = `
            <div class="achievement-item">
                <span class="achievement-icon">${latestAchievement.icon || '🏆'}</span>
                <div class="achievement-text">
                    <div class="achievement-title">${this.escapeHtml(latestAchievement.title)}</div>
                    <div class="achievement-desc">${this.escapeHtml(latestAchievement.description)}</div>
                    <div class="achievement-date">Unlocked ${this.formatDate(latestAchievement.unlocked_at)}</div>
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return 'recently';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        
        return date.toLocaleDateString();
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    openWebPage(path = '/dashboard') {
        chrome.tabs.create({
            url: `http://localhost:3001${path}`
        });
    }

    startGoalEdit() {
        document.getElementById('goalDisplay').classList.add('hidden');
        document.getElementById('goalEdit').classList.remove('hidden');
        
        const currentGoal = this.stats?.daily_goal || 5;
        document.getElementById('goalInput').value = currentGoal;
        document.getElementById('goalInput').focus();
    }

    async saveGoal() {
        const newGoal = parseInt(document.getElementById('goalInput').value);
        
        if (newGoal < 1 || newGoal > 20) {
            this.showMessage('Goal must be between 1 and 20', 'error');
            return;
        }

        try {
            const response = await this.sendMessageToBackground('UPDATE_GOAL', {
                dailyGoal: newGoal,
                weeklyGoal: newGoal * 7
            });

            if (response.success) {
                this.stats.daily_goal = newGoal;
                this.updateGoalDisplay();
                this.cancelGoalEdit();
                this.showMessage('Goal updated successfully!', 'success');
            } else {
                this.showMessage(response.error || 'Failed to update goal', 'error');
            }
        } catch (error) {
            console.error('Error updating goal:', error);
            this.showMessage('Failed to update goal', 'error');
        }
    }

    cancelGoalEdit() {
        document.getElementById('goalEdit').classList.add('hidden');
        document.getElementById('goalDisplay').classList.remove('hidden');
    }

    updateGoalDisplay() {
        const goalText = `${this.stats?.daily_goal || 5} applications/day`;
        document.getElementById('dailyGoalText').textContent = goalText;
    }

    isJobSite(url) {
        const jobSites = [
            'linkedin.com',
            'indeed.com',
            'glassdoor.com',
            'jobs.google.com',
            'stackoverflow.com/jobs',
            'dice.com',
            'monster.com'
        ];
        
        return jobSites.some(site => url.includes(site));
    }

    setButtonLoading(button, loading) {
        const spinner = button.querySelector('.btn-spinner');
        const text = button.querySelector('.btn-text');
        
        if (loading) {
            button.disabled = true;
            if (spinner) spinner.classList.remove('hidden');
            if (text) text.style.opacity = '0';
        } else {
            button.disabled = false;
            if (spinner) spinner.classList.add('hidden');
            if (text) text.style.opacity = '1';
        }
    }

    showMessage(message, type = 'success') {
        const messageDiv = document.getElementById('message');
        const messageText = document.getElementById('messageText');
        
        // Ensure message is a string
        let displayMessage = message;
        if (typeof message === 'object') {
            displayMessage = message?.message || message?.error || JSON.stringify(message);
        }
        
        messageText.textContent = displayMessage;
        messageDiv.className = `message ${type}`;
        messageDiv.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 3000);
    }

    async sendMessageToBackground(action, data = null) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: action,
                data: data
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JobTrackerPopup();
});