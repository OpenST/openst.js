'use strict';

const InstanceComposer = require('../instance_composer');

require('../lib/setup/InitERC20Token.js');
require('../lib/setup/InitTokenHolder.js');
require('../lib/setup/InitTokenRules.js');
require('../lib/setup/InitTransferRule.js');

const Setup = function(sendOptions) {
  const oThis = this;

  oThis.sendOptions = sendOptions;
};

Setup.prototype = {
  deployERC20Token: function() {
    const oThis = this;
    let ServiceClass = oThis.ic().InitERC20Token();
    let serviceParams = Object.assign({}, oThis.sendOptions, { args: Array.from(arguments) });
    let service = new ServiceClass(serviceParams);
    return service.perform().then(function(response) {
      return response.receipt;
    });
  },

  deployTokenRules: function(params) {
    const oThis = this;
    let ServiceClass = oThis.ic().InitTokenRules();
    let serviceParams = Object.assign({}, oThis.sendOptions, { args: Array.from(arguments) });
    let service = new ServiceClass(serviceParams);
    return service.perform().then(function(response) {
      return response.receipt;
    });
  },

  deployTokenHolder: function(params) {
    const oThis = this;
    let ServiceClass = oThis.ic().InitTokenHolder();
    let serviceParams = Object.assign({}, oThis.sendOptions, { args: Array.from(arguments) });
    let service = new ServiceClass(serviceParams);
    return service.perform().then(function(response) {
      return response.receipt;
    });
  },

  deploySampleCustomRule: function(params) {
    const oThis = this;
    let ServiceClass = oThis.ic().InitTransferRule();
    let serviceParams = Object.assign({}, oThis.sendOptions, { args: Array.from(arguments) });
    let service = new ServiceClass(serviceParams);
    return service.perform().then(function(response) {
      return response.receipt;
    });
  }
};

InstanceComposer.registerShadowableClass(Setup, 'Setup');
module.exports = Setup;
