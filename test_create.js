const { Builder, By, until } = require('selenium-webdriver');

(async function createPostTest() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    // Login first
    await driver.get('http://localhost:3000/login');
    await driver.findElement(By.name('email')).sendKeys('johndoe@gmail.com');
    await driver.findElement(By.name('password')).sendKeys('password');
    const csrf = await driver.findElement(By.name('_csrf')).getAttribute('value');
    await driver.executeScript(`document.querySelector('input[name="_csrf"]').value = "${csrf}"`);
    await driver.findElement(By.css('form')).submit();
    await driver.wait(until.urlContains('/dashboard'), 5000);

    // Navigate to Create
    await driver.findElement(By.linkText('Create New Post')).click();
    await driver.wait(until.urlContains('/create'), 5000);
    await driver.findElement(By.name('content')).sendKeys('This is a Selenium-created blog post.');
    const csrf2 = await driver.findElement(By.name('_csrf')).getAttribute('value');
    await driver.executeScript(`document.querySelector('input[name="_csrf"]').value = "${csrf2}"`);
    await driver.findElement(By.css('form')).submit();
    await driver.wait(until.urlContains('/dashboard'), 5000);
    console.log(' Post creation test passed!');
  } catch (err) {
    console.error(' Post creation test failed:', err.message);
  } finally {
    await driver.quit();
  }
})();
