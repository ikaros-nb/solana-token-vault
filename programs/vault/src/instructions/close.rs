use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{error::ErrorCode, VaultState};
use crate::{TOKEN, VAULT};

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut, constraint = payer.key() == vault.owner @ ErrorCode::Unauthorized)]
    pub payer: Signer<'info>,

    #[account(mut, close = payer)]
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

pub fn handler_close(ctx: Context<Close>) -> Result<()> {
    let signer_seeds: &[&[&[u8]]] = &[&[
        VAULT.as_bytes(),
        ctx.accounts.payer.key.as_ref(),
        &[ctx.accounts.vault.bump],
    ]];

    let amount = ctx.accounts.vault_token_account.amount;

    // skip transfer when empty (token account can still be closed if amount == 0)
    if amount > 0 {
        let decimals = ctx.accounts.mint.decimals;

        let cpi_accounts = TransferChecked {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.payer_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_context = CpiContext::new(
            ctx.accounts.token_program.key(),
            cpi_accounts
        ).with_signer(signer_seeds);

        token_interface::transfer_checked(cpi_context, amount, decimals)?;
    }

    // close vault ATA → rent to payer (requires amount == 0 after transfer)
    let close_accounts = CloseAccount {
        account: ctx.accounts.vault_token_account.to_account_info(),
        destination: ctx.accounts.payer.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
    };
    let close_ctx = CpiContext::new(
        ctx.accounts.token_program.key(),
        close_accounts,
    );

    token_interface::close_account(close_ctx)?;

    Ok(())
}
