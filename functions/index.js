/**
 * Firebase Functions for Learner's Career Path
 * 
 * These functions run server-side, keeping API keys secure
 */

const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Get career market data (job openings, salary ranges)
 * This keeps the Gemini API key secure on the server
 */
exports.getCareerMarketData = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { careerName, countryCode } = req.body;

    if (!careerName) {
      res.status(400).json({ error: 'careerName is required' });
      return;
    }

    if (!genAI) {
      res.status(500).json({ error: 'Gemini API key not configured. Set it using: firebase functions:config:set gemini.api_key="YOUR_KEY"' });
      return;
    }

    // Build prompt
    const countryContext = countryCode ? ` in ${getCountryName(countryCode)}` : '';
    const prompt = `Provide current market information for the career "${careerName}"${countryContext}. 

Return a JSON object with this exact structure:
{
  "jobOpenings": [
    {
      "source": "LinkedIn",
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "url": "https://..."
    }
  ],
  "salaryRange": {
    "min": 30000,
    "max": 50000,
    "currency": "USD",
    "period": "yearly",
    "source": "Glassdoor"
  },
  "marketTrend": "growing"
}

Requirements:
1. Provide 3-5 current job openings from major platforms (LinkedIn, Indeed, Glassdoor)
2. Include entry-level salary range based on current market data
3. Indicate market trend: "growing", "stable", "declining", or "unknown"
4. Use realistic, current data based on 2024 market conditions
5. If country-specific, adjust salary to local currency and market rates

Career: ${careerName}
${countryCode ? `Country: ${getCountryName(countryCode)}` : ''}`;

    // Use Gemini AI
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // Fast and widely available model
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      },
      systemInstruction: 'You are a career market analyst. Provide accurate, current information about job markets and salaries. Return data in JSON format only.'
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    const marketData = {
      careerName,
      jobOpenings: data.jobOpenings || [],
      salaryRange: data.salaryRange || null,
      marketTrend: data.marketTrend || 'unknown',
      lastUpdated: new Date().toISOString(),
      loading: false,
      error: false
    };

    res.json(marketData);
  } catch (error) {
    console.error('Error in getCareerMarketData:', error);
    res.status(500).json({
      error: 'Failed to fetch market data',
      message: error.message
    });
  }
});

/**
 * Helper function to get country name from code
 */
function getCountryName(code) {
  const countries = {
    'KE': 'Kenya', 'NG': 'Nigeria', 'ZA': 'South Africa', 'GH': 'Ghana',
    'TZ': 'Tanzania', 'UG': 'Uganda', 'RW': 'Rwanda', 'ET': 'Ethiopia',
    'EG': 'Egypt', 'MA': 'Morocco', 'US': 'United States', 'UK': 'United Kingdom',
    'CA': 'Canada', 'AU': 'Australia'
  };
  return countries[code] || code;
}

