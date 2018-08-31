'use strict';

const deployContract = require('../utils/deployContract'),
  helper = require('../utils/helper');

const InitEIP20Token = function(params) {
  const oThis = this;

  oThis.web3Provider = params.web3Provider;
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

    console.log('Deploy ERC20Token contract on origin chain START.');

    await oThis.web3Provider.eth.personal.unlockAccount(oThis.deployerAddress, oThis.deployerPassphrase);
    let contractName = 'EIP20Token',
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
    console.log('EIP20Token ContractAddress :', oThis.tokenContractAddress);
    return tokenDeployResponse;
  }
};

module.exports = InitEIP20Token;
