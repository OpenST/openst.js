const os = require('os');

module.exports = {
  chain: {
    chainId: 1000,
    networkId: 1000,
    gethFolder: os.homedir() + '/openst-setup/origin-geth',
    allocAmount: '1000000000000000000000000000000000000000', // in base currency
    gasLimit: 4700000,
    gasprice: '0x12A05F200',
    genesisFileTemplatePath: './tools/genesis.json',
    genesisFilePath: os.homedir() + '/openst-setup/genesis.json',
    geth: {
      host: '127.0.0.1',
      rpcport: 8545,
      wsport: 8546,
      port: 3010
    }
  }
};
