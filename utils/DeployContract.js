'use strict';

// TODO: class format
/**
 * DeployContract constructor.
 *
 * @param contractName Contract name.
 * @param txObject Contract tx object.
 * @param web3 Web3 object.
 * @param txOptions Tx options.
 * @constructor
 */
const DeployContract = function(contractName, txObject, web3, txOptions) {
  const oThis = this;

  oThis.contractName = contractName;
  oThis.txObject = txObject;
  oThis.txOptions = txOptions;
  oThis.web3 = web3;
};

// TODO Gulshan: Documentation
DeployContract.prototype = {
  deploy: async function() {
    const oThis = this;

    let receipt = null,
      transactionHash = null;
    console.log('Deploying contract: ' + oThis.contractName);
    let instance = await oThis.txObject
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

    let contractAddress = null;

    contractAddress = instance.options.address;

    // checking if the contract was deployed at all.
    const code = await oThis.web3.eth.getCode(contractAddress);

    if (code.length <= 2) {
      return Promise.reject('Contract deployment failed. oThis.web3.eth.getCode returned empty code.');
    }

    console.log('Address  :', contractAddress);
    console.log('Gas used :', receipt.gasUsed, '\n');

    return Promise.resolve({
      receipt: receipt,
      instance: instance
    });
  }
};

module.exports = DeployContract;
