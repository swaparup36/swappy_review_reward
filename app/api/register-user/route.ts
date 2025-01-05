import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { PrismaClient } from "@prisma/client";
import { Keypair } from "@solana/web3.js";
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        // Getting the passkey challenge from redis
        const challenge = await redis.get(`rr-registrationChallenges:${body.email}`);

        console.log("expected challenge: ", challenge);

        if(!challenge) {
            return NextResponse.json({
                success: false,
                message: "Challenge not found"
            });
        }

        const verificationResult = await verifyRegistrationResponse({
            expectedChallenge: challenge,
            expectedOrigin: 'http://localhost:3000',
            expectedRPID: 'localhost',
            response: body.cred,
        });

        // If verification failed then return
        if (!verificationResult.verified) return NextResponse.json({ success: false, message: 'could not verify' });

        // Create keypair
        const keypair = Keypair.generate();
        

        // Creating a new user in the database
        const newUser = await prisma.user.create({
            data: {
                displayname: body.displayname,
                email: body.email,
                username: body.username,
                passkey: JSON.stringify(verificationResult.registrationInfo),
                publicKey: keypair.publicKey.toString(),
                privateKey: keypair.secretKey,
                isPassKeyAuth: true
            }
        });

        // Sending the new user
        return NextResponse.json({
            success: true,
            newUser: newUser
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        });
    }
}