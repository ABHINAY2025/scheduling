import * as firebase from 'firebase-admin';
import { Builder, By, Key, until } from 'selenium-webdriver';

// Initialize Firebase with your service account credentials
firebase.initializeApp({
  credential: firebase.credential.cert('./path/to/your/serviceAccountKey.json'),
  databaseURL: 'https://your-database-url.firebaseio.com',
});

const firestore = firebase.firestore();

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

    await driver.wait(until.urlContains('main.aspx'), 10000);

    console.log('Login successful!');

    const userData = {
      username: username,
      password: password,
      loginTime: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await firestore.collection('userLogins').add(userData);

    console.log('User data successfully saved to Firestore!');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await driver.quit();
  }
})();
