const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Mantle Sentinel-8004 Full System", function () {
  let identityRegistry, keyRegistry, verifier, remediationRegistry;
  let owner, agent1, attacker;

  beforeEach(async function () {
    [owner, agent1, attacker] = await ethers.getSigners();

    // Deploy MantleSentinel8004Registry
    const RegistryFactory = await ethers.getContractFactory("MantleSentinel8004Registry");
    identityRegistry = await RegistryFactory.deploy();
    await identityRegistry.waitForDeployment();

    // Deploy SentinelKeyRegistry
    const KeyRegistryFactory = await ethers.getContractFactory("SentinelKeyRegistry");
    keyRegistry = await KeyRegistryFactory.deploy(await identityRegistry.getAddress());
    await keyRegistry.waitForDeployment();

    // Deploy MockUltraPlonkVerifier
    const VerifierFactory = await ethers.getContractFactory("MockUltraPlonkVerifier");
    verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();

    // Deploy AutomatedRemediationRegistry
    const RemediationFactory = await ethers.getContractFactory("AutomatedRemediationRegistry");
    remediationRegistry = await RemediationFactory.deploy(
      await verifier.getAddress(),
      await identityRegistry.getAddress(),
      await keyRegistry.getAddress()
    );
    await remediationRegistry.waitForDeployment();

    // Authorize the remediation registry
    await identityRegistry.setAuthorizedUpdater(await remediationRegistry.getAddress(), true);
  });

  describe("MantleSentinel8004Registry", function () {
    it("should register an agent with initial reputation 100", async function () {
      await identityRegistry.registerAgent("ipfs://QmTest");
      const agent = await identityRegistry.getAgent(1);
      expect(agent.reputationScore).to.equal(100);
      expect(agent.isActive).to.be.true;
      expect(agent.metadataURI).to.equal("ipfs://QmTest");
    });

    it("should increment agent IDs", async function () {
      await identityRegistry.connect(owner).registerAgent("ipfs://Qm1");
      await identityRegistry.connect(agent1).registerAgent("ipfs://Qm2");
      expect(await identityRegistry.getReputation(1)).to.equal(100);
      expect(await identityRegistry.getReputation(2)).to.equal(100);
    });

    it("should update reputation via authorized updater", async function () {
      await identityRegistry.registerAgent("ipfs://QmTest");
      await identityRegistry.updateReputation(1, 85, ethers.keccak256(ethers.toUtf8Bytes("test")));
      expect(await identityRegistry.getReputation(1)).to.equal(85);
    });

    it("should revert reputation update from unauthorized address", async function () {
      await identityRegistry.registerAgent("ipfs://QmTest");
      await expect(
        identityRegistry.connect(agent1).updateReputation(1, 50, ethers.ZeroHash)
      ).to.be.revertedWith("Not authorized to modify reputation");
    });

    it("should return correct token owner", async function () {
      await identityRegistry.registerAgent("ipfs://QmTest");
      expect(await identityRegistry.ownerOf(1)).to.equal(owner.address);
    });
  });

  describe("SentinelKeyRegistry", function () {
    it("should recover signer from valid raw signature", async function () {
      const wallet = ethers.Wallet.createRandom();
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test-message"));
      const sig = wallet.signingKey.sign(hash);
      const signature = sig.r + sig.s.slice(2) + sig.v.toString(16);
      const recovered = await keyRegistry.recoverSigner(hash, signature);
      expect(recovered).to.equal(wallet.address);
    });

    it("should revert on invalid signature length", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await expect(
        keyRegistry.recoverSigner(hash, "0x1234")
      ).to.be.revertedWith("Malformed signature length");
    });

    it("should revert recovery on zero-address signer", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      const fakeSig = "0x" + "00".repeat(32) + "00".repeat(32) + "1b";
      await expect(
        keyRegistry.recoverSigner(hash, fakeSig)
      ).to.be.revertedWith("Zero-address recovered");
    });
  });

  describe("AutomatedRemediationRegistry", function () {
    beforeEach(async function () {
      await identityRegistry.registerAgent("ipfs://QmTest");
    });

    it("should have correct reputation limit", async function () {
      expect(await remediationRegistry.CRITICAL_REPUTATION_LIMIT()).to.equal(80);
    });

    it("should emit RemediationGriefed if no key is mapped", async function () {
      const payload = {
        targetPool: owner.address,
        callData: "0x",
        nonce: 0,
      };

      await expect(
        remediationRegistry.executeRemediation(
          1,
          "0x1234",
          ethers.ZeroHash,
          payload,
          "0x" + "00".repeat(65)
        )
      ).to.emit(remediationRegistry, "RemediationGriefed").withArgs(1, "No active key mapping state detected");
    });

    it("should revert if reputation is below threshold", async function () {
      // Lower reputation below threshold
      await identityRegistry.updateReputation(1, 50, ethers.ZeroHash);

      const payload = {
        targetPool: owner.address,
        callData: "0x",
        nonce: 0,
      };

      // No key mapped -> RemediationGriefed event
      await expect(
        remediationRegistry.executeRemediation(
          1,
          "0x1234",
          ethers.ZeroHash,
          payload,
          "0x" + "00".repeat(65)
        )
      ).to.emit(remediationRegistry, "RemediationGriefed");
    });
  });

  describe("Integration: Full Lifecycle", function () {
    it("should deploy all contracts and wire dependencies correctly", async function () {
      await identityRegistry.registerAgent("ipfs://QmConstitution");
      expect(await identityRegistry.getReputation(1)).to.equal(100);

      const registryAddr = await keyRegistry.identityRegistry();
      expect(registryAddr).to.equal(await identityRegistry.getAddress());

      expect(await remediationRegistry.proofVerifier()).to.equal(await verifier.getAddress());
      expect(await remediationRegistry.identityRegistry()).to.equal(await identityRegistry.getAddress());
      expect(await remediationRegistry.keyRegistry()).to.equal(await keyRegistry.getAddress());
    });
  });
});
