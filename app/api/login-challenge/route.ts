import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        // Creating challenge for user and a unique key to map it
        const opts = await generateAuthenticationOptions({
            rpID: 'localhost'
        });

        console.log("opts: ", opts);

        // Check if challenge exists with same email
        const existingChallenge = await prisma.loginChallenges.findFirst({
            where: {
                email: body.email
            }
        });

        if(existingChallenge) {
            // Delete the challenge if it exists
            await prisma.loginChallenges.delete({
                where: {
                    id: existingChallenge.id
                }
            });
        }

        // Store the challenge in the login challenge store
        const loginChallenge = await prisma.loginChallenges.create({
            data: {
                email: body.email,
                challenge: opts.challenge
            }
        });

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