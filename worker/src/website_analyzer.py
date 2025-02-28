import urllib.request
import time
from urllib.parse import urljoin
from http.client import HTTPResponse
import json
import re
from typing import Dict, List, Optional
import ssl

class HealthcareWebsiteAnalyzer:
    def __init__(self, url: str):
        self.url = url
        self.html_content = ""
        
    def fetch_website(self) -> None:
        """Fetch website content safely with SSL context"""
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            request = urllib.request.Request(self.url, headers=headers)
            start_time = time.time()
            with urllib.request.urlopen(request, context=context) as response:
                self.html_content = response.read().decode('utf-8')
                self.load_time = time.time() - start_time
        except Exception as e:
            print(f"Error fetching website: {e}")
            self.html_content = ""
            self.load_time = 0

    def check_patient_experience(self) -> Dict[str, bool]:
        """Check patient experience features"""
        features = {
            'Doctor Search': False,
            'Video Consultation': False,
            'Online Payment': False,
            'Chatbot': False,
            'Helpline': False
        }
        
        # Common keywords for each feature
        keywords = {
            'Doctor Search': ['find a doctor', 'search doctor', 'find doctor', 'doctor directory'],
            'Video Consultation': ['video consult', 'telemedicine', 'virtual care', 'online consultation'],
            'Online Payment': ['pay online', 'payment gateway', 'make payment', 'bill payment'],
            'Chatbot': ['chat with us', 'virtual assistant', 'chat bot', 'chat support'],
            'Helpline': ['helpline', 'toll free', 'contact us', 'emergency contact']
        }
        
        for feature, terms in keywords.items():
            for term in terms:
                if re.search(term, self.html_content.lower()):
                    features[feature] = True
                    break
                    
        return features

    def check_digital_presence(self) -> Dict[str, bool]:
        """Check social media presence"""
        social_media = {
            'Instagram': False,
            'Facebook': False,
            'YouTube': False
        }
        
        patterns = {
            'Instagram': r'instagram\.com/[^/"\']*',
            'Facebook': r'facebook\.com/[^/"\']*',
            'YouTube': r'youtube\.com/[^/"\']*'
        }
        
        for platform, pattern in patterns.items():
            if re.search(pattern, self.html_content):
                social_media[platform] = True
                
        return social_media

    def check_website_performance(self) -> Dict[str, any]:
        """Check website performance metrics"""
        performance = {
            'Mobile Responsive': self._check_mobile_responsive(),
            'Load Time': f"{self.load_time:.2f} seconds"
        }
        return performance
        
    def _check_mobile_responsive(self) -> bool:
        """Check if website has mobile responsive meta tags or CSS"""
        responsive_indicators = [
            'viewport',
            'media="screen',
            '@media',
            'max-width',
            'min-width'
        ]
        
        for indicator in responsive_indicators:
            if indicator in self.html_content:
                return True
        return False

    def analyze(self) -> Dict:
        """Run all checks and return results"""
        self.fetch_website()
        
        if not self.html_content:
            return {"error": "Failed to fetch website content"}
            
        results = {
            "Patient Experience": self.check_patient_experience(),
            "Digital Presence": self.check_digital_presence(),
            "Website Performance": self.check_website_performance()
        }
        
        return results

def main():
    # Example usage
    url = input("Enter the website URL to analyze: ")
    analyzer = HealthcareWebsiteAnalyzer(url)
    results = analyzer.analyze()
    
    # Pretty print results
    print("\nAnalysis Results:")
    print("================")
    
    for category, features in results.items():
        print(f"\n{category}:")
        print("-" * len(category))
        
        if isinstance(features, dict):
            for feature, value in features.items():
                if isinstance(value, bool):
                    status = "✅ Available" if value else "❌ Not Found"
                else:
                    status = value
                print(f"{feature}: {status}")

if __name__ == "__main__":
    main()