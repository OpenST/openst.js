'use strict';

/**
 * It is used for sending a transaction.
 */
class TxSender {
  /**
   * Constructor of TxSender.
   *
   * @param txObject Transaction object.
   * @param web3 Web3 object.
   * @param txOptions Tx options.
   * @constructor
   */
  constructor(txObject, web3, txOptions) {
    const oThis = this;

    oThis.txObject = txObject;
    oThis.txOptions = txOptions;
    oThis.web3 = web3;
  }

  /**
   * It executes a transaction.
   *
   * @returns Transaction receipt.
   */
  async execute() {
    const oThis = this;

    let receipt = null,
      transactionHash = null;

    await oThis.txObject
      .send(oThis.txOptions)
      .on('receipt', function(value) {
        receipt = value;
      })
      .on('transactionHash', function(value) {
        console.log('transaction hash: ' + value);
        transactionHash = value;
      })
      .on('error', function(error) {
        return Promise.reject(error);
      });

    console.log('Gas used : ', receipt.gasUsed);

    return receipt;
  }
}

module.exports = TxSender;
