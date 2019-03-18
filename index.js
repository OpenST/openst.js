'use strict';

const AbiBinProvider = require('./lib/AbiBinProvider');
const Contracts = require('./lib/Contracts');
const TokenRulesSetup = require('./lib/setup/TokenRules');
const User = require('./lib/setup/User');
const UserHelper = require('./lib/helper/User');
const TokenRulesHelper = require('./lib/helper/TokenRules');
const TokenHolderHelper = require('./lib/helper/TokenHolder');
const Rules = require('./lib/setup/Rules');
const PricerRuleHelper = require('./lib/helper/rules/PricerRule');
const GnosisSafeHelper = require('./lib/helper/GnosisSafe');

// Require Contract Interacts
const TokenHolder = require('./lib/ContractInteract/TokenHolder');
const GnosisSafe = require('./lib/ContractInteract/GnosisSafe');
const Recovery = require('./lib/ContractInteract/Recovery');
const UserWalletFactory = require('./lib/ContractInteract/UserWalletFactory');
const ProxyFactory = require('./lib/ContractInteract/ProxyFactory');
const CreateAndAddModules = require('./lib/ContractInteract/CreateAndAddModules');
const TokenRules = require('./lib/ContractInteract/TokenRules');
const PricerRule = require('./lib/ContractInteract/PricerRule');
const Mosaic = require('@openstfoundation/mosaic.js');

// OpenST Setup
const SetupOpenst = require('./lib/Setup');

const SignEIP1077Extension = require('./utils/SignEIP1077Extension');
new SignEIP1077Extension();

module.exports = {
  AbiBinProvider: AbiBinProvider,
  Contracts: Contracts,
  SetupOpenst: SetupOpenst,
  Setup: {
    TokenRules: TokenRulesSetup,
    User: User,
    Rules: Rules
  },
  Helpers: {
    User: UserHelper,
    TokenRules: TokenRulesHelper,
    TokenHolder: TokenHolderHelper,
    GnosisSafe: GnosisSafeHelper,
    Recovery: Recovery,
    Rules: {
      PricerRule: PricerRuleHelper
    }
  },
  ContractInteract: {
    TokenHolder: TokenHolder,
    GnosisSafe: GnosisSafe,
    Recovery: Recovery,
    UserWalletFactory: UserWalletFactory,
    ProxyFactory: ProxyFactory,
    CreateAndAddModules: CreateAndAddModules,
    TokenRules: TokenRules,
    PricerRule: PricerRule,
    Organization: Mosaic.ContractInteract.Organization
  }
};
