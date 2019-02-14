'use strict';
/**
 * Check if the GETHs are generating new blocks
 *
 * @module tools/GethChecker
 */
const Web3 = require('web3');

/**
 * Constructor for geth checker
 *
 * @param {array<string>} providerEndpoints - Array of GETH endpoints
 *
 * @constructor
 */
const GethChecker = function(providerEndpoints) {
  const oThis = this;

  oThis.providerEndpoints = providerEndpoints;
};

GethChecker.prototype = {
  /**
   * Check if chains started mining and are ready
   *
   * @return {promise}
   */
  perform: function() {
    const oThis = this,
      promiseArray = [];

    let len = oThis.providerEndpoints.length;
    while (len--) {
      let endPoint = oThis.providerEndpoints[len];
      promiseArray.push(oThis._isRunning(endPoint));
    }

    return Promise.all(promiseArray).then(function(response) {
      return response;
    });
  },

  /**
   * Check if mentioned chain started mining and are ready
   *
   * @param {string} endPoint - endpoint of the GETH
   *
   * @return {promise}
   */
  _isRunning: function(endPoint) {
    const retryAttempts = 100,
      timerInterval = 5000,
      chainTimer = { timer: undefined, blockNumber: 0, retryCounter: 0 },
      provider = new Web3(endPoint);
    return new Promise(function(onResolve, onReject) {
      chainTimer['timer'] = setInterval(function() {
        if (chainTimer['retryCounter'] <= retryAttempts) {
          provider.eth.getBlockNumber(function(err, blocknumber) {
            if (err) {
            } else {
              if (chainTimer['blockNumber'] != 0 && chainTimer['blockNumber'] != blocknumber) {
                clearInterval(chainTimer['timer']);
                onResolve();
              }
              chainTimer['blockNumber'] = blocknumber;
            }
          });
        } else {
          onReject();
          process.exit(1);
        }
        chainTimer['retryCounter']++;
      }, timerInterval);
    });
  }
};

module.exports = GethChecker;
