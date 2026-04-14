use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized: only the vault owner can withdraw")]
    Unauthorized,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
}
