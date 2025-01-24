"use client"

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import TaskList from '@/app/components/TaskList';
import axios from 'axios';
import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { Task } from '../lib/types';
import Footer from '../components/Footer';
import { useRouter } from 'next/navigation';
import { GetContext } from '../context/walletProvider';



const EarningsPage = () => {
  const router = useRouter();

  const { getWalletBalance, walletBalance } = GetContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  // const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // const getWalletBalance = async() => {
  //   const userPublicKey = localStorage.getItem('rr-publickey');
  //   const response = await axios.post('https://solana-devnet.g.alchemy.com/v2/AlZpXuvewHz3Ty-rYFKn1Oc1kuMtDk8e', {
  //     jsonrpc: "2.0",
  //     id: 1,
  //     method: "getBalance",
  //     params: [userPublicKey]
  //   });

  //   if(response.data.result.value) {
  //     setWalletBalance(response.data.result.value/1000000000);
  //   } else {
  //     console.log("Error fetching wallet balance");
  //   }
  // }

  const getAllTasks = async() => {
    const userId = localStorage.getItem('rr-userid');

    // Function to get all tasks
    const getTaskRes = await axios.get("/api/get-all-tasks");
    if(!getTaskRes.data.success) {
      return console.log("Error fetching tasks");
    }

    const tasksToShow = getTaskRes.data.tasks.filter((task: Task)=>task.creatorId !== userId);

    setTasks(tasksToShow);
    setIsLoading(false);
  }

  useEffect(()=>{
    if(!localStorage.getItem('rr-userid')){
      router.push('/start-earning');
    }

    getAllTasks();
    getWalletBalance();
  }, []);

  return (
    <>
      <div className="min-h-screen bg-white pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className='flex md:flex-row flex-col justify-between items-start w-full'>
              <h1 className="text-5xl font-bold tracking-tight mb-8">
                <span className="text-black">EARN</span>
                <br />
                <span className="text-gray-400">REWARDS</span>
              </h1>

              <div className="text-sm font-mono md:hidden mb-8 text-gray-500">
                <p>REVIEW TASKS / EARN REWARDS</p>
                <p>SHARE FEEDBACK / GET PAID</p>
              </div>

              <div className='mt-5 space-y-2 font-mono w-full md:w-fit flex justify-between items-center'>
                <Link href={'/post-tasks'} className='bg-white border-[5px] border-gray-800 p-1'>
                  <p className='bg-gray-800 text-white border-2 border-gray-800 text-[1rem] px-4 py-1 font-semibold'>Post Tasks &#8599;</p>
                </Link>

                <Link href={'/mywallet'} className='bg-white flex flex-col justify-center items-center mx-5 p-1'>
                  <Wallet size={35} />
                  <p className='font-semibold'>{walletBalance} USDC</p>
                </Link>
              </div>
            </div>

            <div className="text-sm font-mono mb-8 md:block hidden text-gray-500">
              <p>REVIEW TASKS / EARN REWARDS</p>
              <p>SHARE FEEDBACK / GET PAID</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            ) : (
              tasks.length === 0 ? (
                <div className='flex justify-center items-center h-64'>
                  <p className='text-gray-500 text-lg font-mono'>No tasks available</p>
                </div>
              ) : (
                <TaskList tasks={tasks} />
              )
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EarningsPage;