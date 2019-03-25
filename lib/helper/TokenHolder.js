'use strict';

const AbiBinProvider = require('./../AbiBinProvider');

const Utils = require('../../utils/Utils');

const tokenHolderContractName = 'TokenHolder';

/**
 * It consists of methods for a user's TokenHolder.
 */
class TokenHolder {
  /**
   * Constructor of TokenHolder.
   *
   * @param auxiliaryWeb3 Auxiliary web3 object.
   * @param tokenHolderProxy TokenHolder proxy address of a user.
   */
  constructor(auxiliaryWeb3, tokenHolderProxy) {
    Utils.deprecationNotice('helper.TokenHolder', 'Please use TokenHolder ContractInteract!!!');
    const oThis = this;

    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.tokenHolderProxy = tokenHolderProxy;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Authorizes a session. Expiration height should be greater than current block height.
   *
   * @param sessionKey Session key address to authorize.
   * @param spendingLimit Spending limit of the session key.
   * @param expirationHeight Expiration height of the session key.
   *
   * @returns {*} Executable data for authorizing a session.
   */
  getAuthorizeSessionExecutableData(sessionKey, spendingLimit, expirationHeight) {
    const oThis = this;

    const contract = oThis.getTokenHolderInstance(),
      executableData = contract.methods.authorizeSession(sessionKey, spendingLimit, expirationHeight).encodeABI();

    return executableData;
  }

  /**
   * Revokes session for the specified session key.
   *
   * @param sessionKey Session key to revoke.
   *
   * @returns {*} Executable data to revoke a session.
   */
  getRevokeSessionExecutableData(sessionKey) {
    const oThis = this;

    const contract = oThis.getTokenHolderInstance(),
      executableData = contract.methods.revokeSession(sessionKey).encodeABI();

    return executableData;
  }

  /**
   * Logout all authorized sessions.
   *
   * @returns {*} Executable data to logout sessions.
   */
  getLogoutExecutableData() {
    const oThis = this;

    const contract = oThis.getTokenHolderInstance(),
      executableData = contract.methods.logout().encodeABI();

    return executableData;
  }

  /**
   * It is used to get call prefix of executeRule method in TokenHolder contract.
   *
   * @returns Encoded signature of executeRule method.
   */
  getTokenHolderExecuteRuleCallPrefix() {
    const oThis = this;

    const executeRuleHash = oThis.auxiliaryWeb3.utils.soliditySha3(
      'executeRule(address,bytes,uint256,bytes32,bytes32,uint8)'
    );
    const executeRuleCallPrefix = executeRuleHash.substring(0, 10);

    return executeRuleCallPrefix;
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
   * @returns Promise object.
   */
  async executeRule(to, data, nonce, r, s, v, txOptions) {
    const oThis = this;

    const txObject = oThis._executeRuleRawTx(to, data, nonce, r, s, v);
    return Utils.sendTransaction(txObject, txOptions);
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
   * @private
   */
  _executeRuleRawTx(to, data, nonce, r, s, v) {
    const oThis = this;

    const contract = oThis.getTokenHolderInstance();

    return contract.methods.executeRule(to, data, nonce, r, s, v);
  }

  /**
   * Method to get tokenholder contract instance.
   *
   * @returns {oThis.auxiliaryWeb3.eth.Contract}
   */
  getTokenHolderInstance() {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(tokenHolderContractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.tokenHolderProxy);

    return contract;
  }
}

module.exports = TokenHolder;
