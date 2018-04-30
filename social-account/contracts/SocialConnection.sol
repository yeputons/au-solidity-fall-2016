pragma solidity ^0.4.21;

import "./SocialAccount.sol";

contract SocialConnection {
    enum Status { PROPOSED, ACCEPTED, CANCELLED }

    SocialAccount public initiator;
    SocialAccount public acceptor;
    Status public status;

    constructor(SocialAccount _acceptor) public {
        require(msg.sender != address(_acceptor));
        initiator = SocialAccount(msg.sender);
        acceptor = _acceptor;
        status = Status.PROPOSED;
    }

    function accept() public {
        require(msg.sender == address(acceptor));
        require(status <= Status.ACCEPTED);
        status = Status.ACCEPTED;
    }

    function cancel() public {
        require(msg.sender == address(initiator) || msg.sender == address(acceptor));
        // Do not notify either contract because external call may fail, thus
        // blocking friendship cancellation, which is no good.
        // "Favor pull over push".
        status = Status.CANCELLED;
    }
}
