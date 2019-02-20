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

    let transactionHash = '';

    return oThis.txObject
      .send(oThis.txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('transactionHash = ' + transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log(`Transaction (${transactionHash}) consumed ${receipt.gasUsed} gas.`);
      })
      .on('error', (error) => {
        console.log(`Transaction (${transactionHash}) failed: ${error}`);
      });
  }
}

module.exports = TxSender;
