/**
 * Lead Form Validation Module
 * Handles real-time validation, phone masking, and form states
 */

// Form states
const FormState = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Current form state
let currentFormState = FormState.IDLE;

// Validation rules
const ValidationRules = {
  name: {
    minLength: 2,
    pattern: /^[а-яА-ЯёЁa-zA-Z\s-]+$/,
    message: 'Имя должно содержать минимум 2 символа и только буквы'
  },
  phone: {
    pattern: /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
    message: 'Введите полный номер телефона в формате +7 (999) 123-45-67'
  },
  program: {
    required: true,
    message: 'Выберите программу'
  }
};

/**
 * Format phone number with mask +7 (XXX) XXX-XX-XX
 */
function formatPhoneNumber(value) {
  // Remove all non-digit characters
  let digits = value.replace(/\D/g, '');
  
  // Handle different input formats
  if (digits.length > 0) {
    // If starts with 8, replace with 7
    if (digits[0] === '8') {
      digits = '7' + digits.substring(1);
    }
    // If doesn't start with 7, add 7 at the beginning
    else if (digits[0] !== '7') {
      digits = '7' + digits;
    }
  }
  
  // Limit to 11 digits (7 + 10 digits)
  digits = digits.substring(0, 11);
  
  // Format the number progressively
  let formatted = '';
  
  if (digits.length >= 1) {
    formatted = '+7';
  }
  if (digits.length >= 2) {
    formatted += ' (' + digits.substring(1, Math.min(4, digits.length));
  }
  if (digits.length >= 5) {
    formatted += ') ' + digits.substring(4, Math.min(7, digits.length));
  }
  if (digits.length >= 8) {
    formatted += '-' + digits.substring(7, Math.min(9, digits.length));
  }
  if (digits.length >= 10) {
    formatted += '-' + digits.substring(9, 11);
  }
  
  return formatted;
}

/**
 * Validate a single field
 */
function validateField(fieldName, value) {
  const rules = ValidationRules[fieldName];
  if (!rules) return { valid: true };
  
  // Check required
  if (rules.required && !value) {
    return { valid: false, message: rules.message };
  }
  
  // Check minLength
  if (rules.minLength && value.length < rules.minLength) {
    return { valid: false, message: rules.message };
  }
  
  // Check pattern
  if (rules.pattern && !rules.pattern.test(value)) {
    return { valid: false, message: rules.message };
  }
  
  return { valid: true };
}

/**
 * Show error message for a field
 */
function showFieldError(fieldName, message) {
  const errorElement = document.getElementById(`${fieldName}-error`);
  const inputElement = document.getElementById(fieldName);
  
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  if (inputElement) {
    inputElement.classList.add('error');
    inputElement.setAttribute('aria-invalid', 'true');
  }
}

/**
 * Clear error message for a field
 */
function clearFieldError(fieldName) {
  const errorElement = document.getElementById(`${fieldName}-error`);
  const inputElement = document.getElementById(fieldName);
  
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  
  if (inputElement) {
    inputElement.classList.remove('error');
    inputElement.removeAttribute('aria-invalid');
  }
}

/**
 * Set form state and update UI
 */
function setFormState(state) {
  currentFormState = state;
  const form = document.getElementById('contactForm');
  const submitButton = form?.querySelector('button[type="submit"]');
  
  if (!form || !submitButton) return;
  
  // Remove all state classes
  form.classList.remove('form-idle', 'form-validating', 'form-submitting', 'form-success', 'form-error');
  
  // Add current state class
  form.classList.add(`form-${state}`);
  
  // Update submit button
  switch (state) {
    case FormState.VALIDATING:
      submitButton.disabled = true;
      submitButton.textContent = 'Проверка...';
      break;
    case FormState.SUBMITTING:
      submitButton.disabled = true;
      submitButton.textContent = 'Отправка...';
      break;
    case FormState.SUCCESS:
      submitButton.disabled = true;
      submitButton.textContent = '✓ Отправлено';
      submitButton.style.backgroundColor = 'var(--color-success)';
      break;
    case FormState.ERROR:
      submitButton.disabled = false;
      submitButton.textContent = 'Попробовать снова';
      submitButton.style.backgroundColor = 'var(--color-error)';
      break;
    default:
      submitButton.disabled = false;
      submitButton.textContent = 'Отправить заявку';
      submitButton.style.backgroundColor = '';
  }
}

/**
 * Initialize phone input with mask
 */
function initPhoneMask() {
  const phoneInput = document.getElementById('phone');
  if (!phoneInput) return;
  
  let isFormatting = false;
  
  phoneInput.addEventListener('input', function(e) {
    if (isFormatting) return;
    
    isFormatting = true;
    
    const cursorPosition = e.target.selectionStart;
    const oldValue = e.target.value;
    const oldLength = oldValue.length;
    
    // Get only digits from current value
    const digits = oldValue.replace(/\D/g, '');
    
    // Format the number
    const newValue = formatPhoneNumber(oldValue);
    const newLength = newValue.length;
    
    // Update input value
    e.target.value = newValue;
    
    // Calculate new cursor position
    let newCursorPosition = cursorPosition;
    
    // If we're adding characters (formatting), move cursor forward
    if (newLength > oldLength) {
      newCursorPosition = cursorPosition + (newLength - oldLength);
    }
    // If we're removing characters, keep cursor in place or move back
    else if (newLength < oldLength) {
      newCursorPosition = Math.max(4, cursorPosition - (oldLength - newLength));
    }
    
    // Don't let cursor go before "+7 ("
    newCursorPosition = Math.max(4, newCursorPosition);
    
    // Set cursor position
    setTimeout(() => {
      e.target.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
    
    isFormatting = false;
  });
  
  // Handle keydown for better UX
  phoneInput.addEventListener('keydown', function(e) {
    const cursorPosition = e.target.selectionStart;
    
    // Don't allow deletion of "+7 (" prefix
    if ((e.key === 'Backspace' || e.key === 'Delete') && cursorPosition <= 4) {
      e.preventDefault();
      return;
    }
    
    // Allow only digits, backspace, delete, arrow keys, tab
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 
      'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Escape'
    ];
    
    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  });
  
  // Set initial value on focus
  phoneInput.addEventListener('focus', function(e) {
    if (!e.target.value || e.target.value === '') {
      e.target.value = '+7 (';
      setTimeout(() => {
        e.target.setSelectionRange(4, 4); // Позиция после "+7 ("
      }, 0);
    } else {
      // Если поле уже заполнено, но курсор в неправильном месте
      setTimeout(() => {
        const currentPosition = e.target.selectionStart;
        if (currentPosition < 4) {
          e.target.setSelectionRange(4, 4); // Минимальная позиция после "+7 ("
        }
      }, 0);
    }
  });
  
  // Handle click events to ensure proper cursor positioning
  phoneInput.addEventListener('click', function(e) {
    setTimeout(() => {
      const currentPosition = e.target.selectionStart;
      const value = e.target.value;
      
      // If clicked before "+7 (", move cursor after it
      if (currentPosition < 4 && value.startsWith('+7 (')) {
        e.target.setSelectionRange(4, 4);
      }
    }, 0);
  });
  
  // Clean up on blur
  phoneInput.addEventListener('blur', function(e) {
    const value = e.target.value;
    
    // If only prefix remains, clear the field
    if (value === '+7 (' || value === '+7' || value === '+') {
      e.target.value = '';
    }
    // If incomplete number, show error
    else if (value && !ValidationRules.phone.pattern.test(value)) {
      // Let validation handle this
    }
  });
  
  // Handle paste events
  phoneInput.addEventListener('paste', function(e) {
    e.preventDefault();
    
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const digits = pastedText.replace(/\D/g, '');
    
    if (digits) {
      const formatted = formatPhoneNumber(digits);
      e.target.value = formatted;
      
      // Trigger input event for validation
      e.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

/**
 * Initialize real-time validation
 */
function initRealtimeValidation() {
  const fields = ['name', 'phone', 'program'];
  
  fields.forEach(fieldName => {
    const input = document.getElementById(fieldName);
    if (!input) return;
    
    // Validate on blur
    input.addEventListener('blur', function(e) {
      const value = e.target.value.trim();
      const validation = validateField(fieldName, value);
      
      if (!validation.valid) {
        showFieldError(fieldName, validation.message);
      } else {
        clearFieldError(fieldName);
      }
    });
    
    // Clear error on input
    input.addEventListener('input', function() {
      if (input.classList.contains('error')) {
        clearFieldError(fieldName);
      }
    });
  });
}

/**
 * Validate entire form
 */
function validateForm(formData) {
  const errors = {};
  
  // Validate name
  const nameValidation = validateField('name', formData.name);
  if (!nameValidation.valid) {
    errors.name = nameValidation.message;
  }
  
  // Validate phone
  const phoneValidation = validateField('phone', formData.phone);
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.message;
  }
  
  // Validate program
  const programValidation = validateField('program', formData.program);
  if (!programValidation.valid) {
    errors.program = programValidation.message;
  }
  
  return errors;
}

/**
 * Display form errors
 */
function displayFormErrors(errors) {
  Object.keys(errors).forEach(fieldName => {
    showFieldError(fieldName, errors[fieldName]);
  });
  
  // Focus on first error field
  const firstErrorField = Object.keys(errors)[0];
  const firstErrorInput = document.getElementById(firstErrorField);
  if (firstErrorInput) {
    firstErrorInput.focus();
  }
}

/**
 * Clear all form errors
 */
function clearAllErrors() {
  ['name', 'phone', 'program'].forEach(fieldName => {
    clearFieldError(fieldName);
  });
}

/**
 * Show success message
 */
function showSuccessMessage(message, warning) {
  const form = document.getElementById('contactForm');
  if (!form) return;
  
  const defaultMessage = message || 'Заявка успешно отправлена!';
  const warningHtml = warning ? `<p style="margin-top: var(--space-sm); font-size: 14px; opacity: 0.9;">⚠️ ${warning}</p>` : '';
  
  // Create success message element
  const successDiv = document.createElement('div');
  successDiv.className = 'form-success-message';
  successDiv.innerHTML = `
    <div style="text-align: center; padding: var(--space-lg); background: var(--color-success); color: white; border-radius: var(--radius-md); margin-top: var(--space-md);">
      <h3 style="margin-bottom: var(--space-sm); color: white;">✓ ${defaultMessage}</h3>
      <p style="margin: 0;">Мы свяжемся с вами в течение 15 минут</p>
      ${warningHtml}
    </div>
  `;
  
  form.appendChild(successDiv);
  
  // Scroll to success message
  successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  
  // Clear previous errors and success messages
  clearAllErrors();
  const existingSuccess = document.querySelector('.form-success-message');
  if (existingSuccess) {
    existingSuccess.remove();
  }
  
  // Set validating state
  setFormState(FormState.VALIDATING);
  
  // Get form data
  const formData = {
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    program: document.getElementById('program').value,
    childrenCount: document.getElementById('children-count').value,
    comment: document.getElementById('comment').value.trim()
  };
  
  // Validate form
  const errors = validateForm(formData);
  
  if (Object.keys(errors).length > 0) {
    setFormState(FormState.ERROR);
    displayFormErrors(errors);
    return;
  }
  
  // Set submitting state
  setFormState(FormState.SUBMITTING);
  
  try {
    // Send to GAS backend first, then try Bitrix24
    let result;
    
    // Try GAS backend first
    if (window.GAS_API) {
      try {
        const gasResponse = await window.GAS_API.call('/api/submit-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const gasData = await gasResponse.json();
        
        if (gasData.success) {
          result = {
            success: true,
            method: 'gas',
            message: 'Заявка успешно отправлена!'
          };
        } else {
          throw new Error(gasData.error || 'Ошибка GAS');
        }
      } catch (gasError) {
        console.warn('GAS submission failed:', gasError);
        
        // Fallback to Bitrix24 if GAS fails
        if (typeof createLead === 'function') {
          result = await createLead(formData);
        } else {
          throw gasError;
        }
      }
    } else if (typeof createLead === 'function') {
      // Use Bitrix24 if GAS not available
      result = await createLead(formData);
    } else {
      // Final fallback - mock submission
      console.warn('Neither GAS nor Bitrix24 available, using mock submission');
      await new Promise(resolve => setTimeout(resolve, 1500));
      result = {
        success: true,
        method: 'mock',
        message: 'Заявка отправлена (тестовый режим)'
      };
    }
    
    if (result.success) {
      // Success
      setFormState(FormState.SUCCESS);
      showSuccessMessage(result.message, result.warning);
      
      // Log success event (will be used by analytics module)
      if (typeof logFormSuccess === 'function') {
        logFormSuccess(formData, result);
      }
      
      // Reset form after delay
      setTimeout(() => {
        event.target.reset();
        setFormState(FormState.IDLE);
        const successMsg = document.querySelector('.form-success-message');
        if (successMsg) {
          successMsg.remove();
        }
      }, 5000);
    } else {
      throw new Error(result.message || 'Ошибка отправки');
    }
    
  } catch (error) {
    // Error handling
    console.error('Form submission error:', error);
    setFormState(FormState.ERROR);
    
    // Log error event (will be used by analytics module)
    if (typeof logFormError === 'function') {
      logFormError(formData, error);
    }
    
    showFieldError('phone', error.message || 'Произошла ошибка при отправке. Попробуйте позже или позвоните нам.');
  }
}

/**
 * Initialize form validation
 */
function initFormValidation() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  
  // Initialize phone mask
  initPhoneMask();
  
  // Initialize real-time validation
  initRealtimeValidation();
  
  // Handle form submission
  form.addEventListener('submit', handleFormSubmit);
  
  // Set initial state
  setFormState(FormState.IDLE);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFormValidation);
} else {
  initFormValidation();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initFormValidation,
    validateField,
    validateForm,
    formatPhoneNumber,
    FormState
  };
}
