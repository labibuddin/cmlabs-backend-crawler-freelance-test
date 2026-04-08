import { Router, Request, Response } from 'express';
import { crawlPage } from '../crawler/engine';
import fs from 'fs/promises';
import path from 'path';

const router: Router = Router();
const OUTPUT_DIR = process.env.OUTPUT_DIR || './output';

/**
 * @swagger
 * /api/crawl:
 *   post:
 *     summary: Crawl a website URL
 *     description: Requests the engine to crawl a specific URL. The crawler will render JavaScript, wait for network idle, bypass basic popups, and save the fully rendered HTML locally.
 *     tags:
 *       - Crawler
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://sequence.day
 *                 description: The target URL to crawl
 *     responses:
 *       200:
 *         description: Successfully crawled and saved the HTML
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Crawl completed successfully.
 *                 filename:
 *                   type: string
 *                   example: sequence-day.html
 *                 filePath:
 *                   type: string
 *                   example: backend/output/sequence-day.html
 *                 title:
 *                   type: string
 *                   example: Sequence Day Document
 *       400:
 *         description: Invalid Input/URL format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid URL format.
 *       500:
 *         description: Server or Crawling Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Crawling failed.
 *                 detail:
 *                   type: string
 *                   example: Navigation timed out after 30 seconds.
 */
router.post('/', async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url); // Basic URL validation
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL format.' });
  }

  // Auto-generate filename from URL
  let autoFilename = parsedUrl.hostname + parsedUrl.pathname;
  if (autoFilename.endsWith('/')) autoFilename = autoFilename.slice(0, -1);
  
  // Sanitize filename to prevent directory traversal
  const safeFilename = autoFilename.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'index';

  try {
    const { html, title } = await crawlPage(url);

    // Save to output folder
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const filePath = path.join(OUTPUT_DIR, `${safeFilename}.html`);
    await fs.writeFile(filePath, html, 'utf-8');

    const relativeDisplayPath = `backend/output/${safeFilename}.html`;

    return res.status(200).json({
      success: true,
      message: 'Crawl completed successfully.',
      filename: `${safeFilename}.html`,
      filePath: relativeDisplayPath,
      title
    });
  } catch (error: any) {
    console.error('Crawl Error:', error.message);
    return res.status(500).json({
      error: 'Crawling failed.',
      detail: error.message || 'Unknown error occurred during crawling.'
    });
  }
});

export default router;
