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
    // args = [brandedToken, coGateway, tokenRules, required, wallets];
    // wallets is an array
    oThis.args = params.args;
};

InitTokenHolder.prototype = {

    deploy: function() {
        const oThis = this;

        return oThis.deployTokenHolderOnAuxiliary();
    },

    deployTokenHolderOnAuxiliary: async function() {
        const oThis = this;

        console.log('unlocking account.');
        await oThis.web3Provider.eth.personal.unlockAccount(oThis.deployerAddress, oThis.deployerPassphrase);
        let contractName = 'TokenHolder';
        console.log('Deploy TokenHolder contract on auxiliary chain START.');
        let tokenHolderDeployResponse = await new deployContract({
            web3: oThis.web3Provider,
            contractName: contractName,
            deployerAddress: oThis.deployerAddress,
            gasPrice: oThis.gasPrice,
            gas: oThis.gasLimit,
            abi: helper.getABI(contractName),
            bin: helper.getBIN(contractName),
            args: oThis.args
        }).deploy();

        oThis.tokenHolderContractAddress = tokenHolderDeployResponse.receipt.contractAddress;
        console.log('tokenHolder ContractAddress :', oThis.tokenHolderContractAddress);
        return tokenHolderDeployResponse;
    }
};

module.exports = InitTokenHolder;
