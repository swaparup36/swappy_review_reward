import { NextResponse } from "next/server";

export async function POST(){
    try {
        // Getting the current Unix timestamp
        const currentTimestamp = Math.floor(Date.now() / 1000);

        console.log("current timestamp created: ", currentTimestamp);

        // Sending the challenge Payload as options
        return NextResponse.json({
            success: true,
            currentTimestamp: currentTimestamp
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        });
    }
}