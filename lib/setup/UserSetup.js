'use strict';

const AbiBinProvider = require('../../AbiBinProvider');

const MultiSigMasterCopyContractName = 'MultiSigWallet',
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
   */
  deployMultiSigMasterCopy(txOptions) {
    const oThis = this;

    const txObject = oThis._deployMultiSigMasterCopyRawTx(txOptions);

    // TODO Integrate deployer here.
  }

  /**
   * Deploys TokenHolder master copy contract.
   *
   * @param txOptions Tx options.
   */
  deployTokenHolderMasterCopy(txOptions) {
    const oThis = this;

    const txObject = oThis._deployTokenHolderMasterCopyRawTx(txOptions);

    // TODO Integrate deployer here.
  }

  /**
   * Deploys UserWalletFactory contract.
   *
   * @param txOptions Tx options.
   */
  deployUserWalletFactory(txOptions) {
    const oThis = this;

    const txObject = oThis._deployUserWalletFactoryRawTx(txOptions);

    // TODO Integrate deployer here.
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

    const args = [eip20Token, tokenRules, multisigMasterCopy];

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
