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

const Web3 = require('web3');

const Signer = function(web3Provider) {
  const oThis = this;

  let web3;
  if (web3Provider instanceof Web3) {
    web3Provider = web3Provider.currentProvider;
  }
  web3 = new Web3(web3Provider);

  web3.extend({
    methods: [
      {
        name: 'txpoolContent',
        call: 'txpool_content'
      }
    ]
  });

  const _aToPwdMap = {};
  oThis.addAccount = function(address, passphrase) {
    address = String(address).toLowerCase();
    _aToPwdMap[address] = passphrase;
  };

  oThis.nonce = function(_from) {
    _from = web3.utils.toChecksumAddress(_from);
    if (!_aToPwdMap.hasOwnProperty(String(_from).toLowerCase())) {
      return Promise.reject('Unknown Address: ', _from);
    }

    return web3.txpoolContent().then(function(txpoolContent) {
      let pendingTransactions, queuedTransactions;

      pendingTransactions = txpoolContent.pending || {};
      //Filter out transactions of our interest.
      pendingTransactions = pendingTransactions[_from] || {};

      queuedTransactions = txpoolContent.queued || {};
      //Filter out transactions of our interest.
      queuedTransactions = queuedTransactions[_from] || {};

      let pendingNonces = Object.keys(pendingTransactions),
        queuedNonces = Object.keys(queuedTransactions),
        allNonces = pendingNonces.concat(queuedNonces),
        len = allNonces.length,
        currentNonce,
        maxNonce = -1;

      while (len--) {
        currentNonce = Number(allNonces[len]);
        if (currentNonce > maxNonce) maxNonce = currentNonce;
      }

      if (maxNonce >= 0) {
        return maxNonce + 1;
      }
      return web3.eth.getTransactionCount(_from);
    });
  };

  oThis.sign = function(dataToSign, _from) {
    if (!dataToSign) {
      return Promise.reject('Invalid dataToSign');
    }

    if (!_from) {
      return Promise.reject('Invalid from Address');
    }

    if (!_aToPwdMap.hasOwnProperty(String(_from).toLowerCase())) {
      return Promise.reject('Unknown Address', _from);
    }

    let _fromPassphrase = _aToPwdMap[String(_from).toLowerCase()];
    return web3.eth.personal.unlockAccount(_from, _fromPassphrase).then(function() {
      return web3.eth.sign(dataToSign, _from).then(function(signedData) {
        return signedData;
      });
    });
  };

  oThis.signTransaction = function(transactionData, _from) {
    if (!transactionData || !transactionData.from) {
      return Promise.reject('Invalid transactionData');
    }

    _from = _from || transactionData.from;

    if (!_aToPwdMap.hasOwnProperty(String(_from).toLowerCase())) {
      return Promise.reject('Unknown Address', _from);
    }

    if (!transactionData.hasOwnProperty('gasPrice')) {
      return Promise.reject('Invalid gasPrice');
    }

    if (!transactionData.gas) {
      return Promise.reject('Invalid gas');
    }

    // if (!transactionData.to) {
    //   return Promise.reject('Invalid to address');
    // }

    if (!transactionData.hasOwnProperty('value')) {
      transactionData.value = 0;
    }

    if (!transactionData.hasOwnProperty('data')) {
      transactionData.data = '';
    }

    let _fromPassphrase = _aToPwdMap[String(_from).toLowerCase()];
    return web3.eth.personal.unlockAccount(_from, _fromPassphrase).then(function() {
      return web3.eth.signTransaction(transactionData, _fromPassphrase).then(function(signedTx) {
        return signedTx;
      });
    });
  };
};

module.exports = Signer;
