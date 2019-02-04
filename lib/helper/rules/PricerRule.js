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

'user strict';

const AbiBinProvider = require('./../../AbiBinProvider'),
  PricerRuleContractName = 'PricerRule',
  TxSender = require('./../../../utils/TxSender');

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
   * Adds a new price oracle. From should be worker only.
   *
   * @param priceOracleAddress PriceOracle contract address.
   * @param txOptions Tx options.
   * @returns {Promise<*>}
   */
  async addPriceOracle(priceOracleAddress, txOptions) {
    const oThis = this;
    let txObject = oThis._addPriceOracleRawTx(priceOracleAddress);

    let txReceipt;
    txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  /**
   * Removes price oracle contract address for pay CurrencyCode. From should be worker only.
   *
   * @param payCurrencyCode QuoteCurrency code. e.g. ETH, BTC.
   * @param txOptions Tx options.
   * @returns {Promise<*>}
   */
  async removePriceOracle(payCurrencyCode, txOptions) {
    const oThis = this;
    let txObject = oThis._removePriceOracleRawTx(payCurrencyCode);

    let txReceipt;
    txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  /**
   * Sets an acceptance margin for the base currency price per pay
   *         currency. From should be worker only.
   *
   * @param payCurrencyCode QuoteCurrency code. e.g. ETH, BTC.
   * @param acceptanceMargin Acceptance margin for the base currency price per pay currency.
   * @param txOptions Tx options.
   * @returns {Promise<*>}
   */
  async setAcceptanceMargin(payCurrencyCode, acceptanceMargin, txOptions) {
    const oThis = this;
    let txObject = oThis._setAcceptanceMarginRawTx(payCurrencyCode, acceptanceMargin);

    let txReceipt;
    txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  /**
   * Removes an acceptance margin of the base currency price in the
   *         specified pay currency. From should be worker only.
   *
   * @param payCurrencyCode QuoteCurrency code. e.g. ETH, BTC.
   * @param txOptions Tx options.
   * @returns {Promise<*>}
   */
  async removeAcceptanceMargin(payCurrencyCode, txOptions) {
    const oThis = this;
    let txObject = oThis._removeAcceptanceMarginRawTx(payCurrencyCode);

    let txReceipt;
    txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  /**
   * Adds a new price oracle.
   *
   * @param priceOracleAddress PriceOracle contract address.
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
   * @returns {*}
   * @private
   */
  _setAcceptanceMarginRawTx(payCurrencyCode, acceptanceMargin) {
    const oThis = this;

    const bytesPayCurrencyCode = oThis.auxiliaryWeb3.utils.stringToHex(payCurrencyCode.toString());
    return oThis._pricerRuleContractInstance().methods.setAcceptedMargin(bytesPayCurrencyCode, acceptanceMargin);
  }

  /**
   * Removes an acceptance margin of the base currency price in the
   *         specified pay currency. From should be worker only.
   *
   * @param payCurrencyCode QuoteCurrency code. e.g. ETH, BTC.
   * @returns {Promise<*>}
   * @private
   */
  _removeAcceptanceMarginRawTx(payCurrencyCode) {
    const oThis = this;

    const bytesPayCurrencyCode = oThis.auxiliaryWeb3.utils.stringToHex(payCurrencyCode.toString());
    return oThis._pricerRuleContractInstance().methods.removeAcceptedMargin(bytesPayCurrencyCode);
  }

  /**
   * Returns PricerRule contract instance.
   *
   * @returns {oThis.auxiliaryWeb3.eth.Contract}
   * @private
   */
  _pricerRuleContractInstance() {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(PricerRuleContractName),
      contractInstance = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.pricerRuleAddress);
    return contractInstance;
  }
}
