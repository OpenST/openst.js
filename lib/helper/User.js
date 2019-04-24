'use strict';

const AbiBinProvider = require('./../AbiBinProvider');
const Contracts = require('../Contracts');
const Utils = require('../../utils/Utils');

/**
 * Class is used to create a wallet of an user and configure it.
 */
class User {
  /**
   * @constructor
   *
   * @param {string} tokenHolderMasterCopy The address of a master copy of TokenHolder contract.
   * @param {string} gnosisSafeMasterCopy The address of a master copy of GnosisSafe contract.
   * @param {string} createAndAddModules The address of CreateAndAddModules contract.
   * @param {string} delayedRecoveryModuleMasterCopy The address of a master copy of
   *                                        DelayedRecoveryModule contract.
   * @param {string} eip20Token The address of EIP20Token contract of the economy.
   * @param {string} tokenRules The address of TokenRules contract.
   * @param {string} userWalletFactory The address of UserWalletFactory contract.
   * @param {string} proxyFactory The address of ProxyFactory contract.
   * @param {Web3} auxiliaryWeb3 Auxiliary chain's web3 object.
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
   * @param {string} recoveryOwnerAddress  An address that signs the "recovery
   *                              initiation/abortion" and "reset recovery owner"
   *                              requests.
   * @param {string} recoveryControllerAddress An address that relays signed requests of
   *                                  different types.
   * @param {string} recoveryBlockDelay A required number of blocks to pass to
   *                           be able to execute a recovery request.
   *
   * @returns {string} Executable data of the function.
   */
  getDelayedRecoveryModuleSetupData(recoveryOwnerAddress, recoveryControllerAddress, recoveryBlockDelay) {
    const delayedRecoveryModule = new this.auxiliaryWeb3.eth.Contract(
      this.abiBinProvider.getABI('DelayedRecoveryModule')
    );
    const abiEncoded = delayedRecoveryModule.methods
      .setup(recoveryOwnerAddress, recoveryControllerAddress, recoveryBlockDelay)
      .encodeABI();

    return abiEncoded;
  }

  /**
   * Generates ProxyFactory::createProxy() function's executable data to
   * create DelayedRecoveryModule proxy.
   *
   * @param {string} delayedRecoverySetupData Executable data of the DelayedRecoveryModule::setup()
   *                                  function.
   *
   * @returns {string} Executable data of the function.
   */
  getDelayedRecoveryModuleCreationData(delayedRecoverySetupData) {
    const proxyFactory = new this.auxiliaryWeb3.eth.Contract(this.abiBinProvider.getABI('ProxyFactory'));
    const abiEncoded = proxyFactory.methods
      .createProxy(this.delayedRecoveryModuleMasterCopy, delayedRecoverySetupData)
      .encodeABI();

    return abiEncoded;
  }

  /**
   * Generates CreateAndAddModules::createAndAddModules() function's executable
   * data to create and enable modules in GnosisSafe.
   *
   * @param {string} modulesCreationData An array of an executable data to create and enable
   *                                     modules within GnosisSafe during construction.
   *
   * @returns {string} Executable data of the function.
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

    const createAndAddModules = new this.auxiliaryWeb3.eth.Contract(this.abiBinProvider.getABI('CreateAndAddModules'));
    const abiEncoded = createAndAddModules.methods
      .createAndAddModules(this.proxyFactory, reducedModulesCreationData)
      .encodeABI();

    return abiEncoded;
  }

  /**
   * Generate the executable data for setup method of GnosisSafe contract.
   *
   * @param {Array} owners List of owners of the multisig contract for a user.
   * @param {string} threshold Number of required confirmations for a Safe transaction.
   * @param {string} ecoveryOwnerAddress  An address that signs the "recovery
   *                              initiation/abortion" and "reset recovery owner"
   *                              requests.
   * @param {string} recoveryControllerAddress An address that relays signed requests of
   *                                  different types.
   * @param {string} recoveryBlockDelay A required number of blocks to pass to
   *                           be able to execute a recovery request.
   *
   * @returns {string} GnosisSafe executable data.
   */
  getGnosisSafeData(owners, threshold, recoveryOwnerAddress, recoveryControllerAddress, recoveryBlockDelay) {
    const delayedRecoveryModuleSetupData = this.getDelayedRecoveryModuleSetupData(
      recoveryOwnerAddress,
      recoveryControllerAddress,
      recoveryBlockDelay
    );

    const delayedRecoveryModuleCreationData = this.getDelayedRecoveryModuleCreationData(delayedRecoveryModuleSetupData);

    const createAndAddModulesData = this.getCreateAndAddModulesData([delayedRecoveryModuleCreationData]);

    const safe = new this.auxiliaryWeb3.eth.Contract(this.abiBinProvider.getABI('GnosisSafe'));
    const abiEncoded = safe.methods
      .setup(owners, threshold, this.createAndAddModules, createAndAddModulesData)
      .encodeABI();

    return abiEncoded;
  }

  /**
   * Returns TokenHolder setup executable data.
   *
   * @param {string} owner Owner address. Owner could be hardware wallet.
   * @param {Array} sessionKeys Array of session keys.
   * @param {Array} sessionKeysSpendingLimits Array of spending limits.
   * @param {Array} sessionKeysExpirationHeights Array of expiration heights.
   *
   * @returns {string} TokenHolder setup executable data.
   */
  getTokenHolderSetupExecutableData(owner, sessionKeys, sessionKeysSpendingLimits, sessionKeysExpirationHeights) {
    const tokenHolder = Contracts.getTokenHolder(this.auxiliaryWeb3, this.tokenHolderMasterCopy);
    const abiEncoded = tokenHolder.methods
      .setup(
        this.eip20Token,
        this.tokenRules,
        owner,
        sessionKeys,
        sessionKeysSpendingLimits,
        sessionKeysExpirationHeights
      )
      .encodeABI();

    return abiEncoded;
  }

  /**
   * It is used for creation and configuration of gnosis safe and token holder
   * proxy contract for user.
   *
   * @param {Array} owners List of owners of the multisig.
   * @param {string} threshold Number of required confirmations for a Safe transaction.
   * @param {string} recoveryOwnerAddress  An address that signs the "recovery
   *                              initiation/abortion" and "reset recovery owner"
   *                              requests.
   * @param {string} recoveryControllerAddress An address that relays signed requests of
   *                                  different types.
   * @param {string} recoveryBlockDelay A required number of blocks to pass to
   *                           be able to execute a recovery request.
   * @param {Array} sessionKeys Session key addresses to authorize.
   * @param {Array} sessionKeysSpendingLimits Session key's spending limits.
   * @param {Array} sessionKeysExpirationHeights Session key's expiration heights.
   * @param {Object} txOptions Tx options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
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
    const txObject = await this._createUserWalletRawTx(
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
   * @param {string} owner TokenHolder proxy owner address. It could be hardware wallet address.
   * @param {Array} sessionKeys Session key addresses to authorize.
   * @param {Array} sessionKeysSpendingLimits Session key's spending limits.
   * @param {Array} sessionKeysExpirationHeights Session key's expiration heights.
   *
   * @returns {Promise<Object>} Promise that resolves to Transaction receipt.
   */
  async createCompanyWallet(owner, sessionKeys, sessionKeysSpendingLimits, sessionKeysExpirationHeights, txOptions) {
    const txObject = await this._createCompanyWalletRawTx(
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
   * @param {Array} owners List of owners of the multisig.
   * @param {string} threshold Number of required confirmations for a Safe transaction.
   * @param {string} recoveryOwnerAddress  An address that signs the "recovery
   *                              initiation/abortion" and "reset recovery owner"
   *                              requests.
   * @param {string} recoveryControllerAddress An address that relays signed requests of
   *                                  different types.
   * @param {string} recoveryBlockDelay A required number of blocks to pass to
   *                           be able to execute a recovery request.
   * @param {Array} sessionKeys Session key addresses to authorize.
   * @param {Array} sessionKeysSpendingLimits Session key's spending limits.
   * @param {Array} sessionKeysExpirationHeights Session key's expiration heights.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
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
    return Promise.resolve(
      contract.methods.createUserWallet(
        this.gnosisSafeMasterCopy,
        gnosisSafeData,
        this.tokenHolderMasterCopy,
        this.eip20Token,
        this.tokenRules,
        sessionKeys,
        sessionKeysSpendingLimits,
        sessionKeysExpirationHeights
      )
    );
  }

  /**
   * Private method used for creation and configuration of token holder proxy contract for company
   * with hardware wallet as it's owner.
   *
   * @param {string} owner TokenHolder proxy owner address. It could be hardware wallet address.
   * @param {Array} sessionKeys Session key addresses to authorize.
   * @param {Array} sessionKeysSpendingLimits Session key's spending limits.
   * @param {Array} sessionKeysExpirationHeights Session key's expiration heights.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  _createCompanyWalletRawTx(owner, sessionKeys, sessionKeysSpendingLimits, sessionKeysExpirationHeights) {
    const thSetupExecutableData = this.getTokenHolderSetupExecutableData(
      owner,
      sessionKeys,
      sessionKeysSpendingLimits,
      sessionKeysExpirationHeights
    );

    const contract = Contracts.getProxyFactory(this.auxiliaryWeb3, this.proxyFactory);
    return Promise.resolve(contract.methods.createProxy(this.tokenHolderMasterCopy, thSetupExecutableData));
  }
}

module.exports = User;
