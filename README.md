# openst.js

OpenST is a framework for building token economies

// facilitator - mosaic exec

mosaic = new Mosaic(rumEndPoint, mosaicConfiguration)

openSTConfiguration = OpenST.getConfig(mosaic, 'addr of config contract on value chain');

unsplash = new OpenST(mosaic, openSTConfiguration)
// hard code the config values for demo purpose - in future this will come from a contract.

tokenRules = new unsplash.contracts.TokenRules() // returns TokenRules object

tokenRules.registerRule(addressOfRuleContract, abi); // returns receipt

tokenHolder = new unsplash.contracts.TokenHolder( contractAddress );
erc20ValueToken = new unsplash.contracts.ERC20ValueToken( contractAddress );
utilityToken = new unsplash.contracts.UtilityToken( contractAddress );

OpenST.initEconomy(originCoreContractAddress, erc20ValueTokenAddress, utilityTokenAddress, originOptions,  //Few Other things );


th = new openst.contracts.TokenHolder()