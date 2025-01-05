import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient()

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

        if(!user.password) {
            return NextResponse.json({
                success: false,
                message: "User is not email authenticated"
            });
        }
        // Matching the password hash with the user provided password
        const isPasswordMatch = await bcrypt.compare(body.password, user.password);

        if(!isPasswordMatch) {
            return NextResponse.json({
                success: false,
                message: "Password is incorrect"
            });
        }

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