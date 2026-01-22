# 📚 Learner's Career Path

A comprehensive Angular application that helps learners discover their desired career paths and track the improvements needed to achieve their goals. Built specifically for African high school students with support for multiple countries, curricula, and grade level systems.

## 🎯 What Makes This App Unique

### 1. **Reverse Eligibility System** ⭐ (Most Unique Feature)
Unlike traditional career matching apps that check if you qualify, this app lets you:
- **Select your desired career first** → See exactly what improvements are needed per subject
- **Goal-oriented approach**: Students have career goals, not just current qualifications
- **Actionable insights**: Provides specific improvement targets, not just career matches
- **Clear path forward**: Shows exactly what you need to achieve your dream career

### 2. **Backend-Driven Multi-Country Architecture**
- **Zero hardcoded country logic** - All country rules, subjects, and grade levels stored in Firestore
- **Scalable**: Add new countries in minutes without code changes
- **Flexible**: Update rules without deployment
- **Supports 6+ African countries** with different educational systems (CAPS, KCSE, WAEC, ZIMSEC, etc.)

### 3. **Real-Time Calculations**
- Instant recalculation as you type grades
- No "Calculate" button needed
- Charts and progress bars update automatically
- Modern, responsive user experience

### 4. **African Market Focus**
- Built specifically for African educational systems
- Country-specific subjects, grade levels, and requirements
- Localized career data and market insights
- Underserved market with first-mover advantage

## ✨ Core Features

### Career Planning
- **Reverse Eligibility**: Select desired career → See improvement requirements
- **Forward Eligibility**: Enter grades → See careers you qualify for
- **Real-Time Tracking**: Instant updates as you enter grades
- **Progress Visualization**: Charts and progress bars showing current vs required grades
- **Qualification Levels**: Support for Degree, Diploma, Certificate, and BTech paths

### Multi-Country Support
Currently supports 6 African countries with country-specific:
- **South Africa**: CAPS/NSC (Matric) - Grade 12
- **Kenya**: KCSE/CBC - Form 4
- **Nigeria**: WAEC/WASSCE - SS 3
- **Zimbabwe**: ZIMSEC - A-Level
- **Ethiopia**: General Education
- **Egypt**: Thanaweya Amma

Each country includes:
- Country-specific subjects and curricula
- Different grade level systems
- Either/or subject rules (e.g., Math OR MathLiteracy)
- Mandatory subjects per country
- Career baseline requirements

### AI-Powered Features
- **Career Market Data**: AI-powered job market insights including trends and opportunities

### Additional Features
- **University Integration**: Shows universities offering specific courses with APS requirements
- **Context-Aware Announcements**: Filtered by country, career, and grade level
- **Analytics Tracking**: User behavior tracking for insights and improvements
- **Visual Progress Charts**: Radar charts and progress bars

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account (for full functionality)
- Google Gemini API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CareerPath
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create or update `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     openaiApiKey: '',
     geminiApiKey: '', // Optional - for AI features
     useFirebaseFunctions: false, // Set to true for production
     firebaseConfig: {
       apiKey: 'your-api-key',
       authDomain: 'your-auth-domain',
       projectId: 'your-project-id',
       storageBucket: 'your-storage-bucket',
       messagingSenderId: 'your-sender-id',
       appId: 'your-app-id',
       measurementId: 'your-measurement-id'
     }
   };
   ```

4. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Add your Firebase config to `environment.ts`
   - Deploy Firestore security rules:
     ```bash
     firebase deploy --only firestore:rules
     ```

5. **Set up Firebase Functions** (for production)
   - Configure Gemini API key:
     ```bash
     firebase functions:config:set gemini.api_key="YOUR_KEY"
     ```
   - Deploy functions:
     ```bash
     npm run deploy:functions
     ```

6. **Start the development server**
   ```bash
   npm start
   ```

7. **Open your browser**
   Navigate to `http://localhost:4200`

## 📖 Usage

### Basic Workflow

1. **Select Your Country**: Choose your country from the dropdown
2. **Select Grade Level**: Choose your current grade level (e.g., Form 4, Grade 12)
3. **Enter Your Grades**: Input your current grades for each subject
4. **Choose a Career**: Select your desired career from the dropdown
5. **View Improvements**: See exactly what improvements are needed for each subject
6. **Check Eligibility**: See which careers you currently qualify for
7. **View Universities**: See universities offering your desired course with requirements

## 🏗️ Project Structure

```
src/app/
├── core/                    # Core module (singleton services)
│   └── services/
│       ├── analytics.service.ts
│       ├── announcements.service.ts
│       ├── career-market.service.ts
│       ├── cache.service.ts
│       ├── error-handler.service.ts
│       ├── firebase.service.ts
│       ├── gemini-rate-limit.service.ts
│       └── logging.service.ts
├── features/                # Feature modules
│   ├── career-planning/     # Career planning features
│   │   ├── components/
│   │   │   ├── career-selector/
│   │   │   ├── grade-input/
│   │   │   ├── improvement-display/
│   │   │   └── progress-charts/
│   │   └── services/
│   └── eligibility/         # Eligibility checking
│       ├── components/
│       │   └── eligible-careers/
│       └── services/
│           └── eligibility.service.ts
├── shared/                  # Shared module
│   ├── components/
│   │   ├── announcements/
│   │   ├── country-selector/
│   │   ├── grade-level-selector/
│   │   └── university-dialog/
│   ├── models/              # TypeScript interfaces
│   └── services/
└── app.module.ts           # Root module
```

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Copy your Firebase config to `src/environments/environment.ts`
4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Gemini AI Setup (Optional - for Market Data)

**⚠️ IMPORTANT: Never commit API keys to git!**

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. For development: Add to `environment.ts`
3. For production: Set in Firebase Functions:
   ```bash
   firebase functions:config:set gemini.api_key="YOUR_KEY"
   firebase deploy --only functions
   ```

The app will gracefully fall back if the API key is not configured.

## 📦 Available Scripts

### Development
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Build for production (optimized)
- `npm run watch` - Build and watch for changes
- `npm test` - Run unit tests

### Deployment
- `npm run deploy` - Build and deploy to Firebase Hosting
- `npm run deploy:hosting` - Deploy only hosting
- `npm run deploy:functions` - Deploy only Firebase Functions
- `npm run deploy:firestore` - Deploy Firestore rules and indexes

### Data Population (Node.js Scripts)
- `node scripts/populate-all-careers-firestore.js` - Populate careers to Firestore
- `node scripts/verify-career-requirements.js [career] [country]` - Verify career requirements
- `node scripts/verify-career-requirements.js --list-all` - List all careers with verification status
- `node scripts/populate-market-data-firestore-ai.js` - Generate and populate market data using AI
- `node scripts/populate-either-or-rules.js` - Populate either/or subject rules
- `node scripts/populate-universities-firestore.js` - Populate university data
- `node scripts/set-only-south-africa-active.js` - Set only South Africa as active country

## 🛠️ Technologies Used

- **Angular 17+** - Frontend framework with feature-based architecture
- **TypeScript** - Programming language with strict typing
- **Firebase/Firestore** - Backend and database (fully backend-driven)
- **Firebase Functions** - Server-side API calls for secure key handling
- **Google Gemini AI** - AI-powered market data generation (via Firebase Functions)
- **Chart.js** - Data visualization
- **RxJS** - Reactive programming
- **SCSS** - Styling

## 🎯 Key Features Explained

### Reverse Eligibility
Unlike traditional career matching apps:
1. Select your desired career first
2. See exactly what improvements are needed
3. Get a clear path to your goal

This unique approach helps students understand the path to their goals rather than just seeing what they currently qualify for.

### Real-Time Updates
All calculations happen instantly:
- Type a grade → See improvements immediately
- Change a grade → Charts update automatically
- Select a career → Requirements update instantly

### Backend-Driven Architecture
- All country-specific logic stored in Firestore
- Add new countries without code changes
- Update rules without deployment
- Scalable and maintainable

### Multi-Country Support
The app understands different educational systems:
- Different subject names per country
- Different grade level systems
- Country-specific career requirements
- Either/or subject rules (e.g., Math OR MathLiteracy)

## 🔒 Production Readiness

### Security
- ✅ CORS policy with whitelisted origins
- ✅ Input validation and sanitization
- ✅ Rate limiting (50 requests/minute per IP)
- ✅ Secure API key handling via Firebase Functions
- ✅ Firestore security rules deployed

### Error Handling
- ✅ Global error handler for unhandled errors
- ✅ Centralized logging service (environment-based levels)
- ✅ User-friendly error messages
- ✅ Graceful degradation

### Performance
- ✅ Memory leak prevention (subscription cleanup)
- ✅ Caching strategy (localStorage + Firestore)
- ✅ Real-time updates optimized
- ✅ Code splitting ready

### Code Quality
- ✅ TypeScript strict mode
- ✅ Clean architecture
- ✅ Production build successful
- ✅ No console statements in production code

## 📋 Career Requirements Verification

**⚠️ Important**: Career admission requirements should be verified against official government and university sources.

### Verification Script
```bash
# List all careers and their verification status
node scripts/verify-career-requirements.js --list-all

# Verify a specific career for a country
node scripts/verify-career-requirements.js Doctor ZA
```

### Official Sources

For South Africa:
- Department of Higher Education and Training (DHET)
- Universities South Africa (USAf)
- Individual university websites (UCT, Wits, UP, etc.)
- Higher Education Act (Government Gazette No. 751)

### Qualification Levels (South Africa)

South Africa has 4 qualification levels with different requirements:
- **Degree** (NQF 7): Bachelor's Degree programs
- **BTech** (NQF 7): Bachelor of Technology programs
- **Diploma** (NQF 6): Diploma programs
- **Certificate** (NQF 5): Higher Certificate programs

## 🌍 Supported Countries

Currently supports 6 African countries with plans to expand:
- 🇿🇦 **South Africa** - CAPS/NSC (Matric)
- 🇰🇪 **Kenya** - KCSE/CBC
- 🇳🇬 **Nigeria** - WAEC/WASSCE
- 🇿🇼 **Zimbabwe** - ZIMSEC
- 🇪🇹 **Ethiopia** - General Education
- 🇪🇬 **Egypt** - Thanaweya Amma

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🆘 Support

For issues, questions, or feature requests, please open an issue on the repository.

---

**Built with ❤️ for African students pursuing their career dreams**
