'use strict';

const Web3 = require('web3');

const TokenHolder = require('./../ContractInteract/TokenHolder');
const GnosisSafe = require('./../ContractInteract/GnosisSafe');
const Recovery = require('./../ContractInteract/Recovery');
const UserWalletFactory = require('./../ContractInteract/UserWalletFactory');
const ProxyFactory = require('./../ContractInteract/ProxyFactory');
const CreateAndAddModules = require('./../ContractInteract/CreateAndAddModules');

/**
 * Performs deployment of openst contracts.
 */
class OpenST {
  /**
   * Constructor of OpenST.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   */
  constructor(auxiliaryWeb3) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      const err = new TypeError("Mandatory Parameter 'auxiliaryWeb3' is missing or invalid.");
      return Promise.reject(err);
    }

    this.auxiliaryWeb3 = auxiliaryWeb3;
  }

  /**
   * A single function to setup a openst contract.
   *
   * @param {Object} tokenHolderTxOptions Transaction options to deploy
   *                                      tokenHolder master copy.
   * @param {Object} gnosisSafeTxOptions Transaction options to deploy
   *                                     gnosisSafe master copy.
   * @param {Object} recoveryTxOptions Transaction options to deploy
   *                                   recovery master copy.
   * @param {Object} userWalletFactoryTxOptions Transaction options to deploy
   *                                            userWalletFactory contract.
   * @param {Object} proxyFactoryTxOptions Transaction options to deploy
   *                                       proxyFactory contract.
   * @param {Object} createAndAddModulesTxOptions Transaction options to
   *                                       deploy createAndAddModules contract.
   *
   * @return {Promise<Object>} Deployed contract instances.
   *
   */
  async setup(
    tokenHolderTxOptions,
    gnosisSafeTxOptions,
    recoveryTxOptions,
    userWalletFactoryTxOptions,
    proxyFactoryTxOptions,
    createAndAddModulesTxOptions
  ) {
    const tokenHolder = await TokenHolder.deploy(this.auxiliaryWeb3, tokenHolderTxOptions);
    const gnosisSafe = await GnosisSafe.deploy(this.auxiliaryWeb3, gnosisSafeTxOptions);
    const recovery = await Recovery.deploy(this.auxiliaryWeb3, recoveryTxOptions);
    const userWalletFactory = await UserWalletFactory.deploy(this.auxiliaryWeb3, userWalletFactoryTxOptions);
    const proxyFactory = await ProxyFactory.deploy(this.auxiliaryWeb3, proxyFactoryTxOptions);
    const createAndAddModules = await CreateAndAddModules.deploy(this.auxiliaryWeb3, createAndAddModulesTxOptions);

    return {
      tokenHolder,
      gnosisSafe,
      recovery,
      userWalletFactory,
      proxyFactory,
      createAndAddModules
    };
  }
}

module.exports = OpenST;
