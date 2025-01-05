import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import redis from "@/app/utils/redisClient";

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
        
        // Creating challenge for user and a unique key to map it
        const opts = await generateAuthenticationOptions({
            rpID: process.env.NEXT_PUBLIC_RPID
        });

        console.log("opts: ", opts);

        const loginChallenge = opts.challenge;
        // Store the challenge in redis
        await redis.set(`rr-loginChallenges:${body.email}`, loginChallenge);
        await redis.expire(`rr-loginChallenges:${body.email}`, 60);

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