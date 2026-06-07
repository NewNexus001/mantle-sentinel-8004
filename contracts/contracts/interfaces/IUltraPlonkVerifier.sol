// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IUltraPlonkVerifier {
    function verify(bytes calldata proof, bytes32 publicInputs) external view returns (bool);
}
