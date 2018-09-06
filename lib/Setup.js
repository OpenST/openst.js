'use strict';

const InstanceComposer = require('../instance_composer');

require('../lib/setup/InitERC20Token.js');
require('../lib/setup/InitTokenHolder.js');
require('../lib/setup/InitTokenRules.js');
require('../lib/setup/InitTransferRule.js');

const Setup = function(config, ic) {
  const oThis = this;

  oThis.InitERC20Token = ic.InitERC20Token();
  oThis.InitTokenHolder = ic.InitTokenHolder();
  oThis.InitTokenRules = ic.InitTokenRules();
  oThis.InitTransferRule = ic.InitTransferRule();
};

Setup.prototype = {};

InstanceComposer.register(Setup, 'Setup', true);
module.exports = Setup;
