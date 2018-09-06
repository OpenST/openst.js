'use strict';

const BigNumber = require('bignumber.js');

const InstanceComposer = require('../instance_composer');
require('../providers/ChainWeb3');

const ExecutableTransaction = function(params) {
  const oThis = this;

  oThis.web3Provider = params.web3Provider;
  oThis.tokenHolderContractAddress = params.tokenHolderContractAddress;
  oThis.ruleContractAddress = params.ruleContractAddress;
  oThis.methodEncodedAbi = params.methodEncodedAbi;
  oThis.signer = params.signer;
  oThis.signerPassphrase = params.signerPassphrase;
  oThis.tokenHolderInstance = params.tokenHolderInstance;
};

ExecutableTransaction.prototype = {
  get: async function() {
    const oThis = this;

    let ephemeralKeyData = await oThis.tokenHolderInstance.ephemeralKeys(oThis.signer).call({});
    let nonceBigNumber = new BigNumber(ephemeralKeyData[1]),
      ephemeralKeyNonce = nonceBigNumber.add(1).toString(10);
    // Get 0x + first 8(4 bytes) characters
    let callPrefix = oThis.methodEncodedAbi.substring(0, 10);
    let messageToBeSigned = await oThis.web3Provider.utils.soliditySha3(
      { t: 'bytes', v: '0x19' }, // prefix
      { t: 'bytes', v: '0x00' }, // version control
      { t: 'address', v: oThis.tokenHolderContractAddress },
      { t: 'address', v: oThis.ruleContractAddress },
      { t: 'uint8', v: '0' },
      { t: 'bytes', v: oThis.methodEncodedAbi },
      { t: 'uint256', v: ephemeralKeyNonce },
      { t: 'uint8', v: '0' },
      { t: 'uint8', v: '0' },
      { t: 'uint8', v: '0' },
      { t: 'bytes', v: callPrefix },
      { t: 'uint8', v: '0' },
      { t: 'bytes', v: '0x' }
    );
    // configFileContent.ephemeralKey1 is signer here
    // await oThis.web3Provider.eth.personal.unlockAccount(oThis.signer, oThis.signerPassphrase);
    let signature = await oThis.web3Provider.eth.sign(messageToBeSigned, oThis.signer);
    signature = signature.slice(2);
    let r = '0x' + signature.slice(0, 64),
      s = '0x' + signature.slice(64, 128),
      v = oThis.web3Provider.utils.toDecimal('0x' + signature.slice(128, 130));
    // Supports multiple EVM implementations
    if (v < 27) {
      v += 27;
    }

    return {
      callPrefix: callPrefix,
      ephemeralKeyNonce: ephemeralKeyNonce,
      r: r,
      s: s,
      v: v
    };
  }
};

InstanceComposer.registerShadowableClass(ExecutableTransaction, 'ExecutableTransaction');

module.exports = ExecutableTransaction;
