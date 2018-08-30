'use strict';

const deployContract = require('../utils/deployContract'),
  helper = require('../utils/helper');

const InitERC20Token = function(params) {
  const oThis = this;

  oThis.web3Provider = params.web3Provider;
  oThis.deployerAddress = params.deployerAddress;
  oThis.deployerPassphrase = params.deployerPassphrase;
  oThis.gasPrice = params.gasPrice;
  oThis.gasLimit = params.gasLimit;
};

InitERC20Token.prototype = {
  perform: function() {
    const oThis = this;

    return oThis.deployERC20TokenOnOrigin();
  },

  deployERC20TokenOnOrigin: async function() {
    const oThis = this;

    console.log('Deploy ERC20Token contract on origin chain START.');

    await oThis.web3Provider.eth.personal.unlockAccount(oThis.deployerAddress, oThis.deployerPassphrase);
    let contractName = 'MockToken',
      args = [];
    let tokenDeployResponse = await new deployContract({
      web3: oThis.web3Provider,
      contractName: contractName,
      deployerAddress: oThis.deployerAddress,
      gasPrice: oThis.gasPrice,
      gas: oThis.gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: args
    }).deploy();

    oThis.tokenContractAddress = tokenDeployResponse.receipt.contractAddress;
    console.log('ERC20Token ContractAddress :', oThis.tokenContractAddress);
    return tokenDeployResponse;
  }
};

module.exports = InitERC20Token;
