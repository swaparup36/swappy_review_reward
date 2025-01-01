import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest){
    const body = await req.json();
    try {
        await prisma.tasks.delete({
            where: {
                taskId: body.taskId
            }
        })

        return NextResponse.json({
            success: true
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        });
    }
}