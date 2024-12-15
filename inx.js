const fs = require('fs');
const { Builder, By, Key, until } = require('selenium-webdriver');
const { db } = require('./firebaseConfig'); // Import Firestore setup
const { doc, setDoc } = require('firebase/firestore'); // Firestore functions

(async function retrieveTotalRow() {
  let driver;

  try {
    // Initialize the Selenium driver
    driver = await new Builder().forBrowser('chrome').build();

    // Navigate to the specified page
    await driver.get('http://119.235.51.91/ecap/Default.aspx?ReturnUrl=%2fecap%2fmain.aspx');

    // Wait for login fields
    await driver.wait(until.elementLocated(By.name('txtId2')), 10000);
    const usernameField = await driver.findElement(By.name('txtId2'));
    const passwordField = await driver.findElement(By.name('txtPwd2'));

    // Enter credentials and submit
    const password = "798940";
    await usernameField.sendKeys('22p65a1207');
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

    for (const header of accordionHeaders) {
      const text = await header.getText();
      if (text.includes('PERFORMANCE (Present)')) {
        await driver.executeScript('arguments[0].scrollIntoView(true);', header);
        await header.click();
        console.log('Accordion with "PERFORMANCE (Present)" clicked successfully!');
        break;
      }
    }

    // Locate the TOTAL row
    const totalRow = await driver.wait(
      until.elementLocated(By.xpath("//tr[@class='reportHeading2WithBackground' and td[text()='TOTAL']]")),
      10000
    );

    // Scroll and extract row text
    await driver.executeScript('arguments[0].scrollIntoView(true);', totalRow);
    const rowText = await totalRow.getText();
    console.log('Row Content:', rowText);

    // Save the data locally
    fs.writeFileSync('totalRow.txt', rowText, 'utf8');
    console.log('Row content saved to totalRow.txt');

    // Save the data to Firestore
    const documentRef = doc(db, "reports", "performance_total");
    await setDoc(documentRef, {
      timestamp: new Date().toISOString(),
      rowContent: rowText
    });
    console.log('Data saved to Firestore successfully!');

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Quit the driver
    if (driver) {
      await driver.quit();
    }
  }
})();
