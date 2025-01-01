import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(){
    try {
        // Getting all tasks from the database
        const allTasks = await prisma.tasks.findMany();

        return NextResponse.json({
            success: true,
            tasks: allTasks
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        });
    }
}