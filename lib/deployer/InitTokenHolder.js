'use strict';

const InstanceComposer = require('../../instance_composer'),
  deployContract = require('../../utils/deployContract'),
  helper = require('../../utils/helper');

const InitTokenHolder = function(params) {
  const oThis = this;

  oThis.deployerAddress = params.deployerAddress;
  oThis.deployerPassphrase = params.deployerPassphrase;
  oThis.gasPrice = params.gasPrice;
  oThis.gasLimit = params.gasLimit;
  // args = [brandedToken, coGateway, tokenRules, required, wallets];
  // wallets is an array
  oThis.args = params.args;
};

InitTokenHolder.prototype = {
  perform: function() {
    const oThis = this;

    return oThis.deployTokenHolderOnAuxiliary();
  },

  deployTokenHolderOnAuxiliary: async function() {
    const oThis = this;

    let web3 = oThis.ic().chainWeb3();

    let contractName = 'TokenHolder';
    console.log('Deploy TokenHolder contract on auxiliary chain START.');
    let tokenHolderDeployResponse = await new deployContract({
      web3: web3,
      contractName: contractName,
      deployerAddress: oThis.deployerAddress,
      gasPrice: oThis.gasPrice,
      gas: oThis.gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: oThis.args
    }).deploy();

    oThis.tokenHolderContractAddress = tokenHolderDeployResponse.receipt.contractAddress;
    console.log('tokenHolder Contract Address :', oThis.tokenHolderContractAddress);
    return tokenHolderDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(InitTokenHolder, 'InitTokenHolder');

module.exports = InitTokenHolder;
