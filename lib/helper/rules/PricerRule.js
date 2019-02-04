'user strict';

const AbiBinProvider = require('../AbiBinProvider'),
  PricerRuleContractName = 'PricerRule',
  TxSender = require('../../utils/TxSender');

class PricerRule {
  constructor(auxiliaryWeb3, contractAddress) {
    const oThis = this;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.pricerRuleAddress = contractAddress;

    oThis.abiBinProvider = new AbiBinProvider();
  }

  // TODO Worker
  async addPriceOracle(priceOracleAddress, txOptions) {
    let txObject = oThis._addPriceOracleRawTx(priceOracleAddress);

    let txReceipt;
    txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  // TODO Worker
  async removePriceOracle(payCurrencyCode, txOptions) {
    let txObject = oThis._removePriceOracleRawTx(payCurrencyCode);

    let txReceipt;
    txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  // TODO Worker
  async setAcceptanceMargin(payCurrencyCode, acceptanceMargin, txOptions) {
    let txObject = oThis._setAcceptanceMarginRawTx(payCurrencyCode, acceptanceMargin);

    let txReceipt;
    txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  _addPriceOracleRawTx(priceOracleAddress) {
    const oThis = this;

    return _priceRuleContractInstance().methods.addPriceOracle(priceOracleAddress);
  }

  _removePriceOracleRawTx(payCurrencyCode) {
    const oThis = this;

    const bytesPayCurrencyCode = oThis.auxiliaryWeb3.utils.stringToHex(payCurrencyCode.toString());
    return _priceRuleContractInstance().methods.removePriceOracle(bytesPayCurrencyCode);
  }

  _setAcceptedMarginRawTx(payCurrencyCode, acceptanceMargin) {
    const oThis = this;

    const bytesPayCurrencyCode = oThis.auxiliaryWeb3.utils.stringToHex(payCurrencyCode.toString());
    return _priceRuleContractInstance().methods.setAcceptedMargin(bytesPayCurrencyCode, acceptanceMargin);
  }

  _priceRuleContractInstance() {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(PricerRuleContractName),
      contractInstance = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.pricerRuleAddress);
    return contractInstance;
  }
}
