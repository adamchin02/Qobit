var Qobit = artifacts.require("./Qobit.sol");
var Airdrop = artifacts.require("./Airdrop.sol");

module.exports = function(deployer) {
  return deployer.deploy(Qobit).then(function() {
    return deployer.deploy(Airdrop, Qobit.address);
  });
};
