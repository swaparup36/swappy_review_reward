import { NextRequest, NextResponse } from "next/server";
import { clusterApiUrl, Connection, PublicKey, sendAndConfirmTransaction, Signer, SystemProgram, Transaction } from "@solana/web3.js";
import pkg from 'bs58';

const connection = new Connection(clusterApiUrl("devnet"));
const { decode } = pkg;

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        console.log("body: ", body);
        const userPublicKey = new PublicKey(body.userPublicKey);
        
        // Transfer the reward to the user
        const transferIx = SystemProgram.transfer({
            fromPubkey: new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn'),
            toPubkey: userPublicKey,
            lamports: body.reward * 1000000000
        });

        const transaction = new Transaction();

        transaction.add(transferIx);

        transaction.feePayer = new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn');
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        if(!process.env.ESCROW_PRIVATE_KEY){
            return NextResponse.json({
                success: false,
                message: 'Escrow private key not found'
            });
        }

        const escrowPrivatekey = decode(process.env.ESCROW_PRIVATE_KEY);
        console.log("escrowPrivatekey: ", escrowPrivatekey);

        const signer: Signer = {
            publicKey: new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn'),
            secretKey: escrowPrivatekey
        };
        const signature = await sendAndConfirmTransaction(connection, transaction, [signer]);

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