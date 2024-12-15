const fs = require('fs');
const { Builder, By, Key, until } = require('selenium-webdriver');

(async function retrieveTotalRow() {
  let driver;  // Declare the driver variable here

  try {
    // Initialize the driver
    driver = await new Builder().forBrowser('chrome').build();

    // Navigate to the specified page
    await driver.get('http://119.235.51.91/ecap/Default.aspx?ReturnUrl=%2fecap%2fmain.aspx');

    // Wait for the username field to be visible and login
    await driver.wait(until.elementLocated(By.name('txtId2')), 10000);
    const usernameField = await driver.findElement(By.name('txtId2'));
    const passwordField = await driver.findElement(By.name('txtPwd2'));
    
    // Enter credentials and submit
    const password = "798940";
    await usernameField.sendKeys('22p65a1207');
    await passwordField.sendKeys(password, Key.RETURN);

    // Wait for the main page to load (containing the iframe)
    await driver.wait(until.elementLocated(By.id('capIframeId')), 10000);

    // Switch to the iframe
    const iframeElement = await driver.findElement(By.id('capIframeId'));
    await driver.switchTo().frame(iframeElement);

    // Wait for the accordion headers to load
    const accordionHeaders = await driver.wait(
      until.elementsLocated(By.css('h1.ui-accordion-header')),
      10000
    );

    // Loop through the headers to find the one with the desired inner text
    for (const header of accordionHeaders) {
      const text = await header.getText();
      if (text.includes('PERFORMANCE (Present)')) {
        // Scroll to the element and click it
        await driver.executeScript('arguments[0].scrollIntoView(true);', header);
        await header.click();
        console.log('Accordion with "PERFORMANCE (Present)" clicked successfully!');
        break;
      }
    }

    // Wait for the specific row to appear
    const totalRow = await driver.wait(
      until.elementLocated(By.xpath("//tr[@class='reportHeading2WithBackground' and td[text()='TOTAL']]")),
      10000
    );

    // Scroll to the row to bring it into view
    await driver.executeScript('arguments[0].scrollIntoView(true);', totalRow);

    // Retrieve the text of the row
    const rowText = await totalRow.getText();
    console.log('Row Content:', rowText);

    // Save the row content to a file
    fs.writeFileSync('totalRow.txt', rowText, 'utf8');
    console.log('Row content saved to totalRow.txt');

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Ensure the driver is quit in case of an error or successful completion
    if (driver) {
      await driver.quit();  // Quit only if driver was initialized
    }
  }
})();
