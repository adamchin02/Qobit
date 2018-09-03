var Airdrop = artifacts.require('./Airdrop.sol')
var Qobit = artifacts.require('./Qobit.sol')

///
/// attention to the test order, don't disturb the order if u don't know what it means.
///
contract('Airdrop', async(accounts) => {
    it("test send candy not enought token", async() => {
        let owner = accounts[0]
        let user8 = accounts[8] // do not user account[0...7], or else other test will fail

        let airdrop = await Airdrop.deployed()

        // trasfer token to this contract

        let receipts = []
        let values = []
        await receipts.push(user8)
        await values.push(100)
        // send candy
        await expectThrow(airdrop.sendCandy(receipts, values, {from: owner}))
    })

    it("test array length not match", async() => {
        let owner = accounts[0]
        let user8 = accounts[8] // do not user account[0...7], or else other test will fail

        let airdrop = await Airdrop.deployed()
        let qobit = await Qobit.deployed()

        // trasfer Qobit to this contract
        await qobit.transfer(airdrop.address, 5000, {from: owner})

        let receipts = []
        let values = []
        await receipts.push(user8) // 1
        
        await values.push(100)
        await values.push(300) // 2
        // send candy
        await expectThrow(airdrop.sendCandy(receipts, values, {from: owner}))
    })

    it("test send candy", async() => {
        let owner = accounts[0]
        let user8 = accounts[8] // do not user account[0...7], or else other test will fail
        let user9 = accounts[9]

        let airdrop = await Airdrop.deployed()
        let qobit = await Qobit.deployed()

        // trasfer Qobit to this contract
        await qobit.transfer(airdrop.address, 5000, {from: owner})

        let receipts = []
        let values = []

        await receipts.push(user8)
        await receipts.push(user9)

        await values.push(100)
        await values.push(1000)
        
        // send candy
        let result = await airdrop.sendCandy(receipts, values, {from: owner})
        let balanceOfUser8 = await qobit.balanceOf.call(user8, {from: user8})
        assert.equal(100, balanceOfUser8.toNumber(), "candy not sent")
    })
})


var expectThrow = async promise => {
    try {
      await promise
    } catch (error) {
      const invalidOpcode = error.message.search('invalid opcode') >= 0
      const outOfGas = error.message.search('out of gas') >= 0
      const revert = error.message.search('revert') >= 0
      assert(
        invalidOpcode || outOfGas || revert,
        'Expected throw, got \'' + error + '\' instead',
      )
      return
    }
    assert.fail('Expected throw not received')
  };