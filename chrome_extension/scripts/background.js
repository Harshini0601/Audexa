// Add speech-to-text toggle to context menu
chrome.contextMenus.create({
    id: 'toggleSpeechToText',
    title: 'Toggle Speech to Text',
    contexts: ['page']
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'toggleSpeechToText') {
        chrome.tabs.sendMessage(tab.id, { action: 'toggleSpeechToText' });
    }
}); 