'use strict';

const AbiBinProvider = require('./lib/AbiBinProvider');
const Contracts = require('./lib/Contracts');
const TokenRules = require('./lib/setup/TokenRules');
const User = require('./lib/setup/User');
const UserHelper = require('./lib/helper/User');
const TokenRulesHelper = require('./lib/helper/TokenRules');

module.exports = {
  Setup: {
    TokenRules: TokenRules,
    User: User
  },
  AbiBinProvider: AbiBinProvider,
  Contracts: Contracts,
  Helpers: {
    User: UserHelper,
    TokenRules: TokenRulesHelper
  }
};
