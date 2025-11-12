/**
 * User Preferences Module
 * Handles EEO/Demographic questions and user preferences
 */

const UserPreferences = (function() {
    'use strict';

    const PREFERENCES_STORAGE_KEY = 'unnanu_user_preferences';

    // Default user preferences structure
    const DEFAULT_PREFERENCES = {
        demographics: {
            race_ethnicity: null,
            gender: null,
            veteran_status: null,
            disability_status: null
        },
        workAuthorization: {
            legally_authorized_us: null,          // "yes" or "no"
            require_sponsorship: null,            // "yes" or "no"
            sponsorship_date: null                // MM/DD/YYYY
        },
        employmentHistory: {
            worked_here_before: null,             // "yes" or "no"
            worked_here_dates: null,              // MM/DD/YYYY
            currently_working_here: null,         // "yes" or "no"
            current_role_and_supervisor: null,    // text
            contractor_or_employee: null,         // "contractor" or "employee"
            contracting_agency: null,             // text or "NA"
            continue_current_role: null           // "yes", "no", or "NA"
        },
        availability: {
            earliest_start_date: null             // MM/DD/YYYY
        },
        legalRestrictions: {
            restrictive_covenants: null,          // "yes" or "no"
            can_provide_agreement: null           // "yes" or "no"
        },
        autoFillDemographics: true,
        autoFillCommonQuestions: true,
        lastUpdated: null
    };

    // EEO Question patterns for detection
    const EEO_PATTERNS = {
        race_ethnicity: {
            keywords: ['race', 'ethnicity', 'ethnic', 'racial', 'hispanic', 'latino'],
            options: [
                { value: 'white', label: 'White (not Hispanic or Latino)', keywords: ['white', 'caucasian'] },
                { value: 'black', label: 'Black or African-American (not Hispanic or Latino)', keywords: ['black', 'african american'] },
                { value: 'asian', label: 'Asian (not Hispanic or Latino)', keywords: ['asian', 'pacific islander'] },
                { value: 'native_american', label: 'American Indian or Alaskan Native (not Hispanic or Latino)', keywords: ['native american', 'indian', 'alaskan'] },
                { value: 'pacific_islander', label: 'Native Hawaiian or other Pacific Islander (not Hispanic or Latino)', keywords: ['hawaiian', 'pacific'] },
                { value: 'two_or_more', label: 'Two or more races/ethnicities (not Hispanic or Latino)', keywords: ['two or more', 'multiple'] },
                { value: 'hispanic', label: 'Hispanic or Latino', keywords: ['hispanic', 'latino', 'latina', 'latinx'] },
                { value: 'decline', label: "I don't wish to answer", keywords: ['decline', 'prefer not', 'do not wish'] }
            ]
        },
        gender: {
            keywords: ['gender', 'sex'],
            options: [
                { value: 'male', label: 'Male', keywords: ['male', 'man'] },
                { value: 'female', label: 'Female', keywords: ['female', 'woman'] },
                { value: 'non_binary', label: 'Non-binary', keywords: ['non-binary', 'non binary', 'nonbinary'] },
                { value: 'other', label: 'Other', keywords: ['other', 'self describe'] },
                { value: 'decline', label: "I don't wish to answer", keywords: ['decline', 'prefer not', 'do not wish'] }
            ]
        },
        veteran_status: {
            keywords: ['veteran', 'military', 'armed forces', 'service member'],
            options: [
                { value: 'protected_veteran', label: 'I identify as one or more of the classifications of protected veteran', keywords: ['protected veteran', 'disabled veteran', 'identify as'] },
                { value: 'not_veteran', label: 'I am not a protected veteran', keywords: ['not a protected', 'not a veteran'] },
                { value: 'decline', label: 'I choose not to self-identify my protected veteran status', keywords: ['choose not', 'decline', 'prefer not'] }
            ]
        },
        disability_status: {
            keywords: ['disability', 'disabled', 'impairment', 'ada', 'accommodation'],
            options: [
                { value: 'has_disability', label: 'Yes, I have a disability, or have had one in the past', keywords: ['yes', 'have a disability', 'had one'] },
                { value: 'no_disability', label: 'No, I do not have a disability and have not had one in the past', keywords: ['no', 'do not have'] },
                { value: 'decline', label: "I do not want to answer", keywords: ['do not want', 'decline', 'prefer not'] }
            ]
        }
    };

    // Common job application question patterns
    const COMMON_QUESTION_PATTERNS = {
        earliest_start_date: {
            keywords: ['earliest start date', 'when can you start', 'start date', 'available to start'],
            fieldType: 'date',
            preferenceKey: 'availability.earliest_start_date'
        },
        legally_authorized_us: {
            keywords: ['legally authorized', 'authorized to work', 'work authorization', 'legal right to work', 'united states'],
            fieldType: 'select',
            preferenceKey: 'workAuthorization.legally_authorized_us',
            options: [
                { value: 'yes', keywords: ['yes'] },
                { value: 'no', keywords: ['no'] }
            ]
        },
        require_sponsorship: {
            keywords: ['require sponsorship', 'visa sponsorship', 'h-1b', 'employment visa', 'sponsorship for employment'],
            fieldType: 'select',
            preferenceKey: 'workAuthorization.require_sponsorship',
            options: [
                { value: 'yes', keywords: ['yes'] },
                { value: 'no', keywords: ['no'] }
            ]
        },
        worked_here_before: {
            keywords: ['worked for', 'worked here', 'worked for this company', 'previous employment', 'employed here before', 'contractor or employee'],
            fieldType: 'select',
            preferenceKey: 'employmentHistory.worked_here_before',
            options: [
                { value: 'yes', keywords: ['yes'] },
                { value: 'no', keywords: ['no'] }
            ]
        },
        currently_working_here: {
            keywords: ['currently working', 'currently employed', 'current employee', 'working for this company'],
            fieldType: 'select',
            preferenceKey: 'employmentHistory.currently_working_here',
            options: [
                { value: 'yes', keywords: ['yes'] },
                { value: 'no', keywords: ['no'] }
            ]
        },
        current_role_and_supervisor: {
            keywords: ['name of the role', 'who is your supervisor', 'current role', 'supervisor name'],
            fieldType: 'text',
            preferenceKey: 'employmentHistory.current_role_and_supervisor'
        },
        contractor_or_employee: {
            keywords: ['contractor or employee', 'employment type', 'are you a contractor'],
            fieldType: 'select',
            preferenceKey: 'employmentHistory.contractor_or_employee',
            options: [
                { value: 'contractor', keywords: ['contractor', 'contract'] },
                { value: 'employee', keywords: ['employee', 'full-time', 'full time'] }
            ]
        },
        contracting_agency: {
            keywords: ['contracting agency', 'agency are you contracted', 'contracted through', 'staffing agency'],
            fieldType: 'text',
            preferenceKey: 'employmentHistory.contracting_agency'
        },
        continue_current_role: {
            keywords: ['continue working', 'current role along with', 'continue in your current'],
            fieldType: 'select',
            preferenceKey: 'employmentHistory.continue_current_role',
            options: [
                { value: 'yes', keywords: ['yes'] },
                { value: 'no', keywords: ['no'] },
                { value: 'na', keywords: ['na', 'n/a', 'not applicable'] }
            ]
        },
        restrictive_covenants: {
            keywords: ['restrictive covenants', 'non-compete', 'confidentiality agreement', 'contractual obligations', 'prohibited or limited'],
            fieldType: 'select',
            preferenceKey: 'legalRestrictions.restrictive_covenants',
            options: [
                { value: 'yes', keywords: ['yes'] },
                { value: 'no', keywords: ['no'] }
            ]
        },
        can_provide_agreement: {
            keywords: ['provide us with a copy', 'copy of the agreement', 'provide agreement'],
            fieldType: 'select',
            preferenceKey: 'legalRestrictions.can_provide_agreement',
            options: [
                { value: 'yes', keywords: ['yes'] },
                { value: 'no', keywords: ['no'] }
            ]
        }
    };

    /**
     * Load user preferences from storage
     */
    async function loadPreferences() {
        try {
            const result = await chrome.storage.local.get([PREFERENCES_STORAGE_KEY]);
            if (result[PREFERENCES_STORAGE_KEY]) {
                return { ...DEFAULT_PREFERENCES, ...result[PREFERENCES_STORAGE_KEY] };
            }
            return { ...DEFAULT_PREFERENCES };
        } catch (e) {
            console.error('❌ Error loading preferences:', e);
            return { ...DEFAULT_PREFERENCES };
        }
    }

    /**
     * Save user preferences to storage
     */
    async function savePreferences(preferences) {
        try {
            preferences.lastUpdated = new Date().toISOString();
            await chrome.storage.local.set({ [PREFERENCES_STORAGE_KEY]: preferences });
            console.log('✅ Saved user preferences');
            return true;
        } catch (e) {
            console.error('❌ Error saving preferences:', e);
            return false;
        }
    }

    /**
     * Detect if a question is an EEO/demographic question
     */
    function detectEEOQuestion(questionText, fieldElement) {
        const lowerText = questionText.toLowerCase();

        for (const [type, pattern] of Object.entries(EEO_PATTERNS)) {
            // Check if question matches keywords
            const matchesKeywords = pattern.keywords.some(keyword => 
                lowerText.includes(keyword)
            );

            if (matchesKeywords) {
                return {
                    type: type,
                    category: getEEOCategory(type),
                    options: pattern.options,
                    confidence: 'high'
                };
            }
        }

        return null;
    }

    /**
     * Detect if a question is a common job application question
     */
    function detectCommonQuestion(questionText, fieldElement) {
        const lowerText = questionText.toLowerCase();

        for (const [type, pattern] of Object.entries(COMMON_QUESTION_PATTERNS)) {
            // Check if question matches keywords
            const matchesKeywords = pattern.keywords.some(keyword => 
                lowerText.includes(keyword.toLowerCase())
            );

            if (matchesKeywords) {
                return {
                    type: type,
                    fieldType: pattern.fieldType,
                    preferenceKey: pattern.preferenceKey,
                    options: pattern.options || null,
                    confidence: 'high'
                };
            }
        }

        return null;
    }

    /**
     * Get the user's saved preference for a specific common question
     */
    async function getCommonQuestionPreference(preferenceKey) {
        const prefs = await loadPreferences();
        const keys = preferenceKey.split('.');
        let value = prefs;
        for (const key of keys) {
            value = value[key];
            if (value === undefined) return null;
        }
        return value;
    }

    /**
     * Set the user's preference for a common question
     */
    async function setCommonQuestionPreference(preferenceKey, value) {
        const prefs = await loadPreferences();
        const keys = preferenceKey.split('.');
        let obj = prefs;
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        await savePreferences(prefs);
    }

    /**
     * Get friendly category name for EEO type
     */
    function getEEOCategory(type) {
        const categories = {
            race_ethnicity: 'Race/Ethnicity',
            gender: 'Gender',
            veteran_status: 'Veteran Status',
            disability_status: 'Disability Status'
        };
        return categories[type] || 'Demographic Information';
    }

    /**
     * Get the user's saved preference for a specific EEO type
     */
    async function getPreferenceForType(type) {
        const prefs = await loadPreferences();
        return prefs.demographics[type];
    }

    /**
     * Find the matching option for user's preference
     */
    function findMatchingOption(userValue, options) {
        if (!userValue) return null;
        
        return options.find(opt => opt.value === userValue);
    }

    /**
     * Auto-fill EEO field with user's preference
     */
    async function autoFillEEOField(fieldElement, eeoType) {
        const prefs = await loadPreferences();
        
        // Check if auto-fill is enabled
        if (!prefs.autoFillDemographics) {
            console.log('Auto-fill demographics is disabled');
            return false;
        }

        const userValue = prefs.demographics[eeoType];
        if (!userValue) {
            console.log('No preference saved for', eeoType);
            return false;
        }

        // Get the pattern options
        const pattern = EEO_PATTERNS[eeoType];
        if (!pattern) return false;

        const matchingOption = findMatchingOption(userValue, pattern.options);
        if (!matchingOption) return false;

        // Try to fill the field based on element type
        try {
            if (fieldElement.tagName === 'SELECT') {
                // For dropdown/select elements
                const options = fieldElement.querySelectorAll('option');
                for (const option of options) {
                    const optionText = option.textContent.toLowerCase();
                    if (matchingOption.keywords.some(kw => optionText.includes(kw))) {
                        fieldElement.value = option.value;
                        fieldElement.dispatchEvent(new Event('change', { bubbles: true }));
                        return true;
                    }
                }
            } else if (fieldElement.type === 'radio') {
                // For radio buttons - find the parent form group
                const name = fieldElement.name;
                const radioButtons = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
                
                for (const radio of radioButtons) {
                    const label = radio.labels?.[0]?.textContent.toLowerCase() || 
                                  radio.getAttribute('aria-label')?.toLowerCase() || 
                                  radio.parentElement?.textContent.toLowerCase() || '';
                    
                    if (matchingOption.keywords.some(kw => label.includes(kw))) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                        return true;
                    }
                }
            }
        } catch (e) {
            console.error('Error auto-filling EEO field:', e);
            return false;
        }

        return false;
    }

    /**
     * Create preferences setup UI
     */
    function createPreferencesUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        loadPreferences().then(prefs => {
            const html = `
                <div class="preferences-panel">
                    <div class="preferences-header">
                        <h3>⚙️ Your Application Preferences</h3>
                        <p>Set your preferences once and we'll auto-fill these questions on job applications.</p>
                    </div>

                    <div class="preference-toggle">
                        <label class="toggle-label">
                            <input type="checkbox" id="autoFillToggle" ${prefs.autoFillDemographics ? 'checked' : ''}>
                            <span class="toggle-text">Automatically fill EEO questions</span>
                        </label>
                        <label class="toggle-label">
                            <input type="checkbox" id="autoFillCommonToggle" ${prefs.autoFillCommonQuestions !== false ? 'checked' : ''}>
                            <span class="toggle-text">Automatically fill common questions</span>
                        </label>
                    </div>

                    <!-- EEO Demographics Section -->
                    <div class="preference-category">
                        <h4>📊 EEO Demographics (Optional)</h4>
                        ${Object.entries(EEO_PATTERNS).map(([type, pattern]) => `
                            <div class="preference-section">
                                <label class="preference-label">${getEEOCategory(type)}</label>
                                <select class="preference-select" data-pref-type="${type}" data-pref-category="demographics">
                                    <option value="">-- Select --</option>
                                    ${pattern.options.map(opt => `
                                        <option value="${opt.value}" ${prefs.demographics[type] === opt.value ? 'selected' : ''}>
                                            ${opt.label}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Work Authorization Section -->
                    <div class="preference-category">
                        <h4>🌍 Work Authorization</h4>
                        <div class="preference-section">
                            <label class="preference-label">Legally authorized to work in US?</label>
                            <select class="preference-select" data-pref-key="workAuthorization.legally_authorized_us">
                                <option value="">-- Select --</option>
                                <option value="yes" ${prefs.workAuthorization?.legally_authorized_us === 'yes' ? 'selected' : ''}>Yes</option>
                                <option value="no" ${prefs.workAuthorization?.legally_authorized_us === 'no' ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                        <div class="preference-section">
                            <label class="preference-label">Require sponsorship now or future?</label>
                            <select class="preference-select" data-pref-key="workAuthorization.require_sponsorship">
                                <option value="">-- Select --</option>
                                <option value="yes" ${prefs.workAuthorization?.require_sponsorship === 'yes' ? 'selected' : ''}>Yes</option>
                                <option value="no" ${prefs.workAuthorization?.require_sponsorship === 'no' ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>

                    <!-- Employment History Section -->
                    <div class="preference-category">
                        <h4>💼 Employment Questions</h4>
                        <div class="preference-section">
                            <label class="preference-label">Earliest Start Date</label>
                            <input type="date" class="preference-input" data-pref-key="availability.earliest_start_date" 
                                   value="${prefs.availability?.earliest_start_date || ''}">
                        </div>
                        <div class="preference-section">
                            <label class="preference-label">Worked for company before?</label>
                            <select class="preference-select" data-pref-key="employmentHistory.worked_here_before">
                                <option value="">-- Select --</option>
                                <option value="yes" ${prefs.employmentHistory?.worked_here_before === 'yes' ? 'selected' : ''}>Yes</option>
                                <option value="no" ${prefs.employmentHistory?.worked_here_before === 'no' ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                        <div class="preference-section">
                            <label class="preference-label">Currently working at company?</label>
                            <select class="preference-select" data-pref-key="employmentHistory.currently_working_here">
                                <option value="">-- Select --</option>
                                <option value="yes" ${prefs.employmentHistory?.currently_working_here === 'yes' ? 'selected' : ''}>Yes</option>
                                <option value="no" ${prefs.employmentHistory?.currently_working_here === 'no' ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>

                    <!-- Legal Restrictions Section -->
                    <div class="preference-category">
                        <h4>📋 Legal & Restrictions</h4>
                        <div class="preference-section">
                            <label class="preference-label">Any restrictive covenants/non-compete?</label>
                            <select class="preference-select" data-pref-key="legalRestrictions.restrictive_covenants">
                                <option value="">-- Select --</option>
                                <option value="yes" ${prefs.legalRestrictions?.restrictive_covenants === 'yes' ? 'selected' : ''}>Yes</option>
                                <option value="no" ${prefs.legalRestrictions?.restrictive_covenants === 'no' ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>

                    <div class="preferences-actions">
                        <button class="btn-save-prefs">💾 Save Preferences</button>
                        <button class="btn-clear-prefs">🗑️ Clear All</button>
                    </div>

                    <div class="preferences-notice">
                        <small>
                            <strong>Privacy Notice:</strong> This information is stored locally on your device 
                            and is only used to auto-fill application questions. It is never shared or transmitted.
                        </small>
                    </div>
                </div>
            `;

            container.innerHTML = html;
            attachPreferencesEvents(container);
        });
    }

    /**
     * Attach event listeners to preferences UI
     */
    function attachPreferencesEvents(container) {
        // Save button
        const saveBtn = container.querySelector('.btn-save-prefs');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const prefs = await loadPreferences();
                
                // Get all EEO demographic values
                container.querySelectorAll('.preference-select[data-pref-category="demographics"]').forEach(select => {
                    const type = select.getAttribute('data-pref-type');
                    prefs.demographics[type] = select.value || null;
                });

                // Get all common question values (nested keys)
                container.querySelectorAll('.preference-select[data-pref-key], .preference-input[data-pref-key]').forEach(field => {
                    const prefKey = field.getAttribute('data-pref-key');
                    const keys = prefKey.split('.');
                    let obj = prefs;
                    for (let i = 0; i < keys.length - 1; i++) {
                        if (!obj[keys[i]]) obj[keys[i]] = {};
                        obj = obj[keys[i]];
                    }
                    obj[keys[keys.length - 1]] = field.value || null;
                });

                // Get auto-fill toggles
                const autoFillToggle = container.querySelector('#autoFillToggle');
                prefs.autoFillDemographics = autoFillToggle?.checked || false;
                
                const autoFillCommonToggle = container.querySelector('#autoFillCommonToggle');
                prefs.autoFillCommonQuestions = autoFillCommonToggle?.checked !== false;

                // Save
                const saved = await savePreferences(prefs);
                
                if (saved) {
                    saveBtn.textContent = '✅ Saved!';
                    saveBtn.style.background = '#28a745';
                    setTimeout(() => {
                        saveBtn.textContent = '💾 Save Preferences';
                        saveBtn.style.background = '';
                    }, 2000);
                }
            });
        }

        // Clear button
        const clearBtn = container.querySelector('.btn-clear-prefs');
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to clear all preferences?')) {
                    await savePreferences({ ...DEFAULT_PREFERENCES });
                    createPreferencesUI(container.id);
                }
            });
        }
    }

    // Public API
    return {
        loadPreferences,
        savePreferences,
        detectEEOQuestion,
        detectCommonQuestion,
        getPreferenceForType,
        getCommonQuestionPreference,
        setCommonQuestionPreference,
        autoFillEEOField,
        createPreferencesUI,
        EEO_PATTERNS,
        COMMON_QUESTION_PATTERNS,
        DEFAULT_PREFERENCES
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.UserPreferences = UserPreferences;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserPreferences;
}
