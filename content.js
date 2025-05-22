class DOMExtractor {
    constructor() {
        this.highlightClass = 'dom-slack-highlight';
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'extractData':
                    this.handleExtractData(sendResponse);
                    return true;
                    
                case 'highlightElements':
                    this.handleHighlightElements();
                    sendResponse({ success: true });
                    break;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        });
    }

    handleExtractData(sendResponse) {
        try {
            const data = this.extractPageData();
            sendResponse({ 
                success: true, 
                data: data 
            });
        } catch (error) {
            console.error('Extract data error:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    extractPageData() {
        const title = this.extractTitle();
        
        const summary = this.extractFirstParagraph();
        
        const metadata = this.extractMetadata();
        
        return {
            title,
            summary,
            url: window.location.href,
            domain: window.location.hostname,
            timestamp: new Date().toISOString(),
            ...metadata
        };
    }

    extractTitle() {
        const strategies = [
            () => document.querySelector('.mw-page-title-main')?.textContent?.trim(),
            () => document.querySelector('#firstHeading')?.textContent?.trim(),
            () => document.querySelector('h1')?.textContent?.trim(),
            () => document.querySelector('[data-testid="headline"]')?.textContent?.trim(),
            () => document.querySelector('.entry-title')?.textContent?.trim(),
            () => document.querySelector('.post-title')?.textContent?.trim(),
            () => document.querySelector('.article-title')?.textContent?.trim(),
            () => document.querySelector('[role="heading"][aria-level="1"]')?.textContent?.trim(),
            () => document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim(),
            () => document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')?.trim(),
            () => {
                const title = document.querySelector('title')?.textContent?.trim();
                if (title) {
                    return title.replace(/(\s*[-|–—]\s*.+)$/, '').trim();
                }
                return null;
            }
        ];

        for (const strategy of strategies) {
            try {
                const result = strategy();
                if (result && result.length > 0 && result.length < 300) {
                    const cleanedTitle = result
                        .replace(/\s+/g, ' ')
                        .replace(/^\s*[-|–—]\s*/, '')
                        .trim();
                    
                    if (cleanedTitle.length > 0) {
                        return cleanedTitle;
                    }
                }
            } catch (error) {
                continue;
            }
        }

        return 'No title found';
    }

    extractFirstParagraph() {
        const siteSpecificStrategies = [
            () => this.extractWikipediaContent(),
            () => this.extractBlogContent(),
            () => this.extractNewsContent(),
            () => this.extractGeneralContent()
        ];

        for (const strategy of siteSpecificStrategies) {
            try {
                const result = strategy();
                if (result && result.length > 30 && result.length < 800) {
                    return this.cleanText(result);
                }
            } catch (error) {
                continue;
            }
        }

        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
                               document.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim();
        
        if (metaDescription && metaDescription.length > 20) {
            return this.cleanText(metaDescription);
        }

        return 'No meaningful content found';
    }

    extractWikipediaContent() {
        const contentSelectors = [
            '.mw-parser-output > p:not(.mw-empty-elt)',
            '#mw-content-text p',
            '.content p'
        ];

        for (const selector of contentSelectors) {
            const paragraphs = Array.from(document.querySelectorAll(selector));
            
            for (const p of paragraphs) {
                const text = p.textContent?.trim();
                
                if (!text || text.length < 50) continue;
                
                if (text.includes('Coordinates:') || 
                    text.includes('disambiguation') ||
                    text.match(/^\d+°.*[NS].*[EW]/)) continue;
                
                if (text.match(/^\d{4}[-–]\d{4}/) && text.length < 100) continue;
                
                if (text.length > 50 && text.length < 600) {
                    return text;
                }
            }
        }
        
        return null;
    }

    extractBlogContent() {
        const blogSelectors = [
            '.entry-content p',
            '.post-content p',
            '.content p',
            'article p',
            '.article-body p',
            '.story-body p'
        ];

        return this.findBestParagraph(blogSelectors);
    }

    extractNewsContent() {
        const newsSelectors = [
            '.article-body p',
            '.story-body p',
            '.content-body p',
            '[data-module="ArticleBody"] p',
            '.post-body p',
            '.entry-content p'
        ];

        return this.findBestParagraph(newsSelectors);
    }

    extractGeneralContent() {
        const generalSelectors = [
            'main p',
            '.main-content p',
            '#content p',
            '.container p',
            'article p',
            '.content p'
        ];

        return this.findBestParagraph(generalSelectors);
    }

    findBestParagraph(selectors) {
        for (const selector of selectors) {
            const paragraphs = Array.from(document.querySelectorAll(selector));
            
            const goodParagraphs = paragraphs
                .filter(p => this.isGoodParagraph(p))
                .sort((a, b) => {
                    const aRect = a.getBoundingClientRect();
                    const bRect = b.getBoundingClientRect();
                    return aRect.top - bRect.top;
                });

            if (goodParagraphs.length > 0) {
                return goodParagraphs[0].textContent.trim();
            }
        }
        
        return null;
    }

    isGoodParagraph(paragraph) {
        const text = paragraph.textContent?.trim();
        if (!text || text.length < 50) return false;
        
        const parentClasses = paragraph.parentElement?.className?.toLowerCase() || '';
        const parentId = paragraph.parentElement?.id?.toLowerCase() || '';
        
        const badPatterns = [
            'nav', 'footer', 'sidebar', 'comment', 'advertisement', 'ad-',
            'social', 'share', 'related', 'recommended', 'cookie', 'gdpr'
        ];
        
        const contextText = (parentClasses + ' ' + parentId).toLowerCase();
        if (badPatterns.some(pattern => contextText.includes(pattern))) {
            return false;
        }
        
        const links = paragraph.querySelectorAll('a');
        const linkTextLength = Array.from(links).reduce((sum, link) => sum + (link.textContent?.length || 0), 0);
        if (linkTextLength > text.length * 0.5) return false;
        
        if (text.match(/^(copyright|©|\d{4}|all rights reserved)/i)) return false;
        
        if (text.length < 50 || text.length > 800) return false;
        
        return true;
    }

    extractMetadata() {
        const metadata = {};
        
        const authorSelectors = [
            'meta[name="author"]',
            '[rel="author"]',
            '.author',
            '.byline'
        ];
        
        for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                metadata.author = element.getAttribute('content') || element.textContent?.trim();
                break;
            }
        }
        
        const dateSelectors = [
            'meta[property="article:published_time"]',
            'time[datetime]',
            '.published',
            '.date'
        ];
        
        for (const selector of dateSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                metadata.publishDate = element.getAttribute('datetime') || 
                                     element.getAttribute('content') || 
                                     element.textContent?.trim();
                break;
            }
        }
        
        return metadata;
    }

    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .replace(/\[[^\]]*\]/g, '') 
            .replace(/\([^)]*edit[^)]*\)/gi, '')
            .trim()
            .substring(0, 400) + (text.length > 400 ? '...' : '');
    }

    handleHighlightElements() {
        this.removeHighlights();
        
        const titleElement = this.findTitleElement();
        if (titleElement) {
            this.addHighlight(titleElement, 'title');
        }
        
        const paragraphElement = this.findParagraphElement();
        if (paragraphElement) {
            this.addHighlight(paragraphElement, 'paragraph');
        }
        
        setTimeout(() => {
            this.removeHighlights();
        }, 5000);
    }

    findTitleElement() {
        const selectors = [
            '.mw-page-title-main',
            '#firstHeading',
            'h1',
            '[data-testid="headline"]',
            '.entry-title',
            '.post-title',
            '.article-title',
            '[role="heading"][aria-level="1"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 0) {
                return element;
            }
        }
        
        return null;
    }

    findParagraphElement() {
        const domain = window.location.hostname.toLowerCase();
        
        if (domain.includes('wikipedia')) {
            return this.findWikipediaParagraphElement();
        }
        
        return this.findGeneralParagraphElement();
    }

    findWikipediaParagraphElement() {
        const selectors = [
            '.mw-parser-output > p:not(.mw-empty-elt)',
            '#mw-content-text p',
            '.content p'
        ];

        for (const selector of selectors) {
            const paragraphs = Array.from(document.querySelectorAll(selector));
            
            for (const p of paragraphs) {
                const text = p.textContent?.trim();
                
                if (!text || text.length < 50) continue;
                if (text.includes('Coordinates:') || text.includes('disambiguation')) continue;
                if (text.match(/^\d+°.*[NS].*[EW]/)) continue;
                if (text.match(/^\d{4}[-–]\d{4}/) && text.length < 100) continue;
                
                return p;
            }
        }
        
        return null;
    }

    findGeneralParagraphElement() {
        const selectors = [
            '.entry-content p',
            '.post-content p',
            '.content p',
            'article p',
            '.article-body p',
            'main p',
            '#content p'
        ];

        for (const selector of selectors) {
            const paragraphs = Array.from(document.querySelectorAll(selector));
            
            const goodParagraph = paragraphs.find(p => this.isGoodParagraph(p));
            if (goodParagraph) {
                return goodParagraph;
            }
        }
        
        return null;
    }

    addHighlight(element, type) {
        element.classList.add(this.highlightClass);
        element.classList.add(`${this.highlightClass}-${type}`);
        
        element.style.animation = 'domSlackPulse 2s ease-in-out 3';
    }

    removeHighlights() {
        const highlightedElements = document.querySelectorAll(`.${this.highlightClass}`);
        highlightedElements.forEach(element => {
            element.classList.remove(this.highlightClass);
            element.classList.remove(`${this.highlightClass}-title`);
            element.classList.remove(`${this.highlightClass}-paragraph`);
            element.style.animation = '';
        });
    }
}

new DOMExtractor();