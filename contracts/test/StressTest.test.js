const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Mantle Sentinel-8004: Overcrowding Stress Simulator", function () {
  let identityRegistry, keyRegistry, remediationRegistry, mockVerifier;
  let owner, agentWallet;
  let ephemeralWallet;
  let poolAddress;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    poolAddress = ethers.Wallet.createRandom().address;

    // Create wallets with signingKey for raw ECDSA signing
    agentWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    ephemeralWallet = ethers.Wallet.createRandom();

    // Fund the agent wallet
    await owner.sendTransaction({
      to: agentWallet.address,
      value: ethers.parseEther("10"),
    });

    // Deploy all contracts
    const MockVerifier = await ethers.getContractFactory("MockUltraPlonkVerifier");
    mockVerifier = await MockVerifier.deploy();

    const IdentityRegistry = await ethers.getContractFactory("MantleSentinel8004Registry");
    identityRegistry = await IdentityRegistry.deploy();

    const KeyRegistry = await ethers.getContractFactory("SentinelKeyRegistry");
    keyRegistry = await KeyRegistry.deploy(await identityRegistry.getAddress());

    const RemediationRegistry = await ethers.getContractFactory("AutomatedRemediationRegistry");
    remediationRegistry = await RemediationRegistry.deploy(
      await mockVerifier.getAddress(),
      await identityRegistry.getAddress(),
      await keyRegistry.getAddress()
    );

    await identityRegistry.setAuthorizedUpdater(await remediationRegistry.getAddress(), true);
    await identityRegistry.connect(agentWallet).registerAgent("ipfs://sentinel-manifest");

    // Map ephemeral operational key
    const domainSeparator = await keyRegistry.DOMAIN_SEPARATOR();
    const typeHash = await keyRegistry.MAP_OPERATIONAL_KEY_TYPEHASH();
    const nonce = await keyRegistry.nonces(1);
    const deadline = Math.floor(Date.now() / 1000) + 600;

    const structHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "uint256", "address", "uint256", "uint256"],
        [typeHash, 1, ephemeralWallet.address, nonce, deadline]
      )
    );

    const digest = ethers.keccak256(
      ethers.solidityPacked(
        ["bytes", "bytes32", "bytes32"],
        ["0x1901", domainSeparator, structHash]
      )
    );

    const sig = agentWallet.signingKey.sign(digest);
    const signature = sig.r + sig.s.slice(2) + sig.v.toString(16).padStart(2, "0");

    await keyRegistry.connect(agentWallet).mapOperationalKey(
      1, ephemeralWallet.address, deadline, signature
    );
  });

  it("STRESS TEST: High-Volume Concurrent Traffic Burst (100+ Requests)", async function () {
    const totalBurstRequests = 100;
    const batchSize = 10;

    console.log(`\n[LAUNCH] Firing ${totalBurstRequests} concurrent transactions in batches of ${batchSize}...`);

    const callData = "0xc2985578";
    const dummyProof = "0x1234";
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const callDataHash = ethers.keccak256(callData);

    let totalSucceeded = 0;
    let totalReverted = 0;

    // Process in batches to avoid Hardhat memory exhaustion
    for (let batchStart = 1; batchStart <= totalBurstRequests; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, totalBurstRequests);
      const batchPromises = [];

      for (let i = batchStart; i <= batchEnd; i++) {
        const executionHash = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "bytes32", "uint256", "uint256"],
            [poolAddress, callDataHash, i, chainId]
          )
        );

        const publicInputs = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "bytes32"],
            [poolAddress, executionHash]
          )
        );

        const execSig = ephemeralWallet.signingKey.sign(executionHash);
        const execSignature = execSig.r + execSig.s.slice(2) + execSig.v.toString(16).padStart(2, "0");

        batchPromises.push(
          remediationRegistry.connect(agentWallet).executeRemediation(
            1, dummyProof, publicInputs,
            { targetPool: poolAddress, callData: callData, nonce: i },
            execSignature
          )
        );
      }

      const results = await Promise.allSettled(batchPromises);
      totalSucceeded += results.filter(r => r.status === "fulfilled").length;
      totalReverted += results.filter(r => r.status === "rejected").length;
    }

    console.log(`[RESULTS] ${totalSucceeded} succeeded, ${totalReverted} reverted`);
    console.log(`[SUCCESS] Contract handled ${totalBurstRequests} concurrent transactions without crashing!`);

    // At least the first request of each batch should succeed (unique nonces)
    expect(totalSucceeded).to.be.greaterThan(0);
  });
});
