'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./../AbiBinProvider');

const Contracts = require('../Contracts');
const Utils = require('../../utils/Utils');
const ContractName = 'TokenHolder';

/**
 * This library is used to interact with TokenHolder contracts.
 */
class TokenHolder {
  /**
   * Constructor of TokenHolder.
   *
   * @param auxiliaryWeb3 Auxiliary web3 object.
   * @param tokenHolderAddress tokenHolder proxy contract address.
   */
  constructor(auxiliaryWeb3, tokenHolderAddress) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      const err = new TypeError("Mandatory Parameter 'auxiliaryWeb3' is missing or invalid.");
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(tokenHolderAddress)) {
      const err = new TypeError(
        `Mandatory Parameter 'tokenHolderAddress' is missing or invalid: ${tokenHolderAddress}.`
      );
      return Promise.reject(err);
    }

    this.auxiliaryWeb3 = auxiliaryWeb3;
    this.tokenHolderAddress = tokenHolderAddress;

    this.contract = Contracts.getTokenHolder(this.auxiliaryWeb3, this.tokenHolderAddress);

    if (!this.contract) {
      const err = new TypeError(`Could not load tokenHolder contract for: ${this.tokenHolderAddress}`);
      return Promise.reject(err);
    }
  }

  /**
   * Deploys TokenHolder master copy contract.
   *
   * @param {Web3} auxiliaryWeb3 Origin chain web3 object.
   * @param {Object} txOptions Tx options.
   *
   * @returns {Promise<TokenHolder>} Promise containing the TokenHolder
   *                                  instance that has been deployed.
   */
  static async deploy(auxiliaryWeb3, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    const tx = TokenHolder.deployRawTx();

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new TokenHolder(auxiliaryWeb3, address);
    });
  }

  /**
   * Method which returns Tx object to deploy TokenHolder master copy contract.
   *
   * @param {auxiliaryWeb3} auxiliaryWeb3 Auxiliary chain web3 object.
   *
   * @returns {Object} Raw transaction.
   */
  static deployRawTx(auxiliaryWeb3) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      throw new TypeError(`Mandatory Parameter 'auxiliaryWeb3' is missing or invalid: ${auxiliaryWeb3}`);
    }
    const abiBinProvider = new AbiBinProvider();
    const bin = abiBinProvider.getBIN(ContractName);

    const args = [];
    const contract = Contracts.getTokenHolder(auxiliaryWeb3);

    return contract.deploy({
      data: bin,
      arguments: args
    });
  }

  /**
   * Authorizes a session. Expiration height should be greater than current block height.
   *
   * @param sessionKey Session key address to authorize.
   * @param spendingLimit Spending limit of the session key.
   * @param expirationHeight Expiration height of the session key.
   *
   * @returns {String} Executable data for authorizing a session.
   */
  getAuthorizeSessionExecutableData(sessionKey, spendingLimit, expirationHeight) {
    return this.contract.methods.authorizeSession(sessionKey, spendingLimit, expirationHeight).encodeABI();
  }

  /**
   * Revokes session for the specified session key.
   *
   * @param sessionKey Session key to revoke.
   *
   * @returns {String} Executable data to revoke a session.
   */
  getRevokeSessionExecutableData(sessionKey) {
    return this.contract.methods.revokeSession(sessionKey).encodeABI();
  }

  /**
   * Logout all authorized sessions.
   *
   * @returns {String} Executable data to logout sessions.
   */
  getLogoutExecutableData() {
    return this.contract.methods.logout().encodeABI();
  }

  /**
   * It is used to get call prefix of executeRule method in TokenHolder contract.
   *
   * @returns {String} Encoded signature of executeRule method.
   */
  getTokenHolderExecuteRuleCallPrefix() {
    const executeRuleHash = this.auxiliaryWeb3.utils.soliditySha3(
      'executeRule(address,bytes,uint256,uint8,bytes32,bytes32)'
    );
    const executeRuleCallPrefix = executeRuleHash.substring(0, 10);
    return executeRuleCallPrefix;
  }

  /**
   * Private method which is used to execute executable data signed by a session key.
   *
   * @param to The target contract address the transaction will be executed upon.
   * @param data The payload of a function to be executed in the target contract.
   * @param nonce The nonce of an session key that was used to sign the transaction.
   * @param r `r` part of the signature.
   * @param s `s` part of the signature.
   * @param v `v` part of the signature.
   */
  executeRuleRawTx(to, data, nonce, r, s, v) {
    return this.contract.methods.executeRule(to, data, nonce, r, s, v);
  }

  /**
   * It is used to execute executable data signed by a session key.
   *
   * @param to The target contract address the transaction will be executed upon.
   * @param data The payload of a function to be executed in the target contract.
   * @param nonce The nonce of an session key that was used to sign the transaction.
   * @param r `r` part of the signature.
   * @param s `s` part of the signature.
   * @param v `v` part of the signature.
   * @param txOptions Tx options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async executeRule(to, data, nonce, r, s, v, txOptions) {
    const txObject = this.executeRuleRawTx(to, data, nonce, r, s, v);
    return Utils.sendTransaction(txObject, txOptions);
  }
}

module.exports = TokenHolder;
