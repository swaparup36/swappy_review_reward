import { NextRequest, NextResponse } from "next/server";
import { clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferCheckedInstruction } from "@solana/spl-token";
import pkg from 'bs58';
import calculateEquivalentUSDC from "@/app/utils/CalculateEquivalentUSDC";
import AirdropSOL from "@/app/utils/Airdrop";

const connection = new Connection(clusterApiUrl("devnet"));
const { decode } = pkg;

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        console.log("body: ", body);

        if(!process.env.ESCROW_PRIVATE_KEY){
            return NextResponse.json({
                success: false,
                message: 'Escrow private key not found'
            });
        }

        const escrowPrivatekey = decode(process.env.ESCROW_PRIVATE_KEY);

        const userPublicKey = new PublicKey(body.userPublicKey);
        const usdcMintAddress = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
        const escrowPublicKey = new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn');
        const escrowKeyPair = Keypair.fromSecretKey(
            escrowPrivatekey
        )

        // Fetch the sender's USDC token account
        const escrowTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            escrowKeyPair,
            usdcMintAddress,
            escrowKeyPair.publicKey,
        );

        const escrowTokenAccountPublicKey = new PublicKey(escrowTokenAccount.address.toString());

        // Fetch or create the receiver's associated token account for USDC
        const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            escrowKeyPair,
            usdcMintAddress,
            userPublicKey,
            true, // Allow creating a token account for the receiver if it doesn't exist
        );

        const receiverTokenAccountPublicKey = new PublicKey(receiverTokenAccount.address.toString());
        
        // Transfer the reward to the user
        const amount = body.reward * 1000000;
        let transferIx = createTransferCheckedInstruction(
            escrowTokenAccountPublicKey,
            usdcMintAddress,
            receiverTokenAccountPublicKey,
            escrowPublicKey,
            amount,
            6
        );

        const transaction = new Transaction();

        transaction.add(transferIx);

        transaction.feePayer = escrowPublicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const transactionMessage = transaction.compileMessage();
        const transactionFee = (await connection.getFeeForMessage(transactionMessage)).value;

        if(!transactionFee) {
            return NextResponse.json({
                success: false,
                message: 'Can not calculate transaction fees'
            });
        }

        // Calculate equivalent USDC amount of the transaction fees
        const equivalentUSDCRes = await calculateEquivalentUSDC(transactionFee / 1000000000);
        const equivalentUSDCResObj = JSON.parse(equivalentUSDCRes);

        if(!equivalentUSDCResObj.success) {
            return NextResponse.json({
                success: false,
                message: `equivalent USDC calculation of normal transaction failed: ${equivalentUSDCResObj.message}`
            });
        }

        const transactionFeeInUSDC = equivalentUSDCResObj.equivalentUSDC;

        // Airdrop the required SOL for transaction
        const airdropRes = await AirdropSOL(transactionFee, userPublicKey);
        const airdropResObj = JSON.parse(airdropRes);

        if(!airdropResObj.success) {
            return NextResponse.json({
                success: false,
                message: `airdrop failed: ${airdropResObj.message}`
            });
        }

        const airdropTxFee = airdropResObj.transactionFee;

        // Calculate the transaction fees in equivalent USDC
        const airdropTxFeeInUSDCRes = await calculateEquivalentUSDC(airdropTxFee / 1000000000);
        const airdropTxFeeInUSDCResObj = JSON.parse(airdropTxFeeInUSDCRes);

        if(!airdropTxFeeInUSDCResObj.success) {
            return NextResponse.json({
                success: false,
                message: `equivalent USDC calculation of normal transaction failed: ${airdropTxFeeInUSDCResObj.message}`
            });
        }

        const airdropTxFeeInUSDC = airdropTxFeeInUSDCResObj.equivalentUSDC;

        const totalAmount = Math.round((body.reward - (transactionFeeInUSDC + airdropTxFeeInUSDC)) * 1000000) + 1;
        transferIx = createTransferCheckedInstruction(
            escrowTokenAccountPublicKey,
            usdcMintAddress,
            receiverTokenAccountPublicKey,
            escrowPublicKey,
            totalAmount,
            6
        );

        
        console.log("escrowPrivatekey: ", escrowPrivatekey); // TO REMOVE IN DEPLOYMENT

        const signature = await sendAndConfirmTransaction(connection, transaction, [escrowKeyPair]);

        console.log("The signature is: ", signature);

        return NextResponse.json({
            success: true,
            signature: signature
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        });
    }
}