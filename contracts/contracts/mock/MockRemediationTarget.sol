// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title MockRemediationTarget
 * @notice A minimal target contract for testing remediation calls.
 */
contract MockRemediationTarget {
    bool public paused;

    function pause() external {
        paused = true;
    }

    function togglePause() external {
        paused = !paused;
    }

    receive() external payable {}
}
