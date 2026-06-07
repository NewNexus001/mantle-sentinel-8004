// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./interfaces/IUltraPlonkVerifier.sol";
import "./MantleSentinel8004Registry.sol";
import "./SentinelKeyRegistry.sol";

contract AutomatedRemediationRegistry {
    IUltraPlonkVerifier public immutable proofVerifier;
    MantleSentinel8004Registry public immutable identityRegistry;
    SentinelKeyRegistry public immutable keyRegistry;
    uint8 public constant CRITICAL_REPUTATION_LIMIT = 80;
    mapping(bytes32 => bool) public executionNullifiers;

    struct RemediationPayload {
        address targetPool;
        bytes callData;
        uint256 nonce;
    }

    event RemediationExecuted(uint256 indexed agentId, address indexed targetPool, bytes4 selector, bytes32 executionHash);
    event RemediationGriefed(uint256 indexed agentId, string reason);

    constructor(address _proofVerifier, address _identityRegistry, address _keyRegistry) {
        require(_proofVerifier != address(0) && _identityRegistry != address(0) && _keyRegistry != address(0), "Zero address construction protection");
        proofVerifier = IUltraPlonkVerifier(_proofVerifier);
        identityRegistry = MantleSentinel8004Registry(_identityRegistry);
        keyRegistry = SentinelKeyRegistry(_keyRegistry);
    }

    function executeRemediation(
        uint256 agentId,
        bytes calldata proof,
        bytes32 publicInputs,
        RemediationPayload calldata payload,
        bytes calldata ephemeralSignature
    ) external {
        address activeOperationalKey = keyRegistry.agentOperationalKeys(agentId);
        if (activeOperationalKey == address(0)) {
            emit RemediationGriefed(agentId, "No active key mapping state detected");
            return;
        }

        bytes32 executionHash = keccak256(abi.encode(payload.targetPool, keccak256(payload.callData), payload.nonce, block.chainid));
        require(!executionNullifiers[executionHash], "Atomic loop execution payload already nullified");

        address signer = keyRegistry.recoverSigner(executionHash, ephemeralSignature);
        require(signer == activeOperationalKey, "Invalid ephemeral proxy signature vector");

        uint8 currentReputation = identityRegistry.getReputation(agentId);
        require(currentReputation >= CRITICAL_REPUTATION_LIMIT, "Agent identity metrics fall below compliance thresholds");

        require(publicInputs == keccak256(abi.encode(payload.targetPool, executionHash)), "ZK public mapping variable deviation");
        require(proofVerifier.verify(proof, publicInputs), "Zero-Knowledge constraint validity evaluation failed");

        // Checks-Effects-Interactions: Enforce nullification modification BEFORE executing target interactions
        executionNullifiers[executionHash] = true;

        // Try/Catch wrapping of external identity log tracking to guarantee remediation logic cannot be bricked post-proof verification
        try identityRegistry.logValidation(agentId, executionHash, true) {} catch {
            emit RemediationGriefed(agentId, "On-chain reputation metrics tracking execution reverted gracefully");
        }

        // Low-level high-velocity call forwarding matching exact gas allocation standards
        require(gasleft() > 5000, "Insufficient gas for target execution");
        (bool success, bytes memory returnData) = payload.targetPool.call{gas: gasleft() - 5000}(payload.callData);
        if (!success) {
            if (returnData.length > 0) {
                assembly {
                    let returndata_size := mload(returnData)
                    revert(add(32, returnData), returndata_size)
                }
            } else {
                revert("Target execution environment threw an unhandled silent error state");
            }
        }

        bytes4 selector = bytes4(0);
        if (payload.callData.length >= 4) {
            selector = bytes4(payload.callData[0:4]);
        }

        emit RemediationExecuted(agentId, payload.targetPool, selector, executionHash);
    }
}
