const Tesseract = require('tesseract.js');
const fs = require('fs');

async function scanReceiptImage(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Receipt image file not found: ${filePath}`);
  }

  console.log(`OCR: Scanning receipt file ${filePath} with Tesseract.js...`);
  
  try {
    const result = await Tesseract.recognize(filePath, 'eng', {
      logger: m => console.log(`OCR Progress: ${(m.progress * 100).toFixed(1)}% (${m.status})`)
    });

    const text = result.data.text;
    console.log('OCR Raw Text Extracted:\n', text);

    const parsedDetails = parseReceiptText(text);
    return {
      rawText: text,
      ...parsedDetails
    };
  } catch (error) {
    console.error('OCR scanning error:', error);
    throw error;
  }
}

function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Extract Vendor (First non-empty line, or line that is not a date/time/number)
  let vendor = 'Unknown Merchant';
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    // Exclude lines with dates, times, phone numbers, or typical receipt headers
    if (!/\d{2,4}[-/\.]\d{2}[-/\.]\d{2,4}/.test(line) && 
        !/\b(tel|phone|store|welcome|receipt|tax|invoice)\b/i.test(line) && 
        !/^\$?[\d\.,\s]+$/.test(line) &&
        line.length > 2) {
      vendor = line;
      break;
    }
  }

  // 2. Extract Date
  let date = new Date().toISOString().split('T')[0]; // Default to today
  const dateRegex = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/g;
  const isoDateRegex = /\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/g;
  
  let match;
  // Try ISO date YYYY-MM-DD
  if ((match = isoDateRegex.exec(text)) !== null) {
    date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  } else if ((match = dateRegex.exec(text)) !== null) {
    let year = match[3];
    if (year.length === 2) {
      year = '20' + year; // assume 20xx for 2-digit years
    }
    // We assume standard US date MM/DD/YYYY or generic DD/MM/YYYY.
    // Let's check which is more valid (if month > 12, swap)
    let month = parseInt(match[1]);
    let day = parseInt(match[2]);
    if (month > 12) {
      const temp = month;
      month = day;
      day = temp;
    }
    date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  // 3. Extract Amount
  let amount = 0.0;
  // Look for lines containing "total", "net", "amount due", "due", "balance", etc.
  const totalKeywords = /\b(total|due|net|balance|visa|mc|cash|charge|amount)\b/i;
  const decimalRegex = /\b\$?([0-9]{1,4}[\.,][0-9]{2})\b/g;
  
  let amountsFound = [];
  let lineAmounts = [];
  
  for (const line of lines) {
    const matches = line.match(decimalRegex);
    if (matches) {
      for (const m of matches) {
        const val = parseFloat(m.replace('$', '').replace(',', '.'));
        if (!isNaN(val)) {
          amountsFound.push(val);
          if (totalKeywords.test(line)) {
            lineAmounts.push({ line, val });
          }
        }
      }
    }
  }

  // If there are lines matching total keywords, take the largest amount from those lines
  if (lineAmounts.length > 0) {
    // Sort descending
    lineAmounts.sort((a, b) => b.val - a.val);
    amount = lineAmounts[0].val;
  } else if (amountsFound.length > 0) {
    // Otherwise, take the largest amount found anywhere on the receipt
    amount = Math.max(...amountsFound);
  }

  return {
    vendor: vendor.replace(/[^a-zA-Z0-9\s&'\-\.]/g, '').trim(),
    amount: amount,
    date: date
  };
}

module.exports = {
  scanReceiptImage
};
