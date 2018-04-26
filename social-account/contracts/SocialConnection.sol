pragma solidity ^0.4.21;

import "./SocialAccount.sol";

contract SocialConnection {
    SocialAccount public initiator;
    SocialAccount public acceptor;
    bool public accepted;

    constructor(SocialAccount _initiator, SocialAccount _acceptor) public {
        require(msg.sender == _initiator.owner());
        require(_initiator != _acceptor);
        initiator = _initiator;
        acceptor = _acceptor;
        accepted = false;
    }

    function accept() public {
        require(msg.sender == acceptor.owner());
        accepted = true;
    }

    function cancel() public {
        require(msg.sender == initiator.owner() || msg.sender == acceptor.owner());
        selfdestruct(msg.sender);
    }
}
