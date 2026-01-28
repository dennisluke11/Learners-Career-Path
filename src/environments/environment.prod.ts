export const environment = {
  production: true,
  openaiApiKey: '', // Not used - OpenAI API not implemented
  geminiApiKey: '', // Not used in production - API calls go through Firebase Functions
  useFirebaseFunctions: true, // Use Firebase Functions for secure API key handling
  firebaseConfig: {
    apiKey: 'AIzaSyBh_luw17BOgqmndHRmLpZrDYnV0p0bV0I',
    authDomain: 'learner-s-career-path.firebaseapp.com',
    projectId: 'learner-s-career-path',
    storageBucket: 'learner-s-career-path.firebasestorage.app',
    messagingSenderId: '2366881853',
    appId: '1:2366881853:web:0e5966a7fac784b20c6a54',
    measurementId: 'G-CY6RMKXW1V'
  },
  // Firebase App Check - reCAPTCHA v3 site key
  // Get this from Firebase Console > Build > App Check > Register app
  recaptchaSiteKey: '' // Add your reCAPTCHA v3 site key here
};

