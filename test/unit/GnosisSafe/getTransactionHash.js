'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const AssertAsync = require('../../../utils/AssertAsync');
const GnosisSafe = require('../../../lib/ContractInteract/GnosisSafe');

describe('GnosisSafe.getTransactionHash()', () => {
  let gnosisSafe;

  beforeEach(() => {
    const web3 = new Web3();
    const gnosisAddress = '0x0000000000000000000000000000000000000002';
    gnosisSafe = new GnosisSafe(web3, gnosisAddress);
  });

  it('should construct with correct parameters', async () => {
    const to = '0x0000000000000000000000000000000000000003';
    const value = null;
    const data = null;
    const operation = 0;
    const safeTxGas = 0;
    const dataGas = 0;
    const gasPrice = 0;
    const gasToken = '0x0000000000000000000000000000000000000004';
    const refundReceiver = '0x0000000000000000000000000000000000000005';
    const nonce = 1;

    const mockGetTransactionHash = true;
    const getTransactionHashSpy = sinon.replace(
      gnosisSafe.contract.methods,
      'getTransactionHash',
      sinon.fake.returns({
        call: () => Promise.resolve(mockGetTransactionHash)
      })
    );
    const response = await gnosisSafe.getTransactionHash(
      to,
      value,
      data,
      operation,
      safeTxGas,
      dataGas,
      gasPrice,
      gasToken,
      refundReceiver,
      nonce
    );

    assert.strictEqual(response, mockGetTransactionHash);
    Spy.assert(getTransactionHashSpy, 1, [
      [to, value, data, operation, safeTxGas, dataGas, gasPrice, gasToken, refundReceiver, nonce]
    ]);
  });

  it('should throw an error when to address is undefined', async () => {
    const to = undefined;
    const value = null;
    const data = null;
    const operation = 0;
    const safeTxGas = 0;
    const dataGas = 0;
    const gasPrice = 0;
    const gasToken = '0x0000000000000000000000000000000000000004';
    const refundReceiver = '0x0000000000000000000000000000000000000005';
    const nonce = 1;
    await AssertAsync.reject(
      gnosisSafe.getTransactionHash(
        to,
        value,
        data,
        operation,
        safeTxGas,
        dataGas,
        gasPrice,
        gasToken,
        refundReceiver,
        nonce
      ),
      `Mandatory Parameter 'to' is missing or invalid: undefined.`
    );
  });
});
