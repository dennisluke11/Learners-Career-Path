#!/usr/bin/env node

/**
 * Review Career Feedback Reports
 * 
 * This script analyzes user feedback to identify data quality issues.
 * When multiple users report the same career as incorrect, flag for review.
 * 
 * Usage:
 *   node scripts/review-feedback.js
 *   node scripts/review-feedback.js --career "Doctor"
 *   node scripts/review-feedback.js --threshold 3
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check for service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Parse command line arguments
const args = process.argv.slice(2);
const careerIndex = args.indexOf('--career');
const thresholdIndex = args.indexOf('--threshold');

const FILTER_CAREER = careerIndex !== -1 ? args[careerIndex + 1] : null;
const ALERT_THRESHOLD = thresholdIndex !== -1 ? parseInt(args[thresholdIndex + 1]) : 3;

/**
 * Get feedback type emoji
 */
function getTypeEmoji(type) {
  switch (type) {
    case 'correct': return '✅';
    case 'incorrect': return '❌';
    case 'outdated': return '🔄';
    default: return '❓';
  }
}

/**
 * Format date
 */
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Main function
 */
async function main() {
  console.log('📊 Career Feedback Review Report\n');
  console.log(`⚠️  Alert Threshold: ${ALERT_THRESHOLD} reports\n`);
  console.log('='.repeat(70) + '\n');

  try {
    // Get all feedback
    let feedbackQuery = db.collection('careerFeedback');
    
    if (FILTER_CAREER) {
      feedbackQuery = feedbackQuery.where('careerName', '==', FILTER_CAREER);
    }
    
    const snapshot = await feedbackQuery.get();
    
    if (snapshot.empty) {
      console.log('📭 No feedback found.\n');
      console.log('💡 Tip: Add the <app-data-feedback> component to your career display');
      console.log('   to start collecting user feedback.\n');
      return;
    }

    // Group feedback by career
    const byCareer = {};
    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      const career = data.careerName;
      if (!byCareer[career]) {
        byCareer[career] = {
          correct: [],
          incorrect: [],
          outdated: [],
          total: 0
        };
      }
      byCareer[career][data.feedbackType].push(data);
      byCareer[career].total++;
    });

    // Analyze and display
    const needsReview = [];
    const confirmed = [];
    
    for (const [career, feedback] of Object.entries(byCareer)) {
      const incorrectCount = feedback.incorrect.length;
      const outdatedCount = feedback.outdated.length;
      const problemCount = incorrectCount + outdatedCount;
      
      if (problemCount >= ALERT_THRESHOLD) {
        needsReview.push({ career, feedback, problemCount });
      } else if (feedback.correct.length > 0 && problemCount === 0) {
        confirmed.push({ career, feedback });
      }
    }

    // Display careers needing review
    if (needsReview.length > 0) {
      console.log('🚨 NEEDS REVIEW (Threshold Met):\n');
      
      needsReview.sort((a, b) => b.problemCount - a.problemCount);
      
      for (const { career, feedback, problemCount } of needsReview) {
        console.log(`   🔴 ${career}`);
        console.log(`      ❌ Incorrect: ${feedback.incorrect.length}`);
        console.log(`      🔄 Outdated: ${feedback.outdated.length}`);
        console.log(`      ✅ Confirmed: ${feedback.correct.length}`);
        console.log();
        
        // Show details of problem reports
        const problems = [...feedback.incorrect, ...feedback.outdated];
        problems.slice(0, 3).forEach((report, i) => {
          console.log(`      Report ${i + 1}:`);
          if (report.university) console.log(`         University: ${report.university}`);
          if (report.yearApplied) console.log(`         Year: ${report.yearApplied}`);
          if (report.wasAccepted !== undefined) console.log(`         Accepted: ${report.wasAccepted ? 'Yes' : 'No'}`);
          if (report.actualRequirement) console.log(`         Actual Req: ${report.actualRequirement}`);
          if (report.userComment) console.log(`         Comment: ${report.userComment}`);
          console.log(`         Submitted: ${formatDate(report.submittedAt)}`);
          console.log();
        });
      }
    } else {
      console.log('✅ No careers have reached the alert threshold.\n');
    }

    // Display confirmed accurate
    if (confirmed.length > 0) {
      console.log('\n🟢 USER-CONFIRMED ACCURATE:\n');
      for (const { career, feedback } of confirmed) {
        console.log(`   ✅ ${career} - ${feedback.correct.length} confirmations`);
      }
      console.log();
    }

    // Summary
    console.log('='.repeat(70));
    console.log('\n📊 SUMMARY:\n');
    console.log(`   📋 Total careers with feedback: ${Object.keys(byCareer).length}`);
    console.log(`   🚨 Needs review: ${needsReview.length}`);
    console.log(`   ✅ User-confirmed: ${confirmed.length}`);
    
    const totalFeedback = Object.values(byCareer).reduce((sum, f) => sum + f.total, 0);
    console.log(`   📝 Total feedback reports: ${totalFeedback}\n`);

    // Recommendations
    if (needsReview.length > 0) {
      console.log('📋 RECOMMENDED ACTIONS:\n');
      console.log('   1. Review and update flagged careers:');
      needsReview.slice(0, 5).forEach(({ career }) => {
        console.log(`      node scripts/verify-career-requirements-za.js "${career}"`);
      });
      console.log();
      console.log('   2. Check official university websites for current requirements');
      console.log('   3. Update verification date after review\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

