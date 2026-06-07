# Mantle Sentinel-8004: Verifiable Cross-Chain Autonomous Guardian & Quantitative Alpha Engine

Mantle Sentinel-8004 is a zero-trust autonomous multi-agent security infrastructure and high-yield quantitative rebalancing loop purpose-built for the Mantle L2 ecosystem. By integrating stateful ERC-8004 agent identity tokens with non-interactive zero-knowledge verification parameters, Sentinel-8004 transitions smart contract infrastructure from reactive code auditing to proactive, sub-millisecond sequencer-level threat neutralization.

## 🏗️ Core Architectural Mechanics
Our framework orchestrates data processing flows concurrently across a highly decoupled dual-enclave environment:
1. **The Ingestion Pipeline (Mantle Network L2 Track):** Written in asynchronous Python 3.12 using decoupled memory priority queues. A dedicated task thread handles persistent WebSocket streams to ingest raw block metadata directly from the Mantle L2 Rollup Sequencer transaction pool. Five concurrent background workers process transaction caches in parallel, preventing input buffer drops during overcrowding spikes.
2. **The Yield Sovereign (Byreal Agentic Track & Mirana Ventures):** While idle, the daemon queries real-time funding indices from the Bybit API to execute automated arbitrage rebalancing trades on Solana via the `Byreal Agent Skills` CLI interface.
3. **The Cryptographic Guardrail (Noir ZK-SNARK Circuit):** The split-second an exploit footprint is flagged inside the mempool cache, the trading engine freezes execution flow. A specialized Noir circuit generates a Poseidon-compressed proof, proving mathematically that the agent's decision to toggle an automated circuit-breaker pause strictly satisfies the protocol's immutable safety policy without exposing internal code parameters.
4. **The On-Chain Settlement (Solidity 0.8.24):** Implements an EIP-712 dual-enclave key registry. Master vault private keys remain safely detached offline, delegating execution authority to short-lived, ephemeral operational proxy keys. The architecture strictly satisfies the Checks-Effects-Interactions (CEI) layout to prevent multi-block re-entrancy vectors.

## 📁 Repository Workspace Directory
- `/contracts` — Production Solidity layers, key registries, and automated remediation targets.
- `/circuits` — Noir arithmetic circuits compiling Poseidon safety witness traces.
- `/agent` — Asyncio Python 3.12 ingestion loops, Bybit data pipelines, and Byreal CLI interfaces.
- `/frontend` — Next.js 14+ dark-cyber CommandCenter operations dashboard.

## 🚀 Native Compilation & Local Verification

### Smart Contracts Installation
Ensure you are sitting within the contracts directory before executing compiler setups:
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

### Zero-Knowledge Proof Compilation
Compile constraints and verify execution trace parameters natively:
```bash
cd ../circuits
nargo compile
nargo check
```

### Python Engine Initialization
Populate the structural '.env' file parameters before launching the daemon:
```bash
cd ../agent
pip install -r requirements.txt
python sentinel_core.py
```
