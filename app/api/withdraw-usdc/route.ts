import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { PrismaClient } from "@prisma/client";
import { createTransferCheckedInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import AirdropSOL from "@/app/utils/Airdrop";
import PayComission from "@/app/utils/PayComission";

const connection = new Connection(clusterApiUrl("devnet"));
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


        if(!process.env.ESCROW_PRIVATE_KEY){
            return NextResponse.json({
                success: false,
                message: 'Escrow private key not found'
            });
        }

        const userPublicKey = new PublicKey(user.publicKey);
        // const escrowPrivatekey = decode(process.env.ESCROW_PRIVATE_KEY);
        const usdcMintAddress = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
        // const escrowPublicKey = new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn');
        // const escrowKeyPair = Keypair.fromSecretKey(
        //     escrowPrivatekey
        // )
        const receiverPublicKey = new PublicKey(body.address);
        const userKeyPair = Keypair.fromSecretKey(user.privateKey);

        // Check if user has enough USDC to withdraw
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
        console.log("reqested amount: ", body.amount);

        if((usdcBalance)/1000000 < body.amount){
            return NextResponse.json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        // Transfer the USDC to user's entered wallet

        // Airdrop 20000 SOL to user
        const airdropRes = await AirdropSOL(20000, userPublicKey);
        const airdropResObj = JSON.parse(airdropRes);

        if(!airdropResObj.success) {
            return NextResponse.json({
                success: false,
                message: `airdrop failed: ${airdropResObj.message}`
            });
        }

        // Fetch the sender's USDC token account
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            userKeyPair,
            usdcMintAddress,
            userPublicKey,
            true
        );

        const userTokenAccountPublicKey = new PublicKey(userTokenAccount.address.toString());

        // Fetch or create the receiver's associated token account for USDC
        const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            userKeyPair,
            usdcMintAddress,
            receiverPublicKey,
            true, // Allow creating a token account for the receiver if it doesn't exist
        );

        const receiverTokenAccountPublicKey = new PublicKey(receiverTokenAccount.address.toString());

        // Transfer the comission to the escrow
        const comissionAmount = ((body.amount*0.05) * 1000000);
        const transferComissionRes = await PayComission(comissionAmount, userKeyPair);
        const transferComissionObj = JSON.parse(transferComissionRes);

        console.log("transferComissionObj: ", transferComissionObj);

        if(!transferComissionObj.success) {
            return NextResponse.json({
                success: false,
                message: `comission payment failed: ${transferComissionObj.message}`
            });
        }

        const amount = ((body.amount - (body.amount*0.05)) * 1000000);
        const transferIx = createTransferCheckedInstruction(
            userTokenAccountPublicKey,
            usdcMintAddress,
            receiverTokenAccountPublicKey,
            userPublicKey,
            amount,
            6
        );

        const transaction = new Transaction();

        transaction.add(transferIx);

        transaction.feePayer = new PublicKey(body.publicKey);
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const userPrivateKey = user.privateKey;
        console.log("user privateKey: ", userPrivateKey);

        const signature = await sendAndConfirmTransaction(connection, transaction, [userKeyPair]);

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