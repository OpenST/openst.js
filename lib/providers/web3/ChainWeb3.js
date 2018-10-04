'use strict';

const Web3 = require('web3');
const signerServiceBinder = require('../../../lib/providers/web3/signerServiceBinder');
const InstanceComposer = require('../../../instance_composer');

const ChainWeb3 = function(config, ic) {
  const oThis = this,
    provider = ic.configStrategy.web3Provider,
    net = ic.configStrategy.web3Net,
    maxHttpScokets = 20;

  //__NOT_FOR_WEB__BEGIN__
  if (provider && typeof provider === 'string') {
    // HTTP
    if (/^http(s)?:\/\//i.test(provider)) {
      let httpModuleName = provider.indexOf('https') > -1 ? 'https' : 'http';
      let httpModule = require(httpModuleName);
      if (!httpModule.globalAgent.keepAlive) {
        httpModule.globalAgent.keepAlive = true;
        httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
        httpModule.globalAgent.maxSockets = maxHttpScokets;
      }
    }
  }
  //__NOT_FOR_WEB__END__

  Web3.call(oThis, provider, net);

  //Bind send method with signer.
  oThis.bindSignerService();

  //Per-warm Connections.
  let socketCnt = maxHttpScokets;
  while (socketCnt--) {
    oThis.eth.getBlockNumber();
  }
};

if (Web3.prototype) {
  ChainWeb3.prototype = Object.create(Web3.prototype);
} else {
  ChainWeb3.prototype = {};
}

ChainWeb3.prototype.signerServiceInteract = function() {
  const oThis = this;

  let signers = oThis.ic().Signers();
  return signers.getSignerService();
};

signerServiceBinder(ChainWeb3.prototype);
InstanceComposer.register(ChainWeb3, 'chainWeb3', true);

module.exports = ChainWeb3;
