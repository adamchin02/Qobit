var Qobit = artifacts.require("./Qobit.sol");

module.exports = function(deployer) {
  return deployer.deploy(Qobit);
};
