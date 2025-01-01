"use client"

import * as React from "react";
import { motion } from "framer-motion";
import { WithdrawSchema } from "../scemas/passkeyReg";
import axios from "axios";
import { GetContext } from "../context/walletProvider";
import { CircleAlert, CircleCheck } from "lucide-react";

// Dialog Components
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="fixed inset-0 bg-black/25" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

function DialogContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
      {children}
    </div>
  )
}

function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-normal">{children}</h2>
}

function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-500">{children}</p>
}

function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex justify-end space-x-4">
      {children}
    </div>
  )
}

const FormInput = ({ label, name, value, type, error, onChange, placeholder }: { label: string, name: string, value: string | number, type?: string, error?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string }) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <motion.input
        whileFocus={{ scale: 1.01 }}
        className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-gray-800 ${
          error ? 'border-red-500' : 'border-gray-200'
        }`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      {error && (
        <p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        </p>
      )}
    </div>
  );
};

// Main Modal Component
interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  balance: number
}

export function WithdrawModal({ isOpen, onClose, balance }: WithdrawModalProps) {
  const { getWalletBalance } = GetContext();
  const [withdrawFormData, setWithdrawFormData] = React.useState({
    amount: 0,
    address: "",
  });
  const [isWithdrawing, setIsWithdrawing] = React.useState<boolean>(false);
  const [withdrawExecution, setWithdrawExecution] = React.useState<{
    status: boolean,
    success: boolean,
    message: string
  }>({
    status: false,
    success: false,
    message: ""
  });

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    setIsWithdrawing(true);

    const validationResult = WithdrawSchema.safeParse(withdrawFormData);
    if(!validationResult.success) {
        const fieldErrors = validationResult.error.flatten().fieldErrors;
        setErrors(
            Object.fromEntries(
                Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0] || "Invalid field"])
            )
        );
        return console.log("zod error");
    }

    try {
      // Call api to withdraw SOL
      const withdrawResponse = await axios.post('/api/withdraw-sol', {
        publicKey: typeof window !== 'undefined' ? localStorage.getItem('rr-publickey') || '' : '',
        userId: typeof window !== 'undefined' ? localStorage.getItem('rr-userid') || '' : '',
        ...withdrawFormData
      });

      console.log("withdraw response: ", withdrawResponse.data);

      if(withdrawResponse.data.success){
        console.log(`${withdrawFormData.amount} SOL has been transfered to ${withdrawFormData.address}`);
        setWithdrawFormData({
          amount: 0,
          address: ''
        });
        getWalletBalance();

        setWithdrawExecution({
          status: true,
          success: true,
          message: `${withdrawFormData.amount} SOL has been transfered to ${withdrawFormData.address}`
        });

        setIsWithdrawing(false);

        setTimeout(() => {
          setWithdrawExecution({
            status: false,
            success: false,
            message: ""
          });
          
          onClose();
        }, 1000);
      }else {
        setIsWithdrawing(false);
        
        setWithdrawExecution({
          status: true,
          success: false,
          message: "Unable to withdraw"
        });
  
        setTimeout(() => {
          setWithdrawExecution({
            status: false,
            success: false,
            message: ""
          });
        }, 1000);
      }
    } catch (error) {
      console.log("Can not withdraw: ", error);
      setWithdrawExecution({
        status: true,
        success: false,
        message: "Unable to withdraw"
      });

      setTimeout(() => {
        setWithdrawExecution({
          status: false,
          success: false,
          message: ""
        });
      }, 1000);
    }
  }

  const [errors, setErrors] = React.useState<Record<string, string> | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {
        withdrawExecution.status ? (
          withdrawExecution.success ? (
            <DialogContent>
              <div className="flex justify-center items-center flex-col w-full h-[40svh]">
                <CircleCheck color="#12a12c" fill="#c7ffd1" size={70}/>
                <p className="text-center text-gray-500 font-mono my-4">{withdrawExecution.message}</p>
              </div>
              <DialogFooter>
                <motion.span 
                  className='bg-white border-gray-700 border-2 text-black px-4 py-2 rounded-lg cursor-pointer w-full flex justify-center items-center'
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.span>
              </DialogFooter>
            </DialogContent>
          ) : (
            <DialogContent>
              <div className="flex justify-center items-center flex-col w-full">
                <CircleAlert color="red" fill="#ffc2cc" size={70}/>
                <p className="text-center text-gray-500 font-mono my-4">{withdrawExecution.message}</p>
              </div>

              <DialogFooter>
                <motion.span 
                  className='bg-white border-gray-700 border-2 text-black px-4 py-2 rounded-lg cursor-pointer w-full flex justify-center items-center'
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.span>
              </DialogFooter>
            </DialogContent>
          )
        ) : (
          <>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw SOL</DialogTitle>
                <DialogDescription>
                  Available balance: {balance} SOL
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                      <FormInput
                          label="Amount"
                          name="amount"
                          type="number"
                          value={withdrawFormData.amount}
                          onChange={(e) => setWithdrawFormData({ ...withdrawFormData, amount: parseFloat(e.target.value) })}
                          error={errors?.amount}
                          placeholder="Enter amount in SOL"
                      />
                      <FormInput
                          label="Wallet Address"
                          name="address"
                          type="text"
                          value={withdrawFormData.address}
                          onChange={(e) => setWithdrawFormData({ ...withdrawFormData, address: e.target.value })}
                          error={errors?.address}
                          placeholder="Enter your SOL address"
                      />
                  </div>
                </div>
                <DialogFooter>
                  <motion.span 
                      className='bg-white border-gray-700 border-2 text-black px-4 py-2 rounded-lg cursor-pointer'
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.span>
                  {
                    isWithdrawing ? (
                      <motion.button
                          className='bg-gray-800 border-gray-900 border-2 text-gray-400 px-4 py-2 rounded-lg'
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={true}
                      >
                        Withdrawing...
                      </motion.button>
                    ) : (
                      <motion.button
                          className='bg-black border-gray-900 border-2 text-white px-4 py-2 rounded-lg' 
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                      >
                        Confirm Withdrawal
                      </motion.button>
                    )
                  }
                </DialogFooter>
              </form>
            </DialogContent>
          </>
        )
      }
    </Dialog>
  )
}