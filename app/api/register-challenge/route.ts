import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from '@simplewebauthn/server';
// import { Redis } from 'ioredis';
import redis from "@/app/utils/redisClient";

// const redis = new Redis(process.env.REDIS_URL);

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        // Creating a challenge for the user
        const challengePayload = await generateRegistrationOptions({
            rpID: 'localhost',
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