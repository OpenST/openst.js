'use strict';

const DeployContract = function(params) {
  const oThis = this;

  Object.assign(oThis, params);
  if (!oThis.bin) {
    throw 'Invalid Contract Bin. Please provide params.bin.';
  }
  oThis.bin = String(oThis.bin);
};

DeployContract.prototype = {
  deploy: async function() {
    const oThis = this;

    let txOptions = {
      from: oThis.from,
      gas: oThis.gas,
      gasPrice: oThis.gasPrice
    };

    if (oThis.args) {
      txOptions.arguments = oThis.args;
    }

    if (oThis.bin.indexOf('0x') !== 0) {
      oThis.bin = '0x' + oThis.bin;
    }

    //console.log('oThis.bin', oThis.bin);
    const contract = new oThis.web3.eth.Contract(oThis.abi, null, txOptions);

    let deployOptions = {
      data: oThis.bin,
      arguments: oThis.args || []
    };

    let tx = contract.deploy(deployOptions),
      transactionHash = null,
      receipt = null;

    console.log('Deploying contract ' + oThis.contractName);
    let instance = await tx
      .send(txOptions)
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
