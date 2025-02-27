import express from 'express';
import { createServer } from 'vite';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = 5173;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

app.get('/api/analyze', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Start both requests in parallel
    const startTime = Date.now();
    
    try {
      const [websiteResponse, lighthouseResponse] = await Promise.all([
        fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
          },
          timeout: 10000 // 10 second timeout
        }).catch(error => {
          console.error('Website fetch error:', error);
          return new Response('', { status: 200 }); // Return empty response if fetch fails
        }),
        fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`)
          .catch(error => {
            console.error('Lighthouse fetch error:', error);
            return new Response(JSON.stringify({}), { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          })
      ]);

      const html = await websiteResponse.text();
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
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
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new Error('Failed to fetch website data');
    }
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze website',
      details: error.message
    });
  }
});

// Create Vite server in middleware mode
const vite = await createServer({
  server: { 
    middlewareMode: true,
    cors: true
  },
  appType: 'spa'
});

// Use vite's connect instance as middleware
app.use(vite.middlewares);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});