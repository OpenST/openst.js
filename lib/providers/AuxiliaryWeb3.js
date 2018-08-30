'use strict';
const Web3 = require('web3');
const signerServiceBinder = require("../providers/signerServiceBinder");

const InstanceComposer = require('../instance_composer');

const AuxiliaryWeb3 = function(originCoreContractAddress) {
  const oThis = this,
    auxiliaries = oThis.ic().configStrategy.auxiliaries;

  let provider;
  if (typeof originCoreContractAddress === 'object') {
    let auxiliaryWeb3Config = originCoreContractAddress;
    provider = auxiliaryWeb3Config.provider;
  } else {
    let len = auxiliaries.length;
    originCoreContractAddress = String(originCoreContractAddress).toLowerCase();
    while (len--) {
      let auxConfig = auxiliaries[len];
      if (String(auxConfig.originCoreContractAddress).toLowerCase() === originCoreContractAddress) {
        provider = auxConfig.provider;
      }
    }
  }

  if (!provider) {
    throw "No Auxiliary defined with origin core contract address '" + originCoreContractAddress + "'";
  }

  Web3.call(oThis, provider);

  oThis.coreId = originCoreContractAddress;

  // Bind send method with signer.
  oThis.bindSigner();
};

if (Web3.prototype) {
  AuxiliaryWeb3.prototype = Object.create(Web3.prototype);
} else {
  AuxiliaryWeb3.prototype = {};
}

AuxiliaryWeb3.prototype.constructor = AuxiliaryWeb3;

AuxiliaryWeb3.prototype.coreId = null;

AuxiliaryWeb3.prototype.signerServiceInteract = function () {
  const oThis = this;

  let signers = oThis.ic().Signers();
  return signers.getAuxiliarySignerService(oThis.coreId);
};

signerServiceBinder( AuxiliaryWeb3.prototype );


InstanceComposer.registerShadowableClass(AuxiliaryWeb3, 'AuxiliaryWeb3');

module.exports = AuxiliaryWeb3;
