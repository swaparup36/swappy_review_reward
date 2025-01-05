import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
// import { Redis } from 'ioredis';
import redis from "@/app/utils/redisClient";

const prisma = new PrismaClient();
// const client = new Redis(process.env.REDIS_URL);

export async function GET(){
    try {
        // First check if tasks exists in redis
        const tasksFromCache = await redis.get('alltasks');

        if(tasksFromCache){
            return NextResponse.json({
                success: true,
                tasks: JSON.parse(tasksFromCache)
            });
        }

        // Getting all tasks from the database
        const allTasks = await prisma.tasks.findMany();

        // Setting all taks to redis
        await redis.set('alltasks', JSON.stringify(allTasks));
        await redis.expire('alltasks', 10);

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