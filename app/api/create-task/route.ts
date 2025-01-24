import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'
import axios from "axios";
import { clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { createTransferCheckedInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import pkg from 'bs58';
import calculateEquivalentUSDC from "@/app/utils/CalculateEquivalentUSDC";
import AirdropSOL from "@/app/utils/Airdrop";
import PayComission from "@/app/utils/PayComission";

const prisma = new PrismaClient();
const connection = new Connection(clusterApiUrl("devnet"));
const { decode } = pkg;

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

        if(!process.env.ESCROW_PRIVATE_KEY){
            return NextResponse.json({
                success: false,
                message: 'Escrow private key not found'
            });
        }

        const escrowPrivatekey = decode(process.env.ESCROW_PRIVATE_KEY);
        const usdcMintAddress = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
        const escrowPublicKey = new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn');
        const escrowKeyPair = Keypair.fromSecretKey(
            escrowPrivatekey
        );
        const userPublicKey = new PublicKey(user.publicKey);
        const userKeyPair = Keypair.fromSecretKey(user.privateKey);

        // Fetch the sender's USDC token account
        const escrowTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            escrowKeyPair,
            usdcMintAddress,
            escrowPublicKey,
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

        console.log("receiverTokenAccount publicKey: ", receiverTokenAccountPublicKey);

        // Initialize the transaction and calculate the transaction fees
        const amount = body.totalReward * 1000000
        let transferIx = createTransferCheckedInstruction(
            receiverTokenAccountPublicKey,
            usdcMintAddress,
            escrowTokenAccountPublicKey,
            userPublicKey,
            amount,
            6
        );

        const transaction = new Transaction();

        transaction.add(transferIx);

        transaction.feePayer = userPublicKey;
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

        console.log("equivalentUSDCResObj: ", equivalentUSDCResObj);

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

        console.log("airdropResObj: ", airdropResObj);

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

        const finalAmount = Math.round((body.totalReward - (transactionFeeInUSDC + airdropTxFeeInUSDC)) * 1000000) + 1;
        transferIx = createTransferCheckedInstruction(
            receiverTokenAccountPublicKey,
            usdcMintAddress,
            escrowTokenAccountPublicKey,
            userPublicKey,
            finalAmount,
            6
        );

        // console.log("escrowPrivatekey: ", escrowPrivatekey); // TO REMOVE IN DEPLOYMENT

        // Check if the user has enough balance
        const response = await axios.post(
            "https://solana-devnet.g.alchemy.com/v2/AlZpXuvewHz3Ty-rYFKn1Oc1kuMtDk8e",
            {
              jsonrpc: "2.0",
              id: 1,
              method: "getTokenAccountsByOwner",
              params: [
                userPublicKey,
                {
                  mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
                },
                {
                  encoding: "jsonParsed"
                }
              ],
            }
        );

        if(response.data.result.value.length === 0){
            return NextResponse.json({
                success: false,
                message: 'no USDC in your account'
            });
        }

        const usdcBalance = response.data.result.value[0].account.data.parsed.info.tokenAmount.amount;

        console.log("USDC balance: ", (usdcBalance)/1000000);

        if(response.data.result.value/1000000 < (body.totalReward + (body.totalReward*0.05))){
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
        const signature = await sendAndConfirmTransaction(connection, transaction, [userKeyPair]);

        console.log("The signature of reward pool transfer is: ", signature);

        // Transfer the comission to the escrow
        const transferComissionRes = await PayComission((body.totalReward*0.05 * 1000000), userKeyPair);
        const transferComissionObj = JSON.parse(transferComissionRes);

        if(!transferComissionObj.success) {
            return NextResponse.json({
                success: false,
                message: `comission payment failed: ${transferComissionObj.message}`
            });
        }

        console.log("The signature of comission transfer is: ", transferComissionObj.signature);

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