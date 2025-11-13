/**
 * Unnanu LinkedIn Extension - Content Script
 * Enhanced version with role-based features
 */

console.log("🚀 Unnanu LinkedIn Extension loaded!");

// Storage keys
const STORAGE_KEYS = {
    USER_ROLE: 'unnanu_user_role',
    SETUP_COMPLETE: 'unnanu_setup_complete'
};

// Current user role
let userRole = null;

// Track sidebar state
let sidebarOpen = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

(async function init() {
    console.log('🚀 Unnanu Extension initializing on:', window.location.hostname);
    
    // Get user role
    userRole = await getUserRole();
    
    if (!userRole) {
        console.log('⚠️ No role selected yet. User needs to complete setup.');
        showSetupPrompt();
        return;
    }
    
    console.log(`✅ User role: ${userRole}`);
    
    // Check if we're on LinkedIn
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    console.log(`📍 Website check - LinkedIn: ${isLinkedIn}`);
    
    // Initialize features based on role and website
    if (userRole === 'recruiter' && isLinkedIn) {
        // Recruiter mode only works on LinkedIn
        console.log('🎯 Activating RECRUITER mode for LinkedIn');
        initializeRecruiterMode();
    } else if (userRole === 'talent') {
        // Talent mode works on all job sites
        console.log('💼 Activating TALENT mode for job applications');
        initializeTalentMode();
    } else if (userRole === 'recruiter' && !isLinkedIn) {
        console.log('ℹ️ Recruiter mode only works on LinkedIn. Switch to Talent mode for other job sites.');
    }
    
    // Listen for messages from iframe (e.g., close sidebar, request page data)
    window.addEventListener('message', (event) => {
        if (event.data.action === 'closeTalentSidebar') {
            closeTalentSidebar();
        } else if (event.data.action === 'requestPageData') {
            // Scrape and send page data to iframe
            const pageData = scrapeJobPageData();
            const iframe = document.querySelector('#unnanu-talent-sidebar iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    action: 'pageDataResponse',
                    data: pageData
                }, '*');
            }
        } else if (event.data.action === 'fillField') {
            // Fill a specific field on the page
            fillFieldOnPage(event.data.fieldIdentifier, event.data.value);
        } else if (event.data.action === 'getFormFields') {
            // Scan and return all form fields
            const fields = scanFormFields();
            const iframe = document.querySelector('#unnanu-talent-sidebar iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    action: 'formFieldsResponse',
                    fields: fields
                }, '*');
            }
        }
    });
})();

// ============================================================================
// ROLE DETECTION
// ============================================================================

async function getUserRole() {
    try {
        const result = await chrome.storage.local.get([STORAGE_KEYS.USER_ROLE]);
        return result[STORAGE_KEYS.USER_ROLE] || null;
    } catch (error) {
        console.error('❌ Error getting user role:', error);
        return null;
    }
}

// ============================================================================
// SETUP PROMPT
// ============================================================================

function showSetupPrompt() {
    const promptDiv = document.createElement('div');
    promptDiv.id = 'unnanu-setup-prompt';
    promptDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid #0073b1;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 999999;
        max-width: 320px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    promptDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">👋</div>
            <h3 style="color: #0073b1; margin-bottom: 10px; font-size: 18px;">Welcome to Unnanu!</h3>
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                Click the extension icon to choose your role and get started.
            </p>
            <button id="setup-now-btn" style="
                background: #0073b1;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                width: 100%;
                margin-bottom: 10px;
            ">
                Setup Now
            </button>
            <button id="close-setup-prompt" style="
                background: transparent;
                color: #666;
                border: none;
                cursor: pointer;
                font-size: 12px;
                text-decoration: underline;
            ">
                Remind me later
            </button>
        </div>
    `;
    
    document.body.appendChild(promptDiv);
    
    // Event listeners
    document.getElementById('setup-now-btn')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openPopup' });
        promptDiv.remove();
    });
    
    document.getElementById('close-setup-prompt')?.addEventListener('click', () => {
        promptDiv.remove();
    });
}

// ============================================================================
// RECRUITER MODE
// ============================================================================

function initializeRecruiterMode() {
    console.log('🎯 Initializing Recruiter Mode...');
    
    // Only show recruiter features on profile pages
    if (window.location.href.includes('linkedin.com/in/')) {
        // Auto-extract and cache profile when visiting
        autoExtractAndCache();
        
        // Create floating icon for manual actions
        createFloatingIcon();
    }
}

// Auto-extract profile and cache it
async function autoExtractAndCache() {
    try {
        console.log('🔄 Auto-extracting profile...');
        
        // Check if extractLinkedInProfile function exists
        if (typeof extractLinkedInProfile !== 'function') {
            console.log('⚠️ Profile extraction not available on this page');
            return;
        }
        
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Extract profile data
        const profileData = extractLinkedInProfile();
        
        if (profileData && profileData.fullName) {
            console.log('✅ Profile extracted:', profileData.fullName);
            
            // Cache it using DataSend with error handling
            if (typeof DataSend !== 'undefined') {
                try {
                    await DataSend.saveProfileToCache(profileData);
                    console.log('💾 Profile cached successfully!');
                    
                    // Show brief success notification
                    showBriefNotification('✅ Profile cached: ' + profileData.fullName);
                } catch (cacheError) {
                    // Handle extension context invalidation gracefully
                    if (cacheError.message && cacheError.message.includes('Extension context invalidated')) {
                        console.log('⚠️ Extension was reloaded. Please refresh the page.');
                    } else {
                        console.error('❌ Cache error:', cacheError);
                    }
                }
            }
        } else {
            console.log('⚠️ Could not extract profile data');
        }
    } catch (error) {
        console.error('❌ Auto-extract error:', error);
    }
}

// Show brief notification
function showBriefNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 999999;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================================================
// TALENT MODE
// ============================================================================

function initializeTalentMode() {
    console.log('🎯 Initializing Talent Mode on:', window.location.hostname);
    
    // Check if this looks like a job application page
    if (isJobApplicationPage()) {
        console.log('✅ Job application page detected! Enabling sidebar...');
        
        // Enable the side panel for this tab (doesn't auto-open, just makes it available)
        chrome.runtime.sendMessage({
            action: 'openSidePanel'
        }, (response) => {
            if (response && response.success) {
                console.log('✅ Side panel enabled');
                // Show a subtle notification
                showJobDetectedNotification();
                // Create floating toggle button
                createFloatingToggleButton();
            }
        });
        
        // Watch for modal/overlay creation and maintain z-index
        setupModalWatcher();
    } else {
        console.log('ℹ️ Not a job application page. User can manually open sidebar from extension menu.');
        // Still show floating button for manual access
        createFloatingToggleButton();
        setupModalWatcher();
    }
}

/**
 * Show a notification that a job application was detected
 */
function showJobDetectedNotification() {
    // Remove any existing notification
    const existingNotification = document.getElementById('unnanu-job-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'unnanu-job-notification';
    notification.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">🎯</span>
                <div style="flex: 1;">
                    <div style="font-weight: 700; margin-bottom: 4px; font-size: 16px;">Job Application Detected!</div>
                    <div style="font-size: 13px; opacity: 0.95;">Ready to auto-fill your application</div>
                </div>
                <button id="unnanu-close-notification" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 28px;
                    cursor: pointer;
                    padding: 0;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                ">×</button>
            </div>
            <button id="unnanu-open-sidebar-btn" style="
                background: white;
                color: #667eea;
                border: none;
                padding: 12px 24px;
                border-radius: 10px;
                font-weight: 700;
                cursor: pointer;
                font-size: 15px;
                transition: all 0.2s;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                width: 100%;
                text-align: center;
            ">Open Auto-Fill Sidebar →</button>
        </div>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 24px;
        border-radius: 16px;
        box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        min-width: 320px;
        max-width: 380px;
        animation: slideInFromRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: default;
    `;
    
    // Add animation and styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInFromRight {
            from {
                transform: translateX(120%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutToRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(120%);
                opacity: 0;
            }
        }
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.02);
            }
        }
        #unnanu-close-notification:hover {
            opacity: 1 !important;
            transform: scale(1.1);
        }
        #unnanu-open-sidebar-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.25) !important;
            background: #f0f0f0 !important;
        }
        #unnanu-open-sidebar-btn:active {
            transform: translateY(0);
        }
        #unnanu-job-notification {
            animation: slideInFromRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), pulse 2s ease-in-out 1.5s 3 !important;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Open sidebar button handler
    const openBtn = document.getElementById('unnanu-open-sidebar-btn');
    openBtn.addEventListener('click', () => {
        console.log('🎯 User clicked "Open Auto-Fill Sidebar" button');
        
        // Change button state to loading
        openBtn.disabled = true;
        openBtn.innerHTML = '⏳ Opening Sidebar...';
        openBtn.style.opacity = '0.7';
        
        // Send message to background to open sidebar
        chrome.runtime.sendMessage({ 
            action: 'forceOpenSidePanel'
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('❌ Error:', chrome.runtime.lastError.message);
                showOpenFailure(openBtn, notification);
                return;
            }
            
            if (response && response.success) {
                console.log('✅ Side panel opened successfully');
                // Success - hide notification
                notification.style.animation = 'slideOutToRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            } else {
                console.warn('⚠️ Could not auto-open sidebar');
                showOpenFailure(openBtn, notification);
            }
        });
    });
    
    function showOpenFailure(btn, notif) {
        btn.disabled = false;
        btn.innerHTML = '⚠️ Click the extension icon (top-right) →';
        btn.style.background = '#ffd700';
        btn.style.color = '#333';
        btn.style.opacity = '1';
        btn.style.fontSize = '13px';
        btn.style.padding = '12px 16px';
        
        // Keep notification visible longer
        setTimeout(() => {
            if (document.getElementById('unnanu-job-notification')) {
                notif.style.animation = 'slideOutToRight 0.3s ease-out';
                setTimeout(() => notif.remove(), 300);
            }
        }, 30000); // 30 seconds instead of 20
    }
    
    // Close button handler
    document.getElementById('unnanu-close-notification').addEventListener('click', () => {
        notification.style.animation = 'slideOutToRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-hide after 20 seconds
    setTimeout(() => {
        if (document.getElementById('unnanu-job-notification')) {
            notification.style.animation = 'slideOutToRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 20000);
}

/**
 * Create floating sidebar toggle button with Unnanu logo (horizontal orientation)
 */
function createFloatingToggleButton() {
    // Remove existing button if present
    const existingButton = document.getElementById('unnanu-floating-toggle');
    if (existingButton) {
        existingButton.remove();
    }
    
    const toggleButton = document.createElement('div');
    toggleButton.id = 'unnanu-floating-toggle';
    
    // Get the logo URL with proper encoding
    const logoUrl = chrome.runtime.getURL('images/unnanu-logo.png');
    
    toggleButton.innerHTML = `
        <img src="${logoUrl}" 
             alt="Unnanu Assistant" 
             style="width: 100%; height: 100%; object-fit: contain; pointer-events: none; opacity: 0.9; transform: rotate(270deg);" />
    `;
    toggleButton.style.cssText = `
        position: fixed;
        top: 50%;
        right: 0;
        transform: translateY(-50%);
        width: 144px;
        height: 60px;
        background: none;
        cursor: pointer;
        z-index: 2147483646;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: visible;
    `;
    
    // Add hover effect styles
    const style = document.createElement('style');
    style.id = 'unnanu-toggle-styles';
    style.textContent = `
        #unnanu-floating-toggle:hover {
            transform: translateY(-50%) scale(1.05);
        }
        #unnanu-floating-toggle:active {
            transform: translateY(-50%) scale(0.95);
        }
        @keyframes slideInFromRightToggle {
            from {
                transform: translateY(-50%) translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateY(-50%) translateX(0);
                opacity: 1;
            }
        }
        #unnanu-floating-toggle {
            animation: slideInFromRightToggle 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
    `;
    
    // Remove old style if exists
    const oldStyle = document.getElementById('unnanu-toggle-styles');
    if (oldStyle) oldStyle.remove();
    
    document.head.appendChild(style);
    
    // Click handler to toggle sidebar
    toggleButton.addEventListener('click', () => {
        console.log('🎯 Floating toggle button clicked');
        
        // Add click animation
        toggleButton.style.transform = 'translateY(-50%) scale(0.9)';
        setTimeout(() => {
            toggleButton.style.transform = 'translateY(-50%) scale(1)';
        }, 100);
        
        // Send message to background to toggle sidebar
        chrome.runtime.sendMessage({ 
            action: 'forceOpenSidePanel'
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('❌ Error:', chrome.runtime.lastError.message);
                // Show brief error notification
                showBriefNotification('⚠️ Please click the extension icon to open sidebar');
                return;
            }
            
            if (response && response.success) {
                console.log('✅ Side panel toggled via floating button');
            }
        });
    });
    
    document.body.appendChild(toggleButton);
    console.log('✅ Floating toggle button created');
}

/**
 * Detect if the current page is likely a job application page
 */
function isJobApplicationPage() {
    const url = window.location.href.toLowerCase();
    const pageText = document.body.innerText.toLowerCase();
    const pageHTML = document.body.innerHTML.toLowerCase();
    
    // URL-based detection
    const jobUrlKeywords = [
        '/career', '/job', '/apply', '/application', '/position', '/opening',
        '/employment', '/hiring', '/recruit', '/vacancy', '/work-with-us',
        '/join', '/opportunities'
    ];
    
    const hasJobUrl = jobUrlKeywords.some(keyword => url.includes(keyword));
    
    // Form-based detection - look for application forms
    const hasApplicationForm = 
        document.querySelector('form[id*="apply"]') ||
        document.querySelector('form[id*="application"]') ||
        document.querySelector('form[class*="apply"]') ||
        document.querySelector('form[class*="application"]') ||
        document.querySelector('form[id*="career"]') ||
        document.querySelector('form[class*="career"]') ||
        document.querySelector('form[id*="job"]') ||
        document.querySelector('form[class*="job"]');
    
    // Text-based detection - look for job application keywords
    const jobKeywords = [
        'apply now', 'submit application', 'job application', 'employment application',
        'apply for this position', 'submit resume', 'upload resume', 'cover letter',
        'start application', 'application form', 'apply online', 'job opening',
        'position details', 'employment opportunity', 'career opportunity'
    ];
    
    const hasJobKeywords = jobKeywords.some(keyword => 
        pageText.includes(keyword) || pageHTML.includes(keyword)
    );
    
    // Input field detection - look for typical application form fields
    const applicationFields = [
        'input[name*="resume"]', 'input[name*="cv"]', 
        'input[name*="first"]', 'input[name*="last"]',
        'input[type="file"][accept*="pdf"]',
        'input[name*="phone"]', 'input[name*="email"]',
        'textarea[name*="cover"]', 'textarea[name*="letter"]',
        'select[name*="experience"]', 'select[name*="education"]'
    ];
    
    const hasApplicationFields = applicationFields.some(selector => 
        document.querySelector(selector)
    );
    
    // Check for specific job application platforms
    const jobPlatforms = [
        'greenhouse.io', 'lever.co', 'workday.com', 'myworkdayjobs.com',
        'indeed.com', 'ziprecruiter.com', 'linkedin.com', 'glassdoor.com',
        'monster.com', 'careerbuilder.com', 'smartrecruiters.com',
        'jobvite.com', 'icims.com', 'taleo.net', 'ultipro.com',
        'paycomonline.com', 'bamboohr.com', 'breezy.hr', 'crewrecruiter.co'
    ];
    
    const isJobPlatform = jobPlatforms.some(platform => 
        window.location.hostname.includes(platform)
    );
    
    // Page title detection
    const pageTitle = document.title.toLowerCase();
    const titleKeywords = ['career', 'job', 'apply', 'application', 'position', 'hiring', 'employment'];
    const hasTitleKeyword = titleKeywords.some(keyword => pageTitle.includes(keyword));
    
    // Return true if multiple indicators suggest it's a job application page
    const indicators = [
        hasJobUrl,
        hasApplicationForm,
        hasJobKeywords,
        hasApplicationFields,
        isJobPlatform,
        hasTitleKeyword
    ].filter(Boolean).length;
    
    console.log('📊 Job page detection indicators:', {
        hasJobUrl,
        hasApplicationForm,
        hasJobKeywords,
        hasApplicationFields,
        isJobPlatform,
        hasTitleKeyword,
        totalIndicators: indicators
    });
    
    // Consider it a job application page if we have 2 or more indicators
    return indicators >= 2;
}

let talentSidebarOpen = false;

/**
 * Watch for modals/overlays being added to the DOM and maintain our z-index
 */
function setupModalWatcher() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    // Check if it's a modal/overlay
                    const style = window.getComputedStyle(node);
                    const zIndex = parseInt(style.zIndex);
                    
                    // If a high z-index element is added, re-assert our icon and sidebar
                    if (zIndex > 1000000) {
                        const icon = document.getElementById('unnanu-job-helper');
                        const sidebar = document.getElementById('unnanu-talent-sidebar');
                        
                        if (icon) {
                            icon.style.zIndex = '2147483647';
                        }
                        if (sidebar) {
                            sidebar.style.zIndex = '2147483646';
                        }
                    }
                }
            });
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Modal watcher initialized');
}

function createJobHelperIcon() {
    // Remove existing icon if present
    const existingIcon = document.getElementById('unnanu-job-helper');
    if (existingIcon) {
        existingIcon.remove();
    }

    const icon = document.createElement('div');
    icon.id = 'unnanu-job-helper';
    icon.innerHTML = '🎯';
    icon.style.cssText = `
        position: fixed !important;
        top: 50%;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-radius: 50%;
        cursor: pointer;
        z-index: 2147483647 !important;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        transform: translateY(-50%);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        pointer-events: auto !important;
    `;
    
    icon.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-50%) scale(1.1)';
        this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
    });
    
    icon.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(-50%) scale(1)';
        this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });
    
    icon.addEventListener('click', function() {
        toggleTalentSidebar();
    });
    
    document.body.appendChild(icon);
    console.log('✅ Talent helper icon added!');
}

function toggleTalentSidebar() {
    if (talentSidebarOpen) {
        closeTalentSidebar();
    } else {
        openTalentSidebar();
    }
}

function openTalentSidebar() {
    console.log('🎯 Opening Talent Sidebar...');
    
    // Remove existing sidebar if present
    const existingSidebar = document.getElementById('unnanu-talent-sidebar');
    if (existingSidebar) {
        existingSidebar.remove();
    }
    
    // Scrape page data BEFORE opening sidebar (content script has access)
    const pageData = scrapeJobPageData();
    
    // Create iframe container
    const sidebar = document.createElement('div');
    sidebar.id = 'unnanu-talent-sidebar';
    sidebar.style.cssText = `
        position: fixed !important;
        top: 0;
        right: 0;
        width: 450px;
        height: 100vh;
        z-index: 2147483646 !important;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
        pointer-events: auto !important;
        opacity: 1 !important;
    `;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
            }
            to {
                transform: translateX(0);
            }
        }
        
        /* Ensure sidebar stays on top and clickable */
        #unnanu-talent-sidebar {
            isolation: isolate !important;
        }
        
        #unnanu-talent-sidebar iframe {
            pointer-events: auto !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);
    
    // Create iframe to load the talent sidebar
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('ui/talent-sidebar.html');
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        display: block;
        pointer-events: auto !important;
        opacity: 1 !important;
    `;
    
    sidebar.appendChild(iframe);
    document.body.appendChild(sidebar);
    
    talentSidebarOpen = true;
    console.log('✅ Talent sidebar opened!');
}

function closeTalentSidebar() {
    console.log('📁 Closing talent sidebar...');
    const sidebar = document.getElementById('unnanu-talent-sidebar');
    if (sidebar) {
        sidebar.remove();
        talentSidebarOpen = false;
        console.log('✅ Talent sidebar closed!');
    }
}

function openJobHelperSidebar() {
    openTalentSidebar();
}

// ============================================================================
// FLOATING ICON (RECRUITER MODE)
// ============================================================================

function createFloatingIcon() {
    const icon = document.createElement('div');
    icon.id = 'unnanu-icon';
    icon.innerHTML = 'U';
    icon.style.cssText = `
        position: fixed;
        top: 50%;
        right: 20px;
        width: 60px;
        height: 60px;
    background: #0073b1;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 20px;
    transform: translateY(-50%);
    box-shadow: 0 4px 12px rgba(0, 115, 177, 0.3);
    transition: all 0.3s ease;
`;

// Hover effects
icon.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-50%) scale(1.1)';
    this.style.boxShadow = '0 6px 20px rgba(0, 115, 177, 0.4)';
});

icon.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(-50%) scale(1)';
    this.style.boxShadow = '0 4px 12px rgba(0, 115, 177, 0.3)';
});

// Click to toggle sidebar
icon.addEventListener('click', function() {
    console.log("🖱️ Unnanu icon clicked!");
    toggleSidebar();
});

// ============================================================================
// SIDEBAR TOGGLE
// ============================================================================

function toggleSidebar() {
    if (sidebarOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// ============================================================================
// PROFILE DATA EXTRACTION
// ============================================================================

function extractLinkedInProfile() {
    console.log("🔍 Extracting LinkedIn profile data...");
    
    // Check if we're on a LinkedIn profile page
    if (!window.location.href.includes('linkedin.com/in/')) {
        return {
            isLinkedInProfile: false,
            message: "Not on a LinkedIn profile page"
        };
    }
    
    try {
        // Extract profile image
        const profileImage = extractWithSelectors([
            'img.pv-top-card-profile-picture__image',
            'img.profile-photo-edit__preview',
            '.pv-top-card__photo img',
            'button img[alt*="profile photo"]',
            'img[alt*="profile picture"]'
        ], 'src');

        // Extract name
        const fullName = extractWithSelectors([
            'h1.text-heading-xlarge',
            '.pv-text-details__left-panel h1',
            'h1.top-card-layout__title',
            '.pv-top-card h1',
            'h1.break-words'
        ]);

        // Extract headline/title
        const headline = extractWithSelectors([
            '.text-body-medium.break-words',
            '.pv-text-details__left-panel .text-body-medium',
            '.top-card-layout__headline',
            '.pv-top-card .text-body-medium'
        ]);

        // Extract location
        const location = extractWithSelectors([
            '.text-body-small.inline.t-black--light.break-words',
            '.pv-text-details__left-panel .text-body-small',
            '.top-card-layout__first-subline'
        ]);

        // Extract connections and followers
        const { connections, followers } = extractNetworkInfo();

        // Extract About section
        const about = extractAboutSection();

        // Extract Skills
        const skills = extractSkills();

        // Extract Experience (all items, not just 5)
        const experience = extractExperience();

        // Extract Education (all items)
        const education = extractEducation();

        const result = {
            isLinkedInProfile: true,
            fullName: fullName,
            headline: headline,
            location: location,
            profileImage: profileImage,
            connections: connections,
            followers: followers,
            about: about,
            skills: skills,
            experience: experience,
            education: education,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ Profile extraction complete:', {
            name: fullName,
            headline: headline,
            experienceCount: experience.length,
            educationCount: education.length,
            skillsCount: skills.length
        });
        
        return result;
        
    } catch (error) {
        console.error('❌ Error extracting profile data:', error);
        return {
            isLinkedInProfile: false,
            error: error.message
        };
    }
}

// ============================================================================
// EXTRACTION HELPER FUNCTIONS
// ============================================================================

function extractWithSelectors(selectors, attribute = 'textContent') {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            const value = attribute === 'textContent' 
                ? element.textContent.trim() 
                : element[attribute];
            if (value) {
                console.log(`✓ Found using selector: ${selector}`);
                return value;
            }
        }
    }
    return '';
}

function extractNetworkInfo() {
    let connections = '';
    let followers = '';
    
    const statsElements = document.querySelectorAll(
        'a[href*="/in/"], span, .pv-top-card--list span'
    );
    
    for (const element of statsElements) {
        const text = element.textContent.trim().toLowerCase();
        
        if (text.includes('connection') && !connections) {
            connections = element.textContent.trim();
        }
        
        if (text.includes('follower') && !followers) {
            followers = element.textContent.trim();
        }
        
        if (connections && followers) break;
    }
    
    return { connections, followers };
}

function extractAboutSection() {
    const aboutSelectors = [
        '#about ~ * .display-flex.ph5.pv3 span[aria-hidden="true"]',
        '.pv-shared-text-with-see-more span[aria-hidden="true"]',
        '#about ~ * .inline-show-more-text span[aria-hidden="true"]',
        '.pv-about-section .pv-about__summary-text'
    ];
    
    for (const selector of aboutSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            const text = element.textContent.trim();
            console.log('✓ Found about section');
            return text;
        }
    }
    
    return '';
}

function extractSkills() {
    const skills = [];
    const skillSection = document.querySelector('#skills')?.parentElement;
    
    if (skillSection) {
        const skillElements = skillSection.querySelectorAll(
            '.pvs-list__item--line-separated span[aria-hidden="true"]'
        );
        
        skillElements.forEach((element, index) => {
            const skill = element.textContent.trim();
            // Skip empty and duplicate entries
            if (skill && !skills.includes(skill) && index % 2 === 0) {
                skills.push(skill);
            }
        });
        
        console.log(`✓ Found ${skills.length} skills`);
    }
    
    return skills.slice(0, 20); // Limit to top 20 skills
}

function extractExperience() {
    const experience = [];
    const experienceSection = document.querySelector('#experience')?.parentElement;
    
    if (experienceSection) {
        const experienceItems = experienceSection.querySelectorAll('li.artdeco-list__item');
        console.log(`Found ${experienceItems.length} experience items`);
        
        experienceItems.forEach((item) => {
            const titleElement = item.querySelector('.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]');
            const title = titleElement ? titleElement.textContent.trim() : '';
            
            const companyElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"]');
            let company = '';
            if (companyElement) {
                const companyText = companyElement.textContent.trim();
                company = companyText.split('·')[0].trim();
            }
            
            const durationElement = item.querySelector('.t-14.t-normal.t-black--light .pvs-entity__caption-wrapper span[aria-hidden="true"]');
            const duration = durationElement ? durationElement.textContent.trim() : '';
            
            // Get job description if available
            const descElement = item.querySelector('.inline-show-more-text span[aria-hidden="true"]');
            const description = descElement ? descElement.textContent.trim() : '';
            
            if (title && company) {
                experience.push({ title, company, duration, description });
            }
        });
        
        console.log(`✓ Extracted ${experience.length} work experiences`);
    }
    
    return experience;
}

function extractEducation() {
    const education = [];
    const educationSection = document.querySelector('#education')?.parentElement;
    
    if (educationSection) {
        const educationItems = educationSection.querySelectorAll('li.artdeco-list__item');
        console.log(`Found ${educationItems.length} education items`);
        
        educationItems.forEach((item) => {
            const schoolElement = item.querySelector('.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]');
            const school = schoolElement ? schoolElement.textContent.trim() : '';
            
            const degreeElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"]');
            const degree = degreeElement ? degreeElement.textContent.trim() : '';
            
            const yearElement = item.querySelector('.t-14.t-normal.t-black--light .pvs-entity__caption-wrapper span[aria-hidden="true"]');
            const years = yearElement ? yearElement.textContent.trim() : '';
            
            if (school || degree) {
                education.push({ school, degree, years });
            }
        });
        
        console.log(`✓ Extracted ${education.length} education entries`);
    }
    
    return education;
}

// ============================================================================
// SIDEBAR UI
// ============================================================================

async function openSidebar() {
    console.log("📂 Opening sidebar...");
    
    // Remove existing sidebar if any
    const existing = document.getElementById('unnanu-sidebar');
    if (existing) existing.remove();
    
    // Extract profile data
    const profileData = extractLinkedInProfile();
    
    // Save to cache if valid profile
    if (profileData.isLinkedInProfile && profileData.fullName) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'saveProfile',
                data: profileData
            });
            
            if (response && response.success) {
                console.log(`✅ Profile cached! Total profiles in session: ${response.profileCount}`);
            }
        } catch (error) {
            // Handle extension context invalidation gracefully
            if (error.message && error.message.includes('Extension context invalidated')) {
                console.warn('⚠️ Extension was reloaded. Please refresh the page to cache profiles.');
                // Still show sidebar, just skip caching
            } else {
                console.error('⚠️ Failed to cache profile:', error);
            }
        }
    }
    
    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.id = 'unnanu-sidebar';
    sidebar.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 420px;
        height: 100vh;
        background: white;
        border-left: 2px solid #0073b1;
        box-shadow: -5px 0 15px rgba(0,0,0,0.2);
        z-index: 99998;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow-y: auto;
    `;
    
    // Generate sidebar content
    sidebar.innerHTML = profileData.isLinkedInProfile && profileData.fullName 
        ? generateProfileSidebar(profileData)
        : generateNonProfileSidebar();
    
    // Add event listeners
    setupSidebarListeners(sidebar, profileData);
    
    document.body.appendChild(sidebar);
    sidebarOpen = true;
    console.log("✅ Sidebar opened!");
}

function generateProfileSidebar(data) {
    // Sanitize all data
    const sanitize = DataSend.sanitizeHTML;
    
    return `
        <div style="position: sticky; top: 0; background: #f8f9fa; padding: 15px 20px; border-bottom: 2px solid #0073b1; z-index: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="color: #0073b1; margin: 0; font-size: 18px; font-weight: 600;">📋 LinkedIn Profile</h2>
                <button id="close-sidebar" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #666; line-height: 1;">&times;</button>
            </div>
        </div>
        
        <div style="padding: 20px;">
            <!-- Profile Header -->
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="${data.profileImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNFMUUxRTEiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIxNSIgZmlsbD0iIzlDOUM5QyIvPjxwYXRoIGQ9Ik0yMCA3MEM0MCA2MCA2MCA2MCA4MCA3MEw4MCA5MEwyMCA5MEwyMCA3MFoiIGZpbGw9IiM5QzlDOUMiLz48L3N2Zz4='}" 
                     alt="Profile" 
                     style="width: 100px; height: 100px; border-radius: 50%; border: 4px solid #0073b1; object-fit: cover; background: #f3f4f6;"
                     onerror="this.style.display='none'">
                <h3 style="color: #1a1a1a; margin: 15px 0 5px 0; font-size: 20px; font-weight: 600;">${sanitize(data.fullName)}</h3>
                ${data.headline ? `<p style="color: #666; font-size: 14px; margin: 0; line-height: 1.4;">${sanitize(data.headline)}</p>` : ''}
                ${data.location ? `<p style="color: #999; font-size: 13px; margin: 5px 0 0 0;">📍 ${sanitize(data.location)}</p>` : ''}
            </div>
            
            <!-- Network Stats -->
            ${(data.connections || data.followers) ? `
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    ${data.connections ? `
                        <div style="flex: 1; background: #e8f4f8; padding: 12px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase;">Connections</div>
                            <div style="font-size: 16px; color: #0073b1; font-weight: 700; margin-top: 4px;">🔗 ${sanitize(data.connections)}</div>
                        </div>
                    ` : ''}
                    ${data.followers ? `
                        <div style="flex: 1; background: #e8f4f8; padding: 12px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase;">Followers</div>
                            <div style="font-size: 16px; color: #0073b1; font-weight: 700; margin-top: 4px;">👥 ${sanitize(data.followers)}</div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <!-- About Section -->
            ${data.about ? `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid #0073b1;">
                    <h4 style="color: #0073b1; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">📝 ABOUT</h4>
                    <p style="color: #333; font-size: 13px; line-height: 1.6; margin: 0; max-height: 120px; overflow-y: auto;">${sanitize(data.about)}</p>
                </div>
            ` : ''}
            
            <!-- Skills -->
            ${data.skills && data.skills.length > 0 ? `
                <div style="background: #fff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="color: #0073b1; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">🎯 SKILLS (${data.skills.length})</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${data.skills.slice(0, 15).map(skill => 
                            `<span style="background: #e8f4f8; color: #0073b1; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;">${sanitize(skill)}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Experience -->
            ${data.experience && data.experience.length > 0 ? `
                <div style="background: #fff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="color: #0073b1; margin: 0 0 15px 0; font-size: 14px; font-weight: 600;">💼 EXPERIENCE (${data.experience.length})</h4>
                    ${data.experience.slice(0, 5).map((exp, index) => `
                        <div style="margin-bottom: ${index < 4 ? '15px' : '0'}; padding-bottom: ${index < 4 ? '15px' : '0'}; ${index < 4 ? 'border-bottom: 1px solid #f0f0f0;' : ''}">
                            ${exp.title ? `<div style="color: #1a1a1a; font-size: 14px; font-weight: 600; margin-bottom: 4px;">${sanitize(exp.title)}</div>` : ''}
                            ${exp.company ? `<div style="color: #666; font-size: 13px; margin-bottom: 2px;">${sanitize(exp.company)}</div>` : ''}
                            ${exp.duration ? `<div style="color: #999; font-size: 12px;">${sanitize(exp.duration)}</div>` : ''}
                        </div>
                    `).join('')}
                    ${data.experience.length > 5 ? `<div style="color: #0073b1; font-size: 12px; font-style: italic; text-align: center; margin-top: 10px;">+${data.experience.length - 5} more</div>` : ''}
                </div>
            ` : ''}
            
            <!-- Education -->
            ${data.education && data.education.length > 0 ? `
                <div style="background: #fff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="color: #0073b1; margin: 0 0 15px 0; font-size: 14px; font-weight: 600;">🎓 EDUCATION (${data.education.length})</h4>
                    ${data.education.slice(0, 3).map((edu, index) => `
                        <div style="margin-bottom: ${index < 2 ? '15px' : '0'}; padding-bottom: ${index < 2 ? '15px' : '0'}; ${index < 2 ? 'border-bottom: 1px solid #f0f0f0;' : ''}">
                            ${edu.school ? `<div style="color: #1a1a1a; font-size: 14px; font-weight: 600; margin-bottom: 4px;">${sanitize(edu.school)}</div>` : ''}
                            ${edu.degree ? `<div style="color: #666; font-size: 13px; margin-bottom: 2px;">${sanitize(edu.degree)}</div>` : ''}
                            ${edu.years ? `<div style="color: #999; font-size: 12px;">${sanitize(edu.years)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Action Buttons -->
            <button id="copy-btn" style="background: #0073b1; color: white; border: none; padding: 14px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%; margin-bottom: 10px; font-weight: 600; transition: background 0.2s;">
                📋 Copy & Cache Profile
            </button>
            <div style="font-size: 11px; color: #666; text-align: center; margin-top: -8px; margin-bottom: 12px;">
                Copies to clipboard + saves to cache for Unnanu
            </div>
            
            <button id="view-cache-btn" style="background: #28a745; color: white; border: none; padding: 14px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%; margin-bottom: 10px; font-weight: 600;">
                🗂️ View Session Cache
            </button>
            
            <button id="close-btn" style="background: #666; color: white; border: none; padding: 14px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%; font-weight: 600;">
                Close
            </button>
            
            <div id="status-message" style="margin-top: 15px; padding: 12px; border-radius: 6px; font-size: 13px; display: none;"></div>
        </div>
    `;
}

function generateNonProfileSidebar() {
    return `
        <div style="position: sticky; top: 0; background: #f8f9fa; padding: 15px 20px; border-bottom: 2px solid #0073b1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="color: #0073b1; margin: 0; font-size: 18px; font-weight: 600;">Unnanu Extension</h2>
                <button id="close-sidebar" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #666;">&times;</button>
            </div>
        </div>
        
        <div style="padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #0073b1, #005885); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,115,177,0.3);">
                    U
                </div>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">ℹ️ NOT A LINKEDIN PROFILE</h4>
                <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.6;">Navigate to a LinkedIn profile page (linkedin.com/in/username) to extract and cache profile data.</p>
            </div>
            
            <button id="view-cache-btn" style="background: #28a745; color: white; border: none; padding: 14px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%; margin-bottom: 10px; font-weight: 600;">
                🗂️ View Session Cache
            </button>
            
            <button id="close-btn" style="background: #666; color: white; border: none; padding: 14px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%; font-weight: 600;">
                Close
            </button>
        </div>
    `;
}

function setupSidebarListeners(sidebar, profileData) {
    // Close button
    const closeButtons = sidebar.querySelectorAll('#close-sidebar, #close-btn');
    closeButtons.forEach(btn => {
        btn?.addEventListener('click', closeSidebar);
    });
    
    // Copy button
    const copyBtn = sidebar.querySelector('#copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => copyProfileData(profileData));
    }
    
    // View cache button
    const cacheBtn = sidebar.querySelector('#view-cache-btn');
    if (cacheBtn) {
        cacheBtn.addEventListener('click', showCacheStats);
    }
}

async function copyProfileData(profileData) {
    try {
        // First, copy to clipboard
        const formatted = JSON.stringify(profileData, null, 2);
        await navigator.clipboard.writeText(formatted);
        
        // Then, save to cache for Unnanu CRM
        if (typeof DataSend !== 'undefined' && profileData) {
            try {
                await DataSend.saveProfileToCache(profileData);
                showStatus('✅ Profile copied to clipboard AND saved to cache!\n📤 Will be sent to Unnanu when tabs close.', 'success');
            } catch (cacheError) {
                // Handle extension reload gracefully
                if (cacheError.message && cacheError.message.includes('Extension context invalidated')) {
                    showStatus('✅ Profile copied to clipboard!\n⚠️ Extension was reloaded - please refresh page to enable caching.', 'info');
                } else {
                    showStatus('✅ Profile copied to clipboard!\n⚠️ Could not save to cache: ' + cacheError.message, 'info');
                }
            }
        } else {
            showStatus('✅ Profile data copied to clipboard!', 'success');
        }
    } catch (error) {
        console.error('❌ Copy failed:', error);
        showStatus('❌ Failed to copy. Check console.', 'error');
    }
}

async function showCacheStats() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getCacheStats' });
        
        if (response.success) {
            const stats = response.stats;
            const message = `
📊 Session Cache Stats:
• Profiles cached: ${stats.profileCount}
• Session started: ${stats.sessionStart ? new Date(stats.sessionStart).toLocaleString() : 'N/A'}
• Last update: ${stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString() : 'N/A'}

${stats.profiles.length > 0 ? '📋 Cached Profiles:\n' + stats.profiles.map((p, i) => `${i + 1}. ${p.name}`).join('\n') : ''}

💡 Data will be sent to Unnanu when you close all LinkedIn tabs.
            `.trim();
            
            showStatus(message, 'info');
        }
    } catch (error) {
        console.error('❌ Error getting cache stats:', error);
        showStatus('❌ Failed to load cache stats', 'error');
    }
}

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    if (!statusEl) return;
    
    const colors = {
        success: { bg: '#d4edda', border: '#28a745', text: '#155724' },
        error: { bg: '#f8d7da', border: '#dc3545', text: '#721c24' },
        info: { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460' }
    };
    
    const color = colors[type] || colors.info;
    
    statusEl.style.background = color.bg;
    statusEl.style.borderLeft = `4px solid ${color.border}`;
    statusEl.style.color = color.text;
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<pre style="margin: 0; white-space: pre-wrap; font-family: inherit; font-size: 12px;">${message}</pre>`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

function closeSidebar() {
    console.log("📁 Closing sidebar...");
    const sidebar = document.getElementById('unnanu-sidebar');
    if (sidebar) {
        sidebar.remove();
        sidebarOpen = false;
        console.log("✅ Sidebar closed!");
    }
}

// Close the createFloatingIcon function
    document.body.appendChild(icon);
    console.log("✅ Recruiter icon added!");
}

// ============================================================================
// MESSAGE LISTENERS
// ============================================================================

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received:', request.action);
    
    if (request.action === 'toggleSidebar') {
        toggleSidebar();
        sendResponse({ success: true });
        return false;
    }
    
    if (request.action === 'roleSelected') {
        console.log('✅ Role selected:', request.role);
        userRole = request.role;
        sendResponse({ success: true });
        // Reload to apply new role
        setTimeout(() => location.reload(), 100);
        return false;
    }
    
    if (request.action === 'analyzePageForJob') {
        const analysis = analyzePageForJobApplication();
        sendResponse(analysis);
        return false;
    }
    
    // Handle requests from sidebar for page data
    if (request.action === 'getPageData') {
        const pageData = scrapeJobPageData();
        sendResponse({ success: true, data: pageData });
        return false;
    }
    
    // Handle requests from sidebar for form fields
    if (request.action === 'getFormFields') {
        const fields = scrapeFormFields();
        sendResponse({ success: true, fields: fields });
        return false;
    }
    
    // Handle auto-fill request from sidebar
    if (request.action === 'fillField') {
        const success = fillFieldOnPage(request.fieldIdentifier, request.value);
        sendResponse({ success: success });
        return false;
    }
    
    return false; // Don't keep channel open
});

// ============================================================================
// PAGE SCRAPING FOR TALENT MODE (runs in content script, has full page access)
// ============================================================================

function scrapeJobPageData() {
    console.log('🔍 Scraping job page data from content script...');
    
    const data = {
        url: window.location.href,
        domain: window.location.hostname,
        title: '',
        company: '',
        location: '',
        salary: '',
        description: ''
    };
    
    // Extract Job Title
    const titleSelectors = [
        'h1.job-title', '.job-posting-title', '[data-qa="job-title"]',
        'h2[data-automation-id="jobPostingHeader"]', '.job-title h2',
        '.app-title', '#header h1', '.posting-headline h2',
        'h1', 'h2', '.job-title', '.position-title'
    ];
    
    for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.trim()) {
            data.title = el.textContent.trim().replace(/\s+/g, ' ');
            break;
        }
    }
    
    // Extract Company
    const companySelectors = [
        '.company-name', '[data-qa="company-name"]',
        '[data-automation-id="company"]', '.company',
        '#company_name', '[class*="company"]', '.employer-name'
    ];
    
    for (const selector of companySelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.trim()) {
            data.company = el.textContent.trim().replace(/\s+/g, ' ');
            break;
        }
    }
    
    // Extract Location
    const locationSelectors = [
        '.job-location', '[data-qa="location"]',
        '[data-automation-id="location"]', '.location',
        '[class*="location"]', '.job-info .location'
    ];
    
    for (const selector of locationSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.trim()) {
            data.location = el.textContent.trim().replace(/\s+/g, ' ');
            break;
        }
    }
    
    console.log('✅ Scraped job data:', data);
    return data;
}

function scrapeFormFields() {
    console.log('🔍 Scanning form fields from content script...');
    
    const fields = [];
    
    // Extended selector to catch Lever, Greenhouse, Workday custom fields
    const inputs = document.querySelectorAll(`
        input[type="text"], 
        input[type="email"], 
        input[type="tel"], 
        input[type="url"], 
        input[type="number"],
        input[type="file"],
        input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="image"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), 
        textarea, 
        select,
        [role="textbox"],
        [contenteditable="true"],
        input[class*="input"],
        input[class*="field"],
        textarea[class*="input"],
        textarea[class*="field"]
    `);
    
    console.log(`📊 Found ${inputs.length} total potential fields`);
    
    inputs.forEach((input, index) => {
        // Skip hidden fields
        if (input.type === 'hidden' || 
            input.style.display === 'none' || 
            input.style.visibility === 'hidden' ||
            input.offsetParent === null ||
            input.getAttribute('aria-hidden') === 'true') {
            return;
        }
        
        // Find label - try multiple methods
        let label = '';
        
        // Method 1: label[for] attribute
        if (input.id) {
            const labelEl = document.querySelector(`label[for="${input.id}"]`);
            if (labelEl) label = labelEl.textContent.trim();
        }
        
        // Method 2: input.labels
        if (!label && input.labels && input.labels.length > 0) {
            label = input.labels[0].textContent.trim();
        }
        
        // Method 3: parent label
        if (!label) {
            const parentLabel = input.closest('label');
            if (parentLabel) label = parentLabel.textContent.trim();
        }
        
        // Method 4: previous sibling label
        if (!label && input.previousElementSibling?.tagName === 'LABEL') {
            label = input.previousElementSibling.textContent.trim();
        }
        
        // Method 5: Look for label in parent container (common in Lever/Greenhouse)
        if (!label) {
            const parent = input.closest('.field, .form-field, .application-question, [class*="field"], [class*="question"]');
            if (parent) {
                const labelInParent = parent.querySelector('label, .label, [class*="label"], legend');
                if (labelInParent) label = labelInParent.textContent.trim();
            }
        }
        
        // Method 6: Look for preceding text/heading (Lever pattern)
        if (!label) {
            const container = input.closest('div');
            if (container) {
                const heading = container.querySelector('h3, h4, .heading, [class*="heading"]');
                if (heading) label = heading.textContent.trim();
            }
        }
        
        // Method 7: aria-label
        if (!label) {
            label = input.getAttribute('aria-label') || '';
        }
        
        // Method 8: aria-labelledby
        if (!label) {
            const labelledBy = input.getAttribute('aria-labelledby');
            if (labelledBy) {
                const labelEl = document.getElementById(labelledBy);
                if (labelEl) label = labelEl.textContent.trim();
            }
        }
        
        // Method 9: data-label or data-field-name attributes
        if (!label) {
            label = input.getAttribute('data-label') || 
                    input.getAttribute('data-field-name') || 
                    input.getAttribute('data-qa') || '';
        }
        
        // Method 10: placeholder as fallback
        if (!label) {
            label = input.placeholder || '';
        }
        
        // Method 11: name attribute cleaned up
        if (!label) {
            label = input.name ? input.name.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2') : '';
        }
        
        // Clean up label (remove asterisks, extra whitespace)
        label = label.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
        
        const fieldData = {
            id: input.id || '',
            name: input.name || '',
            type: input.type || input.tagName.toLowerCase(),
            placeholder: input.placeholder || '',
            label: label,
            className: input.className || '',
            value: input.value || '',
            tagName: input.tagName.toLowerCase(),
            required: input.required || input.getAttribute('aria-required') === 'true' || label.includes('*')
        };
        
        fields.push(fieldData);
        
        console.log(`Field ${index + 1}:`, {
            label: label || '(no label)',
            id: input.id || '(no id)',
            name: input.name || '(no name)',
            type: input.type || input.tagName,
            required: fieldData.required
        });
    });
    
    console.log(`✅ Found ${fields.length} form fields with labels/info`);
    return fields;
}

function scanFormFields() {
    console.log('🔍 Scanning form fields from content script...');
    
    const fields = [];
    const inputs = document.querySelectorAll(`
        input[type="text"], 
        input[type="email"], 
        input[type="tel"], 
        input[type="url"], 
        input[type="number"],
        input:not([type]), 
        textarea, 
        select
    `);
    
    inputs.forEach((input, index) => {
        // Skip hidden or irrelevant fields
        if (input.type === 'hidden' || 
            input.type === 'button' || 
            input.type === 'submit' ||
            input.style.display === 'none') {
            return;
        }
        
        // Get label
        let label = '';
        if (input.id) {
            const labelEl = document.querySelector(`label[for="${input.id}"]`);
            if (labelEl) label = labelEl.textContent.trim();
        }
        if (!label) {
            const parentLabel = input.closest('label');
            if (parentLabel) label = parentLabel.textContent.trim();
        }
        
        fields.push({
            index: index,
            id: input.id || '',
            name: input.name || '',
            type: input.type || input.tagName.toLowerCase(),
            placeholder: input.placeholder || '',
            label: label,
            className: input.className || '',
            value: input.value || ''
        });
    });
    
    console.log(`✅ Found ${fields.length} form fields`);
    return fields;
}

function fillFieldOnPage(identifier, value) {
    console.log(`✏️ Filling field: "${identifier}" = "${value}"`);
    
    // Try multiple methods to find the field
    let field = null;
    
    // Method 1: By ID
    if (identifier) {
        field = document.getElementById(identifier);
    }
    
    // Method 2: By name attribute
    if (!field && identifier) {
        field = document.querySelector(`[name="${identifier}"]`);
    }
    
    // Method 3: By name attribute (case insensitive)
    if (!field && identifier) {
        const allInputs = document.querySelectorAll('input, textarea, select');
        for (const input of allInputs) {
            if (input.name && input.name.toLowerCase() === identifier.toLowerCase()) {
                field = input;
                break;
            }
        }
    }
    
    // Method 4: By placeholder
    if (!field && identifier) {
        field = document.querySelector(`input[placeholder*="${identifier}"], textarea[placeholder*="${identifier}"]`);
    }
    
    // Method 5: By label text
    if (!field && identifier) {
        const labels = document.querySelectorAll('label');
        for (const label of labels) {
            if (label.textContent.toLowerCase().includes(identifier.toLowerCase())) {
                const forAttr = label.getAttribute('for');
                if (forAttr) {
                    field = document.getElementById(forAttr);
                    if (field) break;
                }
                // Check for nested input
                const nestedInput = label.querySelector('input, textarea, select');
                if (nestedInput) {
                    field = nestedInput;
                    break;
                }
            }
        }
    }
    
    if (field) {
        console.log('✅ Found field:', field.tagName, field.type, field.name || field.id);
        
        // Fill the field based on type
        if (field.tagName === 'SELECT') {
            // For dropdowns, try to find matching option
            const options = field.options;
            let matched = false;
            for (let i = 0; i < options.length; i++) {
                const optionText = options[i].textContent.trim().toLowerCase();
                const optionValue = options[i].value.toLowerCase();
                if (optionText === value.toLowerCase() || 
                    optionValue === value.toLowerCase() ||
                    optionText.includes(value.toLowerCase()) ||
                    value.toLowerCase().includes(optionText)) {
                    field.selectedIndex = i;
                    matched = true;
                    break;
                }
            }
            if (!matched && field.options.length > 0) {
                // If no match, just set first non-empty option
                for (let i = 0; i < options.length; i++) {
                    if (options[i].value) {
                        field.selectedIndex = i;
                        break;
                    }
                }
            }
        } else {
            // For text inputs, textareas, etc.
            field.value = value;
        }
        
        // Trigger events to notify the page
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        
        // For React/Vue apps
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(field, value);
        }
        
        // Visual feedback
        const originalBg = field.style.backgroundColor;
        field.style.backgroundColor = '#d4edda';
        setTimeout(() => {
            field.style.backgroundColor = originalBg;
        }, 2000);
        
        console.log('✅ Field filled successfully');
        return true;
    }
    
    console.warn('⚠️ Could not find field:', identifier);
    return false;
}

// ============================================================================
// PAGE ANALYSIS FOR JOB APPLICATIONS
// ============================================================================

function analyzePageForJobApplication() {
    // Check if page has job application form fields
    const formFields = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea, input:not([type])');
    
    // Check for common job application indicators
    const pageText = document.body.textContent.toLowerCase();
    const jobKeywords = ['apply', 'application', 'resume', 'cover letter', 'job', 'position', 'career'];
    const hasJobKeywords = jobKeywords.some(keyword => pageText.includes(keyword));
    
    // Try to extract job title
    let jobTitle = null;
    const titleSelectors = ['h1', '.job-title', '.position-title', '[class*="job"]', 'header h1'];
    for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            jobTitle = element.textContent.trim();
            break;
        }
    }
    
    const isJobPage = formFields.length >= 3 && hasJobKeywords;
    
    return {
        isJobPage,
        jobTitle,
        formFieldCount: formFields.length,
        url: window.location.href
    };
}

console.log("✅ Unnanu extension initialization complete!");
