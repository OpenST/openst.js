// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

const AbiBinProvider = require('./lib/AbiBinProvider');
const Contracts = require('./lib/Contracts');
const TokenRules = require('./lib/setup/TokenRules');
const User = require('./lib/setup/User');
const UserHelper = require('./lib/helper/User');
const TokenRulesHelper = require('./lib/helper/TokenRules');
const TokenHolderHelper = require('./lib/helper/TokenHolder');
const Rules = require('./lib/setup/Rules');
const PricerRule = require('./lib/helper/rules/PricerRule');
const GnosisSafeHelper = require('./lib/helper/GnosisSafe');

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
    TokenHolder: TokenHolderHelper,
    Rules: {
      PricerRule: PricerRule
    },
    GnosisSafe: GnosisSafeHelper
  }
};
