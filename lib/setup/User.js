// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

const AbiBinProvider = require('./../AbiBinProvider');

const Deployer = require('./../../utils/DeployContract');

const MultiSigMasterCopyContractName = 'GnosisSafe';

const THMasterCopyContractName = 'TokenHolder';

const UserWalletFactoryContractName = 'UserWalletFactory';

const ProxyFactoryContractName = 'ProxyFactory';

const CreateAndAddModulesContractName = 'CreateAndAddModules';

const DelayedRecoveryModuleMasterCopyContractName = 'DelayedRecoveryModule';

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

  /** Deploys DelayedRecoveryModule master copy. */
  async deployDelayedRecoveryModuleMasterCopy(txOptions) {
    const oThis = this;

    const txObject = oThis._deployDelayedRecoveryModuleMasterCopyRawTx();

    const txReceipt = await new Deployer(
      DelayedRecoveryModuleMasterCopyContractName,
      txObject,
      oThis.auxiliaryWeb3,
      txOptions
    ).deploy();

    return txReceipt;
  }

  /** Deploys Gnosis CreateAndAddModules contract. */
  async deployCreateAndAddModules(txOptions) {
    const oThis = this;

    const txObject = oThis._deployCreateAndAddModulesRawTx();

    const txReceipt = await new Deployer(
      CreateAndAddModulesContractName,
      txObject,
      oThis.auxiliaryWeb3,
      txOptions
    ).deploy();

    return txReceipt;
  }

  /**
   * Deploys gnosis MultiSig master copy contract.
   *
   * @param txOptions Tx options.
   *
   * @returns {Object} - Transaction receipt.
   */
  async deployMultiSigMasterCopy(txOptions) {
    const oThis = this;

    const txObject = oThis._deployMultiSigMasterCopyRawTx();

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
   *
   * @returns {Object} - Transaction receipt.
   */
  async deployTokenHolderMasterCopy(txOptions) {
    const oThis = this;

    const txObject = oThis._deployTokenHolderMasterCopyRawTx();

    const txReceipt = await new Deployer(THMasterCopyContractName, txObject, oThis.auxiliaryWeb3, txOptions).deploy();

    return txReceipt;
  }

  /**
   * Deploys UserWalletFactory contract.
   *
   * @param txOptions Tx options.
   *
   * @returns {Object} - Transaction receipt.
   */
  async deployUserWalletFactory(txOptions) {
    const oThis = this;

    const txObject = oThis._deployUserWalletFactoryRawTx();

    const txReceipt = await new Deployer(
      UserWalletFactoryContractName,
      txObject,
      oThis.auxiliaryWeb3,
      txOptions
    ).deploy();

    return txReceipt;
  }

  /**
   * Deploys ProxyFactory contract.
   *
   * @param txOptions Tx options.
   *
   * @returns {Object} - Transaction receipt.
   */
  async deployProxyFactory(txOptions) {
    const oThis = this;

    const txObject = oThis._deployProxyFactoryRawTx();

    const txReceipt = await new Deployer(ProxyFactoryContractName, txObject, oThis.auxiliaryWeb3, txOptions).deploy();

    return txReceipt;
  }

  /** Creates and returns transaction object for DelayedRecoveryModule master copy. */
  _deployDelayedRecoveryModuleMasterCopyRawTx() {
    const oThis = this;

    const { abiBinProvider } = oThis;
    const jsonInterface = abiBinProvider.getABI(DelayedRecoveryModuleMasterCopyContractName);
    const bin = abiBinProvider.getBIN(DelayedRecoveryModuleMasterCopyContractName);

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null);

    return contract.deploy({
      data: bin,
      arguments: []
    });
  }

  /** Creates and returns transaction object for CreateAndAddModules contract */
  _deployCreateAndAddModulesRawTx() {
    const oThis = this;

    const { abiBinProvider } = oThis;
    const jsonInterface = abiBinProvider.getABI(CreateAndAddModulesContractName);
    const bin = abiBinProvider.getBIN(CreateAndAddModulesContractName);

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null);

    return contract.deploy({
      data: bin,
      arguments: []
    });
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

  /**
   * Private method which deploys ProxyFactory contract.
   *
   * @returns {txObject} Transaction object.
   * @private
   */
  _deployProxyFactoryRawTx() {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const jsonInterface = abiBinProvider.getABI(ProxyFactoryContractName);
    const bin = abiBinProvider.getBIN(ProxyFactoryContractName);

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null);

    return contract.deploy({
      data: bin,
      arguments: []
    });
  }
}

module.exports = User;
