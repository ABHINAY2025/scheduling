import firebase from 'firebase/app';
import 'firebase/firestore';
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
firebase.initializeApp(firebaseConfig);
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
