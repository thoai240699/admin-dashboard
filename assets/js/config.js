const CONFIG = {
  API_BASE_URL: 'http://localhost:8080/ecommerce',
  TOKEN_KEY: 'admin_token',
  USER_KEY: 'admin_user',
};

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'admin_token',
  USER: 'admin_user',
  REFRESH_TOKEN: 'admin_refresh_token',
};

// Lấy URL đã lưu từ settings
function getApiBaseUrl() {
  return localStorage.getItem('apiBaseUrl') || CONFIG.API_BASE_URL;
}

// Cập nhật URL backend API
function setApiBaseUrl(url) {
  localStorage.setItem('apiBaseUrl', url);
  CONFIG.API_BASE_URL = url;
}
