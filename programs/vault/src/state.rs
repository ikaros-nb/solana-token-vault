use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub owner: Pubkey,
    pub bump: u8,
    pub mint: Pubkey,
}

#[cfg(test)]
mod tests {
    use super::VaultState;
    use anchor_lang::Discriminator;
    use anchor_lang::prelude::*;
    use anchor_lang::AnchorSerialize;
    use std::str::FromStr;

    /// Golden bytes for Swift / off-chain decoders: discriminator ++ Borsh body.
    /// Edit the pubkeys / bump to match your fixture, then run:
    /// `cargo test -p vault dump_vault_state_fixture -- --nocapture`
    #[test]
    fn dump_vault_state_fixture() {
        const OWNER: &str = "11111111111111111111111111111112";
        const BUMP: u8 = 42;
        const MINT: &str = "So11111111111111111111111111111111111111112";

        let v = VaultState {
            owner: Pubkey::from_str(OWNER).unwrap(),
            bump: BUMP,
            mint: Pubkey::from_str(MINT).unwrap(),
        };
        let mut bytes = VaultState::DISCRIMINATOR.to_vec();
        let mut body = Vec::new();
        v.serialize(&mut body).unwrap();
        bytes.extend(body);
        println!(
            "{}",
            bytes.iter().map(|b| format!("{:02x}", b)).collect::<String>()
        );
    }
}