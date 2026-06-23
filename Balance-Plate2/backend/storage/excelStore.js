const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ExcelJS = require('exceljs');

const workbookPath = path.join(__dirname, '..', '..', 'data', 'balance-plate-data.xlsx');

const SHEETS = {
  users: {
    name: 'Users',
    headers: ['id','fullName','username','email','mobileNumber','passwordHash','age','gender','height','weight','healthConditions','role','registrationDate','lastLoginDate','currentDietPlan','currentDietAssignedAt']
  },
  dietPlans: {
    name: 'DietPlans',
    headers: ['id','slug','name','conditionKey','conditionName','breakfast','lunch','snacks','dinner','foodsToAvoid','recommendedWaterIntake','nutrition','rotationGroup','isActive','createdAt','updatedAt']
  },
  healthConditions: {
    name: 'HealthConditions',
    headers: ['id','key','name','description','markers','isActive','createdAt','updatedAt']
  },
  userProgress: {
    name: 'UserProgress',
    headers: ['id','user','weight','bmi','waterIntakeLiters','dailyCalories','notes','recordedAt','createdAt','updatedAt']
  },
  dietHistory: {
    name: 'DietHistory',
    headers: ['id','user','dietPlan','conditionKey','assignedAt','replacedAt','reason','createdAt','updatedAt']
  },
  loginHistory: {
    name: 'LoginHistory',
    headers: ['id','user','loginAt','ipAddress','userAgent','success','createdAt','updatedAt']
  }
};

let writeQueue = Promise.resolve();

function now() { return new Date().toISOString(); }
function id() { return crypto.randomUUID(); }
function json(value) { return JSON.stringify(value ?? []); }
function parseJson(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}
function bool(value) { return value === true || value === 'true' || value === 1 || value === '1'; }
function normalizeString(value) { return String(value || '').trim(); }

async function loadWorkbook() {
  await fs.promises.mkdir(path.dirname(workbookPath), { recursive: true });
  const workbook = new ExcelJS.Workbook();
  if (fs.existsSync(workbookPath)) {
    await workbook.xlsx.readFile(workbookPath);
  }
  let changed = false;
  Object.values(SHEETS).forEach(def => {
    let sheet = workbook.getWorksheet(def.name);
    if (!sheet) {
      sheet = workbook.addWorksheet(def.name);
      sheet.addRow(def.headers);
      changed = true;
    }
    const current = sheet.getRow(1).values.slice(1);
    if (def.headers.some((h, i) => current[i] !== h)) {
      sheet.spliceRows(1, 1, def.headers);
      changed = true;
    }
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2ECC71' } };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  });
  if (changed) await workbook.xlsx.writeFile(workbookPath);
  return workbook;
}

async function saveWorkbook(workbook) {
  await fs.promises.mkdir(path.dirname(workbookPath), { recursive: true });
  await workbook.xlsx.writeFile(workbookPath);
}

function withWrite(fn) {
  writeQueue = writeQueue.then(async () => {
    const workbook = await loadWorkbook();
    const result = await fn(workbook);
    await saveWorkbook(workbook);
    return result;
  });
  return writeQueue;
}

function sheetRows(workbook, key) {
  const def = SHEETS[key];
  const sheet = workbook.getWorksheet(def.name);
  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    def.headers.forEach((header, index) => {
      const cell = row.getCell(index + 1).value;
      obj[header] = cell instanceof Date ? cell.toISOString() : cell;
    });
    if (Object.values(obj).some(v => v !== null && v !== undefined && v !== '')) rows.push({ rowNumber, data: obj });
  });
  return rows;
}

function setRow(sheet, headers, rowNumber, data) {
  const row = sheet.getRow(rowNumber);
  headers.forEach((header, index) => { row.getCell(index + 1).value = data[header] ?? ''; });
  row.commit();
}

function userSafe(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    mobileNumber: user.mobileNumber,
    age: Number(user.age),
    gender: user.gender,
    height: Number(user.height),
    weight: Number(user.weight),
    healthConditions: parseJson(user.healthConditions, []),
    role: user.role || 'user',
    registrationDate: user.registrationDate,
    lastLoginDate: user.lastLoginDate,
    currentDietPlan: user.currentDietPlan,
    currentDietAssignedAt: user.currentDietAssignedAt
  };
}

function hydratePlan(row) {
  if (!row) return null;
  return {
    id: row.id || row.slug,
    slug: row.slug,
    name: row.name,
    conditionKey: row.conditionKey,
    conditionName: row.conditionName,
    breakfast: parseJson(row.breakfast, []),
    lunch: parseJson(row.lunch, []),
    snacks: parseJson(row.snacks, []),
    dinner: parseJson(row.dinner, []),
    foodsToAvoid: parseJson(row.foodsToAvoid, []),
    recommendedWaterIntake: row.recommendedWaterIntake,
    nutrition: parseJson(row.nutrition, {}),
    rotationGroup: row.rotationGroup,
    isActive: bool(row.isActive)
  };
}

function serializePlan(plan) {
  const stamp = now();
  return {
    id: plan.id || plan.slug || id(),
    slug: plan.slug || plan.id,
    name: plan.name,
    conditionKey: plan.conditionKey,
    conditionName: plan.conditionName,
    breakfast: json(plan.breakfast),
    lunch: json(plan.lunch),
    snacks: json(plan.snacks),
    dinner: json(plan.dinner),
    foodsToAvoid: json(plan.foodsToAvoid),
    recommendedWaterIntake: plan.recommendedWaterIntake,
    nutrition: json(plan.nutrition),
    rotationGroup: plan.rotationGroup || plan.conditionKey || 'default',
    isActive: String(plan.isActive !== false),
    createdAt: plan.createdAt || stamp,
    updatedAt: stamp
  };
}

function hydrateCondition(row) {
  return row ? { id: row.id, key: row.key, name: row.name, description: row.description, markers: parseJson(row.markers, []), isActive: bool(row.isActive) } : null;
}

async function getUsers() {
  const workbook = await loadWorkbook();
  return sheetRows(workbook, 'users').map(r => userSafe(r.data));
}
async function getUserRawById(userId) {
  const workbook = await loadWorkbook();
  const found = sheetRows(workbook, 'users').find(r => r.data.id === userId);
  return found?.data || null;
}
async function findUser(predicate) {
  const workbook = await loadWorkbook();
  const found = sheetRows(workbook, 'users').find(r => predicate(r.data));
  return found?.data || null;
}
async function createUser(data) {
  return withWrite(async workbook => {
    const def = SHEETS.users;
    const sheet = workbook.getWorksheet(def.name);
    const stamp = now();
    const row = {
      id: data.id || id(),
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      mobileNumber: data.mobileNumber,
      passwordHash: data.passwordHash,
      age: data.age,
      gender: data.gender,
      height: data.height,
      weight: data.weight,
      healthConditions: json(data.healthConditions || []),
      role: data.role || 'user',
      registrationDate: data.registrationDate || stamp,
      lastLoginDate: data.lastLoginDate || '',
      currentDietPlan: data.currentDietPlan || '',
      currentDietAssignedAt: data.currentDietAssignedAt || ''
    };
    setRow(sheet, def.headers, sheet.rowCount + 1, row);
    return userSafe(row);
  });
}
async function updateUser(userId, patch) {
  return withWrite(async workbook => {
    const def = SHEETS.users;
    const sheet = workbook.getWorksheet(def.name);
    const found = sheetRows(workbook, 'users').find(r => r.data.id === userId);
    if (!found) return null;
    const updated = { ...found.data, ...patch };
    if (Array.isArray(updated.healthConditions)) updated.healthConditions = json(updated.healthConditions);
    setRow(sheet, def.headers, found.rowNumber, updated);
    return userSafe(updated);
  });
}
async function upsertUserByEmail(email, data) {
  const existing = await findUser(u => String(u.email).toLowerCase() === String(email).toLowerCase());
  if (existing) return updateUser(existing.id, data);
  return createUser(data);
}
async function addLoginHistory(data) {
  return withWrite(async workbook => {
    const def = SHEETS.loginHistory;
    const sheet = workbook.getWorksheet(def.name);
    const stamp = now();
    const row = { id: id(), user: data.user, loginAt: data.loginAt || stamp, ipAddress: data.ipAddress || '', userAgent: data.userAgent || '', success: String(data.success !== false), createdAt: stamp, updatedAt: stamp };
    setRow(sheet, def.headers, sheet.rowCount + 1, row);
    return row;
  });
}
async function getLoginHistory(limit = 100) {
  const workbook = await loadWorkbook();
  return sheetRows(workbook, 'loginHistory').map(r => r.data).sort((a,b) => String(b.loginAt).localeCompare(String(a.loginAt))).slice(0, limit);
}
async function replaceDietPlans(plans) {
  return withWrite(async workbook => {
    const def = SHEETS.dietPlans;
    const sheet = workbook.getWorksheet(def.name);
    if (sheet.rowCount > 1) sheet.spliceRows(2, sheet.rowCount - 1);
    plans.map(serializePlan).forEach(plan => setRow(sheet, def.headers, sheet.rowCount + 1, plan));
    return plans.length;
  });
}
async function replaceHealthConditions(conditions) {
  return withWrite(async workbook => {
    const def = SHEETS.healthConditions;
    const sheet = workbook.getWorksheet(def.name);
    if (sheet.rowCount > 1) sheet.spliceRows(2, sheet.rowCount - 1);
    const stamp = now();
    conditions.forEach(([key, name, description]) => setRow(sheet, def.headers, sheet.rowCount + 1, { id: key, key, name, description, markers: json([]), isActive: 'true', createdAt: stamp, updatedAt: stamp }));
    return conditions.length;
  });
}
async function getDietPlans(filter = {}) {
  const workbook = await loadWorkbook();
  return sheetRows(workbook, 'dietPlans').map(r => hydratePlan(r.data)).filter(p => p && p.isActive !== false).filter(p => !filter.conditionKey || p.conditionKey === filter.conditionKey);
}
async function getDietPlanById(planId) {
  const workbook = await loadWorkbook();
  const found = sheetRows(workbook, 'dietPlans').map(r => hydratePlan(r.data)).find(p => p.id === planId || p.slug === planId || p.conditionKey === planId);
  return found || null;
}
async function createDietPlan(plan) {
  return withWrite(async workbook => {
    const def = SHEETS.dietPlans;
    const sheet = workbook.getWorksheet(def.name);
    const row = serializePlan(plan);
    setRow(sheet, def.headers, sheet.rowCount + 1, row);
    return hydratePlan(row);
  });
}
async function updateDietPlan(planId, patch) {
  return withWrite(async workbook => {
    const def = SHEETS.dietPlans;
    const sheet = workbook.getWorksheet(def.name);
    const found = sheetRows(workbook, 'dietPlans').find(r => r.data.id === planId || r.data.slug === planId);
    if (!found) return null;
    const existing = hydratePlan(found.data);
    const row = serializePlan({ ...existing, ...patch, id: existing.id, slug: existing.slug, createdAt: found.data.createdAt });
    setRow(sheet, def.headers, found.rowNumber, row);
    return hydratePlan(row);
  });
}
async function getHealthConditions() {
  const workbook = await loadWorkbook();
  return sheetRows(workbook, 'healthConditions').map(r => hydrateCondition(r.data)).filter(c => c && c.isActive !== false);
}
async function createHealthCondition(data) {
  return withWrite(async workbook => {
    const def = SHEETS.healthConditions;
    const sheet = workbook.getWorksheet(def.name);
    const stamp = now();
    const row = { id: data.key || id(), key: data.key, name: data.name, description: data.description || '', markers: json(data.markers || []), isActive: String(data.isActive !== false), createdAt: stamp, updatedAt: stamp };
    setRow(sheet, def.headers, sheet.rowCount + 1, row);
    return hydrateCondition(row);
  });
}
async function addDietHistory(data) {
  return withWrite(async workbook => {
    const def = SHEETS.dietHistory;
    const sheet = workbook.getWorksheet(def.name);
    const stamp = now();
    const row = { id: id(), user: data.user, dietPlan: data.dietPlan, conditionKey: data.conditionKey || '', assignedAt: data.assignedAt || stamp, replacedAt: data.replacedAt || '', reason: data.reason || 'manual', createdAt: stamp, updatedAt: stamp };
    setRow(sheet, def.headers, sheet.rowCount + 1, row);
    return row;
  });
}
async function replaceOpenDietHistory(userId) {
  return withWrite(async workbook => {
    const def = SHEETS.dietHistory;
    const sheet = workbook.getWorksheet(def.name);
    const stamp = now();
    sheetRows(workbook, 'dietHistory').forEach(r => {
      if (r.data.user === userId && !r.data.replacedAt) {
        const updated = { ...r.data, replacedAt: stamp, updatedAt: stamp };
        setRow(sheet, def.headers, r.rowNumber, updated);
      }
    });
  });
}
async function getDietHistory(userId, limit = 8) {
  const workbook = await loadWorkbook();
  const plans = sheetRows(workbook, 'dietPlans').map(r => hydratePlan(r.data));
  return sheetRows(workbook, 'dietHistory').map(r => r.data).filter(r => !userId || r.user === userId).sort((a,b) => String(b.assignedAt).localeCompare(String(a.assignedAt))).slice(0, limit).map(r => ({ ...r, dietPlan: plans.find(p => p.id === r.dietPlan || p.slug === r.dietPlan) || null }));
}
async function getProgress(userId, limit = 10) {
  const workbook = await loadWorkbook();
  return sheetRows(workbook, 'userProgress').map(r => r.data).filter(r => r.user === userId).sort((a,b) => String(b.recordedAt).localeCompare(String(a.recordedAt))).slice(0, limit);
}
async function counts() {
  const workbook = await loadWorkbook();
  return {
    users: sheetRows(workbook, 'users').length,
    plans: sheetRows(workbook, 'dietPlans').length,
    conditions: sheetRows(workbook, 'healthConditions').length,
    logins: sheetRows(workbook, 'loginHistory').length
  };
}

module.exports = {
  workbookPath,
  loadWorkbook,
  getUsers,
  getUserRawById,
  findUser,
  createUser,
  updateUser,
  upsertUserByEmail,
  userSafe,
  addLoginHistory,
  getLoginHistory,
  replaceDietPlans,
  replaceHealthConditions,
  getDietPlans,
  getDietPlanById,
  createDietPlan,
  updateDietPlan,
  getHealthConditions,
  createHealthCondition,
  addDietHistory,
  replaceOpenDietHistory,
  getDietHistory,
  getProgress,
  counts,
  now
};
