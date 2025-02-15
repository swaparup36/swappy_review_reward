import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from '@simplewebauthn/server';
import redis from "@/app/utils/redisClient";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        // check if environment variables are present or not
        if(!process.env.NEXT_PUBLIC_RPID) {
            return NextResponse.json({
                success: false,
                message: "env variables are missing"
            });
        }

        // Check if an user with that emailId and username already exists
        const existingUserWithEmail = await prisma.user.findUnique({
            where: {
                email: body.email,
            }
        });
        const existingUserWithUsername = await prisma.user.findUnique({
            where: {
                username: body.username,
            }
        });

        if(existingUserWithEmail || existingUserWithUsername) {
            return NextResponse.json({
                success: false,
                message: 'an user with this email or username already exists'
            });
        }

        // Creating a challenge for the user
        const challengePayload = await generateRegistrationOptions({
            rpID: process.env.NEXT_PUBLIC_RPID,
            rpName: 'My Localhost Machine',
            attestationType: 'none',
            userName: body.username,
            timeout: 30_000,
        });

        console.log(challengePayload.challenge)

        console.log("email: ", body);

        const regChallenge = challengePayload.challenge;

        // Storing the registraion challenge in a redis
        await redis.set(`rr-registrationChallenges:${body.email}`, regChallenge);
        // Setting the expiry
        await redis.expire(`rr-registrationChallenges:${body.email}`, 60);

        console.log("signup challenge created: ", regChallenge);

        // Sending the challenge Payload as options
        return NextResponse.json({
            success: true,
            options: challengePayload
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        });
    }
}