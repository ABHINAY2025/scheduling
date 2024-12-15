require('dotenv').config();  // Load environment variables
const { Builder, By, Key, until } = require('selenium-webdriver');
const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
const { doc, setDoc, Timestamp } = require('firebase/firestore');

// Validate environment variables
if (!process.env.FIREBASE_API_KEY || !process.env.FIREBASE_PROJECT_ID) {
  console.error('Missing Firebase configuration in .env file. Exiting...');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const logger = {
  log: (message, data) => console.log(`[${new Date().toLocaleString()}] ${message}`, data || ''),
  error: (message, error) => console.error(`[${new Date().toLocaleString()}] ERROR: ${message}`, error || '')
};

(async function retrieveTotalRow() {
  let driver;
  try {
    driver = await new Builder().forBrowser('chrome').build();
    logger.log('Navigating to login page');
    await driver.get('http://119.235.51.91/ecap/Default.aspx?ReturnUrl=%2fecap%2fmain.aspx');

    await driver.wait(until.elementLocated(By.name('txtId2')), 10000);
    await driver.findElement(By.name('txtId2')).sendKeys("22p65a1207");
    await driver.findElement(By.name('txtPwd2')).sendKeys("798940", Key.RETURN);

    await driver.wait(until.elementLocated(By.id('capIframeId')), 10000);
    await driver.switchTo().frame(await driver.findElement(By.id('capIframeId')));

    const headers = await driver.wait(until.elementsLocated(By.css('h1.ui-accordion-header')), 10000);
    let performanceHeaderClicked = false;
    for (const header of headers) {
      if ((await header.getText()).includes('PERFORMANCE (Present)')) {
        await driver.executeScript('arguments[0].scrollIntoView(true);', header);
        await header.click();
        performanceHeaderClicked = true;
        break;
      }
    }
    if (!performanceHeaderClicked) throw new Error('PERFORMANCE header not found');

    const totalRow = await driver.wait(
      until.elementLocated(By.xpath("//tr[@class='reportHeading2WithBackground' and td[text()='TOTAL']]")),
      10000
    );
    await driver.executeScript('arguments[0].scrollIntoView(true);', totalRow);
    const rowText = await totalRow.getText();
    const percentage = await totalRow.findElement(By.xpath("./td[last()]"));
    const parsedPercentage = parseFloat((await percentage.getText()).replace('%', '').trim());
    if (isNaN(parsedPercentage)) throw new Error('Invalid percentage value');

    const documentData = {
      timestamp: Timestamp.fromDate(new Date()),
      percentageComplete: parsedPercentage,
      rawContent: rowText,
      scrapedAt: Timestamp.fromDate(new Date())
    };

    await retryFirestoreWrite(doc(db, "reports", "performance_total"), documentData, 3);
    logger.log('Firestore write completed successfully');

  } catch (error) {
    logger.error('Scraping Error', { message: error.message, stack: error.stack });
  } finally {
    if (driver) {
      try {
        await driver.quit();
        logger.log('Driver quit successfully');
      } catch (quitError) {
        logger.error('Driver quit failed', quitError);
      }
    }
    process.exit();
  }
})();

async function retryFirestoreWrite(ref, data, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await setDoc(ref, data);
      return;
    } catch (error) {
      logger.error(`Attempt ${attempt} failed`, error);
      if (attempt === retries) throw error;
    }
  }
}
