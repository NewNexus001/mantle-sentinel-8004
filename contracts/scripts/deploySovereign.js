const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n[INIT] Launching Mantle Testnet Deployment Pipeline...`);
  console.log(`[DEPLOYER] Authorized Account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`[BALANCE] Current Deployer Wallet Balance: ${ethers.formatEther(balance)} MNT`);

  // 1. Deploy the Dummy/Mock UltraPlonk ZK Verifier
  console.log("\n[DEPLOY] Compiling and broadcasting MockUltraPlonkVerifier...");
  const MockVerifier = await ethers.getContractFactory("MockUltraPlonkVerifier");
  const mockVerifier = await MockVerifier.deploy();
  await mockVerifier.waitForDeployment();
  const verifierAddress = await mockVerifier.getAddress();
  console.log(`[SUCCESS] UltraPlonk Verifier deployed at: ${verifierAddress}`);

  // 2. Deploy the Stateful ERC-8004 Identity Core Registry
  console.log("\n[DEPLOY] Broadcasting MantleSentinel8004Registry...");
  const IdentityRegistry = await ethers.getContractFactory("MantleSentinel8004Registry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const identityAddress = await identityRegistry.getAddress();
  console.log(`[SUCCESS] ERC-8004 Identity Core deployed at: ${identityAddress}`);

  // 3. Deploy the EIP-712 Dual-Enclave Key Registry
  console.log("\n[DEPLOY] Broadcasting SentinelKeyRegistry...");
  const KeyRegistry = await ethers.getContractFactory("SentinelKeyRegistry");
  const keyRegistry = await KeyRegistry.deploy(identityAddress);
  await keyRegistry.waitForDeployment();
  const keyRegistryAddress = await keyRegistry.getAddress();
  console.log(`[SUCCESS] Sentinel Key Registry deployed at: ${keyRegistryAddress}`);

  // 4. Deploy the Final low-level CEI Execution Target (AutomatedRemediationRegistry)
  console.log("\n[DEPLOY] Broadcasting AutomatedRemediationRegistry...");
  const RemediationRegistry = await ethers.getContractFactory("AutomatedRemediationRegistry");
  const remediationRegistry = await RemediationRegistry.deploy(
    verifierAddress,
    identityAddress,
    keyRegistryAddress
  );
  await remediationRegistry.waitForDeployment();
  const remediationAddress = await remediationRegistry.getAddress();
  console.log(`[SUCCESS] Automated Remediation Registry deployed at: ${remediationAddress}`);

  // 5. Authorize AutomatedRemediationRegistry as reputation updater
  console.log("\n[AUTH] Authorizing AutomatedRemediationRegistry as reputation updater...");
  const authTx = await identityRegistry.setAuthorizedUpdater(remediationAddress, true);
  await authTx.wait();
  console.log("[SUCCESS] Authorized AutomatedRemediationRegistry as updater on identity registry");

  // 6. Register initial agent
  console.log("\n[AGENT] Registering initial sentinel agent...");
  const regTx = await identityRegistry.registerAgent("ipfs://QmSentinelConstitution");
  await regTx.wait();
  console.log("[SUCCESS] Agent #1 registered with initial reputation 100");

  console.log("\n========================================================");
  console.log("🚀 ALL SENTINEL CONTRACTS SUCCESSFULLY ARMED ON MANTLE L2");
  console.log("========================================================");
  console.log(`MockUltraPlonkVerifier:        ${verifierAddress}`);
  console.log(`MantleSentinel8004Registry:    ${identityAddress}`);
  console.log(`SentinelKeyRegistry:           ${keyRegistryAddress}`);
  console.log(`AutomatedRemediationRegistry:  ${remediationAddress}`);
  console.log("========================================================\n");

  // Trigger automated verification if not on a local hardhat network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("[VERIFY] Waiting for blocks confirmations on Mantle Explorer...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        contract: "MantleSentinel8004Registry.sol:MantleSentinel8004Registry",
        address: identityAddress,
        constructorArguments: [],
      });
      console.log("[VERIFY] MantleSentinel8004Registry verified on Explorer.");

      await hre.run("verify:verify", {
        contract: "SentinelKeyRegistry.sol:SentinelKeyRegistry",
        address: keyRegistryAddress,
        constructorArguments: [identityAddress],
      });
      console.log("[VERIFY] SentinelKeyRegistry verified on Explorer.");

      await hre.run("verify:verify", {
        contract: "AutomatedRemediationRegistry.sol:AutomatedRemediationRegistry",
        address: remediationAddress,
        constructorArguments: [verifierAddress, identityAddress, keyRegistryAddress],
      });
      console.log("[VERIFY] AutomatedRemediationRegistry verified on Explorer.");

    } catch (e) {
      console.log(`[VERIFY-ERROR] Automated verification log: ${e.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
