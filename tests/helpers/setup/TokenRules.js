const chai = require('chai'),
  Web3 = require('web3');

const TokenRules = require('../../../lib/helpers/setup/TokenRules'),
  config = require('../../utils/configReader'),
  Web3WalletHelper = require('../../utils/Web3WalletHelper'),
  AbiBinProvider = require('../../../lib/helpers/AbiBinProvider');

const web3 = new Web3(config.gethRpcEndPoint),
  web3WalletHelper = new Web3WalletHelper(web3),
  abiBinProvider = new AbiBinProvider(),
  assert = chai.assert;

describe('TokenRules', async function() {

  let options = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice,
    gas: '8000000'
  };

  before(function () {
    this.timeout(3 * 60000);
    //This hook could take long time.
    return web3WalletHelper
      .init(web3)
      .then(function (_out) {

        wallets = web3WalletHelper.web3Object.eth.accounts.wallet;

        return _out;
      });
  });

  it('Should deploy TokenRules contract', async function() {
    this.timeout(3 * 60000);

    const mockToken = wallets[2].address,
      mockOrganization = wallets[1].address;
    const tokenRules = new TokenRules(web3, '');

    const response = await tokenRules.deploy(mockOrganization, mockToken, options, web3);
    let jsonInterface = abiBinProvider.getABI('TokenRules');
    let contract = new web3.eth.Contract(jsonInterface, response.contractAddress, options);

    // Verifying stored organization and token address.
    assert.strictEqual(mockToken, await contract.methods.token().call(), "Token address is incorrect");
    assert.strictEqual(mockOrganization, await contract.methods.organization().call(), "Organization address is incorrect");

  });


});