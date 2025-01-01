import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

        // Check if challenge exists with same email
        const existingRegChallenge = await prisma.registrationChallenges.findFirst({
            where: {
                email: body.email
            }
        });

        if(existingRegChallenge) {
            // Delete the challenge if it exists
            await prisma.registrationChallenges.delete({
                where: {
                    id: existingRegChallenge.id
                }
            });
        }

        // Storing that challenge in temp memory
        const regChallenge = await prisma.registrationChallenges.create({
            data: {
                email: body.email,
                challenge: challengePayload.challenge
            }
        });

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