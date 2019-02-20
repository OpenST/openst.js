'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const Recovery = require('../../lib/ContractInteract/Recovery');
const AssertAsync = require('../../utils/AssertAsync');
const Utils = require('../../utils/Utils');

describe('Recovery.abortRecoveryByController()', () => {
  let recovery;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const recoveryAddress = '0x0000000000000000000000000000000000000002';
    recovery = new Recovery(web3, recoveryAddress);
  });

  it('should pass with correct params', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';

    const mockRawTx = 'mockRawTx';

    const rawTx = sinon.replace(recovery, 'abortRecoveryByControllerRawTx', sinon.fake.resolves(mockRawTx));

    const spySendTransaction = sinon.replace(Utils, 'sendTransaction', sinon.fake.resolves(true));
    const txOptions = {
      from: '0x0000000000000000000000000000000000000006'
    };

    const response = await recovery.abortRecoveryByController(prevOwner, oldOwner, newOwner, txOptions);
    assert.isTrue(response, 'abortRecoveryByController should return true');
    Spy.assert(rawTx, 1, [[prevOwner, oldOwner, newOwner]]);
    Spy.assert(spySendTransaction, 1, [[mockRawTx, txOptions]]);
    sinon.restore();
  });

  it('should throw an error when transaction options is undefined', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';
    const txOptions = undefined;

    await AssertAsync.reject(
      recovery.abortRecoveryByController(prevOwner, oldOwner, newOwner, txOptions),
      'Invalid transaction options: undefined.'
    );
  });

  it('should throw an error when account address is undefined', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';
    const txOptions = {};
    await AssertAsync.reject(
      recovery.abortRecoveryByController(prevOwner, oldOwner, newOwner, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`
    );
  });

  it('should throw an error when account address is invalid', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';
    const txOptions = {
      from: '0x123'
    };
    await AssertAsync.reject(
      recovery.abortRecoveryByController(prevOwner, oldOwner, newOwner, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`
    );
  });
});
