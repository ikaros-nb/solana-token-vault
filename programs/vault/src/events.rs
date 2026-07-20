use anchor_lang::prelude::*;

#[event]
pub struct VaultInitialized {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
}

#[event]
pub struct Deposited {
    /// Vault owner (PDA authority / beneficiary).
    pub owner: Pubkey,
    /// Wallet that signed and funded the deposit.
    pub depositor: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub amount: u64,
}

#[event]
pub struct Withdrawn {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub amount: u64,
}

#[event]
pub struct Closed {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    /// Token amount returned to the owner before accounts were closed.
    pub amount: u64,
}
