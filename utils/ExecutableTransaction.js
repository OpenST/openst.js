'use strict';

const BigNumber = require('bignumber.js');

const InstanceComposer = require('../instance_composer');
require('../providers/ChainWeb3');

const ExecutableTransaction = function(params) {
  const oThis = this;

  oThis.web3 = params.web3;
  oThis.tokenHolderContractAddress = params.tokenHolderContractAddress;
  oThis.ruleContractAddress = params.ruleContractAddress;
  oThis.methodEncodedAbi = params.methodEncodedAbi;
  oThis.ephemeralKeyAddress = params.ephemeralKeyAddress;
  oThis.tokenHolderInstance = params.tokenHolderInstance;
};

ExecutableTransaction.prototype = {
  getNonce: function() {
    const oThis = this;
    return oThis.tokenHolderInstance
      .ephemeralKeys(oThis.ephemeralKeyAddress)
      .call({})
      .then((ephemeralKeyData) => {
        let nonceBigNumber = new BigNumber(ephemeralKeyData[1]);
        return nonceBigNumber.toString(10);
      });
  }
};

InstanceComposer.registerShadowableClass(ExecutableTransaction, 'ExecutableTransaction');

module.exports = ExecutableTransaction;
