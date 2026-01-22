/**
 * Firebase Functions for Learner's Career Path
 * 
 * These functions run server-side, keeping API keys secure
 */

const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createRateLimiter } = require('./rate-limiter');

// Initialize Gemini AI with API key from Firebase Functions config
// Set using: firebase functions:config:set gemini.api_key="YOUR_KEY"
const functionsConfig = functions.config();
const geminiApiKey = functionsConfig.gemini?.api_key || process.env.GEMINI_API_KEY || '';
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Rate limiter: 50 requests per minute per IP
const rateLimiter = createRateLimiter(50, 60000);

/**
 * Get career market data (job openings, salary ranges)
 * This keeps the Gemini API key secure on the server
 */
const ALLOWED_ORIGINS = [
  'https://learner-s-career-path.web.app',
  'https://learner-s-career-path.firebaseapp.com',
  'http://localhost:4200',
  'http://localhost:5000'
];

function setCORSHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Credentials', 'true');
}

exports.getCareerMarketData = functions.https.onRequest(async (req, res) => {
  setCORSHeaders(req, res);
  
  // Apply rate limiting
  rateLimiter(req, res, () => {});
  if (res.headersSent) return;

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

    if (!careerName || typeof careerName !== 'string' || careerName.trim().length === 0) {
      res.status(400).json({ error: 'Valid careerName is required' });
      return;
    }

    if (careerName.length > 100) {
      res.status(400).json({ error: 'careerName is too long' });
      return;
    }

    const sanitizedCareerName = careerName.trim().substring(0, 100);
    const sanitizedCountryCode = countryCode && typeof countryCode === 'string' 
      ? countryCode.trim().substring(0, 10) 
      : undefined;

    if (!genAI || !geminiApiKey) {
      res.status(500).json({ 
        error: 'Gemini API key not configured',
        message: 'Set it using: firebase functions:config:set gemini.api_key="YOUR_KEY" then redeploy functions'
      });
      return;
    }

    // Build prompt
    const countryContext = sanitizedCountryCode ? ` in ${getCountryName(sanitizedCountryCode)}` : '';
    const prompt = `Provide current market information for the career "${sanitizedCareerName}"${countryContext}. 

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

Career: ${sanitizedCareerName}
${sanitizedCountryCode ? `Country: ${getCountryName(sanitizedCountryCode)}` : ''}`;

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
      careerName: sanitizedCareerName,
      jobOpenings: data.jobOpenings || [],
      salaryRange: data.salaryRange || null,
      marketTrend: data.marketTrend || 'unknown',
      lastUpdated: new Date().toISOString(),
      loading: false,
      error: false
    };

    res.json(marketData);
  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    res.status(500).json({
      error: 'Failed to fetch market data',
      message: 'An error occurred while fetching market data. Please try again later.'
    });
  }
});

/**
 * Generate study resources using Gemini AI
 * This keeps the Gemini API key secure on the server
 */
exports.generateStudyResources = functions.https.onRequest(async (req, res) => {
  setCORSHeaders(req, res);
  
  // Apply rate limiting
  rateLimiter(req, res, () => {});
  if (res.headersSent) return;

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { subject, gradeLevel, countryCode, countryName, careerName } = req.body;

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      res.status(400).json({ error: 'Valid subject is required' });
      return;
    }

    if (!gradeLevel || typeof gradeLevel !== 'string' || gradeLevel.trim().length === 0) {
      res.status(400).json({ error: 'Valid gradeLevel is required' });
      return;
    }

    if (!countryCode || typeof countryCode !== 'string' || countryCode.trim().length === 0) {
      res.status(400).json({ error: 'Valid countryCode is required' });
      return;
    }

    const sanitizedSubject = subject.trim().substring(0, 50);
    const sanitizedGradeLevel = gradeLevel.trim().substring(0, 20);
    const sanitizedCountryCode = countryCode.trim().substring(0, 10);
    const sanitizedCountryName = countryName && typeof countryName === 'string' 
      ? countryName.trim().substring(0, 50) 
      : undefined;
    const sanitizedCareerName = careerName && typeof careerName === 'string' 
      ? careerName.trim().substring(0, 100) 
      : undefined;

    if (!genAI || !geminiApiKey) {
      res.status(500).json({ 
        error: 'Gemini API key not configured',
        message: 'Set it using: firebase functions:config:set gemini.api_key="YOUR_KEY" then redeploy functions'
      });
      return;
    }

    const prompt = `Generate comprehensive study resources for ${sanitizedSubject} at ${sanitizedGradeLevel} level in ${sanitizedCountryName || sanitizedCountryCode}.

${sanitizedCareerName ? `Context: The student is interested in pursuing a career as ${sanitizedCareerName}.` : ''}

Return a JSON object with this exact structure:
{
  "subject": "${sanitizedSubject}",
  "gradeLevel": "${sanitizedGradeLevel}",
  "country": "${sanitizedCountryName || sanitizedCountryCode}",
  "resources": {
    "studyTips": ["tip 1", "tip 2", "tip 3"],
    "keyTopics": ["topic 1", "topic 2", "topic 3"],
    "practiceResources": ["resource 1", "resource 2"],
    "examPreparation": ["prep tip 1", "prep tip 2"]
  },
  "careerRelevance": "${careerName ? `How ${subject} relates to ${careerName}` : 'General importance of this subject'}"
}

Requirements:
1. Provide 3-5 practical study tips
2. List 5-7 key topics to focus on
3. Suggest 2-3 practice resources (websites, books, apps)
4. Include 2-3 exam preparation strategies
5. Make content relevant to ${sanitizedCountryName || sanitizedCountryCode} curriculum
${sanitizedCareerName ? `6. Explain how ${sanitizedSubject} relates to ${sanitizedCareerName}` : ''}
7. Use clear, actionable language`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      },
      systemInstruction: 'You are an educational advisor. Provide practical, actionable study resources tailored to the specific grade level and country curriculum. Return data in JSON format only.'
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    const studyResource = {
      subject: data.subject || sanitizedSubject,
      gradeLevel: data.gradeLevel || sanitizedGradeLevel,
      country: data.country || sanitizedCountryName || sanitizedCountryCode,
      resources: data.resources || {
        studyTips: [],
        keyTopics: [],
        practiceResources: [],
        examPreparation: []
      },
      careerRelevance: data.careerRelevance || '',
      lastUpdated: new Date().toISOString()
    };

    res.json(studyResource);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate study resources',
      message: 'An error occurred while generating study resources. Please try again later.'
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
    'CA': 'Canada', 'AU': 'Australia', 'ZW': 'Zimbabwe'
  };
  return countries[code] || code;
}

