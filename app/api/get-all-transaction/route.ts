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
            params: [user?.publicKey]
        });

        if(transactionResponse.status !== 200){
            return NextResponse.json({
                success: false,
                message: "Unable to get transactions"
            });
        }

        const allTransactions = transactionResponse.data.result.splice(0, 5);

        return NextResponse.json({
            success: true,
            transactions: allTransactions
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        });
    }
}