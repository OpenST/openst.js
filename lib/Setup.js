'use strict';

const Web3 = require('web3');

const TokenHolder = require('./ContractInteract/TokenHolder');
const GnosisSafe = require('./ContractInteract/GnosisSafe');
const Recovery = require('./ContractInteract/Recovery');
const UserWalletFactory = require('./ContractInteract/UserWalletFactory');
const ProxyFactory = require('./ContractInteract/ProxyFactory');
const CreateAndAddModules = require('./ContractInteract/CreateAndAddModules');

/**
 * A single function to setup a openst contract.
 *
 * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
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
const setup = async (
  auxiliaryWeb3,
  tokenHolderTxOptions,
  gnosisSafeTxOptions,
  recoveryTxOptions,
  userWalletFactoryTxOptions,
  proxyFactoryTxOptions,
  createAndAddModulesTxOptions
) => {
  const tokenHolder = await TokenHolder.deploy(auxiliaryWeb3, tokenHolderTxOptions);
  const gnosisSafe = await GnosisSafe.deploy(auxiliaryWeb3, gnosisSafeTxOptions);
  const recovery = await Recovery.deploy(auxiliaryWeb3, recoveryTxOptions);
  const userWalletFactory = await UserWalletFactory.deploy(auxiliaryWeb3, userWalletFactoryTxOptions);
  const proxyFactory = await ProxyFactory.deploy(auxiliaryWeb3, proxyFactoryTxOptions);
  const createAndAddModules = await CreateAndAddModules.deploy(auxiliaryWeb3, createAndAddModulesTxOptions);

  return {
    tokenHolder,
    gnosisSafe,
    recovery,
    userWalletFactory,
    proxyFactory,
    createAndAddModules
  };
};

module.exports = setup;
