# 📚 Learner's Career Path

A comprehensive Angular application that helps learners discover their desired career paths and track the improvements needed to achieve their goals. Built specifically for African high school students with support for multiple countries, curricula, and grade level systems.

## ✨ Features

### Core Features
- **Reverse Eligibility System**: Select your desired career first, then see exactly what improvements are needed per subject
- **Real-Time Grade Tracking**: Instant recalculation as you type - no "Calculate" button needed
- **Multi-Country Support**: Supports 6 African countries (South Africa, Kenya, Nigeria, Zimbabwe, Ethiopia, Egypt) with country-specific:
  - Subjects and curricula
  - Grade level systems (Form 4, SS 3, Grade 12, etc.)
  - Career baseline requirements
- **AI-Powered Study Resources**: Google Gemini AI generates personalized, country-specific study resources
- **Career Market Data**: View job market insights including salary ranges, job counts, and market trends
- **Visual Progress Charts**: Radar charts and progress bars showing current vs required grades
- **Eligibility Checking**: Forward eligibility to see which careers you currently qualify for
- **Announcements System**: Context-aware announcements based on country, career, and grade level
- **Analytics Tracking**: User behavior tracking for insights and improvements

### Technical Features
- **Angular 17+**: Modern feature-based architecture with Core, Shared, and Feature modules
- **Firebase Integration**: Firestore for dynamic data, remote configuration, and analytics
- **Google Gemini AI**: AI-powered study resource generation
- **Chart.js**: Beautiful visualizations for progress tracking
- **Responsive Design**: Works seamlessly on desktop and mobile devices

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
     firebase: {
       // Your Firebase config
     },
     geminiApiKey: 'your-gemini-api-key', // Optional
     useFirebaseFunctions: false
   };
   ```

4. **Set up Firebase** (if using Firebase features)
   - Create a Firebase project
   - Add your Firebase config to `environment.ts`
   - Deploy Firestore security rules:
     ```bash
     firebase deploy --only firestore:rules
     ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:4200`

## 📖 Usage

### Basic Workflow

1. **Select Your Country**: Choose your country from the dropdown
2. **Select Grade Level**: Choose your current grade level (e.g., Form 4, Grade 12)
3. **Enter Your Grades**: Input your current grades for each subject
4. **Choose a Career**: Select your desired career from the dropdown
5. **View Improvements**: See exactly what improvements are needed for each subject
6. **Get Study Resources**: Access AI-generated study resources tailored to your needs
7. **Check Eligibility**: See which careers you currently qualify for

### Features in Detail

#### Reverse Eligibility
Instead of checking if you qualify for a career, select your desired career first and see what you need to improve. This unique approach helps students understand the path to their goals.

#### Real-Time Calculations
All calculations happen instantly as you type. No need to click buttons - just enter your grades and watch the improvements update in real-time.

#### Country-Specific Support
The app recognizes different educational systems:
- **South Africa**: CAPS/NSC (Matric)
- **Kenya**: KCSE/CBC
- **Nigeria**: WAEC/WASSCE
- **Zimbabwe**: ZIMSEC
- **Ethiopia**: General Education
- **Egypt**: Thanaweya Amma

#### AI Study Resources
When a Gemini API key is configured, the app generates personalized study resources including:
- Key topics to focus on
- Recommended websites and learning platforms
- Past papers and practice exams
- Career-specific guidance

## 🏗️ Project Structure

```
src/app/
├── core/                    # Core module (singleton services)
│   └── services/
│       ├── analytics.service.ts
│       ├── announcements.service.ts
│       ├── career-market.service.ts
│       └── firebase.service.ts
├── features/                # Feature modules
│   ├── career-planning/     # Career planning features
│   │   ├── components/
│   │   │   ├── career-selector/
│   │   │   ├── grade-input/
│   │   │   ├── improvement-display/
│   │   │   └── progress-charts/
│   │   └── services/
│   ├── eligibility/         # Eligibility checking
│   └── study-resources/     # Study resources
├── shared/                  # Shared module
│   ├── components/
│   │   ├── announcements/
│   │   ├── country-selector/
│   │   └── grade-level-selector/
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

### Gemini AI Setup (Optional)

**⚠️ IMPORTANT: Never commit API keys to git!**

1. Get a new Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - If your previous key was leaked, create a new one and delete the old one
2. Create a `.env` file in the project root:
   ```bash
   GEMINI_API_KEY=your-new-api-key-here
   ```
3. Load the environment variables:
   ```bash
   node scripts/load-env.js
   ```
4. The app will gracefully fall back to default resources if the API key is not configured
5. **Never commit `.env` to git** - it's already in `.gitignore`

## 📦 Available Scripts

### Development
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build and watch for changes
- `npm test` - Run unit tests

### Data Population (Node.js Scripts)
- `node scripts/populate-all-careers-firestore.js` - Populate careers to Firestore
- `node scripts/verify-career-requirements.js [career] [country]` - Verify career requirements from official sources
- `node scripts/verify-career-requirements.js --list-all` - List all careers with verification status
- `node scripts/populate-study-resources-firestore.js` - Populate study resources to Firestore
- `node scripts/populate-market-data-firestore-ai.js` - **Generate and populate market data using AI**
- `node scripts/update-market-data-monthly.js` - **Update all market data monthly (for cron jobs)**

See `MARKET_DATA_AI_SETUP.md` for detailed instructions on using AI to generate market data.

## 🛠️ Technologies Used

- **Angular 17** - Frontend framework
- **TypeScript** - Programming language
- **Firebase/Firestore** - Backend and database
- **Google Gemini AI** - AI-powered content generation
- **Chart.js** - Data visualization
- **RxJS** - Reactive programming
- **SCSS** - Styling

## 📝 Key Features Explained

### Reverse Eligibility
Unlike traditional career matching apps that check if you qualify, this app lets you:
1. Select your desired career first
2. See exactly what improvements are needed
3. Get a clear path to your goal

### Real-Time Updates
All calculations happen instantly:
- Type a grade → See improvements immediately
- Change a grade → Charts update automatically
- Select a career → Requirements update instantly

### Multi-Country Support
The app understands different educational systems:
- Different subject names per country
- Different grade level systems
- Country-specific career requirements
- Localized study resources

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 📋 Career Requirements Verification

**⚠️ Important**: The career admission requirements in this codebase are currently **ESTIMATED** and need to be verified against official government and university sources.

### Verification System

We've created a comprehensive verification system to ensure accuracy:

1. **Documentation**: `CAREER_REQUIREMENTS_SOURCES.md` - Lists official sources for each country
2. **Verification Script**: `scripts/verify-career-requirements.js` - Interactive tool to verify and update requirements
3. **Quick Guide**: `VERIFY_CAREER_REQUIREMENTS_GUIDE.md` - Step-by-step verification guide

### Quick Start

```bash
# List all careers and their verification status
node scripts/verify-career-requirements.js --list-all

# Verify a specific career for a country
node scripts/verify-career-requirements.js Doctor ZA
```

### Official Sources

For South Africa, verify requirements from:
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

See `SOUTH_AFRICA_QUALIFICATION_LEVELS.md` for detailed government requirements and `VERIFY_ZA_REQUIREMENTS_GUIDE.md` for verification guide.

See `CAREER_REQUIREMENTS_SOURCES.md` for complete list of official sources by country.

## 🆘 Support

For issues, questions, or feature requests, please open an issue on the repository.

---

**Built with ❤️ for African students pursuing their career dreams**
