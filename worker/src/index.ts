import { WebsiteAnalyzer } from './analyzer';
import { loadPyodide } from 'pyodide';

interface Env {

}

interface LighthouseResult {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number };
      accessibility?: { score: number };
      'best-practices'?: { score: number };
      seo?: { score: number };
    };
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    try {
      const url = new URL(request.url);
      
      if (!url.pathname.endsWith('/analyze')) {
        return new Response('Not found', { status: 404 });
      }

      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'URL is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const startTime = Date.now();
      
      const [websiteResponse, lighthouseResponse] = await Promise.all([
        fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
          }
        }).catch(() => new Response('')),
        fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=mobile`)
          .catch(() => new Response(JSON.stringify({})))
      ]);

      const html = await websiteResponse.text();
      const loadTime = (Date.now() - startTime) / 1000;
      const lighthouseData = await lighthouseResponse.json() as LighthouseResult;

      const lighthouse = {
        performance: lighthouseData?.lighthouseResult?.categories?.performance?.score ?? 0.5,
        accessibility: lighthouseData?.lighthouseResult?.categories?.accessibility?.score ?? 0.5,
        bestPractices: lighthouseData?.lighthouseResult?.categories?.['best-practices']?.score ?? 0.5,
        seo: lighthouseData?.lighthouseResult?.categories?.seo?.score ?? 0.5
      };

      // Initialize Pyodide
      const pyodide = await loadPyodide();
      
      // Install required packages
      await pyodide.loadPackage(['beautifulsoup4']);
      
      // Load the Python analyzer code
      await pyodide.runPythonAsync(`
        from bs4 import BeautifulSoup
        import json
        
        def analyze_html(html_content):
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Check patient experience features
            keywords = {
                'Doctor Search': ['find a doctor', 'search doctor', 'find doctor', 'doctor directory'],
                'Video Consultation': ['video consult', 'telemedicine', 'virtual care', 'online consultation'],
                'Online Payment': ['pay online', 'payment gateway', 'make payment', 'bill payment'],
                'Chatbot': ['chat with us', 'virtual assistant', 'chat bot', 'chat support'],
                'Helpline': ['helpline', 'toll free', 'contact us', 'emergency contact']
            }
            
            patient_experience = {}
            text_content = soup.get_text().lower()
            
            for feature, terms in keywords.items():
                patient_experience[feature] = any(term in text_content for term in terms)
            
            # Check digital presence
            digital_presence = {
                'Instagram': bool(soup.find('a', href=lambda x: x and 'instagram.com' in x.lower())),
                'Facebook': bool(soup.find('a', href=lambda x: x and 'facebook.com' in x.lower())),
                'YouTube': bool(soup.find('a', href=lambda x: x and 'youtube.com' in x.lower()))
            }
            
            # Check mobile responsiveness
            responsive_indicators = [
                'viewport',
                'media="screen',
                '@media',
                'max-width',
                'min-width'
            ]
            
            mobile_responsive = any(
                indicator in str(soup).lower() for indicator in responsive_indicators
            )
            
            return {
                'patientExperience': patient_experience,
                'digitalPresence': digital_presence,
                'mobileResponsive': mobile_responsive
            }
      `);

      // Run the Python analysis
      const pyResults = await pyodide.runPythonAsync(`
        results = analyze_html('''${html.replace(/'''/g, "'")}''')
        json.dumps(results)
      `);
      
      const pythonAnalysis = JSON.parse(pyResults);

      // Combine Python analysis with other data
      const analysis = {
        patientExperience: pythonAnalysis.patientExperience,
        digitalPresence: pythonAnalysis.digitalPresence,
        performance: {
          mobileResponsive: pythonAnalysis.mobileResponsive,
          loadTime: `${loadTime.toFixed(2)} seconds`,
          scores: lighthouse
        }
      };

      return new Response(JSON.stringify(analysis), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return new Response(JSON.stringify({ 
        error: 'Failed to analyze website',
        details: errorMessage
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  },
};