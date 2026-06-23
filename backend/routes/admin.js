const express = require('express');
const store = require('../storage/excelStore');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

function csvEscape(value) {
  return '"' + String(value ?? '').replace(/"/g, '""') + '"';
}

router.get('/summary', async (req, res) => {
  res.json({ success: true, summary: await store.counts(), workbook: store.workbookPath });
});
router.get('/users', async (req, res) => res.json({ success: true, users: await store.getUsers() }));
router.get('/registrations', async (req, res) => {
  const registrations = (await store.getUsers()).sort((a,b) => String(b.registrationDate).localeCompare(String(a.registrationDate)));
  res.json({ success: true, registrations });
});
router.get('/activity', async (req, res) => {
  const users = await store.getUsers();
  const logins = (await store.getLoginHistory(100)).map(l => ({ ...l, user: users.find(u => u.id === l.user) || null }));
  res.json({ success: true, logins });
});
router.post('/conditions', async (req, res) => res.status(201).json({ success: true, condition: await store.createHealthCondition(req.body) }));
router.post('/diet-plans', async (req, res) => res.status(201).json({ success: true, plan: await store.createDietPlan(req.body) }));
router.put('/diet-plans/:id', async (req, res) => res.json({ success: true, plan: await store.updateDietPlan(req.params.id, req.body) }));
router.get('/export/users.csv', async (req, res) => {
  const users = await store.getUsers();
  const rows = ['Full Name,Email,Mobile Number,Age,Gender,Height,Weight,Health Conditions,Registration Date,Last Login Date'];
  users.forEach(u => rows.push([u.fullName,u.email,u.mobileNumber,u.age,u.gender,u.height,u.weight,(u.healthConditions||[]).join('|'),u.registrationDate,u.lastLoginDate || ''].map(csvEscape).join(',')));
  res.type('text/csv').send(rows.join('\n'));
});
router.get('/export/diet-history.csv', async (req, res) => {
  const rows = ['User,Plan,Condition,Assigned At,Reason'];
  const users = await store.getUsers();
  const records = await store.getDietHistory(null, 10000);
  records.forEach(r => rows.push([users.find(u => u.id === r.user)?.email, r.dietPlan?.name, r.conditionKey, r.assignedAt, r.reason].map(csvEscape).join(',')));
  res.type('text/csv').send(rows.join('\n'));
});
router.get('/workbook', async (req, res) => {
  await store.loadWorkbook();
  res.download(store.workbookPath, 'balance-plate-data.xlsx');
});

module.exports = router;
