import { chromium, Browser, BrowserContext } from 'playwright';

// A realistic Chrome User-Agent string to avoid bot detection
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export interface CrawlResult {
  html: string;
  title: string;
}

/**
 * Crawl a given URL and return the fully-rendered HTML.
 *
 * @param url - The target URL to crawl.
 * @returns Promise<CrawlResult>
 */
export async function crawlPage(url: string): Promise<CrawlResult> {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    context = await browser.newContext({
      userAgent: BROWSER_USER_AGENT,
      // Mimic real browser viewport
      viewport: { width: 1366, height: 768 },
      // Spoof common browser headers
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      // Remove the "webdriver" navigator flag
      javaScriptEnabled: true,
    });

    // Mask navigator.webdriver to avoid automation detection
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const page = await context.newPage();

    // Set a realistic timeout (30 seconds)
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);

    let response;
    try {
      response = await page.goto(url, {
        waitUntil: 'networkidle', // Wait for SPA/PWA JS to finish loading
        timeout: 30000,
      });
    } catch (navError: any) {
      if (navError.name === 'TimeoutError') {
        throw new Error(
          `Navigation timed out after 30 seconds. The site may be slow or blocking bots.`
        );
      }
      throw new Error(`Failed to navigate to URL: ${navError.message}`);
    }

    // Check for bot-blocking HTTP status codes
    const status = response?.status() ?? 0;
    if (status === 403) {
      throw new Error(
        `Access denied (HTTP 403). The website is blocking automated crawlers.`
      );
    }
    if (status === 429) {
      throw new Error(
        `Rate limited (HTTP 429). Too many requests to this website.`
      );
    }
    if (status >= 400 && status < 500) {
      throw new Error(
        `The website returned a client error (HTTP ${status}).`
      );
    }
    if (status >= 500) {
      throw new Error(
        `The website returned a server error (HTTP ${status}).`
      );
    }

    // --- Pop-up Handling & Scroll Enforcement ---
    try {
      await page.evaluate(() => {
        const keywords = ['close', 'modal', 'popup', 'dismiss', 'accept'];
        // Search common clickable elements
        const elements = document.querySelectorAll('button, a, div[role="button"], span');
        
        for (const el of Array.from(elements)) {
          const element = el as any;
          const className = (element.className || '').toString().toLowerCase();
          const id = (element.id || '').toString().toLowerCase();
          const text = (element.textContent || '').toLowerCase();
          
          const matchesKeyword = keywords.some(k => 
            className.includes(k) || id.includes(k) || text.includes(k)
          );

          if (matchesKeyword) {
            const style = (window as any).getComputedStyle(element);
            // Click if it seems visible
            if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
              try {
                // Prevent clicking real links which cause navigation (and blank output)
                const isLink = element.tagName.toLowerCase() === 'a';
                const hasRealHref = element.hasAttribute('href') && !element.getAttribute('href').startsWith('#') && !element.getAttribute('href').startsWith('javascript:');
                
                if (!(isLink && hasRealHref)) {
                  element.click();
                }
              } catch (e) {
                // Ignore individual click errors
              }
            }
          }
        }
      });
      // Wait a short moment (1s) for closing animations to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      // Safely ignore if popup handling fails securely
    }

    // Fallback: Inject CSS to ensure body remains scrollable in local output
    try {
      await page.addStyleTag({ content: 'body { overflow: auto !important; }' });
    } catch (e) {
      // Ignore style injection errors
    }
    // ---------------------------------------------

    // Extract fully-rendered HTML (after JS execution)
    let html = await page.content();
    const title = await page.title();

    // Inject <base> tag to fix relative assets (CSS, JS, images)
    try {
      const urlObj = new URL(url);
      const baseHref = urlObj.origin + '/'; // Always point to the website's root
      html = html.replace(/(<head[^>]*>)/i, `$1\n  <base href="${baseHref}">`);
    } catch (e) {
      // If URL parsing fails, ignore the injection
    }

    return { html, title };
  } finally {
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}
