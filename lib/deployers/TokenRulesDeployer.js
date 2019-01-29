'use strict';

const InstanceComposer = require('../../instance_composer'),
  DeployContract = require('../../utils/DeployContract'),
  utils = require('web3-utils');

const TokenRulesDeployer = function(params) {
  const oThis = this;

  oThis.from = params.from;
  oThis.gasPrice = params.gasPrice;
  oThis.gas = params.gas;

  // args = [organization, token]
  // organization and token address
  oThis.args = params.args;
};

TokenRulesDeployer.prototype = {
  perform: function() {
    const oThis = this;

    return oThis.deployTokenRulesOnAuxiliary();
  },

  deployTokenRulesOnAuxiliary: async function() {
    const oThis = this;

    let web3 = oThis.ic().chainWeb3();
    let abiBinProvider = oThis.ic().abiBinProvider();

    let contractName = 'TokenRules';
    let bnSuggestedGas = utils.toBN('2000000');
    let bnConfiguredGas = utils.toBN(oThis.gas || '0');
    let bnGasToUse = bnSuggestedGas.cmp(bnConfiguredGas) < 0 ? bnSuggestedGas : bnConfiguredGas;

    let tokenRulesDeployResponse = await new DeployContract({
      web3: web3,
      contractName: contractName,
      from: oThis.from,
      gasPrice: oThis.gasPrice,
      gas: bnGasToUse.toString(10),
      abi: abiBinProvider.getABI(contractName),
      bin: abiBinProvider.getBIN(contractName),
      args: oThis.args
    }).deploy();

    oThis.tokenRulesContractAddress = tokenRulesDeployResponse.receipt.contractAddress;

    console.log('TokenRules Contract Address :', oThis.tokenRulesContractAddress);

    return tokenRulesDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(TokenRulesDeployer, 'TokenRulesDeployer');

module.exports = TokenRulesDeployer;
