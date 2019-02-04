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

const AbiBinProvider = require('../AbiBinProvider');

const contractName = 'TokenRules';

const TxSender = require('../../utils/TxSender');

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
  async registerRule(ruleName, ruleAddress, ruleAbi, txOptions) {
    const oThis = this;

    const txObject = oThis._registerRuleRawTx(ruleName, ruleAddress, ruleAbi);

    const txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();
    return txReceipt;
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
