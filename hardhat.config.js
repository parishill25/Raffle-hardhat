require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

ALCHEMY_URL=process.env.ALCHEMY_URL
PRIVATE_KEY=process.env.PRIVATE_KEY
ETHERSCAN_KEY=process.env.ETHERSCAN_KEY


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {

  defaultNetwork:"hardhat",
networks:{
hardhat:{
  chainId:31337,
  blockConfirmations:1
},

  sepolia:{
    url:ALCHEMY_URL,
    accounts:[PRIVATE_KEY],
    chainId:11155111,
    blockConfirmations:6
  }
 },

etherscan:{
  apiKey:{
    sepolia:ETHERSCAN_KEY
  }
 
},

gasReporter:{

},
 
  solidity: {
    compilers:[
      {version:"0.8.7"},{version:"0.6.6"}
    ]
  },

  namedAccounts: {
    deployer: {
        default: 0,
    },
    user:{
      default:1,
    }
},
mocha:{
  timeout:500000,
}

}
