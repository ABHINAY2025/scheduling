require('dotenv').config();  // Load environment variables from .env file
const { Builder, By, Key, until } = require('selenium-webdriver');
const { initializeApp } = require("firebase/app");
const { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} = require('firebase/firestore');

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Logging utility with custom date format
const logger = {
  log: (message, data) => {
    const formattedDate = new Date().toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    console.log(`[${formattedDate}] ${message}`, data || '');
  },
  error: (message, error) => {
    const formattedDate = new Date().toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    console.error(`[${formattedDate}] ERROR: ${message}`, error || '');
  }
};

(async function retrieveTotalRow() {
  let driver;
  
  try {
    // Initialize the Selenium driver
    driver = await new Builder().forBrowser('chrome').build();
    
    logger.log('Navigating to login page');
    await driver.get('http://119.235.51.91/ecap/Default.aspx?ReturnUrl=%2fecap%2fmain.aspx');
    
    // Wait for login fields
    await driver.wait(until.elementLocated(By.name('txtId2')), 10000);
    const usernameField = await driver.findElement(By.name('txtId2'));
    const passwordField = await driver.findElement(By.name('txtPwd2'));
    
    // Enter hardcoded username and password
    const username = "22p65a1207";  // Hardcoded username
    const password = "798940";  // Hardcoded password
    await usernameField.sendKeys(username);  // Use hardcoded username
    await passwordField.sendKeys(password, Key.RETURN);
    
    // Wait for the iframe and switch to it
    await driver.wait(until.elementLocated(By.id('capIframeId')), 10000);
    const iframeElement = await driver.findElement(By.id('capIframeId'));
    await driver.switchTo().frame(iframeElement);
    
    // Locate the accordion headers and find the desired one
    const accordionHeaders = await driver.wait(
      until.elementsLocated(By.css('h1.ui-accordion-header')),
      10000
    );
    
    let performanceHeaderFound = false;
    for (const header of accordionHeaders) {
      const text = await header.getText();
      if (text.includes('PERFORMANCE (Present)')) {
        await driver.executeScript('arguments[0].scrollIntoView(true);', header);
        await header.click();
        logger.log('Accordion with "PERFORMANCE (Present)" clicked successfully!');
        performanceHeaderFound = true;
        break;
      }
    }
    
    if (!performanceHeaderFound) {
      throw new Error('Performance header not found');
    }
    
    // Locate the TOTAL row
    const totalRow = await driver.wait(
      until.elementLocated(By.xpath("//tr[@class='reportHeading2WithBackground' and td[text()='TOTAL']]")),
      10000
    );
    
    // Scroll and extract row text
    await driver.executeScript('arguments[0].scrollIntoView(true);', totalRow);
    const rowText = await totalRow.getText();
    logger.log('Row Content Extracted:', rowText);
    
    // Locate the last cell in the row (attendance percentage)
    const percentageCell = await totalRow.findElement(By.xpath("./td[last()]"));
    const percentage = await percentageCell.getText(); // Get the percentage value
    logger.log('Attendance Percentage Extracted:', percentage);
    
    // Parse the percentage value (ensure it's a valid number)
    const parsedPercentage = parseFloat(percentage.replace('%', '').trim());
    if (isNaN(parsedPercentage)) {
      throw new Error('Invalid percentage value extracted');
    }
    
    // Save to Firestore with enhanced error handling
    try {
      const docRef = await addDoc(collection(db, "performance_reports"), {
        timestamp: serverTimestamp(),
        percentageComplete: parsedPercentage,
        rawContent: rowText,
        scrapedAt: serverTimestamp(),
        metadata: {
          username: username,
          source: 'ECAP Portal'
        }
      });
      
      logger.log('Data saved to Firestore successfully!', {
        documentId: docRef.id
      });
    } catch (firestoreError) {
      logger.error('Firestore Save Error', {
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack
      });
      throw firestoreError;
    }    
    
  } catch (error) {
    logger.error('Comprehensive Scraping Error', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code || 'N/A'
    });
    
  } finally {
    // Ensure driver quits
    if (driver) {
      try {
        await driver.quit();
        logger.log('Driver quit successfully');
      } catch (quitError) {
        logger.error('Error quitting driver', quitError);
      }
    }
    
    // Explicitly exit process
    logger.log('Exiting process...');
    process.exit();
  }
})();
