document.addEventListener("DOMContentLoaded", () => {
    // Load existing key and pre-fill the input
    chrome.storage.sync.get(["geminiapikey"], ({ geminiapikey }) => {
        if (geminiapikey) {
            document.getElementById("api-key").value = geminiapikey;
        }
    });

    // Bug fix: listen on the <form> submit event so we can call
    // e.preventDefault() and stop the page from reloading before
    // chrome.storage.sync.set() has a chance to complete.
    const form = document.getElementById("options-form");
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Bug fix: trim() the key so accidental copy-paste whitespace
        // doesn't cause silent 400 errors from the Gemini API.
        const apiKey = document.getElementById("api-key").value.trim();
        if (!apiKey) return;

        chrome.storage.sync.set({ geminiapikey: apiKey }, () => {
            const msg = document.getElementById("success-message");
            msg.classList.add("show");
            
            // Close the tab fast (800ms) and reliably using Chrome extension APIs
            setTimeout(() => {
                chrome.tabs.getCurrent((tab) => {
                    if (tab) {
                        chrome.tabs.remove(tab.id);
                    } else {
                        window.close(); // Fallback
                    }
                });
            }, 800);
        });
    });
});