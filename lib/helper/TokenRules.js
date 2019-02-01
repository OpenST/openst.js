'use strict';

const AbiBinProvider = require('../AbiBinProvider');

const contractName = 'TokenRules';

/**
 * It is used to register an custom rule and fetch the registered rules.
 */
class TokenRules {
  /**
   * Constructor of TokenRules.
   *
   * @param tokenRules Address of token rules contract of an economy.
   * @param auxiliaryWeb3 Auxiliary chain web3.
   */
  constructor(tokenRules, auxiliaryWeb3) {
    const oThis = this;
    oThis.tokenRules = tokenRules;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * It is used to register a custom rule to the economy.
   *
   * @param ruleName Name of the rule.
   * @param ruleAddress Contract address of the rule.
   * @param ruleAbi Abi of the rule.
   * @param txOptions Tx options.
   *
   * @return Promise object.
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
        txReceipt = receipt;
      })
      .on('error', function(error) {
        console.log('ERROR !!! ', error);
      });
  }

  /**
   * Private method which is used to register a custom rule to the economy.
   *
   * @param ruleName Name of the rule.
   * @param ruleAddress Contract address of the rule.
   * @param ruleAbi Abi of the rule.
   * @param txOptions Tx options.
   * @private
   */
  _registerRule(ruleName, ruleAddress, ruleAbi, txOptions) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(contractName);
    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.tokenRules, txOptions);
    return contract.methods.registerRule(ruleName, ruleAddress, ruleAbi);
  }

  /**
   * It is used to fetch rule data by its name.
   *
   * @param ruleName Name of the rule.
   * @param txOptions Tx options.
   * @returns Rule data if present.
   */
  async getRuleByName(ruleName, txOptions) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(contractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.tokenRules, txOptions);

    const ruleNameHash = oThis.auxiliaryWeb3.utils.soliditySha3({ t: 'string', v: ruleName }),
      ruleIndex = await contract.methods.rulesByNameHash(ruleNameHash).call(),
      rule = await contract.methods.rules(ruleIndex.index).call();

    return rule;
  }

  /**
   * It is used to fetch rule data by its address.
   *
   * @param ruleAddress Address of the rule contract.
   * @param txOptions Tx options.
   * @returns Rule data if present.
   */
  async getRuleByAddress(ruleAddress, txOptions) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(contractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.tokenRules, txOptions);

    const ruleIndex = await contract.methods.rulesByAddress(ruleAddress).call(),
      rule = await contract.methods.rules(ruleIndex.index).call();

    return rule;
  }
}

module.exports = TokenRules;
