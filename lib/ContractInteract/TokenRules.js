'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./../AbiBinProvider');
const Contracts = require('../Contracts');

const Utils = require('../../utils/Utils');
const ContractName = 'TokenRules';

/**
 * This Class is used to interact with Recovery contracts.
 */
class TokenRules {
  /**
   * TokenRules class constructor.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary web3 object.
   * @param {string} address delayedRecovery proxy contract address.
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

    this.contract = Contracts.getTokenRules(this.auxiliaryWeb3, this.address);

    if (!this.contract) {
      const err = new TypeError(`Could not load TokenRules contract for: ${this.address}`);
      return Promise.reject(err);
    }
  }

  /**
   * Deploys TokenRules contract.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {string} organization Organization which holds all the keys needed to administer the economy.
   * @param {string} eip20Token EIP20 token contract address deployed for an economy.
   * @param {Object} txOptions Tx options.
   *
   * @returns {Promise<TokenRules>} Promise containing the TokenRules
   *                                instance that has been deployed.
   */
  static async deploy(auxiliaryWeb3, organization, eip20Token, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    const tx = TokenRules.deployRawTx(auxiliaryWeb3, organization, eip20Token);

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new TokenRules(auxiliaryWeb3, address);
    });
  }

  /**
   * Method which returns Tx object to deploy TokenRules contract.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {string} organization Organization which holds all the keys needed to administer the economy.
   * @param {string} eip20Token EIP20 token contract address deployed for an economy.
   *
   * @returns {Object} Raw transaction object.
   */
  static deployRawTx(auxiliaryWeb3, organization, eip20Token) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      throw new TypeError(`Mandatory Parameter 'auxiliaryWeb3' is missing or invalid: ${auxiliaryWeb3}`);
    }
    if (!Web3.utils.isAddress(organization)) {
      const err = new TypeError(`Invalid organization address: ${organization}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(eip20Token)) {
      const err = new TypeError(`Invalid eip20Token address: ${eip20Token}.`);
      return Promise.reject(err);
    }
    const abiBinProvider = new AbiBinProvider();
    const bin = abiBinProvider.getBIN(ContractName);

    const args = [organization, eip20Token];
    const contract = Contracts.getTokenRules(auxiliaryWeb3, organization, eip20Token);

    return contract.deploy({
      data: bin,
      arguments: args
    });
  }

  /**
   * It is used to register a custom rule to the economy.
   *
   * @param {string} ruleName Name of the rule.
   * @param {string} ruleAddress Contract address of the rule.
   * @param {string} ruleAbi Abi of the rule.
   * @param {Object} txOptions Tx options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async registerRule(ruleName, ruleAddress, ruleAbi, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    const txObject = await this.registerRuleRawTx(ruleName, ruleAddress, ruleAbi);
    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Private method which is used to register a custom rule in the economy.
   *
   * @param {string} ruleName Name of the rule.
   * @param {string} ruleAddress Contract address of the rule.
   * @param {string} ruleAbi Abi of the rule.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  registerRuleRawTx(ruleName, ruleAddress, ruleAbi) {
    if (!ruleName) {
      const err = new TypeError(`Invalid ruleName: ${ruleName}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(ruleAddress)) {
      const err = new TypeError(`Invalid ruleAddress: ${ruleAddress}.`);
      return Promise.reject(err);
    }
    if (!ruleAbi) {
      const err = new TypeError(`Invalid ruleAbi: ${ruleAbi}.`);
      return Promise.reject(err);
    }
    return Promise.resolve(this.contract.methods.registerRule(ruleName, ruleAddress, ruleAbi));
  }

  /**
   * It is used to get the executable data for directTransfers method of TokenRules.
   *
   * @param {Array} transferTos List of addresses to transfer.
   * @param {Array} transfersAmounts List of amounts to transfer.
   *
   * @returns {string} Executable data of directTransfers method.
   */
  getDirectTransferExecutableData(transferTos, transfersAmounts) {
    return this.contract.methods.directTransfers(transferTos, transfersAmounts).encodeABI();
  }

  /**
   * It is used to fetch rule data by its name.
   * Rule data consists:
   *  - RuleName: Name of the rule.
   *  - RuleAddress: Contract address of the rule contract.
   *  - RuleAbi: JSON interface of the rule.
   *
   * @param {string} ruleName Name of the rule.
   *
   * @returns {string} Rule data if present.
   */
  async getRuleByName(ruleName) {
    const ruleNameHash = this.auxiliaryWeb3.utils.soliditySha3({ t: 'string', v: ruleName });
    const ruleIndex = await this.contract.methods.rulesByNameHash(ruleNameHash).call();
    return this.contract.methods.rules(ruleIndex.index).call();
  }

  /**
   * It is used to fetch rule data by its address.
   * Rule data consists:
   *  - RuleName: Name of the rule.
   *  - RuleAddress: Contract address of the rule contract.
   *  - RuleAbi: JSON interface of the rule.
   *
   * @param {string} ruleAddress Address of the rule contract.
   *
   * @returns {string} Rule data if present.
   */
  async getRuleByAddress(ruleAddress) {
    const ruleIndex = await this.contract.methods.rulesByAddress(ruleAddress).call();
    return this.contract.methods.rules(ruleIndex.index).call();
  }
}

module.exports = TokenRules;
