import express from 'express';
import { createServer } from 'vite';
import fetch from 'node-fetch';

const app = express();
const port = 5173;

app.use(express.json());

app.get('/api/analyze', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const startTime = Date.now();
    const response = await fetch(url);
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const html = await response.text();

    // Fetch Lighthouse scores
    const pagespeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;
    const lighthouseResponse = await fetch(pagespeedUrl);
    const lighthouseData = await lighthouseResponse.json();

    const lighthouse = {
      performance: lighthouseData?.lighthouseResult?.categories?.performance?.score || 0.5,
      accessibility: lighthouseData?.lighthouseResult?.categories?.accessibility?.score || 0.5,
      bestPractices: lighthouseData?.lighthouseResult?.categories?.['best-practices']?.score || 0.5,
      seo: lighthouseData?.lighthouseResult?.categories?.seo?.score || 0.5
    };

    res.json({
      html,
      loadTime,
      lighthouse
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze website' });
  }
});

// Create Vite server in middleware mode
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa'
});

// Use vite's connect instance as middleware
app.use(vite.middlewares);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});