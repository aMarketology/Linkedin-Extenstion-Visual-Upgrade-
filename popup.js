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
    
    // Load session stats
    loadSessionStats();
    
    // Refresh stats every 3 seconds
    setInterval(loadSessionStats, 3000);
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
    chrome.tabs.create({ url: 'https://www.linkedin.com' });
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
