'use strict';

const Web3 = require('web3');
const Mosaic = require('@openst/mosaic.js');
const AbiBinProvider = require('./../AbiBinProvider');
const Contracts = require('../Contracts');

const Utils = require('../../utils/Utils');
const { EIP712TypedData } = Mosaic.Utils;
const ContractName = 'DelayedRecoveryModule';

/**
 * This Class is used to interact with Recovery contracts.
 */
class Recovery {
  /**
   * Recovery class constructor.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary web3 object.
   * @param {string} address delayedRecovery proxy contract address.
   */
  constructor(auxiliaryWeb3, address) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      const err = new TypeError("Mandatory Parameter 'auxiliaryWeb3' is missing or invalid.");
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(address)) {
      const err = new TypeError(`Mandatory Parameter 'address' is missing or invalid: ${address}.`);
      return Promise.reject(err);
    }

    this.auxiliaryWeb3 = auxiliaryWeb3;
    this.address = address;

    this.contract = Contracts.getDelayedRecovery(this.auxiliaryWeb3, this.address);

    if (!this.contract) {
      const err = new TypeError(`Could not load recovery contract for: ${this.address}`);
      return Promise.reject(err);
    }
  }

  /**
   * Deploys Recovery master copy contract.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {Object} txOptions Tx options.
   *
   * @returns {Promise<Recovery>} Promise containing the Recovery
   *                              instance that has been deployed.
   */
  static async deploy(auxiliaryWeb3, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    const tx = Recovery.deployRawTx(auxiliaryWeb3);

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new Recovery(auxiliaryWeb3, address);
    });
  }

  /**
   * Method which returns Tx object to deploy Recovery master copy contract.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   *
   * @returns {Object} Raw transaction object.
   */
  static deployRawTx(auxiliaryWeb3) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      throw new TypeError(`Mandatory Parameter 'auxiliaryWeb3' is missing or invalid: ${auxiliaryWeb3}`);
    }
    const abiBinProvider = new AbiBinProvider();
    const bin = abiBinProvider.getBIN(ContractName);

    const args = [];
    const contract = Contracts.getDelayedRecovery(auxiliaryWeb3);

    return contract.deploy({
      data: bin,
      arguments: args
    });
  }

  /**
   * Initiates a recovery procedure.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} oldOwner Owner address to replace.
   * @param {string} newOwner New owner address.
   * @param {string} r `r` part of the signature signed by recoveryOwner.
   * @param {string} s `s` part of the signature signed by recoveryOwner.
   * @param {string} v `v` part of the signature signed by recoveryOwner.
   * @param {Object} txOptions Transaction options object.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async initiateRecovery(prevOwner, oldOwner, newOwner, r, s, v, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address ${txOptions.from} in transaction options.`);
      return Promise.reject(err);
    }

    const txObject = await this.initiateRecoveryRawTx(prevOwner, oldOwner, newOwner, r, s, v);

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Executes the initiated recovery.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} oldOwner Owner address to replace.
   * @param {string } newOwner New owner address.
   * @param {Object} txOptions Transaction options object.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async executeRecovery(prevOwner, oldOwner, newOwner, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address ${txOptions.from} in transaction options.`);
      return Promise.reject(err);
    }

    const txObject = await this.executeRecoveryRawTx(prevOwner, oldOwner, newOwner);

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Aborts the initiated recovery.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} oldOwner Owner address to replace.
   * @param {string} newOwner New owner address.
   * @param {string} r `r` part of the signature signed by recoveryOwner.
   * @param {string} s `s` part of the signature signed by recoveryOwner.
   * @param {string} v `v` part of the signature signed by recoveryOwner.
   * @param {Object} txOptions Transaction options object.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async abortRecoveryByOwner(prevOwner, oldOwner, newOwner, r, s, v, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address ${txOptions.from} in transaction options.`);
      return Promise.reject(err);
    }

    const txObject = await this.abortRecoveryByOwnerRawTx(prevOwner, oldOwner, newOwner, r, s, v);
    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Aborts the initiated recovery by receovery controller.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} oldOwner Owner address to replace.
   * @param {string} newOwner New owner address.
   * @param {Object} txOptions Transaction options object.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async abortRecoveryByController(prevOwner, oldOwner, newOwner, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address ${txOptions.from} in transaction options.`);
      return Promise.reject(err);
    }
    const txObject = await this.abortRecoveryByControllerRawTx(prevOwner, oldOwner, newOwner);

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Update the recovery owner.
   *
   * @param {string} newRecoveryOwner New recovery owner.
   * @param {string} r `r` part of the signature signed by current recoveryOwner.
   * @param {string} s `s` part of the signature signed by current recoveryOwner.
   * @param {string} v `v` part of the signature signed by current recoveryOwner.
   * @param {Object} txOptions Transaction options object.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async resetRecoveryOwner(newRecoveryOwner, r, s, v, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address ${txOptions.from} in transaction options.`);
      return Promise.reject(err);
    }

    const txObject = await this.resetRecoveryOwnerRawTx(newRecoveryOwner, r, s, v);

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Initiates a recovery procedure.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} oldOwner Owner address to replace.
   * @param {string} newOwner New owner address.
   * @param {string} r `r` part of the signature signed by recoveryOwner.
   * @param {string} s `s` part of the signature signed by recoveryOwner.
   * @param {string} v `v` part of the signature signed by recoveryOwner.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  initiateRecoveryRawTx(prevOwner, oldOwner, newOwner, r, s, v) {
    if (!Web3.utils.isAddress(prevOwner)) {
      const err = new TypeError(`Mandatory Parameter 'prevOwner' is missing or invalid: ${prevOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(oldOwner)) {
      const err = new TypeError(`Mandatory Parameter 'oldOwner' is missing or invalid: ${oldOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(newOwner)) {
      const err = new TypeError(`Mandatory Parameter 'newOwner' is missing or invalid: ${newOwner}.`);
      return Promise.reject(err);
    }
    if (!r) {
      const err = new TypeError(`Invalid r of signature: ${r}.`);
      return Promise.reject(err);
    }
    if (!s) {
      const err = new TypeError(`Invalid s of signature: ${s}.`);
      return Promise.reject(err);
    }
    if (!v) {
      const err = new TypeError(`Invalid v of signature: ${v}.`);
      return Promise.reject(err);
    }

    return Promise.resolve(this.contract.methods.initiateRecovery(prevOwner, oldOwner, newOwner, r, s, v));
  }

  /**
   * Executes the initiated recovery.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} oldOwner Owner address to replace.
   * @param {string} newOwner New owner address.
   *
   * @returns {Object} Promise that resolves to raw transaction object.
   */
  executeRecoveryRawTx(prevOwner, oldOwner, newOwner) {
    if (!Web3.utils.isAddress(prevOwner)) {
      const err = new TypeError(`Mandatory Parameter 'prevOwner' is missing or invalid: ${prevOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(oldOwner)) {
      const err = new TypeError(`Mandatory Parameter 'oldOwner' is missing or invalid: ${oldOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(newOwner)) {
      const err = new TypeError(`Mandatory Parameter 'newOwner' is missing or invalid: ${newOwner}.`);
      return Promise.reject(err);
    }
    return Promise.resolve(this.contract.methods.executeRecovery(prevOwner, oldOwner, newOwner));
  }

  /**
   * Aborts the initiated recovery.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} oldOwner Owner address to replace.
   * @param {string} newOwner New owner address.
   * @param {string} r `r` part of the signature signed by recoveryOwner.
   * @param {string} s `s` part of the signature signed by recoveryOwner.
   * @param {string} v `v` part of the signature signed by recoveryOwner.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  abortRecoveryByOwnerRawTx(prevOwner, oldOwner, newOwner, r, s, v) {
    if (!Web3.utils.isAddress(prevOwner)) {
      const err = new TypeError(`Mandatory Parameter 'prevOwner' is missing or invalid: ${prevOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(oldOwner)) {
      const err = new TypeError(`Mandatory Parameter 'oldOwner' is missing or invalid: ${oldOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(newOwner)) {
      const err = new TypeError(`Mandatory Parameter 'newOwner' is missing or invalid: ${newOwner}.`);
      return Promise.reject(err);
    }
    if (!r) {
      const err = new TypeError(`Invalid r of signature: ${r}.`);
      return Promise.reject(err);
    }
    if (!s) {
      const err = new TypeError(`Invalid s of signature: ${s}.`);
      return Promise.reject(err);
    }
    if (!v) {
      const err = new TypeError(`Invalid v of signature: ${v}.`);
      return Promise.reject(err);
    }
    return Promise.resolve(this.contract.methods.abortRecoveryByOwner(prevOwner, oldOwner, newOwner, r, s, v));
  }

  /**
   * Aborts the initiated recovery by recovery controller.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} oldOwner Owner address to replace.
   * @param {string} newOwner New owner address.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  abortRecoveryByControllerRawTx(prevOwner, oldOwner, newOwner) {
    if (!Web3.utils.isAddress(prevOwner)) {
      const err = new TypeError(`Mandatory Parameter 'prevOwner' is missing or invalid: ${prevOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(oldOwner)) {
      const err = new TypeError(`Mandatory Parameter 'oldOwner' is missing or invalid: ${oldOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(newOwner)) {
      const err = new TypeError(`Mandatory Parameter 'newOwner' is missing or invalid: ${newOwner}.`);
      return Promise.reject(err);
    }
    return Promise.resolve(this.contract.methods.abortRecoveryByController(prevOwner, oldOwner, newOwner));
  }

  /**
   * Updates recovery owner.
   *
   * @param {string} newRecoveryOwner New recovery owner.
   * @param {string} r `r` part of the signature signed by current recoveryOwner.
   * @param {string} s `s` part of the signature signed by current recoveryOwner.
   * @param {string} v `v` part of the signature signed by current recoveryOwner.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  resetRecoveryOwnerRawTx(newRecoveryOwner, r, s, v) {
    if (!Web3.utils.isAddress(newRecoveryOwner)) {
      const err = new TypeError(`Mandatory Parameter 'newRecoveryOwner' is missing or invalid: ${newRecoveryOwner}.`);
      return Promise.reject(err);
    }
    if (!r) {
      const err = new TypeError(`Invalid r of signature: ${r}.`);
      return Promise.reject(err);
    }
    if (!s) {
      const err = new TypeError(`Invalid s of signature: ${s}.`);
      return Promise.reject(err);
    }
    if (!v) {
      const err = new TypeError(`Invalid v of signature: ${v}.`);
      return Promise.reject(err);
    }

    return Promise.resolve(this.contract.methods.resetRecoveryOwner(newRecoveryOwner, r, s, v));
  }

  /**
   * Returns domain separator.
   *
   * @return {Promise<string>} Promise that resolves to domain separator.
   */
  domainSeparator() {
    return this.contract.methods.domainSeparator().call();
  }

  /**
   * Returns recovery controller address.
   *
   * @return {Promise<string>} Promise that resolves to recovery controller address.
   */
  recoveryController() {
    return this.contract.methods.recoveryController().call();
  }

  /**
   * Returns recovery owner address.
   *
   * @return {Promise<string>} Promise that resolves to recovery owner address.
   */
  recoveryOwner() {
    return this.contract.methods.recoveryOwner().call();
  }

  /**
   * Returns recovery block delay.
   *
   * @return {Promise<string>} Promise that resolves to recovery block delay
   */
  recoveryBlockDelay() {
    return this.contract.methods.recoveryBlockDelay().call();
  }

  /**
   * Returns active recovery information.
   *
   * @return {Promise<string>} Promise that resolves to active recovery info.
   */
  activeRecoveryInfo() {
    return this.contract.methods.activeRecoveryInfo().call();
  }

  /**
   * Returns TypedData of initiate recovery in EIP-712 format which can be signed by owners.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} oldOwner Owner address to replace.
   * @param {string} newOwner New owner address.
   *
   * @returns {TypedData} TypeData object for signing.
   */
  getInitiateRecoveryData(prevOwner, oldOwner, newOwner) {
    if (!Web3.utils.isAddress(prevOwner)) {
      const err = new TypeError(`Mandatory Parameter 'prevOwner' is missing or invalid: ${prevOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(oldOwner)) {
      const err = new TypeError(`Mandatory Parameter 'oldOwner' is missing or invalid: ${oldOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(newOwner)) {
      const err = new TypeError(`Mandatory Parameter 'newOwner' is missing or invalid: ${newOwner}.`);
      return Promise.reject(err);
    }

    const typedDataInput = {
      types: {
        EIP712Domain: [{ name: 'verifyingContract', type: 'address' }],
        InitiateRecoveryStruct: [
          { name: 'prevOwner', type: 'address' },
          { name: 'oldOwner', type: 'address' },
          { name: 'newOwner', type: 'address' }
        ]
      },
      primaryType: 'InitiateRecoveryStruct',
      domain: {
        verifyingContract: this.address
      },
      message: {
        prevOwner: prevOwner,
        oldOwner: oldOwner,
        newOwner: newOwner
      }
    };

    let typedDataInstance = EIP712TypedData.fromObject(typedDataInput);

    if (typedDataInstance.validate() === true) {
      return typedDataInstance;
    } else {
      const err = new Error('InitiateRecovery TypeData is invalid');
      return Promise.reject(err);
    }
  }

  /**
   * Returns TypedData of abort recovery in EIP-712 format which can be signed by owners.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} oldOwner Owner address to replace.
   * @param {string} newOwner New owner address.
   *
   * @returns {TypedData} TypedData object for signing.
   */
  abortRecoveryData(prevOwner, oldOwner, newOwner) {
    if (!Web3.utils.isAddress(prevOwner)) {
      const err = new TypeError(`Mandatory Parameter 'prevOwner' is missing or invalid: ${prevOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(oldOwner)) {
      const err = new TypeError(`Mandatory Parameter 'oldOwner' is missing or invalid: ${oldOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(newOwner)) {
      const err = new TypeError(`Mandatory Parameter 'newOwner' is missing or invalid: ${newOwner}.`);
      return Promise.reject(err);
    }

    const typedDataInput = {
      types: {
        EIP712Domain: [{ name: 'verifyingContract', type: 'address' }],
        AbortRecoveryStruct: [
          { name: 'prevOwner', type: 'address' },
          { name: 'oldOwner', type: 'address' },
          { name: 'newOwner', type: 'address' }
        ]
      },
      primaryType: 'AbortRecoveryStruct',
      domain: {
        verifyingContract: this.address
      },
      message: {
        prevOwner: prevOwner,
        oldOwner: oldOwner,
        newOwner: newOwner
      }
    };

    let typedDataInstance = EIP712TypedData.fromObject(typedDataInput);

    if (typedDataInstance.validate() === true) {
      return typedDataInstance;
    } else {
      const err = new Error('AbortRecovery TypeData is invalid');
      return Promise.reject(err);
    }
  }

  /**
   * Returns TypedData of reset recovery owner in EIP-712 format which can be signed by owners.
   *
   * @param {string} oldRecoveryOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} newRecoveryOwner Owner address to replace.
   *
   * @returns {TypedData} TypedData object for signing.
   */
  resetRecoveryOwnerData(oldRecoveryOwner, newRecoveryOwner) {
    if (!Web3.utils.isAddress(oldRecoveryOwner)) {
      const err = new TypeError(`Mandatory Parameter 'oldRecoveryOwner' is missing or invalid: ${oldRecoveryOwner}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(newRecoveryOwner)) {
      const err = new TypeError(`Mandatory Parameter 'newRecoveryOwner' is missing or invalid: ${newRecoveryOwner}.`);
      return Promise.reject(err);
    }

    const typedDataInput = {
      types: {
        EIP712Domain: [{ name: 'verifyingContract', type: 'address' }],
        ResetRecoveryOwnerStruct: [
          { name: 'oldRecoveryOwner', type: 'address' },
          { name: 'newRecoveryOwner', type: 'address' }
        ]
      },
      primaryType: 'ResetRecoveryOwnerStruct',
      domain: {
        verifyingContract: this.address
      },
      message: {
        oldRecoveryOwner: oldRecoveryOwner,
        newRecoveryOwner: newRecoveryOwner
      }
    };

    let typedDataInstance = EIP712TypedData.fromObject(typedDataInput);

    if (typedDataInstance.validate() === true) {
      return typedDataInstance;
    } else {
      const err = new Error('ResetRecoveryOwner TypeData is invalid');
      return Promise.reject(err);
    }
  }
}

module.exports = Recovery;
