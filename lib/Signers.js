'use strict';

const InstanceComposer = require('../instance_composer');

const Signers = function(config, ic) {};

Signers.prototype = {
  originSigner: null,

  setSignerService: function(signerService, options) {
    const oThis = this;

    oThis.validateSignerService(signerService);
    oThis.signerInteractor = new SignerServiceInteractor(signerService, options);
  },

  getSignerService: function() {
    const oThis = this;

    return oThis.signerInteractor;
  },

  validateSignerService: function(signerService) {
    if (
      signerService &&
      typeof signerService === 'object' &&
      typeof signerService.sign === 'function' &&
      typeof signerService.signTransaction === 'function' &&
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
