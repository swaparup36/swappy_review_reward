export type Task = {
    taskId: string;
    title: string;
    description: string;
    rewardPerperson: number;
    totalReward: number;
    imageUrl: string;
    link: string;
    participants: string[];
    creatorId: string;
    createdOn: string;
};

export type TransactionType = {
    blockTime: number;
    confirmationStatus: string;
    err: string | null;
    memo: string | null;
    signature: string;
    slot: number
};

export type BlogPost = {
    id: number;
    title: string;
    coverImage: string;
    date: string;
    text: string;
    slug: string;
    content: string;
}