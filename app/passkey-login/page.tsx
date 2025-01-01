"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { passkeyLoginSchema } from '../scemas/passkeyReg';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

const FormInput = ({ label, name, value, type, error, onChange, placeholder }: { label: string, name: string, value: string, type?: string, error?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string }) => {
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

function PasskeyLogin() {
    const router = useRouter();

    const [formData, setFormData] = useState({
      email: ''
    });

    const [errors, setErrors] = useState<Record<string, string> | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      const validationResult = passkeyLoginSchema.safeParse(formData);
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
        console.log('Login with passkey:', formData);
    
        // Call passkey login api
        const createChallengeResponse = await axios.post("/api/login-challenge", {
          email: formData.email
        });

        if(!createChallengeResponse.data.success){
          return console.log("error creating challenge");
        }

        const options = createChallengeResponse.data.options;

        console.log("options: ", options);

        const authenticationResult = await startAuthentication({optionsJSON: options});

        console.log("authenticationResult: ", authenticationResult);

        const loginResponse = await axios.post("/api/login-user", {
          email: formData.email,
          cred: authenticationResult
        });

        if(!loginResponse.data.success){
          return console.log("error login user: ", loginResponse.data.message);
        }

        console.log("userid: ", loginResponse.data);
        const userId = loginResponse.data.userId;
        localStorage.setItem('rr-userid', userId);
        
        const publicKey = loginResponse.data.publicKey;
        console.log("first publicKey: ", publicKey);
        localStorage.setItem('rr-publickey', publicKey);

        router.push('/earn');

      } catch (error) {
        console.error('Registration failed:', error);
      }
    };

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
              <span className="text-black">PASSKEY</span>
              <br />
              <span className="text-gray-400">SIGN IN</span>
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors?.userEmail}
                placeholder="Enter your email"
              />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Continue with Passkey
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default PasskeyLogin;