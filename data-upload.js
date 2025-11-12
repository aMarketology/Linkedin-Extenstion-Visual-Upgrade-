/**
 * Data Upload Module
 * Handles exporting recruiter LinkedIn data and talent job application data
 * Supports CSV export for Google Sheets import
 */

const DataUpload = (function() {
    'use strict';

    // Storage keys
    const STORAGE_KEYS = {
        RECRUITER_PROFILES: 'unnanu_linkedin_profiles',
        TALENT_APPLICATIONS: 'unnanu_job_applications',
        EXPORT_HISTORY: 'unnanu_export_history'
    };

    // ============================================================================
    // RECRUITER DATA EXPORT (LinkedIn Profiles)
    // ============================================================================

    /**
     * Get all saved LinkedIn profiles
     */
    async function getRecruiterProfiles() {
        try {
            const result = await chrome.storage.local.get([STORAGE_KEYS.RECRUITER_PROFILES]);
            const profiles = result[STORAGE_KEYS.RECRUITER_PROFILES];
            
            // Ensure we return an array
            if (!profiles) return [];
            if (Array.isArray(profiles)) return profiles;
            
            // If it's a single object, wrap in array
            if (typeof profiles === 'object') return [profiles];
            
            return [];
        } catch (error) {
            console.error('❌ Error loading recruiter profiles:', error);
            return [];
        }
    }

    /**
     * Convert LinkedIn profiles to CSV format
     */
    function convertProfilesToCSV(profiles) {
        if (!profiles || profiles.length === 0) {
            return null;
        }

        // Define CSV headers
        const headers = [
            'Full Name',
            'First Name',
            'Last Name',
            'Headline',
            'Location',
            'Current Company',
            'Current Title',
            'Email',
            'Phone',
            'LinkedIn URL',
            'Profile Picture URL',
            'About/Summary',
            'Total Experience (Years)',
            'Education',
            'Skills',
            'Languages',
            'Certifications',
            'Connections',
            'Saved Date',
            'Profile Source'
        ];

        // Convert profiles to CSV rows
        const rows = profiles.map(profile => {
            // Extract current position
            const currentPosition = profile.experience?.[0] || {};
            
            // Extract education
            const education = profile.education?.map(edu => 
                `${edu.degree || ''} at ${edu.school || ''} (${edu.year || ''})`
            ).join('; ') || '';

            // Extract skills
            const skills = Array.isArray(profile.skills) 
                ? profile.skills.join(', ') 
                : (profile.skills || '');

            // Extract languages
            const languages = profile.languages?.map(lang => 
                `${lang.language || ''} (${lang.proficiency || ''})`
            ).join('; ') || '';

            // Extract certifications
            const certifications = profile.certifications?.map(cert => 
                cert.name || ''
            ).join('; ') || '';

            return [
                escapeCSV(profile.fullName || ''),
                escapeCSV(profile.firstName || ''),
                escapeCSV(profile.lastName || ''),
                escapeCSV(profile.headline || ''),
                escapeCSV(profile.location || ''),
                escapeCSV(currentPosition.company || ''),
                escapeCSV(currentPosition.title || ''),
                escapeCSV(profile.email || ''),
                escapeCSV(profile.phone || ''),
                escapeCSV(profile.linkedInUrl || profile.profileUrl || ''),
                escapeCSV(profile.profilePicture || ''),
                escapeCSV(profile.about || profile.summary || ''),
                escapeCSV(profile.yearsOfExperience || ''),
                escapeCSV(education),
                escapeCSV(skills),
                escapeCSV(languages),
                escapeCSV(certifications),
                escapeCSV(profile.connections || ''),
                escapeCSV(profile.savedDate || new Date().toISOString()),
                escapeCSV(profile.source || 'LinkedIn')
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csvContent;
    }

    /**
     * Export LinkedIn profiles to CSV file with date range filter
     */
    async function exportRecruiterDataToCSV(startDate = null, endDate = null) {
        try {
            // Check if LinkedIn tab is open in ANY window
            const linkedInTabOpen = await isLinkedInTabOpen();
            if (linkedInTabOpen) {
                throw new Error('Cannot export while LinkedIn is open. Please close ALL LinkedIn tabs in ALL browser windows before exporting.');
            }

            let profiles = await getRecruiterProfiles();
            
            if (!profiles || profiles.length === 0) {
                throw new Error('No LinkedIn profiles found to export');
            }

            // Filter by date range if specified
            if (startDate || endDate) {
                profiles = filterByDateRange(profiles, startDate, endDate);
                
                if (profiles.length === 0) {
                    throw new Error('No profiles found in the specified date range');
                }
            }

            const csvContent = convertProfilesToCSV(profiles);
            
            if (!csvContent) {
                throw new Error('Failed to convert profiles to CSV');
            }

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const dateRangeSuffix = (startDate || endDate) ? `_${formatDateForFilename(startDate)}_to_${formatDateForFilename(endDate)}` : '';
            const filename = `LinkedIn_Profiles_Export${dateRangeSuffix}_${timestamp}.csv`;
            
            downloadFile(blob, filename);

            // Save export history
            await saveExportHistory({
                type: 'recruiter',
                recordCount: profiles.length,
                timestamp: new Date().toISOString(),
                filename: filename,
                dateRange: (startDate || endDate) ? { startDate, endDate } : null
            });

            return {
                success: true,
                recordCount: profiles.length,
                filename: filename
            };

        } catch (error) {
            console.error('❌ Error exporting recruiter data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ============================================================================
    // TALENT DATA EXPORT (Job Applications)
    // ============================================================================

    /**
     * Get all saved job applications
     */
    async function getTalentApplications() {
        try {
            const result = await chrome.storage.local.get([STORAGE_KEYS.TALENT_APPLICATIONS]);
            const applications = result[STORAGE_KEYS.TALENT_APPLICATIONS];
            
            // Ensure we return an array
            if (!applications) return [];
            if (Array.isArray(applications)) return applications;
            
            // If it's a single object, wrap in array
            if (typeof applications === 'object') return [applications];
            
            return [];
        } catch (error) {
            console.error('❌ Error loading talent applications:', error);
            return [];
        }
    }

    /**
     * Convert job applications to CSV format
     */
    function convertApplicationsToCSV(applications) {
        if (!applications || applications.length === 0) {
            return null;
        }

        // Define CSV headers
        const headers = [
            'Job Title',
            'Company Name',
            'Location',
            'Job URL',
            'Application Date',
            'Status',
            'Submitted',
            'Job Description',
            'Requirements',
            'Salary Range',
            'Job Type',
            'Remote/Hybrid/Onsite',
            'Experience Level',
            'Department',
            'Source Website',
            'Notes',
            'Contact Name',
            'Contact Email',
            'Resume Used',
            'Cover Letter',
            'Follow Up Date',
            'Last Updated'
        ];

        // Convert applications to CSV rows
        const rows = applications.map(app => {
            return [
                escapeCSV(app.jobTitle || app.title || ''),
                escapeCSV(app.company || app.companyName || ''),
                escapeCSV(app.location || ''),
                escapeCSV(app.jobUrl || app.url || ''),
                escapeCSV(app.appliedDate || app.savedDate || ''),
                escapeCSV(app.status || 'Applied'),
                escapeCSV(app.submitted ? 'Yes' : 'No'),
                escapeCSV(app.description || ''),
                escapeCSV(app.requirements || ''),
                escapeCSV(app.salary || app.salaryRange || ''),
                escapeCSV(app.jobType || ''),
                escapeCSV(app.workLocation || ''),
                escapeCSV(app.experienceLevel || ''),
                escapeCSV(app.department || ''),
                escapeCSV(app.source || ''),
                escapeCSV(app.notes || ''),
                escapeCSV(app.contactName || ''),
                escapeCSV(app.contactEmail || ''),
                escapeCSV(app.resumeUsed || ''),
                escapeCSV(app.coverLetter || ''),
                escapeCSV(app.followUpDate || ''),
                escapeCSV(app.lastUpdated || new Date().toISOString())
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csvContent;
    }

    /**
     * Export job applications to CSV file with date range filter
     */
    async function exportTalentDataToCSV(startDate = null, endDate = null) {
        try {
            // Check if LinkedIn tab is open in ANY window
            const linkedInTabOpen = await isLinkedInTabOpen();
            if (linkedInTabOpen) {
                throw new Error('Cannot export while LinkedIn is open. Please close ALL LinkedIn tabs in ALL browser windows before exporting.');
            }

            let applications = await getTalentApplications();
            
            if (!applications || applications.length === 0) {
                throw new Error('No job applications found to export');
            }

            // Filter by date range if specified
            if (startDate || endDate) {
                applications = filterByDateRange(applications, startDate, endDate);
                
                if (applications.length === 0) {
                    throw new Error('No applications found in the specified date range');
                }
            }

            const csvContent = convertApplicationsToCSV(applications);
            
            if (!csvContent) {
                throw new Error('Failed to convert applications to CSV');
            }

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const dateRangeSuffix = (startDate || endDate) ? `_${formatDateForFilename(startDate)}_to_${formatDateForFilename(endDate)}` : '';
            const filename = `Job_Applications_Export${dateRangeSuffix}_${timestamp}.csv`;
            
            downloadFile(blob, filename);

            // Save export history
            await saveExportHistory({
                type: 'talent',
                recordCount: applications.length,
                timestamp: new Date().toISOString(),
                filename: filename,
                dateRange: (startDate || endDate) ? { startDate, endDate } : null
            });

            return {
                success: true,
                recordCount: applications.length,
                filename: filename
            };

        } catch (error) {
            console.error('❌ Error exporting talent data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ============================================================================
    // COMBINED EXPORT
    // ============================================================================

    /**
     * Export all data (both recruiter and talent) to separate CSV files
     */
    async function exportAllData() {
        const results = {
            recruiter: await exportRecruiterDataToCSV(),
            talent: await exportTalentDataToCSV()
        };

        return results;
    }

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    /**
     * Check if any LinkedIn tabs are currently open in ANY window or browser
     */
    async function isLinkedInTabOpen() {
        try {
            // Query ALL tabs across ALL windows (not just current window)
            const tabs = await chrome.tabs.query({});
            const linkedInTabs = tabs.filter(tab => 
                tab.url && (
                    tab.url.includes('linkedin.com') ||
                    tab.url.includes('www.linkedin.com') ||
                    tab.url.includes('//linkedin.com')
                )
            );
            
            if (linkedInTabs.length > 0) {
                console.warn('⚠️ LinkedIn tabs detected in browser:', linkedInTabs.length);
                console.warn('Tab details:', linkedInTabs.map(t => ({
                    windowId: t.windowId,
                    url: t.url,
                    title: t.title
                })));
                return true;
            }
            
            console.log('✅ No LinkedIn tabs detected - safe to export');
            return false;
        } catch (error) {
            console.error('❌ Error checking for LinkedIn tabs:', error);
            // If we can't check, err on the side of caution and block export
            return true;
        }
    }

    /**
     * Get list of all open LinkedIn tabs (for debugging/user info)
     */
    async function getLinkedInTabs() {
        try {
            const tabs = await chrome.tabs.query({});
            return tabs.filter(tab => 
                tab.url && (
                    tab.url.includes('linkedin.com') ||
                    tab.url.includes('www.linkedin.com') ||
                    tab.url.includes('//linkedin.com')
                )
            ).map(tab => ({
                id: tab.id,
                windowId: tab.windowId,
                title: tab.title,
                url: tab.url,
                active: tab.active
            }));
        } catch (error) {
            console.error('❌ Error getting LinkedIn tabs:', error);
            return [];
        }
    }

    /**
     * Close all LinkedIn tabs (helper function)
     */
    async function closeAllLinkedInTabs() {
        try {
            const linkedInTabs = await getLinkedInTabs();
            if (linkedInTabs.length === 0) {
                return { success: true, closedCount: 0 };
            }

            const tabIds = linkedInTabs.map(tab => tab.id);
            await chrome.tabs.remove(tabIds);
            
            console.log(`✅ Closed ${tabIds.length} LinkedIn tabs`);
            return { success: true, closedCount: tabIds.length };
        } catch (error) {
            console.error('❌ Error closing LinkedIn tabs:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Filter records by date range
     */
    function filterByDateRange(records, startDate, endDate) {
        if (!startDate && !endDate) {
            return records;
        }

        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).getTime() : Date.now();

        return records.filter(record => {
            const recordDate = new Date(record.savedDate || record.appliedDate || 0).getTime();
            return recordDate >= start && recordDate <= end;
        });
    }

    /**
     * Format date for filename (YYYY-MM-DD)
     */
    function formatDateForFilename(dateString) {
        if (!dateString) return 'present';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    /**
     * Escape CSV values (handle commas, quotes, newlines)
     */
    function escapeCSV(value) {
        if (value === null || value === undefined) {
            return '';
        }

        // Convert to string
        let stringValue = String(value);

        // Remove any existing quotes at the start/end
        stringValue = stringValue.trim();

        // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            stringValue = '"' + stringValue.replace(/"/g, '""') + '"';
        }

        return stringValue;
    }

    /**
     * Download a file to user's computer
     */
    function downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }

    /**
     * Save export history
     */
    async function saveExportHistory(exportRecord) {
        try {
            const result = await chrome.storage.local.get([STORAGE_KEYS.EXPORT_HISTORY]);
            const history = result[STORAGE_KEYS.EXPORT_HISTORY] || [];
            
            history.unshift(exportRecord); // Add to beginning
            
            // Keep only last 50 exports
            if (history.length > 50) {
                history.splice(50);
            }
            
            await chrome.storage.local.set({ [STORAGE_KEYS.EXPORT_HISTORY]: history });
            console.log('✅ Export history saved');
        } catch (error) {
            console.error('❌ Error saving export history:', error);
        }
    }

    /**
     * Get export history
     */
    async function getExportHistory() {
        try {
            const result = await chrome.storage.local.get([STORAGE_KEYS.EXPORT_HISTORY]);
            return result[STORAGE_KEYS.EXPORT_HISTORY] || [];
        } catch (error) {
            console.error('❌ Error loading export history:', error);
            return [];
        }
    }

    /**
     * Clear export history
     */
    async function clearExportHistory() {
        try {
            await chrome.storage.local.remove([STORAGE_KEYS.EXPORT_HISTORY]);
            console.log('✅ Export history cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing export history:', error);
            return false;
        }
    }

    /**
     * Get data statistics
     */
    async function getDataStats() {
        try {
            const profiles = await getRecruiterProfiles();
            const applications = await getTalentApplications();
            const history = await getExportHistory();

            // Ensure arrays - handle cases where data might be malformed
            const profilesArray = Array.isArray(profiles) ? profiles : [];
            const applicationsArray = Array.isArray(applications) ? applications : [];
            const historyArray = Array.isArray(history) ? history : [];

            return {
                recruiter: {
                    totalProfiles: profilesArray.length,
                    lastSaved: profilesArray[0]?.savedDate || null
                },
                talent: {
                    totalApplications: applicationsArray.length,
                    submitted: applicationsArray.filter(app => app && app.submitted).length,
                    pending: applicationsArray.filter(app => app && !app.submitted).length,
                    lastSaved: applicationsArray[0]?.savedDate || null
                },
                exports: {
                    totalExports: historyArray.length,
                    lastExport: historyArray[0]?.timestamp || null
                }
            };
        } catch (error) {
            console.error('❌ Error getting data stats:', error);
            return {
                recruiter: {
                    totalProfiles: 0,
                    lastSaved: null
                },
                talent: {
                    totalApplications: 0,
                    submitted: 0,
                    pending: 0,
                    lastSaved: null
                },
                exports: {
                    totalExports: 0,
                    lastExport: null
                }
            };
        }
    }

    // ============================================================================
    // GOOGLE SHEETS API (Future Enhancement)
    // ============================================================================

    /**
     * Upload to Google Sheets (placeholder for future implementation)
     * This will require OAuth2 authentication with Google
     */
    async function uploadToGoogleSheets(data, type) {
        // TODO: Implement Google Sheets API integration
        // Will require:
        // 1. OAuth2 authentication
        // 2. Google Sheets API v4
        // 3. Spreadsheet creation/update logic
        console.warn('⚠️ Google Sheets API integration coming soon');
        return {
            success: false,
            message: 'Google Sheets integration not yet implemented. Please use CSV export for now.'
        };
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        // Recruiter exports
        exportRecruiterDataToCSV,
        getRecruiterProfiles,
        
        // Talent exports
        exportTalentDataToCSV,
        getTalentApplications,
        
        // Combined exports
        exportAllData,
        
        // Utilities
        getDataStats,
        getExportHistory,
        clearExportHistory,
        isLinkedInTabOpen,
        getLinkedInTabs,
        closeAllLinkedInTabs,
        
        // Future: Google Sheets
        uploadToGoogleSheets
    };

})();

// Make available globally
if (typeof window !== 'undefined') {
    window.DataUpload = DataUpload;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataUpload;
}
