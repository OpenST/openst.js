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
const _ = require('underscore'),
  Accounts = require('web3-eth-accounts'),
  web3Utils = require('web3-utils'),
  helpers = require('web3-core-helpers');

/**
 * It is used to get the hash in EIP1077 format.
 */
let EIP1077Extender = function() {
  web3Utils.toEIP1077TransactionHash = (transaction) => {
    transaction = helpers.formatters.inputCallFormatter(transaction);

    const version = transaction.version || '0x0';
    transaction.value = web3Utils.toBN(transaction.value || '0');
    transaction.nonce = web3Utils.toBN(transaction.nonce || '0');
    transaction.gasPrice = web3Utils.toBN(transaction.gasPrice || '0');
    transaction.gas = web3Utils.toBN(transaction.gas || '0');
    transaction.gasToken = web3Utils.toBN(transaction.gasToken || '0');
    transaction.operationType = web3Utils.toBN(transaction.operationType || '0');
    transaction.extraHash = transaction.extraHash || '0x00';

    const txHash = web3Utils.soliditySha3(
      {
        t: 'bytes1',
        v: '0x19'
      },
      {
        t: 'bytes1',
        v: version
      },
      {
        t: 'address',
        v: transaction.from
      },
      {
        t: 'address',
        v: transaction.to
      },
      {
        t: 'uint8',
        v: transaction.value
      },
      {
        t: 'bytes32',
        v: web3Utils.keccak256(transaction.data)
      },
      {
        t: 'uint256',
        v: transaction.nonce
      },
      {
        t: 'uint8',
        v: transaction.gasPrice
      },
      {
        t: 'uint8',
        v: transaction.gas
      },
      {
        t: 'uint8',
        v: transaction.gasToken
      },
      {
        t: 'bytes4',
        v: transaction.callPrefix
      },
      {
        t: 'uint8',
        v: transaction.operationType
      },
      {
        t: 'bytes32',
        v: transaction.extraHash
      }
    );

    return txHash;
  };

  Accounts.prototype.getEIP1077TransactionHash = (transaction, callback) => {
    if (transaction.nonce < 0 || transaction.gas < 0 || transaction.gasPrice < 0) {
      let error = new Error('Gas, gasPrice or nonce is lower than 0');
      callback && callback(error);
      throw error;
    }

    let txHash;

    try {
      txHash = web3Utils.toEIP1077TransactionHash(transaction);
    } catch (error) {
      callback && callback(error);
      throw error;
    }

    callback && callback(null, txHash);
    return txHash;
  };

  const org_addAccountFunctions = Accounts.prototype._addAccountFunctions;
  Accounts.prototype._addAccountFunctions = function(account) {
    const oAccounts = this;
    account = org_addAccountFunctions.apply(oAccounts, arguments);
    account.getEIP1077TransactionHash = function(transaction, callback) {
      return oAccounts.getEIP1077TransactionHash(transaction, callback);
    };

    return account;
  };
};
module.exports = EIP1077Extender;
