'use strict';

const AbiBinProvider = require('./../../AbiBinProvider'),
  PricerRuleContractName = 'PricerRule';

const Utils = require('../../../utils/Utils');

const BN = require('bn.js');

/**
 * Helper class which provides interaction methods of PricerRule contract.
 */
class PricerRule {
  /**
   * PricerRule constructor.
   *
   * @param auxiliaryWeb3 Auxiliary chain web3 object.
   * @param contractAddress PricerRule contract address.
   */
  constructor(auxiliaryWeb3, contractAddress) {
    const oThis = this;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.pricerRuleAddress = contractAddress;

    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Adds a new price oracle. From address should be only worker address.
   *
   * @param priceOracleAddress PriceOracle contract address.
   * @param txOptions Tx options.
   *
   * @returns {Promise<*>}
   */
  async addPriceOracle(priceOracleAddress, txOptions) {
    const oThis = this;
    const txObject = oThis._addPriceOracleRawTx(priceOracleAddress);

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Removes price oracle contract address for pay CurrencyCode. From address should be only worker address.
   *
   * @param payCurrencyCode QuoteCurrency code. e.g. USD, ETH, BTC.
   * @param txOptions Tx options.
   *
   * @returns {Promise<*>}
   */
  async removePriceOracle(payCurrencyCode, txOptions) {
    const oThis = this;
    const txObject = oThis._removePriceOracleRawTx(payCurrencyCode);

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Sets an acceptance margin for the base currency price per pay
   *         currency. From address should be only worker address.
   *
   * @param payCurrencyCode QuoteCurrency code. e.g. USD, ETH, BTC.
   * @param acceptanceMargin Acceptance margin for the base currency price per pay currency.
   * @param txOptions Tx options.
   *
   * @returns {Promise<*>}
   */
  async setAcceptanceMargin(payCurrencyCode, acceptanceMargin, txOptions) {
    const oThis = this;
    let txObject = oThis._setAcceptanceMarginRawTx(payCurrencyCode, acceptanceMargin);

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Removes an acceptance margin of the base currency price in the
   *         specified pay currency. From address should be only worker address.
   *
   * @param payCurrencyCode QuoteCurrency code. e.g. USD, ETH, BTC.
   * @param txOptions Tx options.
   *
   * @returns {Promise<*>}
   */
  async removeAcceptanceMargin(payCurrencyCode, txOptions) {
    const oThis = this;
    const txObject = oThis._removeAcceptanceMarginRawTx(payCurrencyCode);

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Constructs executable data for PricerRule.pay method.
   *
   * @param from Payment sender address.
   * @param toList Array of receivers.
   * @param amountList Array of amounts.
   * @param payCurrencyCode Currency code of the specified amounts.
   * @param baseCurrencyIntendedPrice The intended price of the base currency used during conversion within function.
   *
   * @returns {String} PricerRule.pay executable data.
   */
  getPayExecutableData(from, toList, amountList, payCurrencyCode, baseCurrencyIntendedPrice) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(PricerRuleContractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.pricerRuleAddress),
      bytesPayCurrencyCode = oThis.auxiliaryWeb3.utils.stringToHex(payCurrencyCode.toString()),
      payExecutableData = contract.methods
        .pay(from, toList, amountList, bytesPayCurrencyCode, baseCurrencyIntendedPrice)
        .encodeABI();

    return payExecutableData;
  }

  /**
   * Converts PayCurrencyCode amount to BT amount.
   *
   * @param amountInWei Amount which is being transferred.
   * @param priceInWei Price set in PriceOracle contract.
   * @param conversionRate OST to BT conversion rate.
   * @param conversionRateDecimals OST to BT conversion rate decimals.
   *
   * @returns {BigNumber} Converted BT amount.
   */
  static convertPayCurrencyToToken(tokenDecimals, amountInWei, priceInWei, conversionRate, conversionRateDecimals) {
    const tokenDecimalsBN = new BN(10).pow(new BN(tokenDecimals));
    const conversionRateDecimalsBN = new BN(10).pow(new BN(conversionRateDecimals));
    const amountBN = new BN(amountInWei);
    const priceBN = new BN(priceInWei);
    return amountBN
      .mul(new BN(conversionRate))
      .mul(tokenDecimalsBN)
      .div(priceBN)
      .div(conversionRateDecimalsBN);
  }

  /**
   * Adds a new price oracle.
   *
   * @param priceOracleAddress PriceOracle contract address.
   *
   * @returns {Promise<*>} Promise object.
   * @private
   */
  _addPriceOracleRawTx(priceOracleAddress) {
    const oThis = this;

    return oThis._pricerRuleContractInstance().methods.addPriceOracle(priceOracleAddress);
  }

  /**
   * Removes the price oracle for the specified pay currency code.
   *
   * @param payCurrencyCode QuoteCurrency code. e.g. ETH, BTC.
   *
   * @returns {Promise<*>} Promise object.
   * @private
   */
  _removePriceOracleRawTx(payCurrencyCode) {
    const oThis = this;

    const bytesPayCurrencyCode = oThis.auxiliaryWeb3.utils.stringToHex(payCurrencyCode.toString());
    return oThis._pricerRuleContractInstance().methods.removePriceOracle(bytesPayCurrencyCode);
  }

  /**
   * Sets an acceptance margin for the base currency price per pay
   *      currency. From should be worker only.
   * @param payCurrencyCode QuoteCurrency code. e.g. ETH, BTC.
   * @param acceptanceMargin Acceptance margin for the base currency price per pay currency.
   *
   * @returns {*}
   * @private
   */
  _setAcceptanceMarginRawTx(payCurrencyCode, acceptanceMargin) {
    const oThis = this;

    const bytesPayCurrencyCode = oThis.auxiliaryWeb3.utils.stringToHex(payCurrencyCode.toString());
    return oThis._pricerRuleContractInstance().methods.setAcceptanceMargin(bytesPayCurrencyCode, acceptanceMargin);
  }

  /**
   * Removes an acceptance margin of the base currency price in the
   *         specified pay currency. From should be worker only.
   *
   * @param payCurrencyCode QuoteCurrency code. e.g. USD, ETH, BTC.
   *
   * @returns {Promise<*>}
   * @private
   */
  _removeAcceptanceMarginRawTx(payCurrencyCode) {
    const oThis = this;

    const bytesPayCurrencyCode = oThis.auxiliaryWeb3.utils.stringToHex(payCurrencyCode.toString());
    return oThis._pricerRuleContractInstance().methods.removeAcceptanceMargin(bytesPayCurrencyCode);
  }

  /**
   * Returns PricerRule contract instance.
   *
   * @returns {oThis.auxiliaryWeb3.eth.Contract}
   *
   * @private
   */
  _pricerRuleContractInstance() {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(PricerRuleContractName),
      contractInstance = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.pricerRuleAddress);
    return contractInstance;
  }
}

module.exports = PricerRule;
