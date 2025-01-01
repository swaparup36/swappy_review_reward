import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import pkg from 'bs58';
import { clusterApiUrl, Connection, PublicKey, sendAndConfirmTransaction, Signer, SystemProgram, Transaction } from "@solana/web3.js";
import { PrismaClient } from "@prisma/client";

const connection = new Connection(clusterApiUrl("devnet"));
const { decode } = pkg;
const prisma = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();
    console.log("body: ", body);
    try {
        // Get the user from the database
        const user = await prisma.user.findFirst({
            where: {
                userId: body.userId
            }
        });

        if(!user){
            return NextResponse.json({
                success: false,
                message: 'No user found'
            }); 
        }

        // Check if user has enough SOL to withdraw
        const response = await axios.post('https://solana-devnet.g.alchemy.com/v2/AlZpXuvewHz3Ty-rYFKn1Oc1kuMtDk8e', {
            jsonrpc: "2.0",
            id: 1,
            method: "getBalance",
            params: [body.publicKey]
        });

        console.log("balance: ", response.data.result.value/1000000000);
        console.log("reqested amount: ", body.amount);

        if(response.data.result.value/1000000000 < body.amount){
            return NextResponse.json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        // Transfer the SOL to user's entered wallet
        const transferIx = SystemProgram.transfer({
            fromPubkey: new PublicKey(body.publicKey),
            toPubkey: new PublicKey(body.address),
            lamports: body.amount * 1000000000
        });

        const transaction = new Transaction();

        transaction.add(transferIx);

        transaction.feePayer = new PublicKey(body.publicKey);
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const userPrivateKey = user.privateKey;
        console.log("user privateKey: ", userPrivateKey);

        const signer: Signer = {
            publicKey: new PublicKey(body.publicKey),
            secretKey: userPrivateKey
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