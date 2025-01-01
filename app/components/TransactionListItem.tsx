import { Copy } from 'lucide-react'
import React from 'react'
import { TransactionType } from '../lib/types'


// Table components 
const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`} {...props} />
)

const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
)

function TransactionListItem({ signature, blockTime, confirmationStatus, err, memo, slot }: TransactionType) {
    if(memo) console.log("memo: ", memo);
  return (
    err ? (
        <></>
    ) : (
        <TableRow className="border-black/10 hover:bg-black/5">
            <TableCell className="font-mono flex items-center gap-2">
                <Copy className="h-4 w-4 text-black/50 hover:text-black cursor-pointer" />
                <span className="truncate max-w-[300px]">{signature}</span>
            </TableCell>
            <TableCell>{blockTime}</TableCell>
            <TableCell>{slot}</TableCell>
            <TableCell>
                <span className={`px-2 py-1 rounded-full ${confirmationStatus==='finalized' ? 'bg-green-300 text-green-700' : confirmationStatus === 'pending' ? 'bg-yellow-100 text-yellow-400' : 'bg-red-300 text-red-600'} text-sm`}>
                    {confirmationStatus}
                </span>
            </TableCell>
        </TableRow>
    )
  )
}

export default TransactionListItem