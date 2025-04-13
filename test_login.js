const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async function loginTest() {
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options()).build();

  try {
    // Navigate to the login page
    await driver.get('http://localhost:3000/login');

    // Wait for form inputs to load
    await driver.wait(until.elementLocated(By.name('email')), 5000);
    await driver.wait(until.elementLocated(By.name('password')), 5000);
    await driver.wait(until.elementLocated(By.name('_csrf')), 5000);

    // Get the CSRF token
    const csrfToken = await driver.findElement(By.name('_csrf')).getAttribute('value');

    // Fill in the login form
    const emailInput = await driver.findElement(By.name('email'));
    const passwordInput = await driver.findElement(By.name('password'));

    await emailInput.clear();
    await emailInput.sendKeys('johndoe@gmail.com');
    await passwordInput.clear();
    await passwordInput.sendKeys('password');

    // Set the hidden CSRF token (should already be populated but just in case)
    await driver.executeScript(`document.querySelector('input[name="_csrf"]').value = '${csrfToken}'`);

    // Submit the form
    await driver.findElement(By.css('form')).submit();

    // Wait for the dashboard to appear
    await driver.wait(until.urlContains('/dashboard'), 5000);
    console.log(' Login test passed!');

  } catch (error) {
    console.error(' Login test failed:', error.message);
  } finally {
    await driver.quit();
  }
})();
