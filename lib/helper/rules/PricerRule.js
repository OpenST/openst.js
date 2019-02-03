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

  async addPriceOracle(priceOracleAddress, txOptions) {
    let txObject = oThis._addPriceOracleRawTx(priceOracleAddress, txOptions);

    let txReceipt;
    txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  _addPriceOracleRawTx(priceOracleAddress) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(PricerRuleContractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.pricerRuleAddress);

    return contract.methods.addPriceOracle(priceOracleAddress);
  }

  removePriceOracle() {}
}
