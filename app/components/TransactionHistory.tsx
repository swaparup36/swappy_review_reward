"use client"

import React from 'react'
import { RefreshCcw } from 'lucide-react'
import { TransactionType } from '../lib/types'
import TransactionListItem from './TransactionListItem'
import { GetContext } from '../context/walletProvider'

// Button component
const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// Table components
const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <table className={`w-full overflow-x-scroll caption-bottom text-sm ${className}`} {...props} />
)

const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`[&_tr]:border-b ${className}`} {...props} />
)

const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
)

const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`} {...props} />
)

const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
)

export default function TransactionHistory({ transactions }: {transactions: TransactionType[]}) {
  const { getAllTransaction } = GetContext();
  return (
    <div className="w-full bg-white text-black p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        <Button className="text-black border-black hover:bg-black/5" onClick={getAllTransaction}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="border border-black/10 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-black/10 hover:bg-black/5">
              <TableHead className="text-black font-semibold">TRANSACTION SIGNATURE</TableHead>
              <TableHead className="text-black font-semibold">BLOCK TIME</TableHead>
              <TableHead className="text-black font-semibold">SLOT</TableHead>
              <TableHead className="text-black font-semibold">STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => (
              <TransactionListItem key={index} {...tx}/>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

