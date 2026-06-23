const jwt = require('jsonwebtoken');
const store = require('../storage/excelStore');

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'balance-plate_dev_jwt_secret', { expiresIn: '7d' });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.session?.token;
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'balance-plate_dev_jwt_secret');
    const rawUser = await store.getUserRawById(payload.sub);
    if (!rawUser) return res.status(401).json({ success: false, message: 'User not found' });
    const safeUser = store.userSafe(rawUser);
    const currentPlan = safeUser.currentDietPlan ? await store.getDietPlanById(safeUser.currentDietPlan) : null;
    req.user = { ...safeUser, currentDietPlan: currentPlan || safeUser.currentDietPlan };
    req.userRaw = rawUser;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
}

module.exports = { signToken, requireAuth, requireAdmin };
