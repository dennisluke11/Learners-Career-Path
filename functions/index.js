/**
 * Firebase Functions for Learner's Career Path
 * 
 * These functions run server-side, keeping API keys secure
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createRateLimiter } = require('./rate-limiter');

// Initialize Firebase Admin
admin.initializeApp();

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
 * Send push notification to all users in specified country(ies)
 * Manual trigger endpoint for country-based notifications
 * 
 * Usage:
 * curl -X POST https://your-function-url/sendCountryNotification \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "countries": ["ZA"],
 *     "title": "New Scholarship Available!",
 *     "body": "Check out the new opportunities for South African students",
 *     "image": "https://example.com/image.jpg",
 *     "data": {
 *       "announcementId": "abc123",
 *       "type": "scholarship"
 *     }
 *   }'
 */
exports.sendCountryNotification = functions.https.onRequest(async (req, res) => {
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
    const { countries, title, body, image, data } = req.body;

    // Validate required fields
    if (!countries || !Array.isArray(countries) || countries.length === 0) {
      res.status(400).json({ 
        error: 'Invalid countries',
        message: 'countries must be a non-empty array of country codes (e.g., ["ZA", "KE"])'
      });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ 
        error: 'Invalid title',
        message: 'title is required and must be a non-empty string'
      });
      return;
    }

    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      res.status(400).json({ 
        error: 'Invalid body',
        message: 'body is required and must be a non-empty string'
      });
      return;
    }

    // Sanitize inputs
    const sanitizedCountries = countries
      .filter(code => typeof code === 'string' && code.trim().length > 0)
      .map(code => code.trim().toUpperCase())
      .slice(0, 10); // Limit to 10 countries max

    if (sanitizedCountries.length === 0) {
      res.status(400).json({ 
        error: 'Invalid countries',
        message: 'No valid country codes provided'
      });
      return;
    }

    const sanitizedTitle = title.trim().substring(0, 100);
    const sanitizedBody = body.trim().substring(0, 500);
    const sanitizedImage = image && typeof image === 'string' && image.trim().length > 0
      ? image.trim().substring(0, 500)
      : undefined;

    // Get all FCM tokens for users in the specified countries
    const db = admin.firestore();
    const tokensRef = db.collection('fcmTokens');
    
    const tokensByCountry = {};
    const results = {
      totalSent: 0,
      totalFailed: 0,
      countries: {}
    };

    // Query tokens for each country
    for (const countryCode of sanitizedCountries) {
      try {
        const snapshot = await tokensRef
          .where('country', '==', countryCode)
          .get();

        const tokens = [];
        snapshot.forEach(doc => {
          const tokenData = doc.data();
          if (tokenData.token) {
            tokens.push(tokenData.token);
          }
        });

        tokensByCountry[countryCode] = tokens;
        results.countries[countryCode] = {
          tokensFound: tokens.length,
          sent: 0,
          failed: 0
        };
      } catch (error) {
        console.error(`Error querying tokens for country ${countryCode}:`, error);
        results.countries[countryCode] = {
          tokensFound: 0,
          sent: 0,
          failed: 0,
          error: error.message
        };
      }
    }

    // Prepare notification payload
    const notificationPayload = {
      notification: {
        title: sanitizedTitle,
        body: sanitizedBody,
        ...(sanitizedImage && { image: sanitizedImage })
      },
      data: {
        ...(data && typeof data === 'object' ? data : {}),
        click_action: 'FLUTTER_NOTIFICATION_CLICK' // For deep linking
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send notifications to all tokens
    const allTokens = Object.values(tokensByCountry).flat();
    
    if (allTokens.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No tokens found for specified countries',
        results
      });
      return;
    }

    // Send in batches (FCM allows up to 500 tokens per batch)
    const batchSize = 500;
    const batches = [];
    
    for (let i = 0; i < allTokens.length; i += batchSize) {
      batches.push(allTokens.slice(i, i + batchSize));
    }

    // Send notifications
    for (const batch of batches) {
      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          ...notificationPayload
        });

        // Track results
        results.totalSent += response.successCount;
        results.totalFailed += response.failureCount;

        // Update country-specific results
        // Note: This is approximate since we're batching across countries
        // For exact per-country tracking, you'd need to send separately per country
        response.responses.forEach((resp, index) => {
          if (resp.success) {
            // Find which country this token belongs to
            const token = batch[index];
            for (const [countryCode, tokens] of Object.entries(tokensByCountry)) {
              if (tokens.includes(token) && results.countries[countryCode]) {
                results.countries[countryCode].sent++;
                break;
              }
            }
          } else {
            // Find which country this token belongs to
            const token = batch[index];
            for (const [countryCode, tokens] of Object.entries(tokensByCountry)) {
              if (tokens.includes(token) && results.countries[countryCode]) {
                results.countries[countryCode].failed++;
                break;
              }
            }
          }
        });

        // Clean up invalid tokens
        response.responses.forEach((resp, index) => {
          if (!resp.success && (
            resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered'
          )) {
            // Remove invalid token from Firestore
            const token = batch[index];
            tokensRef.where('token', '==', token).get().then(snapshot => {
              snapshot.forEach(doc => doc.ref.delete());
            }).catch(err => console.error('Error deleting invalid token:', err));
          }
        });

      } catch (error) {
        console.error('Error sending notification batch:', error);
        results.totalFailed += batch.length;
      }
    }

    res.status(200).json({
      success: true,
      message: `Notifications sent to ${results.totalSent} devices across ${sanitizedCountries.length} country(ies)`,
      results
    });

  } catch (error) {
    console.error('Error in sendCountryNotification:', error);
    res.status(500).json({
      error: 'Failed to send notifications',
      message: error.message || 'An error occurred while sending notifications'
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

