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

  // Listens for an event and resolves when received (or rejects after timeout)
  function waitForEvent<T>(eventName: string): Promise<T> {
    return new Promise((resolve, reject) => {
      let listenerId: number;
      const timeout = setTimeout(() => {
        program.removeEventListener(listenerId);
        reject(new Error(`Event "${eventName}" not received`));
      }, 10_000);

      listenerId = program.addEventListener(eventName, (event: T) => {
        clearTimeout(timeout);
        program.removeEventListener(listenerId);
        resolve(event);
      });
    });
  }

  before(async () => {
    payerAta = await getAssociatedTokenAddress(mint, wallet.publicKey);
  });

  it("initializes the vault", async () => {
    // Skip if vault already exists (devnet persists between runs)
    const accountInfo = await provider.connection.getAccountInfo(vaultPda);
    if (accountInfo) {
      console.log("Vault already initialized, skipping");
      return;
    }

    const eventPromise = waitForEvent<{
      owner: PublicKey;
      mint: PublicKey;
      vault: PublicKey;
    }>("vaultInitialized");

    const tx = await program.methods
      .initialize()
      .accounts({
        mint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Initialize tx:", tx);

    const event = await eventPromise;
    console.log("Event VaultInitialized:", {
      owner: event.owner.toBase58(),
      mint: event.mint.toBase58(),
      vault: event.vault.toBase58(),
    });
    assert.ok(event.owner.equals(wallet.publicKey));
    assert.ok(event.mint.equals(mint));
    assert.ok(event.vault.equals(vaultPda));
  });

  it("deposits tokens into the vault", async () => {
    const balanceBefore = (await getAccount(provider.connection, payerAta)).amount;
    const depositAmount = new anchor.BN(balanceBefore.toString());

    const eventPromise = waitForEvent<{
      owner: PublicKey;
      mint: PublicKey;
      amount: anchor.BN;
    }>("deposited");

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

    const event = await eventPromise;
    console.log("Event Deposited:", {
      owner: event.owner.toBase58(),
      mint: event.mint.toBase58(),
      amount: event.amount.toString(),
    });
    assert.ok(event.owner.equals(wallet.publicKey));
    assert.ok(event.mint.equals(mint));
    assert.ok(event.amount.eq(depositAmount));

    const balanceAfter = (await getAccount(provider.connection, payerAta)).amount;
    assert.equal(
      balanceBefore - balanceAfter,
      BigInt(depositAmount.toString())
    );

    const vaultBalance = (await getAccount(provider.connection, vaultTokenAccount)).amount;
    assert.ok(vaultBalance >= BigInt(depositAmount.toString()));
  });

  it("withdraws tokens from the vault", async () => {
    const withdrawAmount = new anchor.BN(500_000);

    const eventPromise = waitForEvent<{
      owner: PublicKey;
      mint: PublicKey;
      amount: anchor.BN;
    }>("withdrawn");

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

    const event = await eventPromise;
    console.log("Event Withdrawn:", {
      owner: event.owner.toBase58(),
      mint: event.mint.toBase58(),
      amount: event.amount.toString(),
    });
    assert.ok(event.owner.equals(wallet.publicKey));
    assert.ok(event.mint.equals(mint));
    assert.ok(event.amount.eq(withdrawAmount));
  });
});
