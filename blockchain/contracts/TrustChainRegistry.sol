// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TrustChainRegistry {
    string public systemName = "TrustChain AI";

    function getSystemName()
        external
        view
        returns (string memory)
    {
        return systemName;
    }
}