'use strict';

const AbiBinProvider = require('./AbiBinProvider');
const Contracts = require('./Contracts');
const Utils = require('../utils/Utils');

/**
 * Class is used to create a wallet of an user and configure it.
 */
class User {
  /**
   * @constructor
   *
   * @param tokenHolderMasterCopy The address of a master copy of TokenHolder contract.
   * @param gnosisSafeMasterCopy The address of a master copy of GnosisSafe contract.
   * @param createAndAddModules The address of CreateAndAddModules contract.
   * @param delayedRecoveryModuleMasterCopy The address of a master copy of
   *                                        DelayedRecoveryModule contract.
   * @param eip20Token The address of EIP20Token contract of the economy.
   * @param tokenRules The address of TokenRules contract.
   * @param userWalletFactory The address of UserWalletFactory contract.
   * @param proxyFactory The address of ProxyFactory contract.
   * @param auxiliaryWeb3 Auxiliary chain's web3 object.
   */
  constructor(
    tokenHolderMasterCopy,
    gnosisSafeMasterCopy,
    delayedRecoveryModuleMasterCopy,
    createAndAddModules,
    eip20Token,
    tokenRules,
    userWalletFactory,
    proxyFactory,
    auxiliaryWeb3
  ) {
    this.tokenHolderMasterCopy = tokenHolderMasterCopy;
    this.gnosisSafeMasterCopy = gnosisSafeMasterCopy;
    this.delayedRecoveryModuleMasterCopy = delayedRecoveryModuleMasterCopy;
    this.createAndAddModules = createAndAddModules;
    this.eip20Token = eip20Token;
    this.tokenRules = tokenRules;
    this.userWalletFactory = userWalletFactory;
    this.proxyFactory = proxyFactory;
    this.auxiliaryWeb3 = auxiliaryWeb3;
    this.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Generates DelayedRecoveryModule::setup() function's executable data.
   *
   * @param recoveryOwnerAddress  An address that signs the "recovery
   *                              initiation/abortion" and "reset recovery owner"
   *                              requests.
   * @param recoveryControllerAddress An address that relays signed requests of
   *                                  different types.
   * @param recoveryBlockDelay A required number of blocks to pass to
   *                           be able to execute a recovery request.
   *
   * @returns {String} Executable data of the function.
   */
  getDelayedRecoveryModuleSetupData(recoveryOwnerAddress, recoveryControllerAddress, recoveryBlockDelay) {
    return this.auxiliaryWeb3.eth.abi.encodeFunctionCall(
      {
        name: 'setup',
        type: 'function',
        inputs: [
          {
            type: 'address',
            name: 'recoveryOwnerAddress'
          },
          {
            type: 'address',
            name: 'recoveryControllerAddress'
          },
          {
            type: 'uint256',
            name: 'recoveryBlockDelay'
          }
        ]
      },
      [recoveryOwnerAddress, recoveryControllerAddress, recoveryBlockDelay]
    );
  }

  /**
   * Generates ProxyFactory::createProxy() function's executable data to
   * create DelayedRecoveryModule proxy.
   *
   * @param  delayedRecoverySetupData Executable data of the DelayedRecoveryModule::setup()
   *                                  function.
   *
   * @returns {String} Executable data of the function.
   */
  getDelayedRecoveryModuleCreationData(delayedRecoverySetupData) {
    return this.auxiliaryWeb3.eth.abi.encodeFunctionCall(
      {
        name: 'createProxy',
        type: 'function',
        inputs: [
          {
            type: 'address',
            name: 'delayedRecoveryModuleMasterCopy'
          },
          {
            type: 'bytes',
            name: 'delayedRecoverySetupData'
          }
        ]
      },
      [this.delayedRecoveryModuleMasterCopy, delayedRecoverySetupData]
    );
  }

  /**
   * Generates CreateAndAddModules::createAndAddModules() function's executable
   * data to create and enable modules in GnosisSafe.
   *
   * @param {String{}} modulesCreationData An array of an executable data to create and enable
   *                                       modules within GnosisSafe during construction.
   *
   * @returns {String} Executable data of the function.
   */
  getCreateAndAddModulesData(modulesCreationData) {
    const ModuleDataWrapper = new this.auxiliaryWeb3.eth.Contract([
      {
        constant: false,
        inputs: [
          {
            name: 'data',
            type: 'bytes'
          }
        ],
        name: 'setup',
        type: 'function'
      }
    ]);

    // Remove method id (10) and position of data in payload (64)
    const reducedModulesCreationData = modulesCreationData.reduce(
      (acc, data) =>
        acc +
        ModuleDataWrapper.methods
          .setup(data)
          .encodeABI()
          .substr(74),
      '0x'
    );

    return this.auxiliaryWeb3.eth.abi.encodeFunctionCall(
      {
        name: 'createAndAddModules',
        type: 'function',
        inputs: [
          {
            type: 'address',
            name: 'proxyFactory'
          },
          {
            type: 'bytes',
            name: 'data'
          }
        ]
      },
      [this.proxyFactory, reducedModulesCreationData]
    );
  }

  /**
   * Generate the executable data for setup method of GnosisSafe contract.
   *
   * @param owners List of owners of the multisig contract for a user.
   * @param threshold Number of required confirmations for a Safe transaction.
   * @param recoveryOwnerAddress  An address that signs the "recovery
   *                              initiation/abortion" and "reset recovery owner"
   *                              requests.
   * @param recoveryControllerAddress An address that relays signed requests of
   *                                  different types.
   * @param recoveryBlockDelay A required number of blocks to pass to
   *                           be able to execute a recovery request.
   * @returns {String}
   */
  getGnosisSafeData(owners, threshold, recoveryOwnerAddress, recoveryControllerAddress, recoveryBlockDelay) {
    const delayedRecoveryModuleSetupData = this.getDelayedRecoveryModuleSetupData(
      recoveryOwnerAddress,
      recoveryControllerAddress,
      recoveryBlockDelay
    );

    const delayedRecoveryModuleCreationData = this.getDelayedRecoveryModuleCreationData(delayedRecoveryModuleSetupData);

    const createAndAddModulesData = this.getCreateAndAddModulesData([delayedRecoveryModuleCreationData]);

    return this.auxiliaryWeb3.eth.abi.encodeFunctionCall(
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
      [owners, threshold, this.createAndAddModules, createAndAddModulesData]
    );
  }

  /**
   * Returns TokenHolder setup executable data.
   *
   * @param owner Owner address. Owner could be hardware wallet.
   * @param sessionKeys Array of session keys.
   * @param sessionKeysSpendingLimits Array of spending limits.
   * @param sessionKeysExpirationHeights Array of expiration heights.
   *
   * @returns {*}
   */
  getTokenHolderSetupExecutableData(owner, sessionKeys, sessionKeysSpendingLimits, sessionKeysExpirationHeights) {
    const contract = Contracts.getTokenHolder(this.auxiliaryWeb3, this.tokenHolderMasterCopy);
    return contract.methods
      .setup(
        this.eip20Token,
        this.tokenRules,
        owner,
        sessionKeys,
        sessionKeysSpendingLimits,
        sessionKeysExpirationHeights
      )
      .encodeABI();
  }

  /**
   * It is used for creation and configuration of gnosis safe and token holder
   * proxy contract for user.
   *
   * @param owners List of owners of the multisig.
   * @param threshold Number of required confirmations for a Safe transaction.
   * @param recoveryOwnerAddress  An address that signs the "recovery
   *                              initiation/abortion" and "reset recovery owner"
   *                              requests.
   * @param recoveryControllerAddress An address that relays signed requests of
   *                                  different types.
   * @param recoveryBlockDelay A required number of blocks to pass to
   *                           be able to execute a recovery request.
   * @param sessionKeys Session key addresses to authorize.
   * @param sessionKeysSpendingLimits Session key's spending limits.
   * @param sessionKeysExpirationHeights Session key's expiration heights.
   * @param txOptions Tx options.
   *
   * @returns Promise object.
   */
  async createUserWallet(
    owners,
    threshold,
    recoveryOwnerAddress,
    recoveryControllerAddress,
    recoveryBlockDelay,
    sessionKeys,
    sessionKeysSpendingLimits,
    sessionKeysExpirationHeights,
    txOptions
  ) {
    const txObject = this._createUserWalletRawTx(
      owners,
      threshold,
      recoveryOwnerAddress,
      recoveryControllerAddress,
      recoveryBlockDelay,
      sessionKeys,
      sessionKeysSpendingLimits,
      sessionKeysExpirationHeights
    );

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Method for creation and configuration of token holder proxy contract for company
   * with hardware wallet as it's owner.
   *
   * @param owner TokenHolder proxy owner address. It could be hardware wallet address.
   * @param sessionKeys Session key addresses to authorize.
   * @param sessionKeysSpendingLimits Session key's spending limits.
   * @param sessionKeysExpirationHeights Session key's expiration heights.
   *
   * @returns Promise object.
   */
  async createCompanyWallet(owner, sessionKeys, sessionKeysSpendingLimits, sessionKeysExpirationHeights, txOptions) {
    const txObject = this._createCompanyWalletRawTx(
      owner,
      sessionKeys,
      sessionKeysSpendingLimits,
      sessionKeysExpirationHeights
    );

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Private method used for creation and configuration of gnosis safe and
   * tokenholder contract for an user.
   *
   * @param owners List of owners of the multisig.
   * @param threshold Number of required confirmations for a Safe transaction.
   * @param recoveryOwnerAddress  An address that signs the "recovery
   *                              initiation/abortion" and "reset recovery owner"
   *                              requests.
   * @param recoveryControllerAddress An address that relays signed requests of
   *                                  different types.
   * @param recoveryBlockDelay A required number of blocks to pass to
   *                           be able to execute a recovery request.
   * @param sessionKeys Session key addresses to authorize.
   * @param sessionKeysSpendingLimits Session key's spending limits.
   * @param sessionKeysExpirationHeights Session key's expiration heights.
   * @private
   */
  _createUserWalletRawTx(
    owners,
    threshold,
    recoveryOwnerAddress,
    recoveryControllerAddress,
    recoveryBlockDelay,
    sessionKeys,
    sessionKeysSpendingLimits,
    sessionKeysExpirationHeights
  ) {
    const gnosisSafeData = this.getGnosisSafeData(
      owners,
      threshold,
      recoveryOwnerAddress,
      recoveryControllerAddress,
      recoveryBlockDelay
    );
    const contract = Contracts.getUserWalletFactory(this.auxiliaryWeb3, this.userWalletFactory);
    return contract.methods.createUserWallet(
      this.gnosisSafeMasterCopy,
      gnosisSafeData,
      this.tokenHolderMasterCopy,
      this.eip20Token,
      this.tokenRules,
      sessionKeys,
      sessionKeysSpendingLimits,
      sessionKeysExpirationHeights
    );
  }

  /**
   * Private method used for creation and configuration of token holder proxy contract for company
   * with hardware wallet as it's owner.
   *
   * @param owner TokenHolder proxy owner address. It could be hardware wallet address.
   * @param sessionKeys Session key addresses to authorize.
   * @param sessionKeysSpendingLimits Session key's spending limits.
   * @param sessionKeysExpirationHeights Session key's expiration heights.
   *
   * @returns Promise object.
   */
  _createCompanyWalletRawTx(owner, sessionKeys, sessionKeysSpendingLimits, sessionKeysExpirationHeights) {
    const thSetupExecutableData = this.getTokenHolderSetupExecutableData(
      owner,
      sessionKeys,
      sessionKeysSpendingLimits,
      sessionKeysExpirationHeights
    );

    const contract = Contracts.getProxyFactory(this.auxiliaryWeb3, this.proxyFactory);
    return contract.methods.createProxy(this.tokenHolderMasterCopy, thSetupExecutableData);
  }
}

module.exports = User;
