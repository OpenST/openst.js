'use strict';

const BaseContract = require('web3-eth-contract');

const generator = function(
  proto,
  originContractAbi,
  originContractGetter,
  auxiliaryContractAbi,
  auxiliaryContractGetter
) {
  let originContract, auxContract;

  if (originContractAbi) {
    originContract = new BaseContract(originContractAbi);
  }

  if (auxiliaryContractAbi) {
    auxContract = new BaseContract(auxiliaryContractAbi);
  }

  let originMethods = originContract ? originContract.methods : {};
  let auxMethods = auxContract ? auxContract.methods : {};

  console.log(auxMethods);

  let methodKeys = Object.keys(originMethods),
    len = methodKeys.length,
    methodName;

  proto.oThisObj = function() {
    return this;
  };

  let originMethodKeeper = {};
  while (len--) {
    methodName = methodKeys[len];
    let methodKeeper = proto;
    if (auxMethods.hasOwnProperty(methodName)) {
      // This needs to be chian specific
      methodKeeper = proto._originMethods = proto._originMethods || [];
      methodKeeper.push(methodName);
    } else {
      methodKeeper[methodName] = methodBuilder(methodName, originContractGetter, null);
    }
  }

  methodKeys = Object.keys(auxMethods);
  len = methodKeys.length;
  while (len--) {
    methodName = methodKeys[len];
    let methodKeeper = proto;
    if (originMethods.hasOwnProperty(methodName)) {
      // This needs to be chian specific
      methodKeeper = proto._auxiliaryMethods = proto._auxiliaryMethods || [];
      methodKeeper.push(methodName);
    } else {
      methodKeeper[methodName] = methodBuilder(methodName, auxiliaryContractGetter, null);
    }
  }
};

generator.bindOriginMethods = function(instance, contractGetterName) {
  if (!instance._originMethods) {
    return;
  }
  instance.origin = instance.origin || {};

  let methodKeeper = instance.origin,
    methods = instance._originMethods,
    len = methods.length,
    methodName;
  while (len--) {
    methodName = methods[len];
    methodKeeper[methodName] = methodBuilder(methodName, contractGetterName, instance);
  }
};

generator.bindAuxiliaryMethods = function(instance, contractGetterName) {
  if (!instance._auxiliaryMethods) {
    return;
  }
  instance.auxiliary = instance.auxiliary || {};

  let methodKeeper = instance.auxiliary,
    methods = instance._auxiliaryMethods,
    len = methods.length,
    methodName;
  while (len--) {
    methodName = methods[len];
    methodKeeper[methodName] = methodBuilder(methodName, contractGetterName, instance);
  }
};

function methodBuilder(methodName, contractGetterName, instance) {
  return function() {
    const oThis = instance || this,
      web3ContractObj = oThis[contractGetterName](),
      fnScope = web3ContractObj.methods,
      fn = fnScope[methodName];
    return fn.apply(fnScope, arguments);
  };
}

module.exports = generator;
