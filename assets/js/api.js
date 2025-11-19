class API {
  /**
   * Lấy JWT token từ localStorage
   *
   * @returns {string|null} JWT token hoặc null nếu chưa login
   *
   * Flow:
   * 1. Truy cập localStorage với key được định nghĩa trong CONFIG.TOKEN_KEY
   * 2. Trả về token string hoặc null
   *
   * Sử dụng: const token = API.getToken();
   */
  static getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  }

  /**
   * Lưu JWT token vào localStorage sau khi login thành công
   *
   * @param {string} token - JWT token nhận được từ backend
   *
   * Flow:
   * 1. Lưu token vào localStorage
   * 2. Token này sẽ được gửi kèm trong header của mọi API request
   *
   * Sử dụng: API.setToken('eyJhbGciOiJIUzI1NiIs...');
   */
  static setToken(token) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
  }

  /**
   * Xóa token và thông tin user khi logout
   *
   * Flow:
   * 1. Xóa JWT token từ localStorage
   * 2. Xóa thông tin user từ localStorage
   * 3. User sẽ bị redirect về login page
   *
   * Sử dụng: API.removeToken();
   */
  static removeToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  }

  /**
   * Tạo HTTP headers cho API request
   *
   * @param {boolean} includeAuth - Có gửi kèm Authorization header không (mặc định: true)
   * @returns {Object} Headers object chứa Content-Type và Authorization (nếu có)
   *
   * Flow:
   * 1. Tạo header cơ bản với Content-Type: application/json
   * 2. Nếu includeAuth = true và có token:
   *    - Lấy token từ localStorage
   *    - Thêm Authorization header với format: "Bearer {token}"
   * 3. Trả về headers object
   *
   * Ví dụ kết quả:
   * {
   *   'Content-Type': 'application/json',
   *   'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
   * }
   */
  static getHeaders(includeAuth = true) {
    // Tạo headers object cơ bản
    const headers = {
      // Content-Type cho biết data gửi lên là JSON
      'Content-Type': 'application/json',
    };

    // Kiểm tra xem có cần thêm Authorization header không
    if (includeAuth) {
      // Lấy token từ localStorage
      const token = this.getToken();

      // Nếu có token thì thêm vào header
      if (token) {
        // Format: "Bearer {token}" - đây là chuẩn JWT authentication
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Trả về headers object hoàn chỉnh
    return headers;
  }

  /**
   * Thực hiện HTTP request đến backend API
   * @param {string} endpoint - API endpoint (ví dụ: '/users', '/orders')
   * @param {Object} options - Fetch options (method, body, headers, auth...)
   * @returns {Promise<Object>} Promise resolve với data từ server hoặc reject với error
   *
   * Flow:
   * 1. Tạo full URL từ base URL + endpoint
   * 2. Merge options với headers (bao gồm Authorization nếu cần)
   * 3. Gọi fetch() để thực hiện HTTP request
   * 4. Xử lý các status codes khác nhau (401, 403, 404, 500...)
   * 5. Parse JSON response
   * 6. Trả về data hoặc throw error
   *
   * Error Handling:
   * - 401: Unauthorized - Token hết hạn hoặc không hợp lệ
   * - 403: Forbidden - Không có quyền truy cập
   * - 404: Not Found - Resource không tồn tại
   * - 500: Server Error - Lỗi từ phía server
   */
  static async request(endpoint, option = {}) {
    // 1
    const url = `${getApiBaseUrl()}${endpoint}`;

    // 2
    const config = {
      ...option,
      headers: {
        // Lấy headers mặc định (Content-Type + Authorization nếu auth !== false)
        ...this.getHeaders(options.auth !== false),
        // Merge với custom headers nếu có
        ...options.headers,
      },
    };

    try {
      //3
      const response = await fetch(url, config);
      // 4
      // 401 Unauthorized: Token không hợp lệ hoặc hết hạn
      if (response.status === 401) {
        // Throw error để trigger auto-logout
        throw new Error('Unauthorized. Please login again.');
      }

      // 403 Forbidden: User không có quyền truy cập resource này
      if (response.status === 403) {
        throw new Error('Access denied. Insufficient permissions.');
      }

      // 404 Not Found: Resource không tồn tại (user, order không tìm thấy...)
      if (response.status === 404) {
        throw new Error('Resource not found.');
      }

      // 500 Internal Server Error: Lỗi từ phía backend server
      if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      }

      // 5
      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { result: await response.text() };
      }

      // 6
      if (!response.ok) {
        // Nếu không OK thì throw error với message từ server
        throw new Error(data.message || data.error || 'Request failed');
      }
      return data;
    } catch (error) {
      console.error('API Error:', error);
    }
  }

/**
 * API Login
 *
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu
 * @returns {Promise<Object>} Response chứa token và user info
 *
 * Request Body:
 * {
 *   "username": "admin",
 *   "password": "password123"
 * }
 *
 * Response Success:
 * {
 *   "result": {
 *     "token": "eyJhbGciOiJIUzI1NiIs...",
 *     "username": "admin",
 *     "email": "admin@example.com",
 *     "roles": [{"name": "ADMIN"}]
 *   }
 * }
 *
 * Flow:
 * 1. Gửi POST request đến /auth/token
 * 2. Body chứa username và password dạng JSON
 * 3. auth: false vì đây là request login, chưa có token
 * 4. Backend verify credentials
 * 5. Trả về JWT token nếu đúng
 */
static async login(username, password) {
  return this.request('/auth/token', {
    method: 'POST', // HTTP method POST để gửi credentials
    body: JSON.stringify({ username, password }), // Convert object sang JSON string
    auth: false, // Không cần Authorization header vì đang login
  });
}

  static async getMyInfo() {
    return this.request('/users/myInfo');
  }

}
