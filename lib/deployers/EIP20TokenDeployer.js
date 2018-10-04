'use strict';

const InstanceComposer = require('../../instance_composer'),
  deployContract = require('../../utils/deployContract');

const EIP20TokenDeployer = function(params) {
  const oThis = this;

  oThis.from = params.from;
  oThis.gasPrice = params.gasPrice;
  oThis.gas = params.gas;
};

EIP20TokenDeployer.prototype = {
  perform: function() {
    const oThis = this;

    return oThis.deployEIP20TokenOnOrigin();
  },

  deployEIP20TokenOnOrigin: async function() {
    const oThis = this;
    let web3 = oThis.ic().chainWeb3();
    let abiBinProvider = oThis.ic().abiBinProvider();

    let contractName = 'MockToken';
    let tokenDeployResponse = await new deployContract({
      web3: web3,
      contractName: contractName,
      from: oThis.from,
      gasPrice: oThis.gasPrice,
      gas: oThis.gas,
      abi: abiBinProvider.getABI(contractName),
      bin: abiBinProvider.getBIN(contractName),
      args: []
    }).deploy();

    oThis.tokenContractAddress = tokenDeployResponse.receipt.contractAddress;
    console.log('EIP20Token Contract Address :', oThis.tokenContractAddress);
    return tokenDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(EIP20TokenDeployer, 'EIP20TokenDeployer');

module.exports = EIP20TokenDeployer;
