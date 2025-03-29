// Required dependencies
import express from 'express';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON body
app.use(express.json());

// Endpoint to capture screenshot as base64
app.get('/api/screenshot', async (req, res) => {
  let browser = null;
  try {
    // Get URL from query parameter
    const url = req.query.url;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Optional parameters with defaults
    const width = parseInt(req.query.width) || 1280;
    const height = parseInt(req.query.height) || 720;
    const fullPage = req.query.fullPage === 'true';
    const waitTime = parseInt(req.query.waitTime) || 0;
    const format = req.query.format || 'png'; // png or jpeg
    const quality = format === 'jpeg' ? (parseInt(req.query.quality) || 80) : undefined;
    
    // Launch browser with Render-compatible settings
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    
    // Create new page
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width, height });
    
    // Navigate to URL
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 // Increased timeout for reliability
    });
    
    // Optional wait time (in ms)
    if (waitTime > 0) {
      await page.waitForTimeout(waitTime);
    }
    
    // Take screenshot as base64
    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage,
      type: format,
      quality,
      captureBeyondViewport: true // Ensures full page capture
    });
    
    // Send base64 response
    res.json({
      success: true,
      data: screenshot,
      format,
      encoding: 'base64',
      dataUri: `data:image/${format};base64,${screenshot}`
    });
    
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ 
      error: 'Failed to capture screenshot', 
      details: error.message 
    });
  } finally {
    // Ensure browser is closed even if error occurs
    if (browser) {
      await browser.close();
    }
  }
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Start server
app.listen(port, () => {
  console.log(`Screenshot API running on port ${port}`);
});
