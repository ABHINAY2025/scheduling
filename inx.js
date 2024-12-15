const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

(async function retrieveTotalRow() {
  try {
    // Set up Chrome options for headless mode
    let options = new chrome.Options();
    options.addArguments('--headless');  // Run Chrome in headless mode
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage'); // Prevents errors on some systems

    // Create a new driver instance for Chrome with the set options
    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    // Navigate to the page
    await driver.get('http://119.235.51.91/ecap/Default.aspx?ReturnUrl=%2fecap%2fmain.aspx');

    // Wait for the username field to be visible
    await driver.wait(until.elementLocated(By.name('txtId2')), 10000);
    const usernameField = await driver.findElement(By.name('txtId2'));
    const passwordField = await driver.findElement(By.name('txtPwd2'));

    // Log in using hardcoded credentials
    const username = '22p65a1207';
    const password = '798940';
    await usernameField.sendKeys(username);
    await passwordField.sendKeys(password, Key.RETURN);

    // Wait for the iframe containing the data
    await driver.wait(until.elementLocated(By.id('capIframeId')), 10000);
    const iframeElement = await driver.findElement(By.id('capIframeId'));
    await driver.switchTo().frame(iframeElement);

    // Wait for the accordion headers and click the relevant one
    const accordionHeaders = await driver.wait(until.elementsLocated(By.css('h1.ui-accordion-header')), 10000);
    for (const header of accordionHeaders) {
      const text = await header.getText();
      if (text.includes('PERFORMANCE (Present)')) {
        await driver.executeScript('arguments[0].scrollIntoView(true);', header);
        await header.click();
        console.log('Accordion with "PERFORMANCE (Present)" clicked successfully!');
        break;
      }
    }

    // Wait for the total row to appear
    const totalRow = await driver.wait(
      until.elementLocated(By.xpath("//tr[@class='reportHeading2WithBackground' and td[text()='TOTAL']]")),
      10000
    );

    // Scroll to the row to bring it into view
    await driver.executeScript('arguments[0].scrollIntoView(true);', totalRow);

    // Retrieve the row text
    const rowText = await totalRow.getText();
    console.log('Row Content:', rowText);

    // Save the row content to a file
    fs.writeFileSync('totalRow.txt', rowText, 'utf8');
    console.log('Row content saved to totalRow.txt');

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Quit the driver and clean up
    await driver.quit();
  }
})();
