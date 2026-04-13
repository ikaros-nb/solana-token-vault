use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{VaultState, Withdrawn};
use crate::{TOKEN, VAULT};

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
        seeds = [TOKEN.as_bytes(), vault.key().as_ref()],
        bump
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handler_withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let signer_seeds: &[&[&[u8]]] = &[&[
        VAULT.as_bytes(), 
        ctx.accounts.payer.key.as_ref(),
        &[ctx.accounts.vault.bump]
    ]];

    let decimals = ctx.accounts.mint.decimals;
 
    let cpi_accounts = TransferChecked {
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.payer_token_account.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.key();
    let cpi_context = CpiContext::new(
        cpi_program, 
        cpi_accounts
    ).with_signer(signer_seeds);
    token_interface::transfer_checked(cpi_context, amount, decimals)?;

    emit!(Withdrawn {
        owner: ctx.accounts.payer.key(),
        mint: ctx.accounts.mint.key(),
        amount,
    });

    Ok(())
}