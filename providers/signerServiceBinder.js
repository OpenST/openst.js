'use strict';
const _ = require('underscore'),
  Web3PromiEvent = require('web3-core-promievent'),
  Method = require('web3-core-method'),
  utils = require('web3-utils');

module.exports = function(Web3Prototype) {
  if (typeof Web3Prototype.signerServiceInteract !== 'function') {
    let err = new Error('Web3Prototype MUST implement signerServiceInteract method');
    throw err;
  }

  Web3Prototype.bindSignerService = function() {
    const oThis = this;
    oThis._bindSigner();
    oThis._bindSignerToContractSend();
    oThis._bindSignerToSendTransaction();
  };

  Web3Prototype._signTx = function(promiEvent, txToBeSigned, callback) {
    const oWeb3 = this;
    let signerInteract = oWeb3.signerServiceInteract();
    let signerService = signerInteract.service();

    //Lets get nonce.
    return signerService
      .nonce(txToBeSigned.from)
      .then(function(nonce) {
        txToBeSigned.nonce = nonce;
        //Lets sign the transaction
        return signerService.signTransaction(txToBeSigned, txToBeSigned.from);
      })
      .then(function(signedTxPayload) {
        if (signedTxPayload && typeof signedTxPayload === 'object') {
          //The signer has responded with non-null object.
          //The standard dictates that signed data should be available in 'raw' key of object.
          signedTxPayload = signedTxPayload.raw;
        }

        if (typeof signedTxPayload !== 'string') {
          //Signer failed to give signed raw data.
          let err = new Error('Signer provided invalid signed data');
          throw err;
        }
        return signedTxPayload;
      })
      .catch(function(reason) {
        //Signer service threw an error.

        //Lets Catch it, reject our own promiEvent.
        promiEvent.eventEmitter.emit('error', reason);
        promiEvent.reject(reason);

        //Now, give it to callback.
        callback &&
          setTimeout(function() {
            callback(reason);
          }, 0);
        return null;
        /*Retruning null ensures that sendSignedTransaction is not called.*/
        /* Because signedTxPayload is null. */
      });
  };

  Web3Prototype._bindSignerToContractSend = function() {
    /*
      IMPORTANT: Before changing the code below, please make sure you understand following packages:
        - web3-core-method
        - web3-eth-contract
    */

    //oWeb3 refers to instace of MosaicWeb3 (OriginWeb3/AuxiliaryWeb3)
    //oWeb3 does NOT refer to the call MosaicWeb3.
    const oWeb3 = this,
      Contract = oWeb3.eth.Contract;

    let org_executeMethod = Contract.prototype._executeMethod;
    Contract.prototype._executeMethod = function(methodType, options) {
      let fnScope = this;
      let signerInteract = oWeb3.signerServiceInteract();
      if (!signerInteract || methodType !== 'send') {
        return org_executeMethod.apply(fnScope, arguments);
      }

      let _this = this,
        rawArgs = Array.prototype.slice.call(arguments),
        args = this._parent._processExecuteArguments.call(this, rawArgs);

      if (args.generateRequest || args.type !== 'send') {
        //This is send.request method. Ignore it.
        return org_executeMethod.apply(fnScope, arguments);
      }

      /*
        Following Code Borrowed from web3-eth-contract, Contract.prototype._executeMethod method.
        If updating web3.js please update the below code if needed.
      */

      let defer = Web3PromiEvent(),
        ethAccounts = _this.constructor._ethAccounts || _this._ethAccounts;

      // return error, if no "from" is specified
      if (!utils.isAddress(args.options.from)) {
        return utils._fireError(
          new Error('No "from" address specified in neither the given options, nor the default options.'),
          defer.eventEmitter,
          defer.reject,
          args.callback
        );
      }

      if (_.isBoolean(this._method.payable) && !this._method.payable && args.options.value && args.options.value > 0) {
        return utils._fireError(
          new Error('Can not send value to non-payable contract method or constructor'),
          defer.eventEmitter,
          defer.reject,
          args.callback
        );
      }

      // make sure receipt logs are decoded
      var extraFormatters = {
        receiptFormatter: function(receipt) {
          console.log('receiptFormatter called!!!');
          if (_.isArray(receipt.logs)) {
            // decode logs
            var events = _.map(receipt.logs, function(log) {
              return _this._parent._decodeEventABI.call(
                {
                  name: 'ALLEVENTS',
                  jsonInterface: _this._parent.options.jsonInterface
                },
                log
              );
            });

            // make log names keys
            receipt.events = {};
            var count = 0;
            events.forEach(function(ev) {
              if (ev.event) {
                // if > 1 of the same event, don't overwrite any existing events
                if (receipt.events[ev.event]) {
                  if (Array.isArray(receipt.events[ev.event])) {
                    receipt.events[ev.event].push(ev);
                  } else {
                    receipt.events[ev.event] = [receipt.events[ev.event], ev];
                  }
                } else {
                  receipt.events[ev.event] = ev;
                }
              } else {
                receipt.events[count] = ev;
                count++;
              }
            });

            delete receipt.logs;
          }
          return receipt;
        },
        contractDeployFormatter: function(receipt) {
          console.log('contractDeployFormatter called!!!');
          var newContract = _this._parent.clone();
          newContract.options.address = receipt.contractAddress;
          return newContract;
        }
      };

      /*
        End of Borrowed Code from web3-eth-contract, Contract.prototype._executeMethod method.
      */

      //Get the signed Tx
      let txToBeSigned = Object.assign({}, args.options);
      let callback = args.callback;
      oWeb3._signTx(defer, txToBeSigned, callback).then(function(signedTxPayload) {
        if (!signedTxPayload) {
          return;
        }

        //Create a new Method. (web3-core-method)
        let sendSignedTransactionMethod = new Method({
          name: 'sendSignedTransaction',
          call: 'eth_sendRawTransaction',
          params: 1,
          inputFormatter: [null],
          requestManager: _this._parent._requestManager,
          accounts: _this.constructor._ethAccounts || _this._ethAccounts, // is eth.accounts (necessary for wallet signing)
          defaultAccount: _this._parent.defaultAccount,
          defaultBlock: _this._parent.defaultBlock,
          extraFormatters: extraFormatters
        });

        let org_confirmTransaction = sendSignedTransactionMethod._confirmTransaction;
        sendSignedTransactionMethod._confirmTransaction = function(defer, result, payload) {
          let fnScope = this;
          payload.params[0] = args.options;
          return org_confirmTransaction.call(fnScope, defer, result, payload);
        };

        let sendSignedTransaction = sendSignedTransactionMethod.createFunction();
        console.log('Using custom sendSignedTransaction');

        let sendSignedPromiEvent = sendSignedTransaction(signedTxPayload, callback);
        oWeb3._bindPromieEvents(sendSignedPromiEvent, defer);
      });

      return defer.eventEmitter;
    };

    Contract.prototype._executeMethod._isOst = true;
  };

  Web3Prototype._bindPromieEvents = function(sourcePromiEvent, destinationPromiEvent) {
    let isSourcePomiseRejected = false;
    sourcePromiEvent
      .catch(function(reason) {
        //Reject out destinationPromieEvent.
        isSourcePomiseRejected = true;
        destinationPromiEvent.reject.apply(destinationPromiEvent, arguments);
      })
      .then(function() {
        if (isSourcePomiseRejected) {
          return;
        }
        //Resolve our destinationPromieEvent.
        destinationPromiEvent.resolve.apply(destinationPromiEvent, arguments);
      });

    //Override emit method.
    let org_emit_scope = sourcePromiEvent;
    let org_emit = org_emit_scope.emit;
    org_emit_scope.emit = function() {
      //Call the original emit method.
      let sourceReturnVal = org_emit.apply(org_emit_scope, arguments);

      //Forward events to our own destinationPromieEvent.
      let destinationReturnVal = destinationPromiEvent.eventEmitter.emit.apply(
        destinationPromiEvent.eventEmitter,
        arguments
      );

      return sourceReturnVal || destinationReturnVal;
    };
  };

  Web3Prototype._bindSignerToSendTransaction = function() {
    // oWeb3 refers to instace of MosaicWeb3 (OriginWeb3/AuxiliaryWeb3)
    // oWeb3 does NOT refer to the call MosaicWeb3.
    const oWeb3 = this;
    let org_sendTransaction = oWeb3.eth.sendTransaction;

    oWeb3.eth.sendTransaction = function(transactionObject, callback) {
      let oEth = this;

      //Check if signerService is available.
      let signerInteract = oWeb3.signerServiceInteract();
      if (!signerInteract) {
        console.log('signerInteract not found');
        //Lets execute the original send method.
        return org_sendTransaction.apply(oEth, arguments);
      }

      let txToBeSigned = Object.assign({}, transactionObject);
      let promiEvent = Web3PromiEvent();
      oWeb3._signTx(promiEvent, txToBeSigned, callback).then(function(signedTxPayload) {
        if (!signedTxPayload) {
          return;
        }

        //Lets send the signed tx.
        let isSignedTxRejected = false;
        let sendSignedPromiEvent = oWeb3.eth.sendSignedTransaction(signedTxPayload, callback);

        oWeb3._bindPromieEvents(sendSignedPromiEvent, promiEvent);
      });

      return promiEvent.eventEmitter;
    };
    oWeb3.eth.sendTransaction._isOst = true;
  };

  Web3Prototype._bindSigner = function() {
    const oWeb3 = this;
    let org_sign = oWeb3.eth.sign;
    oWeb3.eth.sign = function(dataToSign, address, callback) {
      let oEth = this;
      //Check if signerService is available.
      let signerInteract = oWeb3.signerServiceInteract();

      if (!signerInteract) {
        console.log('signerInteract not found');
        //Lets execute the original send method.
        return org_sign.apply(oEth, arguments);
      }

      let signerService = signerInteract.service();
      console.log('signerService', signerService);

      return signerService
        .sign(dataToSign, address)
        .catch(function(reason) {
          callback && callback(reason);
          throw reason;
        })
        .then(function(signedData) {
          callback && callback(null, signedData);
          return signedData;
        });
    };
  };
};
