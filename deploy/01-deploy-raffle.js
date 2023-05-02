const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const{verify}= require("../utils/verify.js")

const SUB_FUND_AMOUNT=ethers.utils.parseEther("1")
module.exports=async({deployments,getNameAccounts})=>{
    const {log,deploy}= deployments
    const {deployer}=await getNamedAccounts()
    const chainId= network.config.chainId
    let vrfCoordinatorV2Address,subscriptionId
    if(developmentChains.includes(network.name)){
        const vrfCoordinatorV2Mock= await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address= vrfCoordinatorV2Mock.address 
        const txResponse= await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt= await txResponse.wait(1)
        subscriptionId=txReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId,SUB_FUND_AMOUNT)
    }else {
        vrfCoordinatorV2Address=networkConfig[chainId]["vrfCoordinatorV2"]
         subscriptionId=networkConfig[chainId]["subscriptionId"]
    }

const entranceFee= networkConfig[chainId]["entranceFee"]
const gasLane=networkConfig[chainId]["gasLane"]
const callbackGasLimit=networkConfig[chainId]["callbackGasLimit"]
const interval=networkConfig[chainId]["interval"]


const args=[vrfCoordinatorV2Address,entranceFee,gasLane,subscriptionId,callbackGasLimit,interval]
console.log(args)
const Raffle= await deploy("Raffle",{
    from:deployer,
    args:args,
    log:true,
    waitConfirmations:network.config.blockCofirmations||1,
})

console.log("Raffle deployed")

if(!developmentChains.includes(network.name)&& process.env.ETHERSCAN_KEY){
    log("Verifying.......................")
    await verify(Raffle.address,args)
}
log("-----------------------------------------------------")
}

module.exports.tags=["all","Raffle"]