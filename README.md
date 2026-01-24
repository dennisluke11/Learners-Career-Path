# Learner's Career Path

A comprehensive Angular application that helps learners discover their desired career paths and track the improvements needed to achieve their goals. Built specifically for African high school students with support for multiple countries, curricula, and grade level systems.

## Key Features

### Reverse Eligibility System
Unlike traditional career matching apps, this app lets you:
- Select your desired career first → See exactly what improvements are needed per subject
- Goal-oriented approach with actionable insights
- Clear path forward to achieve your dream career

### Multi-Country Support
Supports 6+ African countries with different educational systems:
- **South Africa**: CAPS/NSC (Matric) - Grade 12
- **Kenya**: KCSE/CBC - Form 4
- **Nigeria**: WAEC/WASSCE - SS 3
- **Zimbabwe**: ZIMSEC - A-Level
- **Ethiopia**: General Education
- **Egypt**: Thanaweya Amma

### Real-Time Calculations
- Instant recalculation as you type grades
- Charts and progress bars update automatically
- Modern, responsive user experience

### Additional Features
- University Integration: Shows universities offering specific courses with requirements
- AI-Powered Market Data: Job market insights and trends
- Analytics Tracking: User behavior tracking
- PWA Support: Installable on iOS and Android devices

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd CareerPathWeb
   npm install
   ```

2. **Configure environment**
   
   Update `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     geminiApiKey: '', // Optional - for AI features
     useFirebaseFunctions: false,
     firebaseConfig: {
       apiKey: 'your-api-key',
       authDomain: 'your-auth-domain',
       projectId: 'your-project-id',
       storageBucket: 'your-storage-bucket',
       messagingSenderId: 'your-sender-id',
       appId: 'your-app-id'
     }
   };
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Add your Firebase config to `environment.ts`
   - Deploy Firestore security rules:
     ```bash
     firebase deploy --only firestore:rules
     ```

4. **Start development server**
   ```bash
   npm start
   ```

## Usage

1. Select your country
2. Select your grade level
3. Enter your grades for each subject
4. Choose a career to see improvement requirements
5. View universities offering your desired course
6. Check which careers you currently qualify for

## Project Structure

```
src/app/
├── core/                    # Core services (analytics, firebase, etc.)
├── features/                # Feature modules
│   ├── career-planning/     # Career planning features
│   └── eligibility/         # Eligibility checking
├── shared/                  # Shared components and services
└── app.module.ts           # Root module
```

## Available Scripts

- `npm start` - Start development server
- `npm run build:prod` - Build for production
- `npm run deploy` - Build and deploy to Firebase Hosting
- `npm run deploy:functions` - Deploy Firebase Functions
- `npm run deploy:firestore` - Deploy Firestore rules

## Technologies

- **Angular 17+** - Frontend framework
- **TypeScript** - Programming language
- **Firebase/Firestore** - Backend and database
- **Firebase Functions** - Server-side API calls
- **Google Gemini AI** - AI-powered market data
- **Chart.js** - Data visualization
- **SCSS** - Styling

## Production Deployment

### Security
- CORS policy with whitelisted origins
- Input validation and sanitization
- Rate limiting (50 requests/minute per IP)
- Secure API key handling via Firebase Functions
- Firestore security rules

### Build and Deploy
```bash
npm run build:prod
firebase deploy --only hosting
```

## License

MIT

---

**Built for African students pursuing their career dreams**
