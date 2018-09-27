'use strict';

/**
 * Load openST Platform module
 */

const InstanceComposer = require('./instance_composer');
const version = require('./package.json').version;

require('./providers/ChainWeb3');
require('./lib/Signers');
require('./lib/Deployer');
require('./lib/Contracts');

const OpenST = function(gethEndPoint) {
  const oThis = this;

  oThis.version = version;

  oThis.configurations = Object.assign({}, { gethEndPoint: gethEndPoint });

  const _instanceComposer = new InstanceComposer(oThis.configurations);

  oThis.ic = function() {
    return _instanceComposer;
  };

  let _web3 = oThis.ic().chainWeb3();
  oThis.web3 = function() {
    return _web3;
  };

  oThis.contracts = oThis.ic().Contracts();

  oThis.Deployer = oThis.ic().Deployer();

  oThis.signers = oThis.ic().Signers();

  oThis.utils = OpenST.utils;
};

OpenST.prototype = {
  constructor: OpenST,
  configurations: null
};

OpenST.utils = {
  GethSignerService: require('./utils/GethSignerService')
};

module.exports = OpenST;
