export const environment = {
  production: false,
  openaiApiKey: '',
  geminiApiKey: '', // Set via .env file or environment variable (see README.md)
  useFirebaseFunctions: false, // Set to true to use Firebase Functions (recommended for production)
  firebaseConfig: {
    apiKey: 'AIzaSyBh_luw17BOgqmndHRmLpZrDYnV0p0bV0I',
    authDomain: 'learner-s-career-path.firebaseapp.com',
    projectId: 'learner-s-career-path',
    storageBucket: 'learner-s-career-path.firebasestorage.app',
    messagingSenderId: '2366881853',
    appId: '1:2366881853:web:0e5966a7fac784b20c6a54',
    measurementId: 'G-CY6RMKXW1V'
  }
};
