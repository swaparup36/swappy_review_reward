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

        // Check if task with same title already exists
        const existingTask = await prisma.tasks.findFirst({
            where: {
                title: body.title
            }
        });

        if(existingTask) {
            return NextResponse.json({
                success: false,
                message: 'Task with same title already exists'
            });
        }

        // Initialize the transaction and calculate the transaction fees
        let transferIx = SystemProgram.transfer({
            fromPubkey: new PublicKey(user.publicKey),
            toPubkey: new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn'),
            lamports: body.totalReward * 1000000000
        });

        const transaction = new Transaction();

        transaction.add(transferIx);

        transaction.feePayer = new PublicKey(user.publicKey);
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const transactionMessage = transaction.compileMessage();
        const transactionFee = (await connection.getFeeForMessage(transactionMessage)).value;

        if(!transactionFee) {
            return NextResponse.json({
                success: false,
                message: 'Can not calculate transaction fees'
            });
        }

        transferIx = SystemProgram.transfer({
            fromPubkey: new PublicKey(user.publicKey),
            toPubkey: new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn'),
            lamports: (body.totalReward * 1000000000) + transactionFee
        });

        // Check if the user has enough balance
        const response = await axios.post('https://solana-devnet.g.alchemy.com/v2/AlZpXuvewHz3Ty-rYFKn1Oc1kuMtDk8e', {
            jsonrpc: "2.0",
            id: 1,
            method: "getBalance",
            params: [user.publicKey]
        });

        console.log("balance: ", (response.data.result.value+transactionFee)/1000000000);

        if(response.data.result.value/1000000000 < body.totalReward){
            return NextResponse.json({
                success: false,
                message: 'Insufficient balance'
            });
        }


        // Now check if the place is findable through the api
        const placeIdRes = await axios.get(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${body.title}&inputtype=textquery&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`)

        if(placeIdRes.status !== 200){
            return NextResponse.json({
                success: false,
                message: 'place not found'
            });
        }

        let placeId: string | undefined;

        console.log("candidates: ", placeIdRes.data.candidates)
        
        for(const candidate of placeIdRes.data.candidates){
            const placeDetailsRes = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${candidate.place_id}&fields=name&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`);

            if(placeDetailsRes.status !== 200){
                return NextResponse.json({
                    success: false,
                    message: 'place not found'
                });
            }

            if(placeDetailsRes.data.result.name === body.title){
                placeId = candidate.place_id;
                break;
            }
        }

        if(!placeId) {
            return NextResponse.json({
                success: false,
                message: 'No place with the given name was found. Try with another place.'
            });
        }

        // Transfer the reward pool to escrow account from creator account
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