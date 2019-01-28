'use strict';

const fs = require('fs');

const testHelper = require('./helper'),
  configReader = require('./configReader');

const passphrase = configReader.passphrase;

const keystoreFolder = testHelper.gethDataDir + '/keystore';

const Web3WalletHelper = function(web3Object) {
  const oThis = this;

  oThis.web3Object = web3Object;
};

Web3WalletHelper.prototype = {
  init: function() {
    const oThis = this;

    let items = fs.readdirSync(keystoreFolder);

    return new Promise(function(resolve, reject) {
      let resolved = items.length,
        isRejected = false;

      for (let i = 0; i < items.length; i++) {
        let cItem = items[i];
        if (!cItem.startsWith('UTC')) {
          resolved--;
          continue;
        }

        fs.readFile(keystoreFolder + '/' + items[i], 'utf8', function(err, fileContent) {
          if (err) {
            isRejected = true;
            console.log('Error Reading file!\n', err);
            reject(err);
          }

          if (isRejected) {
            return;
          }

          let account = oThis.web3Object.eth.accounts.decrypt(fileContent, passphrase);
          oThis.web3Object.eth.accounts.wallet.add(account);
          resolved--;
          if (!resolved) {
            //All are done.
            console.log('Web3 Wallet Account Add DONE!');
            resolve();
          }
        });
      }
    });
  }
};

module.exports = Web3WalletHelper;
