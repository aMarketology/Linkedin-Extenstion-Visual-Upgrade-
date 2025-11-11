/**
 * Unnanu Data Management Module
 * Handles all caching, storage, and network requests for profile data
 */

const DataSend = (() => {
    // Configuration
    const CONFIG = {
        API_ENDPOINT: 'https://plugin.unnanu.com/api/profiles',
        SESSION_KEY: 'unnanu_session_data',
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000 // 2 seconds
    };

    /**
     * Save profile data to session cache
     * @param {Object} profileData - The profile data to save
     * @returns {Promise<Object>} Updated session data
     */
    async function saveProfileToCache(profileData) {
        try {
            const result = await chrome.storage.local.get([CONFIG.SESSION_KEY]);
            const sessionData = result[CONFIG.SESSION_KEY] || {
                profiles: [],
                sessionStart: new Date().toISOString(),
                lastUpdate: new Date().toISOString()
            };
            
            // Check if profile already exists (by URL)
            const existingIndex = sessionData.profiles.findIndex(
                p => p.url === profileData.url
            );
            
            if (existingIndex >= 0) {
                // Update existing profile
                sessionData.profiles[existingIndex] = {
                    ...profileData,
                    updatedAt: new Date().toISOString()
                };
                console.log('✓ Updated existing profile in cache:', profileData.fullName);
            } else {
                // Add new profile
                sessionData.profiles.push({
                    ...profileData,
                    capturedAt: new Date().toISOString()
                });
                console.log('✓ Added new profile to cache:', profileData.fullName);
            }
            
            sessionData.lastUpdate = new Date().toISOString();
            sessionData.profileCount = sessionData.profiles.length;
            
            await chrome.storage.local.set({ [CONFIG.SESSION_KEY]: sessionData });
            console.log(`📦 Session cache updated. Total profiles: ${sessionData.profileCount}`);
            
            return sessionData;
        } catch (error) {
            console.error('❌ Error saving to cache:', error);
            throw error;
        }
    }

    /**
     * Get current session data from cache
     * @returns {Promise<Object>} Session data
     */
    async function getSessionData() {
        try {
            const result = await chrome.storage.local.get([CONFIG.SESSION_KEY]);
            return result[CONFIG.SESSION_KEY] || { 
                profiles: [], 
                profileCount: 0,
                sessionStart: null,
                lastUpdate: null
            };
        } catch (error) {
            console.error('❌ Error getting session data:', error);
            throw error;
        }
    }

    /**
     * Get cached profile by URL
     * @param {string} url - The profile URL
     * @returns {Promise<Object|null>} Profile data or null
     */
    async function getCachedProfile(url) {
        try {
            const sessionData = await getSessionData();
            const profile = sessionData.profiles.find(p => p.url === url);
            return profile || null;
        } catch (error) {
            console.error('❌ Error getting cached profile:', error);
            return null;
        }
    }

    /**
     * Clear session cache
     * @returns {Promise<void>}
     */
    async function clearCache() {
        try {
            await chrome.storage.local.remove([CONFIG.SESSION_KEY]);
            console.log('🗑️ Session cache cleared');
        } catch (error) {
            console.error('❌ Error clearing cache:', error);
            throw error;
        }
    }

    /**
     * Send session data to Unnanu API
     * @param {boolean} clearAfterSend - Whether to clear cache after successful send
     * @returns {Promise<Object>} API response
     */
    async function sendToAPI(clearAfterSend = true) {
        try {
            const sessionData = await getSessionData();
            
            if (!sessionData.profiles || sessionData.profiles.length === 0) {
                console.log('ℹ️ No profiles to send');
                return { success: false, message: 'No profiles to send' };
            }
            
            console.log(`📤 Sending ${sessionData.profiles.length} profiles to Unnanu API...`);
            
            const payload = {
                sessionId: generateSessionId(),
                sessionStart: sessionData.sessionStart,
                sessionEnd: new Date().toISOString(),
                profileCount: sessionData.profiles.length,
                profiles: sessionData.profiles,
                metadata: {
                    extensionVersion: getExtensionVersion(),
                    browser: getBrowserInfo(),
                    timestamp: new Date().toISOString()
                }
            };
            
            // Send to API with retry logic
            const response = await sendWithRetry(payload);
            
            if (response.success) {
                console.log('✅ Session data sent successfully!');
                
                if (clearAfterSend) {
                    await clearCache();
                }
                
                return response;
            } else {
                throw new Error(response.error || 'Failed to send data');
            }
            
        } catch (error) {
            console.error('❌ Error sending to API:', error);
            throw error;
        }
    }

    /**
     * Send data with retry logic
     * @param {Object} payload - Data to send
     * @param {number} attempt - Current attempt number
     * @returns {Promise<Object>} Response
     */
    async function sendWithRetry(payload, attempt = 1) {
        try {
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                return { success: true, data: result };
            } else {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
            
        } catch (error) {
            console.error(`❌ Send attempt ${attempt} failed:`, error.message);
            
            if (attempt < CONFIG.RETRY_ATTEMPTS) {
                console.log(`🔄 Retrying in ${CONFIG.RETRY_DELAY / 1000}s... (Attempt ${attempt + 1}/${CONFIG.RETRY_ATTEMPTS})`);
                await sleep(CONFIG.RETRY_DELAY);
                return sendWithRetry(payload, attempt + 1);
            } else {
                return { 
                    success: false, 
                    error: error.message,
                    profilesKeptInCache: payload.profileCount
                };
            }
        }
    }

    /**
     * Get cache statistics
     * @returns {Promise<Object>} Cache stats
     */
    async function getCacheStats() {
        try {
            const sessionData = await getSessionData();
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
    }

    /**
     * Export cached data as JSON
     * @returns {Promise<string>} JSON string
     */
    async function exportCacheAsJSON() {
        try {
            const sessionData = await getSessionData();
            return JSON.stringify(sessionData, null, 2);
        } catch (error) {
            console.error('❌ Error exporting cache:', error);
            throw error;
        }
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     */
    function generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get extension version
     * @returns {string} Version number
     */
    function getExtensionVersion() {
        try {
            return chrome.runtime.getManifest().version;
        } catch {
            return '2.0';
        }
    }

    /**
     * Get browser info
     * @returns {string} Browser user agent
     */
    function getBrowserInfo() {
        return navigator.userAgent;
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} text - Text to sanitize
     * @returns {string} Sanitized text
     */
    function sanitizeHTML(text) {
        if (!text) return '';
        
        // Check if we're in a DOM context (content script) or service worker
        if (typeof document !== 'undefined') {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        } else {
            // In service worker, just escape basic HTML entities
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    }

    // Public API
    return {
        // Cache operations
        saveProfileToCache,
        getSessionData,
        getCachedProfile,
        clearCache,
        getCacheStats,
        exportCacheAsJSON,
        
        // Network operations
        sendToAPI,
        
        // Utilities
        sanitizeHTML,
        generateSessionId,
        
        // Config access
        getConfig: () => ({ ...CONFIG })
    };
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataSend;
}
