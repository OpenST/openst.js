'use strict';

const AbiBinProvider = require('./lib/AbiBinProvider');
const Contracts = require('./lib/Contracts');
const TokenRules = require('./lib/setup/TokenRules');
const User = require('./lib/setup/User');

module.exports = {
  Setup: {
    TokenRules: TokenRules,
    User: User
  },
  AbiBinProvider: AbiBinProvider,
  Contracts: Contracts
};
