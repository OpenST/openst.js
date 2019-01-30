'use strict';

const AbiBinProvider = require('./AbiBinProvider');

const UserWalletFactoryContractName = 'UserWalletFactory';

/**
 * This is used to create wallet of an user and configure it.
 */
class User {
  /**
   * Constructor of User.
   *
   * @param gnosisSafeMasterCopy The address of a master copy of gnosis safe contract.
   * @param tokenHolderMasterCopy The address of a master copy of token holder contract.
   * @param eip20Token The address of the economy token.
   * @param tokenRules The address of the token rules.
   * @param userWalletFactoryAddress Address of UserWalletFactory contract.
   * @param auxiliaryWeb3 Auxiliary chain web3 object.
   */
  constructor(
    gnosisSafeMasterCopy,
    tokenHolderMasterCopy,
    eip20Token,
    tokenRules,
    userWalletFactoryAddress,
    auxiliaryWeb3
  ) {
    const oThis = this;

    oThis.gnosisSafeMasterCopy = gnosisSafeMasterCopy;
    oThis.tokenHolderMasterCopy = tokenHolderMasterCopy;
    oThis.eip20Token = eip20Token;
    oThis.tokenRules = tokenRules;
    oThis.userWalletFactoryAddress = userWalletFactoryAddress;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;

    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Generate the executable data for setup method of GnosisSafe contract.
   *
   * @param owners List of owners of the multisig contract for a user.
   * @param threshold Number of required confirmations for a Safe transaction.
   * @param to Contract address for optional delegate call.
   * @param data Data payload for optional delegate call.
   * @returns {String}
   */
  getGnosisSafeData(owners, threshold, to, data) {
    const oThis = this;

    return oThis.auxiliaryWeb3.eth.abi.encodeFunctionCall(
      {
        name: 'setup',
        type: 'function',
        inputs: [
          {
            type: 'address[]',
            name: '_owners'
          },
          {
            type: 'uint256',
            name: '_threshold'
          },
          {
            type: 'address',
            name: 'to'
          },
          {
            type: 'bytes',
            name: 'data'
          }
        ]
      },
      [owners, threshold, to, data]
    );
  }

  /**
   * It is used for creation and configuration of gnosis safe and token holder proxy contract for user.
   *
   * @param owners List of owners of the multisig.
   * @param threshold Number of required confirmations for a Safe transaction.
   * @param to Contract address for optional delegate call.
   * @param data Data payload for optional delegate call.
   * @param sessionKeys Session key addresses to authorize.
   * @param sessionKeysSpendingLimits Session key's spending limits.
   * @param sessionKeysExpirationHeights Session key's expiration heights.
   * @param initiator
   * @param recovery
   * @param delay
   * @param txOptions Tx options.
   * @returns Promise object.
   */
  createUserWallet(
    owners,
    threshold,
    to,
    data,
    sessionKeys,
    sessionKeysSpendingLimits,
    sessionKeysExpirationHeights,
    initiator,
    recovery,
    delay,
    txOptions
  ) {
    const oThis = this;

    let txObject = oThis._createUserWallet(
      owners,
      threshold,
      to,
      data,
      sessionKeys,
      sessionKeysSpendingLimits,
      sessionKeysExpirationHeights,
      txOptions
    );
    console.log('Creating user wallet: ');
    let txReceipt, transactionHash;
    return txObject
      .send(txOptions)
      .on('receipt', function(value) {
        txReceipt = value;
        console.log('receipt for creating user wallet: ', JSON.stringify(txReceipt));
      })
      .on('transactionHash', function(value) {
        console.log('transaction hash for creating user wallet: ' + value);
        transactionHash = value;
      })
      .on('error', function(error) {
        return Promise.reject(error);
      });
  }

  /**
   * Private method used for creation and configuration of gnosis safe and tokenholder contract for an user.
   *
   * @param owners List of owners of the multisig.
   * @param threshold Number of required confirmations for a Safe transaction.
   * @param to Contract address for optional delegate call.
   * @param data Data payload for optional delegate call.
   * @param sessionKeys Session key addresses to authorize.
   * @param sessionKeysSpendingLimits Session key's spending limits.
   * @param sessionKeysExpirationHeights Session key's expiration heights.
   * @param initiator
   * @param recovery
   * @param delay
   * @param txOptions Tx options.
   * @private
   */
  _createUserWallet(
    owners,
    threshold,
    to,
    data,
    sessionKeys,
    sessionKeysSpendingLimits,
    sessionKeysExpirationHeights,
    initiator,
    recovery,
    delay,
    txOptions
  ) {
    const oThis = this;

    const gnosisSafeData = oThis.getGnosisSafeData(owners, threshold, to, data);

    const jsonInterface = oThis.abiBinProvider.getABI(UserWalletFactoryContractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.userWalletFactoryAddress, txOptions);

    return contract.methods.createUserWallet(
      oThis.gnosisSafeMasterCopy,
      gnosisSafeData,
      oThis.tokenHolderMasterCopy,
      oThis.eip20Token,
      oThis.tokenRules,
      sessionKeys,
      sessionKeysSpendingLimits,
      sessionKeysExpirationHeights
    );
  }
}

module.exports = User;
