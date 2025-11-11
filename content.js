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
    // Get user role
    userRole = await getUserRole();
    
    if (!userRole) {
        console.log('⚠️ No role selected yet. User needs to complete setup.');
        showSetupPrompt();
        return;
    }
    
    console.log(`✅ User role: ${userRole}`);
    
    // Initialize features based on role
    if (userRole === 'recruiter') {
        initializeRecruiterMode();
    } else if (userRole === 'talent') {
        initializeTalentMode();
    }
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
        createFloatingIcon();
    }
}

// ============================================================================
// TALENT MODE
// ============================================================================

function initializeTalentMode() {
    console.log('� Initializing Talent Mode...');
    
    // Show talent features on job pages
    if (window.location.href.includes('linkedin.com/jobs')) {
        createJobHelperIcon();
    }
}

function createJobHelperIcon() {
    const icon = document.createElement('div');
    icon.id = 'unnanu-job-helper';
    icon.innerHTML = '💼';
    icon.style.cssText = `
        position: fixed;
        top: 50%;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        border-radius: 50%;
        cursor: pointer;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        transform: translateY(-50%);
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        transition: all 0.3s ease;
    `;
    
    icon.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-50%) scale(1.1)';
        this.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.5)';
    });
    
    icon.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(-50%) scale(1)';
        this.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
    });
    
    icon.addEventListener('click', function() {
        openJobHelperSidebar();
    });
    
    document.body.appendChild(icon);
    console.log('✅ Job helper icon added!');
}

function openJobHelperSidebar() {
    alert('🚧 Talent Mode features coming soon!\n\nFeatures:\n- Quick Apply Helper\n- Application Tracker\n- Job Alerts\n- Resume Optimizer');
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
            
            if (response.success) {
                console.log(`✅ Profile cached! Total profiles in session: ${response.profileCount}`);
            }
        } catch (error) {
            console.error('⚠️ Failed to cache profile:', error);
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
                📋 Copy Profile Data
            </button>
            
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
        const formatted = JSON.stringify(profileData, null, 2);
        await navigator.clipboard.writeText(formatted);
        showStatus('✅ Profile data copied to clipboard!', 'success');
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
    }
    
    if (request.action === 'roleSelected') {
        console.log('✅ Role selected:', request.role);
        userRole = request.role;
        
        // Reload to apply new role
        location.reload();
    }
    
    return true;
});

console.log("✅ Unnanu extension initialization complete!");
