'use strict';

const InstanceComposer = require('../../instance_composer'),
  deployContract = require('../../utils/deployContract'),
  utils = require('web3-utils'),
  helper = require('../../utils/abiBinProvider');

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
    let bnSuggestedGas = utils.toBN('4000000');
    let bnConfiguredGas = utils.toBN(oThis.gas || '0');
    let bnGasToUse = bnSuggestedGas.cmp(bnConfiguredGas) < 0 ? bnSuggestedGas : bnConfiguredGas;

    let tokenHolderDeployResponse = await new deployContract({
      web3: web3,
      contractName: contractName,
      from: oThis.from,
      gasPrice: oThis.gasPrice,
      gas: bnGasToUse.toString(10),
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: oThis.args
    }).deploy();

    oThis.tokenHolderContractAddress = tokenHolderDeployResponse.receipt.contractAddress;
    console.log('TokenHolder Contract Address :', oThis.tokenHolderContractAddress);
    return tokenHolderDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(TokenHolderDeployer, 'TokenHolderDeployer');

module.exports = TokenHolderDeployer;
