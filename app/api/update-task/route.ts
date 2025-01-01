import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(req: NextRequest){
    const body = await req.json();
    try {
        const updatedTask = await prisma.tasks.update({
            data: {
                participants: body.participants
            },
            where: {
                taskId: body.taskId
            }
        })

        return NextResponse.json({
            success: true,
            updatedTask: updatedTask
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        });
    }
}