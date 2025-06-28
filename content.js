chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.type === "GET_ARTICLE_TEXT") {
        // READ ONLY - Don't modify the webpage at all
        const questionSelectors = [
            '[data-cy="question-content"]',
            '.question-content', 
            '.problem-description',
            '.question-statement',
            '[class*="question"]',
            '[class*="problem"]'
        ];
        
        const testSelectors = [
            '.example',
            '[class*="example"]',
            '[class*="test"]',
            'pre',
            'code'
        ];
        
        let content = '';
        
        // Get question content - READ ONLY, don't remove
        for (let selector of questionSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                content += el.innerText + '\n\n';
                break;
            }
        }
        
        // Get test cases - READ ONLY, don't remove
        testSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Skip if element is inside unwanted sections (but don't remove them)
                if (el.closest('nav, header, footer, .navbar, .sidebar, .menu, .ads, .comments')) {
                    return;
                }
                
                const text = el.innerText?.trim();
                if (text && (text.includes('Input') || text.includes('Output') || text.includes('Example'))) {
                    content += text + '\n\n';
                }
            });
        });
        
        sendResponse({ text: content || "No question/test content found." });
    }
});