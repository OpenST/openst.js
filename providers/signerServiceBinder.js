'use strict';
const Web3PromiEvent = require('web3-core-promievent');

module.exports = function(OpenSTWeb3Prototype) {
  if (typeof OpenSTWeb3Prototype.signerServiceInteract !== 'function') {
    let err = new Error('OpenSTWeb3Prototype MUST implement signerServiceInteract method');
    throw err;
  }

  OpenSTWeb3Prototype.bindSigner = function() {
    const oThis = this;

    oThis._bindSignerToContractSend();
    oThis._bindSignerToSendTransaction();
  };

  OpenSTWeb3Prototype._signAndSendTx = function(txToBeSigned, callback) {
    const oWeb3 = this;

    let signerInteract = oWeb3.signerServiceInteract();
    let signerService = signerInteract.service();
    let promiEvent = Web3PromiEvent();

    //Lets get nonce.
    signerService
      .nonce(txToBeSigned.from)
      .then(function(nonce) {
        txToBeSigned.nonce = nonce;
        //Lets sign the transaction
        return signerService.sign(txToBeSigned);
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
      })
      .then(function(signedTxPayload) {
        if (!signedTxPayload) {
          return;
        }

        //Lets send the signed tx.
        let isSignedTxRejected = false;
        let sendSignedPromiEvent = oWeb3.eth.sendSignedTransaction(signedTxPayload, callback);

        sendSignedPromiEvent
          .catch(function(reason) {
            //Reject out promiEvent.
            isSignedTxRejected = true;
            promiEvent.reject.apply(promiEvent, arguments);
          })
          .then(function() {
            if (isSignedTxRejected) {
              return;
            }
            //Resolve our promiEvent.
            promiEvent.resolve.apply(promiEvent, arguments);
          });

        //Override emit method.
        let org_emit_scope = sendSignedPromiEvent;
        let org_emit = org_emit_scope.emit;
        org_emit_scope.emit = function() {
          //Forward events to our own promiEvent.
          promiEvent.eventEmitter.emit.apply(promiEvent.eventEmitter, arguments);
          //Call the original emit method.
          return org_emit.apply(org_emit_scope, arguments);
        };
      });

    return promiEvent.eventEmitter;
  };

  OpenSTWeb3Prototype._bindSignerToContractSend = function() {
    //oWeb3 does NOT refer to the call MosaicWeb3.
    const oWeb3 = this,
      Contract = oWeb3.eth.Contract;

    //Over-ride the _createTxObject method of Contract.
    let org_createTxObject = Contract.prototype._createTxObject;
    Contract.prototype._createTxObject = function() {
      //First execute the original _createTxObject method.
      const oContract = this;

      let txObject = org_createTxObject.apply(oContract, arguments);

      //Over-ride the send method of txObject.
      let org_send = txObject.send;
      if (!org_send) {
        return txObject;
      }

      txObject.send = function(options, callback) {
        let oTxObject = this;

        //Check if signerService is available.
        let signerInteract = oWeb3.signerServiceInteract();
        if (!signerInteract) {
          console.log('signerInteract not found');
          //Lets execute the original send method.
          return org_send.apply(oTxObject, arguments);
        }

        //Lets Prepare Transaction Data to be signed.
        let requestData = oTxObject.send.request(options),
          txToBeSigned = Object.assign({}, requestData.params[0]);

        return oWeb3._signAndSendTx(txToBeSigned, callback);
      };

      //Copy over all org_send methods to new send methods.
      Object.assign(txObject.send, org_send);

      return txObject;
    };

    Contract.prototype._createTxObject._isOst = true;
  };

  OpenSTWeb3Prototype._bindSignerToSendTransaction = function() {
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
      return oWeb3._signAndSendTx(txToBeSigned, callback);
    };
    oWeb3.eth.sendTransaction._isOst = true;
  };
};
