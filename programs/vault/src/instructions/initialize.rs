use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::VaultState;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init, 
        payer = payer, 
        space = 8 + VaultState::INIT_SPACE, 
        seeds = [b"vault", payer.key().as_ref()], 
        bump
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        init,
        payer = payer,
        token::mint = mint,
        token::authority = vault,
        token::token_program = token_program,
        seeds = [b"token", vault.key().as_ref()],
        bump
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    msg!("Greetings from: {:?}", ctx.program_id);
    Ok(())
}
