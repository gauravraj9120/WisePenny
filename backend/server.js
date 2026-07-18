require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const { scanReceiptImage } = require('./services/ocr');
const { getLocalCategory, analyzeReceiptWithAI } = require('./services/ai');
const { sendAlertEmail } = require('./services/mailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & Body Parsing
app.use(cors());
app.use(express.json());

// Setup Multer for upload files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const upload = multer({ dest: uploadsDir });

/**
 * Helper to calculate total spending in a given month
 */
function getMonthlySpending(monthStr) {
  const expenses = db.getExpenses();
  return expenses
    .filter(e => e.date && e.date.startsWith(monthStr))
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Check budget threshold and send email alerts if needed
 */
async function checkBudgetAndAlert(newExpenseAmount = 0) {
  const budget = db.getBudget();
  const currentMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  const currentTotal = getMonthlySpending(currentMonth);

  const thresholdAmount = budget.monthlyLimit * budget.alertThreshold;

  // Check if current spending is over the alert threshold
  if (currentTotal >= thresholdAmount) {
    const sentAlerts = db.getSentAlerts();
    // Check if we already sent an alert for this month
    const alreadyAlerted = sentAlerts.some(alert => alert.month === currentMonth && alert.thresholdExceeded === budget.alertThreshold);

    if (!alreadyAlerted) {
      console.log(`Budget: Exceeded threshold of ${budget.alertThreshold * 100}% for ${currentMonth}. Current: $${currentTotal.toFixed(2)}, Limit: $${budget.monthlyLimit.toFixed(2)}. Sending email alert...`);
      
      const subject = `⚠️ WisePenny Alert: Budget Threshold Exceeded (${(budget.alertThreshold * 100).toFixed(0)}%)`;
      const text = `Warning: Your total monthly spending for ${currentMonth} has reached $${currentTotal.toFixed(2)}, which is ${(budget.alertThreshold * 100).toFixed(0)}% of your limit of $${budget.monthlyLimit.toFixed(2)}.`;
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1f2937; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">WisePenny</h1>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 5px;">Smart Budget Monitoring</p>
          </div>
          <div style="background-color: #111827; border-left: 4px solid #ef4444; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <h2 style="color: #ef4444; font-size: 18px; margin: 0 0 10px 0;">Budget Alert Triggered</h2>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #d1d5db;">
              Your monthly spending for <strong>${currentMonth}</strong> has reached <strong>$${currentTotal.toFixed(2)}</strong>, exceeding your budget threshold configuration.
            </p>
          </div>
          <div style="margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #1f2937; color: #9ca3af;">Monthly Budget Limit</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #1f2937; text-align: right; font-weight: bold; color: #f3f4f6;">$${budget.monthlyLimit.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #1f2937; color: #9ca3af;">Alert Threshold Limit (${(budget.alertThreshold * 100).toFixed(0)}%)</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #1f2937; text-align: right; font-weight: bold; color: #f59e0b;">$${thresholdAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #1f2937; color: #9ca3af;">Current Spending</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #1f2937; text-align: right; font-weight: bold; color: #ef4444;">$${currentTotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.4);">Open Dashboard</a>
          </div>
          <div style="margin-top: 40px; border-top: 1px solid #1f2937; padding-top: 20px; text-align: center; font-size: 12px; color: #4b5563;">
            This is an automated alert from your WisePenny Expense Tracker.
          </div>
        </div>
      `;

      try {
        const mailResult = await sendAlertEmail(subject, text, html);
        db.addSentAlert({
          month: currentMonth,
          thresholdExceeded: budget.alertThreshold,
          totalAtTrigger: currentTotal,
          previewUrl: mailResult.previewUrl || null
        });
      } catch (err) {
        console.error('Error sending budget warning email:', err);
      }
    }
  }
}

// --- API ROUTES ---

// 1. Get Expenses
app.get('/api/expenses', (req, res) => {
  const expenses = db.getExpenses();
  // Sort by date desc
  expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(expenses);
});

// 2. Add Expense
app.post('/api/expenses', async (req, res) => {
  try {
    const expenseData = req.body;
    if (!expenseData.title || !expenseData.amount) {
      return res.status(400).json({ error: 'Title and Amount are required.' });
    }

    // Auto-categorize if not provided
    if (!expenseData.category) {
      expenseData.category = getLocalCategory(expenseData.title);
    }

    const newExpense = db.addExpense(expenseData);
    
    // Check budget in background asynchronously
    checkBudgetAndAlert(newExpense.amount).catch(err => console.error('Alert checker failed:', err));

    res.status(201).json(newExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete Expense
app.delete('/api/expenses/:id', (req, res) => {
  const deleted = db.deleteExpense(req.params.id);
  if (deleted) {
    res.json({ message: 'Expense deleted successfully.', expense: deleted });
  } else {
    res.status(404).json({ error: 'Expense not found.' });
  }
});

// 4. Get Budget Info (limits + current spending)
app.get('/api/budget', (req, res) => {
  const budget = db.getBudget();
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentSpending = getMonthlySpending(currentMonth);
  const sentAlerts = db.getSentAlerts();

  res.json({
    config: budget,
    currentMonth,
    currentSpending,
    sentAlerts
  });
});

// 5. Update Budget Limit
app.post('/api/budget', (req, res) => {
  const budgetData = req.body;
  const updated = db.updateBudget(budgetData);
  res.json(updated);
});

// 6. Upload Receipt for OCR Scanning
app.post('/api/scan-receipt', upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No receipt file uploaded.' });
  }

  const filePath = req.file.path;

  try {
    // 1. Extract raw text with local OCR (Tesseract.js)
    const ocrResult = await scanReceiptImage(filePath);
    
    // 2. Try to run Gemini AI analysis for optimal details and categorization
    let finalDetails = await analyzeReceiptWithAI(ocrResult.rawText);

    // 3. Fallback to Tesseract parsed results + local categorizer if Gemini failed or is not available
    if (!finalDetails) {
      console.log('AI Scanner: Utilizing regex parser fallback details.');
      const fallbackCategory = getLocalCategory(ocrResult.vendor, '');
      finalDetails = {
        vendor: ocrResult.vendor || 'Unknown Merchant',
        amount: ocrResult.amount || 0.0,
        date: ocrResult.date || new Date().toISOString().split('T')[0],
        category: fallbackCategory,
        notes: 'Scanned receipt details parsed with local parser.'
      };
    }

    res.json({
      success: true,
      data: {
        title: finalDetails.vendor,
        amount: finalDetails.amount,
        date: finalDetails.date,
        category: finalDetails.category,
        notes: finalDetails.notes,
        scanned: true
      }
    });

  } catch (err) {
    console.error('Scan Receipt API error:', err);
    res.status(500).json({ error: 'Failed to process receipt image. ' + err.message });
  } finally {
    // Delete temp file asynchronously
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error cleaning up receipt upload:', err);
    });
  }
});

// Start Express App
app.listen(PORT, () => {
  console.log(`======================================================`);
  console.log(`🚀 WisePenny Express Backend running on port ${PORT}`);
  console.log(`======================================================`);
});
