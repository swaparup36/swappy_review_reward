import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Keypair } from "@solana/web3.js";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        // Generate hash of the password
        const passwordHash = await bcrypt.hash(body.password, 10);

        // Create keypair
        const keypair = Keypair.generate();

        // Creating a new user in the database
        const newUser = await prisma.user.create({
            data: {
                displayname: body.displayname,
                email: body.email,
                username: body.username,
                password: passwordHash,
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