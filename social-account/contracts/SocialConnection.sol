pragma solidity ^0.4.21;

import "./SocialAccount.sol";

contract SocialConnection {
    SocialAccount public initiator;
    SocialAccount public acceptor;
    bool public accepted;

    constructor(SocialAccount _acceptor) public {
        require(msg.sender != address(_acceptor));
        initiator = SocialAccount(msg.sender);
        acceptor = _acceptor;
        accepted = false;
    }

    function accept() public {
        require(msg.sender == address(acceptor));
        accepted = true;
    }

    function cancel() public {
        require(msg.sender == address(initiator) || msg.sender == address(acceptor));
        // Do not notify either contract because external call may fail, thus
        // blocking friendship cancellation, which is no good.
        // "Favor pull over push".
        selfdestruct(msg.sender);
    }
}
