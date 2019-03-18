'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const PricerRule = require('../../../lib/ContractInteract/PricerRule');
const AssertAsync = require('../../../utils/AssertAsync');

describe('PricerRule.addPriceOracleRawTx()', () => {
  let pricerRule;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const address = '0x0000000000000000000000000000000000000002';
    pricerRule = new PricerRule(web3, address);
  });

  it('should return correct raw tx', async () => {
    const mockTx = 'mockTx';

    const spyRawTx = sinon.replace(pricerRule.contract.methods, 'addPriceOracle', sinon.fake.resolves(mockTx));

    const priceOracleAddress = '0x0000000000000000000000000000000000000003';

    const response = await pricerRule.addPriceOracleRawTx(priceOracleAddress);

    assert.strictEqual(response, mockTx, 'It must return correct raw tx');

    Spy.assert(spyRawTx, 1, [[priceOracleAddress]]);
    sinon.restore();
  });

  it('should throw an error when priceOracleAddress is invalid', async () => {
    const priceOracleAddress = undefined;

    await AssertAsync.reject(
      pricerRule.addPriceOracleRawTx(priceOracleAddress),
      `Mandatory Parameter 'priceOracleAddress' is missing or invalid: ${priceOracleAddress}.`
    );
  });
});
