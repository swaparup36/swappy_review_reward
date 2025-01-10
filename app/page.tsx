"use client"

import { motion } from 'framer-motion';
import Image from "next/image";
import Link from 'next/link';
import Footer from './components/Footer';
import Navbar from './components/Navbar';

const Hero = () => {
  return (
    <div className="min-h-screen flex items-center bg-white md:pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
                <span className="text-black">EARN CRYPTO</span>
                <br />
                <span className="text-gray-400">FROM REVIEWS</span>
              </h1>
              
              <div className="mt-8 space-y-2 text-sm font-mono text-gray-500">
                <p>REVIEW PLACES AND SHARE YOUR EXPERIENCE ON GOOGLE MAPS</p>
                <p></p>
                <p>EARN REWARDS ON CAMPAIGN</p>
              </div>

              <div className='mt-5 space-y-2 font-mono w-fit flex justify-center items-center'>
                <Link href={'/start-earning'} className='bg-white border-[5px] border-gray-800 p-1'>
                  <p className='bg-gray-800 text-white border-2 border-gray-800 text-[1rem] px-4 py-1 font-semibold'>Start Earning &#8599;</p>
                </Link>
              </div>
            </motion.div>
          </div>
          
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <Image width={500} height={500} src="/image/hero_img.png" alt="hero-image" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};


function Landing() {
  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <Footer />
    </div>
  );
}

export default Landing;