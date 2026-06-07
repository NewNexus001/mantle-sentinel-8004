const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Step 1: Deploy MantleSentinel8004Registry (ERC-8004 Identity)
  const RegistryFactory = await ethers.getContractFactory("MantleSentinel8004Registry");
  const identityRegistry = await RegistryFactory.deploy();
  await identityRegistry.waitForDeployment();
  const identityAddress = await identityRegistry.getAddress();
  console.log("MantleSentinel8004Registry deployed:", identityAddress);

  // Step 2: Deploy SentinelKeyRegistry (EIP-712 Key Mapping)
  const KeyRegistryFactory = await ethers.getContractFactory("SentinelKeyRegistry");
  const keyRegistry = await KeyRegistryFactory.deploy(identityAddress);
  await keyRegistry.waitForDeployment();
  const keyRegistryAddress = await keyRegistry.getAddress();
  console.log("SentinelKeyRegistry deployed:", keyRegistryAddress);

  // Step 3: Deploy mock UltraPlonkVerifier (accepts all proofs for demo)
  const VerifierFactory = await ethers.getContractFactory("MockUltraPlonkVerifier");
  const verifier = await VerifierFactory.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("MockUltraPlonkVerifier deployed:", verifierAddress);

  // Step 4: Deploy AutomatedRemediationRegistry
  const RemediationFactory = await ethers.getContractFactory("AutomatedRemediationRegistry");
  const remediationRegistry = await RemediationFactory.deploy(
    verifierAddress,
    identityAddress,
    keyRegistryAddress
  );
  await remediationRegistry.waitForDeployment();
  const remediationAddress = await remediationRegistry.getAddress();
  console.log("AutomatedRemediationRegistry deployed:", remediationAddress);

  // Step 5: Authorize AutomatedRemediationRegistry as reputation updater
  const tx = await identityRegistry.setAuthorizedUpdater(remediationAddress, true);
  await tx.wait();
  console.log("Authorized AutomatedRemediationRegistry as updater on identity registry");

  // Step 6: Register agent
  const regTx = await identityRegistry.registerAgent("ipfs://QmSentinelConstitution");
  await regTx.wait();
  console.log("Agent #1 registered");

  console.log("\n--- Deployment Summary ---");
  console.log("MantleSentinel8004Registry:", identityAddress);
  console.log("SentinelKeyRegistry:", keyRegistryAddress);
  console.log("MockUltraPlonkVerifier:", verifierAddress);
  console.log("AutomatedRemediationRegistry:", remediationAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
