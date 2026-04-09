import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Vault } from "../target/types/vault";
import { assert } from "chai";

describe("vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;
  const wallet = provider.wallet as anchor.Wallet;
  const mint = new PublicKey("666gTuw7LC1auGbivZh1834HFquTHD5DwVtiR1jQv82E");

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), wallet.publicKey.toBuffer()],
    program.programId
  );

  const [vaultTokenAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("token"), vaultPda.toBuffer()],
    program.programId
  );

  let payerAta: PublicKey;

  before(async () => {
    payerAta = await getAssociatedTokenAddress(mint, wallet.publicKey);
  });

  it("initializes the vault", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        mint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Initialize tx:", tx);

    const vaultAccount = await program.account.vaultState.fetch(vaultPda);
    assert.ok(vaultAccount.owner.equals(wallet.publicKey));
    assert.ok(vaultAccount.mint.equals(mint));
  });

  it("deposits tokens into the vault", async () => {
    const depositAmount = new anchor.BN(1_000_000); // 1 token (6 decimals)

    const balanceBefore = (await getAccount(provider.connection, payerAta)).amount;

    const tx = await program.methods
      .deposit(depositAmount)
      .accounts({
        vault: vaultPda,
        mint: mint,
        payerTokenAccount: payerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Deposit tx:", tx);

    const balanceAfter = (await getAccount(provider.connection, payerAta)).amount;
    assert.equal(
      balanceBefore - balanceAfter,
      BigInt(depositAmount.toString())
    );

    const vaultBalance = (await getAccount(provider.connection, vaultTokenAccount)).amount;
    assert.ok(vaultBalance >= BigInt(depositAmount.toString()));
  });

  it("withdraws tokens from the vault", async () => {
    const withdrawAmount = new anchor.BN(500_000); // 0.5 token

    const balanceBefore = (await getAccount(provider.connection, payerAta)).amount;

    const tx = await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        vault: vaultPda,
        mint: mint,
        payerTokenAccount: payerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Withdraw tx:", tx);

    const balanceAfter = (await getAccount(provider.connection, payerAta)).amount;
    assert.equal(
      balanceAfter - balanceBefore,
      BigInt(withdrawAmount.toString())
    );
  });
});
