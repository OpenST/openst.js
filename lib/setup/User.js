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
   * @param txOptions Tx options.
   * @returns {txObject} - Transaction object.
   * @private
   */
  _deployMultiSigMasterCopyRawTx(txOptions) {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const jsonInterface = abiBinProvider.getABI(MultiSigMasterCopyContractName);
    const bin = abiBinProvider.getBIN(MultiSigMasterCopyContractName);

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: []
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

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: []
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

    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: []
      },
      txOptions
    );
  }
}

module.exports = User;
