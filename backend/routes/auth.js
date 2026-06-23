const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../storage/excelStore');
const { signToken, requireAuth } = require('../middleware/auth');
const { isValidEmail, isValidPhone, isStrongPassword, normalizePhone } = require('../utils/validators');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, mobileNumber, phone, password, age, gender, height, weight, healthConditions = [] } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = normalizePhone(mobileNumber || phone);
    const cleanUsername = String(username || fullName || '').trim().toLowerCase().replace(/s+/g, '_');

    if (!fullName || fullName.trim().length < 2) return res.status(400).json({ success: false, message: 'Full name is required' });
    if (!cleanUsername) return res.status(400).json({ success: false, message: 'Username is required' });
    if (!isValidEmail(cleanEmail)) return res.status(400).json({ success: false, message: 'Valid email is required' });
    if (!isValidPhone(cleanPhone)) return res.status(400).json({ success: false, message: 'Valid mobile number is required' });
    if (!isStrongPassword(password)) return res.status(400).json({ success: false, message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character' });

    const existing = await store.findUser(u => [String(u.email).toLowerCase(), String(u.username).toLowerCase(), String(u.mobileNumber)].includes(cleanEmail) || String(u.mobileNumber) === cleanPhone || String(u.username).toLowerCase() === cleanUsername);
    if (existing) return res.status(409).json({ success: false, message: 'Email, username, or mobile number already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const defaultCondition = healthConditions[0] || 'general-healthy-diet';
    const plans = await store.getDietPlans({ conditionKey: defaultCondition });
    const fallbackPlans = plans.length ? plans : await store.getDietPlans({ conditionKey: 'general-healthy-diet' });
    const defaultPlan = fallbackPlans[0];
    const user = await store.createUser({
      fullName: fullName.trim(), username: cleanUsername, email: cleanEmail, mobileNumber: cleanPhone, passwordHash,
      age: Number(age), gender, height: Number(height), weight: Number(weight), healthConditions: healthConditions.length ? healthConditions : [defaultCondition],
      currentDietPlan: defaultPlan?.id || '', currentDietAssignedAt: defaultPlan ? store.now() : ''
    });
    if (defaultPlan) await store.addDietHistory({ user: user.id, dietPlan: defaultPlan.id, conditionKey: defaultPlan.conditionKey, reason: 'registration' });
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { loginId, email, username, password } = req.body;
  const id = String(loginId || email || username || '').trim().toLowerCase();
  try {
    const rawUser = await store.findUser(u => String(u.email).toLowerCase() === id || String(u.username).toLowerCase() === id);
    const ok = rawUser && await bcrypt.compare(password || '', rawUser.passwordHash || '');
    if (!ok) {
      if (rawUser) await store.addLoginHistory({ user: rawUser.id, ipAddress: req.ip, userAgent: req.get('user-agent'), success: false });
      return res.status(401).json({ success: false, message: 'Invalid username/email or password' });
    }
    const updated = await store.updateUser(rawUser.id, { lastLoginDate: store.now() });
    await store.addLoginHistory({ user: rawUser.id, ipAddress: req.ip, userAgent: req.get('user-agent'), success: true });
    const token = signToken(updated);
    req.session.token = token;
    res.json({ success: true, token, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, user: req.user }));

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

module.exports = router;
