const Auth = {
  async login(username, password) {
    try {
      const response = await API.login(username, password);

      if (response.result && response.result.token) {
        API.setToken(response.result.token);
        // Get user info and store it
        const userInfo = await API.getMyInfo();
        if (userInfo.result) {
          localStorage.setItem(
            CONFIG.USER_KEY,
            JSON.stringify(userInfo.result)
          );
        }

        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  },

  redirectToDashboard() {
    const loginModal = document.getElementById('loginModal');
    const dashboard = document.getElementById('dashboard');

    if (loginModal) {
      loginModal.classList.remove('active');
    }
    if (dashboard) {
      dashboard.classList.remove('hidden');
    }
  },
};

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('loginError');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;

  errorElement.classList.remove('show');
  errorElement.textContent = '';

  // validation
  if (!username || !password) {
    errorElement.textContent = 'Please enter both username and password';
    errorElement.classList.add('show');
    return;
  }

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

  // Call login api
  try {
    const success = await Auth.login(username, password);

    if (success) {
      Auth.redirectToDashboard();

      console.log('login success');
    } else {
      errorElement.textContent = 'Invalid username or password';
      errorElement.classList.add('show');
    }

    // Reset form
    e.target.reset();
  } catch (error) {
    const errorMessage = error.message || 'Login failed';
    errorElement.textContent = errorMessage;
    errorElement.classList.add('show');
    console.error('Login error:', error);
  } finally {
    // Restore btn state
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
});
