'use strict';

const InstanceComposer = require('../../instance_composer'),
  deployContract = require('../../utils/deployContract'),
  helper = require('../../utils/helper');

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

    let contractName = 'TokenRules';
    console.log('Deploy TokenRules contract on auxiliary chain START.');
    let tokenRulesDeployResponse = await new deployContract({
      web3: web3,
      contractName: contractName,
      from: oThis.from,
      gasPrice: oThis.gasPrice,
      gas: oThis.gas,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: oThis.args
    }).deploy();

    oThis.tokenRulesContractAddress = tokenRulesDeployResponse.receipt.contractAddress;

    console.log('TokenRules ContractAddress :', oThis.tokenRulesContractAddress);

    return tokenRulesDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(TokenRulesDeployer, 'TokenRulesDeployer');

module.exports = TokenRulesDeployer;
