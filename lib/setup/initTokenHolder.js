'use strict';

const deployContract = require('../utils/deployContract'),
    helper = require('../utils/helper');

const InitTokenHolder = function(params) {
    const oThis = this;

    oThis.web3Provider = params.web3Provider;
    oThis.deployerAddress = params.deployerAddress;
    oThis.deployerPassphrase = params.deployerPassphrase;
    oThis.gasPrice = params.gasPrice;
    oThis.gasLimit = params.gasLimit;
};

InitTokenHolder.prototype = {
    perform: function() {
        const oThis = this;

        return oThis.deployTokenHolderOnAuxiliary();
    },

    deployTokenHolderOnAuxiliary: async function() {
        const oThis = this;

        console.log('unlocking account.');
        await oThis.web3Provider.eth.personal.unlockAccount(oThis.deployerAddress, oThis.deployerPassphrase);
        let contractName = 'TokenHolder',
            args = [];
        console.log('Deploy TokenHolder contract on auxiliary chain START.');
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

module.exports = InitTokenHolder;
