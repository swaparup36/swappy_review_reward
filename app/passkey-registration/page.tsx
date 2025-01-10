"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { passkeyRegistrationSchema } from '../scemas/passkeyReg';
import { startRegistration } from '@simplewebauthn/browser';
import { ToastContainer, toast } from 'react-toastify';

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

function PassKeyRegistration() {
    const router = useRouter();

    const [formData, setFormData] = useState({
      username: '',
      displayName: '',
      email: ''
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string> | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      const validationResult = passkeyRegistrationSchema.safeParse(formData);
      if(!validationResult.success) {
        const fieldErrors = validationResult.error.flatten().fieldErrors;
        setErrors(
          Object.fromEntries(
            Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0] || "Invalid field"])
          )
        );
        setIsSubmitting(false);
        return console.log("zod error");
      }
      
      try {
        console.log('Registering with passkey:', formData);
    
        // Call passkey reg api
        const createChallengeResponse = await axios.post("/api/register-challenge", {
          email: formData.email,
          username: formData.username
        });

        if(!createChallengeResponse.data.success){
          setIsSubmitting(false);
          toast.error(`error: ${createChallengeResponse.data.message}`);
          return console.log("error creating challenge");
        }

        const options = createChallengeResponse.data.options;

        options.user.displayName = formData.displayName;
        options.user.name = formData.username;
        console.log("options: ", options);

        // Ensure the user property is defined and has the required fields
        if (!options.user || !options.user.displayName || !options.user.id || !options.user.name) {
          setIsSubmitting(false);
          return console.log("error: user property is missing or incomplete in options");
        }

        const authenticationResult = await startRegistration({optionsJSON: options});

        console.log("authenticationResult: ", authenticationResult);

        const registerResponse = await axios.post("/api/register-user", {
          displayname: formData.displayName,
          email: formData.email,
          username: formData.username,
          cred: authenticationResult
        });

        if(!registerResponse.data.success){
          setIsSubmitting(false);
          toast.error(`error: ${registerResponse.data.message}`);
          return console.log("error registering user");
        }

        console.log("userid: ", registerResponse.data);
        const userId = registerResponse.data.newUser.userId;
        localStorage.setItem('rr-userid', userId);

        const publickey = registerResponse.data.newUser.publicKey;
        localStorage.setItem('rr-publickey', publickey);

        router.push('/earn');

      } catch (error) {
        console.error('Registration failed:', error);
      }

      setIsSubmitting(false);
    };

    useEffect(()=>{
        if(localStorage.getItem("rr-userid")) {
          router.push("/earn");
        }
    }, []);

  return (
    <>
      <ToastContainer />
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
                <span className="text-gray-400">REGISTRATION</span>
              </h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  error={errors?.username}
                  placeholder="Enter your username"
                />

                <FormInput
                  label="Display Name"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  error={errors?.displayName}
                  placeholder="Enter your display name"
                />

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
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Loading..." : "Continue with Passkey"}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PassKeyRegistration;