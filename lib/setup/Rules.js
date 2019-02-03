'use strict';

const AbiBinProvider = require('../AbiBinProvider'),
  Deployer = require('../../utils/DeployContract'),
  PriceRuleContractName = 'PricerRule';

/**
 * Helper method which performs deployment of multiple Rules contract.
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
   * Performs deployment of PriceRule contract.
   *
   * @param baseCurrencyCode The economy base currency code.
   * @param conversionRate The conversion rate from the economy base currency
   *                        to the token.
   * @param conversionRateDecimals The conversion rate's decimals from the
   *                                economy base currency to the token.
   * @param requiredPriceOracleDecimals Required decimals for price oracles.
   * @param txOptions Tx options.
   * @returns {Object} - Transaction receipt.
   */
  async deployPriceRule(
    baseCurrencyCode,
    conversionRate,
    conversionRateDecimals,
    requiredPriceOracleDecimals,
    txOptions
  ) {
    const oThis = this;

    let txObject = oThis._deployRawTx(
      baseCurrencyCode,
      conversionRate,
      conversionRateDecimals,
      requiredPriceOracleDecimals,
      txOptions
    );

    let txReceipt;

    txReceipt = await new Deployer(PriceRuleContractName, txObject, oThis.auxiliaryWeb3, txOptions).deploy();

    return txReceipt;
  }

  /**
   * Returns Tx object of PriceRule contract.
   *
   * @param baseCurrencyCode The economy base currency code.
   * @param conversionRate The conversion rate from the economy base currency
   *                        to the token.
   * @param conversionRateDecimals The conversion rate's decimals from the
   *                                economy base currency to the token.
   * @param requiredPriceOracleDecimals Required decimals for price oracles.
   * @param txOptions Tx options.
   * @returns {Object} - Transaction receipt.
   * @private
   */
  _deployPriceRuleRawTx(
    baseCurrencyCode,
    conversionRate,
    conversionRateDecimals,
    requiredPriceOracleDecimals,
    txOptions
  ) {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(PriceRuleContractName);
    const bin = abiBinProvider.getBIN(PriceRuleContractName);

    let args = [
      oThis.organization,
      oThis.eip20Token,
      baseCurrencyCode,
      conversionRate,
      conversionRateDecimals,
      requiredPriceOracleDecimals,
      oThis.tokenRules
    ];

    const contract = new oThis.auxiliaryWeb3.eth.Contract(abi, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );
  }
}

module.exports = Rules;
