import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Vault } from "../target/types/vault";
import { assert } from "chai";

describe("vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;
  const wallet = provider.wallet as anchor.Wallet;
  const mint = new PublicKey("666gTuw7LC1auGbivZh1834HFquTHD5DwVtiR1jQv82E");

  it("initializes the vault", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        mint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Transaction signature:", tx);

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), wallet.publicKey.toBuffer()],
      program.programId
    );

    const vaultAccount = await program.account.vaultState.fetch(vaultPda);
    assert.ok(vaultAccount.owner.equals(wallet.publicKey));
    assert.ok(vaultAccount.mint.equals(mint));
  });
});
