const { network } = require("hardhat")
const { developmentChains,Base_Fee,GAS_PRICE_LINK } = require("../helper-hardhat-config")



module.exports=async({deployments,getNamedAccounts})=>{
    const {deploy,log}=deployments
    const{deployer}=await getNamedAccounts()
    const chainId=network.config.chainId

    let VRFCoordiatorV2Mock
    args=[Base_Fee,GAS_PRICE_LINK]
    if(developmentChains.includes(network.name)){
        log("Local network detected!deploying mocks..................")
        VRFCoordiatorV2Mock= await deploy("VRFCoordinatorV2Mock",{
            contract:VRFCoordiatorV2Mock,
            from:deployer,
            args:args,
            log:true
        })
    }
    log("Mocks deployed")
    log("--------------------------------------")
}

module.exports.tags=["all","mocks"]