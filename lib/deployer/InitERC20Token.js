'use strict';

const InstanceComposer = require('../../instance_composer'),
  deployContract = require('../../utils/deployContract'),
  helper = require('../../utils/helper');

const InitERC20Token = function(params) {
  const oThis = this;

  oThis.deployerAddress = params.deployerAddress;
  oThis.deployerPassphrase = params.deployerPassphrase;
  oThis.gasPrice = params.gasPrice;
  oThis.gasLimit = params.gasLimit;
};

InitERC20Token.prototype = {
  perform: function() {
    const oThis = this;

    return oThis.deployEIP20TokenOnOrigin();
  },

  deployEIP20TokenOnOrigin: async function() {
    const oThis = this;

    console.log('Deploy ERC20Token contract on origin chain START.');

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
    console.log('ERC20Token ContractAddress :', oThis.tokenContractAddress);
    return tokenDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(InitERC20Token, 'InitERC20Token');

module.exports = InitERC20Token;
