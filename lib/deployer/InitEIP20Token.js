'use strict';

const InstanceComposer = require('../../instance_composer'),
  deployContract = require('../../utils/deployContract'),
  helper = require('../../utils/helper');

const InitEIP20Token = function(params) {
  const oThis = this;

  oThis.deployerAddress = params.deployerAddress;
  oThis.deployerPassphrase = params.deployerPassphrase;
  oThis.gasPrice = params.gasPrice;
  oThis.gasLimit = params.gasLimit;
};

InitEIP20Token.prototype = {
  perform: function() {
    const oThis = this;

    return oThis.deployEIP20TokenOnOrigin();
  },

  deployEIP20TokenOnOrigin: async function() {
    const oThis = this;

    console.log('Deploy EIP20Token contract on origin chain START.');

    let web3 = oThis.ic().chainWeb3();

    let contractName = 'MockToken';
    let tokenDeployResponse = await new deployContract({
      web3: web3,
      contractName: contractName,
      deployerAddress: oThis.deployerAddress,
      gasPrice: oThis.gasPrice,
      gas: oThis.gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: []
    }).deploy();

    oThis.tokenContractAddress = tokenDeployResponse.receipt.contractAddress;
    console.log('EIP20Token Contract Address :', oThis.tokenContractAddress);
    return tokenDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(InitEIP20Token, 'InitEIP20Token');

module.exports = InitEIP20Token;
