const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Cronjob', function () {
  it('can trigger a cronjob to open a dialog every minute', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000,
        },
      ],
    };
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();

        // enter pw into extension
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);
        const snapButton = await driver.findElement('#connectCronjobSnap');
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.clickElement('#connectCronjobSnap');
        await driver.delay(1000);

        // switch to metamask extension and click connect
        let windowHandles = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.delay(2000);

        // approve install of snap
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve & install',
          tag: 'button',
        });

        // click send inputs on test snap page
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectCronjobSnap',
          text: 'Reconnect to Cronjob Snap',
        });

        // switch to dialog popup, wait for a maximum of 65 seconds
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 65000);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.delay(1000);

        // look for the dialog popup to verify cronjob fired
        const error = await driver.findElement('.snap-delineator__content');
        const text = await error.getText();
        assert.equal(text.includes(`Cronjob\nfired`), true);

        // try to click on the Ok button and pass test if it works
        await driver.clickElement({
          text: 'Ok',
          tag: 'button',
        });
      },
    );
  });
});
