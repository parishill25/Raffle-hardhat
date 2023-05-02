const { ethers } = require("hardhat")


const networkConfig={

    11155111:{
        name:"sepolia",
        vrfCoordinatorV2:"0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        entranceFee:ethers.utils.parseEther("10"),
        gasLane:"0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        subscriptionId:"1642",
        callbackGasLimit:"500000",
        interval:"30"
     },
    31337:{
        name:"hardhat",
        entranceFee:ethers.utils.parseEther("10"),
        gasLane:"0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit:"500000",
        interval:"30"
    
    }

}

const developmentChains=["hardhat","localhost"]

const Base_Fee= ethers.utils.parseEther("0.25")
const GAS_PRICE_LINK=1e9

module.exports={networkConfig,Base_Fee,GAS_PRICE_LINK,developmentChains}