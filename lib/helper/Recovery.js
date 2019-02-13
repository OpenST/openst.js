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

const AbiBinProvider = require('../AbiBinProvider');

const DelayedRecoveryModuleContractName = 'DelayedRecoveryModule.sol';

const TxSender = require('../../utils/TxSender');

/**
 * This library is used to interact with Recovery contracts.
 */
class Recovery {
  /**
   * Recovery class constructor.
   *
   * @param delayedRecoveryProxy delayedRecovery proxy contract address.
   * @param auxiliaryWeb3 auxiliary web3 object.
   */
  constructor(delayedRecoveryProxy, auxiliaryWeb3) {
    const oThis = this;

    oThis.delayedRecoveryProxy = delayedRecoveryProxy;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;

    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Initiates a recovery procedure.
   *
   * @param prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param oldOwner Owner address to replace.
   * @param newOwner New owner address.
   * @param signature EIP712 signed signature object signed by recovery owner.
   *                  {
   *                    messageHash: signHash,
   *                    v: vrs[0],
   *                    r: vrs[1],
   *                    s: vrs[2],
   *                    signature: signature
   *                  }
   * @param txOptions Transaction options object.
   * @returns {Object} Transaction receipt.
   */
  async initiateRecovery(prevOwner, oldOwner, newOwner, signature, txOptions) {
    const oThis = this;
    const txObject = oThis._initiateRecoveryRawTx(prevOwner, oldOwner, newOwner, signature);

    const txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  /**
   * Executes the initiated recovery.
   *
   * @param prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param oldOwner Owner address to replace.
   * @param newOwner New owner address.
   * @param txOptions Transaction options object.
   * @returns {Object} Transaction receipt.
   */
  async executeRecovery(prevOwner, oldOwner, newOwner, txOptions) {
    const oThis = this;
    const txObject = oThis._executeRecoveryRawTx(prevOwner, oldOwner, newOwner);

    const txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  /**
   * Aborts the initiated recovery.
   *
   * @param prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param oldOwner Owner address to replace.
   * @param newOwner New owner address.
   * @param signature EIP712 signed signature object signed by recovery owner.
   *                  {
   *                    messageHash: signHash,
   *                    v: vrs[0],
   *                    r: vrs[1],
   *                    s: vrs[2],
   *                    signature: signature
   *                  }
   * @param txOptions Transaction options object.
   * @returns {Object} Transaction receipt.
   */
  async abortRecoveryByOwner(prevOwner, oldOwner, newOwner, signature, txOptions) {
    const oThis = this;
    const txObject = oThis._abortRecoveryByOwnerRawTx(prevOwner, oldOwner, newOwner, signature);

    const txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  /**
   * Aborts the initiated recovery by receovery controller.
   *
   * @param prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param oldOwner Owner address to replace.
   * @param newOwner New owner address.
   * @param txOptions Transaction options object.
   * @returns {Object} Transaction receipt.
   */
  async abortRecoveryByController(prevOwner, oldOwner, newOwner, txOptions) {
    const oThis = this;
    const txObject = oThis._abortRecoveryByControllerRawTx(prevOwner, oldOwner, newOwner);

    const txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  /**
   * Update the recovery owner.
   *
   * @param newRecoveryOwner New recovery owner.
   * @param signature EIP712 signed signature object signed by recovery owner.
   *                  {
   *                    messageHash: signHash,
   *                    v: vrs[0],
   *                    r: vrs[1],
   *                    s: vrs[2],
   *                    signature: signature
   *                  }
   * @param txOptions Transaction options object.
   * @returns {Object} Transaction receipt.
   */
  async resetRecoveryOwner(newRecoveryOwner, signature, txOptions) {
    const oThis = this;
    const txObject = oThis._resetRecoveryOwnerRawTx(newRecoveryOwner, signature);

    const txReceipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return txReceipt;
  }

  /**
   * Initiates a recovery procedure.
   *
   * @param prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param oldOwner Owner address to replace.
   * @param newOwner New owner address.
   * @param signature EIP712 signed signature object signed by recovery owner.
   *                  {
   *                    messageHash: signHash,
   *                    v: vrs[0],
   *                    r: vrs[1],
   *                    s: vrs[2],
   *                    signature: signature
   *                  }
   * @private
   */
  _initiateRecoveryRawTx(prevOwner, oldOwner, newOwner, signature) {
    const oThis = this;

    return oThis
      ._delayedRecoveryInstance()
      .methods.initiateRecovery(prevOwner, oldOwner, newOwner, signature.r, signature.s, signature.v);
  }

  /**
   * Executes the initiated recovery.
   *
   * @param prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param oldOwner Owner address to replace.
   * @param newOwner New owner address.
   * @private
   */
  _executeRecoveryRawTx(prevOwner, oldOwner, newOwner) {
    const oThis = this;

    return oThis._delayedRecoveryInstance().methods.executeRecovery(prevOwner, oldOwner, newOwner);
  }

  /**
   * Aborts the initiated recovery.
   *
   * @param prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param oldOwner Owner address to replace.
   * @param newOwner New owner address.
   * @param signature EIP712 signed signature object signed by recovery owner.
   *                  {
   *                    messageHash: signHash,
   *                    v: vrs[0],
   *                    r: vrs[1],
   *                    s: vrs[2],
   *                    signature: signature
   *                  }
   * @private
   */
  _abortRecoveryByOwnerRawTx(prevOwner, oldOwner, newOwner, signature) {
    const oThis = this;

    return oThis
      ._delayedRecoveryInstance()
      .methods.abortRecoveryByOwner(prevOwner, oldOwner, newOwner, signature.r, signature.s, signature.v);
  }

  /**
   * Aborts the initiated recovery by recovery controller.
   *
   * @param prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param oldOwner Owner address to replace.
   * @param newOwner New owner address.
   * @private
   */
  _abortRecoveryByControllerRawTx(prevOwner, oldOwner, newOwner) {
    const oThis = this;

    return oThis._delayedRecoveryInstance().methods.abortRecoveryByController(prevOwner, oldOwner, newOwner);
  }

  /**
   * Update the recovery owner.
   *
   * @param newRecoveryOwner New recovery owner.
   * @param signature EIP712 signed signature object signed by recovery owner.
   *                  {
   *                    messageHash: signHash,
   *                    v: vrs[0],
   *                    r: vrs[1],
   *                    s: vrs[2],
   *                    signature: signature
   *                  }
   * @private
   */
  _resetRecoveryOwnerRawTx(newRecoveryOwner, signature) {
    const oThis = this;
    return oThis
      ._delayedRecoveryInstance()
      .methods.resetRecoveryOwner(newRecoveryOwner, signature.r, signature.s, signature.v);
  }

  /**
   * Constructs delayed recovery instance.
   * @returns Contract instance.
   * @private
   */
  _delayedRecoveryInstance() {
    const jsonInterface = oThis.abiBinProvider.getABI(DelayedRecoveryModuleContractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.delayedRecoveryProxy);

    return contract;
  }
}

module.exports = Recovery;
