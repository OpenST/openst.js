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

const testHelper = require('./helper');

let devEnvConfig = require(testHelper.configFilePath);

const ConfigReader = function() {};

ConfigReader.prototype = {
  deployerAddress: devEnvConfig.deployerAddress,
  organizationAddress: devEnvConfig.organizationAddress,
  wallet1: devEnvConfig.wallet1,
  wallet2: devEnvConfig.wallet2,
  ephemeralKey: devEnvConfig.ephemeralKey1,
  facilitatorAddress: devEnvConfig.facilitator,
  gethRpcEndPoint: devEnvConfig.gethRpcEndPoint,
  passphrase: 'testtest',
  gasPrice: '0x3B9ACA00',
  gas: 7500000,
  ZERO_BYTES: '0x0000000000000000000000000000000000000000000000000000000000000000',
  NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
  tokenHolderBalance: '1111',
  baseCurrencyCode: 'OST',
  payCurrencyCode: 'USD',
  conversionRate: 10,
  conversionRateDecimals: 18,
  requiredPriceOracleDecimals: 18,
  sessionKeySpendingLimit: 1000000,
  sessionKeyExpirationHeight: 100000000000
};

module.exports = new ConfigReader();
