import type { SourceDefinition } from '../src/lib/schema';

export const sourceDefinitions: SourceDefinition[] = [
  {
    id: 'national-bank-healthcare-pros',
    provider: 'National Bank',
    category: 'banking',
    seedUrl: 'https://www.nbc.ca/personal/switch-national-bank/occupations/healthcare.html',
    country: 'CA',
    extractorType: 'pattern-summary',
    allowedDomains: ['www.nbc.ca', 'nbc.ca'],
    discoveryPatterns: [
      'healthcare',
      'health-sciences',
      'professionals',
      'specialists',
      'offer',
      'promotion',
      'credit-card'
    ],
    professionTargets: [
      'physicians',
      'dentists',
      'veterinarians',
      'optometrists',
      'pharmacists',
      'chiropractors',
      'podiatrists'
    ],
    enabled: true,
    title: 'National Bank healthcare professionals offer',
    subcategory: 'banking bundle',
    audience: 'all-healthcare-pros',
    regionScope: 'Canada',
    offerType: 'bundle',
    professionTags: [
      'physicians',
      'dentists',
      'veterinarians',
      'optometrists',
      'pharmacists',
      'chiropractors',
      'podiatrists'
    ],
    valueRules: [
      {
        label: 'Up to $1,313 in annual savings',
        pattern: 'Up to\\s*\\$1,313\\s*in annual savings',
        required: true
      },
      {
        label: 'Up to 3 bank accounts with no fixed monthly fees',
        pattern: 'Up to\\s*3\\s*bank accounts with no fixed monthly fees'
      },
      {
        label: 'Preferred personal and home equity lines of credit',
        pattern: 'Personal and home equity lines of credit with preferred terms and conditions'
      },
      {
        label: 'Eligible Mastercard rewards credit card included',
        pattern: 'eligible Mastercard rewards credit card'
      }
    ],
    eligibilityRules: [
      {
        label: 'Offer targets healthcare professionals including physicians, dentistry, veterinary medicine, pharmaceuticals, optometry and ophthalmology, chiropractic, and podiatry',
        pattern: 'Physicians\\s+Dentistry and veterinary medicine\\s+Pharmaceuticals\\s+Optometry and ophthalmology\\s+Chiropractic\\s+Podiatry',
        required: true
      }
    ],
    dateRules: [],
    termsLinkPatterns: ['terms', 'conditions', 'legal', 'notes'],
    priority: 10
  },
  {
    id: 'national-bank-health-science-specialists',
    provider: 'National Bank',
    category: 'banking',
    seedUrl: 'https://www.nbc.ca/particuliers/switch-national-bank/occupations/healthcare/health-sciences.html',
    country: 'CA',
    extractorType: 'pattern-summary',
    allowedDomains: ['www.nbc.ca', 'nbc.ca'],
    discoveryPatterns: ['healthcare', 'health-sciences', 'specialists', 'offer'],
    professionTargets: [
      'nurses',
      'psychologists',
      'social workers',
      'occupational therapists',
      'physiotherapists',
      'speech-language pathologists',
      'medical imaging'
    ],
    enabled: true,
    title: 'National Bank health science specialists offer',
    subcategory: 'banking bundle',
    audience: 'all-healthcare-pros',
    regionScope: 'Canada',
    offerType: 'bundle',
    professionTags: [
      'nurses',
      'psychologists',
      'social workers',
      'occupational therapists',
      'physiotherapists',
      'speech-language pathologists',
      'medical imaging'
    ],
    valueRules: [
      {
        label: 'Up to 3 bank accounts with no fixed monthly fees',
        pattern: 'Up to\\s*3\\s*bank accounts with no fixed monthly fees',
        required: true
      },
      {
        label: 'Preferred personal and home equity lines of credit',
        pattern: 'Personal and home equity lines of credit with preferred terms and conditions'
      },
      {
        label: 'Eligible Mastercard rewards credit card included',
        pattern: 'eligible Mastercard rewards credit card'
      }
    ],
    eligibilityRules: [
      {
        label: 'Offer targets nursing and movement or rehabilitation professionals',
        pattern: 'Nursing|Movement and rehabilitation',
        required: true
      },
      {
        label: 'Offer also includes psychology, social work, and medical imaging or laboratory professionals',
        pattern: 'Psychology and social work|Laboratory and medical imaging|medical imaging',
        required: true
      }
    ],
    dateRules: [],
    termsLinkPatterns: ['terms', 'conditions', 'legal', 'notes'],
    priority: 9
  },
  {
    id: 'scotiabank-practising-physicians',
    provider: 'Scotiabank',
    category: 'banking',
    seedUrl: 'https://www.scotiabank.com/ca/en/healthcare-plus/physician-banking/practising/personal-banking.html',
    country: 'CA',
    extractorType: 'pattern-summary',
    allowedDomains: ['www.scotiabank.com'],
    discoveryPatterns: ['healthcare-plus', 'physician-banking', 'medical', 'banking', 'line-of-credit'],
    professionTargets: ['physicians'],
    enabled: true,
    title: 'Scotiabank Healthcare+ practising physician banking offer',
    subcategory: 'physician banking',
    audience: 'physicians',
    regionScope: 'Canada',
    offerType: 'bundle',
    professionTags: ['physicians'],
    valueRules: [
      {
        label: 'Scotiabank highlights fee savings or preferred pricing for practising physicians',
        pattern: 'No monthly account fee|preferred rates|Save the annual fee',
        required: true
      },
      {
        label: 'Bonus Scene+ points on an eligible Scotiabank credit card',
        pattern: 'Bonus Scene\\+ points'
      },
      {
        label: 'Preferred rates on select borrowing solutions',
        pattern: 'preferred rates'
      }
    ],
    eligibilityRules: [
      {
        label: 'Offer is built for practicing physicians and medical doctors in Canada',
        pattern: 'Practi[sc]ing Physicians|Medical Doctors|physician banking',
        required: true
      }
    ],
    dateRules: [],
    termsLinkPatterns: ['terms', 'conditions', 'legal'],
    priority: 9
  },
  {
    id: 'scotiabank-medical-students',
    provider: 'Scotiabank',
    category: 'lending',
    seedUrl: 'https://www.scotiabank.com/ca/en/healthcare-plus/physician-banking/medical-students.html',
    country: 'CA',
    extractorType: 'pattern-summary',
    allowedDomains: ['www.scotiabank.com'],
    discoveryPatterns: ['healthcare-plus', 'medical-students', 'line-of-credit', 'student'],
    professionTargets: ['medical students'],
    enabled: true,
    title: 'Scotiabank Healthcare+ medical student offer',
    subcategory: 'student line of credit',
    audience: 'medical-students',
    regionScope: 'Canada',
    offerType: 'rate',
    professionTags: ['medical students'],
    valueRules: [
      {
        label: 'Scotia Professional Student Plan line of credit reaches up to $400,000 at Prime -0.25%',
        pattern: 'Up to \\$400,000 at Prime -0\\.25%',
        required: true
      },
      {
        label: 'Medical students can save the annual fee on an eligible credit card',
        pattern: 'Save the annual fee'
      },
      {
        label: 'Eligible cards advertise up to 6X Scene+ points and no foreign transaction fees',
        pattern: '6X Scene\\+|No foreign transaction fees'
      }
    ],
    eligibilityRules: [
      {
        label: 'Offer is designed for medical students in Canada',
        pattern: 'medical student',
        required: true
      }
    ],
    dateRules: [],
    termsLinkPatterns: ['terms', 'conditions', 'legal'],
    priority: 8
  },
  {
    id: 'scotiabank-medical-residents',
    provider: 'Scotiabank',
    category: 'lending',
    seedUrl: 'https://www.scotiabank.com/ca/en/healthcare-plus/physician-banking/medical-residents.html',
    country: 'CA',
    extractorType: 'pattern-summary',
    allowedDomains: ['www.scotiabank.com'],
    discoveryPatterns: ['healthcare-plus', 'medical-residents', 'line-of-credit', 'resident'],
    professionTargets: ['medical residents'],
    enabled: true,
    title: 'Scotiabank Healthcare+ medical resident offer',
    subcategory: 'resident line of credit',
    audience: 'medical-residents',
    regionScope: 'Canada',
    offerType: 'rate',
    professionTags: ['medical residents'],
    valueRules: [
      {
        label: 'Residents get annual fee savings on an eligible card',
        pattern: 'Save the annual fee',
        required: true
      },
      {
        label: 'Residents can earn up to $1,050 in welcome offers and savings value',
        pattern: 'up to \\$1,050 in welcome offers'
      },
      {
        label: 'Residents are shown preferred mortgage or borrowing rates',
        pattern: 'preferred rates'
      }
    ],
    eligibilityRules: [
      {
        label: 'Offer is designed for medical residents in Canada',
        pattern: 'medical residents',
        required: true
      }
    ],
    dateRules: [],
    termsLinkPatterns: ['terms', 'conditions', 'legal'],
    priority: 8
  },
  {
    id: 'lenovo-healthcare-discount',
    provider: 'Lenovo',
    category: 'tech',
    seedUrl: 'https://www.lenovo.com/ca/en/discount-programs/',
    country: 'CA',
    extractorType: 'pattern-summary',
    allowedDomains: ['www.lenovo.com', 'lenovo.com'],
    discoveryPatterns: ['medical-workers', 'health', 'healthcare', 'discount', 'deals'],
    professionTargets: ['nurses', 'doctors', 'medical professionals'],
    enabled: true,
    title: 'Lenovo Canada healthcare worker discount',
    subcategory: 'electronics discount',
    audience: 'all-healthcare-pros',
    regionScope: 'Canada',
    offerType: 'discount',
    professionTags: ['nurses', 'doctors', 'medical professionals'],
    valueRules: [
      {
        label: 'Healthcare workers receive an extra 5% off sitewide on Lenovo Canada',
        pattern: 'Healthcare Discount',
        required: true
      },
      {
        label: 'ID.me verification unlocks the healthcare worker pricing',
        pattern: 'ID\\.me|verify'
      },
      {
        label: 'Lenovo highlights laptops, desktops, monitors, and accessories in the program',
        pattern: 'laptops|desktops|monitors|accessories'
      }
    ],
    eligibilityRules: [
      {
        label: 'Offer is for doctors, nurses, and other medical professionals in Canada',
        pattern: 'Nurses, doctors & other medical professionals',
        required: true
      }
    ],
    dateRules: [],
    termsLinkPatterns: ['terms', 'conditions', 'restrictions'],
    priority: 7
  },
  {
    id: 'gmc-canada-discount-programs',
    provider: 'GMC Canada',
    category: 'auto',
    seedUrl: 'https://www.gmccanada.ca/en/programs',
    country: 'CA',
    extractorType: 'pattern-summary',
    allowedDomains: ['www.gmccanada.ca', 'gmccanada.ca'],
    discoveryPatterns: ['programs', 'preferred-pricing', 'bonus', 'mobility'],
    professionTargets: ['all healthcare professionals'],
    enabled: true,
    title: 'GMC Canada programs and preferred pricing tracker',
    subcategory: 'vehicle pricing program',
    audience: 'all-healthcare-pros',
    regionScope: 'Canada',
    offerType: 'discount',
    professionTags: ['all healthcare professionals'],
    valueRules: [
      {
        label: 'GMC Canada keeps active national discount programs and preferred pricing offers on the programs hub',
        pattern: 'Preferred Pricing Program',
        required: true
      },
      {
        label: 'Current vehicle incentives are surfaced directly on GMC Canada special offers pages',
        pattern: 'SPECIAL OFFERS'
      }
    ],
    eligibilityRules: [
      {
        label: 'This source is tracked as an official discovery hub for Canadian vehicle programs and bonus offers',
        pattern: 'PROGRAMS',
        required: true
      }
    ],
    dateRules: [],
    termsLinkPatterns: ['program', 'offer', 'bonus'],
    priority: 6
  }
];
