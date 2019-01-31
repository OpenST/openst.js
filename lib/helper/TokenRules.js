'use strict';

const AbiBinProvider = require('../AbiBinProvider');

const contractName = 'TokenRules';

class TokenRules {
  /**
   *
   * @param tokenRules
   */
  constructor(tokenRules, auxiliaryWeb3) {
    const oThis = this;
    oThis.tokenRules = tokenRules;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   *
   * @param ruleName
   * @param ruleAddress
   * @param ruleAbi
   * @param txOptions
   */
  registerRule(ruleName, ruleAddress, ruleAbi, txOptions) {
    const oThis = this;

    const txObject = oThis._registerRule(ruleName, ruleAddress, ruleAbi, txOptions);

    let txReceipt;

    return txObject
      .send(txOptions)
      .on('transactionHash', function(value) {
        console.log('transaction hash :- ', value);
      })
      .on('receipt', function(receipt) {
        console.log('Receipt :- ', JSON.stringify(receipt));
        txReceipt = receipt;
        // return txReceipt;
      })
      .on('error', function(error) {
        console.log('ERROR !!! ', error);
      });
  }

  /**
   *
   * @param ruleName
   * @param ruleAddress
   * @param ruleAbi
   * @param txOptions
   */
  _registerRule(ruleName, ruleAddress, ruleAbi, txOptions) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(contractName);
    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.tokenRules, txOptions);
    return contract.methods.registerRule(ruleName, ruleAddress, ruleAbi);
  }

  /**
   *
   */
  _getRuleBy() {}
}

module.exports = TokenRules;
