'use strict';

const InstanceComposer = require('../instance_composer');

const Signers = function(config, ic) {
  const oThis = this;
  oThis.auxiliarySignerInteractors = {};
};

Signers.prototype = {
  originSigner: null,
  setOriginSignerService: function(signerService, options) {
    const oThis = this;
    oThis.validateSignerService(signerService);
    oThis.originSignerInteractor = new SignerServiceInteractor(signerService, options);
  },
  getOriginSignerService: function() {
    const oThis = this;
    return oThis.originSignerInteractor;
  },

  auxiliarySignerInteractors: null,
  setAuxiliarySignerService: function(signerService, coreId, options) {
    const oThis = this;
    oThis.validateSignerService(signerService);

    if (coreId) coreId = String(coreId).toLowerCase();

    let interactor = new SignerServiceInteractor(signerService, options);
    oThis.auxiliarySignerInteractors[coreId] = interactor;
  },
  getAuxiliarySignerService: function(coreId) {
    const oThis = this;

    if (coreId) coreId = String(coreId).toLowerCase();
    return oThis.auxiliarySignerInteractors[coreId];
  },

  validateSignerService: function(signerService) {
    if (
      signerService &&
      typeof signerService === 'object' &&
      typeof signerService.sign === 'function' &&
      typeof signerService.nonce === 'function'
    ) {
      return true;
    }
    let err = new Error("SignerService must be an object with 'nonce' and 'sign' functions.");
    throw err;
  }
};

const SignerServiceInteractor = function(service) {
  const oThis = this;

  oThis.service = function() {
    return service;
  };
};

InstanceComposer.register(Signers, 'Signers', true);
module.exports = Signers;
