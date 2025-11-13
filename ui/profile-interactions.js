// Profile field interactions - Click to copy, double-click to edit
(function() {
    'use strict';

    // Click-to-copy and double-click-to-edit functionality
    document.addEventListener('DOMContentLoaded', function() {
        const clickableFields = document.querySelectorAll('.clickable-data');
        
        clickableFields.forEach(field => {
            let clickTimeout = null;
            let isEditing = false;
            
            // Single click - copy to clipboard
            field.addEventListener('click', function(e) {
                if (isEditing) return; // Don't copy while editing
                
                clearTimeout(clickTimeout);
                clickTimeout = setTimeout(() => {
                    // Copy text to clipboard
                    const text = field.textContent.trim();
                    navigator.clipboard.writeText(text).then(() => {
                        // Show visual feedback
                        field.classList.add('copied');
                        showCopyTooltip(field, 'Copied!');
                        
                        setTimeout(() => {
                            field.classList.remove('copied');
                        }, 1000);
                    }).catch(err => {
                        console.error('Failed to copy:', err);
                        showCopyTooltip(field, 'Copy failed');
                    });
                }, 200); // Small delay to detect double-click
            }, false);
            
            // Double click - enable editing
            field.addEventListener('dblclick', function(e) {
                clearTimeout(clickTimeout);
                
                // Enable editing
                isEditing = true;
                field.contentEditable = 'true';
                field.classList.add('editing');
                field.focus();
                
                // Select all text
                const range = document.createRange();
                range.selectNodeContents(field);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                
                showCopyTooltip(field, 'Edit mode - Press Enter to save');
            });
            
            // Handle blur (when user clicks outside)
            field.addEventListener('blur', function(e) {
                if (isEditing) {
                    saveFieldEdit(field);
                    isEditing = false;
                }
            });
            
            // Handle Enter key to save
            field.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    field.blur(); // Trigger save
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    // Revert changes
                    field.contentEditable = 'false';
                    field.classList.remove('editing');
                    isEditing = false;
                    // Reload original value from USER_PROFILE
                    loadProfileData();
                }
            });
        });
        
        function showCopyTooltip(element, message) {
            // Remove existing tooltip if any
            const existingTooltip = element.querySelector('.copy-tooltip');
            if (existingTooltip) {
                existingTooltip.remove();
            }
            
            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'copy-tooltip';
            tooltip.textContent = message;
            element.style.position = 'relative';
            element.appendChild(tooltip);
            
            // Show tooltip
            setTimeout(() => tooltip.classList.add('show'), 10);
            
            // Hide and remove tooltip
            setTimeout(() => {
                tooltip.classList.remove('show');
                setTimeout(() => tooltip.remove(), 200);
            }, 2000);
        }
        
        function saveFieldEdit(field) {
            field.contentEditable = 'false';
            field.classList.remove('editing');
            
            const fieldName = field.getAttribute('data-field');
            const newValue = field.textContent.trim();
            
            // Update USER_PROFILE in talent-sidebar.js
            if (typeof window.updateUserProfile === 'function') {
                window.updateUserProfile(fieldName, newValue);
                showCopyTooltip(field, 'Saved!');
            } else {
                console.log('Updated field:', fieldName, '=', newValue);
                showCopyTooltip(field, 'Saved locally');
            }
        }
        
        function loadProfileData() {
            // This will be called by talent-sidebar.js when it loads
            // It will populate the fields with USER_PROFILE data
        }
    });
    
    // Portfolio URLs functionality
    document.addEventListener('DOMContentLoaded', function() {
        const portfolioField = document.getElementById('portfolioUrls');
        const copyBtn = document.getElementById('copyPortfolioBtn');
        const saveBtn = document.getElementById('savePortfolioBtn');
        
        if (!portfolioField || !copyBtn || !saveBtn) return;
        
        // Load saved portfolio URLs from storage
        chrome.storage.local.get(['unnanu_user_profile'], function(result) {
            if (result.unnanu_user_profile && result.unnanu_user_profile.portfolioUrls) {
                portfolioField.value = result.unnanu_user_profile.portfolioUrls;
            }
        });
        
        // Copy portfolio URLs to clipboard
        copyBtn.addEventListener('click', function() {
            const urls = portfolioField.value.trim();
            if (urls) {
                navigator.clipboard.writeText(urls).then(() => {
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '✅ Copied!';
                    copyBtn.style.background = '#4CAF50';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.style.background = '#2196F3';
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    copyBtn.innerHTML = '❌ Failed';
                    setTimeout(() => {
                        copyBtn.innerHTML = '📋 Copy URLs';
                    }, 2000);
                });
            }
        });
        
        // Save portfolio URLs to profile storage (persists across sessions)
        saveBtn.addEventListener('click', function() {
            const urls = portfolioField.value.trim();
            chrome.storage.local.get(['unnanu_user_profile'], function(result) {
                const profile = result.unnanu_user_profile || {};
                profile.portfolioUrls = urls;
                
                chrome.storage.local.set({ unnanu_user_profile: profile }, function() {
                    const originalText = saveBtn.innerHTML;
                    saveBtn.innerHTML = '✅ Saved!';
                    setTimeout(() => {
                        saveBtn.innerHTML = originalText;
                    }, 2000);
                    
                    // Update window profile if function exists
                    if (typeof window.updateUserProfile === 'function') {
                        window.updateUserProfile('portfolioUrls', urls);
                    }
                });
            });
        });
    });
})();
