'use strict';

const InstanceComposer = require('../../instance_composer'),
  deployContract = require('../../utils/deployContract'),
  helper = require('../../utils/helper');

const InitTokenRules = function(params) {
  const oThis = this;

  oThis.deployerAddress = params.deployerAddress;
  oThis.deployerPassphrase = params.deployerPassphrase;
  oThis.gasPrice = params.gasPrice;
  oThis.gasLimit = params.gasLimit;

  // args = [organization, token]
  // organization and token address
  oThis.args = params.args;
};

InitTokenRules.prototype = {
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
      deployerAddress: oThis.deployerAddress,
      gasPrice: oThis.gasPrice,
      gas: oThis.gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: oThis.args
    }).deploy();

    oThis.tokenRulesContractAddress = tokenRulesDeployResponse.receipt.contractAddress;

    console.log('TokenRules Contract Address :', oThis.tokenRulesContractAddress);

    return tokenRulesDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(InitTokenRules, 'InitTokenRules');

module.exports = InitTokenRules;
