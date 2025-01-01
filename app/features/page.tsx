"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, LayoutDashboard, Shield, StickyNote, UserCheck, Wallet } from 'lucide-react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

type FeatureType = {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
}

const features: FeatureType[] = [
    {
      id: 1,
      title: 'Secure Wallet Integration',
      description: 'Manage your Solana tokens securely with our integrated wallet system.',
      icon: <Wallet />
    },
    {
      id: 2,
      title: 'Passkey Authentication',
      description: 'Experience passwordless login with modern passkey authentication.',
      icon: <UserCheck />
    },
    {
      id: 3,
      title: 'Task Management',
      description: 'Post and manage review tasks with our intuitive task system.',
      icon: <Briefcase />
    },
    {
      id: 4,
      title: 'Insightful Blog',
      description: 'Stay updated with the latest news and insights in our blog.',
      icon: <StickyNote />
    },
    {
      id: 5,
      title: 'Enhanced Security',
      description: 'Your data is protected with state-of-the-art security measures.',
      icon: <Shield />
    },
    {
      id: 6,
      title: 'Analytics Dashboard',
      description: 'Track your earnings and performance with detailed analytics.',
      icon: <LayoutDashboard />
    }
];

const FeatureCard = ({ feature, index }: { feature: FeatureType, index: number }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition-shadow"
      >
        <div className="text-3xl mb-4">{feature.icon}</div>
        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
        <p className="text-gray-600">{feature.description}</p>
      </motion.div>
    );
};


const FeatureGrid = () => {  
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            index={index}
          />
        ))}
      </div>
    );
};

const FeatureHero = () => {
    return (
      <div className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold tracking-tight mb-8">
              <span className="text-white">POWERFUL</span>
              <br />
              <span className="text-gray-400">FEATURES</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover the tools and capabilities that make our platform unique
            </p>
          </motion.div>
        </div>
      </div>
    );
};

const FeaturePage = () => {
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-white pt-16">
        <FeatureHero />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <FeatureGrid />
        </div>
      </div>

      <Footer />
    </>
  );
};

export default FeaturePage;