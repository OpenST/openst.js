'use strict';

const Web3 = require('web3');
const Mosaic = require('@openstfoundation/mosaic.js');
const AbiBinProvider = require('./../AbiBinProvider');
const Contracts = require('../Contracts');

const { EIP712TypedData } = Mosaic.Utils;
const Utils = require('../../utils/Utils');
const ContractName = 'GnosisSafe';

/**
 * The Class is used to interact with GnosisSafe contract.
 */
class GnosisSafe {
  /**
   * Constructor of GnosisSafe.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {string} address Gnosis safe proxy address of a user.
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

    this.contract = Contracts.getGnosisSafe(this.auxiliaryWeb3, this.address);

    if (!this.contract) {
      const err = new TypeError(`Could not load GnosisSafe contract for: ${this.address}`);
      return Promise.reject(err);
    }
  }

  /**
   * Deploys GnosisSafe master copy contract.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {Object} txOptions Tx options.
   *
   * @returns {Promise<GnosisSafe>} Promise containing the GnosisSafe
   *                                instance that has been deployed.
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

    const tx = GnosisSafe.deployRawTx(auxiliaryWeb3);

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new GnosisSafe(auxiliaryWeb3, address);
    });
  }

  /**
   * Method which returns Tx object to deploy GnosisSafe master copy contract.
   *
   * @param {auxiliaryWeb3} auxiliaryWeb3 Auxiliary chain web3 object.
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
    const contract = Contracts.getGnosisSafe(auxiliaryWeb3);

    return contract.deploy({
      data: bin,
      arguments: args
    });
  }

  /**
   * Allows to add a new owner and update the threshold at the same time.
   *
   * @param {string} owner New owner address.
   * @param {string} threshold New threshold.
   *
   * @returns {string} Executable data for adding owner with threshold.
   */
  getAddOwnerWithThresholdExecutableData(owner, threshold) {
    return this.contract.methods.addOwnerWithThreshold(owner, threshold).encodeABI();
  }

  /**
   * Allows to remove an owner and update the threshold at the same time.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be removed in the linked list.
   * @param {string} owner Owner address to be removed.
   * @param {string} threshold New threshold.
   *
   * @returns {string} Executable data for removing an owner with threshold.
   */
  getRemoveOwnerWithThresholdExecutableData(prevOwner, owner, threshold) {
    return this.contract.methods.removeOwner(prevOwner, owner, threshold).encodeABI();
  }

  /**
   * Allows to swap/replace an owner with another address.
   *
   * @param {string} prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param {string} oldOwner Owner address to be replaced.
   * @param {string} newOwner New owner address.
   *
   * @returns {string} Executable data for swapping an owner.
   */
  getSwapOwnerExecutableData(prevOwner, oldOwner, newOwner) {
    return this.contract.methods.swapOwner(prevOwner, oldOwner, newOwner).encodeABI();
  }

  /**
   * Allows to update the number of required confirmations by Safe owners.
   * This can only be done via a Safe transaction.
   *
   * @param {string} threshold New threshold.
   *
   * @returns {string} Executable data to change threshold.
   */
  getChangeThresholdExecutableData(threshold) {
    return this.contract.methods.changeThreshold(threshold).encodeABI();
  }

  /**
   * Allows to execute a Safe transaction confirmed by required number of owners and then pays the account that
   * submitted the transaction.
   *
   * @param {string} to Destination address of Safe transaction.
   * @param {string} value Ether value of Safe transaction.
   * @param {string} data Data payload of Safe transaction.
   * @param {string} operation Operation type of Safe transaction.
   * @param {string} safeTxGas Gas that should be used for the Safe transaction.
   * @param {string} dataGas Gas costs for data used to trigger the safe transaction and to pay the payment transfer
   * @param {string} gasPrice Gas price that should be used for the payment calculation.
   * @param {string} gasToken Token address (or 0 if ETH) that is used for the payment.
   * @param {string} refundReceiver Address of receiver of gas payment (or 0 if tx.origin).
   * @param {string} signatures Packed signature data ({bytes32 r}{bytes32 s}{uint8 v}).
   * @param {Object} txOptions Tx options.
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async execTransaction(
    to,
    value,
    data,
    operation,
    safeTxGas,
    dataGas,
    gasPrice,
    gasToken,
    refundReceiver,
    signatures,
    txOptions
  ) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    const txObject = await this.execTransactionRawTx(
      to,
      value,
      data,
      operation,
      safeTxGas,
      dataGas,
      gasPrice,
      gasToken,
      refundReceiver,
      signatures
    );

    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Allows to execute a Safe transaction confirmed by required number of owners and then pays the account that
   * submitted the transaction.
   *
   * @param {string} to Destination address of Safe transaction.
   * @param {string} value Ether value of Safe transaction.
   * @param {string} data Data payload of Safe transaction.
   * @param {number} operation Operation type of Safe transaction.
   * @param {string} safeTxGas Gas that should be used for the Safe transaction.
   * @param {string} dataGas Gas costs for data used to trigger the safe transaction and to pay the payment transfer
   * @param {string} gasPrice Gas price that should be used for the payment calculation.
   * @param {string} gasToken Token address (or 0 if ETH) that is used for the payment.
   * @param {string} refundReceiver Address of receiver of gas payment (or 0 if tx.origin).
   * @param {string} signatures Packed signature data ({bytes32 r}{bytes32 s}{uint8 v}).
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  execTransactionRawTx(to, value, data, operation, safeTxGas, dataGas, gasPrice, gasToken, refundReceiver, signatures) {
    if (!Web3.utils.isAddress(to)) {
      const err = new TypeError(`Mandatory Parameter 'to' is missing or invalid: ${to}.`);
      return Promise.reject(err);
    }
    if (!data) {
      const err = new TypeError(`Mandatory Parameter 'data' is missing or invalid: ${data}.`);
      return Promise.reject(err);
    }
    return Promise.resolve(
      this.contract.methods.execTransaction(
        to,
        value,
        data,
        operation,
        safeTxGas,
        dataGas,
        gasPrice,
        gasToken,
        refundReceiver,
        signatures
      )
    );
  }

  /**
   * It returns hash to be signed by owners.
   *
   * @param {string} to Destination address of Safe transaction.
   * @param {string} value Ether value of Safe transaction.
   * @param {string} data Data payload of Safe transaction.
   * @param {number} operation Operation type of Safe transaction.
   * @param {string} safeTxGas Gas that should be used for the Safe transaction.
   * @param {string} dataGas Gas costs for data used to trigger the safe transaction and to pay the payment transfer
   * @param {string} gasPrice Gas price that should be used for the payment calculation.
   * @param {string} gasToken Token address (or 0 if ETH) that is used for the payment.
   * @param {string} refundReceiver Address of receiver of gas payment (or 0 if tx.origin).
   * @param {string} nonce Transaction nonce.
   *
   * @returns {string} Transaction hash.
   */
  async getTransactionHash(to, value, data, operation, safeTxGas, dataGas, gasPrice, gasToken, refundReceiver, nonce) {
    if (!Web3.utils.isAddress(to)) {
      const err = new TypeError(`Mandatory Parameter 'to' is missing or invalid: ${to}.`);
      return Promise.reject(err);
    }
    const txHash = this.contract.methods
      .getTransactionHash(to, value, data, operation, safeTxGas, dataGas, gasPrice, gasToken, refundReceiver, nonce)
      .call();

    return txHash;
  }

  /**
   * It provides list of owners.
   *
   * @return {Promise<Object>} Promise that resolves to array of owners.
   */
  getOwners() {
    return this.contract.methods.getOwners().call();
  }

  /**
   * It returns the transaction nonce.
   *
   * @return {Promise<Object>} Promise that resolves current GnosisSafe nonce.
   */
  getNonce() {
    return this.contract.methods.nonce().call();
  }

  /**
   * Returns hash in EIP-712 format which is signed by owners.
   *
   * @param to Destination address of Safe transaction.
   * @param value Ether value of Safe transaction.
   * @param data Data payload of Safe transaction.
   * @param operation Operation type of Safe transaction.
   * @param safeTxGas Gas that should be used for the Safe transaction.
   * @param dataGas Gas costs for data used to trigger the safe transaction and to pay the payment transfer
   * @param gasPrice Gas price that should be used for the payment calculation.
   * @param gasToken Token address (or 0 if ETH) that is used for the payment.
   * @param refundReceiver Address of receiver of gas payment (or 0 if tx.origin).
   * @param nonce Transaction nonce.
   *
   * @returns {TypedData} TypedData object which will be signed.
   */
  getSafeTxData(to, value, data, operation, safeTxGas, dataGas, gasPrice, gasToken, refundReceiver, nonce) {
    //const DOMAIN_SEPARATOR_TYPEHASH = '0x035aff83d86937d35b32e04f0ddc6ff469290eef2f1b692d8a815c89404d4749';
    const typedDataInput = {
      types: {
        EIP712Domain: [{ name: 'verifyingContract', type: 'address' }],
        SafeTx: [
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'operation', type: 'uint8' },
          { name: 'safeTxGas', type: 'uint256' },
          { name: 'dataGas', type: 'uint256' },
          { name: 'gasPrice', type: 'uint256' },
          { name: 'gasToken', type: 'address' },
          { name: 'refundReceiver', type: 'address' },
          { name: 'nonce', type: 'uint256' }
        ]
      },
      primaryType: 'SafeTx',
      domain: {
        verifyingContract: this.address
      },
      message: {
        to: to,
        value: value.toString(10),
        data: data,
        operation: operation.toString(10),
        safeTxGas: safeTxGas.toString(10),
        dataGas: dataGas.toString(10),
        gasPrice: gasPrice.toString(10),
        gasToken: gasToken,
        refundReceiver: refundReceiver,
        nonce: nonce.toString(10)
      }
    };

    let typedDataInstance = EIP712TypedData.fromObject(typedDataInput);

    if (typedDataInstance.validate() === true) {
      return typedDataInstance;
    } else {
      throw new Error('Safe Tx is invalid');
    }
  }

  /**
   * It is used to find previous owner for an owner. It is used for removing and replacing of owners.
   *
   * @param {Array} listOfOwners List of owners.
   * @param {string} owner Owner whose previous owner is needed.
   *
   * @returns {string} Return an owner if found in the array otherwise undefined.
   */
  static findPreviousOwner(listOfOwners, owner) {
    const sentinel = '0x0000000000000000000000000000000000000001';

    if (listOfOwners[0] === owner) {
      // If the owner is first in the linked list.
      return sentinel;
    }
    for (let i = 1; i < listOfOwners.length; i++) {
      if (listOfOwners[i] === owner) {
        return listOfOwners[i - 1];
      }
    }
  }

  /**
   * Returns domain separator.
   *
   * @returns {string} domain separator value.
   */
  async getDomainSeparator() {
    return this.contract.methods.domainSeparator().call();
  }

  /**
   * Returns list of all modules.
   *
   * @returns {Object} Map of all modules.
   */
  async getModules() {
    return this.contract.methods.getModules().call();
  }
}

module.exports = GnosisSafe;
