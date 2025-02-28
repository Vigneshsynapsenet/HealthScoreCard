interface PatientExperience {
  'Doctor Search': boolean;
  'Video Consultation': boolean;
  'Online Payment': boolean;
  'Chatbot': boolean;
  'Helpline': boolean;
}

interface DigitalPresence {
  'Instagram': boolean;
  'Facebook': boolean;
  'YouTube': boolean;
  'Twitter' : boolean;
}

interface WebsitePerformance {
  mobileResponsive: boolean;
  loadTime: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
}

export class WebsiteAnalyzer {
  private html: string;
  private loadTime: number;

  constructor(html: string, loadTime: number) {
    this.html = html.toLowerCase();
    this.loadTime = loadTime;
  }

  checkPatientExperience(): PatientExperience {
    const keywords = {
      'Doctor Search': ['our doctors','select doctor','find a doctor', 'search doctor', 'find doctor', 'doctor directory', 'find doctors', 'find a physician', 'search a doctor', 'search doctors','search for doctors', 'search doctor', 'look for a doctor'],
      'Video Consultation': ['book video consult','video consult', 'telemedicine', 'virtual care', 'online consultation', 'video consultation', 'online consult', 'consult online','consult doctors online'],
      'Online Payment': ['pay online', 'payment gateway', 'make payment', 'bill payment', 'online payment'],
      'Chatbot': ['chat with us', 'virtual assistant', 'chat bot', 'chat support'],
      'Helpline': ['helpline', 'toll free', 'contact us', 'emergency contact','request a callback','lifeline']
    };

    return Object.entries(keywords).reduce((acc, [feature, terms]) => ({
      ...acc,
      [feature]: terms.some(term => this.html.includes(term))
    }), {} as PatientExperience);
  }

  checkDigitalPresence(): DigitalPresence {
    const patterns = {
      'Instagram': /instagram\.com\/[^/"']*/,
      'Facebook': /facebook\.com\/[^/"']*/,
      'YouTube': /youtube\.com\/[^/"']*/,
      'Twitter': /twitter\.com\/[^/"']*/,
    };

    return Object.entries(patterns).reduce((acc, [platform, pattern]) => ({
      ...acc,
      [platform]: pattern.test(this.html)
    }), {} as DigitalPresence);
  }

  checkMobileResponsive(): boolean {
    const indicators = [
      'viewport',
      'media="screen',
      '@media',
      'max-width',
      'min-width'
    ];
    return indicators.some(indicator => this.html.includes(indicator));
  }

  analyze(lighthouse: WebsitePerformance['scores']): {
    patientExperience: PatientExperience;
    digitalPresence: DigitalPresence;
    performance: WebsitePerformance;
  } {
    return {
      patientExperience: this.checkPatientExperience(),
      digitalPresence: this.checkDigitalPresence(),
      performance: {
        mobileResponsive: this.checkMobileResponsive(),
        loadTime: `${this.loadTime.toFixed(2)} seconds`,
        scores: lighthouse
      }
    };
  }
}