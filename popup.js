/**
 * Unnanu Extension - Popup Script
 * Handles role selection and initial setup
 */

const STORAGE_KEYS = {
    USER_ROLE: 'unnanu_user_role',
    SETUP_COMPLETE: 'unnanu_setup_complete'
};

let selectedRole = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎨 Popup loaded');
    await checkSetupStatus();
    initializeEventListeners();
});

// ============================================================================
// SETUP STATUS CHECK
// ============================================================================

async function checkSetupStatus() {
    try {
        const result = await chrome.storage.local.get([STORAGE_KEYS.USER_ROLE, STORAGE_KEYS.SETUP_COMPLETE]);
        
        if (result[STORAGE_KEYS.SETUP_COMPLETE] && result[STORAGE_KEYS.USER_ROLE]) {
            // Already setup - show status view
            showAlreadySetupView(result[STORAGE_KEYS.USER_ROLE]);
        } else {
            // First time - show setup view
            showSetupView();
        }
    } catch (error) {
        console.error('❌ Error checking setup status:', error);
        showSetupView();
    }
}

// ============================================================================
// VIEW MANAGEMENT
// ============================================================================

function showSetupView() {
    document.getElementById('setup-view').classList.remove('hidden');
    document.getElementById('already-setup-view').classList.add('hidden');
}

function showAlreadySetupView(role) {
    document.getElementById('setup-view').classList.add('hidden');
    document.getElementById('already-setup-view').classList.remove('hidden');
    
    const modeText = role === 'recruiter' ? '🎯 Recruiter Mode' : '💼 Talent Mode';
    document.getElementById('current-mode').textContent = modeText;
    
    // Show different content based on role
    if (role === 'talent') {
        showTalentDashboard();
    } else {
        showRecruiterDashboard();
    }
}

// ============================================================================
// TALENT DASHBOARD
// ============================================================================

async function showTalentDashboard() {
    const statsDiv = document.getElementById('session-stats');
    
    // Get current tab to analyze the page
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    // Get cached job applications
    let applicationCount = 0;
    try {
        const result = await chrome.storage.local.get(['unnanu_job_applications']);
        const jobCache = result.unnanu_job_applications || { applications: [] };
        applicationCount = jobCache.applications.length;
    } catch (e) {
        console.error('Error loading job cache:', e);
    }
    
    statsDiv.innerHTML = `
        <h4 style="color: #667eea; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">🎯 Job Application Assistant</h4>
        
        <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #667eea;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Current Page:</div>
            <div style="font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px;" id="page-analysis">Analyzing...</div>
            <div style="font-size: 12px; color: #666;" id="page-url">${currentTab?.url || 'Unknown'}</div>
        </div>
        
        <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #28a745;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Applications Tracked:</div>
            <div style="font-size: 24px; font-weight: 700; color: #28a745;">${applicationCount}</div>
            ${applicationCount > 0 ? '<button id="view-applications-btn" style="margin-top: 8px; padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">📋 View Applications</button>' : ''}
        </div>

        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 600; color: #667eea; margin-bottom: 10px;">📝 Your Profile (Ready to Auto-Fill)</div>
            <div style="font-size: 11px; color: #555; line-height: 1.8;">
                <div><strong>Name:</strong> Maximillion Deleonardis</div>
                <div><strong>Email:</strong> max@unnanu.ai</div>
                <div><strong>Phone:</strong> (575) 495-0323</div>
                <div><strong>Address:</strong> 4308 Canoas Dr, Austin, TX 78730</div>
            </div>
        </div>

        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 8px;">🎯</div>
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 5px;">Click the floating icon</div>
            <div style="font-size: 11px; opacity: 0.9;">to open auto-fill sidebar</div>
        </div>
    `;
    
    // Add event listener for view applications button
    const viewAppBtn = document.getElementById('view-applications-btn');
    if (viewAppBtn) {
        viewAppBtn.addEventListener('click', showApplicationsList);
    }

    // Analyze the current page
    try {
        const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'analyzePageForJob' });
        if (response?.isJobPage) {
            document.getElementById('page-analysis').innerHTML = `
                <div style="color: #28a745;">✓ Job Application Page Detected</div>
                ${response.jobTitle ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${response.jobTitle}</div>` : ''}
            `;
        } else {
            document.getElementById('page-analysis').innerHTML = `
                <div style="color: #ff9800;">⚠️ Not a job application page</div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">Navigate to a job application to use auto-fill</div>
            `;
        }
    } catch (error) {
        document.getElementById('page-analysis').innerHTML = `
            <div style="color: #666;">Navigate to any job application page</div>
        `;
    }

    // Hide recruiter-specific buttons
    document.getElementById('view-cache-btn').style.display = 'none';
    document.getElementById('send-now-btn').style.display = 'none';
    document.getElementById('clear-cache-btn').style.display = 'none';
    
    // Show Go to Unnanu button with different text for talent mode
    document.getElementById('go-to-linkedin-btn').style.display = 'block';
    document.getElementById('go-to-linkedin-btn').textContent = '🔍 Browse Jobs on unnanu.talent.com';
}

// Show list of cached job applications
async function showApplicationsList() {
    try {
        const result = await chrome.storage.local.get(['unnanu_job_applications']);
        const jobCache = result.unnanu_job_applications || { applications: [] };
        
        const statsDiv = document.getElementById('session-stats');
        statsDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                <h4 style="color: #667eea; margin: 0; font-size: 16px; font-weight: 600;">📋 Your Applications</h4>
                <button id="back-to-dashboard" style="padding: 6px 12px; background: #e0e0e0; color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">← Back</button>
            </div>
            
            <div style="max-height: 350px; overflow-y: auto;">
                ${jobCache.applications.length === 0 ? 
                    '<div style="text-align: center; padding: 30px; color: #999;">No applications tracked yet</div>' :
                    jobCache.applications.map(app => `
                        <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${app.status === 'filled' ? '#28a745' : '#667eea'}; cursor: pointer;" data-url="${app.url}">
                            <div style="font-size: 13px; font-weight: 600; color: #333; margin-bottom: 4px;">${app.jobTitle}</div>
                            <div style="font-size: 11px; color: #666; margin-bottom: 6px;">${app.company} · ${app.location || 'Remote'}</div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #999;">
                                <span>${new Date(app.timestamp).toLocaleDateString()}</span>
                                <span style="background: ${app.status === 'filled' ? '#28a745' : '#667eea'}; color: white; padding: 3px 8px; border-radius: 12px; font-weight: 600;">
                                    ${app.status === 'filled' ? '✓ Filled' : '○ Detected'}
                                </span>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        `;
        
        // Add back button listener
        document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
            showTalentDashboard();
        });
        
        // Add click listeners to open application URLs
        statsDiv.querySelectorAll('[data-url]').forEach(el => {
            el.addEventListener('click', () => {
                const url = el.getAttribute('data-url');
                chrome.tabs.create({ url });
            });
        });
    } catch (error) {
        console.error('Error showing applications list:', error);
    }
}

// ============================================================================
// RECRUITER DASHBOARD
// ============================================================================

function showRecruiterDashboard() {
    // Reset the session stats div to default recruiter layout
    const statsDiv = document.getElementById('session-stats');
    statsDiv.innerHTML = `
        <h4 style="color: #0073b1; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">📊 Current Session</h4>
        <div style="display: flex; justify-content: space-around; margin-bottom: 10px;">
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #0073b1;" id="profile-count">0</div>
                <div style="font-size: 11px; color: #666;">Profiles Cached</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #28a745;" id="session-time">0m</div>
                <div style="font-size: 11px; color: #666;">Session Time</div>
            </div>
        </div>
        <div id="profile-list" style="max-height: 150px; overflow-y: auto; margin-top: 10px;">
            <!-- Profile list will be populated here -->
        </div>
    `;
    
    // Load session stats for recruiter mode
    loadSessionStats();
    
    // Refresh stats every 3 seconds
    setInterval(loadSessionStats, 3000);
    
    // Make sure all buttons are visible for recruiter
    document.getElementById('view-cache-btn').style.display = 'block';
    document.getElementById('send-now-btn').style.display = 'block';
    document.getElementById('clear-cache-btn').style.display = 'block';
    document.getElementById('go-to-linkedin-btn').style.display = 'block';
    document.getElementById('go-to-linkedin-btn').textContent = 'Go to LinkedIn';
}

async function loadSessionStats() {
    try {
        // Request cache stats from background script
        const response = await chrome.runtime.sendMessage({ action: 'getCacheStats' });
        
        if (response?.success && response.stats) {
            const stats = response.stats;
            
            // Update profile count (check if element exists)
            const profileCountEl = document.getElementById('profile-count');
            if (profileCountEl) {
                profileCountEl.textContent = stats.profileCount || 0;
            }
            
            // Calculate session time
            const sessionTimeEl = document.getElementById('session-time');
            if (sessionTimeEl) {
                if (stats.sessionStart) {
                    const sessionStart = new Date(stats.sessionStart);
                    const now = new Date();
                    const diffMinutes = Math.floor((now - sessionStart) / (1000 * 60));
                    sessionTimeEl.textContent = diffMinutes + 'm';
                } else {
                    sessionTimeEl.textContent = '0m';
                }
            }
            
            // Update profile list
            const profileList = document.getElementById('profile-list');
            if (stats.profiles && stats.profiles.length > 0) {
                profileList.innerHTML = `
                    <div style="font-size: 11px; color: #666; margin-bottom: 5px; font-weight: 600;">Cached Profiles:</div>
                    ${stats.profiles.map((p, i) => `
                        <div style="padding: 5px; background: white; margin-bottom: 4px; border-radius: 4px; font-size: 11px; color: #333;">
                            ${i + 1}. ${p.name || 'Unknown'}
                        </div>
                    `).join('')}
                `;
            } else {
                profileList.innerHTML = `
                    <div style="text-align: center; padding: 15px; color: #999; font-size: 12px;">
                        No profiles cached yet.<br>
                        Visit LinkedIn profiles to start collecting data.
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('❌ Error loading session stats:', error);
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function initializeEventListeners() {
    // Role card selection
    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        card.addEventListener('click', () => selectRole(card));
    });

    // Continue button
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', handleContinue);
    }

    // Go to LinkedIn button
    const goToLinkedInBtn = document.getElementById('go-to-linkedin-btn');
    if (goToLinkedInBtn) {
        goToLinkedInBtn.addEventListener('click', openLinkedIn);
    }

    // Change role button
    const changeRoleBtn = document.getElementById('change-role-btn');
    if (changeRoleBtn) {
        changeRoleBtn.addEventListener('click', handleChangeRole);
    }
}

// ============================================================================
// ROLE SELECTION
// ============================================================================

function selectRole(selectedCard) {
    // Remove selection from all cards
    document.querySelectorAll('.role-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Select the clicked card
    selectedCard.classList.add('selected');
    selectedRole = selectedCard.dataset.role;

    // Enable continue button
    document.getElementById('continue-btn').disabled = false;

    console.log('✓ Role selected:', selectedRole);
}

async function handleContinue() {
    if (!selectedRole) {
        alert('Please select a role first');
        return;
    }

    try {
        console.log('💾 Saving role:', selectedRole);

        // Save role and mark setup as complete
        await chrome.storage.local.set({
            [STORAGE_KEYS.USER_ROLE]: selectedRole,
            [STORAGE_KEYS.SETUP_COMPLETE]: true,
            [STORAGE_KEYS.USER_ROLE + '_timestamp']: new Date().toISOString()
        });

        // Notify content script about role selection
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'roleSelected',
                role: selectedRole
            }).catch(() => {
                // Content script might not be loaded yet, that's okay
                console.log('Content script not ready yet');
            });
        }

        // Show success and switch view
        showSuccessMessage(selectedRole);
        
        setTimeout(() => {
            showAlreadySetupView(selectedRole);
        }, 1500);

    } catch (error) {
        console.error('❌ Error saving role:', error);
        alert('Failed to save your selection. Please try again.');
    }
}

function showSuccessMessage(role) {
    const roleText = role === 'recruiter' ? 'Recruiter' : 'Talent';
    const content = document.querySelector('.content');
    
    content.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
            <h2 style="color: #28a745; margin-bottom: 15px;">Setup Complete!</h2>
            <p style="color: #666; font-size: 16px;">
                You're now in <strong>${roleText} Mode</strong>
            </p>
            <p style="color: #999; font-size: 14px; margin-top: 10px;">
                Redirecting...
            </p>
        </div>
    `;
}

// ============================================================================
// CHANGE ROLE
// ============================================================================

async function handleChangeRole() {
    const confirmed = confirm('Are you sure you want to change your role? This will reset your extension settings.');
    
    if (confirmed) {
        try {
            // Clear role settings
            await chrome.storage.local.remove([
                STORAGE_KEYS.USER_ROLE,
                STORAGE_KEYS.SETUP_COMPLETE,
                STORAGE_KEYS.USER_ROLE + '_timestamp'
            ]);

            console.log('🔄 Role reset. Showing setup again...');
            selectedRole = null;
            showSetupView();

        } catch (error) {
            console.error('❌ Error resetting role:', error);
            alert('Failed to reset role. Please try again.');
        }
    }
}

// ============================================================================
// NAVIGATION
// ============================================================================

function openLinkedIn() {
    chrome.tabs.create({ url: 'https://unnanu.talent.com' });
    window.close();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get current user role
async function getUserRole() {
    try {
        const result = await chrome.storage.local.get([STORAGE_KEYS.USER_ROLE]);
        return result[STORAGE_KEYS.USER_ROLE] || null;
    } catch (error) {
        console.error('❌ Error getting user role:', error);
        return null;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getUserRole, STORAGE_KEYS };
}
