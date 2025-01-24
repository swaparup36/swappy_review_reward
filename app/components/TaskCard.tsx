"use client"

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Task } from '../lib/types';

const TaskCard = ({ task }: {task: Task}) => {
  const router = useRouter();
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-100"
    >
      <div className="relative h-48">
        <Image
          src={task.imageUrl}
          alt={task.title}
          className="w-full h-full object-cover"
          height={200}
          width={200}
        />
        <div className="absolute top-4 right-4 bg-black text-white px-4 py-2 rounded-full">
          {task.rewardPerperson} USDC
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-gray-900">{task.title}</h3>
        <p className="text-gray-600 mb-4">{task.description.length > 30 ? task.description.slice(0, 27) + '...' : task.description}</p>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          onClick={()=>router.push(`/taskdetails/${task.taskId}`)}
        >
          View Details
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TaskCard;