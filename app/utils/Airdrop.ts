import { clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import pkg from 'bs58';

const { decode } = pkg;

const connection = new Connection(clusterApiUrl("devnet"));

export default async function AirdropSOL(solAmount: number, receiverAddress: PublicKey) {
    if(!process.env.ESCROW_PRIVATE_KEY) {
        return JSON.stringify({
            success: false,
            message: "environtment variable not found"
        })
    }

    const escrowPrivatekey = decode(process.env.ESCROW_PRIVATE_KEY);
    const escrowPublicKey = new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn');
    const escrowKeyPair = Keypair.fromSecretKey(
        escrowPrivatekey
    );

    // Fetch the rent-exempt minimum balance
    const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(0);
    console.log("rent: ", rentExemptBalance);

    // Check receiver's current balance
    const receiverBalance = await connection.getBalance(receiverAddress);

    const tx = new Transaction();

    if (receiverBalance < rentExemptBalance) {
        // Airdrop both rent and fees
        const ix = SystemProgram.transfer({
            fromPubkey: escrowPublicKey,
            toPubkey: receiverAddress,
            lamports: solAmount + rentExemptBalance
        });
    
        tx.add(ix);
    
        tx.feePayer = escrowPublicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
        const transactionMessage = tx.compileMessage();
        const transactionFee = (await connection.getFeeForMessage(transactionMessage)).value;

        if(!transactionFee) {
            return JSON.stringify({
                success: false,
                message: "can not calculate transaction fees"
            })
        }
    
        const signature = await sendAndConfirmTransaction(connection, tx, [escrowKeyPair]);

        const totalTransactionFee = transactionFee + rentExemptBalance;
    
        return JSON.stringify({
            success: true,
            transactionFee: totalTransactionFee,
            signature: signature
        });
    }else {
        // Airdrop only fees
        const ix = SystemProgram.transfer({
            fromPubkey: escrowPublicKey,
            toPubkey: receiverAddress,
            lamports: solAmount
        });
    
        tx.add(ix);
    
        tx.feePayer = escrowPublicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
        const transactionMessage = tx.compileMessage();
        const transactionFee = (await connection.getFeeForMessage(transactionMessage)).value;
    
        const signature = await sendAndConfirmTransaction(connection, tx, [escrowKeyPair]);
    
        return JSON.stringify({
            success: true,
            transactionFee: transactionFee,
            signature: signature
        })
    }
}