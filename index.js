import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Builder, By, Key, until } from 'selenium-webdriver';

// Firebase configuration for Firebase JS SDK
const firebaseConfig = {
  apiKey: "AIzaSyDgjGrcTmmh8i7ZURsXoZEjqFDbDZY0hq8",
  authDomain: "vbit-53042.firebaseapp.com",
  projectId: "vbit-53042",
  storageBucket: "vbit-53042.firebasestorage.app",
  messagingSenderId: "378194086673",
  appId: "1:378194086673:web:efd4212fa0104a1091dab0",
  measurementId: "G-MD604N29D6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

(async function loginToEcap() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('http://119.235.51.91/ecap/Default.aspx?ReturnUrl=%2fecap%2fmain.aspx');

    const username = '22p65a1207';
    const password = '798940';

    const usernameField = await driver.findElement(By.name('txtId2'));
    const passwordField = await driver.findElement(By.name('txtPwd2'));

    await usernameField.sendKeys(username);
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
        console.log('Accordion with "PERFORMANCE (Present)" clicked successfully!');
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
    console.log('Row Content Extracted:', rowText);

    // Locate the last cell in the row (attendance percentage)
    const percentageCell = await totalRow.findElement(By.xpath("./td[last()]"));
    const percentage = await percentageCell.getText(); // Get the percentage value
    console.log('Attendance Percentage Extracted:', percentage);

    // Parse the percentage value (ensure it's a valid number)
    const parsedPercentage = parseFloat(percentage.replace('%', '').trim());
    if (isNaN(parsedPercentage)) {
      throw new Error('Invalid percentage value extracted');
    }

    // Prepare data to save in Firestore with robust validation
    const documentData = {
      timestamp: serverTimestamp(),
      percentageComplete: parsedPercentage,  // Store the parsed percentage
      rawContent: rowText,  // Store raw row content for reference
      scrapedAt: serverTimestamp() // Use Firestore Timestamp for consistency
    };

    // Save to Firestore with enhanced error handling
    await addDoc(collection(firestore, "reports"), documentData);
    console.log('Data saved to Firestore successfully!');

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await driver.quit();
    console.log('Driver quit successfully');
    process.exit();  // Ensure the process exits once done
  }
})();
