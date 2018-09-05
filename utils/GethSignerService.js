'use strict';

const Web3 = require('web3');

const Signer = function(web3Provider) {
  const oThis = this;

  let web3;
  if (web3Provider instanceof Web3) {
    web3 = web3Provider;
  } else {
    web3 = new Web3(web3Provider);
  }

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

    console.log('GSS :: Fetching txpool Content');
    return web3.txpoolContent().then(function(txpoolContent) {
      console.log('GSS :: Got txpool Content');
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

      console.log('GSS :: Computed maxNonce:', maxNonce);
      if (maxNonce >= 0) {
        return maxNonce + 1;
      }
      return web3.eth.getTransactionCount(_from);
    });
  };

  oThis.sign = function(transactionData) {
    //console.log("transactionData", transactionData);
    if (!transactionData || !transactionData.from) {
      return Promise.reject('Invalid transactionData');
    }

    let _from = transactionData.from;

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

    console.log('GSS :: Unlocking Account');
    let _fromPassphrase = _aToPwdMap[String(_from).toLowerCase()];
    return web3.eth.personal.unlockAccount(transactionData.from, _fromPassphrase).then(function() {
      console.log('GSS :: Account Unlocked! Signing Tx');
      return web3.eth.signTransaction(transactionData, _fromPassphrase).then(function(signedTx) {
        console.log('GSS :: Tx Signed');
        return signedTx;
      });
    });
  };
};

module.exports = Signer;
