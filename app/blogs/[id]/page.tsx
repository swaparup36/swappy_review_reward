"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { mockPosts } from '@/app/lib/blogPosts';
import { BlogPost } from '@/app/lib/types';
import Link from 'next/link';
import Footer from '@/app/components/Footer';
import Navbar from '@/app/components/Navbar';

const BlogPostPage = () => {
  const pathName = usePathname();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [post, setPost] = useState<BlogPost | null>(null);

  const getPost = () => {
    const postId = pathName.split('/').pop();
    const post = mockPosts.find(post => post.id === Number(postId));
    if(!post){
        return console.log("no post found");
    }
    setPost(post);
    setIsLoading(false);
  }

  useEffect(() => {
     getPost();
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

  if (!post) {
    return (
      <>
        <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Post not found</h2>
            <Link href="/blog" className="text-black underline">
            Return to blog
            </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
        <Navbar />

        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto my-32 px-6"
        >
        <Image 
            src={post.coverImage} 
            alt={post.title}
            className="w-full h-72 object-cover rounded-lg mb-8"
            width={800}
            height={800}
        />
        <span className="text-gray-500">{`${new Date(post.date).getDate()}-${new Date(post.date).getMonth()+1}-${new Date(post.date).getFullYear()}`}</span>
        <h1 className="text-4xl font-bold mt-2 mb-6">{post.title}</h1>
        <div className="prose prose-lg max-w-none">
            {post.content}
        </div>
        </motion.article>

        <Footer />
    </>
  );
};

export default BlogPostPage;