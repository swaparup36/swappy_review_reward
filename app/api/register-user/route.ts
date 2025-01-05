import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { PrismaClient } from "@prisma/client";
import { Keypair } from "@solana/web3.js";
import redis from "@/app/utils/redisClient";

const prisma = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        // check if environment variables are present or not
        if(!process.env.PASSKEY_AUTH_EXPECTED_RPID || !process.env.PASSKEY_AUTH_EXPECTED_ORIGIN) {
            return NextResponse.json({
                success: false,
                message: "env variables are missing"
            });
        }

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
            expectedOrigin: process.env.PASSKEY_AUTH_EXPECTED_ORIGIN,
            expectedRPID: process.env.PASSKEY_AUTH_EXPECTED_RPID,
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