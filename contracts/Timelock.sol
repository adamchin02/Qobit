pragma solidity 0.4.24;

interface IERC20 {
    function transfer(address _to, uint256 _value) external returns (bool success);
    function balanceOf(address _owner) external view returns (uint256 balance);
}

contract Timelock {
    IERC20 private _token;
    address private _beneficiary;
    uint256 private _releaseTime;

    event TokenReleased(address beneficiary, uint256 amount);

    constructor(
        address token,
        address beneficiary,
        uint256 releaseTime
    ) public {
        require(releaseTime > block.timestamp);
        require(beneficiary != 0x0);
        _token = IERC20(token);
        _beneficiary = beneficiary;
        _releaseTime = releaseTime;
    }

    function release() public {
        require(block.timestamp >= _releaseTime);
        uint256 amount = _token.balanceOf(address(this));
        require(amount > 0);
        _token.transfer(_beneficiary, amount);
        emit TokenReleased(_beneficiary, amount);
    }

    
    function token() public view returns(IERC20) {
        return _token;
    }

    function beneficiary() public view returns(address) {
        return _beneficiary;
    }

    function releaseTime() public view returns(uint256) {
        return _releaseTime;
    }
}
