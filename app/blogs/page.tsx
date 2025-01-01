"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { mockPosts } from '../lib/blogPosts';
import { BlogPost } from '../lib/types';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

const BlogCard = ({ post }: { post: BlogPost }) => {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-lg shadow-md overflow-hidden md:max-h-[450px]"
      >
        <Image
          src={post.coverImage} 
          alt={post.title}
          className="w-full h-48 object-cover"
          width={400}
          height={400}
        />
        <div className="p-6">
          <span className="text-sm text-gray-500">{`${new Date(post.date).getDate()}-${new Date(post.date).getMonth()+1}-${new Date(post.date).getFullYear()}`}</span>
          <h3 className="text-xl font-bold mt-2 mb-3">{post.title}</h3>
          <p className="text-gray-600 mb-4 line-clamp-3">{post.text}</p>
          <Link
            href={`/blogs/${post.id}`}
            className="text-black font-medium hover:underline"
          >
            Read More →
          </Link>
        </div>
      </motion.div>
    );
};

const BlogList = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        setPosts(mockPosts);
        setIsLoading(false);
    }, []);
  
    if (isLoading) {
      return (
        <>
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
            <Footer />
        </>
      );
    }
  
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 my-7 md:h-[100svh]">
            {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
            ))}
        </div>
    );
};

const BlogPage = () => {
  return (
    <>
        <Navbar />
        <div className="min-h-screen bg-white pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                >
                <h1 className="text-5xl font-bold tracking-tight mb-8">
                    <span className="text-black">OUR</span>
                    <br />
                    <span className="text-gray-400">BLOG</span>
                </h1>

                <div className="text-sm font-mono mb-12 text-gray-500">
                    <p>INSIGHTS / UPDATES / NEWS</p>
                    <p>COMMUNITY / KNOWLEDGE</p>
                </div>

                <BlogList />
                </motion.div>
            </div>
        </div>

        <Footer />
    </>
  );
};

export default BlogPage;