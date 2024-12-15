import { Builder, By, Key, until } from 'selenium-webdriver';
import firebase from 'firebase-admin';

// Initialize Firebase with hardcoded Firebase JS SDK credentials
firebase.initializeApp({
  apiKey: "AIzaSyDgjGrcTmmh8i7ZURsXoZEjqFDbDZY0hq8",
  authDomain: "vbit-53042.firebaseapp.com",
  projectId: "vbit-53042",
  storageBucket: "vbit-53042.firebasestorage.app",
  messagingSenderId: "378194086673",
  appId: "1:378194086673:web:efd4212fa0104a1091dab0",
  measurementId: "G-MD604N29D6"
});

const firestore = firebase.firestore();

(async function loginToEcap() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    // Navigate to the specified URL
    await driver.get('http://119.235.51.91/ecap/Default.aspx?ReturnUrl=%2fecap%2fmain.aspx');

    // Wait for the username field to be visible
    await driver.wait(until.elementLocated(By.name('txtId2')), 10000);

    // Find the username and password fields
    const usernameField = await driver.findElement(By.name('txtId2'));
    const passwordField = await driver.findElement(By.name('txtPwd2'));

    // Enter credentials
    const username = '22p65a1207'; 
    const password = '798940';

    await usernameField.sendKeys(username);
    await passwordField.sendKeys(password, Key.RETURN);

    // Wait for navigation or a specific element indicating a successful login
    await driver.wait(until.urlContains('main.aspx'), 10000);

    console.log('Login successful!');

    // Store the login data in Firebase
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
