/**
 * Automated Demo Recording Script
 * This script uses Puppeteer to automate browser interactions
 * and can be used with screen recording tools
 * 
 * Install dependencies:
 * npm install puppeteer
 * 
 * Run: node automate_demo_recording.js
 */

const puppeteer = require('puppeteer');

async function createDemoRecording() {
  console.log('🚀 Starting automated demo recording...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser window for recording
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  try {
    // Navigate to the app
    console.log('📱 Navigating to app...');
    await page.goto('https://learner-s-career-path.web.app/home', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    console.log('✅ Page loaded. Start your screen recording now!');
    console.log('⏸️  Waiting 5 seconds for you to start recording...');
    await page.waitForTimeout(5000);
    
    // Step 1: Select Country
    console.log('📍 Step 1: Selecting country...');
    await page.waitForSelector('app-country-selector', { timeout: 10000 });
    await page.click('app-country-selector select, app-country-selector button, [aria-label*="country" i]');
    await page.waitForTimeout(1000);
    // Select South Africa
    await page.keyboard.type('South Africa');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    
    // Step 2: Select Grade Level
    console.log('📚 Step 2: Selecting grade level...');
    await page.waitForSelector('app-grade-level-selector', { timeout: 10000 });
    await page.click('app-grade-level-selector select, app-grade-level-selector button, [aria-label*="grade" i]');
    await page.waitForTimeout(1000);
    await page.keyboard.type('Grade 12');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    
    // Step 3: Enter Grades
    console.log('✏️  Step 3: Entering grades...');
    await page.waitForSelector('app-grade-input', { timeout: 10000 });
    
    // Wait a bit for form to load
    await page.waitForTimeout(2000);
    
    // Enter Mathematics
    try {
      const mathInput = await page.$('input[placeholder*="Mathematics" i], input[name*="mathematics" i], input[id*="mathematics" i]');
      if (mathInput) {
        await mathInput.click();
        await mathInput.type('75');
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('Could not find Mathematics input, trying alternative selector...');
    }
    
    // Enter Physical Sciences
    try {
      const physInput = await page.$('input[placeholder*="Physical Sciences" i], input[name*="physical" i]');
      if (physInput) {
        await physInput.click();
        await physInput.type('70');
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('Could not find Physical Sciences input...');
    }
    
    // Enter Life Sciences
    try {
      const lifeInput = await page.$('input[placeholder*="Life Sciences" i], input[name*="life" i]');
      if (lifeInput) {
        await lifeInput.click();
        await lifeInput.type('68');
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('Could not find Life Sciences input...');
    }
    
    // Enter English
    try {
      const engInput = await page.$('input[placeholder*="English" i], input[name*="english" i]');
      if (engInput) {
        await engInput.click();
        await engInput.type('80');
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('Could not find English input...');
    }
    
    await page.waitForTimeout(2000);
    
    // Step 4: Scroll to Eligible Careers
    console.log('🎯 Step 4: Showing eligible careers...');
    await page.evaluate(() => {
      const careersSection = document.querySelector('app-eligible-careers, [id*="eligible" i], [class*="eligible" i]');
      if (careersSection) {
        careersSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(3000);
    
    // Step 5: Select a Career
    console.log('💼 Step 5: Selecting a career...');
    await page.evaluate(() => {
      const careerSelector = document.querySelector('app-career-selector, [id*="career" i]');
      if (careerSelector) {
        careerSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(2000);
    
    // Try to search for a career
    try {
      const searchInput = await page.$('input[placeholder*="search" i], input[type="search" i], input[aria-label*="search" i]');
      if (searchInput) {
        await searchInput.click();
        await searchInput.type('Medical Doctor');
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('Could not find career search input...');
    }
    
    await page.waitForTimeout(2000);
    
    // Step 6: Show Improvement Display
    console.log('📊 Step 6: Showing improvement display...');
    await page.evaluate(() => {
      const improvementSection = document.querySelector('app-improvement-display, [id*="improvement" i]');
      if (improvementSection) {
        improvementSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(3000);
    
    // Step 7: Open University Dialog
    console.log('🏛️  Step 7: Opening university dialog...');
    try {
      const viewUniButton = await page.$('button:has-text("View Universities"), button[aria-label*="university" i], .view-universities-btn');
      if (viewUniButton) {
        await viewUniButton.click();
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      console.log('Could not find View Universities button...');
    }
    
    // Keep browser open for manual interaction
    console.log('✅ Demo sequence complete!');
    console.log('📹 Browser will stay open for 60 seconds for you to finish recording...');
    console.log('💡 You can now interact manually with the page');
    
    await page.waitForTimeout(60000); // Wait 60 seconds
    
  } catch (error) {
    console.error('❌ Error during demo:', error);
  } finally {
    console.log('🔚 Closing browser...');
    await browser.close();
  }
}

// Run the demo
createDemoRecording().catch(console.error);

