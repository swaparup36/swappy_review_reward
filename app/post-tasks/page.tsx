"use client"

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreateTaskSchema } from '../scemas/passkeyReg';
import uploadProductImages from '../utils/uploader';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FileImage, UploadCloud } from 'lucide-react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';


const FormInput = ({ label, name, value, type, error, onChange, placeholder }: { label: string, name: string, value: string | number, type?: string, error?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string }) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-gray-800 ${
            error ? 'border-red-500' : 'border-gray-200'
          }`}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        {error && (
          <p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          </p>
        )}
      </div>
    );
};


function PostTasks() {
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<newTaskForm>({
        title: '',
        description: '',
        rewardPerPerson: 0,
        totalReward: 0,
        link: ''
    });
    const [errors, setErrors] = useState<Record<string, string> | null>(null);
    const [image, setImage] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        if(type === 'number'){
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
        }else{
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(!e.target.files) return console.log("no new file selected");

        const file = e.target.files[0];
        setImage(file);
    };


    const depositRequiredMoney = async() => {
      try {
        const user = localStorage.getItem('trr-suborg');
        if(!user) return console.log("User not loggedin");
        const userObj = JSON.parse(user);
        const userWalletAddress = userObj.wallet.accounts[0].address;

        console.log("user-wallet-address: ", userWalletAddress);

        if(!process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL || !process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID){
          return console.log("Environment variables are missing");
        }

        const connection = new Connection(
          "https://api.devnet.solana.com",
          "confirmed"
        );

        const organizationId = process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID;
    
        const turnkeyClient = new Turnkey({
          apiBaseUrl: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL!,
          apiPublicKey: process.env.NEXT_PUBLIC_TURNKEY_API_PUBLIC_KEY!,
          apiPrivateKey: process.env.NEXT_PUBLIC_TURNKEY_API_PRIVATE_KEY!,
          defaultOrganizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID,
        });

        const turnkeySigner = new TurnkeySigner({
          organizationId,
          client: turnkeyClient.apiClient(),
        });

        // const transaction = await createTransfer({
        //   fromAddress: userWalletAddress,
        //   toAddress: 'G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn',
        //   amount: 10000000,
        //   version: "legacy",
        // });

        const transaction = new Transaction();
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(userWalletAddress),
            toPubkey: new PublicKey('G92PADjSvNoqYtQZ8fKq5GigN5t7MAQmfa1iZQDtC3Qn'),
            lamports: 0.01 * LAMPORTS_PER_SOL
          })
        );

        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.feePayer = new PublicKey(userWalletAddress);

        console.log("orgid: ", process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID);
        
        const addsign = await turnkeySigner.signTransaction(transaction, userWalletAddress, process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID);
        console.log("addsign: ", addsign);

        // try {
        //   await turnkeySigner.signTransaction(transaction, userWalletAddress, process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID);
        // } catch (error: any) {
        //   await handleActivityError(turnkeyClient, error).then(
        //     (activity?: TActivity) => {
        //       if (!activity) {
        //         throw error;
        //       }
      
        //       const { r, s } = getSignatureFromActivity(activity);
        //       transaction.addSignature(
        //         new PublicKey(userWalletAddress),
        //         Buffer.from(`${r}${s}`, "hex")
        //       );
        //     }
        //   );
        // }

        const verified = (transaction as Transaction).verifySignatures();

        if (!verified) {
          throw new Error("unable to verify transaction signatures");
        }

        // 2. Broadcast the signed payload on devnet
        await broadcast(connection, transaction!);

        return {
          success: true,
          message: "transition succesfull"
        }
      } catch (error) {
        console.log("error: ", error);

        return {
          succes: false,
          message: "can't deposit money"
        }
      }
    }

    const onSubmit = async(e: React.FormEvent) => {
        e.preventDefault();

        const validationResult = CreateTaskSchema.safeParse(formData);
        if(!validationResult.success) {
            const fieldErrors = validationResult.error.flatten().fieldErrors;
            setErrors(
                Object.fromEntries(
                    Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0] || "Invalid field"])
                )
            );
            return console.log("zod error");
        }

        try {
            setIsSubmitting(true);
            try {
                if(!image) return console.log("image is not provied");

                let img_url = '';

                const uploadImgFormData = new FormData();
                uploadImgFormData.append('file', image);
                const uoloadImgRes = await uploadProductImages(uploadImgFormData);
                const uploadImgResObj = JSON.parse(uoloadImgRes);

                if(!uploadImgResObj.success){
                    return console.log("error uploading image: ", uploadImgResObj.error);
                }
                img_url = uploadImgResObj.imageURL;

                const userId = localStorage.getItem('rr-userid');

                // API call to post task
                const postTaskRes = await axios.post("/api/create-task", {
                    creatorId: userId,
                    title: formData.title,
                    description: formData.description,
                    imageUrl: img_url,
                    link: formData.link,
                    rewardPerperson: formData.rewardPerPerson,
                    totalReward: formData.totalReward
                });

                if(postTaskRes.status !== 200){
                    return console.log("error posting task");
                }

                router.push('/earn');
                
                console.log("new task to submit: ", formData);
            } catch (error) {
                console.error('Failed to post task:', error);
                throw error;
            } finally {
                setIsSubmitting(false);
            }
        } catch (error) {
          console.log('Form submission failed:', error);
        }
    };

    useEffect(()=>{
      if(!localStorage.getItem('rr-userid')){
        router.push('/start-earning');
      }
    }, []);

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-bold tracking-tight mb-8">
            <span className="text-black">POST</span>
            <br />
            <span className="text-gray-400">NEW TASK</span>
          </h1>

          <form onSubmit={onSubmit} className="space-y-6">
            <FormInput
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors?.title}
                placeholder="Enter task title"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <motion.textarea
                whileFocus={{ scale: 1.01 }}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter task details. Like rules, guidelines and all..."
                className={`w-full text-gray-800 px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all h-32 ${
                    errors?.description ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors?.description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-500"
                >
                  {errors?.description}
                </motion.p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Reward Per Person ($)"
                name="rewardPerPerson"
                value={formData.rewardPerPerson}
                onChange={handleChange}
                error={errors?.rewardPerPerson}
                placeholder="Enter reward per person"
                type="number"
              />

              <FormInput
                label="Total Reward ($)"
                name="totalReward"
                value={formData.totalReward}
                onChange={handleChange}
                error={errors?.totalReward}
                placeholder="Enter total reward"
                type="number"
              />
            </div>

            <FormInput
                label="Review Link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                error={errors?.link}
                placeholder="Enter the URL to be reviewed"
                type="text"
            />

            <div className='flex flex-col justify-between items-center h-[15svh] w-full'>
              <label htmlFor="image_input" className='flex w-full text-gray-400 font-semibold h-full justify-center items-center border-2 border-dashed cursor-pointer'>
                <input id='image_input' type="file" accept='.jpg, .jpeg, .png' onChange={handleImageChange} hidden/>
                {
                    !image &&
                    <>
                        <UploadCloud className='mr-2'/>
                        <p className='text-center'>Click here to upload Image</p>
                    </>
                }
                {
                    image &&
                    <>
                        <FileImage className='mr-2'/>
                        <p className='text-center'>{image.name}</p>
                    </>
                }
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {isSubmitting ? 'Posting...' : 'Post Task'}
            </motion.button>
          </form>

          <div className="text-sm font-mono mt-8 text-gray-500">
            <p>CREATE TASK / SET REWARDS</p>
            <p>REVIEW SUBMISSIONS / PAY REVIEWERS</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default PostTasks;