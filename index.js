'use strict';

/**
 * Load openST Platform module
 */

const InstanceComposer = require('./instance_composer');
const version = require('./package.json').version;

require('./lib/Signers');
require('./lib/Setup');
require('./lib/Contracts');

const OpenST = function(web3Provider) {
  const oThis = this;

  oThis.version = version;

  oThis.configurations = Object.assign({}, { web3Provider: web3Provider });

  const _instanceComposer = new InstanceComposer(oThis.configurations);
  oThis.ic = function() {
    return _instanceComposer;
  };

  oThis.contracts = oThis.ic().Contracts();

  oThis.setup = oThis.ic().Setup();

  oThis.signers = oThis.ic().Signers();
};

OpenST.prototype = {
  constructor: OpenST,
  configurations: null
};

module.exports = OpenST;
