// Sentinel-8004 Verifiable Reasoning Loop (VRL) Circuit
// Chaos-hardened: fixes u64 truncation attack, uses Poseidon hash with domain separator.
//
// Attack vector fixed: Casting Field to u64 truncates to 64 bits. An attacker could
// provide state_root = 2^64 + 96, which truncates to 96 > 95, bypassing the threshold.
// Fix: Compare the full Field value against the threshold field constant.

/// Domain separator: "SENTINEL_VRL_V1" as hex
global DOMAIN_SEPARATOR: Field = 0x53454e54494e454c5f56524c5f5631;

/// Safety threshold as a Field constant (not u64) to prevent truncation attacks
global SAFETY_THRESHOLD: Field = 95;

fn main(
    llm_embedding: (Field; 4),
    selected_action: Field,
    policy_root: pub Field,
    state_root: pub Field,
    tx_hash: pub Field,
) {
    // Constraint 1: Deterministic action selection via Poseidon hash with domain separator
    let hash_input = [
        DOMAIN_SEPARATOR,
        llm_embedding[0],
        llm_embedding[1],
        llm_embedding[2],
        llm_embedding[3],
    ];
    let computed_action = std::hash::poseidon::Poseidon::hash(hash_input);
    assert(computed_action == selected_action);

    // Constraint 2: Verify that the selected action maps uniquely to the public policy_root
    let policy_input = [
        DOMAIN_SEPARATOR,
        computed_action,
        tx_hash,
    ];
    let policy_binding = std::hash::poseidon::Poseidon::hash(policy_input);
    assert(policy_binding == policy_root);

    // Constraint 3: State deviation must exceed safety threshold
    // FIX: Compare as Field to prevent u64 truncation attack
    // In Noir, Field comparison uses full-precision arithmetic
    assert(state_root > SAFETY_THRESHOLD);

    // Constraint 4: Transaction hash must be non-null (prevents empty remediation)
    assert(tx_hash != 0);
}
