use anchor_lang::prelude::*;

#[event]
pub struct VaultInitialized {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
}

#[event]
pub struct Deposited {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct Withdrawn {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
}
