const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config.js")
const { assert, expect } = require("chai")
const { networkConfig } = require("../../helper-hardhat-config")
const { FunctionFragment } = require("ethers/lib/utils")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit tests", function () {
          let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval
          const chainId = network.config.chainId
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
          })

          describe("constructor", function () {
              it("initialize the constructor correctly", async function () {
                  const raffleState = await raffle.getRaffleState()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })

          describe("enterRaffle", function () {
              it("reverted when we don't have enough ETH", async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle_NOTENOUGHETHTOENTERRAFFLE"
                  )
              })
              it("Record player when they enter", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const player = await raffle.getPlayer(0)
                  assert.equal(player, deployer)
              })
              it("Emit enter event ", async function () {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffle,
                      "RaffleEnter"
                  )
              })
              it("don't allow entrance when raffle is calculating", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await ethers.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  //await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.performUpkeep([])
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      "Raffle__LotteryNotOPEN"
                  )
              })
          })
          describe("checkUpkeep", function () {
              it("it returns false if people doesn't send anny", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })
              it("returns false if raffle isn't Open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep([])
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert.equal(raffleState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
              it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 5])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                  assert(upkeepNeeded)
              })
          })

          describe("performUpkeep", function () {
              it("it cann only be run if checkUpkeep is true", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const tx = raffle.performUpkeep([])
                  assert(tx)
              })
              it("reverts when checkUpkeep is false", async function () {
                  await expect(raffle.performUpkeep([])).to.be.revertedWith(
                      "Raffle__NotUpKeepNeedeed"
                  )
              })

              it("up the raffleStates,emits and events,and calls the vrf coordinator", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const txResponse = await raffle.performUpkeep([])
                  const txReceipt = await txResponse.wait(1)
                  const requestId = txReceipt.events[1].args.requestId
                  const raffleState = await raffle.getRaffleState()
                  assert(requestId.toNumber() > 0)
                  assert(raffleState.toString() == 1)
              })
          })

          describe("fulfillRandomWords", function () {
              beforeEach(async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
              })

              it("can only be called after performupkeep", async () => {
                await expect(
                    vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address) 
                ).to.be.revertedWith("nonexistent request")
                await expect(
                    vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address) 
                ).to.be.revertedWith("nonexistent request")
            })

              it("picks a winner,reset a lottery and sends money", async function(){
                const additionalsEntrance=3
                const startingIndex=1
                const accounts= await ethers.getSigners()
                for(let i=startingIndex;i<startingIndex+additionalsEntrance;i++){
                    const accountsConnectedRaffle= await raffle.connect(accounts[i])
                    await accountsConnectedRaffle.enterRaffle({value:raffleEntranceFee})
                }
                const startingTimeStamp= await raffle.getLatestTimeStamp()
                await new Promise(async(resolve,reject)=>{
                    raffle.once("RaffleWinners",async ()=>{
                        console.log("Find the event")
                        try{
                            console.log(accounts[2].address)
                            console.log(accounts[0].address)
                            console.log(accounts[1].address)
                            console.log(accounts[3].address)
                            const winner= await raffle.getWinner()
                            const raffleState= await raffle.getRaffleState()
                            const endingTimeStamp= await raffle.getLatestTimeStamp()
                            const numPlayers= await raffle.getPlayersNumber()
                            const winnerEndingBalance= await accounts[1].getBalance()
                            assert.equal(
                                winnerEndingBalance .toString(), 
                                winnerStartingBalance 
                                    .add(
                                        raffleEntranceFee
                                            .mul(additionalsEntrance)
                                            .add(raffleEntranceFee)
                                    )
                                    .toString()
                            )
                            assert.equal(numPlayers.toString(),"0")
                            assert.equal(raffleState.toString(),"0")
                            assert (endingTimeStamp>startingTimeStamp)
                                console.log(winner)
                                resolve()
                        }catch(e){
                            reject(e)
                        }
                        
                    })
                     const txResponse= await raffle.performUpkeep([])
                    const txReceipt= await txResponse.wait(1)
                    const winnerStartingBalance= await accounts[1].getBalance()
                    await vrfCoordinatorV2Mock.fulfillRandomWords(txReceipt.events[1].args.requestId,raffle.address)
                })
              })
          })
      })
