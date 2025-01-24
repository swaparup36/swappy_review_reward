"use client"

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react'
import { Users } from 'lucide-react';
import axios from 'axios';
import { Task } from '@/app/lib/types';
import { toast, ToastContainer } from 'react-toastify';


function TaskDetails() {
    const { taskId } = useParams();
    const router = useRouter();

    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [authorName, setAuthorName] = useState<string>('');
    const [isReviewAttempted, setIsReviewAttempted] = useState<boolean>(false);
    const [isReviewSubmitted, setIsReviewSubmitted] = useState<boolean>(false);
    const [reviewStartingTimeStamp, setReviewStartingTimeStamp] = useState<number | null>(null);
    const [isReviewSubmitting, setIsReviewSubmitting] = useState<boolean>(false);

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

    const handleStartReview = async(link: string) => {
        try {
            const reviewStartRes = await axios.post("/api/start-review-process");

            if(!reviewStartRes.data.success){
                return toast.error(`Can not start review process: ${reviewStartRes.data.message}`);
            }
            setReviewStartingTimeStamp(reviewStartRes.data.currentTimestamp);
            setIsReviewAttempted(true);
            window.open(link, '_blank');
        } catch (error) {
            toast.error(`Can not start review process: ${error}`);
        }
    }

    const handleConfirmReviewSubmission = async(placeName: string, authorName: string) => {
        setIsReviewSubmitting(true);
        try {
            const userId = localStorage.getItem('rr-userid');
            const userPublicKey = localStorage.getItem('rr-publickey');

            if(!task){
                setIsReviewSubmitting(false);
                return toast.error("task not found");
            }

            if(!reviewStartingTimeStamp) {
                setIsReviewSubmitting(false);
                return toast.error("timestamp not found");
            }

            if(task?.creatorId === userId) {
                setIsReviewSubmitting(false);
                return toast.error("Creator can't submit review");
            }

            if(!userId) {
                setIsReviewSubmitting(false);
                return toast.error("UserId is not null");
            }

            if(task?.participants.includes(userId)) {
                setIsReviewSubmitting(false);
                return toast.error("Review already Submitted");
            }

            const response = await axios.post('/api/get-placeid', {
                placeName: placeName,
            },{
                timeout: 15000
            });

            console.log("placeid: ", response.data);

            if(!response.data.success){
                setIsReviewSubmitting(false);
                console.log("something went wrong: ", response.data.message)
                return toast.error(`something went wrong: ${response.data.message}`);
            }

            const requiredReviews = response.data.reviews.filter((review)=>{
                return review.author_name === authorName;
            });

            console.log("requiredReviews: ", requiredReviews);

            console.log("review starts at: ", reviewStartingTimeStamp);
            console.log("review ends at: ", reviewStartingTimeStamp + (5 * 60));
            console.log("review posted at: ", requiredReviews[0].time);

            if(reviewStartingTimeStamp > requiredReviews[0].time && requiredReviews[0].time < reviewStartingTimeStamp + (5 * 60)) {
                setIsReviewSubmitting(false);
                return toast.error("Review not submitted within 5 minutes");
            }

            if(requiredReviews[0].rating < 3) {
                setIsReviewSubmitting(false);
                return toast.error("Review submitted but rating was less than 3");
            }

            if(requiredReviews.length > 0){
                console.log("Reward the user");

                // Reward the user
                const rewardRes = await axios.post('/api/reward-user', {
                    userPublicKey: userPublicKey,
                    reward: task.rewardPerperson
                },{
                    timeout: 60000
                });

                if(!rewardRes.data.success){
                    setIsReviewSubmitting(false);
                    console.log("error rewarding user: ", rewardRes.data.message)
                    return toast.error(`error rewarding user: ${rewardRes.data.message}`);
                }

                console.log("reward signature: ", rewardRes.data.signature);

                // Update Task
                const newParticipants = task?.participants;
                newParticipants?.push(userId);

                const updateTaskRes = await axios.put("/api/update-task", {
                    participants: newParticipants,
                    taskId: taskId
                }, {
                    timeout: 20000
                });

                if(!updateTaskRes.data.success){
                    setIsReviewSubmitting(false);
                    console.log("error updating task: ", updateTaskRes.data.message);
                    return toast.error(`error updating task: ${updateTaskRes.data.message}`);
                }

                setIsReviewSubmitting(false);
                setIsReviewSubmitted(true);

                // Check if task reward ended --> if ended then delete task from database
                if(task?.totalReward == task?.rewardPerperson*newParticipants?.length){
                    const deleteTaskRes = await axios.post("/api/delete-task", {
                        taskId: taskId
                    }, {
                        timeout: 15000
                    });

                    if(!deleteTaskRes.data.success) {
                        console.log("error deleting task");
                    }else{
                        console.log("task deleted successfully");
                    }
                }

                router.push('/earn');
                
            }else{
                toast.error("Review not submitted");
                setIsReviewSubmitting(false);
                console.log("Review not submitted");
            }
        } catch (error) {
            setIsReviewSubmitting(false);
            toast.error(`Review not submitted: ${error}`);
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
            <ToastContainer />
         
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
                                    {task && task?.rewardPerperson} USDC
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
                                    <p className='text-lg text-gray-600 font-semibold'>Submit review within 5 minutes to have a valid submission</p>
                                    <div className='flex flex-col w-full my-4'>
                                        <label htmlFor="author_name" className='my-2 text-gray-900'>Author Name</label>
                                        <input className='w-full rounded-md py-2 px-2 border-2 border-gray-700 text-gray-950 bg-white' id='author_name' type="text" value={authorName} onChange={(e)=>setAuthorName(e.target.value)} />
                                    </div>
                                    {
                                        isReviewSubmitting ? (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={()=>handleConfirmReviewSubmission(task?.title, authorName)}
                                                className="w-full bg-black opacity-50 cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors text-lg"
                                            >
                                                Submitting...
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={()=>handleConfirmReviewSubmission(task?.title, authorName)}
                                                className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors text-lg"
                                            >
                                                Confirm Your Submission
                                            </motion.button>
                                        )
                                    }
                                </div>
                            }
                
                            <div className="text-sm font-mono mt-8 text-gray-500 text-center">
                                <p>REVIEW TASK / EARN {task && task?.rewardPerperson} USDC</p>
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
                                    {task && task?.rewardPerperson} USDC
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
                                <p>REVIEW TASK / EARN {task && task?.rewardPerperson} USDC</p>
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