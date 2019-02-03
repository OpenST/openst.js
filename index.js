'use strict';

const AbiBinProvider = require('./lib/AbiBinProvider');
const Contracts = require('./lib/Contracts');
const TokenRules = require('./lib/setup/TokenRules');
const User = require('./lib/setup/User');
const Rules = require('./lib/setup/Rules');
const UserHelper = require('./lib/helper/User');

module.exports = {
  Setup: {
    TokenRules: TokenRules,
    User: User,
    Rules: Rules
  },
  AbiBinProvider: AbiBinProvider,
  Contracts: Contracts,
  Helpers: {
    User: UserHelper
  }
};
