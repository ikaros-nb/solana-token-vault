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

  // Parse events from confirmed transaction logs
  async function getEvents(txSignature: string) {
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: txSignature,
      ...latestBlockhash,
    }, "confirmed");
    const tx = await provider.connection.getTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const eventParser = new anchor.EventParser(program.programId, program.coder);
    const events = [];
    for (const event of eventParser.parseLogs(tx.meta.logMessages)) {
      events.push(event);
    }
    return events;
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

    const tx = await program.methods
      .initialize()
      .accounts({
        mint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Initialize tx:", tx);

    const events = await getEvents(tx);
    const event = events.find((e) => e.name === "vaultInitialized");
    assert.ok(event, "VaultInitialized event not found");
    console.log("Event VaultInitialized:", {
      owner: event.data.owner.toBase58(),
      mint: event.data.mint.toBase58(),
      vault: event.data.vault.toBase58(),
    });
    assert.ok(event.data.owner.equals(wallet.publicKey));
    assert.ok(event.data.mint.equals(mint));
    assert.ok(event.data.vault.equals(vaultPda));
  });

  it("deposits tokens into the vault", async () => {
    const balanceBefore = (await getAccount(provider.connection, payerAta)).amount;
    const depositAmount = new anchor.BN(balanceBefore.toString());

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

    const events = await getEvents(tx);
    const event = events.find((e) => e.name === "deposited");
    assert.ok(event, "Deposited event not found");
    console.log("Event Deposited:", {
      owner: event.data.owner.toBase58(),
      mint: event.data.mint.toBase58(),
      amount: event.data.amount.toString(),
    });
    assert.ok(event.data.owner.equals(wallet.publicKey));
    assert.ok(event.data.mint.equals(mint));
    assert.ok(event.data.amount.eq(depositAmount));

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

    const events = await getEvents(tx);
    const event = events.find((e) => e.name === "withdrawn");
    assert.ok(event, "Withdrawn event not found");
    console.log("Event Withdrawn:", {
      owner: event.data.owner.toBase58(),
      mint: event.data.mint.toBase58(),
      amount: event.data.amount.toString(),
    });
    assert.ok(event.data.owner.equals(wallet.publicKey));
    assert.ok(event.data.mint.equals(mint));
    assert.ok(event.data.amount.eq(withdrawAmount));
  });
});
