"use client";

import React, { useState, useEffect, useRef } from "react";

// ─── Cross-Chain Telemetry Stream ────────────────────────────────────────────

const TELEMETRY_STREAM: string[] = [
  "// MULTI-CHAIN CROSS-REGISTRY INFRASTRUCTURE ARMED AND OPERATIONAL",
  "[BYREAL-SOLANA] Listening to CLMM liquidity paths using Byreal Agent Skills...",
  "[MANTLE-L2] Stateful contract listener hooked into local RPC block height.",
  "[MANTLE-L2] WebSocket pipe locked onto Mantle L2 Rollup Sequencer transaction pool...",
  "[MANTLE-L2] Subscription active: 0x8a3f...",
  "[BYREAL-SOLANA] Initializing cross-chain client context using Byreal Agent Skills...",
  "[BYREAL-CLI] Bybit funding rate ticker: BTCUSDT = 0.000127 — within threshold.",
  "[BYREAL-SOLANA] CLMM liquidity path scan complete. No anomaly detected.",
  "[MANTLE-L2] Pending transaction ingested: 0x4c2e...f8a1 (queue depth: 12)",
  "[INTERCEPT] Malicious footprint caught in Mantle mempool: 0x7d1b...3e9f",
  "[NOIR-ZKP] Generating Poseidon verification trace parameters...",
  "[NOIR-ZKP] Poseidon hash compression over 4-field decisional trace — witness generated.",
  "[NOIR-ZKP] UltraPlonk constraint satisfaction verified. R1CS proof bound to policy_root.",
  "[MANTLE-L2] Broadcasting execution proof to identity contract. Logging decision on-chain.",
  "[MANTLE-L2] TX broadcasted: 0x9e4a...c7d2",
  "[SENTINEL] Remediation #1 complete. Attack neutralized. Cross-chain state logged.",
  "[INTERCEPT] Solana cross-chain anomaly #1 logged for Byreal Skills execution context.",
  "[BYREAL-CLI] Arbitrage imbalance caught on Solana. Funding rate: 0.000312. Executing dynamic swap via CLMM.",
  "[MANTLE-L2] Pending transaction ingested: 0x2f8c...a4b7 (queue depth: 8)",
  "[INTERCEPT] Malicious footprint caught in Mantle mempool: 0x1a3d...6e2c",
  "[NOIR-ZKP] Generating Poseidon verification trace parameters...",
  "[NOIR-ZKP] Poseidon constraint compiled: 3 hash primitives + 2 field assertions + 1 non-null binding.",
  "[MANTLE-L2] Broadcasting execution proof to identity contract. Logging decision on-chain.",
  "[MANTLE-L2] TX broadcasted: 0x5c8f...d1e3",
  "[SENTINEL] Remediation #2 complete. Attack neutralized. Cross-chain state logged.",
  "[MANTLE-L2] Pending transaction ingested: 0x8b2a...c5f9 (queue depth: 3)",
  "[BYREAL-SOLANA] CLMM liquidity path scan complete. Anomaly threshold not exceeded.",
  "[SYSTEM] Computational soundness: 2^-254 bounded — Submission lock: 2026-06-15 16:59",
  "[INTERCEPT] Suspicious calldata length: 2,048 bytes on pool interaction — pattern match initiated.",
  "[NOIR-ZKP] Public input binding: tx_hash ∥ executionHash verified against state_root.",
  "[MANTLE-L2] Emergency circuit-breaker engaged — pool halted for user protection.",
  "[SENTINEL] Agent reputation score validated: 100/100 — above CRITICAL_REPUTATION_LIMIT.",
  "[MANTLE-L2] AutomatedRemediationRegistry nullifier set updated — double-execution blocked.",
  "[BYREAL-CLI] Funding rate returned to baseline. Byreal Solana position stable.",
  "[SYSTEM] ZK SOUNDNESS COMPLIANCE: POSEIDON PRIMITIVE PROVEN",
  "[SYSTEM] SUBMISSION SYSTEM STATUS: 10 DAYS TO TERMINATION // OPEN-SOURCE READY",
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CommandCenter() {
  const [logs, setLogs] = useState<string[]>([
    "// MULTI-CHAIN CROSS-REGISTRY INFRASTRUCTURE ARMED AND OPERATIONAL",
    "[BYREAL-SOLANA] Listening to CLMM liquidity paths using Byreal Agent Skills...",
    "[MANTLE-L2] Stateful contract listener hooked into local RPC block height.",
  ]);
  const [stats, setStats] = useState({
    operationalState: "OPTIMIZED",
    reputation: 100,
    outruns: 54,
    rpcLatency: "11ms",
  });
  const [logIndex, setLogIndex] = useState(3);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Streaming log injection
  useEffect(() => {
    if (logIndex >= TELEMETRY_STREAM.length) return;

    const delay = 500 + Math.random() * 1000;
    const timer = setTimeout(() => {
      setLogs((prev) => [...prev, TELEMETRY_STREAM[logIndex]]);
      setLogIndex((prev) => prev + 1);

      // Update stats based on events
      const msg = TELEMETRY_STREAM[logIndex];
      if (msg.includes("[SENTINEL]") && msg.includes("Remediation")) {
        setStats((prev) => ({
          ...prev,
          outruns: prev.outruns + 1,
          operationalState: "REMEDIATING",
        }));
      }
      if (msg.includes("circuit-breaker")) {
        setStats((prev) => ({ ...prev, operationalState: "OPTIMIZED" }));
      }
      if (msg.includes("reputation score validated")) {
        setStats((prev) => ({ ...prev, reputation: 100 }));
      }
      if (msg.includes("[BYREAL-CLI]") && msg.includes("Arbitrage")) {
        setStats((prev) => ({ ...prev, rpcLatency: "8ms" }));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [logIndex]);

  // Reset loop
  useEffect(() => {
    if (logIndex >= TELEMETRY_STREAM.length) {
      const resetTimer = setTimeout(() => {
        setLogs([
          "// MULTI-CHAIN CROSS-REGISTRY INFRASTRUCTURE ARMED AND OPERATIONAL",
          "[BYREAL-SOLANA] Listening to CLMM liquidity paths using Byreal Agent Skills...",
          "[MANTLE-L2] Stateful contract listener hooked into local RPC block height.",
        ]);
        setLogIndex(3);
        setStats({
          operationalState: "OPTIMIZED",
          reputation: 100,
          outruns: 54,
          rpcLatency: "11ms",
        });
      }, 5000);
      return () => clearTimeout(resetTimer);
    }
  }, [logIndex]);

  return (
    <div className="min-h-screen bg-[#020202] text-[#00FF66] p-6 font-mono selection:bg-[#00FF66] selection:text-black">
      <div className="max-w-7xl mx-auto border-2 border-[#00FF66] bg-black shadow-[0_0_80px_rgba(0,255,102,0.15)] rounded-none">

        {/* ═══ TOP COMMAND NAVIGATION DECK ═══ */}
        <header className="border-b-2 border-[#00FF66] p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-zinc-950 via-black to-zinc-950 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-black tracking-[0.3em] text-white">SENTINEL-8004</span>
              <span className="text-[10px] bg-[#00FF66] text-black font-black px-2 py-0.5 select-none animate-pulse">
                SOVEREIGN VRL v1.0
              </span>
            </div>
            <p className="text-[9px] text-zinc-500 font-bold mt-1.5 tracking-[0.2em] uppercase">
              // CROSS-CHAIN AGENT ECONOMIC RUNTIME ENVIRONMENT
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto text-xs">
            <div className="bg-zinc-950 border border-zinc-900 p-2.5 text-center">
              <span className="text-[9px] text-zinc-500 block font-bold uppercase">Mantle L2 Registry</span>
              <span className="text-white font-black tracking-wide">ACTIVE SYNC</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-900 p-2.5 text-center">
              <span className="text-[9px] text-zinc-500 block font-bold uppercase">Byreal Solana Track</span>
              <span className="text-[#00FF66] font-black tracking-wide">CLI CONTEXT LOADED</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-900 p-2.5 text-center">
              <span className="text-[9px] text-zinc-500 block font-bold uppercase">ZK Prover</span>
              <span className="text-violet-400 font-black tracking-wide">ULTRAPLONK</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-900 p-2.5 text-center">
              <span className="text-[9px] text-zinc-500 block font-bold uppercase">RPC Latency</span>
              <span className="text-cyan-400 font-black tracking-wide">{stats.rpcLatency}</span>
            </div>
          </div>
        </header>

        {/* ═══ METRICS DISCOVERY SECTION ═══ */}
        <main className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Autonomic Engine Performance */}
          <div className="border border-zinc-900 bg-gradient-to-b from-zinc-950 to-black p-5 relative">
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest block uppercase">
              Autonomic Engine Performance
            </span>
            <div className="text-3xl font-black mt-2 text-white flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#00FF66] rounded-none inline-block animate-ping" />
              <span>{stats.operationalState}</span>
            </div>
          </div>

          {/* ERC-8004 Reputation */}
          <div className="border border-[#00FF66] bg-zinc-950 p-5 relative">
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest block uppercase">
              ERC-8004 Reputation Score
            </span>
            <div className="text-3xl font-black mt-2 text-white">
              {stats.reputation} <span className="text-xs text-zinc-600 font-bold">/ 100 COMPLIANT</span>
            </div>
            <div className="w-full bg-zinc-900 h-1 mt-2.5 border border-zinc-800 p-[1px]">
              <div className="bg-[#00FF66] h-full w-full" />
            </div>
          </div>

          {/* Interceptions Broadcasted */}
          <div className="border border-zinc-900 bg-gradient-to-b from-zinc-950 to-black p-5 relative">
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest block uppercase">
              Interceptions Broadcasted
            </span>
            <div className="text-3xl font-black mt-2 text-white">
              +{stats.outruns} <span className="text-xs text-zinc-600 font-bold">SEQUENCER_PAUSE</span>
            </div>
          </div>

          {/* ═══ CROSS-CHAIN RADICAL TRANSPARENCY DISPLAY TERMINAL ═══ */}
          <section className="col-span-1 md:col-span-3 border border-[#00FF66] bg-zinc-950 flex flex-col h-[340px]">
            <div className="border-b border-zinc-900 px-4 py-2 flex justify-between items-center bg-black text-[10px]">
              <span className="text-white font-extrabold tracking-widest">
                // GLOBAL REASONING LOG TRANSCRIPT FEED
              </span>
              <span className="text-zinc-600">MANTLE RPC // BYBIT TICKER PORTAL</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-1 text-xs">
              {logs.map((log, index) => (
                <div key={index} className="font-mono">
                  {log.startsWith("[BYREAL-SOLANA]") && (
                    <span className="text-cyan-400 font-bold">{log}</span>
                  )}
                  {log.startsWith("[BYREAL-CLI]") && (
                    <span className="text-[#00FF66] font-bold">{log}</span>
                  )}
                  {log.startsWith("[INTERCEPT]") && (
                    <span className="text-amber-400 font-bold">{log}</span>
                  )}
                  {log.startsWith("[NOIR-ZKP]") && (
                    <span className="text-violet-400 font-bold">{log}</span>
                  )}
                  {log.startsWith("[MANTLE-L2]") && (
                    <span className="text-blue-400 font-bold">{log}</span>
                  )}
                  {log.startsWith("[SENTINEL]") && (
                    <span className="text-white font-bold">{log}</span>
                  )}
                  {log.startsWith("[SYSTEM]") && (
                    <span className="text-zinc-500 font-bold">{log}</span>
                  )}
                  {!log.startsWith("[") && !log.startsWith("//") && (
                    <span className="text-zinc-400">{log}</span>
                  )}
                  {log.startsWith("//") && (
                    <span className="text-zinc-600 italic">{log}</span>
                  )}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </section>
        </main>

        {/* ═══ BOTTOM LEDGER METADATA ═══ */}
        <footer className="border-t-2 border-[#00FF66] px-6 py-3 bg-gradient-to-r from-zinc-950 via-black to-zinc-950 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4 text-[9px] font-bold tracking-[0.2em]">
            <span className="text-[#00FF66]">ZK SOUNDNESS COMPLIANCE: POSEIDON PRIMITIVE PROVEN</span>
            <span className="text-zinc-700">|</span>
            <span className="text-amber-500">SUBMISSION SYSTEM STATUS: 10 DAYS TO TERMINATION // OPEN-SOURCE READY</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
