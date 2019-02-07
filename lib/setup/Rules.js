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

const AbiBinProvider = require('../AbiBinProvider'),
  Deployer = require('../../utils/DeployContract'),
  PricerRuleContractName = 'PricerRule';

/**
 * Helper class which performs setup/deployment of multiple Rules contract.
 */
class Rules {
  /**
   * Constructor for Rules setup.
   *
   * @param auxiliaryWeb3 Auxiliary chain web3 object.
   * @param organization Organization address.
   * @param eip20Token The economy token address.
   * @param tokenRules The economy token rules address.
   */
  constructor(auxiliaryWeb3, organization, eip20Token, tokenRules) {
    const oThis = this;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.organization = organization;
    oThis.eip20Token = eip20Token;
    oThis.tokenRules = tokenRules;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Performs deployment of PricerRule contract.
   *
   * @param baseCurrencyCode The economy base currency code.
   * @param conversionRate The conversion rate from the economy base currency
   *                        to the token. e.g. CR of "OST => Unsplash"
   * @param conversionRateDecimals The conversion rate's decimals from the
   *                                economy base currency to the token.
   * @param requiredPriceOracleDecimals Required decimals for price oracles.
   * @param txOptions Tx options.
   *
   * @returns {Object} - Transaction receipt.
   */
  async deployPricerRule(
    baseCurrencyCode,
    conversionRate,
    conversionRateDecimals,
    requiredPriceOracleDecimals,
    txOptions
  ) {
    const oThis = this;

    const txObject = oThis._deployPricerRuleRawTx(
      baseCurrencyCode,
      conversionRate,
      conversionRateDecimals,
      requiredPriceOracleDecimals
    );

    const txReceipt = await new Deployer(PricerRuleContractName, txObject, oThis.auxiliaryWeb3, txOptions).deploy();

    return txReceipt;
  }

  /**
   * Returns Tx object of PricerRule contract.
   *
   * @param baseCurrencyCode The economy base currency code.
   * @param conversionRate The conversion rate from the economy base currency
   *                        to the token.
   * @param conversionRateDecimals The conversion rate's decimals from the
   *                                economy base currency to the token.
   * @param requiredPriceOracleDecimals Required decimals for price oracles.
   *
   * @returns {Object} - Transaction receipt.
   * @private
   */
  _deployPricerRuleRawTx(baseCurrencyCode, conversionRate, conversionRateDecimals, requiredPriceOracleDecimals) {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(PricerRuleContractName);
    const bin = abiBinProvider.getBIN(PricerRuleContractName);

    const bytesBaseCurrencyCode = oThis.auxiliaryWeb3.utils.stringToHex(baseCurrencyCode.toString());

    const args = [
      oThis.organization,
      oThis.eip20Token,
      bytesBaseCurrencyCode,
      conversionRate,
      conversionRateDecimals,
      requiredPriceOracleDecimals,
      oThis.tokenRules
    ];

    const contract = new oThis.auxiliaryWeb3.eth.Contract(abi, null);

    return contract.deploy({
      data: bin,
      arguments: args
    });
  }
}

module.exports = Rules;
