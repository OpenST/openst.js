'use strict';

const deployContract = require('../../utils/deployContract'),
    helper = require('../../utils/helper');

const InitTransferRule = function(params) {
    const oThis = this;

    oThis.web3Provider = params.web3Provider;
    oThis.deployerAddress = params.deployerAddress;
    oThis.deployerPassphrase = params.deployerPassphrase;
    oThis.gasPrice = params.gasPrice;
    oThis.gasLimit = params.gasLimit;
    // args = [tokenRules];
    oThis.args = params.args;
};

InitTransferRule.prototype = {
    perform: function() {
        const oThis = this;

        return oThis.deployTransferRuleOnAuxiliary();
    },

    deployTransferRuleOnAuxiliary: async function() {
        const oThis = this;

        console.log('unlocking account.');
        await oThis.web3Provider.eth.personal.unlockAccount(oThis.deployerAddress, oThis.deployerPassphrase);
        let contractName = 'TransferRule';
        console.log('Deploy TransferRule contract on auxiliary chain START.');
        let transferRuleDeployResponse = await new deployContract({
            web3: oThis.web3Provider,
            contractName: contractName,
            deployerAddress: oThis.deployerAddress,
            gasPrice: oThis.gasPrice,
            gas: oThis.gasLimit,
            abi: helper.getABI(contractName),
            bin: helper.getBIN(contractName),
            args: oThis.args
        }).deploy();

        oThis.transferRuleContractAddress = transferRuleDeployResponse.receipt.contractAddress;
        console.log('transferRule Contract Address :', oThis.transferRuleContractAddress);
        return transferRuleDeployResponse;
    }
};

module.exports = InitTransferRule;
