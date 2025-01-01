"use server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as dotenv from "dotenv";
dotenv.config();

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_KEY_ID!,
    },
});

const bucketName = process.env.S3_BUCKET_NAME;

export default async function uploadProductImages(formData: FormData) {
    try {
      const file = formData.get('file') as File | null;
      if(!file) return JSON.stringify({ success: false, error: 'File not provided' });

      let imageURL = '';

      console.log(file.name);

      const fileExtension = file.name.toLowerCase().split('.')[file.name.toLowerCase().split('.').length-1];

      if (fileExtension === "png" || fileExtension === "jpg" ||  fileExtension === "jpeg") {
          const buffer = Buffer.from(await file.arrayBuffer());
  
          // Configure the upload parameters
          const uploadParams = {
              Bucket: bucketName,
              Key: file.name,
              Body: buffer,
              ContentType: `image/${fileExtension}`,
          };
      
          // Upload the file
          const data = await s3Client.send(new PutObjectCommand(uploadParams));

          console.log("Upload successful: ", data);

          const signedUrl = `https://onestop-vyapar.s3.ap-south-1.amazonaws.com/${file.name}`;
          imageURL = signedUrl;
      }else{
          return JSON.stringify({ success: false, error: "Only .png, .jpg, .jpeg files are allowed"});
      }

      return JSON.stringify({ success: true, message: 'File upload to object store', imageURL: imageURL });
    } catch (error) {
      console.error("Error uploading Image:", error);
      return JSON.stringify({ success: false, error: error });
    }
}