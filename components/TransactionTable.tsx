import React, { useState } from 'react';
import { Transaction, AppSettings, TransactionStatus, ReportType, TransactionType } from '../types';
import { ChevronDown, ChevronUp, MessageSquare, Repeat, Clock, CheckCircle2, Upload, AlertCircle } from 'lucide-react';
import { parseFile } from '../services/importService';

interface TransactionTableProps {
  sourceId: string;
  transactions: Transaction[];
  errors?: string[];
  settings: AppSettings;
  defaultTransactionType?: TransactionType;
  onAddComment: (id: string, comment: string) => void;
  onUpdateData: (sourceId: string, transactions: Transaction[], errors?: string[]) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ sourceId, transactions, errors, settings, defaultTransactionType, onAddComment, onUpdateData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Filter small amounts if setting is enabled
  const filteredTransactions = transactions.filter(t => 
    !settings.showSmallAmounts ? t.amount >= settings.smallAmountThreshold : true
  );

  const handleUpdateFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUpdating(true);
      try {
          // Use the stored defaultTransactionType to ensure parsing follows the original configuration rules (e.g. Creditors logic)
          const result = await parseFile(file, sourceId, ReportType.CASHFLOW, defaultTransactionType);
          onUpdateData(sourceId, result.transactions, result.errors);
      } catch (err) {
          alert("Fout bij updaten: " + err);
      } finally {
          setIsUpdating(false);
      }
  };

  const formatCurrency = (amount: number) => {
    if (settings.currencyInK) {
      return `€${(amount / 1000).toFixed(1)}k`;
    }
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
        case 'DEBTOR':
            return { backgroundColor: 'var(--color-low-risk)', color: '#fff', opacity: 0.9 };
        case 'SUBSIDY':
            return { backgroundColor: 'var(--color-primary)', color: '#fff', opacity: 0.9 };
        case 'CREDITOR':
            return { backgroundColor: 'var(--color-high-risk)', color: '#fff', opacity: 0.9 };
        case 'VAT':
            return { backgroundColor: 'var(--color-medium-risk)', color: '#fff', opacity: 0.9 };
        case 'FIXED':
            return { backgroundColor: 'var(--color-text)', color: '#fff', opacity: 0.8 };
        case 'COST':
            return { backgroundColor: 'var(--color-text)', color: '#fff', opacity: 0.6 };
        default:
            return { backgroundColor: 'var(--color-primary)', color: '#fff', opacity: 0.8 };
    }
  };

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="w-full p-4 bg-white border rounded-lg shadow-sm text-left flex justify-between items-center hover:bg-gray-50 transition"
      >
        <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{transactions.length} Transacties (Klik om te tonen)</span>
        <ChevronDown className="w-5 h-5 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div 
        className="p-4 bg-gray-50 border-b flex justify-between items-center"
      >
        <div className="flex items-center gap-4">
            <h3 className="font-semibold cursor-pointer" style={{ color: 'var(--color-text)' }} onClick={() => setIsExpanded(false)}>
                Details ({filteredTransactions.length} items)
            </h3>
            <label className={`flex items-center gap-1 text-xs px-2 py-1 bg-white border rounded cursor-pointer hover:bg-gray-100 ${isUpdating ? 'opacity-50' : ''}`}>
                <Upload className="w-3 h-3" />
                {isUpdating ? 'Bezig...' : 'Data Verversen'}
                <input type="file" className="hidden" onChange={handleUpdateFile} disabled={isUpdating} />
            </label>
        </div>
        <ChevronUp className="w-5 h-5 text-gray-400 cursor-pointer" onClick={() => setIsExpanded(false)} />
      </div>

      {errors && errors.length > 0 && (
          <div className="bg-red-50 border-b border-red-100 p-2 text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                  <strong>Let op:</strong> Er zijn {errors.length} validatiefouten gevonden tijdens de laatste import.
                  <details className="mt-1">
                      <summary className="cursor-pointer hover:underline">Toon fouten</summary>
                      <ul className="list-disc list-inside mt-1">
                          {errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                          {errors.length > 5 && <li>... en nog {errors.length - 5} meer.</li>}
                      </ul>
                  </details>
              </div>
          </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50 border-b" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
            <tr>
              <th className="px-6 py-3">Datum</th>
              <th className="px-6 py-3">Omschrijving</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Bedrag</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3 text-right">Actie</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium whitespace-nowrap" style={{ color: 'var(--color-text)' }}>{tx.date}</td>
                <td className="px-6 py-4 max-w-xs break-words">
                  <div style={{ color: 'var(--color-text)' }} className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span>{tx.description}</span>
                        {tx.isRecurring && (
                            <span title="Terugkerende kostenpost" className="text-gray-400 shrink-0">
                                <Repeat className="w-3 h-3" />
                            </span>
                        )}
                    </div>
                  </div>
                  {tx.managerComment && (
                    <div 
                        className="mt-1 text-xs p-1 rounded inline-block"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'white', opacity: 0.8 }}
                    >
                      <strong>{tx.managerName}</strong> ({tx.commentDate}): {tx.managerComment}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                   {tx.status === TransactionStatus.PENDING ? (
                       <span className="flex items-center gap-1 text-amber-500 text-xs font-bold border border-amber-200 bg-amber-50 px-2 py-1 rounded-full w-fit">
                           <Clock className="w-3 h-3" />
                           Onzeker
                       </span>
                   ) : (
                       <span className="flex items-center gap-1 text-green-600 text-xs font-bold border border-green-200 bg-green-50 px-2 py-1 rounded-full w-fit">
                           <CheckCircle2 className="w-3 h-3" />
                           Zeker
                       </span>
                   )}
                </td>
                <td className="px-6 py-4 font-bold" style={{ color: 'var(--color-text)' }}>{formatCurrency(tx.amount)}</td>
                <td className="px-6 py-4">
                  <span 
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={getTypeStyle(tx.type)}
                  >
                    {tx.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const comment = prompt("Voeg een notitie toe:");
                      if (comment) onAddComment(tx.id, comment);
                    }}
                    className="transition hover:opacity-75"
                    style={{ color: 'var(--color-primary)' }}
                    title="Notitie toevoegen"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  Geen transacties gevonden. Controleer de import.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;