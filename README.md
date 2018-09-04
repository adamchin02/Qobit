# qobit-token-contract

## ERC20

Token is ERC20 based

## Etherscan

[0x1f08c3f43b3b6481989bfd13288ffe054c451634](https://etherscan.io/address/0x1f08c3f43b3b6481989bfd13288ffe054c451634)

## Installation

1. Install [Yarn](https://yarnpkg.com)
2. Run "yarn install"

## Run Test

```bash
yarn run ganache-cli
yarn truffle compile
yarn truffle test
```

## Airdrop.sol

1. To deploy the airdrop contract, you need to fill in a parameter, which is the contract address of the ERC20 Token.
2. After the deployment is completed, transfer some ERC20 Token to the airdrop contract.
3. Call the contract's sendCandy method to distribute candy. Note that the sendCandy method has two parameters, one is an address array, one is a numeric array, the first parameter indicates the address to be issued, the second parameter indicates the quantity to be issued, and the array length of the two parameters must be the same. It should also be noted that the address in the address parameter must be enclosed in double quotes, and the number in the quantity array starts from the smallest unit, that is, if there are 8 digits after the decimal point, it means 1 The back needs to be followed by 8 zeros. Example: ["0x6C8dc...", "0x1df211..."], [1000000000,20000000000]

## Timelock.sol

1. Deploy the timelock contract. There are three parameters, the address of the ERC20 Token, the address of the beneficiary and the lock time. The lock time is a Unix time in seconds. For example, "1535963381", this time must be greater than the current time, I suggest it should be at least 3 minutes.
2. Transfer the number of Tokens you want to lock to this timelock contract address. Note that this Token must be the same as the token you filled in the previous step (that is, the Token contract address is the same).
3. Any call to the contract release method will get the wrong result before the lock time is reached.