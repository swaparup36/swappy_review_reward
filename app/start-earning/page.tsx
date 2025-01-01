"use client"

import { motion } from 'framer-motion';
import { Key, Lock } from 'lucide-react';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface authOptions {
    title: string,
    description: string,
    onClick: React.MouseEventHandler<HTMLDivElement>,
    icon: string
}

const AuthOption = ({ title, description, onClick, icon }: authOptions) => {
    return (
      <div 
        className="w-full bg-white border-2 border-black p-6 rounded-lg hover:bg-gray-50 transition-colors"
        onClick={onClick}
      >
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex items-center">
            <div className="flex-shrink-0">
                {
                    icon === "Key" &&
                    <>
                        <Key className="h-8 w-8 text-black" />
                    </>   
                }
                {
                    icon !== "Key" &&
                    <>
                        <Lock className="h-8 w-8 text-black" />
                    </>
                }
            </div>
            <div className="ml-4 text-left">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
            </div>
        </motion.button>
      </div>
    );
};

function StartEarning() {
  const router = useRouter();

  useEffect(()=>{
    if(localStorage.getItem("rr-userid")) {
      router.push("/earn");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center bg-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-md mx-auto">
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            >
            <h1 className="text-5xl font-bold tracking-tight mb-8">
                <span className="text-black">CREATE</span>
                <br />
                <span className="text-gray-400">ACCOUNT</span>
            </h1>

            <div className="space-y-6">
                <AuthOption
                  title="Register with Passkey"
                  description="Use your device's biometric authentication"
                  onClick={()=>router.push('/passkey-registration')}
                  icon="Key"
                />

                <AuthOption
                  title="Continue with Google"
                  description="Use your Google account"
                  onClick={()=>router.push('/passkey-registration')}
                  icon="Lock"
                />

                <div className="text-sm font-mono mt-8 text-gray-500">
                  <p>SECURE AUTHENTICATION / MODERN STANDARDS</p>
                  <p>PRIVACY FOCUSED / USER FRIENDLY</p>
                </div>

                <div className='flex justify-center items-center'>
                  <p>Already have account? <Link href='/signin' className='underline text-blue-500'>Sign in</Link></p>
                </div>
            </div>
            </motion.div>
        </div>
      </div>
    </div>
  )
}

export default StartEarning