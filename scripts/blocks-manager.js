/**
 * Blocks Manager Module
 * Handles showing/hiding sections based on settings
 */

let sectionsSettings = {};

// Validate settings integrity
function validateSettingsIntegrity(settings) {
  try {
    // Check if sections exist
    if (!settings.sections || typeof settings.sections !== 'object') {
      return { valid: false, error: 'Missing or invalid sections object' };
    }
    
    // Check if sections have content
    const sectionsCount = Object.keys(settings.sections).length;
    if (sectionsCount === 0) {
      return { valid: false, error: 'Sections object is empty' };
    }
    
    // Check if sections have required structure
    const requiredSections = ['problemSolution', 'programs', 'socialProof', 'testimonials', 'gallery', 'faq', 'leadForm'];
    const missingSections = requiredSections.filter(section => !settings.sections[section]);
    
    if (missingSections.length > requiredSections.length / 2) {
      return { valid: false, error: `Too many missing sections: ${missingSections.join(', ')}` };
    }
    
    // Check if sections have proper structure
    for (const [key, section] of Object.entries(settings.sections)) {
      if (!section.title || typeof section.enabled !== 'boolean' || !section.content) {
        return { valid: false, error: `Invalid structure in section: ${key}` };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Validation error: ${error.message}` };
  }
}

// Load sections settings with automatic recovery
async function loadSectionsSettings() {
  try {
    const response = await fetch('data/settings.json');
    const settings = await response.json();
    
    // Enhanced integrity check
    const integrityCheck = validateSettingsIntegrity(settings);
    if (!integrityCheck.valid) {
      console.warn(`Settings integrity check failed: ${integrityCheck.error}`);
      console.warn('Attempting recovery from default...');
      await recoverFromDefault();
      return;
    }
    
    sectionsSettings = settings.sections;
    applySectionsSettings();
  } catch (error) {
    console.error('Error loading sections settings:', error);
    console.log('Attempting to recover from default settings...');
    await recoverFromDefault();
  }
}

// Recover settings from default backup
async function recoverFromDefault() {
  try {
    const defaultResponse = await fetch('data/settings-default.json');
    const defaultSettings = await defaultResponse.json();
    
    if (defaultSettings.sections && Object.keys(defaultSettings.sections).length > 0) {
      console.log('Recovered settings from default backup');
      sectionsSettings = defaultSettings.sections;
      
      // Save recovered settings back to main file
      await saveRecoveredSettings(defaultSettings);
      
      applySectionsSettings();
    } else {
      console.warn('Default settings also empty, using fallback');
      showAllSections();
    }
  } catch (error) {
    console.error('Error recovering from default settings:', error);
    // Final fallback - show all sections
    showAllSections();
  }
}

// Save recovered settings back to main settings file
async function saveRecoveredSettings(recoveredSettings) {
  try {
    const response = await window.GAS_API.call('/api/save-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: 'settings.json',
        content: JSON.stringify(recoveredSettings, null, 2)
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('Settings recovered and saved successfully');
      }
    }
  } catch (error) {
    console.error('Error saving recovered settings:', error);
  }
}

// Apply sections settings to the page
function applySectionsSettings() {
  // Map of section keys to their DOM selectors
  const sectionMap = {
    'problemSolution': '#problem-solution',
    'programs': '#programs',
    'programComparison': '.program-comparison-note',
    'howItWorks': '#how-it-works',
    'socialProof': '#social-proof',
    'testimonials': '#testimonials',
    'gallery': '#gallery',
    'pricing': '#pricing',
    'faq': '#faq',
    'faqCta': '#faq .text-center.mt-xl',
    'leadForm': '#lead-form',
    'footerAbout': '.footer-about',
    'footerContacts': '.footer-contacts',
    'footerDocuments': '.footer-documents'
  };

  // Apply visibility settings and content changes
  Object.entries(sectionMap).forEach(([key, selector]) => {
    const element = document.querySelector(selector);
    if (element) {
      const setting = sectionsSettings[key];
      
      // Apply visibility
      if (setting && setting.enabled === false) {
        element.style.display = 'none';
      } else {
        element.style.display = '';
        
        // Apply content changes if available
        if (setting && setting.content) {
          applyContentChanges(key, element, setting.content);
        }
      }
    }
  });

  // Special handling for pricing section in programs
  handlePricingInPrograms();
}

// Apply content changes to specific sections
function applyContentChanges(sectionKey, element, content) {
  switch(sectionKey) {
    case 'problemSolution':
      applyProblemSolutionContent(element, content);
      break;
      
    case 'programComparison':
      applyProgramComparisonContent(element, content);
      break;
      
    case 'howItWorks':
      applyHowItWorksContent(element, content);
      break;
      
    case 'socialProof':
      applySocialProofContent(element, content);
      break;
      
    case 'testimonials':
      applyTestimonialsContent(element, content);
      break;
      
    case 'gallery':
      applyGalleryContent(element, content);
      break;
      
    case 'programs':
      applyProgramsContent(element, content);
      break;
      
    case 'faq':
      applyFaqContent(element, content);
      break;
      
    case 'leadForm':
      applyLeadFormContent(element, content);
      break;
      
    case 'faqCta':
      applyFaqCtaContent(element, content);
      break;
      
    case 'footerAbout':
      applyFooterAboutContent(element, content);
      break;
      
    case 'footerContacts':
      applyFooterContactsContent(element, content);
      break;
      
    case 'footerDocuments':
      applyFooterDocumentsContent(element, content);
      break;
  }
}

// Apply problem-solution content
function applyProblemSolutionContent(element, content) {
  if (content.heading) {
    const heading = element.querySelector('h2');
    if (heading) heading.textContent = content.heading;
  }
  
  const cards = element.querySelectorAll('.card');
  if (cards.length >= 2) {
    // Problem card (first)
    if (content.problemTitle) {
      const problemH3 = cards[0].querySelector('h3');
      if (problemH3) problemH3.textContent = content.problemTitle;
    }
    if (content.problemText) {
      const problemP = cards[0].querySelector('p:first-of-type');
      if (problemP) problemP.textContent = content.problemText;
    }
    if (content.problemSubtext) {
      const problemSubP = cards[0].querySelector('p:last-of-type');
      if (problemSubP) problemSubP.textContent = content.problemSubtext;
    }
    
    // Solution card (second)
    if (content.solutionTitle) {
      const solutionH3 = cards[1].querySelector('h3');
      if (solutionH3) solutionH3.textContent = content.solutionTitle;
    }
    if (content.solutionText) {
      const solutionP = cards[1].querySelector('p:first-of-type');
      if (solutionP) solutionP.textContent = content.solutionText;
    }
    if (content.solutionSubtext) {
      const solutionSubP = cards[1].querySelector('p:last-of-type');
      if (solutionSubP) solutionSubP.textContent = content.solutionSubtext;
    }
  }
}

// Apply program comparison content
function applyProgramComparisonContent(element, content) {
  if (content.text) {
    const p = element.querySelector('p');
    if (p) p.innerHTML = content.text;
  }
}

// Apply how it works content
function applyHowItWorksContent(element, content) {
  if (content.heading) {
    const heading = element.querySelector('h2');
    if (heading) heading.textContent = content.heading;
  }
  
  if (content.steps && Array.isArray(content.steps)) {
    const cards = element.querySelectorAll('.card');
    content.steps.forEach((step, index) => {
      if (cards[index]) {
        const h3 = cards[index].querySelector('h3');
        const p = cards[index].querySelector('p');
        
        if (h3) h3.textContent = `${step.icon} ${step.title}`;
        if (p) p.textContent = step.text;
      }
    });
  }
}

// Apply social proof content
function applySocialProofContent(element, content) {
  if (content.heading) {
    const heading = element.querySelector('h2');
    if (heading) heading.textContent = content.heading;
  }
  
  if (content.stats && Array.isArray(content.stats)) {
    const cards = element.querySelectorAll('.card');
    content.stats.forEach((stat, index) => {
      if (cards[index]) {
        const h3 = cards[index].querySelector('h3');
        const p = cards[index].querySelector('p');
        
        if (h3) h3.textContent = stat.number;
        if (p) p.textContent = stat.label;
      }
    });
  }
}

// Apply testimonials content
function applyTestimonialsContent(element, content) {
  if (content.heading) {
    const heading = element.querySelector('h2');
    if (heading) heading.textContent = content.heading;
  }
  
  if (content.subtitle) {
    const subtitle = element.querySelector('p');
    if (subtitle) subtitle.textContent = content.subtitle;
  }
}

// Apply gallery content
function applyGalleryContent(element, content) {
  if (content.heading) {
    const heading = element.querySelector('h2');
    if (heading) heading.textContent = content.heading;
  }
  
  if (content.subtitle) {
    const subtitle = element.querySelector('p');
    if (subtitle) subtitle.textContent = content.subtitle;
  }
}

// Apply programs content
function applyProgramsContent(element, content) {
  if (content.heading) {
    const heading = element.querySelector('h2');
    if (heading) heading.textContent = content.heading;
  }
  
  if (content.subtitle) {
    const subtitle = element.querySelector('p');
    if (subtitle) subtitle.textContent = content.subtitle;
  }
}

// Apply FAQ content
function applyFaqContent(element, content) {
  if (content.heading) {
    const heading = element.querySelector('h2');
    if (heading) heading.textContent = content.heading;
  }
  
  if (content.subtitle) {
    const subtitle = element.querySelector('p');
    if (subtitle) subtitle.textContent = content.subtitle;
  }
}

// Apply lead form content
function applyLeadFormContent(element, content) {
  if (content.heading) {
    const heading = element.querySelector('h2');
    if (heading) heading.textContent = content.heading;
  }
  
  if (content.subtitle) {
    const subtitle = element.querySelector('p');
    if (subtitle) subtitle.textContent = content.subtitle;
  }
}

// Apply FAQ CTA content
function applyFaqCtaContent(element, content) {
  if (content.text) {
    const p = element.querySelector('p');
    if (p) p.textContent = content.text;
  }
  
  if (content.buttonText) {
    const button = element.querySelector('button');
    if (button) button.textContent = content.buttonText;
  }
}

// Apply footer about content
function applyFooterAboutContent(element, content) {
  if (content.heading) {
    const heading = element.querySelector('h3');
    if (heading) heading.textContent = content.heading;
  }
  
  if (content.text) {
    const p = element.querySelector('p');
    if (p) p.textContent = content.text;
  }
}

// Apply footer contacts content
function applyFooterContactsContent(element, content) {
  if (content.heading) {
    const heading = element.querySelector('h4');
    if (heading) heading.textContent = content.heading;
  }
  
  if (content.phone) {
    const phoneLink = element.querySelector('a[href^="tel:"]');
    if (phoneLink) phoneLink.textContent = content.phone;
  }
  
  if (content.email) {
    const emailLink = element.querySelector('a[href^="mailto:"]');
    if (emailLink) emailLink.textContent = content.email;
  }
  
  if (content.schedule) {
    const scheduleP = element.querySelector('p:nth-of-type(3)');
    if (scheduleP) {
      scheduleP.innerHTML = `<strong>Режим работы:</strong> ${content.schedule}`;
    }
  }
  
  if (content.buttonText) {
    const button = element.querySelector('button');
    if (button) button.textContent = content.buttonText;
  }
}

// Apply footer documents content
function applyFooterDocumentsContent(element, content) {
  if (content.heading) {
    const heading = element.querySelector('h4');
    if (heading) heading.textContent = content.heading;
  }
  
  if (content.links && Array.isArray(content.links)) {
    const linkPs = element.querySelectorAll('p');
    content.links.forEach((linkText, index) => {
      if (linkPs[index]) {
        const link = linkPs[index].querySelector('a');
        if (link) {
          link.textContent = linkText;
        }
      }
    });
  }
  
  // Handle copyright and company info in separate footer section
  if (content.copyright || content.companyInfo) {
    const copyrightSection = document.querySelector('.footer-copyright');
    if (copyrightSection) {
      const copyrightP = copyrightSection.querySelector('p:first-child');
      const companyInfoP = copyrightSection.querySelector('.footer-company-info');
      
      if (content.copyright && copyrightP) {
        copyrightP.textContent = content.copyright;
      }
      
      if (content.companyInfo && companyInfoP) {
        companyInfoP.textContent = content.companyInfo;
      }
    }
  }
}

// Handle pricing display in program cards
function handlePricingInPrograms() {
  const pricingSetting = sectionsSettings.pricing;
  
  // If pricing section is disabled, also hide pricing in program cards
  if (pricingSetting && pricingSetting.enabled === false) {
    // This will be handled by the existing programs.js logic
    // We just need to make sure the pricing section is hidden
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.style.display = 'none';
    }
  }
}

// Show all sections (fallback)
function showAllSections() {
  const sections = [
    '#problem-solution',
    '#programs',
    '.program-comparison-note',
    '#how-it-works',
    '#social-proof',
    '#testimonials',
    '#gallery',
    '#pricing',
    '#faq',
    '#faq .text-center.mt-xl',
    '#lead-form',
    '.footer-about',
    '.footer-contacts',
    '.footer-documents'
  ];

  sections.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      element.style.display = '';
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadSectionsSettings();
  
  // Set up periodic integrity check (every 30 seconds)
  setInterval(function() {
    if (Object.keys(sectionsSettings).length === 0) {
      console.warn('Blocks settings lost, attempting recovery...');
      loadSectionsSettings();
    }
  }, 30000);
});

// Re-apply settings when programs are loaded (for pricing integration)
document.addEventListener('programsLoaded', function() {
  if (Object.keys(sectionsSettings).length > 0) {
    applySectionsSettings();
  }
});