'use strict';

const InstanceComposer = require('../instance_composer');

require('../lib/contract_interacts/TokenHolder.js');
require('../lib/contract_interacts/TokenRules.js');

const Contracts = function(config, ic) {
  const oThis = this;
  oThis.TokenHolder = ic.TokenHolder();
  oThis.TokenRules = ic.TokenRules();
};

InstanceComposer.register(Contracts, 'Contracts', true);
module.exports = Contracts;
