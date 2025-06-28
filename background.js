chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(["geminiapikey"], (result) => {
        if (!result.geminiapikey) {
            chrome.tabs.create({url: "options.html"});
        }
    });
});