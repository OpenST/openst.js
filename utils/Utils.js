'use strict';

/**
 * This class includes the utitity functions.
 * @class
 * @classdesc Provides the common utility functions.
 */
class Utils {
  /**
   * Helper function to send ethereum transaction.
   *
   * @param {Object} tx Transaction object.
   * @param {Object} tx Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  static async sendTransaction(tx, txOption) {
    return new Promise(async (onResolve, onReject) => {
      const txOptions = Object.assign({}, txOption);
      if (!txOptions.gas) {
        txOptions.gas = await tx.estimateGas(txOptions);
      }

      tx.send(txOptions)
        .on('receipt', (receipt) => onResolve(receipt))
        .on('error', (error) => onReject(error))
        .catch((exception) => onReject(exception));
    });
  }

  /**
   * Prints a deprecation warning for deprecated code.
   *
   * @param {string} object Identifier of what has been deprecated.
   * @param {string} message Message that has instructions on how to migrate.
   *
   */
  static deprecationNotice(object, message) {
    console.warn(`⚠️ '${object}' has been deprecated. ${message}`);
  }
}

module.exports = Utils;
