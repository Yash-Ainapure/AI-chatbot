// app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Constants
const BASE_URL = 'https://coek.dypgroup.edu.in';
const IGNORED_ROUTES = ['/events', '/wp-content', '/event', '/statutory-committees','media','media_dl','campus-life','cultural','foreign-language-program','alumni','internal-committees'];
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'data.json');

// Types
type RouteData = {
  url: string;
  content: string;
};

export async function GET() {
  try {
    console.log('🚀 Starting website scraping process...');
    
    // Step 1: Get all routes from the site
    const allRoutes = await getAllRoutes(BASE_URL);
    console.log(`📋 Found ${allRoutes.length} total routes`);
    
    // Step 2: Filter out ignored routes
    const routesToScrape = filterRoutes(allRoutes);
    console.log(`🔍 After filtering, ${routesToScrape.length} routes to scrape`);
    
    // Step 3: Scrape content from each route
    const scrapedData = await scrapeAllRoutes(routesToScrape);
    console.log(`✅ Successfully scraped content from ${scrapedData.length} routes`);
    
    // Step 4: Store data in JSON file
    saveDataToFile(scrapedData);
    console.log(`💾 Data successfully saved to ${OUTPUT_FILE}`);
    
    return NextResponse.json({ success: true, message: 'Scraping completed successfully', totalRoutes: scrapedData.length });
  } catch (error) {
    console.error('❌ Error in scraping process:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

/**
 * Get all routes from the website by crawling the main page and following links
 */
async function getAllRoutes(baseUrl: string): Promise<string[]> {
  console.log(`📡 Fetching initial routes from ${baseUrl}`);
  const visitedUrls = new Set<string>();
  const pendingUrls = [baseUrl];
  
  while (pendingUrls.length > 0) {
    const currentUrl = pendingUrls.shift()!;
    
    if (visitedUrls.has(currentUrl)) {
      continue;
    }
    
    try {
      console.log(`🔎 Exploring: ${currentUrl}`);
      const response = await fetch(currentUrl);
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch ${currentUrl}: ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      visitedUrls.add(currentUrl);
      
      // Find all links on the page
      $('a').each((_, element) => {
        let href = $(element).attr('href');
        
        if (!href) return;
        
        // Handle relative URLs
        if (href.startsWith('/')) {
          href = `${baseUrl}${href}`;
        } else if (!href.startsWith('http')) {
          href = `${baseUrl}/${href}`;
        }
        
        // Only process links from the same domain
        if (href.startsWith(baseUrl) && !visitedUrls.has(href) && !pendingUrls.includes(href)) {
          pendingUrls.push(href);
        }
      });
      
      // Safety limit to prevent infinite loops
      if (visitedUrls.size > 100) {
        console.log('⚠️ Reached maximum URL limit (500). Stopping crawl.');
        break;
      }
    } catch (error) {
      console.error(`❌ Error processing ${currentUrl}:`, error);
    }
  }
  
  // Convert URLs to routes (relative paths)
  return Array.from(visitedUrls)
    .map(url => url.replace(baseUrl, ''))
    .filter(route => route !== '');
}

/**
 * Filter routes to exclude ignored ones
 */
function filterRoutes(routes: string[]): string[] {
  console.log('🧹 Filtering out ignored routes...');
  return routes.filter(route => {
    // Skip routes that start with or contain ignored patterns
    return !IGNORED_ROUTES.some(ignored => 
      route.startsWith(ignored) || route.includes(ignored)
    );
  });
}

/**
 * Scrape content from all routes
 */
async function scrapeAllRoutes(routes: string[]): Promise<RouteData[]> {
  console.log('📥 Starting content scraping...');
  const result: RouteData[] = [];
  
  for (const route of routes) {
    try {
      const url = `${BASE_URL}${route}`;
      console.log(`🔍 Scraping: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch ${url}: ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Remove script and style elements
      $('script, style, meta, link, noscript').remove();
      
      // Extract and clean text content
      let content = $('body').text();
      
      // Clean up the content
      content = cleanContent(content);
      
      if (content.trim()) {
        result.push({ url: route, content });
      }
    } catch (error) {
      console.error(`❌ Error scraping ${route}:`, error);
    }
  }
  
  return result;
}

/**
 * Clean and filter the scraped content
 */
function cleanContent(content: string): string {
  // Remove excessive whitespace, tabs, newlines
  let cleaned = content
    .replace(/\t/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove any non-printable characters
  cleaned = cleaned.replace(/[^\x20-\x7E\x0A\x0D]/g, '');
  
  return cleaned;
}

/**
 * Save the scraped data to a JSON file
 */
function saveDataToFile(data: RouteData[]): void {
  console.log(`📝 Writing data to ${OUTPUT_FILE}`);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write the file
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}