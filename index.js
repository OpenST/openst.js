'use strict';

const AbiBinProvider = require('./lib/AbiBinProvider');
const Contracts = require('./lib/Contracts');
const TokenRules = require('./lib/setup/TokenRules');
const User = require('./lib/setup/User');
const UserHelper = require('./lib/helper/User');
const TokenRulesHelper = require('./lib/helper/TokenRules');
const TokenHolder = require('./lib/helper/TokenHolder');
const Rules = require('./lib/setup/Rules');
const PricerRule = require('./lib/helper/rules/PricerRule');
const GnosisSafe = require('./lib/helper/GnosisSafe');
const Recovery = require('./lib/ContractInteract/Recovery');

const SignEIP1077Extension = require('./utils/SignEIP1077Extension');
new SignEIP1077Extension();

module.exports = {
  AbiBinProvider: AbiBinProvider,
  Contracts: Contracts,
  Setup: {
    TokenRules: TokenRules,
    User: User,
    Rules: Rules
  },
  Helpers: {
    User: UserHelper,
    TokenRules: TokenRulesHelper,
    TokenHolder: TokenHolder,
    GnosisSafe: GnosisSafe,
    Recovery: Recovery,
    Rules: {
      PricerRule: PricerRule
    }
  }
};
