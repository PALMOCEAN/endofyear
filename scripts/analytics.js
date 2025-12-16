/**
 * Yandex Metrika Analytics Module
 * Handles event tracking, goal conversions, scroll depth, and error logging
 */

/**
 * Configuration for Yandex Metrika
 * In production, load from config.json
 */
const YandexMetrikaConfig = {
  counterId: null,
  enabled: false,
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: true,
  ecommerce: 'dataLayer'
};

// Track if Metrika is initialized
let metrikaInitialized = false;

// Event queue for events triggered before initialization
let eventQueue = [];

// Scroll depth tracking state
let scrollDepthTracked = {
  '25': false,
  '50': false,
  '75': false,
  '100': false
};

/**
 * Load configuration from config.json
 */
async function loadAnalyticsConfig() {
  try {
    const response = await fetch('data/config.json');
    const config = await response.json();
    
    if (config.yandexMetrika) {
      Object.assign(YandexMetrikaConfig, config.yandexMetrika);
    }
  } catch (error) {
    console.warn('Could not load analytics config from file, using defaults');
  }
}

/**
 * Initialize Yandex Metrika counter
 */
function initYandexMetrika() {
  if (!YandexMetrikaConfig.enabled || !YandexMetrikaConfig.counterId) {
    console.warn('Yandex Metrika is disabled or counter ID not set');
    return;
  }
  
  // Check if ym function already exists
  if (typeof ym !== 'undefined') {
    console.log('Yandex Metrika already initialized');
    metrikaInitialized = true;
    processEventQueue();
    return;
  }
  
  // Create Yandex Metrika script
  (function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],
    k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
  
  // Initialize counter
  ym(YandexMetrikaConfig.counterId, "init", {
    clickmap: YandexMetrikaConfig.clickmap,
    trackLinks: YandexMetrikaConfig.trackLinks,
    accurateTrackBounce: YandexMetrikaConfig.accurateTrackBounce,
    webvisor: YandexMetrikaConfig.webvisor,
    ecommerce: YandexMetrikaConfig.ecommerce
  });
  
  metrikaInitialized = true;
  console.log('Yandex Metrika initialized with counter:', YandexMetrikaConfig.counterId);
  
  // Process queued events
  processEventQueue();
}

/**
 * Process queued events after initialization
 */
function processEventQueue() {
  if (eventQueue.length > 0) {
    console.log(`Processing ${eventQueue.length} queued analytics events`);
    eventQueue.forEach(event => {
      trackEvent(event.name, event.params);
    });
    eventQueue = [];
  }
}

/**
 * Track an event in Yandex Metrika
 */
function trackEvent(eventName, params = {}) {
  if (!YandexMetrikaConfig.enabled) {
    return;
  }
  
  // If not initialized yet, queue the event
  if (!metrikaInitialized) {
    eventQueue.push({ name: eventName, params: params });
    return;
  }
  
  // Check if ym function exists
  if (typeof ym === 'undefined') {
    console.warn('Yandex Metrika not loaded, event not tracked:', eventName);
    return;
  }
  
  try {
    // Track event with parameters
    ym(YandexMetrikaConfig.counterId, 'reachGoal', eventName, params);
    console.log('Analytics event tracked:', eventName, params);
  } catch (error) {
    console.error('Error tracking analytics event:', error);
  }
}

/**
 * Track page view
 */
function trackPageView() {
  trackEvent('page_view', {
    url: window.location.href,
    title: document.title
  });
}

/**
 * Track CTA button click
 */
function trackCTAClick(location, programId = null) {
  const params = {
    location: location
  };
  
  if (programId) {
    params.program = programId;
  }
  
  trackEvent('cta_click', params);
}

/**
 * Track form start (when user begins filling the form)
 */
function trackFormStart() {
  trackEvent('form_start', {
    timestamp: new Date().toISOString()
  });
}

/**
 * Track form submission attempt
 */
function trackFormSubmit(formData) {
  trackEvent('form_submit', {
    program: formData.program,
    hasChildrenCount: !!formData.childrenCount,
    hasComment: !!formData.comment
  });
}

/**
 * Track successful form submission (GOAL)
 */
function trackFormSuccess(formData, result) {
  const params = {
    program: formData.program,
    method: result.method || 'unknown',
    timestamp: new Date().toISOString()
  };
  
  // Add device info
  const deviceInfo = getDeviceType();
  params.device = deviceInfo;
  
  // Add traffic source
  const source = getTrafficSource();
  params.source = source;
  
  trackEvent('form_success', params);
}

/**
 * Track form submission error
 */
function trackFormError(formData, error) {
  trackEvent('form_error', {
    program: formData.program,
    error: error.message || 'Unknown error',
    timestamp: new Date().toISOString()
  });
}

/**
 * Track phone click
 */
function trackPhoneClick(phoneNumber) {
  trackEvent('phone_click', {
    phone: phoneNumber
  });
}

/**
 * Track messenger click
 */
function trackMessengerClick(messenger) {
  trackEvent('messenger_click', {
    messenger: messenger // 'whatsapp' or 'telegram'
  });
}

/**
 * Track gallery open
 */
function trackGalleryOpen(imageId, program) {
  trackEvent('gallery_open', {
    imageId: imageId,
    program: program
  });
}

/**
 * Track FAQ item open
 */
function trackFAQOpen(questionId, category) {
  trackEvent('faq_open', {
    questionId: questionId,
    category: category
  });
}

/**
 * Track scroll depth
 */
function trackScrollDepth(percentage) {
  const key = String(percentage);
  
  // Only track each milestone once
  if (scrollDepthTracked[key]) {
    return;
  }
  
  scrollDepthTracked[key] = true;
  
  trackEvent('scroll_depth', {
    percentage: percentage
  });
}

/**
 * Log error to Yandex Metrika
 */
function logError(error, context = {}) {
  const errorData = {
    message: error.message || String(error),
    stack: error.stack || '',
    context: context,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  trackEvent('error', errorData);
}

/**
 * Get device type
 */
function getDeviceType() {
  const ua = navigator.userAgent;
  
  if (/mobile/i.test(ua)) {
    return 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    return 'tablet';
  }
  
  return 'desktop';
}

/**
 * Get traffic source from UTM parameters or referrer
 */
function getTrafficSource() {
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  
  if (utmSource) {
    return utmSource;
  }
  
  const referrer = document.referrer;
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      return referrerUrl.hostname;
    } catch (e) {
      return 'unknown';
    }
  }
  
  return 'direct';
}

/**
 * Setup scroll depth tracking
 */
function setupScrollDepthTracking() {
  let ticking = false;
  
  function checkScrollDepth() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    const scrollPercentage = ((scrollTop + windowHeight) / documentHeight) * 100;
    
    // Check milestones
    if (scrollPercentage >= 25 && !scrollDepthTracked['25']) {
      trackScrollDepth(25);
    }
    if (scrollPercentage >= 50 && !scrollDepthTracked['50']) {
      trackScrollDepth(50);
    }
    if (scrollPercentage >= 75 && !scrollDepthTracked['75']) {
      trackScrollDepth(75);
    }
    if (scrollPercentage >= 100 && !scrollDepthTracked['100']) {
      trackScrollDepth(100);
    }
    
    ticking = false;
  }
  
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(checkScrollDepth);
      ticking = true;
    }
  });
  
  // Check initial scroll position
  checkScrollDepth();
}

/**
 * Setup CTA button tracking
 */
function setupCTATracking() {
  // Track all buttons with onclick="scrollToForm()"
  document.querySelectorAll('button[onclick*="scrollToForm"]').forEach(button => {
    button.addEventListener('click', function() {
      const section = this.closest('section');
      const sectionId = section ? section.id : 'unknown';
      trackCTAClick(sectionId);
    });
  });
  
  // Track program selection buttons
  document.querySelectorAll('button[onclick*="selectProgram"]').forEach(button => {
    button.addEventListener('click', function() {
      const programCard = this.closest('.program-card');
      const programId = programCard ? programCard.getAttribute('data-program') : null;
      trackCTAClick('program-card', programId);
    });
  });
}

/**
 * Setup phone link tracking
 */
function setupPhoneTracking() {
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', function(e) {
      const phoneNumber = this.getAttribute('href').replace('tel:', '');
      trackPhoneClick(phoneNumber);
    });
  });
}

/**
 * Setup messenger link tracking
 */
function setupMessengerTracking() {
  // WhatsApp links
  document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach(link => {
    link.addEventListener('click', function() {
      trackMessengerClick('whatsapp');
    });
  });
  
  // Telegram links
  document.querySelectorAll('a[href*="t.me"], a[href*="telegram"]').forEach(link => {
    link.addEventListener('click', function() {
      trackMessengerClick('telegram');
    });
  });
}

/**
 * Setup form tracking
 */
function setupFormTracking() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  
  let formStartTracked = false;
  
  // Track form start when user begins typing
  const formInputs = form.querySelectorAll('input, select, textarea');
  formInputs.forEach(input => {
    input.addEventListener('focus', function() {
      if (!formStartTracked) {
        trackFormStart();
        formStartTracked = true;
      }
    });
  });
}

/**
 * Setup gallery tracking
 */
function setupGalleryTracking() {
  // This will be called after gallery is rendered
  // We'll use event delegation on the gallery grid
  const galleryGrid = document.getElementById('galleryGrid');
  if (!galleryGrid) return;
  
  galleryGrid.addEventListener('click', function(e) {
    const galleryItem = e.target.closest('.gallery-item');
    if (galleryItem) {
      const img = galleryItem.querySelector('img');
      const program = galleryItem.getAttribute('data-program');
      const imageId = img ? img.alt : 'unknown';
      
      trackGalleryOpen(imageId, program);
    }
  });
}

/**
 * Setup FAQ tracking
 */
function setupFAQTracking() {
  document.querySelectorAll('.faq-question').forEach((button, index) => {
    button.addEventListener('click', function() {
      const questionText = this.querySelector('span:first-child').textContent;
      const questionId = `faq-${index + 1}`;
      
      // Try to determine category from question text
      let category = 'general';
      if (questionText.includes('погода')) category = 'weather';
      else if (questionText.includes('безопас')) category = 'safety';
      else if (questionText.includes('оплат')) category = 'payment';
      else if (questionText.includes('родител')) category = 'organization';
      
      trackFAQOpen(questionId, category);
    });
  });
}

/**
 * Setup global error tracking
 */
function setupErrorTracking() {
  // Track JavaScript errors
  window.addEventListener('error', function(event) {
    logError(event.error || new Error(event.message), {
      type: 'javascript_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    logError(new Error(event.reason), {
      type: 'unhandled_rejection'
    });
  });
}

/**
 * Export functions for use by form validation module
 */
window.logFormSuccess = trackFormSuccess;
window.logFormError = trackFormError;

/**
 * Initialize analytics module
 */
async function initAnalytics() {
  // Load configuration
  await loadAnalyticsConfig();
  
  // Initialize Yandex Metrika
  initYandexMetrika();
  
  // Track initial page view
  trackPageView();
  
  // Setup event tracking
  setupScrollDepthTracking();
  setupCTATracking();
  setupPhoneTracking();
  setupMessengerTracking();
  setupFormTracking();
  setupGalleryTracking();
  setupFAQTracking();
  setupErrorTracking();
  
  console.log('Analytics module initialized');
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalytics);
} else {
  initAnalytics();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    trackEvent,
    trackPageView,
    trackCTAClick,
    trackFormStart,
    trackFormSubmit,
    trackFormSuccess,
    trackFormError,
    trackPhoneClick,
    trackMessengerClick,
    trackGalleryOpen,
    trackFAQOpen,
    trackScrollDepth,
    logError,
    YandexMetrikaConfig
  };
}
