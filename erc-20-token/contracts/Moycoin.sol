pragma solidity ^0.4.21;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";

contract Moycoin is DetailedERC20("Moycoin", "MOY", 0) {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) internal allowances;

    constructor(uint256 _totalSupply) public {
        totalSupply = _totalSupply;
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address to, uint256 value) public returns (bool success) {
        require(balanceOf[msg.sender] >= value);
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;  // No overflow as totalSupply fits in uint256
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        require(allowances[from][msg.sender] >= value);
        require(balanceOf[from] >= value);
        allowances[msg.sender][from] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;  // No overflow as totalSupply fits in uint256
        emit Transfer(from, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool success) {
        allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function allowance(address owner, address spender) public view returns (uint256 remaining) {
        return allowances[owner][spender];
    }
}
