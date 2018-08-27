"use strict";

const InstanceComposer = require('../instance_composer');

require('./setup/initEconomy');

/** Sample config objects
 originConfig = {
	deployerAddress: '0xAA93Fb03664e6768C798720a3aB035F414D7821F',
	opsAddress: '0x5505793aDfbf265972cbBa118d6097D539732b86',
	workerAddress: '0x5505793aDfbf265972cbBa118d6097D539732b86',
	registrar: '0x36796be23fE925cf18f8710249B36B1e53557836',
	chainId: 2001,
	chainIdRemote: 1000,
	remoteChainBlockGenerationTime: 15,
	openSTRemote: '0x7aA8D26B1153486FB62fB674971E30Fbafac5702'
}

 auxliaryConfig = {
	deployerAddress: '0x3A4459ED4d44103E82F3be9794ab7B4F8d2e3c75',
	opsAddress: '0xbF82DaE8f9B6b85471D26C27F63c05D978ee8B67',
	workerAddress: '0xbF82DaE8f9B6b85471D26C27F63c05D978ee8B67',
	registrar: '0x2a4ecEDBE6C732C55a3549291c601cfd2Ba1D0a5',
	chainId: 1000,
	chainIdRemote: 2001,
	remoteChainBlockGenerationTime: 15,
	openSTRemote: '0x7aA8D26B1153486FB62fB674971E30Fbafac5702'
}
 */

const Setup = function ( config, ic ) {};

Setup.prototype = {
  /**
   * Init Economy
   *
   * @param originConfig {object} - config related to origin chain
   * @param auxliaryConfig - config related to auxiliary chain
   * @returns {promise}
   */
  initEconomy: function (originConfig, auxliaryConfig, tokenConfig) {
    const oThis = this
      , InitEconomy = oThis.ic().InitEconomy()
    ;

    return new InitEconomy(originConfig, auxliaryConfig, tokenConfig).perform();
  }
};


InstanceComposer.register(Setup, 'Setup', true);
module.exports = Setup;