'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./../AbiBinProvider');
const Contracts = require('../Contracts');

const Utils = require('../../utils/Utils');
const ContractName = 'PricerRule';

/**
 * This Class is used to interact with PricerRule contract.
 */
class PricerRule {
  /**
   * PricerRule class constructor.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary web3 object.
   * @param {string} address PricerRule proxy contract address.
   */
  constructor(auxiliaryWeb3, address) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      const err = new TypeError("Mandatory Parameter 'auxiliaryWeb3' is missing or invalid.");
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(address)) {
      const err = new TypeError(`Mandatory Parameter 'address' is missing or invalid: ${address}.`);
      return Promise.reject(err);
    }

    this.auxiliaryWeb3 = auxiliaryWeb3;
    this.address = address;

    this.contract = Contracts.getPricerRule(this.auxiliaryWeb3, this.address);

    if (!this.contract) {
      const err = new TypeError(`Could not load PricerRule contract for: ${this.address}`);
      return Promise.reject(err);
    }
  }

  /**
   * Deploys PricerRule contract.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {string} organization Organization address.
   * @param {string} eip20Token The economy token address.
   * @param {string} tokenRules The economy token rules address.
   * @param {string} baseCurrencyCode The economy base currency code.
   * @param {string} conversionRate The conversion rate from the economy base currency
   *                        to the token. e.g. CR of "OST => Unsplash"
   * @param {string} conversionRateDecimals The conversion rate's decimals from the
   *                                economy base currency to the token.
   * @param {string} requiredPriceOracleDecimals Required decimals for price oracles.
   * @param {Object} txOptions Tx options.
   *
   * @returns {Promise<PricerRule>} Promise containing the PricerRule
   *                              instance that has been deployed.
   */
  static async deploy(
    auxiliaryWeb3,
    organization,
    eip20Token,
    tokenRules,
    baseCurrencyCode,
    conversionRate,
    conversionRateDecimals,
    requiredPriceOracleDecimals,
    txOptions
  ) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    const tx = PricerRule.deployRawTx(
      auxiliaryWeb3,
      organization,
      eip20Token,
      tokenRules,
      baseCurrencyCode,
      conversionRate,
      conversionRateDecimals,
      requiredPriceOracleDecimals
    );

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new PricerRule(auxiliaryWeb3, address);
    });
  }

  /**
   * Method which returns Tx object to deploy PricerRule contract.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {string} organization Organization address.
   * @param {string} eip20Token The economy token address.
   * @param {string} tokenRules The economy token rules address.
   * @param {string} baseCurrencyCode The economy base currency code.
   * @param {string} conversionRate The conversion rate from the economy base currency
   *                        to the token.
   * @param {string} conversionRateDecimals The conversion rate's decimals from the
   *                                economy base currency to the token.
   * @param {string} requiredPriceOracleDecimals Required decimals for price oracles.
   *
   * @returns {Object} Raw transaction.
   */
  static deployRawTx(
    auxiliaryWeb3,
    organization,
    eip20Token,
    tokenRules,
    baseCurrencyCode,
    conversionRate,
    conversionRateDecimals,
    requiredPriceOracleDecimals
  ) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      throw new TypeError(`Mandatory Parameter 'auxiliaryWeb3' is missing or invalid: ${auxiliaryWeb3}`);
    }
    if (!Web3.utils.isAddress(organization)) {
      const err = new TypeError(`Invalid organization address ${organization}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(eip20Token)) {
      const err = new TypeError(`Invalid eip20Token address ${eip20Token}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(tokenRules)) {
      const err = new TypeError(`Invalid tokenRules address ${tokenRules}.`);
      return Promise.reject(err);
    }
    if (!baseCurrencyCode) {
      const err = new TypeError(`baseCurrencyCode is invalid or missing ${baseCurrencyCode}.`);
      return Promise.reject(err);
    }

    const abiBinProvider = new AbiBinProvider();
    const bin = abiBinProvider.getBIN(ContractName);

    const bytesBaseCurrencyCode = this.auxiliaryWeb3.utils.stringToHex(baseCurrencyCode);
    const args = [
      organization,
      eip20Token,
      bytesBaseCurrencyCode,
      conversionRate,
      conversionRateDecimals,
      requiredPriceOracleDecimals,
      tokenRules
    ];
    const contract = Contracts.getPricerRule(auxiliaryWeb3);

    return contract.deploy({
      data: bin,
      arguments: args
    });
  }

  /**
   * Adds a new price oracle. From address should be only worker address.
   *
   * @param {string} priceOracleAddress PriceOracle contract address.
   * @param {Object} txOptions Tx options.
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async addPriceOracle(priceOracleAddress, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address ${txOptions.from} in transaction options.`);
      return Promise.reject(err);
    }
    const txObject = await this.addPriceOracleRawTx(priceOracleAddress);
    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Removes price oracle contract address for pay CurrencyCode. From address should be only worker address.
   *
   * @param {string} payCurrencyCode QuoteCurrency code. e.g. USD, ETH, BTC.
   * @param {Object} txOptions Tx options.
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async removePriceOracle(payCurrencyCode, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address ${txOptions.from} in transaction options.`);
      return Promise.reject(err);
    }
    const txObject = await this.removePriceOracleRawTx(payCurrencyCode);
    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Sets an acceptance margin for the base currency price per pay
   *         currency. From address should be only worker address.
   *
   * @param {string} payCurrencyCode QuoteCurrency code. e.g. USD, ETH, BTC.
   * @param {string} acceptanceMargin Acceptance margin for the base currency price per pay currency.
   * @param {Object} txOptions Tx options.
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async setAcceptanceMargin(payCurrencyCode, acceptanceMargin, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address ${txOptions.from} in transaction options.`);
      return Promise.reject(err);
    }
    let txObject = await this.setAcceptanceMarginRawTx(payCurrencyCode, acceptanceMargin);
    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Removes an acceptance margin of the base currency price in the
   *         specified pay currency. From address should be only worker address.
   *
   * @param {string} payCurrencyCode QuoteCurrency code. e.g. USD, ETH, BTC.
   * @param {Object} txOptions Tx options.
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async removeAcceptanceMargin(payCurrencyCode, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address ${txOptions.from} in transaction options.`);
      return Promise.reject(err);
    }
    const txObject = await this.removeAcceptanceMarginRawTx(payCurrencyCode);
    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Constructs executable data for PricerRule.pay method.
   *
   * @param {string} from Payment sender address.
   * @param {Array} toList Array of receivers.
   * @param {Array} amountList Array of amounts.
   * @param {string} payCurrencyCode Currency code of the specified amounts.
   * @param {string} baseCurrencyIntendedPrice The intended price of the base currency used during conversion within function.
   *
   * @returns {string} PricerRule.pay executable data.
   */
  getPayExecutableData(from, toList, amountList, payCurrencyCode, baseCurrencyIntendedPrice) {
    const bytesPayCurrencyCode = this.auxiliaryWeb3.utils.stringToHex(payCurrencyCode),
      payExecutableData = this.contract.methods
        .pay(from, toList, amountList, bytesPayCurrencyCode, baseCurrencyIntendedPrice)
        .encodeABI();

    return payExecutableData;
  }

  /**
   * Converts PayCurrencyCode amount to BT amount.
   *
   * @param {string} amountInWei Amount which is being transferred.
   * @param {string} priceInWei Price set in PriceOracle contract.
   * @param {string} conversionRate OST to BT conversion rate.
   * @param {string} conversionRateDecimals OST to BT conversion rate decimals.
   *
   * @returns {string} Converted BT amount.
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
   * @param {string} priceOracleAddress PriceOracle contract address.
   *
   * @return {Promise<Object>} Promise that resolves to raw transaction object.
   */
  addPriceOracleRawTx(priceOracleAddress) {
    if (!Web3.utils.isAddress(priceOracleAddress)) {
      const err = new TypeError(
        `Mandatory Parameter 'priceOracleAddress' is missing or invalid: ${priceOracleAddress}.`
      );
      return Promise.reject(err);
    }
    return Promise.resolve(this.contract.methods.addPriceOracle(priceOracleAddress));
  }

  /**
   * Removes the price oracle for the specified pay currency code.
   *
   * @param {string} payCurrencyCode QuoteCurrency code. e.g. ETH, BTC.
   *
   * @return {Promise<Object>} Promise that resolves to raw transaction object.
   */
  removePriceOracleRawTx(payCurrencyCode) {
    if (!payCurrencyCode) {
      const err = new TypeError(`Invalid payCurrencyCode value: ${payCurrencyCode}.`);
      return Promise.reject(err);
    }
    const bytesPayCurrencyCode = this.auxiliaryWeb3.utils.stringToHex(payCurrencyCode);
    return Promise.resolve(this.contract.methods.removePriceOracle(bytesPayCurrencyCode));
  }

  /**
   * Sets an acceptance margin for the base currency price per pay
   *      currency. From should be worker only.
   * @param {string} payCurrencyCode QuoteCurrency code. e.g. ETH, BTC.
   * @param {string} acceptanceMargin Acceptance margin for the base currency price per pay currency.
   *
   * @return {Promise<Object>} Promise that resolves to raw transaction object.
   */
  setAcceptanceMarginRawTx(payCurrencyCode, acceptanceMargin) {
    if (!payCurrencyCode) {
      const err = new TypeError(`Invalid payCurrencyCode value: ${payCurrencyCode}.`);
      return Promise.reject(err);
    }
    if (!acceptanceMargin) {
      const err = new TypeError(`Invalid acceptanceMargin value: ${acceptanceMargin}.`);
      return Promise.reject(err);
    }
    const bytesPayCurrencyCode = this.auxiliaryWeb3.utils.stringToHex(payCurrencyCode);
    return Promise.resolve(this.contract.methods.setAcceptanceMargin(bytesPayCurrencyCode, acceptanceMargin));
  }

  /**
   * Removes an acceptance margin of the base currency price in the
   *         specified pay currency. From should be worker only.
   *
   * @param {string} payCurrencyCode QuoteCurrency code. e.g. USD, ETH, BTC.
   *
   * @return {Promise<Object>} Promise that resolves to raw transaction object.
   */
  removeAcceptanceMarginRawTx(payCurrencyCode) {
    if (!payCurrencyCode) {
      const err = new TypeError(`Invalid payCurrencyCode value: ${payCurrencyCode}.`);
      return Promise.reject(err);
    }
    const bytesPayCurrencyCode = this.auxiliaryWeb3.utils.stringToHex(payCurrencyCode);
    return Promise.resolve(this.contract.methods.removeAcceptanceMargin(bytesPayCurrencyCode));
  }
}

module.exports = PricerRule;
