import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { Redis } from 'ioredis';

const client = new Redis();

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        // Creating challenge for user and a unique key to map it
        const opts = await generateAuthenticationOptions({
            rpID: 'localhost'
        });

        console.log("opts: ", opts);

        const loginChallenge = opts.challenge;
        // Store the challenge in redis
        await client.set(`rr-loginChallenges:${body.email}`, loginChallenge);
        await client.expire(`rr-loginChallenges:${body.email}`, 60);

        console.log("login challenge created: ", loginChallenge);

        // Sending the challenge Payload as options
        return NextResponse.json({
            success: true,
            options: opts
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        });
    }
}