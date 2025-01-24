import { createTransferCheckedInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"));

export default async function PayComission (usdcAmount: number, payer: Keypair) {
    try {
        const usdcMintAddress = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
        const escrowPublicKey = new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn');

        // Fetch the sender's USDC token account
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            usdcMintAddress,
            payer.publicKey
        );

        const userTokenAccountPublicKey = new PublicKey(userTokenAccount.address.toString());

        // Fetch or create the receiver's associated token account for USDC
        const escrowTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            usdcMintAddress,
            escrowPublicKey
        );

        const escrowTokenAccountPublicKey = new PublicKey(escrowTokenAccount.address.toString());


        const tx = new Transaction();
        const ix = createTransferCheckedInstruction(
            userTokenAccountPublicKey,
            usdcMintAddress,
            escrowTokenAccountPublicKey,
            payer.publicKey,
            usdcAmount,
            6
        );

        tx.add(ix);

        tx.feePayer = payer.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const signature = await sendAndConfirmTransaction(connection, tx, [payer]);

        return JSON.stringify({
            success: true,
            signature: signature
        });
    } catch (error) {
        console.log("Unabele to pay the comission: ", error);
        return JSON.stringify({
            success: false,
            message: `Unabele to pay the comission: ${error}`
        });
    }
}