'use strict';

const InstanceComposer = require('../instance_composer');

require('./contractInteracts/TokenHolder.js');
require('./contractInteracts/TokenRules.js');

const Contracts = function(config, ic) {
  const oThis = this;
  oThis.TokenHolder = ic.TokenHolder();
  oThis.TokenRules = ic.TokenRules();
};

InstanceComposer.register(Contracts, 'Contracts', true);
module.exports = Contracts;
