const { Builder, By, Key, until } = require('selenium-webdriver');

(async function loginToEcap() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    // Navigate to the specified URL
    await driver.get('http://119.235.51.91/ecap/Default.aspx?ReturnUrl=%2fecap%2fmain.aspx');

    // Wait for the username field to be visible
    await driver.wait(until.elementLocated(By.name('txtId2')), 10000);

    // Find the username and password fields
    const usernameField = await driver.findElement(By.name('txtId2')); // Update to actual 'name' or 'id'
    const passwordField = await driver.findElement(By.name('txtPwd2')); // Update to actual 'name' or 'id'

    // Enter credentials
    const pass="798940"
    await usernameField.sendKeys('22p65a1207'); // Replace with your username
    await passwordField.sendKeys(`${pass}`, Key.RETURN); // Replace with your password and hit Enter

    // Wait for navigation or a specific element indicating a successful login
    await driver.wait(until.urlContains('main.aspx'), 10000);

    console.log('Login successful!');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Quit the browser
    await driver.wait();
  }
})();
