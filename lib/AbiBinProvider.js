/**
 * @typedef {Object} Library Smart contract library for use in linking.
 * @property {string} name Name of the libary, as used in linking placeholders.
 * @property {string} address Address of the deployed library.
 */

'use strict';

const OpenSTContracts = require('@openst/openst-contracts');

const Linker = require('../utils/linker');

/**
 * The class provides getter to get ABIs and BINs for different contracts.
 * ABI and BIN comes from openst-contracts npm package.
 */
class AbiBinProvider {
  /**
   * Constructor for AbiBinProvider.
   */
  constructor() {
    this.custom = {};
    this.openstContracts = {};
    // Flattens openst and gnosis object
    this.flattenOpenstContracts();
  }

  /**
   * Method to add ABI.
   *
   * @param contractName Name of the contract.
   * @param abiContent ABI of the contract.
   */
  addABI(contractName, abiContent) {
    let abi;
    if (typeof abiContent === 'string') {
      abi = JSON.parse(abiContent);
    } else if (typeof abiContent === 'object') {
      abi = abiContent;
    } else {
      const err = new Error('Abi should be either JSON String or an object');
      throw err;
    }

    const holder = (this.custom[contractName] = this.custom[contractName] || {});
    if (holder.abi) {
      const err = new Error(`Abi for Contract Name ${contractName} already exists.`);
      throw err;
    }

    holder.abi = abi;
  }

  /**
   * Method to add BIN.
   *
   * @param contractName Name of the contract.
   * @param binContent BIN of the contract.
   */
  addBIN(contractName, binContent) {
    if (typeof binContent !== 'string') {
      const err = new Error('Bin should be a string');
      throw err;
    }

    const holder = (this.custom[contractName] = this.custom[contractName] || {});
    if (holder.bin) {
      const err = new Error(`Bin for Contract Name ${contractName} already exists.`);
      throw err;
    }

    holder.bin = binContent;
  }

  /**
   * Getter to get ABI for a contract.
   *
   * @param contractName Name of the contract.
   *
   * @returns {String} ABI JSON string.
   */
  getABI(contractName) {
    if (this.custom && this.custom[contractName] && this.custom[contractName].abi) {
      return this.custom[contractName].abi;
    }
    const contract = this.openstContracts[contractName];
    if (!contract) {
      throw new Error(`Could not retrieve ABI for ${contractName}, because the contract doesn't exist.`);
    }
    const { abi } = contract;
    return abi;
  }

  /**
   * Getter to get BIN for a contract.
   * @param contractName Name of the contract.
   *
   * @returns {String} Binary string.
   */
  getBIN(contractName) {
    if (this.custom && this.custom[contractName] && this.custom[contractName].bin) {
      return this.custom[contractName].bin;
    }

    const contract = this.openstContracts[contractName];
    if (!contract) {
      throw new Error(`Could not retrieve bin for ${contractName}, because the contract doesn't exist.`);
    }
    const bin = contract.bin;
    if (!bin) {
      throw new Error(
        `Could not retrieve bin for ${contractName}. This means that either the contract ABI was added to the AbiBinProvider without the bin, or that the contract does not produce a bin (e.g. interface contracts).`
      );
    }
    return bin;
  }

  /**
   * Returns the a linked bin for a contract.
   *
   * @param {string} contractName Name of the contract to be linked.
   * @param {...Library} libs The libraries to be linked to the bin.
   *
   * @returns {string} The linked bin.
   */
  getLinkedBIN(contractName, ...libs) {
    const bin = this.getBIN(contractName);
    if (!bin) {
      return bin;
    }

    let len = libs.length;
    const libraries = {};
    while (len--) {
      let libInfo = libs[len];
      if (typeof libInfo !== 'object' || !libInfo.name || !libInfo.address) {
        throw new Error('Invalid contract info argument at index ' + (len + 1));
      }
      libraries[libInfo.name] = libInfo.address;
    }
    return Linker.linkBytecode(bin, libraries);
  }

  flattenOpenstContracts() {
    this.openstContracts = OpenSTContracts.openst;
    Object.assign(this.openstContracts, OpenSTContracts.gnosis);
  }

  static get Linker() {
    return Linker;
  }
}

module.exports = AbiBinProvider;
