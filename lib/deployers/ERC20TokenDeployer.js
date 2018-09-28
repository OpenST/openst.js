'use strict';

const InstanceComposer = require('../../instance_composer'),
  deployContract = require('../../utils/deployContract');

const ERC20TokenDeployer = function(params) {
  const oThis = this;

  oThis.from = params.from;
  oThis.gasPrice = params.gasPrice;
  oThis.gas = params.gas;
};

ERC20TokenDeployer.prototype = {
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
    console.log('ERC20Token ContractAddress :', oThis.tokenContractAddress);
    return tokenDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(ERC20TokenDeployer, 'ERC20TokenDeployer');

module.exports = ERC20TokenDeployer;
