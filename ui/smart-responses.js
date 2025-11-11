/**
 * Smart Responses Module
 * Handles detection, storage, and management of application question responses
 */

const SmartResponses = (function() {
    'use strict';

    // Storage key for saved responses
    const RESPONSES_STORAGE_KEY = 'unnanu_smart_responses';

    // Question type patterns
    const QUESTION_TYPES = {
        seo_experience: {
            keywords: ['seo', 'search engine optimization', 'on-page', 'off-page', 'technical seo', 'seo strategy', 'seo implementation'],
            category: 'SEO Experience',
            icon: '🔍'
        },
        ai_usage: {
            keywords: ['ai', 'artificial intelligence', 'machine learning', 'chatgpt', 'automation', 'ai tools', 'using ai'],
            category: 'AI Usage',
            icon: '🤖'
        },
        tools: {
            keywords: ['tools', 'software', 'platforms', 'use', 'experience with', 'familiar with', 'proficient'],
            category: 'Tools & Software',
            icon: '🛠️'
        },
        campaign_results: {
            keywords: ['campaign', 'results', 'kpi', 'metrics', 'improved', 'achieved', 'success', 'performance'],
            category: 'Campaign Results',
            icon: '📊'
        },
        experience: {
            keywords: ['experience', 'background', 'worked on', 'projects', 'role', 'responsibilities'],
            category: 'Work Experience',
            icon: '💼'
        },
        technical_skills: {
            keywords: ['technical', 'coding', 'programming', 'development', 'technical skills'],
            category: 'Technical Skills',
            icon: '💻'
        },
        achievements: {
            keywords: ['achievement', 'accomplishment', 'success story', 'proud of', 'biggest win'],
            category: 'Achievements',
            icon: '🏆'
        },
        challenges: {
            keywords: ['challenge', 'difficult', 'problem', 'overcome', 'obstacle'],
            category: 'Challenges',
            icon: '⚡'
        },
        strategy: {
            keywords: ['strategy', 'approach', 'methodology', 'process', 'how do you'],
            category: 'Strategy & Approach',
            icon: '🎯'
        }
    };

    // Default response templates
    const RESPONSE_TEMPLATES = {
        seo_experience: `I have [X years] of experience implementing comprehensive SEO strategies for client websites. Key implementations include:

**On-Page SEO:**
- Optimized title tags, meta descriptions, and header structures
- Improved content relevance and keyword targeting
- Enhanced internal linking architecture

**Technical SEO:**
- Improved site speed and Core Web Vitals
- Implemented structured data (Schema.org)
- Fixed crawl errors and improved XML sitemaps
- Enhanced mobile responsiveness

Example: For [Client/Project], I increased organic traffic by [X%] through [specific strategy].`,

        ai_usage: `I actively integrate AI tools into my workflow to enhance productivity and results:

**Current AI Applications:**
- Using ChatGPT/Claude for content ideation and optimization
- Leveraging AI for keyword research and content gap analysis
- Automating routine tasks with AI-powered tools
- Using AI for data analysis and trend identification

**Impact:**
These AI integrations have helped me [specific improvement] and allowed me to focus more on strategic initiatives.`,

        tools: `My primary toolset includes:

**SEO Tools:**
- Google Search Console & Analytics
- SEMrush / Ahrefs / Moz
- Screaming Frog SEO Spider
- Google Tag Manager

**Analytics & Reporting:**
- Google Data Studio / Looker Studio
- Excel / Google Sheets for data analysis

**Other Tools:**
- [CMS platforms: WordPress, etc.]
- [Project management: Asana, Monday, etc.]`,

        campaign_results: `**Campaign:** [Campaign Name/Type]

**Challenge:** [Brief context of what needed improvement]

**Strategy:**
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Results:**
- Organic traffic: +[X%]
- Keyword rankings: [X] keywords to page 1
- Conversions: +[X%]
- [Other relevant KPIs]

**Timeframe:** [X months]

**Key Learnings:** [What made it successful]`,

        experience: `Throughout my [X years] in [field/role], I have:

- [Key responsibility/achievement 1]
- [Key responsibility/achievement 2]
- [Key responsibility/achievement 3]

Example projects include [specific examples with measurable outcomes].`,

        default: `[Provide a clear, specific response with concrete examples and measurable results where possible. Structure your answer with:
1. Context/Background
2. Your approach/actions
3. Results/outcomes
4. Key learnings]`
    };

    /**
     * Detect question type from question text
     */
    function detectQuestionType(questionText) {
        const lowerText = questionText.toLowerCase();
        
        for (const [typeKey, typeData] of Object.entries(QUESTION_TYPES)) {
            for (const keyword of typeData.keywords) {
                if (lowerText.includes(keyword)) {
                    return {
                        type: typeKey,
                        category: typeData.category,
                        icon: typeData.icon,
                        confidence: 'high'
                    };
                }
            }
        }
        
        return {
            type: 'general',
            category: 'General Question',
            icon: '❓',
            confidence: 'low'
        };
    }

    /**
     * Get template for question type
     */
    function getTemplate(questionType) {
        return RESPONSE_TEMPLATES[questionType] || RESPONSE_TEMPLATES.default;
    }

    /**
     * Extract relevant content from user profile
     */
    function extractRelevantContent(questionType, userProfile) {
        const suggestions = [];

        switch (questionType) {
            case 'seo_experience':
            case 'tools':
                if (userProfile.skills && userProfile.skills.length > 0) {
                    const relevantSkills = userProfile.skills.filter(skill => 
                        /seo|analytics|semrush|ahrefs|moz|wordpress|google/i.test(skill)
                    );
                    if (relevantSkills.length > 0) {
                        suggestions.push({
                            type: 'skills',
                            content: relevantSkills.join(', '),
                            label: 'Your relevant skills'
                        });
                    }
                }
                break;

            case 'experience':
            case 'campaign_results':
                if (userProfile.experience && userProfile.experience.length > 0) {
                    const recentExp = userProfile.experience[0];
                    suggestions.push({
                        type: 'experience',
                        content: `${recentExp.title} at ${recentExp.company}`,
                        label: 'Most recent role',
                        details: recentExp.description
                    });
                }
                break;

            case 'technical_skills':
                if (userProfile.skills && userProfile.skills.length > 0) {
                    const techSkills = userProfile.skills.filter(skill => 
                        /javascript|python|html|css|react|node|sql|api/i.test(skill)
                    );
                    if (techSkills.length > 0) {
                        suggestions.push({
                            type: 'skills',
                            content: techSkills.join(', '),
                            label: 'Your technical skills'
                        });
                    }
                }
                break;
        }

        // Add years of experience if available
        if (userProfile.yearsOfExperience > 0) {
            suggestions.push({
                type: 'experience_years',
                content: `${userProfile.yearsOfExperience} years`,
                label: 'Total experience'
            });
        }

        // Add summary if available
        if (userProfile.summary) {
            suggestions.push({
                type: 'summary',
                content: userProfile.summary.substring(0, 200) + '...',
                label: 'From your professional summary'
            });
        }

        return suggestions;
    }

    /**
     * Save user response for future use
     */
    async function saveResponse(questionType, questionText, response) {
        try {
            const result = await chrome.storage.local.get([RESPONSES_STORAGE_KEY]);
            const savedResponses = result[RESPONSES_STORAGE_KEY] || {};

            if (!savedResponses[questionType]) {
                savedResponses[questionType] = [];
            }

            // Add new response
            savedResponses[questionType].push({
                questionText: questionText,
                response: response,
                timestamp: new Date().toISOString(),
                useCount: 0
            });

            // Keep only last 10 responses per type
            if (savedResponses[questionType].length > 10) {
                savedResponses[questionType] = savedResponses[questionType].slice(-10);
            }

            await chrome.storage.local.set({ [RESPONSES_STORAGE_KEY]: savedResponses });
            console.log('✅ Saved response for', questionType);
            
            return true;
        } catch (e) {
            console.error('❌ Error saving response:', e);
            return false;
        }
    }

    /**
     * Get saved responses for a question type
     */
    async function getSavedResponses(questionType) {
        try {
            const result = await chrome.storage.local.get([RESPONSES_STORAGE_KEY]);
            const savedResponses = result[RESPONSES_STORAGE_KEY] || {};
            return savedResponses[questionType] || [];
        } catch (e) {
            console.error('❌ Error loading saved responses:', e);
            return [];
        }
    }

    /**
     * Find similar saved responses
     */
    async function findSimilarResponses(questionText) {
        const questionType = detectQuestionType(questionText);
        const savedResponses = await getSavedResponses(questionType.type);
        
        // Sort by most recent first
        return savedResponses.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    }

    /**
     * Generate smart suggestions for a question
     */
    async function generateSuggestions(questionText, userProfile) {
        const detectedType = detectQuestionType(questionText);
        const template = getTemplate(detectedType.type);
        const relevantContent = extractRelevantContent(detectedType.type, userProfile);
        const similarResponses = await findSimilarResponses(questionText);

        return {
            questionType: detectedType,
            template: template,
            relevantContent: relevantContent,
            similarResponses: similarResponses,
            tips: getTipsForQuestionType(detectedType.type)
        };
    }

    /**
     * Get tips for answering specific question types
     */
    function getTipsForQuestionType(questionType) {
        const tips = {
            seo_experience: [
                'Provide specific examples with measurable results',
                'Mention both on-page and technical SEO',
                'Include tools and methodologies used',
                'Quantify improvements (traffic, rankings, conversions)'
            ],
            ai_usage: [
                'Mention specific AI tools you use',
                'Explain how AI improves your workflow',
                'Give concrete examples of AI applications',
                'Show understanding of AI limitations'
            ],
            tools: [
                'List specific tools with your proficiency level',
                'Group tools by category',
                'Mention certifications if applicable',
                'Include both primary and supplementary tools'
            ],
            campaign_results: [
                'Use the STAR method (Situation, Task, Action, Result)',
                'Include specific metrics and KPIs',
                'Explain your strategy and reasoning',
                'Mention timeframes and constraints'
            ],
            default: [
                'Be specific and provide concrete examples',
                'Use numbers and metrics where possible',
                'Keep responses concise but comprehensive',
                'Proofread before submitting'
            ]
        };

        return tips[questionType] || tips.default;
    }

    /**
     * Create UI for response helper
     */
    function createResponseHelperUI(question, userProfile, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        generateSuggestions(question.text, userProfile).then(suggestions => {
            const html = `
                <div class="response-helper" data-question-id="${question.id}">
                    <div class="response-header">
                        <span class="question-icon">${suggestions.questionType.icon}</span>
                        <div class="question-meta">
                            <div class="question-type">${suggestions.questionType.category}</div>
                            <div class="question-text">${question.text}</div>
                        </div>
                    </div>

                    ${suggestions.relevantContent.length > 0 ? `
                        <div class="relevant-content">
                            <div class="section-title">💡 From Your Profile</div>
                            ${suggestions.relevantContent.map(item => `
                                <div class="content-item" data-copy="${item.content}">
                                    <span class="content-label">${item.label}:</span>
                                    <span class="content-value">${item.content}</span>
                                    <button class="copy-btn" title="Copy">📋</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <div class="template-section">
                        <div class="section-title">📝 Response Template</div>
                        <textarea class="response-template" rows="8" placeholder="Start typing your response...">${suggestions.template}</textarea>
                        <div class="template-actions">
                            <button class="btn-use-template">Use Template</button>
                            <button class="btn-clear">Clear</button>
                        </div>
                    </div>

                    ${suggestions.similarResponses.length > 0 ? `
                        <div class="saved-responses">
                            <div class="section-title">📚 Your Previous Responses</div>
                            ${suggestions.similarResponses.slice(0, 3).map((resp, idx) => `
                                <div class="saved-response" data-response-id="${idx}">
                                    <div class="response-preview">${resp.response.substring(0, 100)}...</div>
                                    <button class="btn-reuse">Reuse</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <div class="tips-section">
                        <div class="section-title">💡 Tips</div>
                        <ul class="tips-list">
                            ${suggestions.tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="response-actions">
                        <button class="btn-save-response">💾 Save Response for Later</button>
                        <button class="btn-copy-fill">📋 Copy & Fill</button>
                    </div>
                </div>
            `;

            container.innerHTML = html;
            attachResponseHelperEvents(container, question);
        });
    }

    /**
     * Attach event listeners to response helper UI
     */
    function attachResponseHelperEvents(container, question) {
        // Copy buttons for content items
        container.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const contentItem = e.target.closest('.content-item');
                const textToCopy = contentItem.getAttribute('data-copy');
                navigator.clipboard.writeText(textToCopy).then(() => {
                    btn.textContent = '✓';
                    setTimeout(() => btn.textContent = '📋', 1500);
                });
            });
        });

        // Use template button
        const useTemplateBtn = container.querySelector('.btn-use-template');
        if (useTemplateBtn) {
            useTemplateBtn.addEventListener('click', () => {
                const textarea = container.querySelector('.response-template');
                // You can add logic here to fill the actual form field
                console.log('Using template for question:', question.id);
            });
        }

        // Clear button
        const clearBtn = container.querySelector('.btn-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const textarea = container.querySelector('.response-template');
                textarea.value = '';
            });
        }

        // Reuse saved response buttons
        container.querySelectorAll('.btn-reuse').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const savedResponseEl = e.target.closest('.saved-response');
                const responseId = parseInt(savedResponseEl.getAttribute('data-response-id'));
                const detectedType = detectQuestionType(question.text);
                const savedResponses = await getSavedResponses(detectedType.type);
                
                if (savedResponses[responseId]) {
                    const textarea = container.querySelector('.response-template');
                    textarea.value = savedResponses[responseId].response;
                }
            });
        });

        // Save response button
        const saveBtn = container.querySelector('.btn-save-response');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const textarea = container.querySelector('.response-template');
                const response = textarea.value.trim();
                
                if (response) {
                    const detectedType = detectQuestionType(question.text);
                    const saved = await saveResponse(detectedType.type, question.text, response);
                    
                    if (saved) {
                        saveBtn.textContent = '✓ Saved!';
                        setTimeout(() => {
                            saveBtn.textContent = '💾 Save Response for Later';
                        }, 2000);
                    }
                }
            });
        }
    }

    // Public API
    return {
        detectQuestionType,
        getTemplate,
        extractRelevantContent,
        saveResponse,
        getSavedResponses,
        findSimilarResponses,
        generateSuggestions,
        createResponseHelperUI,
        QUESTION_TYPES,
        RESPONSE_TEMPLATES
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.SmartResponses = SmartResponses;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartResponses;
}
