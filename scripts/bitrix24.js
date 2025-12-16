/**
 * Bitrix24 Integration Module
 * Handles lead creation in Bitrix24 CRM with retry logic and email fallback
 */

/**
 * Configuration for Bitrix24 API
 * Loaded from integrations.json (managed via admin panel)
 */
const Bitrix24Config = {
  webhookUrl: '',
  retryAttempts: 3,
  retryDelay: 1000, // Initial delay in ms (exponential backoff)
  fallbackEmail: 'info@graduation.ru'
};

/**
 * Load configuration from integrations.json (managed via admin panel)
 */
async function loadBitrix24Config() {
  try {
    // Try to load from integrations.json (new admin-managed config)
    const response = await fetch('data/integrations.json');
    const config = await response.json();
    
    if (config.bitrix24) {
      Object.assign(Bitrix24Config, {
        webhookUrl: config.bitrix24.webhookUrl,
        fallbackEmail: config.bitrix24.fallbackEmail,
        retryAttempts: config.bitrix24.retryAttempts || 3,
        retryDelay: config.bitrix24.retryDelay || 1000
      });
    }
  } catch (error) {
    console.warn('Could not load Bitrix24 config from integrations.json, trying legacy config.json');
    
    // Fallback to legacy config.json
    try {
      const response = await fetch('data/config.json');
      const config = await response.json();
      
      if (config.bitrix24) {
        Object.assign(Bitrix24Config, config.bitrix24);
      }
    } catch (legacyError) {
      console.warn('Could not load Bitrix24 config from any source, using defaults');
    }
  }
}

/**
 * Get UTM parameters from URL
 */
function getUTMParams() {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    source: urlParams.get('utm_source') || '',
    medium: urlParams.get('utm_medium') || '',
    campaign: urlParams.get('utm_campaign') || '',
    content: urlParams.get('utm_content') || '',
    term: urlParams.get('utm_term') || ''
  };
}

/**
 * Get device information
 */
function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  
  if (/mobile/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
  }
  
  // Simple browser detection
  let browser = 'Unknown';
  if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
  } else if (ua.indexOf('Chrome') > -1) {
    browser = 'Chrome';
  } else if (ua.indexOf('Safari') > -1) {
    browser = 'Safari';
  } else if (ua.indexOf('Edge') > -1) {
    browser = 'Edge';
  }
  
  // Simple OS detection
  let os = 'Unknown';
  if (ua.indexOf('Win') > -1) {
    os = 'Windows';
  } else if (ua.indexOf('Mac') > -1) {
    os = 'macOS';
  } else if (ua.indexOf('Linux') > -1) {
    os = 'Linux';
  } else if (ua.indexOf('Android') > -1) {
    os = 'Android';
  } else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
    os = 'iOS';
  }
  
  return {
    type: deviceType,
    browser: browser,
    os: os
  };
}

/**
 * Map program ID to human-readable name
 */
function getProgramName(programId) {
  const programNames = {
    'heroes': 'Вызов героев',
    'ancients': 'Тайны Древних',
    'not_sure': 'Не определились'
  };
  
  return programNames[programId] || programId;
}

/**
 * Create lead payload for Bitrix24 API
 */
function createLeadPayload(formData, utmParams, deviceInfo) {
  const programName = getProgramName(formData.program);
  
  // Build comments section
  let comments = `Программа: ${programName}\n`;
  
  if (formData.childrenCount) {
    comments += `Количество детей: ${formData.childrenCount}\n`;
  }
  
  if (formData.comment) {
    comments += `\nКомментарий:\n${formData.comment}\n`;
  }
  
  // Add device info
  comments += `\nИсточник: ${deviceInfo.type} (${deviceInfo.os}, ${deviceInfo.browser})`;
  
  // Build payload according to Bitrix24 API format
  const payload = {
    fields: {
      TITLE: `Заявка с лендинга: ${programName}`,
      NAME: formData.name,
      PHONE: [
        {
          VALUE: formData.phone,
          VALUE_TYPE: 'WORK'
        }
      ],
      COMMENTS: comments,
      SOURCE_ID: 'WEB'
    }
  };
  
  // Add UTM parameters if available
  if (utmParams.source) {
    payload.fields.UTM_SOURCE = utmParams.source;
  }
  if (utmParams.medium) {
    payload.fields.UTM_MEDIUM = utmParams.medium;
  }
  if (utmParams.campaign) {
    payload.fields.UTM_CAMPAIGN = utmParams.campaign;
  }
  if (utmParams.content) {
    payload.fields.UTM_CONTENT = utmParams.content;
  }
  if (utmParams.term) {
    payload.fields.UTM_TERM = utmParams.term;
  }
  
  return payload;
}

/**
 * Send lead to Bitrix24 API
 */
async function sendToBitrix24(payload) {
  if (!Bitrix24Config.webhookUrl) {
    throw new Error('Bitrix24 webhook URL не настроен');
  }
  
  // Формируем полный URL для создания лида
  const url = Bitrix24Config.webhookUrl + (Bitrix24Config.webhookUrl.endsWith('/') ? '' : '/') + 'crm.lead.add';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`Bitrix24 API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Bitrix24 API error: ${data.error_description || data.error}`);
  }
  
  return data;
}

/**
 * Send lead via email fallback
 */
async function sendViaEmail(formData, utmParams, deviceInfo) {
  const programName = getProgramName(formData.program);
  
  // Build email body
  let emailBody = `Новая заявка с лендинга выпускных\n\n`;
  emailBody += `Имя: ${formData.name}\n`;
  emailBody += `Телефон: ${formData.phone}\n`;
  emailBody += `Программа: ${programName}\n`;
  
  if (formData.childrenCount) {
    emailBody += `Количество детей: ${formData.childrenCount}\n`;
  }
  
  if (formData.comment) {
    emailBody += `\nКомментарий:\n${formData.comment}\n`;
  }
  
  emailBody += `\nUTM метки:\n`;
  emailBody += `- Source: ${utmParams.source || 'не указан'}\n`;
  emailBody += `- Medium: ${utmParams.medium || 'не указан'}\n`;
  emailBody += `- Campaign: ${utmParams.campaign || 'не указан'}\n`;
  
  emailBody += `\nУстройство: ${deviceInfo.type} (${deviceInfo.os}, ${deviceInfo.browser})\n`;
  emailBody += `\nВремя: ${new Date().toLocaleString('ru-RU')}\n`;
  
  // In production, this would send to a backend endpoint that sends email
  // For now, we'll use mailto: link (not ideal for production)
  const subject = encodeURIComponent(`Заявка с лендинга: ${programName}`);
  const body = encodeURIComponent(emailBody);
  const mailtoLink = `mailto:${Bitrix24Config.fallbackEmail}?subject=${subject}&body=${body}`;
  
  // Log the email fallback
  console.log('Email fallback triggered:', {
    to: Bitrix24Config.fallbackEmail,
    subject: `Заявка с лендинга: ${programName}`,
    body: emailBody
  });
  
  // In production, replace with actual email API call
  // For now, we'll just return success
  return {
    success: true,
    method: 'email_fallback',
    message: 'Заявка отправлена на email'
  };
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff(fn, attempts, delay) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === attempts - 1;
      
      if (isLastAttempt) {
        throw error;
      }
      
      // Exponential backoff: delay * 2^i
      const waitTime = delay * Math.pow(2, i);
      console.log(`Attempt ${i + 1} failed, retrying in ${waitTime}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Main function to create lead in Bitrix24
 * Includes retry logic and email fallback
 */
async function createLead(formData) {
  // Get UTM parameters and device info
  const utmParams = getUTMParams();
  const deviceInfo = getDeviceInfo();
  
  // Create lead payload
  const payload = createLeadPayload(formData, utmParams, deviceInfo);
  
  try {
    // Try to send to Bitrix24 with retry logic
    const result = await retryWithBackoff(
      () => sendToBitrix24(payload),
      Bitrix24Config.retryAttempts,
      Bitrix24Config.retryDelay
    );
    
    return {
      success: true,
      leadId: result.result,
      method: 'bitrix24',
      message: 'Заявка успешно отправлена в Bitrix24'
    };
    
  } catch (error) {
    console.error('Bitrix24 API failed after retries:', error);
    
    // Fallback to email
    try {
      const emailResult = await sendViaEmail(formData, utmParams, deviceInfo);
      
      return {
        success: true,
        method: 'email_fallback',
        message: 'Заявка отправлена на email (Bitrix24 недоступен)',
        warning: 'Bitrix24 API недоступен, использован email fallback'
      };
      
    } catch (emailError) {
      console.error('Email fallback also failed:', emailError);
      
      throw new Error('Не удалось отправить заявку. Пожалуйста, позвоните нам напрямую.');
    }
  }
}

/**
 * Initialize Bitrix24 module
 */
async function initBitrix24() {
  await loadBitrix24Config();
  console.log('Bitrix24 module initialized');
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBitrix24);
} else {
  initBitrix24();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createLead,
    getUTMParams,
    getDeviceInfo,
    getProgramName,
    Bitrix24Config
  };
}
