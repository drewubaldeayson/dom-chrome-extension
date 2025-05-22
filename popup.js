class DOMSlackExtractor {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadSavedConfig();
        this.setupEventListeners();
        await this.loadPreviewData();
    }

    setupEventListeners() {
        document.getElementById('saveConfig').addEventListener('click', () => this.saveConfig());
        document.getElementById('captureBtn').addEventListener('click', () => this.captureAndSend());
        document.getElementById('highlightBtn').addEventListener('click', () => this.highlightElements());
    }

    async loadSavedConfig() {
        try {
            const result = await chrome.storage.sync.get(['slackWebhookUrl']);
            if (result.slackWebhookUrl) {
                document.getElementById('webhookUrl').value = result.slackWebhookUrl;
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    async saveConfig() {
        const webhookUrl = document.getElementById('webhookUrl').value.trim();
        
        if (!webhookUrl) {
            this.showStatus('Please enter a webhook URL', 'error');
            return;
        }

        if (!this.isValidWebhookUrl(webhookUrl)) {
            this.showStatus('Please enter a valid Slack webhook URL', 'error');
            return;
        }

        try {
            await chrome.storage.sync.set({ slackWebhookUrl: webhookUrl });
            this.showStatus('✅ Configuration saved successfully!', 'success');
        } catch (error) {
            this.showStatus('Error saving configuration', 'error');
            console.error('Save config error:', error);
        }
    }

    isValidWebhookUrl(url) {
        return url.startsWith('https://hooks.slack.com/') && url.length > 50;
    }

    async loadPreviewData() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'extractData' 
            });

            if (response && response.success) {
                document.getElementById('previewTitle').textContent = response.data.title || 'No title found';
                document.getElementById('previewSummary').textContent = response.data.summary || 'No summary found';
            } else {
                document.getElementById('previewTitle').textContent = 'Unable to extract';
                document.getElementById('previewSummary').textContent = 'Unable to extract';
            }
        } catch (error) {
            console.error('Error loading preview:', error);
            document.getElementById('previewTitle').textContent = 'Error loading data';
            document.getElementById('previewSummary').textContent = 'Error loading data';
        }
    }

    async captureAndSend() {
        const captureBtn = document.getElementById('captureBtn');
        const btnText = captureBtn.querySelector('.btn-text');
        const spinner = captureBtn.querySelector('.loading-spinner');
        
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        captureBtn.disabled = true;
        this.showStatus('Extracting data and sending to Slack...', 'info');

        try {
            const result = await chrome.storage.sync.get(['slackWebhookUrl']);
            if (!result.slackWebhookUrl) {
                throw new Error('Please configure your Slack webhook URL first');
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'extractData' 
            });

            if (!response || !response.success) {
                throw new Error('Failed to extract data from page');
            }

            await this.sendToSlack(result.slackWebhookUrl, response.data, tab.url);
            
            this.showStatus('🎉 Successfully sent to Slack!', 'success');
            
            setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { action: 'highlightElements' });
            }, 500);
            
        } catch (error) {
            console.error('Capture and send error:', error);
            this.showStatus(`❌ Error: ${error.message}`, 'error');
        } finally {
            btnText.style.display = 'block';
            spinner.style.display = 'none';
            captureBtn.disabled = false;
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
                },
                {
                    type: "context",
                    elements: [
                        {
                            type: "mrkdwn",
                            text: `Extracted on ${new Date().toLocaleString()} • DOM to Slack Extension`
                        }
                    ]
                }
            ]
        };

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

    async highlightElements() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { action: 'highlightElements' });
            this.showStatus('🎯 Elements highlighted on page', 'info');
        } catch (error) {
            console.error('Highlight error:', error);
            this.showStatus('Error highlighting elements', 'error');
        }
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = 'status-message';
            }, 5000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DOMSlackExtractor();
});