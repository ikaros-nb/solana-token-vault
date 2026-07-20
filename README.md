# Solana Token Vault

First hands-on Solana project — a custom Anchor program that creates a PDA vault to hold SPL tokens, with deposit, withdraw, and close instructions.

Built with Anchor 1.1.x on devnet.

## Features

- Initialize a vault PDA linked to a specific SPL token mint
- Deposit tokens from your wallet into the vault
- Withdraw tokens from the vault back to your wallet
- Close the vault (return remaining tokens + reclaim rent)
- Anchor events emitted for each operation
- Custom error handling (unauthorized access, zero amount, insufficient funds)

## Design notes

- **One vault per wallet.** The vault PDA is `["vault", owner]`, so each owner has a single vault for a single mint (until close + re-initialize).
- **Open deposits by default.** Anyone who holds the vault mint can deposit; only the owner can withdraw or close.
- **Token-2022 caveats (tutorial scope).** The program uses `token_interface` and accepts classic SPL Token and Token-2022. For this tutorial, prefer **vanilla SPL Token mints**. Dangerous Token-2022 extensions (permanent delegate, freeze authority, transfer hooks, non-transferable, etc.) can freeze or move vault balances outside this program. Treat Token-2022 as out of scope unless you add explicit extension checks.

## Commands

```bash
# Build
anchor build

# Deploy to devnet
anchor program deploy

# Run tests (requires a running validator or devnet)
anchor test --skip-local-validator

# Check vault token balance
spl-token balance --address <VAULT_TOKEN_ACCOUNT_PDA>

# Extend program space if needed after code changes
solana program extend <PROGRAM_ID> <BYTES>
```
