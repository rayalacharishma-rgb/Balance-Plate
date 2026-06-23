/**
 * Balance-Plate - Main JavaScript
 * Handles auth, diet plans, workouts, calculators, search, and UI
 */

/** Translation helper (NutriLang loaded via integrate-features.js) */
function t(key) {
  if (window.NutriLang && typeof window.NutriLang.t === 'function') {
    return window.NutriLang.t(key);
  }
  return key;
}

/** Re-apply data-i18n after dynamic HTML updates */
function refreshI18n() {
  if (window.NutriLang && typeof window.NutriLang.applyPageTranslations === 'function') {
    window.NutriLang.applyPageTranslations();
  }
}

/* ========== CONSTANTS & STORAGE KEYS ========== */
const STORAGE_KEYS = {
  currentUser: 'balancePlate_currentUser',
  theme: 'balancePlate_theme',
  workouts: 'balancePlate_workouts'
};

const API_BASE = '';
const TOKEN_KEY = 'balancePlate_token';

function getAuthToken() { return localStorage.getItem(TOKEN_KEY); }
function setAuthToken(token) { if (token) localStorage.setItem(TOKEN_KEY, token); }

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getAuthToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  const response = await fetch(API_BASE + path, { credentials: 'include', ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(data.message || data || 'Request failed');
  return data;
}

/* ========== FOOD CATEGORIES DATA ========== */
const foodCategories = [
  {
    id: 'vegetarian',
    name: 'Vegetarian Diet',
    icon: 'fa-seedling',
    headerClass: 'vegetarian',
    healthBenefits: 'Lower cholesterol, rich in fiber, supports heart health and sustainable eating.',
    foods: [
      { name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fats: 2, vitamins: 'B1, B3', fiber: 3.5 },
      { name: 'Paneer', calories: 265, protein: 18, carbs: 4, fats: 20, vitamins: 'B12, D', fiber: 0 },
      { name: 'Spinach', calories: 23, protein: 3, carbs: 4, fats: 0, vitamins: 'A, C, K', fiber: 2.2 },
      { name: 'Lentils (Dal)', calories: 230, protein: 18, carbs: 40, fats: 1, vitamins: 'B9, Iron', fiber: 8 },
      { name: 'Greek Yogurt', calories: 100, protein: 10, carbs: 6, fats: 3, vitamins: 'B12, Calcium', fiber: 0 }
    ]
  },
  {
    id: 'nonveg',
    name: 'Non-Vegetarian Diet',
    icon: 'fa-drumstick-bite',
    headerClass: 'nonveg',
    healthBenefits: 'High-quality complete protein, iron, zinc, and B vitamins for muscle repair.',
    foods: [
      { name: 'Grilled Chicken', calories: 165, protein: 31, carbs: 0, fats: 4, vitamins: 'B6, B12', fiber: 0 },
      { name: 'Salmon', calories: 208, protein: 20, carbs: 0, fats: 13, vitamins: 'D, Omega-3', fiber: 0 },
      { name: 'Eggs (2)', calories: 140, protein: 12, carbs: 1, fats: 10, vitamins: 'A, D, B12', fiber: 0 },
      { name: 'Lean Beef', calories: 250, protein: 26, carbs: 0, fats: 15, vitamins: 'B12, Iron', fiber: 0 },
      { name: 'Tuna', calories: 132, protein: 28, carbs: 0, fats: 1, vitamins: 'D, Selenium', fiber: 0 }
    ]
  },
  {
    id: 'vegan',
    name: 'Vegan Diet',
    icon: 'fa-leaf',
    headerClass: 'vegan',
    healthBenefits: 'Plant-based antioxidants, low saturated fat, eco-friendly nutrition.',
    foods: [
      { name: 'Tofu', calories: 144, protein: 15, carbs: 3, fats: 9, vitamins: 'Calcium, Iron', fiber: 2 },
      { name: 'Quinoa', calories: 222, protein: 8, carbs: 39, fats: 4, vitamins: 'B2, E', fiber: 5 },
      { name: 'Chickpeas', calories: 269, protein: 15, carbs: 45, fats: 4, vitamins: 'B6, Folate', fiber: 12 },
      { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fats: 14, vitamins: 'E, Magnesium', fiber: 3.5 },
      { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fats: 15, vitamins: 'K, E, C', fiber: 7 }
    ]
  }
];

/* ========== DIET PLANS DATA ========== */
let dietPlans = window.BALANCE_PLATE_DIET_PLANS || {};

function normalizeApiPlan(plan) {
  if (!plan) return null;
  const mealText = key => Array.isArray(plan[key]) ? plan[key].map(item => item.name).join(', ') : plan[key];
  return {
    id: plan.conditionKey || plan.slug || plan.id,
    name: plan.name,
    conditionKey: plan.conditionKey,
    breakfast: mealText('breakfast'), lunch: mealText('lunch'), snacks: mealText('snacks'), dinner: mealText('dinner'),
    breakfastItems: plan.breakfast, lunchItems: plan.lunch, snacksItems: plan.snacks, dinnerItems: plan.dinner,
    water: plan.recommendedWaterIntake || plan.water,
    foodsToAvoid: plan.foodsToAvoid || [],
    nutrition: {
      calories: plan.nutrition?.calories || 0,
      protein: plan.nutrition?.protein || 0,
      carbs: plan.nutrition?.carbohydrates || plan.nutrition?.carbs || 0,
      carbohydrates: plan.nutrition?.carbohydrates || plan.nutrition?.carbs || 0,
      fats: plan.nutrition?.fat || plan.nutrition?.fats || 0,
      fat: plan.nutrition?.fat || plan.nutrition?.fats || 0,
      fiber: plan.nutrition?.fiber || 0
    }
  };
}

async function loadDietPlansFromApi() {
  try {
    const data = await apiFetch('/api/diets/plans');
    if (data.success && Array.isArray(data.plans)) {
      dietPlans = data.plans.reduce((acc, plan) => {
        const normalized = normalizeApiPlan(plan);
        acc[normalized.id] = normalized;
        return acc;
      }, {});
    }
  } catch (err) {
    console.log('Using bundled diet plans:', err.message);
  }
  return dietPlans;
}

/* Workout calorie burn rates per minute *//* Workout calorie burn rates per minute */
const workoutRates = {
  walking: 4,
  running: 10,
  cycling: 8,
  yoga: 3,
  gym: 7,
  stretching: 2
};

/* ========== UTILITY FUNCTIONS ========== */

/** Calculate BMI from height (m) and weight (kg) */
function calculateBMI(height, weight) {
  if (!height || !weight || height <= 0) return null;
  return (weight / (height * height)).toFixed(1);
}

/** Get health status label from BMI */
function getBMIStatus(bmi) {
  const value = parseFloat(bmi);
  if (value < 18.5) return { label: 'Underweight', class: 'underweight' };
  if (value < 25) return { label: 'Normal', class: 'normal' };
  if (value < 30) return { label: 'Overweight', class: 'overweight' };
  return { label: 'Obese', class: 'obese' };
}

/** Show toast notification */
function showToast(message) {
  const toast = document.getElementById('notificationToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/** Get current logged-in user */
function getCurrentUser() {
  const data = localStorage.getItem(STORAGE_KEYS.currentUser);
  return data ? JSON.parse(data) : null;
}

/** Set current user session */
function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

/** Clear session (logout) */
async function logout() {
  try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch (err) { console.log('Logout session cleanup skipped:', err.message); }
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = 'login.html';
}

/** Protect pages that require login */
function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'login.html';
  }
}

/* ========== THEME TOGGLE ========== */
function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(STORAGE_KEYS.theme, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

/* ========== VALIDATION ========== */
const validators = {
  isEmpty(value) {
    return !value || value.toString().trim() === '';
  },
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  isValidPhone(phone) {
    return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, '')) || /^\d{10}$/.test(phone.replace(/\D/g, ''));
  },
  isStrongPassword(password) {
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
  }
};

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  if (field) field.classList.add('is-invalid');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearFieldErrors() {
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  document.querySelectorAll('.invalid-feedback').forEach(el => {
    el.textContent = '';
    el.style.display = '';
  });
}

/* ========== REGISTRATION ========== */
function initRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    let valid = true;
    const fullName = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const gender = document.getElementById('gender').value;
    const age = document.getElementById('age').value;
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;
    const healthConditions = Array.from(document.getElementById('healthConditions')?.selectedOptions || []).map(o => o.value);

    if (validators.isEmpty(fullName)) { showFieldError('username', 'Full name is required'); valid = false; }
    if (validators.isEmpty(email) || !validators.isValidEmail(email)) { showFieldError('email', 'Enter a valid email address'); valid = false; }
    if (validators.isEmpty(phone) || !validators.isValidPhone(phone)) { showFieldError('phone', 'Enter a valid 10-digit phone number'); valid = false; }
    if (!validators.isStrongPassword(password)) { showFieldError('password', 'Password must be 8+ chars with upper, lower, number & special char'); valid = false; }
    if (password !== confirmPassword) { showFieldError('confirmPassword', 'Passwords do not match'); valid = false; }
    if (validators.isEmpty(gender)) { showFieldError('gender', 'Please select gender'); valid = false; }
    if (validators.isEmpty(age) || age < 10 || age > 120) { showFieldError('age', 'Enter a valid age (10-120)'); valid = false; }
    if (validators.isEmpty(height) || height < 0.5 || height > 2.5) { showFieldError('height', 'Enter height in meters (0.5 - 2.5)'); valid = false; }
    if (validators.isEmpty(weight) || weight < 20 || weight > 300) { showFieldError('weight', 'Enter weight in kg (20 - 300)'); valid = false; }
    if (!valid) return;

    try {
      await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ fullName, username: email.split('@')[0], email, mobileNumber: phone, password, gender, age: Number(age), height: Number(height), weight: Number(weight), healthConditions }) });
      const successEl = document.getElementById('registerSuccess');
      if (successEl) { successEl.textContent = 'Registration successful! Redirecting to login...'; successEl.classList.remove('d-none'); }
      setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    } catch (err) { showFieldError('email', err.message === 'Failed to fetch' ? 'Start the server with npm start and open http://localhost:3000/register.html' : err.message); }
  });
}

/* ========== LOGIN ========== */
function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  const loginTypeRadios = document.querySelectorAll('input[name="loginType"]');
  const loginIdLabel = document.getElementById('loginIdLabel');
  const loginIdInput = document.getElementById('loginId');
  loginTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const isEmail = radio.value === 'email';
      loginIdLabel.textContent = isEmail ? t('login.email') : t('login.username');
      loginIdLabel.setAttribute('data-i18n', isEmail ? 'login.email' : 'login.username');
      loginIdInput.type = isEmail ? 'email' : 'text';
      loginIdInput.placeholder = isEmail ? 'your@email.com' : 'username';
    });
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    const loginId = document.getElementById('loginId').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    if (validators.isEmpty(loginId) || validators.isEmpty(password)) {
      if (errorEl) { errorEl.textContent = 'Please fill in all fields'; errorEl.classList.remove('d-none'); }
      return;
    }
    try {
      const data = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ loginId, password }) });
      if (errorEl) errorEl.classList.add('d-none');
      setAuthToken(data.token);
      setCurrentUser(data.user);
      window.location.href = 'dashboard.html';
    } catch (err) {
      if (errorEl) { errorEl.textContent = err.message || 'Invalid username/email or password. Please try again.'; errorEl.classList.remove('d-none'); }
    }
  });
}

/* ========== DASHBOARD ========== */
async function initDashboard() {
  requireAuth();
  let user = getCurrentUser();
  if (!user) return;
  try {
    const dashboardData = await apiFetch('/api/diets/dashboard');
    user = dashboardData.user;
    setCurrentUser(user);
    if (dashboardData.currentDietPlan) renderRecommendedPlan(normalizeApiPlan(dashboardData.currentDietPlan));
    renderDashboardHistory(dashboardData);
  } catch (err) { console.log('Dashboard API unavailable:', err.message); }

  const bmi = calculateBMI(user.height, user.weight);
  const status = bmi ? getBMIStatus(bmi) : { label: '-', class: '' };

  document.getElementById('dashUsername').textContent = user.fullName || user.username;
  document.getElementById('profileUsername').textContent = user.fullName || user.username;
  document.getElementById('profileHeight').textContent = user.height;
  document.getElementById('profileWeight').textContent = user.weight;
  document.getElementById('profileAge').textContent = user.age;
  document.getElementById('profileGender').textContent = user.gender;
  document.getElementById('profileBmi').textContent = bmi || '-';

  const badge = document.getElementById('profileHealthStatus');
  if (badge) { badge.textContent = status.label; badge.className = 'health-badge ' + status.class; }

  const healthSelect = document.getElementById('healthCondition');
  if (healthSelect) {
    healthSelect.innerHTML = '<option value="none">None / General</option>' + Object.values(dietPlans).map(p => '<option value="' + p.id + '">' + p.name.replace(' Diet Plan','') + '</option>').join('');
  }
  const select = document.getElementById('dietPlanSelect');
  if (select) select.innerHTML = Object.values(dietPlans).map(p => '<option value="' + p.id + '">' + p.name + '</option>').join('');

  document.getElementById('recommendDietBtn')?.addEventListener('click', async () => {
    const planId = getRecommendedPlan();
    try {
      const data = await apiFetch('/api/diets/recommend', { method: 'POST', body: JSON.stringify({ conditionKey: planId }) });
      const plan = normalizeApiPlan(data.plan);
      if (plan) { document.getElementById('dietPlanSelect').value = plan.id; renderRecommendedPlan(plan); }
    } catch (err) {
      const plan = dietPlans[planId] || Object.values(dietPlans)[0];
      if (plan) { document.getElementById('dietPlanSelect').value = plan.id; renderRecommendedPlan(plan); }
    }
  });
  document.getElementById('dietPlanSelect')?.addEventListener('change', (e) => {
    const plan = Object.values(dietPlans).find(p => p.id === e.target.value);
    if (plan) renderRecommendedPlan(plan);
  });
  if (typeof Chart !== 'undefined' && bmi) {
    const ctx = document.getElementById('bmiChart');
    if (ctx) new Chart(ctx, { type: 'doughnut', data: { labels: ['Your BMI', 'Healthy Range'], datasets: [{ data: [parseFloat(bmi), Math.max(0, 24.9 - parseFloat(bmi))], backgroundColor: ['#2ecc71', '#ecf0f1'] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
  }
  const reminders = document.getElementById('dashReminders');
  if (reminders) {
    reminders.innerHTML = '<div class="reminder-card mb-2"><i class="fas fa-utensils"></i> Lunch in 30 min</div><div class="reminder-card mb-2"><i class="fas fa-glass-water"></i> Drink water today</div><div class="reminder-card"><i class="fas fa-dumbbell"></i> Evening workout at 6 PM</div>';
  }
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

/** Recommend diet based on user selections */
function getRecommendedPlan() {
  const health = document.getElementById('healthCondition')?.value;
  const weight = document.getElementById('weightGoal')?.value;
  const fitness = document.getElementById('fitnessGoal')?.value;

  if (health && health !== 'none') return health;
  if (weight === 'lose') return 'obesity';
  if (fitness === 'muscle' || weight === 'gain') return 'underweight';
  if (fitness === 'endurance') return 'general-healthy-diet';
  return 'general-healthy-diet';
}

function renderMealList(items, fallback) {
  if (!Array.isArray(items) || !items.length) return '<p>' + (fallback || '') + '</p>';
  return '<ul class="meal-options">' + items.map(item => '<li><strong>' + item.name + '</strong> <small>' + (item.calories || 0) + ' kcal, P ' + (item.protein || 0) + 'g, C ' + (item.carbohydrates || item.carbs || 0) + 'g, F ' + (item.fat || item.fats || 0) + 'g, Fiber ' + (item.fiber || 0) + 'g</small></li>').join('') + '</ul>';
}

function renderRecommendedPlan(plan) {
  const container = document.getElementById('recommendedPlan');
  if (!container) return;
  container.innerHTML = `
    <div class="diet-plan-card">
      <h5>${plan.name}</h5>
      <div class="meal-section"><h5><i class="fas fa-sun"></i> ${t('meal.breakfast')}</h5>${renderMealList(plan.breakfastItems, plan.breakfast)}</div>
      <div class="meal-section"><h5><i class="fas fa-cloud-sun"></i> ${t('meal.lunch')}</h5>${renderMealList(plan.lunchItems, plan.lunch)}</div>
      <div class="meal-section"><h5><i class="fas fa-cookie"></i> ${t('meal.snacks')}</h5>${renderMealList(plan.snacksItems, plan.snacks)}</div>
      <div class="meal-section"><h5><i class="fas fa-moon"></i> ${t('meal.dinner')}</h5>${renderMealList(plan.dinnerItems, plan.dinner)}</div>
      <p><i class="fas fa-droplet"></i> ${t('meal.water')}: ${plan.water}</p>
      <div class="nutrition-summary">
        <span>${t('nutrition.calories')} ${plan.nutrition.calories} kcal</span>
        <span>${t('nutrition.protein')}: ${plan.nutrition.protein}g</span>
        <span>${t('nutrition.carbs')}: ${plan.nutrition.carbs}g</span>
        <span>${t('nutrition.fats')}: ${plan.nutrition.fats}g</span>
        <span>Fiber: ${plan.nutrition.fiber || 0}g</span>
      </div>
    </div>
  `;
}

/* ========== HOME PAGE - CATEGORIES ========== */
function renderDietCategories() {
  const container = document.getElementById('dietCategories');
  if (!container) return;

  container.innerHTML = foodCategories.map(cat => `
    <div class="col-lg-4">
      <div class="category-card animate-slide-up">
        <div class="category-header ${cat.headerClass}">
          <h3><i class="fas ${cat.icon} category-icon"></i> ${cat.name}</h3>
        </div>
        <div class="table-responsive">
          <table class="table nutrition-table">
            <thead>
              <tr>
                <th>${t('nutrition.food')}</th>
                <th>${t('nutrition.cal')}</th>
                <th>${t('nutrition.protein')}</th>
                <th>${t('nutrition.carbs')}</th>
                <th>${t('nutrition.fats')}</th>
                <th>${t('nutrition.vitamins')}</th>
                <th>${t('nutrition.fiber')}</th>
              </tr>
            </thead>
            <tbody>
              ${cat.foods.map(f => `
                <tr>
                  <td>${f.name}</td>
                  <td>${f.calories}</td>
                  <td>${f.protein}g</td>
                  <td>${f.carbs}g</td>
                  <td>${f.fats}g</td>
                  <td>${f.vitamins}</td>
                  <td>${f.fiber}g</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="health-benefits">
          <h5><i class="fas fa-heart"></i> ${t('nutrition.healthBenefits')}</h5>
          <p>${cat.healthBenefits}</p>
        </div>
      </div>
    </div>
  `).join('');
  refreshI18n();
}

/* ========== DIET PLANS PAGE ========== */
let dietPlansListenersBound = false;

async function initDietPlansPage() {
  await loadDietPlansFromApi();
  const tabsContainer = document.getElementById('dietPlanTabs');
  const detailsContainer = document.getElementById('dietPlanDetails');
  if (!tabsContainer || !detailsContainer) return;

  const plans = Object.values(dietPlans);

  tabsContainer.innerHTML = plans.map((p, i) => `
    <div class="col-6 col-md-4 col-lg-3">
      <button class="diet-tab-btn ${i === 0 ? 'active' : ''}" data-plan="${p.id}">${p.name}</button>
    </div>
  `).join('');

  function showPlan(planId) {
    const plan = dietPlans[planId];
    if (!plan) return;
    detailsContainer.innerHTML = `
      <div class="diet-plan-card animate-fade-in">
        <h2>${plan.name}</h2>
        <div class="row g-4 mt-2">
          <div class="col-md-6">
            <div class="meal-section"><h5><i class="fas fa-sun"></i> ${t('meal.breakfast')}</h5>${renderMealList(plan.breakfastItems, plan.breakfast)}</div>
            <div class="meal-section"><h5><i class="fas fa-cloud-sun"></i> ${t('meal.lunch')}</h5>${renderMealList(plan.lunchItems, plan.lunch)}</div>
          </div>
          <div class="col-md-6">
            <div class="meal-section"><h5><i class="fas fa-cookie"></i> ${t('meal.snacks')}</h5>${renderMealList(plan.snacksItems, plan.snacks)}</div>
            <div class="meal-section"><h5><i class="fas fa-moon"></i> ${t('meal.dinner')}</h5>${renderMealList(plan.dinnerItems, plan.dinner)}</div>
          </div>
        </div>
        <p class="mt-3"><strong><i class="fas fa-droplet"></i> ${t('meal.waterIntake')}</strong> ${plan.water}</p>
        <div class="nutrition-summary">
          <span><i class="fas fa-fire"></i> ${plan.nutrition.calories} kcal</span>
          <span><i class="fas fa-dumbbell"></i> ${t('nutrition.protein')}: ${plan.nutrition.protein}g</span>
          <span><i class="fas fa-bread-slice"></i> ${t('nutrition.carbs')}: ${plan.nutrition.carbs}g</span>
          <span><i class="fas fa-cheese"></i> ${t('nutrition.fats')}: ${plan.nutrition.fats}g</span>
          <span><i class="fas fa-wheat-awn"></i> Fiber: ${plan.nutrition.fiber || 0}g</span>
        </div>
      </div>
    `;
    document.querySelectorAll('.diet-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.plan === planId);
    });
    refreshI18n();
  }

  const activeBtn = tabsContainer.querySelector('.diet-tab-btn.active');
  showPlan(activeBtn ? activeBtn.dataset.plan : plans[0].id);

  if (!dietPlansListenersBound) {
    dietPlansListenersBound = true;
    tabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.diet-tab-btn');
      if (btn) showPlan(btn.dataset.plan);
    });

    document.getElementById('dietSearch')?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.diet-tab-btn').forEach(btn => {
        const match = btn.textContent.toLowerCase().includes(query);
        btn.closest('.col-6').style.display = match ? '' : 'none';
      });
    });
  }
}

/* ========== HEALTH CALCULATORS ========== */
function initCalculators() {
  document.getElementById('calcBmiBtn')?.addEventListener('click', () => {
    const height = parseFloat(document.getElementById('bmiHeight').value);
    const weight = parseFloat(document.getElementById('bmiWeight').value);
    const result = document.getElementById('bmiResult');
    if (!height || !weight) {
      result.textContent = 'Please enter valid height and weight.';
      return;
    }
    const bmi = calculateBMI(height, weight);
    const status = getBMIStatus(bmi);
    result.textContent = `BMI: ${bmi} — ${status.label}`;
  });

  document.getElementById('calcCalorieBtn')?.addEventListener('click', () => {
    const gender = document.getElementById('calGender').value;
    const age = parseInt(document.getElementById('calAge').value, 10);
    const weight = parseFloat(document.getElementById('calWeight').value);
    const height = parseFloat(document.getElementById('calHeight').value);
    const activity = parseFloat(document.getElementById('calActivity').value);
    const result = document.getElementById('calorieResult');

    if (!age || !weight || !height) {
      result.textContent = 'Please fill all fields.';
      return;
    }

    // Mifflin-St Jeor equation
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    const daily = Math.round(bmr * activity);
    result.textContent = `Daily calories needed: ~${daily} kcal`;
  });

  document.getElementById('calcWaterBtn')?.addEventListener('click', () => {
    const weight = parseFloat(document.getElementById('waterWeight').value);
    const extra = parseFloat(document.getElementById('waterActivity').value);
    const result = document.getElementById('waterResult');
    if (!weight) {
      result.textContent = 'Please enter your weight.';
      return;
    }
    const liters = ((weight * 0.033) + extra).toFixed(1);
    const glasses = Math.round(liters * 4);
    result.textContent = `Recommended: ${liters} L (~${glasses} glasses) per day`;
  });
}

/* ========== SEARCH ========== */
function buildSearchIndex() {
  const index = [];
  foodCategories.forEach(cat => {
    cat.foods.forEach(f => {
      index.push({
        type: 'food',
        title: f.name,
        detail: `${cat.name} — ${f.calories} cal, ${f.protein}g protein`,
        category: cat.name
      });
    });
  });
  Object.values(dietPlans).forEach(p => {
    index.push({
      type: 'diet',
      title: p.name,
      detail: `${p.nutrition.calories} kcal — ${p.breakfast}`,
      category: 'Diet Plan'
    });
  });
  return index;
}

function initSearch() {
  const searchInput = document.getElementById('globalSearch');
  const resultsEl = document.getElementById('searchResults');
  if (!searchInput || !resultsEl) return;

  const index = buildSearchIndex();

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length < 2) {
      resultsEl.classList.remove('active');
      return;
    }
    const matches = index.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.detail.toLowerCase().includes(query)
    ).slice(0, 8);

    if (matches.length === 0) {
      resultsEl.innerHTML = '<div class="search-result-item">No results found</div>';
    } else {
      resultsEl.innerHTML = matches.map(m => `
        <div class="search-result-item" data-type="${m.type}">
          <strong>${m.title}</strong><br>
          <small>${m.category} — ${m.detail}</small>
        </div>
      `).join('');
    }
    resultsEl.classList.add('active');
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsEl.contains(e.target)) {
      resultsEl.classList.remove('active');
    }
  });
}

/* ========== REMINDERS / NOTIFICATIONS ========== */
function initReminders() {
  const reminders = [
    { id: 'mealReminder', msg: 'Time for a healthy meal! 🍽️' },
    { id: 'waterReminder', msg: 'Stay hydrated — drink water! 💧' },
    { id: 'workoutReminder', msg: 'Ready for your workout? 💪' }
  ];

  reminders.forEach(({ id, msg }) => {
    document.getElementById(id)?.addEventListener('click', () => {
      document.getElementById(id)?.classList.add('pulse');
      showToast(msg);
      setTimeout(() => document.getElementById(id)?.classList.remove('pulse'), 500);
    });
  });

  // Auto reminders every 2 minutes (demo)
  const autoMessages = [
    'Reminder: Drink a glass of water!',
    'Reminder: Time for a balanced snack!',
    'Reminder: Stand up and stretch!'
  ];
  let msgIndex = 0;
  setInterval(() => {
    if (document.getElementById('notificationToast')) {
      showToast(autoMessages[msgIndex % autoMessages.length]);
      msgIndex++;
    }
  }, 120000);
}

/* ========== WORKOUT TRACKER ========== */
function getWorkouts() {
  const data = localStorage.getItem(STORAGE_KEYS.workouts);
  return data ? JSON.parse(data) : [];
}

function saveWorkouts(workouts) {
  localStorage.setItem(STORAGE_KEYS.workouts, JSON.stringify(workouts));
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function initWorkoutTracker() {
  const form = document.getElementById('workoutForm');
  const typeSelect = document.getElementById('workoutType');
  const durationInput = document.getElementById('workoutDuration');
  const caloriesInput = document.getElementById('workoutCalories');

  if (!form) return;

  function updateCalories() {
    const type = typeSelect.value;
    const duration = parseInt(durationInput.value, 10) || 0;
    caloriesInput.value = Math.round(workoutRates[type] * duration);
  }

  typeSelect?.addEventListener('change', updateCalories);
  durationInput?.addEventListener('input', updateCalories);
  updateCalories();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const workout = {
      id: Date.now(),
      type: typeSelect.value,
      duration: parseInt(durationInput.value, 10),
      calories: parseInt(caloriesInput.value, 10),
      date: getTodayKey(),
      completed: false
    };
    const workouts = getWorkouts();
    workouts.unshift(workout);
    saveWorkouts(workouts);
    renderWorkouts();
    showToast(`${workout.type} workout added!`);
    form.reset();
    durationInput.value = 30;
    updateCalories();
  });

  renderWorkouts();
}

function renderWorkouts() {
  const todayList = document.getElementById('todayWorkouts');
  const historyTable = document.getElementById('workoutHistory');
  const progressBar = document.getElementById('calorieProgressBar');
  const todayCalEl = document.getElementById('todayCalories');
  if (!todayList) return;

  const workouts = getWorkouts();
  const today = getTodayKey();
  const todayWorkouts = workouts.filter(w => w.date === today);

  const todayCalories = todayWorkouts.reduce((sum, w) => sum + (w.completed ? w.calories : 0), 0);
  const totalCalories = todayWorkouts.reduce((sum, w) => sum + w.calories, 0);

  if (todayCalEl) todayCalEl.textContent = todayCalories;
  if (progressBar) {
    const pct = Math.min(100, (todayCalories / 500) * 100);
    progressBar.style.width = pct + '%';
  }

  const icons = {
    walking: 'fa-person-walking',
    running: 'fa-person-running',
    cycling: 'fa-bicycle',
    yoga: 'fa-spa',
    gym: 'fa-dumbbell',
    stretching: 'fa-child-reaching'
  };

  todayList.innerHTML = todayWorkouts.length === 0
    ? '<p class="text-muted" data-i18n="workout.noToday">No workouts today. Add one above!</p>'
    : todayWorkouts.map(w => `
      <div class="workout-item ${w.completed ? 'completed' : ''}" data-id="${w.id}">
        <div>
          <i class="fas ${icons[w.type] || 'fa-dumbbell'} workout-icon"></i>
          <strong>${w.type.charAt(0).toUpperCase() + w.type.slice(1)}</strong>
          — ${w.duration} min, ${w.calories} kcal
        </div>
        <button class="btn btn-sm btn-primary-custom mark-complete" data-id="${w.id}">
          ${w.completed ? '<i class="fas fa-check"></i> ' + t('workout.done') : t('workout.markComplete')}
        </button>
      </div>
    `).join('');

  todayList.querySelectorAll('.mark-complete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const all = getWorkouts();
      const w = all.find(x => x.id === id);
      if (w) {
        w.completed = !w.completed;
        saveWorkouts(all);
        renderWorkouts();
        initWorkoutChart();
      }
    });
  });

  if (historyTable) {
    historyTable.innerHTML = workouts.slice(0, 20).map(w => `
      <tr>
        <td>${w.date}</td>
        <td>${w.type}</td>
        <td>${w.duration} min</td>
        <td>${w.calories}</td>
        <td>${w.completed ? '<span class="text-success">' + t('workout.complete') + '</span>' : t('workout.pending')}</td>
      </tr>
    `).join('');
  }

  refreshI18n();
  initWorkoutChart();
}

let workoutChartInstance = null;

function initWorkoutChart() {
  const ctx = document.getElementById('workoutChart');
  if (!ctx || typeof Chart === 'undefined') return;

  const workouts = getWorkouts();
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7.push(d.toISOString().split('T')[0]);
  }

  const caloriesByDay = last7.map(date => {
    return workouts
      .filter(w => w.date === date && w.completed)
      .reduce((sum, w) => sum + w.calories, 0);
  });

  const labels = last7.map(d => {
    const date = new Date(d);
    return date.toLocaleDateString('en', { weekday: 'short' });
  });

  if (workoutChartInstance) workoutChartInstance.destroy();

  workoutChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Calories Burned',
        data: caloriesByDay,
        backgroundColor: 'rgba(46, 204, 113, 0.7)',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'kcal' } }
      }
    }
  });
}

/* ========== GLOBAL INIT ========== */
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();

  // Theme toggle on all pages
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  const page = document.body.dataset.page;

  switch (page) {
    case 'home':
      renderDietCategories();
      initCalculators();
      initSearch();
      initReminders();
      break;
    case 'register':
      initRegister();
      break;
    case 'login':
      initLogin();
      break;
    case 'dashboard':
      await loadDietPlansFromApi();
      initDashboard();
      initAssessments();
      break;
    case 'admin':
      initAdmin();
      break;
    case 'dietplans':
      await loadDietPlansFromApi();
      initDietPlansPage();
      break;
    case 'workout':
      initWorkoutTracker();
      break;
  }

  /* Apply translations after NutriBot / language modules finish loading */
  document.addEventListener('nutri:features-ready', function () {
    refreshI18n();
    switch (page) {
      case 'home':
        renderDietCategories();
        break;
      case 'dietplans':
        initDietPlansPage();
        break;
      case 'workout':
        renderWorkouts();
        break;
      default:
        break;
    }
  });

  /* Re-render dynamic content when language changes */
  document.addEventListener('nutri:language-changed', function () {
    switch (page) {
      case 'home':
        renderDietCategories();
        break;
      case 'dietplans':
        initDietPlansPage();
        break;
      case 'workout':
        renderWorkouts();
        break;
      case 'dashboard':
        refreshI18n();
        break;
      case 'login': {
        const loginIdLabel = document.getElementById('loginIdLabel');
        const isEmail = document.getElementById('loginEmail')?.checked;
        if (loginIdLabel) {
          loginIdLabel.textContent = isEmail ? t('login.email') : t('login.username');
        }
        refreshI18n();
        break;
      }
      default:
        refreshI18n();
    }
  });
});


/* ========== SMART ASSESSMENTS & ADMIN ========== */
function renderDashboardHistory(data) {
  const stats = document.getElementById('dashboardStats');
  if (stats) stats.innerHTML = '<span>Daily Calories: <strong>' + (data.dailyCalories || '-') + '</strong></span><span>Water: <strong>' + (data.waterIntake || '-') + '</strong></span><span>BMI: <strong>' + (data.bmi || '-') + '</strong></span>';
  const history = document.getElementById('previousDietPlans');
  if (history) history.innerHTML = (data.previousDietPlans || []).map(h => '<li>' + (h.dietPlan?.name || 'Diet plan') + ' <small>' + new Date(h.assignedAt).toLocaleDateString() + '</small></li>').join('') || '<li>No diet history yet</li>';
}
function initAssessments() {
  document.getElementById('diabetesAssessBtn')?.addEventListener('click', async () => {
    const payload = { fastingBloodSugar: document.getElementById('fastingBloodSugar')?.value, postMealBloodSugar: document.getElementById('postMealBloodSugar')?.value, hba1c: document.getElementById('hba1c')?.value };
    const out = document.getElementById('diabetesAssessmentResult');
    try { const data = await apiFetch('/api/diets/assess/diabetes', { method: 'POST', body: JSON.stringify(payload) }); out.textContent = data.assessment.status + ' - matching diet plan loaded below.'; renderRecommendedPlan(normalizeApiPlan(data.plan)); } catch (err) { out.textContent = err.message; }
  });
  document.getElementById('bpAssessBtn')?.addEventListener('click', async () => {
    const payload = { systolic: document.getElementById('systolicBp')?.value, diastolic: document.getElementById('diastolicBp')?.value };
    const out = document.getElementById('bpAssessmentResult');
    try { const data = await apiFetch('/api/diets/assess/blood-pressure', { method: 'POST', body: JSON.stringify(payload) }); out.textContent = data.assessment.status + ' - matching diet plan loaded below.'; renderRecommendedPlan(normalizeApiPlan(data.plan)); } catch (err) { out.textContent = err.message; }
  });
}
async function initAdmin() {
  requireAuth();
  const summaryEl = document.getElementById('adminSummary');
  const usersEl = document.getElementById('adminUsers');
  const activityEl = document.getElementById('adminActivity');
  if (!summaryEl) return;
  try {
    const [summary, users, activity] = await Promise.all([apiFetch('/api/admin/summary'), apiFetch('/api/admin/users'), apiFetch('/api/admin/activity')]);
    summaryEl.innerHTML = Object.entries(summary.summary).map(([k,v]) => '<span>' + k + ': <strong>' + v + '</strong></span>').join('');
    usersEl.innerHTML = users.users.map(u => '<tr><td>' + (u.fullName || '') + '</td><td>' + u.email + '</td><td>' + u.mobileNumber + '</td><td>' + (u.healthConditions || []).join(', ') + '</td><td>' + new Date(u.registrationDate).toLocaleDateString() + '</td></tr>').join('');
    activityEl.innerHTML = activity.logins.map(l => '<tr><td>' + (l.user?.email || '') + '</td><td>' + new Date(l.loginAt).toLocaleString() + '</td><td>' + (l.success ? 'Success' : 'Failed') + '</td></tr>').join('');
  } catch (err) { summaryEl.textContent = err.message; }
}
