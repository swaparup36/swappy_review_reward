"use client";

import axios from "axios";
import React, { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";
import { TransactionType } from "../lib/types";

interface ProductContextType {
    walletBalance: number;
    setWalletBalance: Dispatch<SetStateAction<number>>;
    getWalletBalance: () => Promise<void>;
    allTransactions: TransactionType[],
    setAllTransactions: Dispatch<SetStateAction<TransactionType[]>>;
    getAllTransaction: () => Promise<void>;
    isWalletLoading: boolean,
    setWalletIsLoading: Dispatch<SetStateAction<boolean>>;
}

const ProductContext = createContext<ProductContextType>({
    walletBalance: 0,
    setWalletBalance: () => 0,
    getWalletBalance: async () => {},
    allTransactions: [],
    setAllTransactions: () => [],
    getAllTransaction: async () => {},
    isWalletLoading: false,
    setWalletIsLoading: () => false
});

export const GetContext = () => {
  return useContext(ProductContext);
};

export const WalletProvider = ({children}: {children: ReactNode}) => {
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [allTransactions, setAllTransactions] = useState<TransactionType[]>([]);
    const [isWalletLoading, setWalletIsLoading] = useState<boolean>(true);

    const getWalletBalance = async () => {
        const userPublicKey = localStorage.getItem("rr-publickey");
        const response = await axios.post(
          "https://solana-devnet.g.alchemy.com/v2/AlZpXuvewHz3Ty-rYFKn1Oc1kuMtDk8e",
          {
            jsonrpc: "2.0",
            id: 1,
            method: "getTokenAccountsByOwner",
            params: [
              userPublicKey,
              {
                mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
              },
              {
                encoding: "jsonParsed"
              }
            ],
          }
        );

        
        if (response.data.result.value.length !== 0) {
          const usdcBalance = response.data.result.value[0].account.data.parsed.info.tokenAmount.amount;
          setWalletBalance(usdcBalance / 1000000);
        } else {
          console.log("Error fetching wallet balance");
        }
    };

    const getAllTransaction = async() => {
      const userId = localStorage.getItem("rr-userid");
        const response = await axios.post(
          "/api/get-all-transaction",
          {
            userId: userId
          }
        );
    
        console.log("get all transactions: ", response.data);

        if (response.data.success) {
          setAllTransactions(response.data.transactions);
          setWalletIsLoading(false);
        } else {
          console.log("Error fetching transactions");
        }
    }

    return (
        <ProductContext.Provider value={{walletBalance, setWalletBalance, getWalletBalance, allTransactions, setAllTransactions, getAllTransaction, isWalletLoading, setWalletIsLoading}}>
            {children}
        </ProductContext.Provider>
    );
};
