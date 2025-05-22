class BackgroundService {
    constructor() {
        this.setupInstallHandler();
        this.setupContextMenus();
        this.setupMessageHandler();
    }

    setupInstallHandler() {
        chrome.runtime.onInstalled.addListener((details) => {
            console.log('DOM to Slack Extractor installed:', details);
            
            chrome.storage.sync.set({
                extensionEnabled: true,
                autoHighlight: true,
                highlightDuration: 5000
            });

            if (details.reason === 'install') {
                this.showWelcomeNotification();
            }
        });
    }

    setupContextMenus() {
        chrome.runtime.onInstalled.addListener(() => {
            chrome.contextMenus.create({
                id: 'extractAndSend',
                title: '📄 Extract & Send to Slack',
                contexts: ['page'],
                documentUrlPatterns: ['http://*/*', 'https://*/*']
            });

            chrome.contextMenus.create({
                id: 'highlightElements',
                title: '🎯 Highlight Extractable Elements',
                contexts: ['page'],
                documentUrlPatterns: ['http://*/*', 'https://*/*']
            });
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });
    }

    setupMessageHandler() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'getTabInfo':
                    this.handleGetTabInfo(sendResponse);
                    return true;
                    
                case 'sendToSlack':
                    this.handleSlackRequest(request, sendResponse);
                    return true;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        });
    }

    async handleContextMenuClick(info, tab) {
        try {
            switch (info.menuItemId) {
                case 'extractAndSend':
                    await this.quickExtractAndSend(tab);
                    break;
                    
                case 'highlightElements':
                    await chrome.tabs.sendMessage(tab.id, { 
                        action: 'highlightElements' 
                    });
                    break;
            }
        } catch (error) {
            console.error('Context menu error:', error);
            this.showErrorNotification('Failed to execute action');
        }
    }

    async quickExtractAndSend(tab) {
        try {
            const config = await chrome.storage.sync.get(['slackWebhookUrl']);
            if (!config.slackWebhookUrl) {
                this.showErrorNotification('Please configure Slack webhook in extension popup');
                return;
            }

            const response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'extractData' 
            });

            if (!response || !response.success) {
                throw new Error('Failed to extract data from page');
            }

            await this.sendToSlack(config.slackWebhookUrl, response.data, tab.url);
            
            this.showSuccessNotification('Successfully sent to Slack!');
            
            setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { action: 'highlightElements' });
            }, 500);
            
        } catch (error) {
            console.error('Quick extract error:', error);
            this.showErrorNotification(`Error: ${error.message}`);
        }
    }

    async sendToSlack(webhookUrl, data, pageUrl) {
        const slackMessage = {
            text: "📄 *DOM Data Extracted*",
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "📄 DOM Data Extracted"
                    }
                },
                {
                    type: "section",
                    fields: [
                        {
                            type: "mrkdwn",
                            text: `🔹 *Title:*\n${data.title || 'No title found'}`
                        },
                        {
                            type: "mrkdwn",
                            text: `🔹 *URL:*\n<${pageUrl}|View Page>`
                        }
                    ]
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `🔹 *Summary:*\n${data.summary || 'No summary found'}`
                    }
                }
            ]
        };

        if (data.author) {
            slackMessage.blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `👤 *Author:* ${data.author}`
                }
            });
        }

        slackMessage.blocks.push({
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `Extracted on ${new Date().toLocaleString()} • DOM to Slack Extension`
                }
            ]
        });

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(slackMessage)
        });

        if (!response.ok) {
            throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
        }
    }

    handleGetTabInfo(sendResponse) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                sendResponse({
                    success: true,
                    tabInfo: {
                        url: tabs[0].url,
                        title: tabs[0].title,
                        id: tabs[0].id
                    }
                });
            } else {
                sendResponse({ 
                    success: false, 
                    error: 'No active tab found' 
                });
            }
        });
    }

    async handleSlackRequest(request, sendResponse) {
        try {
            await this.sendToSlack(request.webhookUrl, request.data, request.pageUrl);
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }

    showWelcomeNotification() {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'DOM to Slack Extractor',
            message: 'Extension installed! Right-click on any page to extract data or use the popup.'
        });
    }

    showSuccessNotification(message) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: '✅ Success',
            message: message
        });
    }

    showErrorNotification(message) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: '❌ Error',
            message: message
        });
    }
}

new BackgroundService();

chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked for tab:', tab.url);
});