const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config.js")
const { assert, expect } = require("chai")
const { networkConfig } = require("../../helper-hardhat-config")


developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle staging test", function () {
          let raffle, raffleEntranceFee, deployer, interval
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
          })

          describe("fulfillRandomWords", function () {
              it("works with Chainlink keepers and ChainLink VRF, we get random winner", async function () {
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()
                  console.log("Setting up  the listener")
                  // Setting up Listener before entering the lottery
                  await new Promise (async (resolve, reject) => {
                     console.log("calling event")
                      raffle.once("RaffleWinners",async()=>{
                        console.log("WinnerPicked event fired ")
                            try {
                              const winner = await raffle.getWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()
                              console.log("entering the lottery")
                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(winner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance
                                      .add(raffleEntranceFee)
                                      .toString()
                              )
                            assert(endingTimeStamp > startingTimeStamp)
                            resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                          // Entering the Lottery
                          const txResponse=await raffle.enterRaffle({value:raffleEntranceFee})
                          const txReceipt= await txResponse.wait(1)
                        const winnerStartingBalance = await accounts[0].getBalance()
                      })
                  })
              })
          })
      })
