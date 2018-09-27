'use strict';

const InstanceComposer = require('../../instance_composer'),
  deployContract = require('../../utils/deployContract'),
  helper = require('../../utils/helper');

const TokenHolderDeployer = function(params) {
  const oThis = this;

  oThis.from = params.from;
  oThis.gasPrice = params.gasPrice;
  oThis.gas = params.gas;
  // args = [brandedToken, coGateway, tokenRules, required, wallets];
  // wallets is an array
  oThis.args = params.args;
};

TokenHolderDeployer.prototype = {
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
      from: oThis.from,
      gasPrice: oThis.gasPrice,
      gas: oThis.gas,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: oThis.args
    }).deploy();

    oThis.tokenHolderContractAddress = tokenHolderDeployResponse.receipt.contractAddress;
    console.log('tokenHolder Contract Address :', oThis.tokenHolderContractAddress);
    return tokenHolderDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(TokenHolderDeployer, 'TokenHolderDeployer');

module.exports = TokenHolderDeployer;
