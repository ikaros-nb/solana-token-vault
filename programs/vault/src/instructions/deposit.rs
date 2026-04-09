use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::VaultState;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
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

pub fn handler_deposit(_ctx: Context<Deposit>, _amount: u64) -> Result<()> {
    Ok(())
}