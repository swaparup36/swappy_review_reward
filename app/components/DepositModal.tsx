"use client"

import * as React from "react";
import { motion } from 'framer-motion';
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import QRCode from 'qrcode';

// Dialog Components (same as withdraw-modal.tsx)
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
    <div className={"relative w-full max-w-md rounded-lg shadow-lg bg-white"}>
      {children}
    </div>
  )
};

// Main Deposit Modal Component
interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  address: string
}

export function DepositModal({ isOpen, onClose, address }: DepositModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
  }

  const generateQrCode = async () => {
    try {
      const url = await QRCode.toDataURL(address);
      setQrCodeUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(()=>{
    generateQrCode();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-start items-center space-x-4">
            <h2 className="text-xl font-normal text-gray-900">Receive Address</h2>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg w-48 h-48 flex items-center justify-center">
              <Image 
                src={qrCodeUrl} 
                alt="QR Code" 
                height={600}
                width={600}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-center font-mono text-sm break-all text-gray-900">
              {address}
            </p>
          </div>

          {/* Info Text */}
          <p className="text-center text-sm text-gray-500">
            Only deposited SOL can be used. {"Don't"} deposit other tokens{" "}
          </p>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center justify-center w-full space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span>Copy</span>
          </button>

          {/* Close Button */}
          <motion.button
            onClick={onClose}
            className="bg-white border-gray-700 border-2 text-black px-4 py-2 rounded-lg w-full flex justify-center items-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Close
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  )
}