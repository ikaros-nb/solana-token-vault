# Solana Token Vault

First hands-on Solana project — a custom Anchor program that creates a PDA vault to hold SPL tokens, with deposit and withdraw instructions.

Built with Anchor 1.0.0 on devnet.

## Features

- Initialize a vault PDA linked to a specific SPL token mint
- Deposit tokens from your wallet into the vault
- Withdraw tokens from the vault back to your wallet
- Anchor events emitted for each operation
- Custom error handling (unauthorized access, zero amount)

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
