use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::VaultState;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, constraint = payer.key() == vault.owner)]
    pub payer: Signer<'info>,

    #[account()]
    pub vault: Account<'info, VaultState>,

    #[account(constraint = vault.mint == mint.key())]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub payer_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut, 
        seeds = [b"token", vault.key().as_ref()],
        bump
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handler_withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    Ok(())
}