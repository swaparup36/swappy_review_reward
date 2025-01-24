import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        const user = await prisma.user.findFirst({
            where: {
                userId: body.userId
            }
        });

        if(!user){
            return NextResponse.json({
                success: false,
                message: "No user found"
            });
        }

        const transactionResponse = await axios.post("https://solana-devnet.g.alchemy.com/v2/AlZpXuvewHz3Ty-rYFKn1Oc1kuMtDk8e", {
            jsonrpc: "2.0",
            id: 1,
            method: "getSignaturesForAddress",
            params: [
                user?.publicKey,
                {
                    limit: 10
                }
            ]
        });

        if(transactionResponse.status !== 200){
            return NextResponse.json({
                success: false,
                message: "Unable to get transactions"
            });
        }

        const allTransactions = transactionResponse.data.result;

        const usdcTransactions = [];

        // Filtering transaction that is of type USDC transfer
        for (const transaction of allTransactions) {
            const transactionResponse = await axios.post("https://solana-devnet.g.alchemy.com/v2/AlZpXuvewHz3Ty-rYFKn1Oc1kuMtDk8e", {
                jsonrpc: "2.0",
                id: 1,
                method: "getTransaction",
                params: [
                    transaction.signature,
                    { 
                        encoding: "jsonParsed",
                        maxSupportedTransactionVersion: 0
                    },
                ],
            });

            const tx = transactionResponse.data.result;

            const tokenTransfers = tx.meta?.postTokenBalances || [];
            const usdcTransfer = tokenTransfers.find(
                (balance) => balance.mint === "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
            );

            if (usdcTransfer) {
                usdcTransactions.push({
                    signature: transaction.signature,
                    slot: transaction.slot,
                    blockTime: transaction.blockTime,
                    transferInfo: usdcTransfer,
                    err: transaction.err,
                    memo: transaction.memo,
                    confirmationStatus: transaction.confirmationStatus
                });
            }
        }

        return NextResponse.json({
            success: true,
            transactions: usdcTransactions
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        });
    }
}