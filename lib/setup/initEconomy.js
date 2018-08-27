"use strict";

const fs = require('fs');

const InstanceComposer = require('../../instance_composer');

function read(filePath) {
  filePath = path.join(__dirname, '/' + filePath);
  console.log('filePath', filePath);
  return fs.readFileSync(filePath, 'utf8');
}

const deployContract = async function (web3, contractName, deployerAddress, gasPrice, args) {
  let abi = JSON.parse(read('../../contracts/abi/' + contractName + '.abi'))
    , binCode = read('../../contracts/bin/' + contractName + '.bin');

  let txOptions = {
    from : deployerAddress,
    gas  : 9000000,
    data : "0x" + binCode,
    gasPrice: gasPrice // taken from http://ethgasstation.info/ ---- 1 gwei
  };

  if (args) {
    txOptions.arguments = args;
  }

  const contract = new web3.eth.Contract(abi, null, txOptions);

  let tx = contract.deploy(txOptions)
    , transactionHash = null
    , receipt = null;

  console.log("Deploying contract " + contractName);

  const instance = await tx.send()
    .on('receipt', function (value) {
      receipt = value
    })
    .on('transactionHash', function(value){
      console.log("transaction hash: " + value);
      transactionHash = value
    })
    .on('error', function(error){
      return Promise.reject(error)
    });

  const code = await web3.eth.getCode(instance.options.address);

  if (code.length <= 2) {
    return Promise.reject("Contract deployment failed. web3.eth.getCode returned empty code.");
  }

  console.log("Address  : " + instance.options.address);
  console.log("Gas used : " + receipt.gasUsed);

  return Promise.resolve({
    receipt  : receipt,
    instance : instance
  })
};

/**
 * originConfig = {
 *      eip20ContractAddress: '0x000...',
   *    provider: 'http://...',
   *    deployerAddress: '0xBAF68AC8e5966489B2b4139f07dE8188d8Ff5a99',
   *    workerAddress: '0x000...',
   *    registrar: '0x000...',
   *    chainId: 2001,
   *    chainIdRemote: 1000,
   *    remoteChainBlockGenerationTime: 15,
   *    openSTRemote: '0x000...'
   * }
 * *
 * auxliaryConfig = {
   *    provider: 'http://...',
   *    deployerAddress: '0x000...',
   *    workerAddress: '0x000...',
   *    registrar: '0x000...',
   *    chainId: 1000,
   *    chainIdRemote: 2001,
   *    remoteChainBlockGenerationTime: 15,
   *    openSTRemote: '0x000...'
   *    organisationAddress: '0x000...'
   * }
 *
 * tokenConfig = {
 *      name: 'Unsplash',
 *      symbol: 'USP',
 *      decimals: 18,
 *      conversionRate: 2,
 *      conversionRateDecimals: 0
 * }
 *
 */
const InitEconomy = function (originConfig, auxliaryConfig, tokenConfig) {
  const oThis = this;

  oThis.originConfig = originConfig;
  oThis.auxliaryConfig = auxliaryConfig;
  oThis.tokenConfig = tokenConfig;

  console.log('oThis.tokenConfig111', oThis.tokenConfig);
};

InitEconomy.prototype = {
  originConfig: null,
  auxliaryConfig: null,
  tokenConfig: null,


  perform: async function() {
    const oThis = this;

    await oThis.deployutilityBrandedToken();
  },

  deployutilityBrandedToken: async function () {
    const oThis = this;

    let mosaic = oThis.ic().configStrategy.mosaicObject;

    let auxiliaryWeb3 = mosaic.core('0x0000000000000000000000000000000000000001');

    console.log('Deploy utility branded token contract on origin chain START.');

    await auxiliaryWeb3.eth.personal.unlockAccount(oThis.auxliaryConfig.deployerAddress, 'testtest');

    console.log('oThis.tokenConfig', oThis.tokenConfig);

    let uuid = auxiliaryWeb3.utils.soliditySha3(
      oThis.tokenConfig.symbol,
      oThis.tokenConfig.name,
      oThis.originConfig.chainId,
      oThis.auxliaryConfig.chainId,
      oThis.auxliaryConfig.deployerAddress,
      oThis.tokenConfig.conversionRate,
      oThis.tokenConfig.conversionRateDecimals);

    let UtilityBrandedTokenContractDeployResponse = await deployContract(
      auxiliaryWeb3,
      'BrandedToken',
      oThis.auxliaryConfig.deployerAddress,
      oThis.gasPrice,
      [
        uuid,
        oThis.tokenConfig.symbol,
        oThis.tokenConfig.name,
        oThis.tokenConfig.decimals,
        oThis.originConfig.chainId,
        oThis.auxliaryConfig.chainId,
        oThis.tokenConfig.conversionRate,
        oThis.tokenConfig.conversionRateDecimals,
        oThis.auxliaryConfig.organisationAddress
      ]);

    console.log('UtilityBrandedTokenContractDeployResponse:', UtilityBrandedTokenContractDeployResponse);

    let utilityBTContract = UtilityBrandedTokenContractDeployResponse.instance
    ;

    oThis.utilityBTContractAddress = UtilityBrandedTokenContractDeployResponse.receipt.contractAddress;

  }

};

InstanceComposer.registerShadowableClass(InitEconomy, 'InitEconomy');

module.exports = InitEconomy;