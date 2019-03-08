'use strict';

const AbiBinProvider = require('./lib/AbiBinProvider');
const Contracts = require('./lib/Contracts');
const TokenRulesSetup = require('./lib/setup/TokenRules');
const User = require('./lib/setup/User');
const UserHelper = require('./lib/User');
const TokenRulesHelper = require('./lib/helper/TokenRules');
const TokenHolderHelper = require('./lib/helper/TokenHolder');
const Rules = require('./lib/setup/Rules');
const PricerRule = require('./lib/helper/rules/PricerRule');
const GnosisSafeHelper = require('./lib/helper/GnosisSafe');

// Require Contract Interacts
const TokenHolder = require('./lib/ContractInteract/TokenHolder');
const GnosisSafe = require('./lib/ContractInteract/GnosisSafe');
const Recovery = require('./lib/ContractInteract/Recovery');
const UserWalletFactory = require('./lib/ContractInteract/UserWalletFactory');
const ProxyFactory = require('./lib/ContractInteract/ProxyFactory');
const CreateAndAddModules = require('./lib/ContractInteract/CreateAndAddModules');
const TokenRules = require('./lib/ContractInteract/TokenRules');

// OpenST Setup
const OpenST = require('./lib/setup/Openst');

const SignEIP1077Extension = require('./utils/SignEIP1077Extension');
new SignEIP1077Extension();

module.exports = {
  AbiBinProvider: AbiBinProvider,
  Contracts: Contracts,
  Setup: {
    TokenRules: TokenRulesSetup,
    User: User,
    Rules: Rules,
    OpenST: OpenST
  },
  Helpers: {
    User: UserHelper,
    TokenRules: TokenRulesHelper,
    TokenHolder: TokenHolderHelper,
    GnosisSafe: GnosisSafeHelper,
    Recovery: Recovery,
    Rules: {
      PricerRule: PricerRule
    }
  },
  ContractInteract: {
    TokenHolder: TokenHolder,
    GnosisSafe: GnosisSafe,
    Recovery: Recovery,
    UserWalletFactory: UserWalletFactory,
    ProxyFactory: ProxyFactory,
    CreateAndAddModules: CreateAndAddModules,
    TokenRules: TokenRules
  }
};
