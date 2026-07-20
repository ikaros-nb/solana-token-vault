use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{VaultState, VaultInitialized};
use crate::{TOKEN, VAULT};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init, 
        payer = payer, 
        space = 8 + VaultState::INIT_SPACE, 
        seeds = [VAULT.as_bytes(), payer.key().as_ref()], 
        bump
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        init,
        payer = payer,
        token::mint = mint,
        token::authority = vault,
        token::token_program = token_program,
        seeds = [TOKEN.as_bytes(), vault.key().as_ref()],
        bump
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handler_initialize(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.vault.set_inner(VaultState {
        owner: ctx.accounts.payer.key(),
        bump: ctx.bumps.vault,
        mint: ctx.accounts.mint.key()
    });

    emit!(VaultInitialized {
        owner: ctx.accounts.payer.key(),
        mint: ctx.accounts.mint.key(),
        vault: ctx.accounts.vault.key(),
    });

    Ok(())
}
