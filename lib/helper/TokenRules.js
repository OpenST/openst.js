'use strict';

const AbiBinProvider = require('../AbiBinProvider'),
  contractName = 'TokenRules';

const Utils = require('../../utils/Utils');

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
    Utils.deprecationNotice('helper.TokenRules', 'Please use TokenRules ContractInteract!!!');
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
  async registerRule(ruleName, ruleAddress, ruleAbi, txOptions) {
    const oThis = this;

    const txObject = oThis._registerRuleRawTx(ruleName, ruleAddress, ruleAbi);

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * It is used to get the executable data for directTransfers method of TokenRules.
   *
   * @param transferTo List of addresses to transfer.
   * @param transfersAmount List of amounts to transfer.
   *
   * @returns Executable data of directTransfers method.
   */
  getDirectTransferExecutableData(transferTo, transfersAmount) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(contractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.tokenRules),
      directTransferExecutableData = contract.methods.directTransfers(transferTo, transfersAmount).encodeABI();

    return directTransferExecutableData;
  }

  /**
   * Private method which is used to register a custom rule in the economy.
   *
   * @param ruleName Name of the rule.
   * @param ruleAddress Contract address of the rule.
   * @param ruleAbi Abi of the rule.
   * @private
   */
  _registerRuleRawTx(ruleName, ruleAddress, ruleAbi) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(contractName);
    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.tokenRules);
    return contract.methods.registerRule(ruleName, ruleAddress, ruleAbi);
  }

  /**
   * It is used to fetch rule data by its name.
   * Rule data consists:
   *  - RuleName: Name of the rule.
   *  - RuleAddress: Contract address of the rule contract.
   *  - RuleAbi: JSON interface of the rule.
   *
   * @param ruleName Name of the rule.
   *
   * @returns Rule data if present.
   */
  async getRuleByName(ruleName) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(contractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.tokenRules);

    const ruleNameHash = oThis.auxiliaryWeb3.utils.soliditySha3({ t: 'string', v: ruleName }),
      ruleIndex = await contract.methods.rulesByNameHash(ruleNameHash).call(),
      rule = await contract.methods.rules(ruleIndex.index).call();

    return rule;
  }

  /**
   * It is used to fetch rule data by its address.
   * Rule data consists:
   *  - RuleName: Name of the rule.
   *  - RuleAddress: Contract address of the rule contract.
   *  - RuleAbi: JSON interface of the rule.
   *
   * @param ruleAddress Address of the rule contract.
   *
   * @returns Rule data if present.
   */
  async getRuleByAddress(ruleAddress) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(contractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.tokenRules);

    const ruleIndex = await contract.methods.rulesByAddress(ruleAddress).call(),
      rule = await contract.methods.rules(ruleIndex.index).call();

    return rule;
  }
}

module.exports = TokenRules;
