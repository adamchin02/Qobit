var Qobit = artifacts.require('./Qobit.sol')
var BigNumber = require('bignumber.js');


contract('Qobit', async(accounts) => {

    let totalSupply_ = 15 * (10 ** 8) * (10 ** 8)

    it("test create", async() => {
        let instance = await Qobit.deployed()
        let balance = await instance.balanceOf.call(accounts[0])
        assert.equal(totalSupply_, balance.toNumber(), "1B wasn't in the first account")
    })

    it("test transfer", async() => {
        let owner = accounts[0]
        let user1 = accounts[1]
        let user2 = accounts[2]

        let instance = await Qobit.deployed()
        let ownerBalance = await instance.balanceOf.call(owner)
        let user1Balance = await instance.balanceOf.call(user1)
        let user2Balance = await instance.balanceOf.call(user2)

        let amount = 1000

        await instance.transfer(user1, amount, {from: owner}) // owner - 1000
        await instance.transfer(user2, amount, {from: owner}) // owner - 1000

        let user1BalanceEnd = await instance.balanceOf.call(user1)
        let user2BalanceEnd = await instance.balanceOf.call(user2)
        let ownerBalanceEnd = await instance.balanceOf.call(owner)
        
        assert.equal(user1Balance.toNumber(), 0, "User 1 balance wasn't correctly")
        assert.equal(user2Balance.toNumber(), 0, "User 2 balance wasn't correctly")
        assert.equal(user1BalanceEnd.toNumber(), amount, "User 1 balance wasn't correctly")
        assert.equal(user2BalanceEnd.toNumber(), amount, "User 2 balance wasn't correctly")
        assert.equal(ownerBalanceEnd.toNumber(), ownerBalance.toNumber() - 2 * amount, "User 2 balance wasn't correctly")
    })

    it("test transfer overflow", async() => {
        let owner = accounts[0]
        let user3 = accounts[3]

        let instance = await Qobit.deployed()

        let ownerBalance = await instance.balanceOf.call(owner)
        let user3Balance = await instance.balanceOf.call(user3)
        assert.equal(user3Balance.toNumber(), 0, "User 3 balance wasn't correctly")

        
        await expectThrow(instance.transfer(user3, 2 ** 256 , {from: owner}))
        await expectThrow(instance.transfer(user3, 2 ** 256 - 1 , {from: owner}))
        await expectThrow(instance.transfer(owner, -1, {from: user3}))
        await expectThrow(instance.transfer(owner, 1, {from: user3}))
    })

    it("test approve and transfer from", async() => {
        let owner = accounts[0]
        let user1 = accounts[1]
        let user2 = accounts[2]
        let user5 = accounts[5]

        let instance = await Qobit.deployed()

        let ownerBalance = await instance.balanceOf.call(owner)
        let user1Balance = await instance.balanceOf.call(user1)
        let user5Balance = await instance.balanceOf.call(user5)

        
        await expectThrow(instance.transferFrom(user1, user5, 500))
        
        await instance.approve(user5, 500, {from: user1})
        let user5Allowed = await instance.allowance.call(user1, user5)
        assert.equal(user5Allowed.toNumber(), 500, "test allowed fail")
        // todo test transfer from

        await expectThrow(instance.transferFrom(user1, user5, -1, {from: user1}))
        await expectThrow(instance.transferFrom(user1, user5, 501, {from: user1}))
        await expectThrow(instance.transferFrom(user1, user5, 501, {from: user2}))
        await expectThrow(instance.transferFrom(user1, user5, 2 ** 32, {from: user1}))
        await expectThrow(instance.transferFrom(user5, user1, 2 ** 32, {from: user5}))

        await instance.transferFrom(user1, user5, 500, {from: user5})
        let user5BalanceEnd = await instance.balanceOf.call(user5)
        assert.equal(user5Balance.toNumber() + 500, user5BalanceEnd, "user 5 balance not ok")
    })

    it("test send ether to contract", async() => {
        let owner = accounts[0]
        let user1 = accounts[1]
        let instance = await Qobit.deployed()
        await expectThrow(instance.sendTransaction({value: 8 * 10**18, from: owner}))
        await expectThrow(instance.sendTransaction({value: 8 * 10**18, from: user1}))
    })

    it("test freeze & unfreeze", async() => {
        let owner = accounts[0]
        let user1 = accounts[1]
        let user2 = accounts[2]
        let user3 = accounts[3]
        let user4 = accounts[4]
        
        let instance = await Qobit.deployed()


        await instance.transfer(user1, 500, {from: owner}) // don't forget user1 allowed user5 500, user5 transfer from user1, so we fill it again.
        let user1Balance = await instance.balanceOf.call(user1)
        assert.equal(user1Balance.toNumber(), 1000, "User 1 balance wasn't correctly")

        await instance.freeze(user1, 500)

        let user1BalanceAfterFreeze = await instance.balanceOf.call(user1)
        assert.equal(user1BalanceAfterFreeze.toNumber(), 500, "User 1 balance wasn't correctly")

        let frozenOfUser1 = await instance.frozenOf.call(user1)
        assert.equal(frozenOfUser1.toNumber(), 500, "User 1 frozen balance wasn't correctly")

        await instance.unfreeze(user1, 250)
        let user1BalanceAfterUnfreezePart = await instance.balanceOf.call(user1)
        assert.equal(user1BalanceAfterUnfreezePart.toNumber(), user1BalanceAfterFreeze.toNumber() + 250, "User 1 balance wasn't correctly")

        let frozenOfUser1AfterUnfreezePart = await instance.frozenOf.call(user1)
        assert.equal(frozenOfUser1AfterUnfreezePart.toNumber(), 500 - 250, "User 1 frozen balance wasn't correctly")

        
        await expectThrow(instance.freeze(user2, 500, {from: user1}))
        await expectThrow(instance.freeze(user2, 1001, {from: owner}))
        await expectThrow(instance.freeze(user2, -1, {from: owner}))
        await expectThrow(instance.freeze(user2, 2 ** 32, {from: owner}))
        // test transfer over frozen
        await expectThrow(instance.transfer(user3, 751, {from: user1}))

        // test transfer ok
        let user3Balance1 = await instance.balanceOf.call(user3)
        assert.equal(user3Balance1.toNumber(), 0, "User 3 balance wasn't correctly")
        await instance.transfer(user3, 250 , {from: user1})
        let user3BalanceAfterTransfer = await instance.balanceOf.call(user3)
        assert.equal(user3BalanceAfterTransfer.toNumber(), 250, "User 3 balance wasn't correctly")
    })

    it("test pause & uppause", async() => {
        let owner = accounts[0]
        let notOwner = accounts[1]
        let richMan = accounts[8]
        let poorMan = accounts[9]

        let instance = await Qobit.deployed()
        let expectOwner = await instance.owner.call()
        assert.equal(expectOwner.valueOf(), owner, "Owner isn't correct")

        await instance.transfer(richMan, 10000, {from: owner})
        let richManBalance = await instance.balanceOf.call(richMan)
        assert.equal(richManBalance.toNumber() > 1, true, "Rich Man, ahh?")

        await expectThrow(instance.pause({from: notOwner})) // not owner
        await instance.pause({from: owner})
        await expectThrow(instance.transfer(poorMan, 1, {from: richMan})) // paused
        await expectThrow(instance.approve(poorMan, 1, {from: richMan})) // paused
        await expectThrow(instance.unpause({from: notOwner})) // not owner

        await instance.unpause({from: owner})
        await instance.transfer(poorMan, 1, {from: richMan}) // ok now
        await instance.approve(poorMan, 1, {from: richMan}) // ok now

        await instance.pause({from: owner})
        await expectThrow(instance.transferFrom(richMan, poorMan, 1, {from: richMan})) // paused
        await instance.unpause({from: owner})
        let poorManAllowd = await instance.allowance.call(richMan, poorMan)
        assert.equal(poorManAllowd.toNumber(), 1, "Poor Man, ahh?")
        await instance.transferFrom(richMan, poorMan, 1, {from: poorMan}) // ok now
    })

    it("test mint", async() => {
        let owner = accounts[0]
        let user1 = accounts[1]
        let amount = 1000

        let instance = await Qobit.deployed()
        let totalSupply = await instance.totalSupply.call()
        let ownerBalance = await instance.balanceOf.call(owner)
        await instance.mint(owner, amount)
        
        let totalSupplyAfterMint = await instance.totalSupply.call()
        let ownerBalanceAfterMint = await instance.balanceOf.call(owner)
        // assert total supply
        assert.equal(new BigNumber(totalSupplyAfterMint.toNumber()).minus(totalSupply.toNumber()).toNumber(), amount, "total supply not equal after mint")
        // assert owner amount
        assert.equal(new BigNumber(ownerBalanceAfterMint.toNumber()).minus(ownerBalance.toNumber()).toNumber(), amount, "owner balance not equal after mint")

        // test not owner
        await expectThrow(instance.mint(owner, amount, {from: user1}))

        // test mint to another addr
        let user1Balance = await instance.balanceOf.call(user1)
        await instance.mint(user1, amount, {from: owner})
        let user1BalanceAfterMint = await instance.balanceOf.call(user1)
        assert.equal(new BigNumber(user1BalanceAfterMint.toNumber()).minus(user1Balance).toNumber(), amount, "user1 balance not equal after mint")
    })

    it("test burn", async() => {
        let owner = accounts[0]
        let user1 = accounts[1]
        let amount = 1000

        let instance = await Qobit.deployed()
        let totalSupply = await instance.totalSupply.call()
        let ownerBalance = await instance.balanceOf.call(owner)
        await instance.burn(owner, amount)
        
        let totalSupplyAfterBurned = await instance.totalSupply.call()
        let ownerBalanceAfterBurned = await instance.balanceOf.call(owner)
        // assert total supply
        assert.equal(new BigNumber(totalSupply.toNumber()).minus(totalSupplyAfterBurned.toNumber()).toNumber(), amount, "total supply not equal after burned")
        // assert owner amount
        assert.equal(new BigNumber(ownerBalance.toNumber()).minus(ownerBalanceAfterBurned.toNumber()).toNumber(), amount, "owner balance not equal after burned")

        // test not owner
        await expectThrow(instance.burn(owner, amount, {from: user1}))

        // test mint to another addr
        let user1Balance = await instance.balanceOf.call(user1)
        await instance.burn(user1, amount, {from: owner})
        let user1BalanceAfterBurned = await instance.balanceOf.call(user1)
        assert.equal(new BigNumber(user1Balance.toNumber()).minus(user1BalanceAfterBurned.toNumber()).toNumber(), amount, "user1 balance not equal after burned")
    })    

    it("test transferOwnership", async() => {
        let owner = accounts[0]
        let newOwner = accounts[1]
        let instance = await Qobit.deployed()
        let expectOwner = await instance.owner.call()
        assert.equal(expectOwner.valueOf(), owner, "Owner isn't correct")
        await instance.transferOwnership(newOwner)
        let expectNewOwner = await instance.owner.call()
        assert.equal(expectNewOwner.valueOf(), newOwner, "Owner isn't correct")
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