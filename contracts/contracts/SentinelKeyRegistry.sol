// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract SentinelKeyRegistry {
    bytes32 public constant MAP_OPERATIONAL_KEY_TYPEHASH = keccak256("MapOperationalKey(uint256 agentId,address operationalKey,uint256 nonce,uint256 deadline)");
    bytes32 public immutable DOMAIN_SEPARATOR;
    IERC721 public immutable identityRegistry;

    mapping(uint256 => address) public agentOperationalKeys;
    mapping(address => uint256) public operationalKeyToAgent;
    mapping(uint256 => uint256) public nonces;

    event KeyMapped(uint256 indexed agentId, address indexed operationalKey);
    event KeyUnmapped(uint256 indexed agentId, address indexed operationalKey);

    constructor(address _identityRegistry) {
        require(_identityRegistry != address(0), "Invalid registry address");
        identityRegistry = IERC721(_identityRegistry);
        uint256 chainId;
        assembly { chainId := chainid() }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("SentinelKeyRegistry"),
                keccak256("1"),
                chainId,
                address(this)
            )
        );
    }

    function recoverSigner(bytes32 hash, bytes memory signature) public pure returns (address) {
        if (signature.length != 65) revert("Malformed signature length");
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) revert("Invalid signature s-value: anti-malleability bound triggered");
        if (v != 27 && v != 28) revert("Invalid signature v-value");
        address signer = ecrecover(hash, v, r, s);
        if (signer == address(0)) revert("Zero-address recovered");
        return signer;
    }

    function mapOperationalKey(uint256 agentId, address operationalKey, uint256 deadline, bytes calldata ownerSignature) external {
        require(block.timestamp <= deadline, "Operational mapping signature window closed");
        require(operationalKey != address(0), "Cannot bind to zero address");

        address owner = identityRegistry.ownerOf(agentId);
        bytes32 structHash = keccak256(abi.encode(MAP_OPERATIONAL_KEY_TYPEHASH, agentId, operationalKey, nonces[agentId], deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        address signer = recoverSigner(digest, ownerSignature);
        require(signer == owner, "Invalid signature: sender validation mismatch");

        address previousKey = agentOperationalKeys[agentId];
        if (previousKey != address(0)) {
            delete operationalKeyToAgent[previousKey];
            emit KeyUnmapped(agentId, previousKey);
        }

        nonces[agentId]++;
        agentOperationalKeys[agentId] = operationalKey;
        operationalKeyToAgent[operationalKey] = agentId;
        emit KeyMapped(agentId, operationalKey);
    }

    function unmapOperationalKey(uint256 agentId, bytes calldata ownerSignature) external {
        address owner = identityRegistry.ownerOf(agentId);
        address activeKey = agentOperationalKeys[agentId];
        require(activeKey != address(0), "No active operational key mapped");

        bytes32 hash = keccak256(abi.encodePacked(agentId, activeKey, nonces[agentId]));
        address signer = recoverSigner(hash, ownerSignature);
        require(signer == owner, "Unauthorized identity key removal invocation");

        nonces[agentId]++;
        delete operationalKeyToAgent[activeKey];
        delete agentOperationalKeys[agentId];
        emit KeyUnmapped(agentId, activeKey);
    }
}
