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

    for (let i = 0; i < items.length; i++) {
      let fileContent = fs.readFileSync(keystoreFolder + '/' + items[i], 'utf8');

      let account = oThis.web3Object.eth.accounts.decrypt(fileContent, passphrase);

      console.log('account', account);

      oThis.web3Object.eth.accounts.wallet.add(account);
    }

    console.log('a', a);

    console.log('Web3 Wallet Account Add DONE!');
  }
};

module.exports = Web3WalletHelper;
