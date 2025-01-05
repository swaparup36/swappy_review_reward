import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { PrismaClient } from "@prisma/client";
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const client = new Redis();

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        // Getting user from database
        const user = await prisma.user.findUnique({
            where: {
                email: body.email
            }
        });

        // If user does not exist then return
        if(!user) {
            return NextResponse.json({
                success: false,
                message: "User does not exist"
            });
        }

        // Finding and Verifying the passkey challenge
        const challenge = await client.get(`rr-loginChallenges:${body.email}`);

        console.log("expected Challenge: ", challenge);

        if(!challenge) {
            return NextResponse.json({
                success: false,
                message: "Challenge not found"
            });
        }

        if(!user.passkey) {
            return NextResponse.json({
                success: false,
                message: "Passkey not found"
            });
        }

        const passkey = JSON.parse(user?.passkey);
        const publicKeyUint8Array = new Uint8Array(Object.values(passkey.credential.publicKey));
        console.log("cred: ", body.cred);

        const result = await verifyAuthenticationResponse({
            expectedChallenge: challenge,
            expectedOrigin: 'http://localhost:3000',
            expectedRPID: 'localhost',
            response: body.cred,
            credential: {
                id: passkey.credential.id,
                counter: passkey.credential.counter,
                publicKey: publicKeyUint8Array,
                transports: passkey.credential.transports
            }
        })
        console.log("verification result: ", result);
        // If not verified then return
        if (!result.verified) return NextResponse.json({ success: false, message: 'not verified' })

        // Sending userid to the user
        return NextResponse.json({
            success: true,
            userId: user?.userId,
            publicKey: user?.publicKey
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: error
        });
    }
}