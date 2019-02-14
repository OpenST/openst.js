// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

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
        fs.readFile(keystoreFolder + '/' + items[i], 'utf8', function(err, fileContent) {
          if (err) {
            isRejected = true;
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
            resolve();
          }
        });
      }
    });
  }
};

module.exports = Web3WalletHelper;
