'use strict';

const Web3 = require('web3');
require('../providers/Web3EthAccountsEIP191');
const signerServiceBinder = require('../providers/signerServiceBinder');
const InstanceComposer = require('../instance_composer');

const ChainWeb3 = function(config, ic) {
  const oThis = this,
    provider = ic.configStrategy.gethEndPoint;

  console.log('ChainWeb3 provider', provider);

  Web3.call(oThis, provider);

  // Bind send method with signer.
  oThis.bindSignerService();
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
InstanceComposer.register(ChainWeb3, 'chainWeb3', true);

module.exports = ChainWeb3;
