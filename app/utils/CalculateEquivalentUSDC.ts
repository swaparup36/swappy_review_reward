import axios from "axios";
import * as dotenv from "dotenv";


dotenv.config();

export default async function calculateEquivalentUSDC (solAmount: number) {
    if(!process.env.API_NINJA_API_KEY) {
        return JSON.stringify({
            status: false,
            message: "api ninja API key not found"
        });
    }

    console.log("api key: ", process.env.API_NINJA_API_KEY);
    const response = await axios.get('https://api.api-ninjas.com/v1/cryptoprice?symbol=SOLUSDC', {
        headers: {
            'X-Api-Key': process.env.API_NINJA_API_KEY
        }
    });

    console.log("get SOLUSDC: ", response.data);
    
    if(response.status !== 200) {
        return JSON.stringify({
            status: false,
            message: "Can not get USDC exchange rate"
        });
    }

    const solToUSDCExchangeRate = response.data.price;

    return JSON.stringify({
        success: true,
        equivalentUSDC: solAmount * solToUSDCExchangeRate
    });
}