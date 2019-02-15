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
  Account = require('eth-lib/lib/account'),
  Accounts = require('web3-eth-accounts'),
  web3Utils = require('web3-utils'),
  helpers = require('web3-core-helpers');

web3Utils.toEIP1077TransactionHash = (transaction) => {
  transaction = helpers.formatters.inputCallFormatter(transaction);

  transaction.value = web3Utils.toBN(transaction.value || '0').toString();
  transaction.gasPrice = web3Utils.toBN(transaction.gasPrice || '0').toString();
  transaction.gas = web3Utils.toBN(transaction.gas || '0').toString();
  transaction.gasToken = web3Utils.toBN(transaction.gasToken || '0').toString();
  transaction.operationType = web3Utils.toBN(transaction.operationType || '0').toString();
  transaction.nonce = web3Utils.toBN(transaction.nonce || '0').toString();
  transaction.to = transaction.to || '0x';
  transaction.data = transaction.data || '0x';
  transaction.extraHash = transaction.extraHash || '0x00';

  /** EIP1077
   keccak256(
   byte(0x19), // Will be taken care by hashEIP191Message
   byte(0), // Will be taken care by hashEIP191Message
   from,
   to,
   value,
   dataHash,
   nonce,
   gasPrice,
   gas,
   gasToken,
   callPrefix,
   operationType,
   extraHash
   );
   **/

  // Version is 0 as per EIP1077: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1077.md
  const version = '0x00';
  const txHash = web3Utils.soliditySha3(
    { t: 'bytes', v: '0x19' }, // prefix
    { t: 'bytes', v: version }, // version control
    { t: 'address', v: transaction.from }, //from
    { t: 'address', v: transaction.to }, //to
    { t: 'uint8', v: transaction.value }, //value
    { t: 'bytes', v: web3Utils.soliditySha3(transaction.data) }, //dataHash
    { t: 'uint256', v: transaction.nonce }, //nonce
    { t: 'uint8', v: transaction.gasPrice }, //gasPrice
    { t: 'uint8', v: transaction.gas }, //gas
    { t: 'uint8', v: transaction.gasToken }, //gasToken
    { t: 'bytes4', v: transaction.callPrefix }, //callPrefix
    { t: 'uint8', v: transaction.operationType }, //operationType
    { t: 'bytes32', v: transaction.extraHash }
  );
  return txHash;
};

Accounts.prototype.signEIP1077Transaction = (transaction, privateKey, callback) => {
  if (transaction.nonce < 0 || transaction.gas < 0 || transaction.gasPrice < 0) {
    let error = new Error('Gas, gasPrice or nonce is lower than 0');
    callback && callback(error);
    throw error;
  }

  let result;
  try {
    let txHash = web3Utils.toEIP1077TransactionHash(transaction);
    let signature = Account.sign(txHash, privateKey);
    let vrs = Account.decodeSignature(signature);
    result = {
      messageHash: txHash,
      v: vrs[0],
      r: vrs[1],
      s: vrs[2],
      signature: signature
    };
  } catch (error) {
    callback && callback(error);
    throw error;
  }

  callback && callback(null, result);
  return result;
};

const org_addAccountFunctions = Accounts.prototype._addAccountFunctions;
Accounts.prototype._addAccountFunctions = function(account) {
  const oAccounts = this;
  account = org_addAccountFunctions.apply(oAccounts, arguments);

  account.signEIP1077Transaction = function(transaction, callback) {
    return oAccounts.signEIP1077Transaction(transaction, account.privateKey, callback);
  };

  return account;
};

module.exports = Accounts;
