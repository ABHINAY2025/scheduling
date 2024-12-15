require('dotenv').config(); // Load environment variables from .env file
const { Builder, By, Key, until } = require('selenium-webdriver');
const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
const { doc, setDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
if (!firebaseConfig.projectId) {
  console.error("Error: Firebase configuration is incomplete. Check your .env file.");
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Logging utility with custom date format
const logger = {
  log: (message, data) => {
    const formattedDate = new Date().toLocaleString();
    console.log(`[${formattedDate}] ${message}`, data || '');
  },
  error: (message, error) => {
    const formattedDate = new Date().toLocaleString();
    console.error(`[${formattedDate}] ERROR: ${message}`, error || '');
  }
};

(async function retrieveTotalRow() {
  let driver;

  try {
    // Initialize Selenium WebDriver
    driver = await new Builder().forBrowser('chrome').build();

    // Navigate to the login page
    logger.log('Navigating to login page');
    await driver.get('http://119.235.51.91/ecap/Default.aspx?ReturnUrl=%2fecap%2fmain.aspx');

    // Wait for login fields and perform login
    await driver.wait(until.elementLocated(By.name('txtId2')), 10000);
    await driver.findElement(By.name('txtId2')).sendKeys("22p65a1207"); // Hardcoded username
    await driver.findElement(By.name('txtPwd2')).sendKeys("798940", Key.RETURN); // Hardcoded password

    // Wait for iframe and switch to it
    await driver.wait(until.elementLocated(By.id('capIframeId')), 10000);
    const iframeElement = await driver.findElement(By.id('capIframeId'));
    await driver.switchTo().frame(iframeElement);

    // Click the "PERFORMANCE (Present)" accordion
    const headers = await driver.wait(until.elementsLocated(By.css('h1.ui-accordion-header')), 10000);
    let performanceClicked = false;

    for (const header of headers) {
      const text = await header.getText();
      if (text.includes('PERFORMANCE (Present)')) {
        await driver.executeScript('arguments[0].scrollIntoView(true);', header);
        await header.click();
        logger.log('Accordion "PERFORMANCE (Present)" clicked successfully!');
        performanceClicked = true;
        break;
      }
    }

    if (!performanceClicked) throw new Error('Performance header not found');

    // Locate the "TOTAL" row
    const totalRow = await driver.wait(
      until.elementLocated(By.xpath("//tr[@class='reportHeading2WithBackground' and td[text()='TOTAL']]")),
      10000
    );

    await driver.executeScript('arguments[0].scrollIntoView(true);', totalRow);
    const rowText = await totalRow.getText();
    logger.log('Row Content Extracted:', rowText);

    // Parse and validate extracted row text
    const [, total, completed, percentage] = rowText.split(/\s+/);
    if (!percentage || !percentage.includes('%')) {
      throw new Error("Invalid percentage value extracted");
    }

    const parsedPercentage = parseFloat(percentage.replace('%', '').trim());
    if (isNaN(parsedPercentage)) throw new Error("Parsed percentage is not a number");

    // Prepare data for Firestore
    const documentData = {
      percentageComplete: parsedPercentage,
      total: total || null,
      completed: completed || null,
    };

    // Save data to Firestore
    const documentRef = doc(db, "reports", "performance_total");
    await setDoc(documentRef, documentData);
    logger.log('Data saved to Firestore successfully!', documentData);

  } catch (error) {
    logger.error('An error occurred', error);
  } finally {
    if (driver) {
      try {
        await driver.quit();
        logger.log('Driver quit successfully');
      } catch (quitError) {
        logger.error('Error quitting driver', quitError);
      }
    }
    logger.log('Process exiting...');
    process.exit();
  }
})();
