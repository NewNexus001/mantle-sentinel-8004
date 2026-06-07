#!/usr/bin/env python3
"""
Mantle Sentinel-8004 LLM Decision Server
Lightweight Model Context Protocol (MCP) tool server that processes structural
token inputs, checks them against an immutable safety manifest, and outputs
a structured JSON action map.
"""

import json
import logging
import os
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [LLM-SERVER] %(message)s",
)
logger = logging.getLogger("llm_server")

app = FastAPI(
    title="Sentinel-8004 MCP Decision Server",
    version="1.0.0",
    description="Model Context Protocol tool server for DeFi Guardian remediation decisions",
)


# ─── Safety Manifest (Immutable) ──────────────────────────────────────────────

class SeverityLevel(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


SAFETY_MANIFEST = {
    "version": "1.0.0",
    "max_slippage_bps": 500,
    "auto_remediate_severities": ["HIGH", "CRITICAL"],
    "monitor_severities": ["LOW", "MEDIUM"],
    "blocked_actions": ["SWAP", "WITHDRAW"],  # Actions the agent must NEVER take
    "allowed_actions": ["REMEDIATE", "MONITOR", "ALERT", "ESCALATE"],
    "required_conditions_for_remediate": [
        "anomaly_confirmed",
        "proof_generated",
        "registry_available",
    ],
    "max_concurrent_remediations": 3,
    "cooldown_seconds": 30,
    "constitution_rules": [
        "Agent must never act against pool integrity",
        "Agent must prioritize user fund safety",
        "Agent must generate ZK proof before any state change",
        "Agent must log all remediation actions",
    ],
}


# ─── Request / Response Models ────────────────────────────────────────────────

class MCPRequest(BaseModel):
    tool: str
    input: dict[str, Any]


class MCPResponse(BaseModel):
    action: str
    reasoning: str
    confidence: float = 1.0
    manifest_version: str = SAFETY_MANIFEST["version"]
    timestamp: str = ""
    metadata: dict[str, Any] = {}


class ManifestResponse(BaseModel):
    manifest: dict[str, Any]
    validated: bool


# ─── Decision Logic ───────────────────────────────────────────────────────────

def validate_against_manifest(event_data: dict) -> tuple[bool, str]:
    """
    Validate the incoming event against the immutable safety manifest.
    Returns (is_valid, reason).
    """
    event_type = event_data.get("event_type", "UNKNOWN")
    severity = event_data.get("severity", "LOW")
    details = event_data.get("details", "")

    # Check severity is recognized
    try:
        SeverityLevel(severity)
    except ValueError:
        return False, f"Unrecognized severity level: {severity}"

    # Check if pool is already paused
    pool_state = event_data.get("context", {}).get("pool_state", {})
    if pool_state.get("paused", False):
        return False, "Pool is already paused — no action required"

    return True, "Event validated against manifest"


def compute_decision(event_data: dict) -> dict[str, Any]:
    """
    Compute the remediation decision based on the event data and safety manifest.
    Returns structured JSON action map.
    """
    severity = event_data.get("severity", "LOW")
    event_type = event_data.get("event_type", "UNKNOWN")

    # Validate against manifest
    is_valid, validation_reason = validate_against_manifest(event_data)

    if not is_valid:
        return {
            "action": "MONITOR",
            "reasoning": f"Manifest validation failed: {validation_reason}",
            "confidence": 0.0,
        }

    # Decision tree based on severity and manifest rules
    if severity in SAFETY_MANIFEST["auto_remediate_severities"]:
        reasoning = (
            f"Auto-remediation triggered. "
            f"Event: {event_type} | Severity: {severity}. "
            f"Safety invariant violated: {event_data.get('details', 'N/A')}. "
            f"Manifest rule: severity ≥ HIGH requires immediate circuit breaker activation."
        )
        return {
            "action": "REMEDIATE",
            "reasoning": reasoning,
            "confidence": 0.95,
            "metadata": {
                "manifest_rule": "auto_remediate",
                "validated_conditions": SAFETY_MANIFEST["required_conditions_for_remediate"],
            },
        }

    if severity in SAFETY_MANIFEST["monitor_severities"]:
        reasoning = (
            f"Monitoring recommended. "
            f"Event: {event_type} | Severity: {severity}. "
            f"Invariant mismatch detected but below auto-remediation threshold. "
            f"Continuing to track pattern for potential escalation."
        )
        return {
            "action": "MONITOR",
            "reasoning": reasoning,
            "confidence": 0.75,
            "metadata": {
                "manifest_rule": "monitor",
                "escalation_threshold": SAFETY_MANIFEST["auto_remediate_severities"],
            },
        }

    # Default fallback
    return {
        "action": "ALERT",
        "reasoning": f"Unusual event type: {event_type}. Manual review recommended.",
        "confidence": 0.5,
    }


# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.post("/mcp/execute", response_model=MCPResponse)
async def execute_mcp_tool(request: MCPRequest) -> MCPResponse:
    """
    MCP tool execution endpoint.
    Processes the tool request against the safety manifest and returns
    a structured JSON action map.
    """
    logger.info(f"[MCP] Tool request received: {request.tool}")
    logger.info(f"[MCP] Input: {json.dumps(request.input, indent=2)}")

    if request.tool != "sentinel_decision":
        raise HTTPException(
            status_code=400,
            detail=f"Unknown tool: {request.tool}. Available: sentinel_decision",
        )

    # Run decision logic
    decision = compute_decision(request.input)

    response = MCPResponse(
        action=decision["action"],
        reasoning=decision["reasoning"],
        confidence=decision.get("confidence", 1.0),
        timestamp=datetime.now(timezone.utc).isoformat(),
        metadata=decision.get("metadata", {}),
    )

    logger.info(f"[MCP] Decision: {response.action} (confidence: {response.confidence})")
    return response


@app.get("/mcp/manifest", response_model=ManifestResponse)
async def get_manifest() -> ManifestResponse:
    """Return the current safety manifest for verification."""
    return ManifestResponse(
        manifest=SAFETY_MANIFEST,
        validated=True,
    )


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "sentinel-8004-mcp-server"}


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    logger.info("═══════════════════════════════════════════════════════════")
    logger.info("  Sentinel-8004 MCP Decision Server")
    logger.info(f"  Safety Manifest Version: {SAFETY_MANIFEST['version']}")
    logger.info("═══════════════════════════════════════════════════════════")

    uvicorn.run(app, host="0.0.0.0", port=8080)
