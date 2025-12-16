/**
 * Адаптер для работы фронтенда с Google Apps Script
 * Заменяет вызовы к локальному серверу на GAS API
 */

// Конфигурация GAS
const GAS_CONFIG = {
  // Замените на URL вашего развернутого GAS веб-приложения
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxN_p54pB5ouyUkH83eibavJfxKuve4POEap_md_f2XSHa5UsVMQMUws_df89jrjN-gYg/exec',
  
  // Для разработки можно использовать локальный сервер
  USE_LOCAL_SERVER: false,
  LOCAL_SERVER_URL: 'http://localhost:8000'
};

/**
 * Универсальная функция для API вызовов
 */
async function apiCall(endpoint, options = {}) {
  const baseUrl = GAS_CONFIG.USE_LOCAL_SERVER ? GAS_CONFIG.LOCAL_SERVER_URL : GAS_CONFIG.GAS_URL;
  
  if (GAS_CONFIG.USE_LOCAL_SERVER) {
    // Локальный сервер - используем оригинальные эндпоинты
    const url = `${baseUrl}${endpoint}`;
    return fetch(url, options);
  } else {
    // Google Apps Script - адаптируем запросы
    return gasApiCall(endpoint, options);
  }
}

/**
 * Адаптированные вызовы для Google Apps Script
 * Использует JSONP для обхода CORS на GitHub Pages
 */
async function gasApiCall(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};
  
  // Определяем action на основе endpoint
  let action;
  let params = {};
  
  switch (endpoint) {
    case '/api/save-data':
      action = 'save-data';
      params = body;
      break;
      
    case '/api/get-backups':
      action = 'get-backups';
      break;
      
    case '/api/restore-backup':
      action = 'restore-backup';
      params = body;
      break;
      
    case '/api/upload-image':
      action = 'upload-image';
      // Для загрузки файлов нужна специальная обработка
      return uploadImageToGAS(options.body);
      
    case '/api/media':
      action = 'get-media';
      // Для GET запросов параметры могут быть в URL
      params = {};
      break;
      
    case '/api/submit-form':
      action = 'submit-form';
      params = body;
      break;
      
    case '/api/test-post':
      action = 'test-post';
      params = body;
      break;
      
    default:
      if (endpoint.startsWith('/api/media/')) {
        action = 'delete-media';
        const filename = endpoint.split('/').pop();
        params = { filename };
      } else {
        throw new Error(`Unknown endpoint: ${endpoint}`);
      }
  }
  
  // Используем JSONP для обхода CORS на GitHub Pages
  return gasJsonpRequest(action, params);
}

/**
 * JSONP запрос к Google Apps Script для обхода CORS
 */
function gasJsonpRequest(action, params = {}) {
  return new Promise((resolve, reject) => {
    // Создаем уникальное имя callback функции
    const callbackName = 'gasCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Создаем глобальную callback функцию
    window[callbackName] = function(data) {
      // Очищаем после использования
      delete window[callbackName];
      document.head.removeChild(script);
      
      // Эмулируем Response объект для совместимости
      resolve({
        ok: true,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data))
      });
    };
    
    // Формируем URL с параметрами
    const url = new URL(GAS_CONFIG.GAS_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('callback', callbackName);
    
    // Добавляем параметры в URL
    if (params && Object.keys(params).length > 0) {
      Object.keys(params).forEach(key => {
        if (typeof params[key] === 'object') {
          url.searchParams.set(key, JSON.stringify(params[key]));
        } else {
          url.searchParams.set(key, params[key]);
        }
      });
    }
    
    console.log('GAS JSONP request URL:', url.toString());
    
    // Создаем script тег для JSONP
    const script = document.createElement('script');
    script.src = url.toString();
    script.onerror = () => {
      delete window[callbackName];
      document.head.removeChild(script);
      reject(new Error('JSONP request failed'));
    };
    
    // Таймаут для запроса
    setTimeout(() => {
      if (window[callbackName]) {
        delete window[callbackName];
        document.head.removeChild(script);
        reject(new Error('JSONP request timeout'));
      }
    }, 30000); // 30 секунд таймаут
    
    document.head.appendChild(script);
  });
}

/**
 * Специальная функция для загрузки изображений в GAS
 */
async function uploadImageToGAS(formData) {
  // В GAS загрузка файлов работает по-другому
  // Нужно использовать HTML форму или конвертировать в base64
  
  const file = formData.get('image');
  if (!file) {
    throw new Error('No file selected');
  }
  
  // Конвертируем файл в base64
  const base64 = await fileToBase64(file);
  
  const params = {
    action: 'upload-image',
    filename: file.name,
    fileData: base64,
    mimeType: file.type,
    size: file.size
  };
  
  return fetch(GAS_CONFIG.GAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });
}

/**
 * Конвертация файла в base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Убираем префикс data:image/...;base64,
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Переопределяем функции в существующих скриптах
 */

// Для admin.html - функция сохранения данных
if (typeof saveJsonToServer !== 'undefined') {
  const originalSaveJsonToServer = saveJsonToServer;
  
  window.saveJsonToServer = async function(filename, data) {
    try {
      const response = await apiCall('/api/save-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: filename,
          content: JSON.stringify(data, null, 2)
        })
      });
      
      return response;
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  };
}

// Для admin.html - загрузка бэкапов
if (typeof loadBackups !== 'undefined') {
  const originalLoadBackups = loadBackups;
  
  window.loadBackups = async function() {
    try {
      const response = await apiCall('/api/get-backups');
      return response;
    } catch (error) {
      console.error('Load backups error:', error);
      throw error;
    }
  };
}

// Для admin.html - восстановление бэкапа
if (typeof restoreBackup !== 'undefined') {
  window.restoreBackup = async function(backupFilename) {
    try {
      const response = await apiCall('/api/restore-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backup_filename: backupFilename
        })
      });
      
      return response;
    } catch (error) {
      console.error('Restore backup error:', error);
      throw error;
    }
  };
}

// Для admin.html - загрузка медиа
if (typeof loadMedia !== 'undefined') {
  window.loadMedia = async function(params = {}) {
    try {
      let url = '/api/media';
      if (Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        url += '?' + searchParams.toString();
      }
      
      const response = await apiCall(url);
      return response;
    } catch (error) {
      console.error('Load media error:', error);
      throw error;
    }
  };
}

// Для form-validation.js - отправка формы
if (typeof submitForm !== 'undefined') {
  window.submitForm = async function(formData) {
    try {
      const response = await apiCall('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'submit-form',
          ...formData
        })
      });
      
      return response;
    } catch (error) {
      console.error('Submit form error:', error);
      throw error;
    }
  };
}

/**
 * Инициализация адаптера
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('GAS Frontend Adapter loaded');
  console.log('Using GAS URL:', GAS_CONFIG.GAS_URL);
  console.log('Local server mode:', GAS_CONFIG.USE_LOCAL_SERVER);
});

/**
 * Экспорт для использования в других скриптах
 */
window.GAS_API = {
  call: apiCall,
  config: GAS_CONFIG,
  uploadImage: uploadImageToGAS
};