"use client"

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react'
import { Users } from 'lucide-react';
import axios from 'axios';
import { Task } from '@/app/lib/types';


function TaskDetails() {
    const { taskId } = useParams();
    const router = useRouter();

    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [authorName, setAuthorName] = useState<string>('');
    const [isReviewAttempted, setIsReviewAttempted] = useState<boolean>(false);
    const [isReviewSubmitted, setIsReviewSubmitted] = useState<boolean>(false);

    const getTask = async() => {
        console.log("taskid: ", taskId);

        const getTaskRes = await axios.post("/api/get-task-details", { taskId: taskId });
        if(!getTaskRes.data.success) return console.log("error fetching task details");

        console.log("task: ", getTaskRes.data.task);
        setTask(getTaskRes.data.task);
        setIsLoading(false);

        // Check if user already submitted review
        if(getTaskRes.data.task.participants.includes(localStorage.getItem('rr-userid'))){
            setIsReviewSubmitted(true);
        }
    }

    const handleStartReview = (link: string) => {
        setIsReviewAttempted(true);
        window.open(link, '_blank');
    }

    const handleConfirmReviewSubmission = async(placeName: string, authorName: string) => {
        const userId = localStorage.getItem('rr-userid');
        const userPublicKey = localStorage.getItem('rr-publickey');

        if(!task) return console.log("task not found");

        if(task?.creatorId === userId) return console.log("Creator can't submit review");
        if(task?.participants.includes(userId)) return console.log("Review already Submitted");

        const response = await axios.post('/api/get-placeid', {
            placeName: placeName,
        });

        console.log("placeid: ", response.data);

        if(!response.data.success){
            return console.log("something went wrong: ", response.data.message);
        }

        const requiredReviews = response.data.reviews.filter((review)=>{
            return review.author_name === authorName;
        });

        console.log("requiredReviews: ", requiredReviews);

        if(requiredReviews.length > 0){
            console.log("Reward the user");

            // Reward the user
            const rewardRes = await axios.post('/api/reward-user', {
                userPublicKey: userPublicKey,
                reward: task.rewardPerperson
            });

            if(!rewardRes.data.success){
                return console.log("error rewarding user");
            }

            console.log("reward signature: ", rewardRes.data.signature);

            // Update Task
            const newParticipants = task?.participants;
            newParticipants?.push(userId);

            const updateTaskRes = await axios.put("/api/update-task", {
                participants: newParticipants,
                taskId: taskId
            });

            if(!updateTaskRes.data.success){
                return console.log("error updating task");
            }

            // Check if task reward ended --> if ended then delete task from database
            if(task?.totalReward == task?.rewardPerperson*newParticipants?.length){
                const deleteTaskRes = await axios.post("/api/delete-task", {
                    taskId: taskId
                });

                if(!deleteTaskRes.data.success) {
                    console.log("error deleting task");
                }else{
                    console.log("task deleted successfully");
                }
            }

            router.push('/earn');
            
        }else{
            console.log("Review not submitted");
        }
    }

    useEffect(()=>{
        if(!localStorage.getItem('rr-userid')){
            router.push('/start-earning');
        }

        getTask();
    }, []);

    return (
        <>
            {
                (task && !isReviewSubmitted) &&
                <div className="min-h-screen bg-white pt-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                        <div className="mb-8">
                            <button
                                onClick={() => router.push('/earn')}
                                className="text-gray-600 hover:text-black mb-4 flex items-center"
                            >
                                ← Back to tasks
                            </button>
                            <h1 className="text-5xl font-bold tracking-tight mb-8">
                                <span className="text-black">{task?.title.split(' ')[0]}</span>
                                <br />
                                <span className="text-gray-400">
                                    {task?.title.split(' ').slice(1).join(' ')}
                                </span>
                            </h1>
                            <div className='flex justify-start items-center text-gray-600'>
                                <Users className='mr-2' /> {task?.participants.length} submissions
                            </div>
                        </div>
                
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="relative h-96">
                                <Image
                                    src={task?.imageUrl}
                                    alt={task?.title}
                                    className="w-full h-full object-cover"
                                    height={200}
                                    width={200}
                                />
                                <div className="absolute top-6 right-6 bg-black text-white px-6 py-3 rounded-full text-lg">
                                    {task && task?.rewardPerperson} SOL
                                </div>
                            </div>
                
                            <div className="p-8">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4 text-gray-900">Task Description</h2>
                                <p className="text-gray-600">{task?.description}</p>
                            </div>
                
                            
                            {
                                !isReviewAttempted &&
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={()=>handleStartReview(task?.link)}
                                    className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors text-lg"
                                >
                                    Submit Review Now
                                </motion.button>
                            }

                            {
                                isReviewAttempted &&
                                <div className='flex flex-col justify-between items-center'>
                                    <div className='flex flex-col w-full my-4'>
                                        <label htmlFor="author_name" className='my-2 text-gray-900'>Author Name</label>
                                        <input className='w-full rounded-md py-2 px-2 border-2 border-gray-700 text-gray-950 bg-white' id='author_name' type="text" value={authorName} onChange={(e)=>setAuthorName(e.target.value)} />
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={()=>handleConfirmReviewSubmission(task?.title, authorName)}
                                        className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors text-lg"
                                    >
                                        Confirm Your Submission
                                    </motion.button>
                                </div>
                            }
                
                            <div className="text-sm font-mono mt-8 text-gray-500 text-center">
                                <p>REVIEW TASK / EARN {task && task?.rewardPerperson} SOL</p>
                                <p>SHARE FEEDBACK / GET PAID</p>
                            </div>
                            </div>
                        </div>
                        </motion.div>
                    </div>
                </div>
            }
            {
                (!task && !isLoading) &&
                <div className='bg-white h-[100svh] w-full flex justify-center items-center text-gray-700 font-bold'>
                    TASK NOT FOUND
                </div>
            }
            {
                (!task && isLoading) &&
                <div className='bg-white h-[100svh] w-full flex justify-center items-center text-gray-700 font-bold'>
                    Loading taks...
                </div>   
            }
            {
                isReviewSubmitted &&
                <div className="min-h-screen bg-white pt-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                        <div className="mb-8">
                            <button
                                onClick={() => router.push('/earn')}
                                className="text-gray-600 hover:text-black mb-4 flex items-center"
                            >
                                ← Back to tasks
                            </button>
                            <h1 className="text-5xl font-bold tracking-tight mb-8">
                                <span className="text-black">{task?.title.split(' ')[0]}</span>
                                <br />
                                <span className="text-gray-400">
                                    {task?.title.split(' ').slice(1).join(' ')}
                                </span>
                            </h1>
                            <div className='flex justify-start items-center text-gray-600'>
                                <Users className='mr-2' /> {task?.participants.length} submissions
                            </div>
                        </div>
                
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="relative h-96">
                                <Image
                                    src={task?.imageUrl}
                                    alt={task?.title}
                                    className="w-full h-full object-cover"
                                    height={200}
                                    width={200}
                                />
                                <div className="absolute top-6 right-6 bg-black text-white px-6 py-3 rounded-full text-lg">
                                    {task && task?.rewardPerperson} SOL
                                </div>
                            </div>
                
                            <div className="p-8">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4 text-gray-900">Task Description</h2>
                                <p className="text-gray-600">{task?.description}</p>
                            </div>
                
                            
                            <div className='flex flex-col justify-between items-center p-2 border-2 border-gray-700 rounded-lg'>
                                <p className='text-gray-900 font-semibold'>You have already submitted the review for this task</p>
                            </div>
                
                            <div className="text-sm font-mono mt-8 text-gray-500 text-center">
                                <p>REVIEW TASK / EARN {task && task?.rewardPerperson} SOL</p>
                                <p>SHARE FEEDBACK / GET PAID</p>
                            </div>
                            </div>
                        </div>
                        </motion.div>
                    </div>
                </div>
            }
        </>
    );
}

export default TaskDetails