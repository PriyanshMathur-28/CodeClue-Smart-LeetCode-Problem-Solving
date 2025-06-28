    document.addEventListener("DOMContentLoaded",() =>
    {
        chrome.storage.sync.get(["geminiapikey"], ({ geminiapikey }) => {
            if (geminiapikey) {
                document.getElementById("api-key").value = geminiapikey;
            }
        });
        document.getElementById("save-button").addEventListener("click", () => {
            const apiKey = document.getElementById("api-key").value;
            if(!apiKey) {
                return;
            }
            chrome.storage.sync.set({ geminiapikey: apiKey }, () => {
                document.getElementById("success-message").style.display = "block";
                setTimeout(() => window.close(), 2000);
            });
        })
    })