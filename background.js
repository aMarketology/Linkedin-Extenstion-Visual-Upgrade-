/**
 * Unnanu Extension - Background Service Worker
 * Handles extension lifecycle, tab management, and data synchronization
 */

console.log('🚀 Unnanu background service worker loaded');

// ============================================================================
// DATA MANAGEMENT (Inline from datasend.js for service worker compatibility)
// ============================================================================

const DataSend = {
    CONFIG: {
        API_ENDPOINT: 'https://plugin.unnanu.com/api/profiles',
        SESSION_KEY: 'unnanu_session_data',
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000
    },

    async saveProfileToCache(profileData) {
        try {
            const result = await chrome.storage.local.get([this.CONFIG.SESSION_KEY]);
            const sessionData = result[this.CONFIG.SESSION_KEY] || {
                profiles: [],
                sessionStart: new Date().toISOString(),
                lastUpdate: new Date().toISOString()
            };
            
            const existingIndex = sessionData.profiles.findIndex(p => p.url === profileData.url);
            
            if (existingIndex >= 0) {
                sessionData.profiles[existingIndex] = {
                    ...profileData,
                    updatedAt: new Date().toISOString()
                };
                console.log('✓ Updated existing profile in cache:', profileData.fullName);
            } else {
                sessionData.profiles.push({
                    ...profileData,
                    capturedAt: new Date().toISOString()
                });
                console.log('✓ Added new profile to cache:', profileData.fullName);
            }
            
            sessionData.lastUpdate = new Date().toISOString();
            sessionData.profileCount = sessionData.profiles.length;
            
            await chrome.storage.local.set({ [this.CONFIG.SESSION_KEY]: sessionData });
            console.log('📦 Session cache updated. Total profiles: ' + sessionData.profileCount);
            
            return sessionData;
        } catch (error) {
            console.error('❌ Error saving to cache:', error);
            throw error;
        }
    },

    async getSessionData() {
        try {
            const result = await chrome.storage.local.get([this.CONFIG.SESSION_KEY]);
            return result[this.CONFIG.SESSION_KEY] || { 
                profiles: [], 
                profileCount: 0,
                sessionStart: null,
                lastUpdate: null
            };
        } catch (error) {
            console.error('❌ Error getting session data:', error);
            throw error;
        }
    },

    async getCacheStats() {
        try {
            const sessionData = await this.getSessionData();
            return {
                profileCount: sessionData.profileCount || 0,
                sessionStart: sessionData.sessionStart,
                lastUpdate: sessionData.lastUpdate,
                profiles: sessionData.profiles.map(p => ({
                    name: p.fullName,
                    url: p.url,
                    capturedAt: p.capturedAt
                }))
            };
        } catch (error) {
            console.error('❌ Error getting cache stats:', error);
            return { profileCount: 0, profiles: [] };
        }
    },

    async clearCache() {
        try {
            await chrome.storage.local.remove([this.CONFIG.SESSION_KEY]);
            console.log('🗑️ Session cache cleared');
        } catch (error) {
            console.error('❌ Error clearing cache:', error);
            throw error;
        }
    },

    async sendToAPI(clearAfterSend = true) {
        try {
            const sessionData = await this.getSessionData();
            
            if (!sessionData.profiles || sessionData.profiles.length === 0) {
                console.log('ℹ️ No profiles to send');
                return { success: false, message: 'No profiles to send' };
            }
            
            console.log('📤 Sending ' + sessionData.profiles.length + ' profiles to Unnanu API...');
            
            const payload = {
                sessionId: this.generateSessionId(),
                sessionStart: sessionData.sessionStart,
                sessionEnd: new Date().toISOString(),
                profileCount: sessionData.profiles.length,
                profiles: sessionData.profiles,
                metadata: {
                    extensionVersion: chrome.runtime.getManifest().version,
                    browser: navigator.userAgent,
                    timestamp: new Date().toISOString()
                }
            };
            
            const response = await this.sendWithRetry(payload);
            
            if (response.success && clearAfterSend) {
                await this.clearCache();
            }
            
            return response;
        } catch (error) {
            console.error('❌ Error sending to API:', error);
            throw error;
        }
    },

    async sendWithRetry(payload, attempt = 1) {
        try {
            const response = await fetch(this.CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                return { success: true, data: result };
            } else {
                throw new Error('API Error: ' + response.status);
            }
        } catch (error) {
            console.error('❌ Send attempt ' + attempt + ' failed:', error.message);
            
            if (attempt < this.CONFIG.RETRY_ATTEMPTS) {
                console.log('🔄 Retrying in ' + (this.CONFIG.RETRY_DELAY / 1000) + 's...');
                await this.sleep(this.CONFIG.RETRY_DELAY);
                return this.sendWithRetry(payload, attempt + 1);
            } else {
                return { 
                    success: false, 
                    error: error.message,
                    profilesKeptInCache: payload.profileCount
                };
            }
        }
    },

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Storage keys
const STORAGE_KEYS = {
    USER_ROLE: 'unnanu_user_role',
    SETUP_COMPLETE: 'unnanu_setup_complete'
};

// Track active LinkedIn tabs
let linkedInTabs = new Set();

// ============================================================================
// USER ROLE MANAGEMENT
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
// TAB LIFECYCLE MANAGEMENT
// ============================================================================

// Track when LinkedIn tabs are opened
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('linkedin.com')) {
        linkedInTabs.add(tabId);
        console.log('🔗 LinkedIn tab detected:', tabId);
    }
});

// Handle tab closure - check if we should send data
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    if (linkedInTabs.has(tabId)) {
        console.log('❌ LinkedIn tab closed:', tabId);
        linkedInTabs.delete(tabId);
        
        // Check if there are any other LinkedIn tabs open
        const allTabs = await chrome.tabs.query({});
        const hasOtherLinkedInTabs = allTabs.some(tab => 
            tab.url && tab.url.includes('linkedin.com') && tab.id !== tabId
        );
        
        if (!hasOtherLinkedInTabs) {
            console.log('📤 No more LinkedIn tabs open - sending session data to Unnanu');
            await sendDataToUnnanu();
        }
    }
});

// Handle browser/window closure
chrome.windows.onRemoved.addListener(async (windowId) => {
    console.log('🪟 Window closed:', windowId);
    // Send any remaining session data when browser closes
    await sendDataToUnnanu();
});

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Save profile to cache
    if (request.action === 'saveProfile') {
        DataSend.saveProfileToCache(request.data)
            .then((sessionData) => {
                sendResponse({ 
                    success: true, 
                    profileCount: sessionData.profileCount 
                });
            })
            .catch(error => {
                console.error('❌ Error saving profile:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep channel open for async response
    }
    
    // Get session data
    if (request.action === 'getSessionData') {
        DataSend.getSessionData()
            .then(data => {
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
    
    // Get cache stats
    if (request.action === 'getCacheStats') {
        DataSend.getCacheStats()
            .then(stats => {
                sendResponse({ success: true, stats: stats });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
    
    // Manual trigger to send data
    if (request.action === 'sendDataNow') {
        sendDataToUnnanu()
            .then(result => {
                sendResponse({ success: true, result: result });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
    
    // Clear cache
    if (request.action === 'clearCache') {
        DataSend.clearCache()
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});

// ============================================================================
// DATA SYNCHRONIZATION
// ============================================================================

async function sendDataToUnnanu() {
    try {
        const stats = await DataSend.getCacheStats();
        
        if (stats.profileCount === 0) {
            console.log('ℹ️ No profiles to send');
            return { success: true, message: 'No profiles to send' };
        }
        
        console.log('📤 Sending ' + stats.profileCount + ' profile(s) to Unnanu...');
        const result = await DataSend.sendToAPI(true); // true = clear cache after send
        
        if (result.success) {
            console.log('✅ Data successfully sent to Unnanu!');
        } else {
            console.warn('⚠️ Failed to send data, keeping in cache for retry');
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error in sendDataToUnnanu:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// INSTALLATION & UPDATE HANDLERS
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('✨ Unnanu Extension installed successfully!');
        console.log('📋 Version:', chrome.runtime.getManifest().version);
    } else if (details.reason === 'update') {
        const version = chrome.runtime.getManifest().version;
        console.log('🔄 Unnanu Extension updated to version', version);
    }
});