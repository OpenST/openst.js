'use strict';

const AbiBinProvider = require('./../AbiBinProvider');
const Mosaic = require('@openst/mosaic.js'),
  TypedDataClass = Mosaic.Utils.EIP712TypedData;

const Utils = require('../../utils/Utils');

const gnosisSafeContractName = 'GnosisSafe';

/**
 * A multisignature wallet of a user with support for confirmations using signed messages based on ERC191.
 */
class GnosisSafe {
  /**
   * Constructor of GnosisSafe.
   *
   * @param gnosisSafeProxy Gnosis safe proxy address of a user.
   * @param auxiliaryWeb3 Auxiliary chain web3 object.
   */
  constructor(gnosisSafeProxy, auxiliaryWeb3) {
    const oThis = this;

    oThis.gnosisSafeProxy = gnosisSafeProxy;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Allows to add a new owner and update the threshold at the same time.
   *
   * @param owner New owner address.
   * @param threshold New threshold.
   *
   * @returns {*} Executable data for adding owner with threshold.
   */
  getAddOwnerWithThresholdExecutableData(owner, threshold) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(gnosisSafeContractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.gnosisSafeProxy),
      executableData = contract.methods.addOwnerWithThreshold(owner, threshold).encodeABI();

    return executableData;
  }

  /**
   * Allows to remove an owner and update the threshold at the same time.
   *
   * @param prevOwner Owner that pointed to the owner to be removed in the linked list.
   * @param owner Owner address to be removed.
   * @param threshold New threshold.
   *
   * @returns {*} Executable data for removing an owner with threshold.
   */
  getRemoveOwnerExecutableData(prevOwner, owner, threshold) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(gnosisSafeContractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.gnosisSafeProxy),
      executableData = contract.methods.removeOwner(prevOwner, owner, threshold).encodeABI();

    return executableData;
  }

  /**
   * Allows to swap/replace an owner with another address.
   *
   * @param prevOwner Owner that pointed to the owner to be replaced in the linked list.
   * @param oldOwner Owner address to be replaced.
   * @param newOwner New owner address.
   *
   * @returns {*} Executable data for swapping an owner.
   */
  getSwapOwnerExecutableData(prevOwner, oldOwner, newOwner) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(gnosisSafeContractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.gnosisSafeProxy),
      executableData = contract.methods.swapOwner(prevOwner, oldOwner, newOwner).encodeABI();

    return executableData;
  }

  /**
   * Allows to update the number of required confirmations by Safe owners.
   * This can only be done via a Safe transaction.
   *
   * @param threshold New threshold.
   *
   * @returns {*} Executable data to change threshold.
   */
  getChangeThresholdExecutableData(threshold) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(gnosisSafeContractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.gnosisSafeProxy),
      executableData = contract.methods.changeThreshold(threshold).encodeABI();

    return executableData;
  }

  /**
   * Allows to execute a Safe transaction confirmed by required number of owners and then pays the account that
   * submitted the transaction.
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
   * @param signatures Packed signature data ({bytes32 r}{bytes32 s}{uint8 v}).
   * @param txOptions Tx options.
   *
   * @returns Promise object.
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
    const oThis = this;

    const txObject = oThis._execTransactionRawTx(
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
   * @param to Destination address of Safe transaction.
   * @param value Ether value of Safe transaction.
   * @param data Data payload of Safe transaction.
   * @param operation Operation type of Safe transaction.
   * @param safeTxGas Gas that should be used for the Safe transaction.
   * @param dataGas Gas costs for data used to trigger the safe transaction and to pay the payment transfer
   * @param gasPrice Gas price that should be used for the payment calculation.
   * @param gasToken Token address (or 0 if ETH) that is used for the payment.
   * @param refundReceiver Address of receiver of gas payment (or 0 if tx.origin).
   * @param signatures Packed signature data ({bytes32 r}{bytes32 s}{uint8 v}).
   *
   * @returns Promise object.
   * @private
   */
  _execTransactionRawTx(
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
  ) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(gnosisSafeContractName);
    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.gnosisSafeProxy);

    return contract.methods.execTransaction(
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
  }

  /**
   * It returns hash to be signed by owners.
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
   * @returns {*} Transaction hash.
   */
  async getTransactionHash(to, value, data, operation, safeTxGas, dataGas, gasPrice, gasToken, refundReceiver, nonce) {
    // nonce can be taken from call to gnosisSafe.
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(gnosisSafeContractName);
    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.gnosisSafeProxy);

    const nonceFromContract = await contract.methods.nonce().call();

    const txHash = contract.methods
      .getTransactionHash(
        to,
        value,
        data,
        operation,
        safeTxGas,
        dataGas,
        gasPrice,
        gasToken,
        refundReceiver,
        nonceFromContract
      )
      .call();

    return txHash;
  }

  /**
   * It provides list of owners.
   *
   * @returns {*} Array of owners.
   */
  getOwners() {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(gnosisSafeContractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.gnosisSafeProxy);

    return contract.methods.getOwners().call();
  }

  /**
   * It returns the transaction nonce.
   *
   * @returns Promise object.
   */
  async getNonce() {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(gnosisSafeContractName);
    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.gnosisSafeProxy);
    return await contract.methods.nonce().call();
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
   * @returns {TypedData}
   */
  getSafeTxData(to, value, data, operation, safeTxGas, dataGas, gasPrice, gasToken, refundReceiver, nonce) {
    const oThis = this;

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
        verifyingContract: oThis.gnosisSafeProxy
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

    let typedDataInstance = TypedDataClass.fromObject(typedDataInput);

    if (typedDataInstance.validate() === true) {
      return typedDataInstance;
    } else {
      throw new Error('Safe Tx is invalid');
    }
  }

  /**
   * It is used to find previous owner for an owner. It is used for removing and replacing of owners.
   *
   * @param listOfOwners List of owners.
   * @param owner Owner whose previous owner is needed.
   *
   * @returns {*} Return an owner if found in the array otherwise undefined.
   */
  findPreviousOwner(listOfOwners, owner) {
    const sentinel = '0x0000000000000000000000000000000000000001';

    if (listOfOwners[0] == owner) {
      // If the owner is first in the linked list.
      return sentinel;
    }
    for (let i = 1; i < listOfOwners.length; i++) {
      if (listOfOwners[i] == owner) {
        return listOfOwners[i - 1];
      }
    }
  }

  /**
   * Returns domain separator.
   *
   * @returns {Promise<*>}
   */
  async getDomainSeparator() {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(gnosisSafeContractName);
    const contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.gnosisSafeProxy);

    return contract.methods.domainSeparator().call();
  }
}

module.exports = GnosisSafe;
