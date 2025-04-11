// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('[Audexa] Extension installed');
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Check if we can access the tab
        if (!tab.url || !tab.url.startsWith('http')) {
            console.error('[Audexa] Cannot access this page. Extension only works on web pages.');
            return;
        }

        console.log('[Audexa] Initializing on tab:', tab.url);

        // Execute content script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['scripts/content.js']
        });

        // Send message to content script and wait for response
        const response = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'startReading' }, (response) => {
                resolve(response);
            });
        });
        
        console.log('[Audexa] Started reading on tab:', tab.url, 'Response:', response);
    } catch (error) {
        console.error('[Audexa] Error:', error.message);
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "debug") {
        console.log('[Audexa Debug]', message.message);
        sendResponse({ received: true });
    }
    if (message.action === "showSentence" || message.action === "updateProgress") {
        // Handle UI updates
        sendResponse({ received: true });
    }
});