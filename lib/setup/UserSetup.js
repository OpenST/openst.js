'use strict';

const AbiBinProvider = require('./../AbiBinProvider'),
  Deployer = require('./../../utils/DeployContract');

const MultiSigMasterCopyContractName = 'GnosisSafe',
  THMasterCopyContractName = 'TokenHolder',
  UserWalletFactoryContractName = 'UserWalletFactory';

/**
 * Performs setup and deployment tasks for user.
 */
class UserSetup {
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

    let params = {};
    params.contractName = MultiSigMasterCopyContractName;
    params.txObject = txObject;
    params.txOptions = txOptions;
    params.web3 = oThis.auxiliaryWeb3;

    const txReceipt = await new Deployer(params).deploy();

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

    let params = {};
    params.contractName = THMasterCopyContractName;
    params.txObject = txObject;
    params.txOptions = txOptions;
    params.web3 = oThis.auxiliaryWeb3;

    const txReceipt = await new Deployer(params).deploy();

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

    let params = {};
    params.contractName = UserWalletFactoryContractName;
    params.txObject = txObject;
    params.txOptions = txOptions;
    params.web3 = oThis.auxiliaryWeb3;

    const txReceipt = await new Deployer(params).deploy();

    return txReceipt;
  }

  /**
   * Private method which Deploys gnosis MultiSig master copy contract.
   *
   * @param txOptions Tx options.
   * @returns {txObject} - Transaction object.
   * @private
   */
  _deployMultiSigMasterCopyRawTx(txOptions) {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const jsonInterface = abiBinProvider.getABI(MultiSigMasterCopyContractName);
    const bin = abiBinProvider.getBIN(MultiSigMasterCopyContractName);

    let defaultOptions = {
      gas: '2000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const args = [];

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );
  }

  /**
   * Private method which returns Tx object to deploy TokenHolder master copy contract.
   *
   * @param txOptions Tx options
   * @returns {txObject} - Transaction object.
   * @private
   */
  _deployTokenHolderMasterCopyRawTx(txOptions) {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const jsonInterface = abiBinProvider.getABI(THMasterCopyContractName);
    const bin = abiBinProvider.getBIN(THMasterCopyContractName);

    let defaultOptions = {
      gas: '2000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const args = [];

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );
  }

  /**
   * Private method which deploys UserWalletFactory contract.
   *
   * @param txOptions Tx options.
   * @returns {txObject} Transaction object.
   * @private
   */
  _deployUserWalletFactoryRawTx(txOptions) {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const jsonInterface = abiBinProvider.getABI(UserWalletFactoryContractName);
    const bin = abiBinProvider.getBIN(UserWalletFactoryContractName);

    let defaultOptions = {
      gas: '2000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const args = [];

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );
  }
}

module.exports = UserSetup;
