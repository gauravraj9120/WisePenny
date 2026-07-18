require('dotenv').config();

// Allowed categories
const CATEGORIES = ['Food', 'Travel', 'Utilities', 'Shopping', 'Entertainment', 'Others'];

/**
 * Local rule-based categorizer fallback
 */
function getLocalCategory(vendor = '', title = '') {
  const text = `${vendor} ${title}`.toLowerCase();

  if (/\b(mcdonald|starbucks|burger|subway|pizza|restaurant|food|cater|eats|grill|cafe|coffee|kfc|dunkin|bakery|uber\s*eats|door\s*dash|grubhub|walmart\s*grocery|safeway|kroger|aldi|whole\s*foods)\b/.test(text)) {
    return 'Food';
  }
  if (/\b(uber|lyft|taxi|transit|subway|metro|train|airline|flight|delta|united|gas|chevron|shell|mobil|petrol|parking|toll|railway|travel|booking|expedia|airbnb)\b/.test(text)) {
    return 'Travel';
  }
  if (/\b(electric|water|power|gas|internet|comcast|at&t|verizon|phone|trash|waste|sewer|utilities|bill|insurance)\b/.test(text)) {
    return 'Utilities';
  }
  if (/\b(amazon|walmart|target|costco|grocer|market|supermarket|clothing|mall|store|buy|shop|nordstrom|nike|adidas|hm|zara|ebay|best\s*buy|ikea)\b/.test(text)) {
    return 'Shopping';
  }
  if (/\b(cinema|theater|movie|concert|ticket|game|steam|playstation|xbox|nintendo|spotify|netflix|disney|music|museum|zoo|bowling|golf|entertainment|show)\b/.test(text)) {
    return 'Entertainment';
  }

  return 'Others';
}

/**
 * AI-powered receipt text analysis (using Gemini API) with automatic local fallback
 */
async function analyzeReceiptWithAI(rawText) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('AI Services: GEMINI_API_KEY is not defined. Skipping AI analysis, using regex parsing logic.');
    return null;
  }

  console.log('AI Services: Calling Gemini API for receipt parsing and categorization...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptText = `
    You are an expert receipt parser. Analyze the raw text of the receipt below and return a JSON object.
    The response MUST be valid JSON matching this schema:
    {
      "vendor": "Parsed Vendor Name",
      "amount": 123.45,
      "date": "YYYY-MM-DD",
      "category": "Food | Travel | Utilities | Shopping | Entertainment | Others",
      "notes": "Short list of items bought"
    }

    The category field MUST be exactly one of: Food, Travel, Utilities, Shopping, Entertainment, Others.
    If date or amount cannot be found, fallback to empty or 0.
    Do not add markdown formatting or explanation outside of the raw JSON code.

    Raw Receipt Text:
    """
    ${rawText}
    """
  `;

  const requestBody = {
    contents: [
      {
        parts: [{ text: promptText }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const resJson = await response.json();
    const generatedJsonText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (generatedJsonText) {
      const parsedData = JSON.parse(generatedJsonText.trim());
      // Ensure category is valid
      if (!CATEGORIES.includes(parsedData.category)) {
        parsedData.category = getLocalCategory(parsedData.vendor, parsedData.notes);
      }
      return parsedData;
    }
    throw new Error('No content returned from Gemini API candidates');
  } catch (error) {
    console.error('AI Services: Gemini API error:', error.message);
    console.log('AI Services: Falling back to regex parsed output.');
    return null;
  }
}

module.exports = {
  getLocalCategory,
  analyzeReceiptWithAI,
  CATEGORIES
};
