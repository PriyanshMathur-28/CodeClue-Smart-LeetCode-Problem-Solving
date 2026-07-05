chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(["geminiapikey"], (result) => {
        if (!result.geminiapikey) {
            // Bug fix: relative URLs don't resolve in service workers.
            // Must use chrome.runtime.getURL() for extension-internal pages.
            chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
        }
    });
});