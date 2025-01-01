import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'
import axios from "axios";
import { clusterApiUrl, Connection, PublicKey, sendAndConfirmTransaction, Signer, SystemProgram, Transaction } from "@solana/web3.js";

const prisma = new PrismaClient();
const connection = new Connection(clusterApiUrl("devnet"));

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        console.log("body", body);
        // Get the user from the database
        const user = await prisma.user.findUnique({
            where: {
                userId: body.creatorId
            }
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if the user has enough balance
        const response = await axios.post('https://solana-devnet.g.alchemy.com/v2/AlZpXuvewHz3Ty-rYFKn1Oc1kuMtDk8e', {
            jsonrpc: "2.0",
            id: 1,
            method: "getBalance",
            params: [user.publicKey]
        });

        console.log("balance: ", response.data.result.value/1000000000);

        if(response.data.result.value/1000000000 < body.totalReward){
            return NextResponse.json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        // Transfer the reward pool to escrow account from creator account
        const transferIx = SystemProgram.transfer({
            fromPubkey: new PublicKey(user.publicKey),
            toPubkey: new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn'),
            lamports: body.totalReward * 1000000000
        });

        const transaction = new Transaction();

        transaction.add(transferIx);

        transaction.feePayer = new PublicKey(user.publicKey);
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const signer: Signer = {
            publicKey: new PublicKey(user.publicKey),
            secretKey: user.privateKey
        };
        const signature = await sendAndConfirmTransaction(connection, transaction, [signer]);

        console.log("The signature is: ", signature);

        // Create a new task
        const newTask = await prisma.tasks.create({
            data: {
                creatorId: body.creatorId,
                title: body.title,
                description: body.description,
                imageUrl: body.imageUrl,
                link: body.link,
                rewardPerperson: body.rewardPerperson,
                totalReward: body.totalReward
            }
        });

        return NextResponse.json({
            success: true,
            createdTask: newTask
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        });
    }
}