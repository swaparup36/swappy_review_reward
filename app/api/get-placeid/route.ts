import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();
    console.log("body: ", body.placeName);
    try {
        const placeIdRes = await axios.get(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${body.placeName}&inputtype=textquery&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`)

        if(placeIdRes.status !== 200){
            return NextResponse.json({
                success: false,
                message: 'place not found'
            });
        }

        console.log("candidates: ", placeIdRes.data.candidates);

        let placeId = '';

        for(const candidate of placeIdRes.data.candidates){
            const placeDetailsRes = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${candidate.place_id}&fields=name&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`);

            if(placeDetailsRes.status !== 200){
                return NextResponse.json({
                    success: false,
                    message: 'place not found'
                });
            }

            if(placeDetailsRes.data.result.name === body.placeName){
                placeId = candidate.place_id;
                break;
            }
        }

        const placeReviewsRes = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&reviews_sort=newest`)

        if(placeReviewsRes.status !== 200){
            return NextResponse.json({
                success: false,
                message: 'reviews not found'
            });
        }

        // console.log("reviews: ", placeReviewsRes.data.result.reviews);
        const reviews = placeReviewsRes.data.result.reviews;

        return NextResponse.json({
            success: true,
            reviews: reviews
        })
    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: 'error occured'
        })
    }
}