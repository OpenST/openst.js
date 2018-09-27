'use strict';
const _ = require('underscore'),
  Account = require('eth-lib/lib/account'),
  Accounts = require('web3-eth-accounts'),
  utils = require('web3-utils'),
  Bytes = require('eth-lib/lib/bytes'),
  helpers = require('web3-core-helpers'),
  Hash = require('eth-lib/lib/hash');

const DEBUG = false;

Accounts.prototype.signEIP1077Transaction = function(transaction, privateKey, callback, version) {
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

  transaction = helpers.formatters.inputCallFormatter(transaction);

  if (transaction.nonce < 0 || transaction.gas < 0 || transaction.gasPrice < 0) {
    error = new Error('Gas, gasPrice or nonce is lower than 0');
    callback && callback(error);
    throw error;
  }

  transaction.value = utils.toBN(transaction.value || '0').toString();
  transaction.gasPrice = utils.toBN(transaction.gasPrice || '0').toString();
  transaction.gas = utils.toBN(transaction.gas || '0').toString();
  transaction.gasToken = utils.toBN(transaction.gasToken || '0').toString();
  transaction.operationType = utils.toBN(transaction.operationType || '0').toString();
  transaction.nonce = utils.toBN(transaction.nonce || '0').toString();

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

  version = version || '0x00';
  let txHash = utils.soliditySha3(
    { t: 'bytes', v: '0x19' }, // prefix
    { t: 'bytes', v: version }, // version control
    { t: 'address', v: transaction.from }, //from
    { t: 'address', v: transaction.to }, //to
    { t: 'uint8', v: transaction.value }, //value
    { t: 'bytes', v: utils.soliditySha3(transaction.data) }, //dataHash
    { t: 'uint256', v: transaction.nonce }, //nonce
    { t: 'uint8', v: transaction.gasPrice }, //gasPrice
    { t: 'uint8', v: transaction.gas }, //gas
    { t: 'uint8', v: transaction.gasToken }, //gasToken
    { t: 'bytes4', v: transaction.callPrefix }, //callPrefix
    { t: 'uint8', v: transaction.operationType }, //operationType
    { t: 'bytes32', v: transaction.extraHash }
  );

  let signature = Account.sign(txHash, privateKey);
  let vrs = Account.decodeSignature(signature);
  let result = {
    messageHash: txHash,
    v: vrs[0],
    r: vrs[1],
    s: vrs[2],
    signature: signature
  };
  callback && callback(null, result);
  return result;
};

const org_addAccountFunctions = Accounts.prototype._addAccountFunctions;
Accounts.prototype._addAccountFunctions = function(account) {
  const oAccounts = this;
  account = org_addAccountFunctions.apply(oAccounts, arguments);

  account.signEIP1077Transaction = function(transaction, callback, version) {
    return oAccounts.signEIP1077Transaction(transaction, account.privateKey, callback, version);
  };

  return account;
};

console.log('EIP1077 signing helper has been added.');

module.exports = Accounts;
