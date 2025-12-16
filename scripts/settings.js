/**
 * Settings Module
 * Loads and applies site settings from settings.json
 */

async function loadSiteSettings() {
  try {
    const response = await fetch('data/settings.json');
    const settings = await response.json();
    
    if (settings.hero) {
      applyHeroSettings(settings.hero);
    }
  } catch (error) {
    console.log('Settings not found, using defaults');
  }
}

function applyHeroSettings(hero) {
  const heroSection = document.querySelector('.hero');
  if (!heroSection) return;
  
  // If background image is set
  if (hero.backgroundImage) {
    // Create or update background image element
    let bgElement = heroSection.querySelector('.hero-bg-image');
    if (!bgElement) {
      bgElement = document.createElement('div');
      bgElement.className = 'hero-bg-image';
      heroSection.insertBefore(bgElement, heroSection.firstChild);
    }
    
    // Apply background image with blur and overlay
    const blurAmount = hero.blurAmount || 5;
    const overlayOpacity = hero.overlayOpacity || 0.6;
    
    bgElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('${hero.backgroundImage}');
      background-size: cover;
      background-position: center;
      filter: blur(${blurAmount}px);
      z-index: 0;
    `;
    
    // Create or update overlay
    let overlayElement = heroSection.querySelector('.hero-bg-overlay');
    if (!overlayElement) {
      overlayElement = document.createElement('div');
      overlayElement.className = 'hero-bg-overlay';
      heroSection.insertBefore(overlayElement, bgElement.nextSibling);
    }
    
    overlayElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, ${overlayOpacity});
      z-index: 1;
    `;
    
    // Ensure content is above background
    const heroContent = heroSection.querySelector('.hero-content');
    if (heroContent) {
      heroContent.style.position = 'relative';
      heroContent.style.zIndex = '2';
    }
  }
}

// Load settings on page load
document.addEventListener('DOMContentLoaded', loadSiteSettings);
