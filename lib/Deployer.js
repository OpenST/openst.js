'use strict';

const InstanceComposer = require('../instance_composer');

require('./deployers/ERC20TokenDeployer.js');
require('./deployers/TokenHolderDeployer.js');
require('./deployers/TokenRulesDeployer.js');
require('./deployers/TransferRuleDeployer.js');

const Deployer = function(options) {
  const oThis = this;

  oThis.options = options;
};

Deployer.prototype = {
  deployERC20Token: function() {
    const oThis = this;
    let ServiceClass = oThis.ic().ERC20TokenDeployer();
    let serviceParams = Object.assign({}, oThis.options, { args: Array.from(arguments) });
    let service = new ServiceClass(serviceParams);
    return service.perform().then(function(response) {
      return response.receipt;
    });
  },

  deployTokenRules: function(params) {
    const oThis = this;
    let ServiceClass = oThis.ic().TokenRulesDeployer();
    let serviceParams = Object.assign({}, oThis.options, { args: Array.from(arguments) });
    let service = new ServiceClass(serviceParams);
    return service.perform().then(function(response) {
      return response.receipt;
    });
  },

  deployTokenHolder: function(params) {
    const oThis = this;
    let ServiceClass = oThis.ic().TokenHolderDeployer();
    let serviceParams = Object.assign({}, oThis.options, { args: Array.from(arguments) });
    let service = new ServiceClass(serviceParams);
    return service.perform().then(function(response) {
      return response.receipt;
    });
  },

  deploySimpleTransferRule: function(params) {
    const oThis = this;
    let ServiceClass = oThis.ic().TransferRuleDeployer();
    let serviceParams = Object.assign({}, oThis.options, { args: Array.from(arguments) });
    let service = new ServiceClass(serviceParams);
    return service.perform().then(function(response) {
      return response.receipt;
    });
  }
};

InstanceComposer.registerShadowableClass(Deployer, 'Deployer');
module.exports = Deployer;
