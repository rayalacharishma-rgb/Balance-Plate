const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(?:\+?91[-\s]?)?[6-9]\d{9}$/;

function isValidEmail(email) { return emailRegex.test(String(email || '').trim().toLowerCase()); }
function normalizePhone(phone) { return String(phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); }
function isValidPhone(phone) { return phoneRegex.test(String(phone || '').trim()) || /^[6-9]\d{9}$/.test(normalizePhone(phone)); }
function isStrongPassword(password) { return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(password || '')); }
function bmi(height, weight) { return height && weight ? Number((weight / (height * height)).toFixed(1)) : null; }

module.exports = { isValidEmail, normalizePhone, isValidPhone, isStrongPassword, bmi };
