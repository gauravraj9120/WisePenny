const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');

const defaultData = {
  expenses: [],
  budget: {
    monthlyLimit: 1000,
    alertThreshold: 0.8, // 80%
    alertEmail: 'user@example.com'
  },
  sentAlerts: []
};

// Ensure data folder exists
const ensureDirectoryExists = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

function readDb() {
  ensureDirectoryExists(dbPath);
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
    return defaultData;
  }
  try {
    const content = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading database file, resetting to defaults:', error);
    return defaultData;
  }
}

function writeDb(data) {
  ensureDirectoryExists(dbPath);
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  getExpenses() {
    const db = readDb();
    return db.expenses || [];
  },
  addExpense(expense) {
    const db = readDb();
    const newExpense = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      date: new Date().toISOString().split('T')[0],
      notes: '',
      scanned: false,
      ...expense,
      amount: parseFloat(expense.amount) || 0
    };
    db.expenses.push(newExpense);
    writeDb(db);
    return newExpense;
  },
  deleteExpense(id) {
    const db = readDb();
    const index = db.expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      const deleted = db.expenses.splice(index, 1)[0];
      writeDb(db);
      return deleted;
    }
    return null;
  },
  getBudget() {
    const db = readDb();
    return db.budget || defaultData.budget;
  },
  updateBudget(newBudget) {
    const db = readDb();
    db.budget = {
      ...db.budget,
      ...newBudget,
      monthlyLimit: parseFloat(newBudget.monthlyLimit) || 0,
      alertThreshold: parseFloat(newBudget.alertThreshold) || 0.8
    };
    writeDb(db);
    return db.budget;
  },
  getSentAlerts() {
    const db = readDb();
    return db.sentAlerts || [];
  },
  addSentAlert(alert) {
    const db = readDb();
    db.sentAlerts.push({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...alert
    });
    writeDb(db);
  }
};
