/**
 * Programs Module
 * Handles loading and rendering of program data from JSON
 */

let programsData = [];

// Format price
function formatPrice(price) {
  return price.toLocaleString('ru-RU') + ' ₽';
}

// Get program gradient
function getProgramGradient(programId) {
  const gradients = {
    'heroes': 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    'ancients': 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)'
  };
  return gradients[programId] || 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)';
}

// Get program icon
function getProgramIcon(programId) {
  const icons = {
    'heroes': '🏃‍♂️',
    'ancients': '🗿'
  };
  return icons[programId] || '🎉';
}

// Get button class
function getProgramButtonClass(programId) {
  return programId === 'heroes' ? 'btn-primary' : 'btn-secondary';
}

// Render program card
function renderProgramCard(program) {
  const gradient = getProgramGradient(program.id);
  const icon = getProgramIcon(program.id);
  const buttonClass = getProgramButtonClass(program.id);
  
  // Render features
  const featuresHtml = program.features.slice(0, 5).map(feature => `
    <div class="feature-item">
      <span class="feature-icon">${feature.icon}</span>
      <div>
        <strong>${feature.title}</strong>
        <p style="font-size: 14px; color: #666; margin-top: 4px;">${feature.description}</p>
      </div>
    </div>
  `).join('');

  // Basic info
  const basicInfoHtml = `
    <div class="program-features">
      <div class="feature-item">
        <span class="feature-icon">⏱️</span>
        <span><strong>Длительность:</strong> ${program.duration}</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">👥</span>
        <span><strong>Количество:</strong> ${program.pricing.minChildren}-${program.pricing.maxChildren} детей</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">🎯</span>
        <span><strong>Возраст:</strong> ${program.ageRange}</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">🌳</span>
        <span><strong>Формат:</strong> Выездное на природе</span>
      </div>
    </div>
  `;

  // Get image URL - use first image from array or fallback to gradient with icon
  const imageUrl = program.images && program.images.length > 0 ? program.images[0] : null;
  const imageStyle = imageUrl 
    ? `background-image: url('${imageUrl}'); background-size: cover; background-position: center;`
    : `background: ${gradient}; display: flex; align-items: center; justify-content: center; color: white; font-size: 48px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);`;
  
  return `
    <article class="program-card" data-program="${program.id}">
      <div class="program-image" style="${imageStyle}">
        ${imageUrl ? '' : icon}
      </div>
      <div class="program-content">
        <h3 class="program-title">${program.name}</h3>
        <p class="program-tagline">${program.tagline}</p>
        <p class="program-description">${program.description}</p>
        
        ${basicInfoHtml}
        
        <div class="program-features-detailed">
          <h4>Что входит в программу:</h4>
          ${featuresHtml}
        </div>
        
        <div class="program-pricing">
          ${program.pricing && program.pricing.basePrice ? `
          <div class="pricing-info">
            <p class="price-label">Стоимость программы</p>
            <p class="price-value">от ${formatPrice(program.pricing.basePrice)}</p>
            <p class="price-details">${program.pricing.perPerson ? `+ ${formatPrice(program.pricing.perPerson)} за человека` : ''}</p>
          </div>
          ` : ''}
          <button class="btn ${buttonClass} btn-full-width" onclick="selectProgram('${program.id}')">Выбрать программу</button>
        </div>
      </div>
    </article>
  `;
}

// Render programs
function renderPrograms() {
  const programsGrid = document.getElementById('programsGrid');
  if (!programsGrid) return;

  programsGrid.innerHTML = programsData.map(renderProgramCard).join('');
  
  // Hide/show pricing section based on settings and pricing data
  updatePricingSectionVisibility();
  
  // Align program features blocks after rendering
  setTimeout(alignProgramFeatures, 100);
}

// Align program features blocks to the same level
function alignProgramFeatures() {
  const programCards = document.querySelectorAll('.program-card');
  if (programCards.length < 2) return;
  
  // Check if programs are displayed in a single column (mobile)
  // If cards are stacked vertically, don't align them
  const firstCard = programCards[0];
  const secondCard = programCards[1];
  
  if (firstCard && secondCard) {
    const firstRect = firstCard.getBoundingClientRect();
    const secondRect = secondCard.getBoundingClientRect();
    
    // If the second card is below the first card (not side by side), 
    // it means we're in single column layout - don't align
    if (secondRect.top > firstRect.bottom - 50) {
      console.log('Single column layout detected - skipping alignment');
      // Reset any previous alignment
      programCards.forEach(card => {
        const features = card.querySelector('.program-features');
        if (features) {
          features.style.marginTop = 'var(--space-md)';
        }
      });
      return;
    }
  }
  
  console.log('Multi-column layout detected - aligning features');
  
  // Reset any previous alignment
  programCards.forEach(card => {
    const features = card.querySelector('.program-features');
    if (features) {
      features.style.marginTop = 'var(--space-md)';
    }
  });
  
  // Wait for layout to settle
  requestAnimationFrame(() => {
    const featuresBlocks = Array.from(programCards).map(card => {
      const features = card.querySelector('.program-features');
      if (features) {
        const rect = features.getBoundingClientRect();
        return {
          element: features,
          top: rect.top,
          card: card
        };
      }
      return null;
    }).filter(Boolean);
    
    if (featuresBlocks.length < 2) return;
    
    // Find the lowest position
    const maxTop = Math.max(...featuresBlocks.map(block => block.top));
    
    // Align all blocks to the lowest position
    featuresBlocks.forEach(block => {
      const diff = maxTop - block.top;
      if (diff > 0) {
        const currentMargin = parseInt(getComputedStyle(block.element).marginTop) || 24;
        block.element.style.marginTop = (currentMargin + diff) + 'px';
      }
    });
  });
}

// Update pricing section visibility
function updatePricingSectionVisibility() {
  const pricingSection = document.getElementById('pricing');
  if (!pricingSection) return;
  
  // Check if pricing is enabled in settings
  fetch('data/settings.json')
    .then(response => response.json())
    .then(settings => {
      const pricingEnabled = settings.sections?.pricing?.enabled !== false;
      const hasPricing = hasPricingData();
      
      // Show pricing section only if both enabled in settings AND has pricing data
      if (pricingEnabled && hasPricing) {
        pricingSection.style.display = 'block';
      } else {
        pricingSection.style.display = 'none';
      }
    })
    .catch(() => {
      // Fallback: show if has pricing data
      if (hasPricingData()) {
        pricingSection.style.display = 'block';
      } else {
        pricingSection.style.display = 'none';
      }
    });
}

// Load programs from JSON
async function loadPrograms() {
  try {
    const response = await fetch('data/programs.json');
    programsData = await response.json();
    renderPrograms();
    
    // Initialize pricing details after programs are loaded
    if (typeof initPricingDetails === 'function') {
      initPricingDetails();
    }
    
    // Update pricing tabs
    updatePricingTabs();
    
    // Dispatch event for blocks manager
    document.dispatchEvent(new CustomEvent('programsLoaded'));
  } catch (error) {
    console.error('Error loading programs:', error);
    // Fallback to empty state
    const programsGrid = document.getElementById('programsGrid');
    if (programsGrid) {
      programsGrid.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1 / -1;">Программы временно недоступны</p>';
    }
  }
}

// Pricing details functionality
let currentPricingProgram = 'heroes';

// Check if any program has pricing
function hasPricingData() {
  return programsData.some(program => 
    program.pricing && 
    program.pricing.basePrice && 
    program.pricing.basePrice > 0
  );
}

// Render pricing details
function renderPricingDetails(programId) {
  const program = programsData.find(p => p.id === programId);
  if (!program || !program.pricing || !program.pricing.basePrice) {
    return '<p style="text-align: center; color: #999; padding: 40px;">Информация о стоимости уточняется индивидуально</p>';
  }

  const includedHtml = program.pricing.included ? program.pricing.included.map(item => 
    `<li style="margin-bottom: 12px;">✓ ${item}</li>`
  ).join('') : '';

  const notIncludedHtml = program.pricing.notIncluded ? program.pricing.notIncluded.map(item => 
    `<li style="margin-bottom: 12px;">• ${item}</li>`
  ).join('') : '';

  return `
    <div class="programs-grid">
      ${includedHtml ? `
      <div class="card">
        <h3 class="mb-md" style="color: var(--color-success);">✅ Включено в ${formatPrice(program.pricing.basePrice)}</h3>
        <ul style="list-style: none; padding: 0;">
          ${includedHtml}
        </ul>
      </div>
      ` : ''}
      
      ${notIncludedHtml ? `
      <div class="card">
        <h3 class="mb-md" style="color: var(--color-warning);">💰 Дополнительно</h3>
        <ul style="list-style: none; padding: 0;">
          ${notIncludedHtml}
        </ul>
      </div>
      ` : ''}
    </div>
    
    <div class="card mt-md" style="background: var(--color-light);">
      <h4 class="mb-md">📍 Место проведения</h4>
      <p>${program.location}</p>
      <p style="margin-top: 8px;"><strong>Сезонность:</strong> ${program.season.join(', ')}</p>
    </div>
  `;
}

// Show pricing details for program
function showPricingDetails(programId) {
  currentPricingProgram = programId;
  
  // Update active tab
  document.querySelectorAll('.pricing-tabs button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-program') === programId) {
      btn.classList.add('active');
    }
  });
  
  // Render pricing details
  const pricingDetails = document.getElementById('pricingDetails');
  if (pricingDetails) {
    pricingDetails.innerHTML = renderPricingDetails(programId);
  }
}

// Update pricing tabs visibility
function updatePricingTabs() {
  const pricingTabs = document.querySelector('.pricing-tabs');
  if (!pricingTabs) return;
  
  // Hide tabs for programs without pricing
  const tabs = pricingTabs.querySelectorAll('button[data-program]');
  tabs.forEach(tab => {
    const programId = tab.getAttribute('data-program');
    const program = programsData.find(p => p.id === programId);
    
    if (program && program.pricing && program.pricing.basePrice) {
      tab.style.display = 'inline-block';
    } else {
      tab.style.display = 'none';
    }
  });
  
  // If no programs have pricing, hide the entire tabs container
  const visibleTabs = Array.from(tabs).filter(tab => tab.style.display !== 'none');
  if (visibleTabs.length === 0) {
    pricingTabs.style.display = 'none';
  } else {
    pricingTabs.style.display = 'flex';
  }
}

// Initialize pricing details after programs are loaded
function initPricingDetails() {
  // Wait for programs to load
  if (programsData.length === 0) {
    setTimeout(initPricingDetails, 100);
    return;
  }
  
  // Update tabs visibility
  updatePricingTabs();
  
  // Show pricing for first program that has pricing data
  const programWithPricing = programsData.find(p => p.pricing && p.pricing.basePrice);
  if (programWithPricing) {
    showPricingDetails(programWithPricing.id);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadPrograms();
});

// Re-align on window resize
let resizeTimeout;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(alignProgramFeatures, 250);
});
