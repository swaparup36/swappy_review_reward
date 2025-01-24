"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import TransactionHistory from "../components/TransactionHistory";
import { WithdrawModal } from "../components/WithdrawModal";
import { DepositModal } from "../components/DepositModal";
import { GetContext } from "../context/walletProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCcw } from "lucide-react";

const MyWallet = () => {
  const router = useRouter();
  
  const { walletBalance, getWalletBalance, allTransactions, getAllTransaction, isWalletLoading } = GetContext();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const depositAddress = typeof window !== 'undefined' ? localStorage.getItem("rr-publickey") || '' : '';

  const handleLogout = () => {
    localStorage.removeItem('rr-userid');
    localStorage.removeItem('rr-publickey');
    router.push('/start-earning');
  }

  useEffect(() => {
    if(!localStorage.getItem('rr-userid')){
      router.push('/start-earning');
    }

    getWalletBalance();
    getAllTransaction();
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
            <div className="flex flex-col md:flex-row justify-between items-start w-full">
              <h1 className="text-5xl font-bold tracking-tight mb-8">
                <span className="text-black">MY</span>
                <br />
                <span className="text-gray-400">WALLET</span>
              </h1>

              <div className="text-sm md:hidden font-mono mb-8 text-gray-500">
                <p>REVIEW TASKS / EARN REWARDS</p>
                <p>SHARE FEEDBACK / GET PAID</p>
              </div>

              <div className='mt-5 space-y-2 font-mono w-full md:w-fit flex justify-between items-baseline gap-2'>
                <Link href={'/post-tasks'} className='bg-white border-[5px] border-gray-800 p-1'>
                  <p className='bg-gray-800 text-white border-2 border-gray-800 text-[1rem] px-4 py-1 mb-0 font-semibold'>Post Tasks &#8599;</p>
                </Link>

                <Link href={'/earn'} className='bg-white border-[5px] border-gray-800 p-1'>
                  <p className='bg-gray-800 text-white border-2 border-gray-800 text-[1rem] px-4 py-1 mb-0 font-semibold'>Earn Rewards &#8599;</p>
                </Link>
              </div>
            </div>

            <div className="text-sm md:block hidden font-mono mb-8 text-gray-500">
              <p>REVIEW TASKS / EARN REWARDS</p>
              <p>SHARE FEEDBACK / GET PAID</p>
            </div>

            {isWalletLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center w-full">
                <div className="flex md:flex-row flex-col justify-between items-start md:items-center mb-8 w-full text-xl font-mono border-b-2 pb-8 border-gray-500 px-4 mt-5">
                  <div className="flex flex-row justify-between items-center w-full md:w-fit">
                    <h2 className="font-semibold">Swaparup Mukherjee</h2>
                    <LogOut onClick={handleLogout} className="ml-4 cursor-pointer" />
                  </div>
                  <div className="flex flex-col md:flex-row justify-between w-full md:w-fit items-start md:items-center gap-4">
                    <p className="font-semibold flex md:w-fit w-[150px]">{walletBalance} USDC</p>
                    <RefreshCcw className="cursor-pointer" onClick={getWalletBalance} />
                    <div className="flex flex-row justify-between items-center w-full md:w-fit">
                      <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-white border-gray-700 border-2 text-black px-4 py-2 rounded-lg w-full md:w-fit mr-1 md:mr-4" 
                          onClick={() => setIsWithdrawOpen(true)}
                      >
                        Withdraw
                      </motion.button>
                      <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-white border-gray-700 border-2 text-black px-4 py-2 rounded-lg w-full md:w-fit ml-1 md:ml-0"
                          onClick={() => setIsDepositOpen(true)}
                      >
                        Deposit
                      </motion.button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center items-center w-full">
                  {allTransactions.length > 0 ? (
                    <TransactionHistory transactions={allTransactions} />
                  ) : (
                    <div className="flex justify-center items-center w-full h-64">
                      <p className="text-gray-600 font-mono">
                        No transactions yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        balance={walletBalance}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        address={depositAddress}
      />
    </>
  );
};

export default MyWallet;
