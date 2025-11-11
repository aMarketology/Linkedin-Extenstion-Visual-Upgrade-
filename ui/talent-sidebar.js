// Talent Sidebar JavaScript - Auto-fill job application forms
(function() {
    'use strict';

    // User's profile data (dummy data for now)
    const USER_PROFILE = {
        firstName: 'Max',
        lastName: 'Deleonardis',
        preferredName: '',
        email: 'max@amarketology.com',
        phone: '+1 575 495 0323',
        phoneRaw: '5754950323',
        address1: '',
        address2: '',
        city: '78730',
        state: '',
        zipCode: '78730',
        country: 'United States',
        linkedInUrl: 'https://www.linkedin.com/in/max-deleonardis-341a01350/',
        resumeFileName: '2025-MaxDe-SEOServiceMaxResume.pdf'
    };

    // Field detection patterns for common job application forms
    const FIELD_PATTERNS = {
        firstName: [
            'first name', 'firstname', 'fname', 'first_name',
            'given name', 'givenname', 'forename'
        ],
        lastName: [
            'last name', 'lastname', 'lname', 'last_name',
            'surname', 'family name', 'familyname'
        ],
        fullName: [
            'full name', 'fullname', 'name', 'your name',
            'applicant name', 'candidate name'
        ],
        email: [
            'email', 'e-mail', 'email address', 'emailaddress',
            'email_address', 'contact email', 'your email'
        ],
        phone: [
            'phone', 'telephone', 'phone number', 'phonenumber',
            'phone_number', 'tel', 'mobile', 'contact number',
            'cell phone', 'cellphone'
        ],
        linkedIn: [
            'linkedin', 'linkedin url', 'linkedin profile',
            'linkedin_url', 'linkedinurl', 'linkedin link',
            'linkedin.com', 'profile url'
        ],
        address: [
            'address', 'street address', 'address line 1',
            'address1', 'street', 'address_1'
        ],
        city: [
            'city', 'town', 'municipality'
        ],
        state: [
            'state', 'province', 'region', 'state/province'
        ],
        zipCode: [
            'zip', 'zip code', 'zipcode', 'postal code',
            'postalcode', 'postal_code', 'zip_code'
        ],
        country: [
            'country', 'nation', 'country/region'
        ]
    };

    let detectedFields = [];
    let jobDetails = {};

    // Initialize the sidebar
    function init() {
        console.log('🎯 Talent Sidebar initialized');
        
        // Extract job details from the page
        extractJobDetails();
        
        // Detect form fields on the page
        detectFormFields();
        
        // Set up event listeners
        setupEventListeners();
        
        // Display detected fields
        displayDetectedFields();
    }

    // Extract job details from the current page
    function extractJobDetails() {
        console.log('📋 Extracting job details...');
        
        // Access parent document safely
        let parentDoc;
        try {
            parentDoc = window.parent.document;
        } catch (e) {
            console.warn('Cannot access parent document:', e);
            jobDetails.title = 'Job Application Form';
            updateJobDetailsUI();
            return;
        }
        
        // Try multiple selectors for job title
        const titleSelectors = [
            'h1', '.job-title', '.position-title', '[class*="job-title"]',
            '[class*="position"]', 'header h1', '.posting-headline'
        ];
        
        for (const selector of titleSelectors) {
            const element = parentDoc.querySelector(selector);
            if (element && element.textContent.trim()) {
                jobDetails.title = element.textContent.trim();
                break;
            }
        }

        // Try to find company name
        const companySelectors = [
            '.company-name', '[class*="company"]', '.employer-name',
            '.organization', 'header .company', '[data-company]'
        ];
        
        for (const selector of companySelectors) {
            const element = parentDoc.querySelector(selector);
            if (element && element.textContent.trim()) {
                jobDetails.company = element.textContent.trim();
                break;
            }
        }

        // Try to find location
        const locationSelectors = [
            '.location', '[class*="location"]', '.job-location',
            '[data-location]', '.workplace-type'
        ];
        
        for (const selector of locationSelectors) {
            const element = parentDoc.querySelector(selector);
            if (element && element.textContent.trim()) {
                jobDetails.location = element.textContent.trim();
                break;
            }
        }

        // Try to find salary
        const salarySelectors = [
            '.salary', '[class*="salary"]', '.compensation',
            '[class*="pay"]', '.wage', '[data-salary]'
        ];
        
        for (const selector of salarySelectors) {
            const element = parentDoc.querySelector(selector);
            if (element && element.textContent.trim() && 
                (element.textContent.includes('$') || element.textContent.includes('USD'))) {
                jobDetails.salary = element.textContent.trim();
                break;
            }
        }

        // Fallback to analyzing text content
        if (!jobDetails.title) {
            try {
                const textContent = parentDoc.body.textContent;
                // Look for common job title patterns in the example
                const titleMatch = textContent.match(/(?:Position|Job Title|Role):\s*([^\n]+)/i);
                if (titleMatch) {
                    jobDetails.title = titleMatch[1].trim();
                } else {
                    jobDetails.title = 'Job Application';
                }
            } catch (e) {
                jobDetails.title = 'Job Application';
            }
        }

        console.log('📋 Extracted job details:', jobDetails);
        updateJobDetailsUI();
    }

    // Detect form fields on the parent page
    function detectFormFields() {
        console.log('🔍 Detecting form fields...');
        detectedFields = [];

        let parentDoc;
        try {
            parentDoc = window.parent.document;
        } catch (e) {
            console.warn('Cannot access parent document for field detection:', e);
            return;
        }
        const inputs = parentDoc.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input:not([type]), textarea');

        inputs.forEach(input => {
            const fieldInfo = analyzeField(input);
            if (fieldInfo) {
                detectedFields.push(fieldInfo);
            }
        });

        console.log('✅ Detected ' + detectedFields.length + ' form fields:', detectedFields);
    }

    // Analyze a field to determine its type
    function analyzeField(input) {
        const fieldText = [
            input.name || '',
            input.id || '',
            input.placeholder || '',
            input.getAttribute('aria-label') || '',
            input.className || ''
        ].join(' ').toLowerCase();

        // Also check for labels
        let label = '';
        if (input.id) {
            try {
                const labelElement = window.parent.document.querySelector('label[for="' + input.id + '"]');
                if (labelElement) {
                    label = labelElement.textContent.toLowerCase();
                }
            } catch (e) {
                // Can't access parent document
            }
        }
        if (!label) {
            const parentLabel = input.closest('label');
            if (parentLabel) {
                label = parentLabel.textContent.toLowerCase();
            }
        }

        const combinedText = (fieldText + ' ' + label).toLowerCase();

        // Determine field type based on patterns
        for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
            for (const pattern of patterns) {
                if (combinedText.includes(pattern)) {
                    return {
                        element: input,
                        type: fieldType,
                        label: label || input.placeholder || input.name || fieldType,
                        identifier: input.id || input.name || input.placeholder
                    };
                }
            }
        }

        return null;
    }

    // Auto-fill the detected fields
    function autoFillFields() {
        console.log('✨ Auto-filling fields...');
        
        const btn = document.getElementById('autoFillBtn');
        const statusMsg = document.getElementById('statusMessage');
        
        btn.disabled = true;
        btn.innerHTML = '<div class="loading"></div><span>Filling...</span>';
        
        let filledCount = 0;
        const fieldsList = document.getElementById('fieldsList');
        fieldsList.innerHTML = '';

        detectedFields.forEach(field => {
            let value = '';
            
            switch(field.type) {
                case 'firstName':
                    value = USER_PROFILE.firstName;
                    break;
                case 'lastName':
                    value = USER_PROFILE.lastName;
                    break;
                case 'fullName':
                    value = USER_PROFILE.firstName + ' ' + USER_PROFILE.lastName;
                    break;
                case 'email':
                    value = USER_PROFILE.email;
                    break;
                case 'phone':
                    // Try to match the format expected by the field
                    value = USER_PROFILE.phone;
                    break;
                case 'linkedIn':
                    value = USER_PROFILE.linkedInUrl;
                    break;
                case 'address':
                    value = USER_PROFILE.address1;
                    break;
                case 'city':
                    value = USER_PROFILE.city;
                    break;
                case 'state':
                    value = USER_PROFILE.state;
                    break;
                case 'zipCode':
                    value = USER_PROFILE.zipCode;
                    break;
                case 'country':
                    value = USER_PROFILE.country;
                    break;
            }

            if (value && field.element) {
                try {
                    // Set the value
                    field.element.value = value;
                    
                    // Trigger input events to ensure the form recognizes the change
                    field.element.dispatchEvent(new Event('input', { bubbles: true }));
                    field.element.dispatchEvent(new Event('change', { bubbles: true }));
                    field.element.dispatchEvent(new Event('blur', { bubbles: true }));
                    
                    // Add visual feedback
                    field.element.style.backgroundColor = '#d4edda';
                    setTimeout(() => {
                        field.element.style.backgroundColor = '';
                    }, 2000);
                    
                    filledCount++;
                    
                    // Add to fields list
                    const fieldItem = document.createElement('div');
                    fieldItem.className = 'field-item';
                    fieldItem.innerHTML = '<span class="field-label">' + field.type + ':</span><span>' + 
                        (value.length > 30 ? value.substring(0, 30) + '...' : value) + 
                        '</span><span class="field-status">' + String.fromCharCode(9989) + '</span>';
                    fieldsList.appendChild(fieldItem);
                    
                } catch (error) {
                    console.error('Error filling field:', field.type, error);
                }
            }
        });

        // Update UI
        setTimeout(() => {
            btn.disabled = false;
            btn.classList.add('success');
            btn.innerHTML = '<span>' + String.fromCharCode(9989) + '</span><span>Filled ' + filledCount + ' Fields!</span>';
            
            statusMsg.className = 'status-message success';
            statusMsg.textContent = String.fromCharCode(127881) + ' Successfully filled ' + filledCount + ' out of ' + detectedFields.length + ' detected fields!';
            statusMsg.style.display = 'block';
            
            document.getElementById('detectedFields').style.display = 'block';
            
            setTimeout(() => {
                btn.classList.remove('success');
                btn.innerHTML = '<span>' + String.fromCharCode(10024) + '</span><span>Auto-Fill Application</span>';
            }, 3000);
        }, 800);
    }

    // Update job details in UI
    function updateJobDetailsUI() {
        document.getElementById('jobTitle').textContent = jobDetails.title || 'Job Application Form';
        document.getElementById('companyName').textContent = jobDetails.company || String.fromCharCode(8212);
        document.getElementById('jobLocation').textContent = jobDetails.location || String.fromCharCode(8212);
        document.getElementById('jobSalary').textContent = jobDetails.salary || String.fromCharCode(8212);
    }

    // Display detected fields
    function displayDetectedFields() {
        if (detectedFields.length === 0) {
            const statusMsg = document.getElementById('statusMessage');
            statusMsg.className = 'status-message info';
            statusMsg.textContent = String.fromCharCode(128712) + ' No form fields detected yet. Make sure you' + String.fromCharCode(39) + 're on a job application page.';
            statusMsg.style.display = 'block';
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        const autoFillBtn = document.getElementById('autoFillBtn');
        autoFillBtn.addEventListener('click', autoFillFields);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
