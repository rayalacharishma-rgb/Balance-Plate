const express = require('express');
const store = require('../storage/excelStore');
const { requireAuth } = require('../middleware/auth');
const { bmi } = require('../utils/validators');

const router = express.Router();

function classifyDiabetes({ fastingBloodSugar, postMealBloodSugar, hba1c }) {
  const f = Number(fastingBloodSugar), p = Number(postMealBloodSugar), a = Number(hba1c);
  if (a >= 8 || f >= 180 || p >= 250) return { status: 'Poorly Controlled Diabetes', conditionKey: 'diabetes' };
  if (a >= 6.5 || f >= 126 || p >= 200) return { status: 'Type 2 Diabetes', conditionKey: 'diabetes' };
  if ((a >= 5.7 && a < 6.5) || (f >= 100 && f < 126) || (p >= 140 && p < 200)) return { status: 'Prediabetes', conditionKey: 'prediabetes' };
  return { status: 'Normal', conditionKey: 'general-healthy-diet' };
}

function classifyBp({ systolic, diastolic }) {
  const s = Number(systolic), d = Number(diastolic);
  if (s < 90 || d < 60) return { status: 'Low BP', conditionKey: 'hypotension' };
  if (s < 120 && d < 80) return { status: 'Normal BP', conditionKey: 'general-healthy-diet' };
  if (s < 130 && d < 80) return { status: 'Elevated BP', conditionKey: 'hypertension' };
  if ((s >= 130 && s < 140) || (d >= 80 && d < 90)) return { status: 'Stage 1 Hypertension', conditionKey: 'hypertension' };
  return { status: 'Stage 2 Hypertension', conditionKey: 'hypertension' };
}

async function assignPlan(user, conditionKey, reason) {
  const recent = await store.getDietHistory(user.id, 3);
  const recentIds = new Set(recent.map(h => h.dietPlan?.id || h.dietPlan));
  const conditionPlans = await store.getDietPlans({ conditionKey });
  let plan = conditionPlans.find(p => !recentIds.has(p.id)) || conditionPlans[0];
  if (!plan) plan = (await store.getDietPlans({ conditionKey: 'general-healthy-diet' }))[0];
  if (!plan) return null;
  await store.replaceOpenDietHistory(user.id);
  const healthConditions = Array.from(new Set([...(user.healthConditions || []), conditionKey]));
  await store.updateUser(user.id, { currentDietPlan: plan.id, currentDietAssignedAt: store.now(), healthConditions });
  await store.addDietHistory({ user: user.id, dietPlan: plan.id, conditionKey, reason });
  return plan;
}

router.get('/conditions', async (req, res) => {
  const conditions = await store.getHealthConditions();
  res.json({ success: true, conditions });
});

router.get('/plans', async (req, res) => {
  const plans = await store.getDietPlans(req.query.condition ? { conditionKey: req.query.condition } : {});
  plans.sort((a, b) => (a.conditionName + a.name).localeCompare(b.conditionName + b.name));
  res.json({ success: true, plans });
});

router.get('/dashboard', requireAuth, async (req, res) => {
  const history = await store.getDietHistory(req.user.id, 8);
  const progress = await store.getProgress(req.user.id, 10);
  const current = typeof req.user.currentDietPlan === 'object' ? req.user.currentDietPlan : await store.getDietPlanById(req.user.currentDietPlan);
  const currentBmi = bmi(req.user.height, req.user.weight);
  res.json({ success: true, user: req.user, currentDietPlan: current, bmi: currentBmi, healthProgress: progress, previousDietPlans: history, waterIntake: current?.recommendedWaterIntake, dailyCalories: current?.nutrition?.calories });
});

router.post('/recommend', requireAuth, async (req, res) => {
  const conditionKey = req.body.conditionKey || req.body.healthCondition || 'general-healthy-diet';
  const plan = await assignPlan(req.user, conditionKey === 'none' ? 'general-healthy-diet' : conditionKey, 'manual');
  res.json({ success: true, plan });
});

router.post('/assess/diabetes', requireAuth, async (req, res) => {
  const assessment = classifyDiabetes(req.body);
  const plan = await assignPlan(req.user, assessment.conditionKey, 'assessment');
  res.json({ success: true, assessment, plan });
});

router.post('/assess/blood-pressure', requireAuth, async (req, res) => {
  const assessment = classifyBp(req.body);
  const plan = await assignPlan(req.user, assessment.conditionKey, 'assessment');
  res.json({ success: true, assessment, plan });
});

router.post('/rotate', requireAuth, async (req, res) => {
  const assignedAt = req.user.currentDietAssignedAt ? new Date(req.user.currentDietAssignedAt) : new Date(0);
  const months = (Date.now() - assignedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (months < 3 && !req.body.force) return res.json({ success: true, rotated: false, message: 'Diet rotation is due every 3 months' });
  const key = req.user.healthConditions?.[0] || 'general-healthy-diet';
  const plan = await assignPlan(req.user, key, 'rotation');
  res.json({ success: true, rotated: true, plan });
});

module.exports = router;
