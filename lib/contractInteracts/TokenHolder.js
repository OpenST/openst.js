'use strict';
const InstanceComposer = require('../../instance_composer');

//Generator Code Begins.
const generator = require('./generator');
let isProtoGenerated = false;
let generateProto = (proto, contractAbi, contractGetter) => {
  if (isProtoGenerated) {
    return;
  }
  generator(proto, null, null, contractAbi, contractGetter);
  isProtoGenerated = true;
};
//Generator Code Ends.

let contractJsonInterface;
const TokenHolder = function(contractAddress, options) {
  const oThis = this;

  if (!contractJsonInterface) {
    //Fetch Interface.
    let abiBinProvider = oThis.ic().abiBinProvider();
    contractJsonInterface = abiBinProvider.getABI('TokenHolder');
    generateProto(TokenHolder.prototype, contractJsonInterface, '_getAuxiliaryContract');
  }

  options = options || {};
  const web3Obj = oThis.ic().chainWeb3(),
    contractInstance = new web3Obj.eth.Contract(contractJsonInterface, contractAddress, options);

  oThis._getAuxiliaryContract = function() {
    return contractInstance;
  };

  //Bind Tokenholder auxiliary methods.
  generator.bindAuxiliaryMethods(oThis, '_getAuxiliaryContract');
};

TokenHolder.prototype = {
  constructor: TokenHolder,
  _getAuxiliaryContract: null
};

InstanceComposer.registerShadowableClass(TokenHolder, 'TokenHolder');

module.exports = TokenHolder;
