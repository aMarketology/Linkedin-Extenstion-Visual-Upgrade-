// Talent Sidebar JavaScript - Auto-fill job application forms
(function() {
    'use strict';

    // ============================================================================
    // DEFAULT USER PROFILE TEMPLATE
    // ============================================================================
    // This is the default profile for ALL NEW USERS using the platform
    // Key Defaults:
    // - Authorized to work in United States (no sponsorship needed)
    // - All demographic fields default to "Prefer not to answer" for privacy
    // - Personal info fields are empty until user uploads resume or manually edits
    // - This profile will be overridden when:
    //   1. User logs in (future feature)
    //   2. User uploads their resume
    //   3. User manually edits any field
    // ============================================================================

    // Cache for field mappings by domain
    const FIELD_CACHE_KEY = 'unnanu_field_mappings';
    const JOB_CACHE_KEY = 'unnanu_job_applications';

    // US State mapping (abbreviation <-> full name)
    const US_STATE_MAP = {
        // Map abbreviations to full names
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
        'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
        'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
        'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
        'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
        'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
        'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
        'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
        'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
        'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
        'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
        // Map full names to abbreviations
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
        'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
        'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
        'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
        'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
        'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
        'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
        'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
        'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
        'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
        'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
    };

    // User's profile data - DEFAULT TEMPLATE FOR NEW USERS
    // This will be overridden when user logs in or uploads their resume
    const USER_PROFILE = {
        firstName: '',
        lastName: '',
        fullName: '',
        preferredName: '',
        email: '',
        phone: '',
        phoneRaw: '',
        phoneFormatted: '',
        phoneCountryCode: '+1',
        address1: '',
        address2: '',
        city: '',
        state: '',
        stateFull: '',
        zipCode: '',
        postalCode: '',
        country: 'United States',
        county: 'United States',
        linkedInUrl: 'https://www.linkedin.com/in/max-deleonardis-341a01350/',
        githubUrl: '',
        websiteUrl: 'https://unnanu.ai',
        resumeFileName: '',
        phoneDeviceType: 'Personal',
        // Extended fields from resume
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        languages: [],
        summary: '',
        yearsOfExperience: 3,
        currentJobTitle: '',
        currentCompany: '',
        degreeLevel: '',
        school: '',
        // Common Application Question Preferences - DEFAULTS FOR ALL USERS
        preferredName: '', // Will be auto-generated from firstName
        legallyAuthorized: 'Yes', // Default: Authorized to work in US
        requireSponsorship: 'No', // Default: No sponsorship needed
        willingToRelocate: 'Yes',
        remoteWorkPreference: 'Hybrid - I understand and agree to come into the office as required',
        yearsOfExperienceText: '',
        yearsOfExperience: 3, // Default to 3+ years
        writingSampleUrl: '',
        portfolioUrls: '', // Stored portfolio/writing sample URLs (persists across sessions)
        howDidYouHearSource: '', // Will be randomly selected
        affirmTruthfulness: 'Yes',
        coverLetterText: '',
        hybridScheduleAgreement: 'Yes', // Agree to hybrid/in-office schedule
        copywritingExperience: 'Yes', // Default to having experience
        // US Work Authorization - DEFAULTS
        usCitizen: 'Yes', // Default: US Citizen
        needsWorkVisa: 'No', // Default: No visa needed
        // Additional question defaults
        pronouns: '',
        currentCountry: 'United States',
        currentStateProvince: '',
        sponsorshipDetails: 'I am authorized to work in the United States and do not require sponsorship',
        hourlyRate: '',
        desiredSalary: '',
        // Demographics - DEFAULTS (for EEO questions) - Always answer with specific values
        race: 'Two or More Races', // Default answer
        gender: 'Male', // Default answer
        hispanicLatino: 'No', // Default answer
        veteran: 'I am not a protected veteran', // Default answer
        disability: 'No, I do not have a disability and have not had one in the past' // Default answer
    };

    // Store uploaded resume file
    let uploadedResumeFile = null;

    // Field detection patterns for common job application forms
    const FIELD_PATTERNS = {
        firstName: [
            'first name', 'firstname', 'fname', 'first_name', 'first-name',
            'given name', 'givenname', 'forename', 'legal first', 'name_first',
            'applicant_firstname', 'candidate_firstname'
        ],
        lastName: [
            'last name', 'lastname', 'lname', 'last_name', 'last-name',
            'surname', 'family name', 'familyname', 'legal last', 'name_last',
            'applicant_lastname', 'candidate_lastname'
        ],
        fullName: [
            'full name', 'fullname', 'name', 'your name', 'legal name',
            'applicant name', 'candidate name', 'complete name', 'full_name'
        ],
        email: [
            'email', 'e-mail', 'email address', 'emailaddress',
            'email_address', 'e_mail', 'contact email', 'your email',
            'applicant_email', 'candidate_email', 'mail'
        ],
        phone: [
            'phone', 'telephone', 'phone number', 'phonenumber',
            'phone_number', 'phone-number', 'tel', 'mobile', 'contact number',
            'cell phone', 'cellphone', 'cell', 'contact phone', 'mobile number',
            'applicant_phone', 'candidate_phone'
        ],
        linkedIn: [
            'linkedin', 'linkedin url', 'linkedin profile',
            'linkedin_url', 'linkedinurl', 'linkedin link',
            'linkedin.com', 'profile url', 'linked in', 'linkedin_profile',
            'social profile', 'professional profile'
        ],
        address: [
            'address', 'street address', 'address line 1', 'address line1',
            'address1', 'address_1', 'address-1', 'street', 'street 1',
            'addressline1', 'line1', 'line 1', 'street_address',
            'mailing address', 'home address', 'residential address'
        ],
        address2: [
            'address line 2', 'address line2', 'address2', 'address_2',
            'address-2', 'addressline2', 'line2', 'line 2', 'apt', 'suite',
            'apartment', 'unit', 'building'
        ],
        city: [
            'city', 'town', 'municipality', 'locality', 'city_name', 'city name'
        ],
        state: [
            'state', 'province', 'region', 'state/province', 'state-province',
            'state_province', 'stateprovince'
        ],
        zipCode: [
            'zip', 'zip code', 'zipcode', 'postal code', 'postal',
            'postalcode', 'postal_code', 'zip_code', 'postcode', 'post code',
            'zip/postal'
        ],
        country: [
            'country', 'nation', 'country/region', 'country-region', 'county',
            'country_region'
        ],
        currentLocation: [
            'current location', 'location', 'your location', 'where are you located',
            'current city', 'residing in', 'based in', 'living in'
        ],
        // Resume-based fields
        skills: [
            'skills', 'skill', 'technical skills', 'core competencies',
            'competencies', 'expertise', 'proficiencies', 'abilities',
            'key skills', 'skillset'
        ],
        experience: [
            'experience', 'work experience', 'years of experience', 
            'total experience', 'professional experience', 'work history',
            'years in field', 'relevant experience', 'career experience'
        ],
        summary: [
            'summary', 'professional summary', 'objective', 'profile',
            'about you', 'bio', 'background', 'introduction', 'cover letter',
            'personal statement', 'career objective', 'about yourself'
        ],
        education: [
            'education', 'degree', 'school', 'university', 'college',
            'highest education', 'education level', 'academic background',
            'educational background', 'qualification'
        ],
        school: [
            'school', 'university', 'college', 'institution', 'school name',
            'university name', 'college name', 'educational institution',
            'attended', 'alma mater'
        ],
        degree: [
            'degree', 'degree type', 'degree level', 'academic degree',
            'qualification', 'diploma', 'certification level',
            'highest degree', 'education level'
        ],
        discipline: [
            'discipline', 'major', 'field of study', 'area of study',
            'concentration', 'specialization', 'subject', 'field',
            'degree field', 'study area', 'academic focus'
        ],
        locationCity: [
            'location', 'city', 'location (city)', 'city location',
            'current city', 'where are you located', 'your city',
            'residing city', 'home city'
        ],
        currentJobTitle: [
            'current title', 'job title', 'position', 'current position',
            'current role', 'title', 'your title', 'role', 'job role',
            'current job', 'present position', 'most recent position'
        ],
        currentCompany: [
            'current company', 'company', 'employer', 'current employer',
            'organization', 'company name', 'present employer',
            'most recent employer', 'current organization'
        ],
        github: [
            'github', 'github url', 'github profile', 'github link',
            'github.com', 'git hub', 'github username', 'github account'
        ],
        twitter: [
            'twitter', 'twitter url', 'twitter handle', 'twitter username',
            'twitter profile', 'twitter link', 'twitter.com', 'x.com', 'x url'
        ],
        portfolio: [
            'portfolio', 'portfolio url', 'website', 'personal website',
            'portfolio link', 'online portfolio', 'portfolio site',
            'personal site', 'web portfolio', 'other website'
        ],
        certifications: [
            'certifications', 'certification', 'certificate', 'licenses',
            'license', 'credentials', 'professional certifications'
        ],
        languages: [
            'languages', 'language', 'language proficiency', 'spoken languages',
            'language skills', 'fluent in', 'speak'
        ],
        references: [
            'references', 'reference', 'professional references',
            'references available', 'contact references'
        ],
        availability: [
            'availability', 'available', 'start date', 'notice period',
            'when can you start', 'earliest start date', 'available to start'
        ],
        salary: [
            'salary', 'salary expectation', 'expected salary', 'desired salary',
            'salary requirement', 'compensation', 'expected compensation',
            'pay expectation', 'salary range'
        ],
        // Common Application Questions
        preferredName: [
            'preferred name', 'name you would like us to use', 'name to use',
            'what name would you like', 'name for interview', 'preferred first name'
        ],
        legallyAuthorized: [
            'legally authorized', 'authorized to work', 'legal to work',
            'work authorization', 'eligible to work', 'work eligibility',
            'authorized for employment', 'employment authorization',
            'legally work in', 'eligible to legally work'
        ],
        requireSponsorship: [
            'require sponsorship', 'need sponsorship', 'visa sponsorship',
            'sponsorship required', 'work visa', 'sponsorship needed',
            'require visa', 'immigration sponsorship'
        ],
        willingToRelocate: [
            'willing to relocate', 'relocate', 'relocation', 'move to',
            'open to relocation', 'able to relocate', 'relocation available'
        ],
        remoteWorkPreference: [
            'remote', 'work from home', 'hybrid', 'in office', 'on-site',
            'office schedule', 'come into the office', 'work location preference'
        ],
        yearsOfExperience: [
            'years of experience', 'years experience', 'how many years',
            'experience level', 'years in field', 'professional experience years',
            'years of writing experience', 'writing experience'
        ],
        remoteExperience: [
            'remote position', 'remote experience', 'worked remotely',
            'remote work', 'had a remote position', 'remote job', 'work from home experience'
        ],
        agencyExperience: [
            'marketing agency', 'agency experience', 'worked at agency',
            'agency before', 'at a marketing agency', 'agency background'
        ],
        storyBrandExperience: [
            'storybrand', 'storytelling', 'story brand', 'storytelling copy',
            'storybrand copy', 'narrative copy'
        ],
        sampleCopy: [
            'sample copy', 'writing sample', 'copy sample', 'provide a link to sample',
            'portfolio', 'work sample', 'link to sample'
        ],
        currentlyInUS: [
            'in the u.s.', 'in the us', 'are you in the u.s.', 'currently in the united states',
            'located in us', 'in united states now'
        ],
        textMessaging: [
            'text messaging', 'opt-in text', 'receive text', 'text message updates',
            'sms updates', 'text notifications'
        ],
        additionalFiles: [
            'additional files', 'other files', 'work samples', 'letters',
            'any additional', 'extra files', 'supplemental'
        ],
        writingSample: [
            'writing sample', 'portfolio link', 'work sample', 'sample work',
            'examples of work', 'portfolio url', 'work examples'
        ],
        howDidYouHear: [
            'how did you hear', 'how did you find', 'where did you hear',
            'referral source', 'heard about us', 'find this job', 'learn about'
        ],
        affirmTruthfulness: [
            'affirm', 'information is true', 'true and accurate', 'certify',
            'information submitted', 'truthful', 'accurate information',
            'confirm accuracy', 'verify information'
        ],
        coverLetter: [
            'cover letter', 'coverletter', 'letter of interest',
            'why are you interested', 'why this role', 'why do you want'
        ],
        pronouns: [
            'pronouns', 'preferred pronouns', 'gender pronouns',
            'he/him', 'she/her', 'they/them', 'pronoun'
        ],
        currentCountry: [
            'current country', 'country of residence', 'residing country',
            'where do you currently live', 'current location country',
            'country you reside', 'country including state', 'country/state'
        ],
        currentStateProvince: [
            'state/province', 'state or province', 'province/region',
            'state/region', 'province or region', 'state-province'
        ],
        sponsorshipDetails: [
            'sponsorship details', 'sponsorship requirements', 'visa details',
            'provide details regarding', 'sponsorship information',
            'if yes, please provide', 'explain sponsorship'
        ],
        hourlyRate: [
            'hourly rate', 'hourly compensation', 'hourly pay', 'rate per hour',
            'hourly expectation', 'hourly wage', 'hourly salary', '$/hour', 'per hour'
        ],
        desiredSalary: [
            'desired salary', 'expected salary', 'salary expectation',
            'compensation expectation', 'target salary', 'salary requirement'
        ],
        // Agreement/Acknowledgment fields
        hybridScheduleAgreement: [
            'hybrid position', 'hybrid schedule', 'office schedule', 'in office',
            'expected in', 'office every', 'remote is not an option', 'understand and agree',
            'agree to the schedule', 'inglewood office', 'tuesday', 'thursday'
        ],
        copywritingExperience: [
            'copywriting experience', 'years of copywriting', 'copywriter experience',
            '3+ years', 'three years', 'writing experience', 'content writing experience'
        ],
        customFileUpload: [
            'octopus', 'pirate', 'drawing', 'original drawing', 'submit your',
            'creative submission', 'additional file', 'other attachment'
        ],
        // Demographic/EEO fields (these need to be checked BEFORE location fields)
        hispanicLatino: [
            'are you hispanic', 'hispanic/latino', 'hispanic or latino', 
            'are you hispanic/latino', 'hispanic latino', 'hispanic origin', 
            'latino origin', 'hispanic ethnicity'
        ],
        raceEthnicity: [
            'race', 'ethnicity', 'racial', 'ethnic background', 'race/ethnicity',
            'racial identity', 'ethnic identity', 'demographic'
        ],
        genderIdentity: [
            'gender', 'gender identity', 'sex', 'gender identification',
            'identify as', 'your gender'
        ],
        veteranStatus: [
            'veteran', 'veteran status', 'military', 'armed forces',
            'protected veteran', 'military service', 'served in military'
        ],
        disabilityStatus: [
            'disability', 'disability status', 'disabled', 'accommodation',
            'physical disability', 'mental disability', 'impairment'
        ]
    };

    let detectedFields = [];
    let jobDetails = {};
    let currentDomain = '';

    // ============================================================================
    // RESUME PARSING FUNCTIONALITY
    // ============================================================================

    /**
     * Parse resume file and extract structured data
     */
    async function parseResumeFile(file) {
        console.log('📄 Parsing resume file:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        try {
            console.log('🔍 Step 1: Extracting text from file...');
            const text = await extractTextFromFile(file);
            console.log('📝 Extracted text length:', text.length);
            console.log('📝 First 500 chars:', text.substring(0, 500));
            
            if (!text || text.length < 50) {
                throw new Error('Could not extract enough text from the resume. File may be empty or corrupted.');
            }
            
            console.log('🔍 Step 2: Parsing extracted text...');
            // Parse the extracted text
            const parsedData = parseResumeText(text);
            console.log('✅ Parsed data:', parsedData);
            
            console.log('🔍 Step 3: Updating USER_PROFILE...');
            // Update USER_PROFILE with parsed data
            Object.assign(USER_PROFILE, parsedData);
            
            console.log('🔍 Step 4: Saving to storage...');
            // Save to storage
            await chrome.storage.local.set({ 
                'unnanu_user_profile': USER_PROFILE,
                'unnanu_resume_uploaded': true,
                'unnanu_resume_filename': file.name
            });
            
            console.log('✅ Resume parsed successfully:', parsedData);
            
            return parsedData;
        } catch (e) {
            console.error('❌ Resume parsing failed:', e);
            console.error('Error stack:', e.stack);
            throw e;
        }
    }

    /**
     * Extract text from different file formats
     */
    async function extractTextFromFile(file) {
        console.log('🔍 Extracting text from:', file.name, 'Type:', file.type);
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        
        try {
            // Plain text files
            if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
                console.log('📄 Processing as plain text file');
                const text = await file.text();
                console.log('✅ Extracted', text.length, 'characters from TXT');
                return text;
            }
            
            // PDF files - use simple text extraction
            if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                console.log('📄 Processing as PDF file');
                const text = await extractTextFromPDF(file);
                console.log('✅ Extracted', text.length, 'characters from PDF');
                return text;
            }
            
            // DOCX files - extract from XML
            if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
                console.log('📄 Processing as DOCX file');
                const text = await extractTextFromDOCX(file);
                console.log('✅ Extracted', text.length, 'characters from DOCX');
                return text;
            }
            
            // DOC files (older format) - try as text
            if (fileName.endsWith('.doc')) {
                console.log('📄 Processing as DOC file (legacy format)');
                const text = await file.text();
                console.log('✅ Extracted', text.length, 'characters from DOC');
                return text;
            }
            
            throw new Error('Unsupported file format: ' + fileName);
        } catch (e) {
            console.error('❌ Text extraction failed:', e);
            throw new Error('Failed to extract text from file: ' + e.message);
        }
    }

    /**
     * Extract text from PDF (basic implementation)
     */
    async function extractTextFromPDF(file) {
        try {
            console.log('📄 Reading PDF file...');
            // For now, we'll read the raw binary and extract visible text
            // This is a simplified approach - for production, use PDF.js library
            const arrayBuffer = await file.arrayBuffer();
            console.log('📄 PDF buffer size:', arrayBuffer.byteLength);
            
            const text = new TextDecoder('utf-8').decode(arrayBuffer);
            
            // Extract text between PDF stream markers
            let extractedText = '';
            const streamRegex = /BT\s+(.*?)\s+ET/gs;
            const matches = text.matchAll(streamRegex);
            
            for (const match of matches) {
                extractedText += match[1] + '\n';
            }
            
            // Also try to get text between parentheses (PDF text encoding)
            const textRegex = /\((.*?)\)/g;
            const textMatches = text.matchAll(textRegex);
            
            for (const match of textMatches) {
                extractedText += match[1] + ' ';
            }
            
            console.log('📄 PDF extracted text length:', extractedText.length);
            
            if (extractedText.length < 50) {
                console.warn('⚠️ PDF text extraction yielded little text. Consider uploading as .txt or .docx format.');
            }
            
            return extractedText || text;
        } catch (e) {
            console.error('❌ PDF extraction error:', e);
            throw new Error('PDF parsing failed. Try converting to .txt or .docx format.');
        }
    }

    /**
     * Extract text from DOCX (XML-based format)
     */
    async function extractTextFromDOCX(file) {
        try {
            console.log('📄 Loading JSZip library...');
            const JSZip = await loadJSZip();
            
            console.log('📄 Reading DOCX file...');
            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            
            console.log('📄 Extracting document.xml...');
            const docXml = await zip.file('word/document.xml').async('text');
            
            console.log('📄 Parsing XML...');
            // Extract text from XML nodes
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(docXml, 'text/xml');
            const textNodes = xmlDoc.getElementsByTagName('w:t');
            
            let text = '';
            for (let i = 0; i < textNodes.length; i++) {
                text += textNodes[i].textContent + ' ';
            }
            
            console.log('📄 DOCX extracted text length:', text.length);
            return text;
        } catch (e) {
            console.error('❌ DOCX extraction error:', e);
            throw new Error('DOCX parsing failed: ' + e.message);
        }
    }

    /**
     * Load JSZip library dynamically (for DOCX parsing)
     */
    async function loadJSZip() {
        if (window.JSZip) {
            return window.JSZip;
        }
        
        // Load from CDN
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error('Failed to load JSZip'));
            document.head.appendChild(script);
        });
    }

    /**
     * Parse resume text and extract structured information
     */
    function parseResumeText(text) {
        const data = {};
        
        console.log('🔍 Starting text parsing...');
        
        // Extract email
        const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) {
            data.email = emailMatch[0];
            console.log('✅ Found email:', data.email);
        }
        
        // Extract phone - multiple formats
        const phonePatterns = [
            /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/,  // (575) 495-0323 or 575-495-0323
            /(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})/,  // 575.495.0323
            /\((\d{3})\)\s*(\d{3})[-.\s]?(\d{4})/  // (575)4950323
        ];
        
        for (const pattern of phonePatterns) {
            const phoneMatch = text.match(pattern);
            if (phoneMatch) {
                // Extract the digits
                let digits = phoneMatch[0].replace(/\D/g, '');
                // Remove country code if present
                if (digits.length === 11 && digits[0] === '1') {
                    digits = digits.substring(1);
                }
                if (digits.length === 10) {
                    data.phoneRaw = digits;
                    data.phone = `${digits.substring(0,3)}-${digits.substring(3,6)}-${digits.substring(6)}`;
                    data.phoneFormatted = `(${digits.substring(0,3)}) ${digits.substring(3,6)}-${digits.substring(6)}`;
                    console.log('✅ Found phone:', data.phoneFormatted, 'from:', phoneMatch[0]);
                    break;
                }
            }
        }
        
        // Extract name (try multiple patterns)
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        // Pattern 1: First line with capitalized words
        const nameMatch1 = lines[0]?.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]*\.?)?\s+[A-Z][a-z]+)/);
        if (nameMatch1) {
            const fullName = nameMatch1[1].trim();
            const nameParts = fullName.split(/\s+/);
            data.firstName = nameParts[0];
            data.lastName = nameParts[nameParts.length - 1];
            data.fullName = fullName;
            console.log('✅ Found name:', data.fullName);
        }
        
        // Extract LinkedIn URL
        const linkedInMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i);
        if (linkedInMatch) {
            data.linkedInUrl = linkedInMatch[0].startsWith('http') ? linkedInMatch[0] : 'https://' + linkedInMatch[0];
            console.log('✅ Found LinkedIn:', data.linkedInUrl);
        }
        
        // Extract GitHub URL
        const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+\/?/i);
        if (githubMatch) {
            data.githubUrl = githubMatch[0].startsWith('http') ? githubMatch[0] : 'https://' + githubMatch[0];
            console.log('✅ Found GitHub:', data.githubUrl);
        }
        
        // Extract portfolio/website URL
        const websiteMatch = text.match(/(?:portfolio|website|personal site)[\s:]+([a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?)/i);
        if (websiteMatch) {
            data.websiteUrl = websiteMatch[1].startsWith('http') ? websiteMatch[1] : 'https://' + websiteMatch[1];
            console.log('✅ Found website:', data.websiteUrl);
        }
        
        // Extract address components
        const addressMatch = text.match(/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Lane|Ln|Boulevard|Blvd|Court|Ct|Way|Circle|Cir))/i);
        if (addressMatch) {
            data.address1 = addressMatch[0];
            console.log('✅ Found address:', data.address1);
        }
        
        // Extract city, state, zip - Try abbreviation format first (e.g., "Austin, TX 78730")
        let locationMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
        if (locationMatch) {
            data.city = locationMatch[1];
            const stateAbbr = locationMatch[2];
            data.state = stateAbbr; // Store abbreviation
            data.stateFull = US_STATE_MAP[stateAbbr] || stateAbbr; // Get full name from map
            data.zipCode = locationMatch[3];
            console.log('✅ Found location (abbr):', `${data.city}, ${data.state} (${data.stateFull}) ${data.zipCode}`);
        }
        
        // Try full state name format if abbreviation didn't match (e.g., "Austin, Texas 78730")
        if (!locationMatch) {
            locationMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(\d{5}(?:-\d{4})?)/);
            if (locationMatch) {
                data.city = locationMatch[1];
                const stateFull = locationMatch[2];
                data.stateFull = stateFull; // Store full name
                data.state = US_STATE_MAP[stateFull] || stateFull; // Get abbreviation from map
                data.zipCode = locationMatch[3];
                console.log('✅ Found location (full):', `${data.city}, ${data.stateFull} (${data.state}) ${data.zipCode}`);
            }
        }
        
        // Alternative: Extract state and city separately if together pattern fails
        if (!data.city || !data.state) {
            // Try abbreviation format without zip
            const cityStateMatch = text.match(/(?:^|\n)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})(?:\s|$)/m);
            if (cityStateMatch) {
                data.city = cityStateMatch[1];
                const stateAbbr = cityStateMatch[2];
                data.state = stateAbbr;
                data.stateFull = US_STATE_MAP[stateAbbr] || stateAbbr;
                console.log('✅ Found city/state (abbr):', `${data.city}, ${data.state} (${data.stateFull})`);
            } else {
                // Try full state name format without zip
                const cityStateFullMatch = text.match(/(?:^|\n)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s|$)/m);
                if (cityStateFullMatch && US_STATE_MAP[cityStateFullMatch[2]]) {
                    data.city = cityStateFullMatch[1];
                    const stateFull = cityStateFullMatch[2];
                    data.stateFull = stateFull;
                    data.state = US_STATE_MAP[stateFull] || stateFull;
                    console.log('✅ Found city/state (full):', `${data.city}, ${data.stateFull} (${data.state})`);
                }
            }
        }
        
        // Extract skills
        data.skills = extractSkills(text);
        console.log('✅ Found skills:', data.skills.length);
        
        // Extract experience
        data.experience = extractExperience(text);
        console.log('✅ Found experience entries:', data.experience.length);
        
        // Extract education
        data.education = extractEducation(text);
        console.log('✅ Found education entries:', data.education.length);
        
        // Extract certifications
        data.certifications = extractCertifications(text);
        console.log('✅ Found certifications:', data.certifications.length);
        
        // Extract languages
        data.languages = extractLanguages(text);
        if (data.languages.length > 0) {
            console.log('✅ Found languages:', data.languages.length);
        }
        
        // Extract summary/objective
        data.summary = extractSummary(text);
        if (data.summary) {
            console.log('✅ Found summary:', data.summary.substring(0, 50) + '...');
        }
        
        // Calculate years of experience
        data.yearsOfExperience = calculateYearsOfExperience(data.experience);
        console.log('✅ Calculated years of experience:', data.yearsOfExperience);
        
        // Extract current/most recent job title
        if (data.experience && data.experience.length > 0) {
            data.currentJobTitle = data.experience[0].title;
            data.currentCompany = data.experience[0].company;
            console.log('✅ Current position:', data.currentJobTitle, 'at', data.currentCompany);
        }
        
        // Extract degree level
        if (data.education && data.education.length > 0) {
            data.degreeLevel = data.education[0].degree;
            data.school = data.education[0].school;
            console.log('✅ Education:', data.degreeLevel, 'from', data.school);
        }
        
        return data;
    }

    /**
     * Extract skills from resume text
     */
    function extractSkills(text) {
        const skills = [];
        const commonSkills = [
            // Programming Languages
            'JavaScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
            'TypeScript', 'Go', 'Rust', 'Scala', 'R', 'MATLAB', 'Perl', 'Objective-C',
            
            // Web Technologies
            'HTML', 'HTML5', 'CSS', 'CSS3', 'SASS', 'LESS', 'React', 'Angular', 'Vue', 'Vue\\.js',
            'Svelte', 'jQuery', 'Bootstrap', 'Tailwind', 'Next\\.js', 'Nuxt', 'Gatsby',
            
            // Backend & Frameworks
            'Node\\.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot',
            'Ruby on Rails', 'ASP\\.NET', 'Laravel', 'Symfony', 'NestJS',
            
            // Databases
            'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle',
            'Microsoft SQL Server', 'MariaDB', 'Cassandra', 'DynamoDB', 'Elasticsearch',
            
            // Cloud & DevOps
            'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins',
            'CI/CD', 'Terraform', 'Ansible', 'CloudFormation', 'Heroku', 'DigitalOcean',
            
            // Tools & Version Control
            'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Jira', 'Confluence',
            
            // Methodologies
            'Agile', 'Scrum', 'Kanban', 'Waterfall', 'DevOps', 'TDD', 'BDD',
            
            // APIs & Architecture
            'REST', 'RESTful', 'API', 'GraphQL', 'Microservices', 'SOA', 'WebSocket',
            
            // Data & ML
            'Machine Learning', 'Deep Learning', 'AI', 'Data Analysis', 'Data Science',
            'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras',
            
            // Business Tools
            'Excel', 'Microsoft Excel', 'Google Sheets', 'Tableau', 'PowerBI', 'Looker',
            'Salesforce', 'HubSpot', 'Google Analytics', 'SEO', 'SEM', 'Content Marketing',
            
            // Design Tools
            'Photoshop', 'Illustrator', 'Figma', 'Sketch', 'InDesign', 'Adobe XD',
            'After Effects', 'Premiere Pro', 'Canva', 'GIMP',
            
            // Project Management
            'Project Management', 'Product Management', 'Stakeholder Management',
            'Budget Management', 'Risk Management', 'Change Management',
            
            // Soft Skills
            'Leadership', 'Team Leadership', 'Communication', 'Problem Solving',
            'Critical Thinking', 'Time Management', 'Collaboration', 'Adaptability',
            'Creativity', 'Customer Service', 'Public Speaking', 'Negotiation',
            
            // Mobile Development
            'iOS', 'Android', 'React Native', 'Flutter', 'Xamarin', 'Ionic',
            
            // Testing
            'Jest', 'Mocha', 'Chai', 'Selenium', 'Cypress', 'JUnit', 'PyTest',
            'Unit Testing', 'Integration Testing', 'E2E Testing',
            
            // Other
            'WordPress', 'Shopify', 'Magento', 'WooCommerce', 'SEO Optimization',
            'Email Marketing', 'Social Media Marketing', 'Content Writing',
            'Copywriting', 'Technical Writing', 'Documentation'
        ];
        
        // Find skills section
        const skillsSection = text.match(/(?:SKILLS?|TECHNICAL SKILLS?|CORE COMPETENCIES|KEY SKILLS|PROFICIENCIES)([\s\S]*?)(?=\n\n[A-Z]{3,}|$)/i);
        const searchText = skillsSection ? skillsSection[1] : text;
        
        for (const skill of commonSkills) {
            try {
                // Skill strings are already escaped if needed (e.g., C\+\+, Node\.js)
                const regex = new RegExp('\\b' + skill + '\\b', 'i');
                if (regex.test(searchText)) {
                    // Store the display name (without escaping)
                    const displayName = skill.replace(/\\\+/g, '+').replace(/\\\./g, '.');
                    if (!skills.includes(displayName)) {
                        skills.push(displayName);
                    }
                }
            } catch (e) {
                console.warn('Regex error for skill:', skill, e);
            }
        }
        
        return skills;
    }

    /**
     * Extract work experience from resume
     */
    function extractExperience(text) {
        const experience = [];
        const expSection = text.match(/(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY|PROFESSIONAL EXPERIENCE|CAREER HISTORY)([\s\S]*?)(?=\n\n[A-Z]{3,}|EDUCATION|SKILLS|CERTIFICATIONS|$)/i);
        
        if (!expSection) return experience;
        
        const section = expSection[1];
        
        // Split by double line breaks or by date patterns
        const jobBlocks = section.split(/\n\n+/);
        
        for (const block of jobBlocks) {
            if (block.trim().length < 10) continue;
            
            // Try to extract job title (usually first line, before company or dates)
            const lines = block.split('\n').filter(l => l.trim());
            let title = '';
            let company = '';
            let dates = '';
            let location = '';
            
            // Pattern 1: Title on first line
            const titleMatch = lines[0]?.match(/^([A-Za-z\s\&\,\.\-\/]+)(?:\s*[\|–\-]\s*|\n)/);
            if (titleMatch && !titleMatch[1].match(/\d{4}/)) { // Exclude if it has a year
                title = titleMatch[1].trim();
            }
            
            // Extract company name - look for patterns
            const companyPatterns = [
                /(?:at\s+)?([A-Z][A-Za-z\s\&\,\.]+(?:Inc\.?|LLC|Corp\.?|Company|Co\.?|Ltd\.?|Limited|Group|Partners|Associates)?)/i,
                /([A-Z][A-Za-z\s\&]+(?:\s+(?:Inc|LLC|Corp|Company|Co|Ltd|Limited|Group))?)\s*[\|–\-]/i,
                /\n([A-Z][A-Za-z\s\&\.]+)\s*[\|–\-]/
            ];
            
            for (const pattern of companyPatterns) {
                const match = block.match(pattern);
                if (match && !match[1].match(/\d{4}/)) {
                    company = match[1].trim();
                    break;
                }
            }
            
            // Extract dates - multiple patterns
            const datePatterns = [
                /(\d{1,2}\/\d{4}|\w+\s+\d{4})\s*[-–]\s*(\d{1,2}\/\d{4}|\w+\s+\d{4}|Present|Current|Now)/i,
                /(\d{4})\s*[-–]\s*(\d{4}|Present|Current|Now)/i,
                /(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|Present|Current|Now)/i
            ];
            
            for (const pattern of datePatterns) {
                const dateMatch = block.match(pattern);
                if (dateMatch) {
                    dates = dateMatch[0];
                    break;
                }
            }
            
            // Extract location (City, State or City, Country)
            const locationMatch = block.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2}|[A-Z][a-z]+)/);
            if (locationMatch) {
                location = `${locationMatch[1]}, ${locationMatch[2]}`;
            }
            
            // Get description (remaining text after title/company/dates)
            let description = block.trim();
            if (description.length > 300) {
                description = description.substring(0, 300) + '...';
            }
            
            if (title || company) {
                experience.push({
                    title: title || 'Position',
                    company: company || 'Company',
                    dates: dates || '',
                    location: location || '',
                    description: description
                });
            }
        }
        
        return experience.slice(0, 10); // Limit to 10 positions
    }

    /**
     * Extract education from resume
     */
    function extractEducation(text) {
        const education = [];
        const eduSection = text.match(/(?:EDUCATION)([\s\S]*?)(?=\n\n[A-Z]{3,}|$)/i);
        
        if (!eduSection) return education;
        
        const section = eduSection[1];
        const degreeMatch = section.match(/(Bachelor|Master|PhD|Associate|B\.S\.|M\.S\.|B\.A\.|M\.A\.|MBA).*$/im);
        const schoolMatch = section.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s+University|\s+College))/);
        
        if (degreeMatch || schoolMatch) {
            education.push({
                degree: degreeMatch ? degreeMatch[0].trim() : '',
                school: schoolMatch ? schoolMatch[0].trim() : ''
            });
        }
        
        return education;
    }

    /**
     * Extract professional summary
     */
    function extractSummary(text) {
        const summaryMatch = text.match(/(?:SUMMARY|PROFESSIONAL SUMMARY|PROFILE|OBJECTIVE|ABOUT ME)([\s\S]*?)(?=\n\n[A-Z]{3,})/i);
        
        if (summaryMatch) {
            return summaryMatch[1].trim().substring(0, 500);
        }
        
        return '';
    }

    /**
     * Extract certifications
     */
    function extractCertifications(text) {
        const certifications = [];
        const certSection = text.match(/(?:CERTIFICATIONS?|LICENSES?|CREDENTIALS?)([\s\S]*?)(?=\n\n[A-Z]{3,}|$)/i);
        
        if (!certSection) return certifications;
        
        const section = certSection[1];
        const lines = section.split('\n').filter(line => line.trim().length > 5);
        
        for (const line of lines) {
            // Look for common certification patterns
            const certMatch = line.match(/([A-Z][A-Za-z\s\(\)\/]+(?:Certified|Certificate|Certification|Professional|Associate|Expert|Specialist|License))/i);
            if (certMatch) {
                certifications.push({
                    name: certMatch[1].trim(),
                    fullText: line.trim()
                });
            } else if (line.trim().length > 10) {
                // Add any line that looks like a certification
                certifications.push({
                    name: line.trim(),
                    fullText: line.trim()
                });
            }
        }
        
        return certifications.slice(0, 10); // Limit to 10
    }

    /**
     * Extract languages
     */
    function extractLanguages(text) {
        const languages = [];
        const langSection = text.match(/(?:LANGUAGES?)([\s\S]*?)(?=\n\n[A-Z]{3,}|$)/i);
        
        if (!langSection) return languages;
        
        const commonLanguages = [
            'English', 'Spanish', 'French', 'German', 'Chinese', 'Mandarin', 'Cantonese',
            'Japanese', 'Korean', 'Arabic', 'Portuguese', 'Russian', 'Italian', 'Hindi',
            'Bengali', 'Punjabi', 'Vietnamese', 'Turkish', 'Polish', 'Dutch', 'Greek',
            'Hebrew', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Czech', 'Romanian'
        ];
        
        const section = langSection[1];
        
        for (const lang of commonLanguages) {
            const regex = new RegExp('\\b' + lang + '\\b', 'i');
            if (regex.test(section)) {
                // Try to find proficiency level
                const proficiencyMatch = section.match(new RegExp(lang + '\\s*[-:–]?\\s*(Native|Fluent|Professional|Intermediate|Basic|Beginner|Advanced|Conversational)', 'i'));
                
                languages.push({
                    language: lang,
                    proficiency: proficiencyMatch ? proficiencyMatch[1] : 'Unknown'
                });
            }
        }
        
        return languages;
    }

    /**
     * Calculate years of experience from experience array
     */
    function calculateYearsOfExperience(experience) {
        let totalYears = 0;
        
        for (const exp of experience) {
            const dateMatch = exp.dates?.match(/(\d{4})\s*[-–]\s*(\d{4}|Present|Current)/i);
            if (dateMatch) {
                const startYear = parseInt(dateMatch[1]);
                const endYear = dateMatch[2].match(/\d{4}/) ? parseInt(dateMatch[2]) : new Date().getFullYear();
                totalYears += (endYear - startYear);
            }
        }
        
        return totalYears;
    }

    /**
     * Format phone number
     */
    function formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
        }
        return phone;
    }

    // ============================================================================
    // SIDEBAR INITIALIZATION
    // ============================================================================

    // Initialize the sidebar
    function init() {
        console.log('🎯 Talent Sidebar initialized');
        
        // Load saved profile data
        loadSavedProfile();
        
        // Request page data from content script (for side panel mode)
        requestPageDataFromContentScript();
        
        // Set up event listeners
        setupEventListeners();
        
        // Display initial state
        displayDetectedFields();
        
        // Set up message listener for content script responses
        chrome.runtime.onMessage.addListener(handleContentScriptMessage);
    }
    
    /**
     * Request page data from content script (in side panel mode)
     */
    async function requestPageDataFromContentScript() {
        console.log('📨 Requesting page data from content script...');
        
        try {
            // Get the active tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                // Request page data
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageData' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('Could not get page data:', chrome.runtime.lastError.message);
                        return;
                    }
                    if (response && response.success) {
                        console.log('✅ Received page data:', response.data);
                        jobDetails = response.data;
                        updateJobDetailsUI();
                        cacheJobApplication();
                    }
                });
                
                // Request form fields
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getFormFields' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('Could not get form fields:', chrome.runtime.lastError.message);
                        return;
                    }
                    if (response && response.success) {
                        console.log('✅ Received form fields:', response.fields);
                        processFormFields(response.fields);
                    }
                });
            }
        } catch (e) {
            console.warn('Could not request page data from content script:', e);
        }
    }
    
    /**
     * Load saved profile data from storage
     */
    async function loadSavedProfile() {
        try {
            const result = await chrome.storage.local.get(['unnanu_user_profile', 'unnanu_resume_uploaded']);
            
            if (result.unnanu_user_profile) {
                Object.assign(USER_PROFILE, result.unnanu_user_profile);
                console.log('✅ Loaded saved profile data');
            }
            
            if (result.unnanu_resume_uploaded) {
                console.log('📄 Resume previously uploaded');
            }
            
            // Display profile data
            displayProfileData();
        } catch (e) {
            console.warn('Could not load saved profile:', e);
        }
    }
    
    // Request page data from content script (which has full page access)
    async function requestPageDataFromParent() {
        console.log('📨 Requesting page data from content script...');
        
        try {
            // Get the current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                // Send message to content script in the active tab
                chrome.tabs.sendMessage(tab.id, { action: 'requestPageData' });
                chrome.tabs.sendMessage(tab.id, { action: 'getFormFields' });
                
                console.log('✅ Sent page data request to tab:', tab.id);
            }
        } catch (e) {
            console.warn('Could not request page data:', e);
        }
        
        // Listen for response from content script
        chrome.runtime.onMessage.addListener(handleContentScriptMessage);
    }
    
    // Handle messages from parent (content script)
    function handleParentMessage(event) {
        if (event.data.action === 'pageDataResponse') {
            console.log('✅ Received page data:', event.data.data);
            jobDetails = event.data.data;
            updateJobDetailsUI();
            cacheJobApplication();
        } else if (event.data.action === 'formFieldsResponse') {
            console.log('✅ Received form fields:', event.data.fields);
            processFormFields(event.data.fields);
        }
    }
    
    // Handle messages from content script (for side panel mode)
    function handleContentScriptMessage(message, sender, sendResponse) {
        if (message.action === 'pageDataResponse') {
            console.log('✅ Received page data:', message.data);
            jobDetails = message.data;
            updateJobDetailsUI();
            cacheJobApplication();
            sendResponse({ received: true });
            return false; // Synchronous response
        } else if (message.action === 'formFieldsResponse') {
            console.log('✅ Received form fields:', message.fields);
            processFormFields(message.fields);
            sendResponse({ received: true });
            return false; // Synchronous response
        }
        return false; // Don't keep channel open
    }
    
    // Process form fields received from content script
    function processFormFields(fields) {
        detectedFields = [];
        
        fields.forEach(field => {
            const fieldType = detectFieldType(field);
            if (fieldType) {
                detectedFields.push({
                    ...field,
                    fieldType: fieldType,
                    identifier: field.id || field.name
                });
            }
        });
        
        console.log(`✅ Processed ${detectedFields.length} fields`);
        displayDetectedFields();
        
        // Update status message
        if (detectedFields.length > 0) {
            const statusMsg = document.getElementById('statusMessage');
            statusMsg.className = 'status-message success';
            statusMsg.textContent = `✅ Found ${detectedFields.length} fields to fill!`;
            statusMsg.style.display = 'block';
            setTimeout(() => {
                statusMsg.style.display = 'none';
            }, 3000);
        }
    }
    
    // Detect field type from field metadata
    function detectFieldType(field) {
        const combinedText = [
            field.name || '',
            field.id || '',
            field.placeholder || '',
            field.label || '',
            field.className || ''
        ].join(' ').toLowerCase();
        
        // Priority check for specific patterns that might conflict
        // Check demographic/EEO fields FIRST (more specific patterns)
        const priorityFields = ['hispanicLatino', 'raceEthnicity', 'genderIdentity', 'veteranStatus', 'disabilityStatus', 'hybridScheduleAgreement', 'copywritingExperience'];
        for (const fieldType of priorityFields) {
            const patterns = FIELD_PATTERNS[fieldType];
            if (patterns) {
                for (const pattern of patterns) {
                    if (combinedText.includes(pattern)) {
                        return fieldType;
                    }
                }
            }
        }
        
        // Then check all other patterns
        for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
            // Skip priority fields (already checked)
            if (priorityFields.includes(fieldType)) continue;
            
            for (const pattern of patterns) {
                if (combinedText.includes(pattern)) {
                    return fieldType;
                }
            }
        }
        
        return null;
    }

    // ============================================================================
    // SMART SCRAPING & CACHING
    // ============================================================================

    /**
     * Intelligently scrape the job page for:
     * 1. Job details (title, company, location, salary)
     * 2. Form fields that need to be filled
     * 3. Cache both for future use
     */
    async function smartScrapeJobPage() {
        console.log('🧠 Smart scraping job page...');
        
        // Step 1: Extract job details
        extractJobDetails();
        
        // Step 2: Detect form fields with enhanced intelligence
        await detectFormFieldsIntelligent();
        
        // Step 3: Save job application to cache
        cacheJobApplication();
        
        // Step 4: Learn from this page for future visits
        await learnFieldPatterns();
    }

    /**
     * Enhanced field detection with learning capabilities
     */
    async function detectFormFieldsIntelligent() {
        console.log('🔍 Intelligently detecting form fields...');
        detectedFields = [];

        let parentDoc;
        try {
            parentDoc = window.parent.document;
        } catch (e) {
            console.warn('❌ Cannot access parent document for field detection:', e);
            return;
        }
        
        // Step 1: Check if we have cached field mappings for this domain
        const cachedMappings = await loadCachedFieldMappings(currentDomain);
        
        // Step 2: Find all potential form fields with expanded selectors
        const inputs = parentDoc.querySelectorAll(`
            input[type="text"], 
            input[type="email"], 
            input[type="tel"], 
            input[type="url"], 
            input[type="number"],
            input[type="file"],
            input:not([type]), 
            input[type=""], 
            textarea, 
            select,
            input[name*="first"],
            input[name*="last"],
            input[name*="email"],
            input[name*="phone"],
            input[name*="address"],
            input[name*="city"],
            input[name*="state"],
            input[name*="zip"],
            input[name*="postal"],
            input[name*="linkedin"],
            input[name*="resume"],
            input[name*="cv"]
        `);
        
        console.log(`📊 Found ${inputs.length} total input elements on the page`);
        
        // Also log all input elements for debugging
        const allInputs = parentDoc.querySelectorAll('input');
        console.log(`🔍 Total input tags on page: ${allInputs.length}`);
        if (allInputs.length > 0) {
            console.log('📋 Sample inputs:', Array.from(allInputs).slice(0, 10).map(inp => ({
                type: inp.type || '(no type)',
                name: inp.name || '(no name)',
                id: inp.id || '(no id)',
                placeholder: inp.placeholder || '(no placeholder)',
                className: inp.className || '(no class)'
            })));
        }

        // Step 3: Analyze each field
        const uniqueFields = new Set();
        inputs.forEach((input, index) => {
            // Skip hidden fields, buttons, checkboxes, radio buttons (unless they might be EEO)
            if (input.type === 'hidden' || 
                input.type === 'button' || 
                input.type === 'submit' ||
                input.style.display === 'none' ||
                input.offsetParent === null) {
                return;
            }
            
            // Special handling for radio buttons and checkboxes - might be EEO or common questions
            if (input.type === 'radio' || input.type === 'checkbox') {
                if (typeof UserPreferences !== 'undefined') {
                    const label = input.labels?.[0]?.textContent || 
                                  input.getAttribute('aria-label') || 
                                  input.parentElement?.textContent || '';
                    
                    // Check if it's an EEO question
                    const eeoType = UserPreferences.detectEEOQuestion(label, input);
                    if (eeoType) {
                        // Mark as EEO field for special handling
                        const fieldKey = `eeo_${eeoType.type}_${index}`;
                        if (!uniqueFields.has(fieldKey)) {
                            uniqueFields.add(fieldKey);
                            detectedFields.push({
                                element: input,
                                type: eeoType.type,
                                label: eeoType.category,
                                identifier: input.id || input.name || fieldKey,
                                isEEO: true,
                                eeoCategory: eeoType.type
                            });
                            console.log(`✅ EEO Field ${index + 1}: "${eeoType.category}"`);
                        }
                        return;
                    }
                    
                    // Check if it's a common application question
                    const commonType = UserPreferences.detectCommonQuestion(label, input);
                    if (commonType) {
                        const fieldKey = `common_${commonType.type}_${index}`;
                        if (!uniqueFields.has(fieldKey)) {
                            uniqueFields.add(fieldKey);
                            detectedFields.push({
                                element: input,
                                type: commonType.type,
                                label: label.substring(0, 50),
                                identifier: input.id || input.name || fieldKey,
                                isCommonQuestion: true,
                                commonQuestionType: commonType.type,
                                preferenceKey: commonType.preferenceKey
                            });
                            console.log(`✅ Common Question ${index + 1}: "${commonType.type}"`);
                        }
                        return;
                    }
                }
                return; // Skip normal processing for radio/checkbox
            }
            
            // Check if this is a common application question (for all input types)
            if (typeof UserPreferences !== 'undefined') {
                const label = input.labels?.[0]?.textContent || 
                              input.getAttribute('aria-label') || 
                              input.getAttribute('placeholder') || 
                              input.parentElement?.textContent || 
                              findLabelText(input) || '';
                
                const commonType = UserPreferences.detectCommonQuestion(label, input);
                if (commonType) {
                    const fieldKey = `common_${commonType.type}_${index}`;
                    if (!uniqueFields.has(fieldKey)) {
                        uniqueFields.add(fieldKey);
                        detectedFields.push({
                            element: input,
                            type: commonType.type,
                            label: label.substring(0, 100) || commonType.type,
                            identifier: input.id || input.name || fieldKey,
                            isCommonQuestion: true,
                            commonQuestionType: commonType.type,
                            preferenceKey: commonType.preferenceKey,
                            fieldType: commonType.fieldType
                        });
                        console.log(`✅ Common Question ${index + 1}: "${commonType.type}"`);
                        return; // Skip normal field analysis
                    }
                }
            }
            
            // Try cached mapping first (fast path)
            let fieldInfo = null;
            if (cachedMappings) {
                fieldInfo = matchCachedField(input, cachedMappings);
            }
            
            // Fallback to pattern matching (slower but more flexible)
            if (!fieldInfo) {
                fieldInfo = analyzeField(input);
            }
            
            if (fieldInfo) {
                // Avoid duplicates based on identifier
                const fieldKey = fieldInfo.identifier || `${fieldInfo.type}_${index}`;
                if (!uniqueFields.has(fieldKey)) {
                    uniqueFields.add(fieldKey);
                    detectedFields.push(fieldInfo);
                    console.log(`✅ Field ${index + 1}: "${fieldInfo.type}" - ${fieldInfo.label}`);
                }
            } else {
                // Log unmatched fields for learning
                const debugInfo = {
                    id: input.id || '(no id)',
                    name: input.name || '(no name)',
                    placeholder: input.placeholder || '(no placeholder)',
                    type: input.type || input.tagName,
                    ariaLabel: input.getAttribute('aria-label') || '(no aria-label)',
                    className: input.className || '(no class)'
                };
                console.log(`⚠️ Field ${index + 1}: No pattern match -`, debugInfo);
            }
        });

        console.log(`✅ Successfully detected ${detectedFields.length} form fields`);
    }

    /**
     * Load cached field mappings for a specific domain
     */
    async function loadCachedFieldMappings(domain) {
        try {
            const result = await chrome.storage.local.get([FIELD_CACHE_KEY]);
            const allMappings = result[FIELD_CACHE_KEY] || {};
            return allMappings[domain] || null;
        } catch (e) {
            console.warn('Could not load cached field mappings:', e);
            return null;
        }
    }

    /**
     * Match a field against cached mappings
     */
    function matchCachedField(input, cachedMappings) {
        const fieldId = input.id || input.name;
        if (!fieldId || !cachedMappings[fieldId]) {
            return null;
        }
        
        const cached = cachedMappings[fieldId];
        return {
            element: input,
            type: cached.type,
            label: cached.label,
            identifier: fieldId,
            source: 'cache'
        };
    }

    /**
     * Learn field patterns from successfully filled forms
     */
    async function learnFieldPatterns() {
        if (detectedFields.length === 0) return;
        
        try {
            const result = await chrome.storage.local.get([FIELD_CACHE_KEY]);
            const allMappings = result[FIELD_CACHE_KEY] || {};
            
            if (!allMappings[currentDomain]) {
                allMappings[currentDomain] = {};
            }
            
            // Save each detected field's mapping
            detectedFields.forEach(field => {
                const fieldId = field.identifier;
                if (fieldId) {
                    allMappings[currentDomain][fieldId] = {
                        type: field.type,
                        label: field.label,
                        lastUsed: new Date().toISOString()
                    };
                }
            });
            
            await chrome.storage.local.set({ [FIELD_CACHE_KEY]: allMappings });
            console.log('📚 Learned field patterns for', currentDomain);
        } catch (e) {
            console.warn('Could not save field patterns:', e);
        }
    }

    /**
     * Cache the current job application
     */
    async function cacheJobApplication() {
        if (!jobDetails.title && detectedFields.length === 0) {
            return; // Nothing to cache
        }
        
        try {
            const result = await chrome.storage.local.get([JOB_CACHE_KEY]);
            const jobCache = result[JOB_CACHE_KEY] || { applications: [] };
            
            const application = {
                url: jobDetails.url || 'unknown',
                domain: jobDetails.domain || 'unknown',
                jobTitle: jobDetails.title || 'Unknown Position',
                company: jobDetails.company || 'Unknown Company',
                location: jobDetails.location || '',
                salary: jobDetails.salary || '',
                fieldsDetected: detectedFields.length,
                timestamp: new Date().toISOString(),
                status: 'detected' // Will update to 'filled' when auto-fill completes
            };
            
            // Check if this job already exists (by URL)
            const existingIndex = jobCache.applications.findIndex(app => app.url === application.url);
            if (existingIndex >= 0) {
                jobCache.applications[existingIndex] = application;
            } else {
                jobCache.applications.unshift(application); // Add to beginning
                // Keep only last 50 applications
                if (jobCache.applications.length > 50) {
                    jobCache.applications = jobCache.applications.slice(0, 50);
                }
            }
            
            await chrome.storage.local.set({ [JOB_CACHE_KEY]: jobCache });
            console.log('💾 Cached job application:', application.jobTitle);
        } catch (e) {
            console.warn('Could not cache job application:', e);
        }
    }

    /**
     * Update job application status after successful fill
     */
    async function updateJobApplicationStatus(status, filledCount) {
        try {
            const result = await chrome.storage.local.get([JOB_CACHE_KEY]);
            const jobCache = result[JOB_CACHE_KEY] || { applications: [] };
            
            const currentUrl = jobDetails.url;
            const app = jobCache.applications.find(a => a.url === currentUrl);
            
            if (app) {
                app.status = status;
                app.fieldsFilled = filledCount;
                app.lastFilled = new Date().toISOString();
                await chrome.storage.local.set({ [JOB_CACHE_KEY]: jobCache });
                console.log('📝 Updated job application status:', status);
            }
        } catch (e) {
            console.warn('Could not update job status:', e);
        }
    }

    // ============================================================================
    // JOB DETAILS EXTRACTION WITH INTELLIGENT DOM SCRAPING
    // ============================================================================

    /**
     * Extract job details from the current page using intelligent DOM scraping
     * Works across different job board platforms by trying multiple selectors
     */
    function extractJobDetails() {
        console.log('📋 Intelligently extracting job details from DOM...');
        
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
        
        // Extract Job Title
        jobDetails.title = extractBySelectors(parentDoc, [
            // Hireology
            'h1.job-title', '.job-posting-title', '[data-qa="job-title"]',
            // Workday
            'h2[data-automation-id="jobPostingHeader"]', '.job-title h2',
            // Greenhouse
            '.app-title', '#header h1',
            // Lever
            '.posting-headline h2',
            // Generic
            'h1', 'h2', '.job-title', '.position-title', '[class*="job-title"]',
            '[class*="position"]', 'header h1', '.posting-headline',
            '[role="heading"][aria-level="1"]'
        ], 'Job Application Form');

        // Extract Company Name
        jobDetails.company = extractBySelectors(parentDoc, [
            // Hireology
            '.company-name', '[data-qa="company-name"]',
            // Workday
            '[data-automation-id="company"]', '.company',
            // Greenhouse
            '.company-name', '#company_name',
            // Generic
            '[class*="company"]', '.employer-name', '.organization',
            'header .company', '[data-company]', '.company-info',
            'meta[property="og:site_name"]'
        ], '', true);

        // Extract Location
        jobDetails.location = extractBySelectors(parentDoc, [
            // Hireology
            '.job-location', '[data-qa="location"]',
            // Workday
            '[data-automation-id="location"]',
            // Greenhouse
            '.location',
            // Generic
            '[class*="location"]', '.job-location', '.job-info .location',
            '[class*="city"]', '.office-location'
        ], '');

        // Extract Salary
        jobDetails.salary = extractBySelectors(parentDoc, [
            // Multiple platforms
            '.salary', '[class*="salary"]', '[class*="compensation"]',
            '[class*="pay"]', '.wage', '[data-qa="salary"]',
            '[data-automation-id="salary"]'
        ], '');
        
        // Extract Job Description (for additional context)
        jobDetails.description = extractBySelectors(parentDoc, [
            '.job-description', '[class*="description"]', '#job-description',
            '.posting-description', '[data-qa="description"]'
        ], '', false, 500); // Limit to 500 chars
        
        // Extract Application Questions
        jobDetails.questions = extractApplicationQuestions(parentDoc);
        
        console.log('✅ Job Details Extracted:', {
            title: jobDetails.title,
            company: jobDetails.company,
            location: jobDetails.location,
            salary: jobDetails.salary,
            questionsFound: jobDetails.questions?.length || 0
        });

        updateJobDetailsUI();
    }

    /**
     * Extract text content by trying multiple selectors
     * @param {Document} doc - The document to search
     * @param {Array} selectors - Array of CSS selectors to try
     * @param {String} defaultValue - Default value if nothing found
     * @param {Boolean} useMeta - Whether to also check meta tags
     * @param {Number} maxLength - Maximum length of extracted text
     * @returns {String} Extracted text or default value
     */
    function extractBySelectors(doc, selectors, defaultValue = '', useMeta = false, maxLength = null) {
        // Try CSS selectors
        for (const selector of selectors) {
            try {
                const element = doc.querySelector(selector);
                if (element) {
                    let text = '';
                    
                    // Handle meta tags
                    if (selector.startsWith('meta[')) {
                        text = element.getAttribute('content') || '';
                    } else {
                        text = element.textContent?.trim() || '';
                    }
                    
                    if (text && text.length > 0) {
                        // Clean up text
                        text = text.replace(/\s+/g, ' ').trim();
                        
                        // Apply max length if specified
                        if (maxLength && text.length > maxLength) {
                            text = text.substring(0, maxLength) + '...';
                        }
                        
                        return text;
                    }
                }
            } catch (e) {
                // Selector might be invalid, continue to next
                continue;
            }
        }
        
        return defaultValue;
    }

    /**
     * Extract application questions from the form
     * This helps understand what information the employer is asking for
     * @param {Document} doc - The document to search
     * @returns {Array} Array of question objects
     */
    function extractApplicationQuestions(doc) {
        const questions = [];
        
        try {
            // Find all labels that might be questions
            const labels = doc.querySelectorAll('label, legend, .question, [class*="question"]');
            
            labels.forEach((label, index) => {
                const text = label.textContent?.trim();
                if (!text || text.length < 3) return; // Skip empty or very short labels
                
                // Find associated input/textarea/select
                let inputType = 'unknown';
                let isRequired = false;
                let inputId = null;
                
                // Check if label has 'for' attribute
                const forAttr = label.getAttribute('for');
                if (forAttr) {
                    const input = doc.getElementById(forAttr);
                    if (input) {
                        inputType = input.tagName.toLowerCase();
                        isRequired = input.hasAttribute('required') || input.getAttribute('aria-required') === 'true';
                        inputId = forAttr;
                    }
                }
                
                // Check if input is nested inside label
                if (!inputId) {
                    const nestedInput = label.querySelector('input, textarea, select');
                    if (nestedInput) {
                        inputType = nestedInput.tagName.toLowerCase();
                        isRequired = nestedInput.hasAttribute('required') || nestedInput.getAttribute('aria-required') === 'true';
                        inputId = nestedInput.id || nestedInput.name;
                    }
                }
                
                // Check for required indicator in text (*, Required, etc.)
                if (!isRequired) {
                    isRequired = /\*|required|mandatory/i.test(text);
                }
                
                questions.push({
                    text: text.replace(/\*/g, '').trim(),
                    type: inputType,
                    required: isRequired,
                    id: inputId,
                    index: index
                });
            });
            
            console.log(`📝 Found ${questions.length} application questions/fields`);
            
            // Log first few questions for debugging
            if (questions.length > 0) {
                console.log('Sample questions:', questions.slice(0, 5));
            }
            
        } catch (e) {
            console.warn('Error extracting questions:', e);
        }
        
        return questions;
    }

    // ============================================================================
    // FIELD ANALYSIS
    // ============================================================================

    // Analyze a field to determine its type
    function analyzeField(input) {
        // Special handling for file inputs
        if (input.type === 'file') {
            const fieldText = [
                input.name || '',
                input.id || '',
                input.getAttribute('aria-label') || '',
                input.className || ''
            ].join(' ').toLowerCase();
            
            // Check if it's a resume/CV upload field
            if (fieldText.includes('resume') || 
                fieldText.includes('cv') || 
                fieldText.includes('upload') || 
                fieldText.includes('document') ||
                fieldText.includes('file')) {
                return {
                    element: input,
                    type: 'resume',
                    label: 'Resume/CV Upload',
                    identifier: input.id || input.name || 'resume_upload',
                    isFileInput: true
                };
            }
        }
        
        // Gather all possible identifying information
        const fieldText = [
            input.name || '',
            input.id || '',
            input.placeholder || '',
            input.getAttribute('aria-label') || '',
            input.getAttribute('aria-labelledby') || '',
            input.className || '',
            input.getAttribute('data-field') || '',
            input.getAttribute('data-name') || ''
        ].join(' ').toLowerCase();

        // Also check for labels in multiple ways
        let label = '';
        
        // Method 1: label[for] attribute
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
        
        // Method 2: parent label
        if (!label) {
            try {
                const parentLabel = input.closest('label');
                if (parentLabel) {
                    label = parentLabel.textContent.toLowerCase();
                }
            } catch (e) {
                // ignore
            }
        }
        
        // Method 3: previous sibling label
        if (!label && input.previousElementSibling?.tagName === 'LABEL') {
            label = input.previousElementSibling.textContent.toLowerCase();
        }
        
        // Method 4: aria-labelledby
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        if (!label && ariaLabelledBy) {
            try {
                const labelEl = window.parent.document.getElementById(ariaLabelledBy);
                if (labelEl) {
                    label = labelEl.textContent.toLowerCase();
                }
            } catch (e) {
                // ignore
            }
        }

        const combinedText = (fieldText + ' ' + label).toLowerCase();
        
        console.log(`🔍 Analyzing field - Combined text: "${combinedText.substring(0, 100)}"`);

        // Determine field type based on patterns (check more specific patterns first)
        // Priority order: more specific to less specific
        const prioritizedTypes = [
            'address2', 'address', 'firstName', 'lastName', 'fullName',
            'email', 'phone', 'linkedIn', 'city', 'state', 'zipCode', 'country'
        ];
        
        for (const fieldType of prioritizedTypes) {
            const patterns = FIELD_PATTERNS[fieldType];
            if (!patterns) continue;
            
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

    /**
     * Send message to content script to fill a field
     * Works in side panel mode using chrome.tabs API
     */
    async function sendFillFieldMessage(fieldIdentifier, value) {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                return new Promise((resolve) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'fillField',
                        fieldIdentifier: fieldIdentifier,
                        value: value
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.warn('Error filling field:', chrome.runtime.lastError.message);
                            resolve(false);
                        } else if (response && response.success) {
                            console.log('✅ Field filled:', fieldIdentifier);
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    });
                });
            }
            return false;
        } catch (e) {
            console.error('Error sending fill message:', e);
            return false;
        }
    }

    // Auto-fill the detected fields
    async function autoFillFields() {
        console.log('✨ Auto-filling fields...');
        
        const btn = document.getElementById('autoFillBtn');
        const statusMsg = document.getElementById('statusMessage');
        
        btn.disabled = true;
        btn.innerHTML = '<div class="loading"></div><span>Filling...</span>';
        
        let filledCount = 0;
        const fieldsList = document.getElementById('fieldsList');
        fieldsList.innerHTML = '';

        // Process each field
        for (const field of detectedFields) {
            let value = '';
            
            switch(field.fieldType) {
                case 'firstName':
                    value = USER_PROFILE.firstName;
                    break;
                case 'lastName':
                    value = USER_PROFILE.lastName;
                    break;
                case 'fullName':
                    value = USER_PROFILE.fullName || (USER_PROFILE.firstName + ' ' + USER_PROFILE.lastName);
                    break;
                case 'email':
                    value = USER_PROFILE.email;
                    break;
                case 'phone':
                    // Try to determine the format the field expects
                    // Check placeholder or maxlength to guess format
                    if (field.placeholder) {
                        const placeholder = field.placeholder.toLowerCase();
                        if (placeholder.includes('(') || placeholder.includes(')')) {
                            // Expects (XXX) XXX-XXXX format
                            value = USER_PROFILE.phoneFormatted || USER_PROFILE.phone;
                        } else if (placeholder.includes('-')) {
                            // Expects XXX-XXX-XXXX format
                            value = USER_PROFILE.phone || USER_PROFILE.phoneFormatted;
                        } else {
                            // No clear format, use raw digits
                            value = USER_PROFILE.phoneRaw || USER_PROFILE.phone;
                        }
                    } else {
                        // Default to formatted version
                        value = USER_PROFILE.phone || USER_PROFILE.phoneFormatted;
                    }
                    break;
                case 'linkedIn':
                    value = USER_PROFILE.linkedInUrl;
                    break;
                case 'address':
                    value = USER_PROFILE.address1;
                    break;
                case 'address2':
                    value = USER_PROFILE.address2;
                    break;
                case 'city':
                    value = USER_PROFILE.city;
                    break;
                case 'state':
                    // Smart state detection: use abbreviation for short fields, full name for longer fields
                    // Check field max length or size to determine format preference
                    if (field.element) {
                        const maxLength = field.element.maxLength || 100;
                        const fieldSize = field.element.size || 50;
                        // If field is small (maxLength <= 3 or size <= 10), use abbreviation
                        if (maxLength <= 3 || fieldSize <= 10) {
                            value = USER_PROFILE.state; // Abbreviation
                        } else {
                            // Try full name first, fallback to abbreviation
                            value = USER_PROFILE.stateFull || USER_PROFILE.state;
                        }
                    } else {
                        // Default: try abbreviation, then full name
                        value = USER_PROFILE.state || USER_PROFILE.stateFull;
                    }
                    break;
                case 'zipCode':
                    value = USER_PROFILE.zipCode || USER_PROFILE.postalCode;
                    break;
                case 'country':
                    value = USER_PROFILE.country;
                    break;
                case 'currentLocation':
                    // Format: "City, State" or "City, State ZIP"
                    if (USER_PROFILE.city && USER_PROFILE.state) {
                        value = `${USER_PROFILE.city}, ${USER_PROFILE.state}`;
                        if (USER_PROFILE.zipCode) {
                            value += ` ${USER_PROFILE.zipCode}`;
                        }
                    } else {
                        value = USER_PROFILE.city || '';
                    }
                    break;
                // Resume-based fields
                case 'skills':
                    value = USER_PROFILE.skills?.join(', ') || '';
                    break;
                case 'experience':
                    value = USER_PROFILE.yearsOfExperience > 0 ? `${USER_PROFILE.yearsOfExperience} years` : '';
                    break;
                case 'summary':
                    value = USER_PROFILE.summary || '';
                    break;
                case 'education':
                    if (USER_PROFILE.education && USER_PROFILE.education.length > 0) {
                        const edu = USER_PROFILE.education[0];
                        value = `${edu.degree} - ${edu.school}`;
                    }
                    break;
                case 'school':
                    if (USER_PROFILE.education && USER_PROFILE.education.length > 0) {
                        value = USER_PROFILE.education[0].school || USER_PROFILE.school || '';
                    } else {
                        value = USER_PROFILE.school || '';
                    }
                    break;
                case 'degree':
                    if (USER_PROFILE.education && USER_PROFILE.education.length > 0) {
                        value = USER_PROFILE.education[0].degree || USER_PROFILE.degreeLevel || '';
                    } else {
                        value = USER_PROFILE.degreeLevel || '';
                    }
                    break;
                case 'discipline':
                    if (USER_PROFILE.education && USER_PROFILE.education.length > 0) {
                        value = USER_PROFILE.education[0].discipline || USER_PROFILE.education[0].major || '';
                    } else {
                        value = ''; // Leave blank unless specified
                    }
                    break;
                case 'locationCity':
                    value = USER_PROFILE.city || '';
                    break;
                case 'currentJobTitle':
                    if (USER_PROFILE.experience && USER_PROFILE.experience.length > 0) {
                        value = USER_PROFILE.experience[0].title || '';
                    }
                    break;
                case 'currentCompany':
                    if (USER_PROFILE.experience && USER_PROFILE.experience.length > 0) {
                        value = USER_PROFILE.experience[0].company || '';
                    }
                    break;
                // New fields
                case 'github':
                    value = USER_PROFILE.githubUrl || '';
                    break;
                case 'twitter':
                    value = ''; // Leave empty unless user has twitter in profile
                    break;
                case 'portfolio':
                    value = USER_PROFILE.websiteUrl || '';
                    break;
                case 'certifications':
                    if (USER_PROFILE.certifications && USER_PROFILE.certifications.length > 0) {
                        value = USER_PROFILE.certifications.map(c => c.name).join(', ');
                    }
                    break;
                case 'languages':
                    if (USER_PROFILE.languages && USER_PROFILE.languages.length > 0) {
                        value = USER_PROFILE.languages.map(l => `${l.language} (${l.proficiency})`).join(', ');
                    }
                    break;
                case 'references':
                    value = 'Available upon request';
                    break;
                case 'availability':
                    value = 'Immediate'; // Can be customized
                    break;
                case 'salary':
                    value = ''; // Leave blank - user should fill manually
                    break;
                // Common Application Questions
                case 'preferredName':
                    value = USER_PROFILE.preferredName || USER_PROFILE.fullName;
                    break;
                case 'legallyAuthorized':
                    value = USER_PROFILE.legallyAuthorized; // "Yes"
                    break;
                case 'requireSponsorship':
                    value = USER_PROFILE.requireSponsorship; // "No"
                    break;
                case 'willingToRelocate':
                    value = USER_PROFILE.willingToRelocate; // "Yes"
                    break;
                case 'remoteWorkPreference':
                    value = USER_PROFILE.remoteWorkPreference; // "Hybrid - I understand and agree..."
                    break;
                case 'yearsOfExperience':
                    // Handle both text and numeric responses
                    if (USER_PROFILE.yearsOfExperience >= 5) {
                        value = '5+ years';
                    } else if (USER_PROFILE.yearsOfExperience >= 3) {
                        value = '3-4 years';
                    } else if (USER_PROFILE.yearsOfExperience >= 1) {
                        value = '1-2 years';
                    } else {
                        value = USER_PROFILE.yearsOfExperienceText || `${USER_PROFILE.yearsOfExperience}+ years`;
                    }
                    break;
                case 'remoteExperience':
                    value = 'Yes'; // Default to having remote experience
                    break;
                case 'agencyExperience':
                    value = 'Yes'; // Default to having agency experience
                    break;
                case 'storyBrandExperience':
                    value = USER_PROFILE.portfolioUrls || 'Yes, I have storytelling/storybrand experience';
                    break;
                case 'sampleCopy':
                    value = USER_PROFILE.portfolioUrls || USER_PROFILE.writingSampleUrl || '';
                    break;
                case 'currentlyInUS':
                    value = 'Yes'; // Default to being in US
                    break;
                case 'textMessaging':
                    value = 'Yes'; // Default to opting in for text messages
                    break;
                case 'additionalFiles':
                    // Skip file uploads
                    continue;
                case 'writingSample':
                    // Use portfolioUrls if available, otherwise fallback to writingSampleUrl
                    value = USER_PROFILE.portfolioUrls || USER_PROFILE.writingSampleUrl || '';
                    break;
                case 'howDidYouHear':
                    // Randomly select from common sources
                    if (!USER_PROFILE.howDidYouHearSource) {
                        const sources = ['LinkedIn', 'Indeed', 'Company Website', 'Referral', 'Job Board', 'Google Search', 'Recruiter'];
                        value = sources[Math.floor(Math.random() * sources.length)];
                    } else {
                        value = USER_PROFILE.howDidYouHearSource;
                    }
                    break;
                case 'affirmTruthfulness':
                    value = USER_PROFILE.affirmTruthfulness; // "Yes"
                    break;
                case 'coverLetter':
                    value = USER_PROFILE.coverLetterText || '';
                    break;
                case 'pronouns':
                    value = USER_PROFILE.pronouns; // "He/Him/His"
                    break;
                case 'currentCountry':
                    value = USER_PROFILE.currentCountry; // "United States"
                    break;
                case 'currentStateProvince':
                    value = USER_PROFILE.currentStateProvince || USER_PROFILE.stateFull || USER_PROFILE.state; // "Texas"
                    break;
                case 'sponsorshipDetails':
                    value = USER_PROFILE.sponsorshipDetails; // "I am a U.S. citizen and do not require sponsorship"
                    break;
                case 'hourlyRate':
                    value = USER_PROFILE.hourlyRate || ''; // Leave blank by default
                    break;
                case 'desiredSalary':
                    value = USER_PROFILE.desiredSalary || ''; // Leave blank by default
                    break;
                
                // Agreement/Acknowledgment fields
                case 'hybridScheduleAgreement':
                    value = 'Yes'; // Agree to hybrid schedule
                    break;
                case 'copywritingExperience':
                    // Check if they have 3+ years
                    if (USER_PROFILE.yearsOfExperience && USER_PROFILE.yearsOfExperience >= 3) {
                        value = 'Yes';
                    } else {
                        value = 'Yes'; // Default to Yes
                    }
                    break;
                case 'customFileUpload':
                    // Skip custom file uploads (octopus/pirate drawing, etc.)
                    continue;
                
                // Demographic/EEO fields
                case 'hispanicLatino':
                    value = USER_PROFILE.hispanicLatino || 'No';
                    break;
                case 'raceEthnicity':
                    value = USER_PROFILE.race || 'Two or More Races';
                    break;
                case 'genderIdentity':
                    value = USER_PROFILE.gender || 'Male';
                    break;
                case 'veteranStatus':
                    value = USER_PROFILE.veteran || 'I am not a protected veteran';
                    break;
                case 'disabilityStatus':
                    value = USER_PROFILE.disability || 'No, I do not have a disability and have not had one in the past';
                    break;
                
                case 'resume':
                    // Handle file upload separately
                    if (uploadedResumeFile && field.isFileInput) {
                        // Send message to content script to upload the file
                        window.parent.postMessage({
                            action: 'uploadFile',
                            fieldIdentifier: field.identifier,
                            fileName: uploadedResumeFile.name,
                            fileData: uploadedResumeFile
                        }, '*');
                        
                        filledCount++;
                        
                        // Add to fields list
                        const fieldItem = document.createElement('div');
                        fieldItem.className = 'field-item';
                        fieldItem.innerHTML = '<span class="field-label">Resume:</span><span>' + 
                            uploadedResumeFile.name + 
                            '</span><span class="field-status">' + String.fromCharCode(9989) + '</span>';
                        fieldsList.appendChild(fieldItem);
                    }
                    value = null; // Skip normal processing
                    break;
                default:
                    // Check if it's a common application question
                    if (field.isCommonQuestion && typeof UserPreferences !== 'undefined') {
                        UserPreferences.getCommonQuestionPreference(field.preferenceKey).then(savedValue => {
                            if (savedValue) {
                                // Auto-fill based on field type
                                if (field.fieldType === 'select' && field.element.tagName === 'SELECT') {
                                    // For select dropdowns, find matching option
                                    const options = field.element.options;
                                    for (let i = 0; i < options.length; i++) {
                                        const optionText = options[i].textContent.toLowerCase();
                                        const optionValue = options[i].value.toLowerCase();
                                        if (optionText.includes(savedValue.toLowerCase()) || 
                                            optionValue === savedValue.toLowerCase()) {
                                            field.element.selectedIndex = i;
                                            field.element.dispatchEvent(new Event('change', { bubbles: true }));
                                            filledCount++;
                                            break;
                                        }
                                    }
                                } else if (field.element.type === 'radio') {
                                    // For radio buttons, find matching radio in group
                                    const name = field.element.name;
                                    const radioButtons = window.parent.document.querySelectorAll(`input[type="radio"][name="${name}"]`);
                                    for (const radio of radioButtons) {
                                        const label = radio.labels?.[0]?.textContent.toLowerCase() || 
                                                      radio.getAttribute('aria-label')?.toLowerCase() || '';
                                        if (label.includes(savedValue.toLowerCase())) {
                                            radio.checked = true;
                                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                                            filledCount++;
                                            break;
                                        }
                                    }
                                } else if (field.fieldType === 'date' || field.element.type === 'date') {
                                    // For date fields
                                    field.element.value = savedValue;
                                    field.element.dispatchEvent(new Event('change', { bubbles: true }));
                                    filledCount++;
                                } else {
                                    // For text fields
                                    field.element.value = savedValue;
                                    field.element.dispatchEvent(new Event('input', { bubbles: true }));
                                    filledCount++;
                                }
                                
                                // Add to fields list
                                const fieldItem = document.createElement('div');
                                fieldItem.className = 'field-item';
                                fieldItem.innerHTML = '<span class="field-label">' + field.label + ':</span><span>Auto-filled</span><span class="field-status">' + String.fromCharCode(9989) + '</span>';
                                fieldsList.appendChild(fieldItem);
                            }
                        });
                        value = null; // Skip normal processing
                    }
                    // Check if it's an EEO field
                    else if (field.isEEO && typeof UserPreferences !== 'undefined') {
                        // Auto-fill EEO field with user preferences
                        UserPreferences.autoFillEEOField(field.element, field.eeoCategory).then(success => {
                            if (success) {
                                filledCount++;
                                const fieldItem = document.createElement('div');
                                fieldItem.className = 'field-item';
                                fieldItem.innerHTML = '<span class="field-label">EEO - ' + field.label + ':</span><span>Auto-filled</span><span class="field-status">' + String.fromCharCode(9989) + '</span>';
                                fieldsList.appendChild(fieldItem);
                            }
                        });
                        value = null; // Skip normal processing
                    }
                    break;
            }

            if (value) {
                // Send message to content script to fill the field (side panel mode)
                await sendFillFieldMessage(field.identifier, value);
                
                filledCount++;
                
                // Add to fields list
                const fieldItem = document.createElement('div');
                fieldItem.className = 'field-item';
                fieldItem.innerHTML = '<span class="field-label">' + field.fieldType + ':</span><span>' + 
                    (value.length > 30 ? value.substring(0, 30) + '...' : value) + 
                    '</span><span class="field-status">' + String.fromCharCode(9989) + '</span>';
                fieldsList.appendChild(fieldItem);
            }
        }

        // Update UI
        setTimeout(async () => {
            btn.disabled = false;
            btn.classList.add('success');
            btn.innerHTML = '<span>' + String.fromCharCode(9989) + '</span><span>Filled ' + filledCount + ' Fields!</span>';
            
            statusMsg.className = 'status-message success';
            statusMsg.textContent = String.fromCharCode(127881) + ' Successfully filled ' + filledCount + ' out of ' + detectedFields.length + ' detected fields!';
            statusMsg.style.display = 'block';
            
            document.getElementById('detectedFields').style.display = 'block';
            
            // Update job application status in cache
            await updateJobApplicationStatus('filled', filledCount);
            
            setTimeout(() => {
                btn.classList.remove('success');
                btn.innerHTML = '<span>' + String.fromCharCode(10024) + '</span><span>Auto-Fill Application</span>';
            }, 3000);
        }, 800);
    }

    /**
     * Show status message to user
     */
    function showStatusMessage(message, type = 'info') {
        const statusMsg = document.getElementById('statusMessage');
        if (!statusMsg) {
            console.log('Status:', message);
            return;
        }
        
        statusMsg.className = 'status-message ' + type;
        statusMsg.textContent = message;
        statusMsg.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusMsg.style.display = 'none';
        }, 5000);
    }

    // Update job details in UI
    function updateJobDetailsUI() {
        document.getElementById('jobTitle').textContent = jobDetails.title || 'Job Application Form';
        document.getElementById('companyName').textContent = jobDetails.company || String.fromCharCode(8212);
        document.getElementById('jobLocation').textContent = jobDetails.location || String.fromCharCode(8212);
        document.getElementById('jobSalary').textContent = jobDetails.salary || String.fromCharCode(8212);
        
        // Display profile data
        displayProfileData();
        
        // Display questions if found
        if (jobDetails.questions && jobDetails.questions.length > 0) {
            displayApplicationQuestions();
        }
    }

    /**
     * Display user profile data in the UI
     */
    function displayProfileData() {
        const profileDataEl = document.getElementById('profileData');
        if (!profileDataEl) return;
        
        let html = `
            <div class="data-row">
                <span class="data-label">Name:</span>
                <span class="data-value clickable-data" data-copy="${USER_PROFILE.fullName || USER_PROFILE.firstName + ' ' + USER_PROFILE.lastName}" title="Click to copy">${USER_PROFILE.fullName || USER_PROFILE.firstName + ' ' + USER_PROFILE.lastName}</span>
            </div>
            <div class="data-row">
                <span class="data-label">Email:</span>
                <span class="data-value clickable-data" data-copy="${USER_PROFILE.email}" title="Click to copy">${USER_PROFILE.email}</span>
            </div>
            <div class="data-row">
                <span class="data-label">Phone:</span>
                <span class="data-value clickable-data" data-copy="${USER_PROFILE.phone}" title="Click to copy">${USER_PROFILE.phone}</span>
            </div>
            <div class="data-row">
                <span class="data-label">Location:</span>
                <span class="data-value clickable-data" data-copy="${USER_PROFILE.city}, ${USER_PROFILE.state} ${USER_PROFILE.zipCode}" title="Click to copy">${USER_PROFILE.city}, ${USER_PROFILE.state} ${USER_PROFILE.zipCode}</span>
            </div>
        `;
        
        // Add skills if available
        if (USER_PROFILE.skills && USER_PROFILE.skills.length > 0) {
            const skillsText = USER_PROFILE.skills.join(', ');
            html += `
                <div class="data-row">
                    <span class="data-label">Skills:</span>
                    <span class="data-value clickable-data" data-copy="${skillsText}" title="Click to copy">${USER_PROFILE.skills.slice(0, 5).join(', ')}${USER_PROFILE.skills.length > 5 ? '...' : ''}</span>
                </div>
            `;
        }
        
        // Add experience if available
        if (USER_PROFILE.yearsOfExperience > 0) {
            html += `
                <div class="data-row">
                    <span class="data-label">Experience:</span>
                    <span class="data-value clickable-data" data-copy="${USER_PROFILE.yearsOfExperience} years" title="Click to copy">${USER_PROFILE.yearsOfExperience} years</span>
                </div>
            `;
        }
        
        // Add LinkedIn if available
        if (USER_PROFILE.linkedInUrl) {
            html += `
                <div class="data-row">
                    <span class="data-label">LinkedIn:</span>
                    <span class="data-value clickable-data" data-copy="${USER_PROFILE.linkedInUrl}" title="Click to copy" style="font-size: 10px; word-break: break-all;">${USER_PROFILE.linkedInUrl}</span>
                </div>
            `;
        }
        
        profileDataEl.innerHTML = html;
        
        // Add click event listeners to all clickable data elements
        setupClickToCopy();
    }
    
    // Setup click-to-copy functionality
    function setupClickToCopy() {
        const clickableElements = document.querySelectorAll('.clickable-data');
        
        clickableElements.forEach(element => {
            element.addEventListener('click', async function() {
                const textToCopy = this.getAttribute('data-copy');
                
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    
                    // Visual feedback
                    const originalText = this.innerHTML;
                    this.innerHTML = '✓ Copied!';
                    this.style.color = '#11998e';
                    this.style.fontWeight = '600';
                    
                    setTimeout(() => {
                        this.innerHTML = originalText;
                        this.style.color = '';
                        this.style.fontWeight = '';
                    }, 1500);
                } catch (err) {
                    console.error('Failed to copy:', err);
                    this.innerHTML = '✗ Failed';
                    setTimeout(() => {
                        this.innerHTML = textToCopy;
                    }, 1500);
                }
            });
        });
    }

    // Display application questions in the UI
    function displayApplicationQuestions() {
        const questions = jobDetails.questions;
        if (!questions || questions.length === 0) return;
        
        const questionsSection = document.getElementById('questionsSection');
        const questionsList = document.getElementById('questionsList');
        const questionsDivider = document.getElementById('questionsDivider');
        
        if (!questionsSection || !questionsList) return;
        
        // Show the sections
        questionsSection.style.display = 'block';
        questionsDivider.style.display = 'block';
        
        // Build questions HTML (show first 10)
        const displayQuestions = questions.slice(0, 10);
        questionsList.innerHTML = displayQuestions.map((q, index) => `
            <div style="padding: 8px; background: ${q.required ? '#fff3cd' : '#f8f9fa'}; margin-bottom: 6px; border-radius: 6px; border-left: 3px solid ${q.required ? '#ffc107' : '#6c757d'};">
                <div style="font-weight: 600; color: #333; margin-bottom: 2px;">
                    ${q.required ? '⚠️ ' : ''}${q.text}
                </div>
                <div style="font-size: 10px; color: #666;">
                    Type: ${q.type} ${q.required ? '· Required' : '· Optional'}
                </div>
            </div>
        `).join('');
        
        // Add "show more" if there are more questions
        if (questions.length > 10) {
            const moreCount = questions.length - 10;
            questionsList.innerHTML += `
                <div style="text-align: center; padding: 8px; color: #666; font-size: 11px;">
                    + ${moreCount} more question${moreCount > 1 ? 's' : ''}
                </div>
            `;
        }
        
        // Show Smart Responses button
        const smartResponsesBtn = document.getElementById('toggleSmartResponses');
        if (smartResponsesBtn) {
            smartResponsesBtn.style.display = 'flex';
        }
        
        console.log('📝 Displayed application questions in UI');
    }
    
    /**
     * Show Smart Responses for detected questions
     */
    function showSmartResponsesForQuestions() {
        const container = document.getElementById('smartResponsesContainer');
        if (!container || !jobDetails.questions || jobDetails.questions.length === 0) return;
        
        container.innerHTML = '<div style="padding: 16px; background: white; border-radius: 12px;"><h3 style="color: #667eea; margin: 0 0 16px 0;">✨ Smart Response Helper</h3></div>';
        
        // Show first few questions with smart responses
        const questionsToShow = jobDetails.questions.slice(0, 5);
        
        questionsToShow.forEach((question, index) => {
            if (typeof SmartResponses !== 'undefined') {
                const questionDiv = document.createElement('div');
                questionDiv.id = `smart-response-${index}`;
                questionDiv.style.marginBottom = '16px';
                container.appendChild(questionDiv);
                
                SmartResponses.createResponseHelperUI(question, USER_PROFILE, `smart-response-${index}`);
            }
        });
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
        
        // EEO Preferences toggle
        const preferencesBtn = document.getElementById('togglePreferences');
        if (preferencesBtn) {
            preferencesBtn.addEventListener('click', () => {
                const container = document.getElementById('preferencesContainer');
                if (container.style.display === 'none') {
                    container.style.display = 'block';
                    if (typeof UserPreferences !== 'undefined') {
                        UserPreferences.createPreferencesUI('preferencesContainer');
                    }
                    preferencesBtn.textContent = '✓ Preferences';
                } else {
                    container.style.display = 'none';
                    preferencesBtn.innerHTML = '<span>⚙️</span><span>EEO Preferences</span>';
                }
            });
        }
        
        // Smart Responses toggle
        const smartResponsesBtn = document.getElementById('toggleSmartResponses');
        if (smartResponsesBtn) {
            smartResponsesBtn.addEventListener('click', () => {
                const container = document.getElementById('smartResponsesContainer');
                if (container.style.display === 'none') {
                    container.style.display = 'block';
                    if (typeof SmartResponses !== 'undefined' && jobDetails.questions) {
                        showSmartResponsesForQuestions();
                    }
                    smartResponsesBtn.textContent = '✓ Response Helper Active';
                } else {
                    container.style.display = 'none';
                    smartResponsesBtn.innerHTML = '<span>✨</span><span>Smart Response Helper</span>';
                }
            });
        }
        
        // Refresh fields button
        const refreshBtn = document.getElementById('refreshFieldsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('🔄 Manually refreshing field detection...');
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<span>🔄</span><span>Scanning...</span>';
                
                // Request fresh data from content script
                window.parent.postMessage({ action: 'getFormFields' }, '*');
                
                setTimeout(() => {
                    refreshBtn.disabled = false;
                    refreshBtn.innerHTML = '<span>🔄</span><span>Refresh Fields</span>';
                }, 1000);
            });
        }
        
        // Close button
        const closeBtn = document.getElementById('closeSidebarBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // Send message to parent to close sidebar
                try {
                    window.parent.postMessage({ action: 'closeTalentSidebar' }, '*');
                } catch (e) {
                    console.log('Could not close sidebar');
                }
            });
        }
        
        // ========== RESUME UPLOAD FUNCTIONALITY ==========
        
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('resumeFileInput');
        const uploadedFileInfo = document.getElementById('uploadedFileInfo');
        const parseBtn = document.getElementById('parseResumeBtn');
        const removeFileBtn = document.getElementById('removeFileBtn');
        
        // Click to upload
        if (uploadArea) {
            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });
        }
        
        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileSelected(files[0]);
                }
            });
        }
        
        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const files = e.target.files;
                if (files.length > 0) {
                    handleFileSelected(files[0]);
                }
            });
        }
        
        // Parse button
        if (parseBtn) {
            parseBtn.addEventListener('click', async () => {
                console.log('🔘 Parse button clicked!');
                console.log('📁 Uploaded file:', uploadedResumeFile);
                
                if (!uploadedResumeFile) {
                    console.error('❌ No file uploaded!');
                    showStatusMessage('❌ No file uploaded. Please select a file first.', 'error');
                    return;
                }
                
                parseBtn.disabled = true;
                parseBtn.innerHTML = '⏳ Parsing...';
                console.log('🚀 Starting parse process...');
                
                try {
                    const parsedData = await parseResumeFile(uploadedResumeFile);
                    
                    console.log('✅ Parse complete! Data:', parsedData);
                    // Show success message
                    showStatusMessage('✅ Resume parsed successfully! Profile updated with your information.', 'success');
                    
                    // Update profile display
                    displayProfileData();
                    
                    parseBtn.innerHTML = '✅ Parsed Successfully!';
                    
                    setTimeout(() => {
                        parseBtn.style.display = 'none';
                    }, 2000);
                    
                } catch (e) {
                    console.error('❌ Parse error:', e);
                    console.error('Error details:', e.message, e.stack);
                    showStatusMessage('❌ Failed to parse resume: ' + e.message, 'error');
                    parseBtn.disabled = false;
                    parseBtn.innerHTML = '📊 Parse Resume & Update Profile';
                }
            });
        } else {
            console.error('❌ Parse button not found in DOM!');
        }
        
        // Remove file button
        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                uploadedResumeFile = null;
                fileInput.value = '';
                uploadedFileInfo.style.display = 'none';
                uploadArea.style.display = 'block';
                parseBtn.style.display = 'none';
            });
        }
    }
    
    /**
     * Handle file selection
     */
    function handleFileSelected(file) {
        console.log('📎 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            console.error('❌ File too large:', file.size);
            showStatusMessage('❌ File too large. Maximum size is 10MB.', 'error');
            return;
        }
        
        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        
        const fileName = file.name.toLowerCase();
        const isValidType = allowedTypes.includes(file.type) || 
                           fileName.endsWith('.pdf') || 
                           fileName.endsWith('.doc') || 
                           fileName.endsWith('.docx') || 
                           fileName.endsWith('.txt');
        
        if (!isValidType) {
            console.error('❌ Invalid file type:', file.type);
            showStatusMessage('❌ Invalid file type. Please upload PDF, DOC, DOCX, or TXT.', 'error');
            return;
        }
        
        console.log('✅ File validated successfully');
        
        // Store file
        uploadedResumeFile = file;
        console.log('💾 File stored in uploadedResumeFile');
        
        // Update UI
        const uploadArea = document.getElementById('uploadArea');
        const uploadedFileInfo = document.getElementById('uploadedFileInfo');
        const parseBtn = document.getElementById('parseResumeBtn');
        const fileName_el = document.getElementById('fileName');
        const fileSize_el = document.getElementById('fileSize');
        
        if (!uploadArea || !uploadedFileInfo || !parseBtn || !fileName_el || !fileSize_el) {
            console.error('❌ Missing UI elements!', {
                uploadArea: !!uploadArea,
                uploadedFileInfo: !!uploadedFileInfo,
                parseBtn: !!parseBtn,
                fileName_el: !!fileName_el,
                fileSize_el: !!fileSize_el
            });
            return;
        }
        
        console.log('🎨 Updating UI...');
        uploadArea.style.display = 'none';
        uploadedFileInfo.style.display = 'flex';
        parseBtn.style.display = 'block';
        
        fileName_el.textContent = file.name;
        fileSize_el.textContent = formatFileSize(file.size);
        
        console.log('✅ UI updated. Parse button should now be visible.');
    }
    
    /**
     * Format file size for display
     */
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ============================================================================
    // PUBLIC API - Allow inline editing of profile fields
    // ============================================================================
    
    /**
     * Update USER_PROFILE field and save to storage
     * Called by the inline edit functionality in the HTML
     */
    window.updateUserProfile = function(fieldName, newValue) {
        console.log(`📝 Updating USER_PROFILE.${fieldName} = "${newValue}"`);
        
        // Update the USER_PROFILE object
        if (fieldName === 'fullName') {
            USER_PROFILE.fullName = newValue;
            // Try to split into first/last name
            const nameParts = newValue.split(' ');
            if (nameParts.length >= 2) {
                USER_PROFILE.firstName = nameParts[0];
                USER_PROFILE.lastName = nameParts.slice(1).join(' ');
            }
        } else if (fieldName === 'address') {
            // Parse full address
            USER_PROFILE.address1 = newValue;
            // Try to extract city, state, zip
            const match = newValue.match(/,\s*([^,]+),\s*([A-Z]{2})\s+(\d{5})/);
            if (match) {
                USER_PROFILE.city = match[1].trim();
                USER_PROFILE.state = match[2];
                USER_PROFILE.zipCode = match[3];
            }
        } else if (fieldName === 'phone') {
            USER_PROFILE.phone = newValue;
            USER_PROFILE.phoneFormatted = newValue;
            USER_PROFILE.phoneRaw = newValue.replace(/\D/g, '');
        } else {
            // Direct field mapping
            USER_PROFILE[fieldName] = newValue;
        }
        
        // Save to chrome storage
        chrome.storage.local.set({ 
            unnanu_user_profile: USER_PROFILE 
        }, function() {
            console.log('✅ Profile saved to storage');
        });
        
        return true;
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
