// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IERC8004 {
    event AgentRegistered(uint256 indexed agentId, string metadataURI, address indexed owner);
    event ReputationUpdated(uint256 indexed agentId, uint8 score, bytes32 validationHash);
    event ValidationLogged(uint256 indexed agentId, bytes32 indexed taskHash, bool success);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    struct AgentProfile {
        string metadataURI;
        uint8 reputationScore;
        bool isActive;
        address owner;
    }

    function getAgent(uint256 agentId) external view returns (AgentProfile memory);
    function getReputation(uint256 agentId) external view returns (uint8);
}

contract MantleSentinel8004Registry is IERC8004 {
    string public constant name = "Mantle Sentinel-8004 Agent Token";
    string public constant symbol = "MSAT";
    uint256 private _totalAgents;
    address public contractOwner;

    mapping(uint256 => AgentProfile) private _agents;
    mapping(uint256 => address) private _tokenOwners;
    mapping(address => bool) public authorizedReputationUpdaters;
    mapping(address => bool) private _registeredAddresses;

    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Sender must be contract owner");
        _;
    }

    modifier onlyAuthorizedUpdater() {
        require(authorizedReputationUpdaters[msg.sender], "Not authorized to modify reputation");
        _;
    }

    constructor() {
        contractOwner = msg.sender;
        authorizedReputationUpdaters[msg.sender] = true;
    }

    function registerAgent(string calldata metadataURI) external returns (uint256) {
        require(msg.sender != address(0), "Zero address cannot register");
        require(!_registeredAddresses[msg.sender], "Address already registered");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");

        _totalAgents++;
        uint256 newAgentId = _totalAgents;
        _tokenOwners[newAgentId] = msg.sender;
        _registeredAddresses[msg.sender] = true;
        _agents[newAgentId] = AgentProfile({
            metadataURI: metadataURI,
            reputationScore: 100,
            isActive: true,
            owner: msg.sender
        });
        emit AgentRegistered(newAgentId, metadataURI, msg.sender);
        return newAgentId;
    }

    function updateReputation(uint256 agentId, uint8 newScore, bytes32 validationHash) external onlyAuthorizedUpdater {
        require(agentId > 0 && agentId <= _totalAgents, "Agent does not exist");
        require(_agents[agentId].isActive, "Target agent is inactive");
        require(newScore <= 100, "Reputation score upper-bound is 100");
        _agents[agentId].reputationScore = newScore;
        emit ReputationUpdated(agentId, newScore, validationHash);
    }

    function logValidation(uint256 agentId, bytes32 taskHash, bool success) external onlyAuthorizedUpdater {
        require(agentId > 0 && agentId <= _totalAgents, "Agent does not exist");
        emit ValidationLogged(agentId, taskHash, success);
    }

    function getAgent(uint256 agentId) external view override returns (AgentProfile memory) {
        return _agents[agentId];
    }

    function getReputation(uint256 agentId) external view override returns (uint8) {
        return _agents[agentId].reputationScore;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _tokenOwners[tokenId];
        require(owner != address(0), "Query for nonexistent token");
        return owner;
    }

    function setAuthorizedUpdater(address updater, bool status) external onlyContractOwner {
        require(updater != address(0), "Zero address not allowed");
        authorizedReputationUpdaters[updater] = status;
    }

    function transferOwnership(address newOwner) external onlyContractOwner {
        require(newOwner != address(0), "Zero address not allowed");
        emit OwnershipTransferred(contractOwner, newOwner);
        contractOwner = newOwner;
    }

    function totalSupply() external view returns (uint256) {
        return _totalAgents;
    }
}
