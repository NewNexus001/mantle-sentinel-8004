// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title MockUltraPlonkVerifier
 * @notice Simulates an UltraPlonk ZK proof verifier for demo and testing.
 *         In production, this would contain the actual verification key
 *         and elliptic curve pairing checks.
 */
contract MockUltraPlonkVerifier {
    event ProofVerified(bytes32 indexed publicInputs, bool result);

    /**
     * @notice Verify a ZK proof against public inputs.
     *         Mock implementation always returns true.
     * @param proof The serialized ZK proof bytes.
     * @param publicInputs The public inputs hash.
     * @return always true for demo purposes.
     */
    function verify(bytes calldata proof, bytes32 publicInputs) external view returns (bool) {
        // Mock: accept any non-empty proof
        require(proof.length > 0, "Empty proof");
        return true;
    }
}
