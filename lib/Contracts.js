'use strict';

const InstanceComposer = require('../instance_composer');

require('../lib/contract_interacts/TokenHolder.js');

const Contracts = function(config, ic) {
  const oThis = this;
  oThis.TokenHolder = ic.TokenHolder();
};

InstanceComposer.register(Contracts, 'Contracts', true);
module.exports = Contracts;
