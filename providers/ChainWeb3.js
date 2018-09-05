'use strict';

const Web3 = require('web3');
const signerServiceBinder = require('../providers/signerServiceBinder');
const InstanceComposer = require('../instance_composer');

const ChainWeb3 = function() {
  const oThis = this,
    provider = oThis.ic().configStrategy.gethEndPoint;

  console.log('ChainWeb3 provider', provider);

  Web3.call(oThis, provider);

  // Bind send method with signer.
  oThis.bindSigner();
};

if (Web3.prototype) {
  ChainWeb3.prototype = Object.create(Web3.prototype);
} else {
  ChainWeb3.prototype = {};
}
ChainWeb3.prototype.constructor = ChainWeb3;

ChainWeb3.prototype.signerServiceInteract = function() {
  const oThis = this;

  let signers = oThis.ic().Signers();
  return signers.getSignerService();
};

signerServiceBinder(ChainWeb3.prototype);
InstanceComposer.registerShadowableClass(ChainWeb3, 'ChainWeb3');

module.exports = ChainWeb3;
