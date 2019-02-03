'use strict';

const AbiBinProvider = require('./../AbiBinProvider'),
  Deployer = require('./../../utils/DeployContract');

const MultiSigMasterCopyContractName = 'GnosisSafe',
  THMasterCopyContractName = 'TokenHolder',
  UserWalletFactoryContractName = 'UserWalletFactory';

/**
 * Performs setup and deployment tasks for user.
 */
class User {
  /**
   * @param auxiliaryWeb3 - Auxiliary chain Web3 object.
   */
  constructor(auxiliaryWeb3) {
    const oThis = this;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Deploys gnosis MultiSig master copy contract.
   *
   * @param txOptions Tx options.
   * @returns {Object} - Transaction receipt.
   */
  async deployMultiSigMasterCopy(txOptions) {
    const oThis = this;

    const txObject = oThis._deployMultiSigMasterCopyRawTx(txOptions);

    const txReceipt = await new Deployer(
      MultiSigMasterCopyContractName,
      txObject,
      oThis.auxiliaryWeb3,
      txOptions
    ).deploy();

    return txReceipt;
  }

  /**
   * Deploys TokenHolder master copy contract.
   *
   * @param txOptions Tx options.
   * @returns {Object} - Transaction receipt.
   */
  async deployTokenHolderMasterCopy(txOptions) {
    const oThis = this;

    const txObject = oThis._deployTokenHolderMasterCopyRawTx(txOptions);

    const txReceipt = await new Deployer(THMasterCopyContractName, txObject, oThis.auxiliaryWeb3, txOptions).deploy();

    return txReceipt;
  }

  /**
   * Deploys UserWalletFactory contract.
   *
   * @param txOptions Tx options.
   * @returns {Object} - Transaction receipt.
   */
  async deployUserWalletFactory(txOptions) {
    const oThis = this;

    const txObject = oThis._deployUserWalletFactoryRawTx(txOptions);

    const txReceipt = await new Deployer(
      UserWalletFactoryContractName,
      txObject,
      oThis.auxiliaryWeb3,
      txOptions
    ).deploy();

    return txReceipt;
  }

  /**
   * Private method which Deploys gnosis MultiSig master copy contract.
   *
   * @returns {txObject} - Transaction object.
   * @private
   */
  _deployMultiSigMasterCopyRawTx() {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const jsonInterface = abiBinProvider.getABI(MultiSigMasterCopyContractName);
    const bin = abiBinProvider.getBIN(MultiSigMasterCopyContractName);

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null);

    return contract.deploy({
      data: bin,
      arguments: []
    });
  }

  /**
   * Private method which returns Tx object to deploy TokenHolder master copy contract.
   *
   * @returns {txObject} - Transaction object.
   * @private
   */
  _deployTokenHolderMasterCopyRawTx() {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const jsonInterface = abiBinProvider.getABI(THMasterCopyContractName);
    const bin = abiBinProvider.getBIN(THMasterCopyContractName);

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null);

    return contract.deploy({
      data: bin,
      arguments: []
    });
  }

  /**
   * Private method which deploys UserWalletFactory contract.
   *
   * @returns {txObject} Transaction object.
   * @private
   */
  _deployUserWalletFactoryRawTx() {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const jsonInterface = abiBinProvider.getABI(UserWalletFactoryContractName);
    const bin = abiBinProvider.getBIN(UserWalletFactoryContractName);

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null);

    return contract.deploy({
      data: bin,
      arguments: []
    });
  }
}

module.exports = User;
