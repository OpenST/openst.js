'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./../AbiBinProvider');
const Contracts = require('../Contracts');

const Utils = require('../../utils/Utils');
const ContractName = 'TokenHolder';

/**
 * This Class is used to interact with TokenHolder contracts.
 */
class TokenHolder {
  /**
   * Constructor of TokenHolder.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary web3 object.
   * @param {string} address tokenHolder proxy contract address.
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

    this.contract = Contracts.getTokenHolder(this.auxiliaryWeb3, this.address);

    if (!this.contract) {
      const err = new TypeError(`Could not load TokenHolder contract for: ${this.address}`);
      return Promise.reject(err);
    }
  }

  /**
   * Deploys TokenHolder master copy contract.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
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

    const tx = TokenHolder.deployRawTx(auxiliaryWeb3);

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new TokenHolder(auxiliaryWeb3, address);
    });
  }

  /**
   * Method which returns Tx object to deploy TokenHolder master copy contract.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   *
   * @returns {Object} Raw transaction object.
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
   * @param {string} sessionKey Session key address to authorize.
   * @param {string} spendingLimit Spending limit of the session key.
   * @param {string} expirationHeight Expiration height of the session key.
   *
   * @returns {string} Executable data for authorizing a session.
   */
  getAuthorizeSessionExecutableData(sessionKey, spendingLimit, expirationHeight) {
    return this.contract.methods.authorizeSession(sessionKey, spendingLimit, expirationHeight).encodeABI();
  }

  /**
   * Revokes session for the specified session key.
   *
   * @param {string} sessionKey Session key to revoke.
   *
   * @returns {string} Executable data to revoke a session.
   */
  getRevokeSessionExecutableData(sessionKey) {
    if (!Web3.utils.isAddress(sessionKey)) {
      const err = new TypeError(`Invalid sessionKey address: ${sessionKey}.`);
      return Promise.reject(err);
    }
    return this.contract.methods.revokeSession(sessionKey).encodeABI();
  }

  /**
   * Logout all authorized sessions.
   *
   * @returns {string} Executable data to logout sessions.
   */
  getLogoutExecutableData() {
    return this.contract.methods.logout().encodeABI();
  }

  /**
   * It is used to get call prefix of executeRule method in TokenHolder contract.
   *
   * @returns {string} Encoded signature of executeRule method.
   */
  getTokenHolderExecuteRuleCallPrefix() {
    const executeRuleHash = this.auxiliaryWeb3.utils.soliditySha3(
      'executeRule(address,bytes,uint256,uint8,bytes32,bytes32)'
    );
    const executeRuleCallPrefix = executeRuleHash.substring(0, 10);
    return executeRuleCallPrefix;
  }

  /**
   * It is used to execute executable data signed by a session key.
   *
   * @param {string} to The target contract address the transaction will be executed upon.
   * @param {string} data The payload of a function to be executed in the target contract.
   * @param {string} nonce The nonce of an session key that was used to sign the transaction.
   * @param {string} r `r` part of the signature.
   * @param {string} s `s` part of the signature.
   * @param {string} v `v` part of the signature.
   * @param {Object} txOptions Tx options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async executeRule(to, data, nonce, r, s, v, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    const txObject = await this.executeRuleRawTx(to, data, nonce, r, s, v);
    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Private method which is used to execute executable data signed by a session key.
   *
   * @param {string} to The target contract address the transaction will be executed upon.
   * @param {string} data The payload of a function to be executed in the target contract.
   * @param {string} nonce The nonce of an session key that was used to sign the transaction.
   * @param {string} r `r` part of the signature signed by sessionKey.
   * @param {string} s `s` part of the signature signed by sessionKey.
   * @param {string} v `v` part of the signature signed by sessionKey.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  executeRuleRawTx(to, data, nonce, r, s, v) {
    if (!Web3.utils.isAddress(to)) {
      const err = new TypeError(`Invalid to address: ${to}.`);
      return Promise.reject(err);
    }
    if (!data) {
      const err = new TypeError(`Invalid data: ${data}.`);
      return Promise.reject(err);
    }
    if (!nonce) {
      const err = new TypeError(`Invalid nonce: ${nonce}.`);
      return Promise.reject(err);
    }
    return Promise.resolve(this.contract.methods.executeRule(to, data, nonce, r, s, v));
  }

  /**
   * It returns the session key data object.
   *
   * @param {string} sessionKey Authorized session key address.
   *
   * @return {Promise<Object>} Promise that resolves session data for valid session key.
   */
  getSessionKeyData(sessionKey) {
    if (!Web3.utils.isAddress(sessionKey)) {
      const err = new TypeError(`Invalid sessionKey address: ${sessionKey}.`);
      return Promise.reject(err);
    }
    return Promise.resolve(this.contract.methods.sessionKeys(sessionKey).call());
  }
}

module.exports = TokenHolder;
