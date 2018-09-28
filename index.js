'use strict';

/**
 * Load openST Platform module
 */

const InstanceComposer = require('./instance_composer');
const version = require('./package.json').version;
const SignEIP1077Extension = require('./utils/SignEIP1077Extension');
const AbiBinProvider = require('./utils/abiBinProvider');

require('./lib/providers/web3/ChainWeb3');
require('./lib/Signers');
require('./lib/Deployer');
require('./lib/Contracts');

const OpenST = function(provider, net, options) {
  const oThis = this;
  oThis.version = version;

  oThis.configurations = Object.assign(
    {},
    {
      web3Provider: provider,
      web3Net: net
    },
    options || {}
  );

  const _instanceComposer = new InstanceComposer(oThis.configurations);

  oThis.ic = function() {
    return _instanceComposer;
  };

  let abiBinProvider = new AbiBinProvider();
  InstanceComposer.registerObject(abiBinProvider, 'abiBinProvider');

  oThis.abiBinProvider = function() {
    return abiBinProvider;
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
  GethSignerService: require('./utils/GethSignerService'),
  AbiBinProvider: AbiBinProvider
};

module.exports = OpenST;
