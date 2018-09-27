'use strict';

const InstanceComposer = require('../../instance_composer'),
  deployContract = require('../../utils/deployContract'),
  helper = require('../../utils/abiBinProvider');

const TransferRuleDeployer = function(params) {
  const oThis = this;

  oThis.from = params.from;
  oThis.gasPrice = params.gasPrice;
  oThis.gas = params.gas;

  // args = [tokenRules];
  oThis.args = params.args;
};

TransferRuleDeployer.prototype = {
  perform: function() {
    const oThis = this;

    return oThis.deployTransferRuleOnAuxiliary();
  },

  deployTransferRuleOnAuxiliary: async function() {
    const oThis = this;

    let web3 = oThis.ic().chainWeb3();

    let contractName = 'TransferRule';
    let transferRuleDeployResponse = await new deployContract({
      web3: web3,
      contractName: contractName,
      from: oThis.from,
      gasPrice: oThis.gasPrice,
      gas: oThis.gas,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: oThis.args
    }).deploy();

    oThis.transferRuleContractAddress = transferRuleDeployResponse.receipt.contractAddress;
    console.log('transferRule Contract Address :', oThis.transferRuleContractAddress);
    return transferRuleDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(TransferRuleDeployer, 'TransferRuleDeployer');

module.exports = TransferRuleDeployer;
