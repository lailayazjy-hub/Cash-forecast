import React, { useState } from 'react';
import { Upload, FileSpreadsheet, PieChart, TrendingUp, Loader2, AlertCircle, ArrowDownLeft, ArrowUpRight, Coins, Receipt, Landmark } from 'lucide-react';
import { ReportType, DataSource, TransactionType } from '../types';
import { parseFile } from '../services/importService';

interface Props {
  sourceId: string;
  onConfigured: (id: string, data: Partial<DataSource>) => void;
  onCancel: (id: string) => void;
}

const SourceConfigurator: React.FC<Props> = ({ sourceId, onConfigured, onCancel }) => {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType | undefined>(undefined);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSelect = (rType: ReportType, tType?: TransactionType, label?: string) => {
      setSelectedType(rType);
      setTransactionType(tType);
      setSelectedLabel(label || '');
      setErrors([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedType) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrors([]);

    try {
      const result = await parseFile(file, sourceId, selectedType, transactionType);
      
      if (result.errors && result.errors.length > 0) {
          setErrors(result.errors);
          if (result.transactions.length === 0 && result.ledgerEntries.length === 0) {
              setIsLoading(false);
              return;
          }
      }

      const newSourceData: Partial<DataSource> = {
        name: selectedLabel || file.name.split('.')[0],
        type: selectedType,
        defaultTransactionType: transactionType, // Store this preference
        transactions: result.transactions,
        ledgerEntries: result.ledgerEntries,
        validationTotals: result.validationTotals,
        errors: result.errors
      };
      
      onConfigured(sourceId, newSourceData);
    } catch (error: any) {
      console.error(error);
      setErrors([`Fatale fout bij lezen bestand: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Nieuwe Bron Configureren</h2>
        <p className="text-gray-500 mb-8">Selecteer het type data en upload het bestand.</p>
        
        {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="flex items-center gap-2 font-bold text-red-700 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Validatie Fouten
                </h3>
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {errors.slice(0, 5).map((err, idx) => <li key={idx}>{err}</li>)}
                    {errors.length > 5 && <li>... en nog {errors.length - 5} meer.</li>}
                </ul>
            </div>
        )}

        {/* Section 1: Cashflow & Liquidity */}
        <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Liquiditeit & Cashflow
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <button
                    onClick={() => handleSelect(ReportType.CASHFLOW, undefined, 'Bank & Mutaties')}
                    className={`p-4 rounded-lg border-2 flex items-center gap-3 transition text-left ${selectedLabel === 'Bank & Mutaties' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-100 hover:border-blue-300 hover:bg-gray-50'}`}
                >
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="block font-bold text-sm">Bank & Mutaties</span>
                        <span className="text-xs text-gray-500">Algemene bankrapporten</span>
                    </div>
                </button>

                <button
                    onClick={() => handleSelect(ReportType.CASHFLOW, TransactionType.DEBTOR, 'Debiteuren (In)')}
                    className={`p-4 rounded-lg border-2 flex items-center gap-3 transition text-left ${selectedLabel === 'Debiteuren (In)' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-100 hover:border-green-300 hover:bg-gray-50'}`}
                >
                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <ArrowDownLeft className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="block font-bold text-sm">Debiteuren (In)</span>
                        <span className="text-xs text-gray-500">Openstaande facturen</span>
                    </div>
                </button>

                <button
                    onClick={() => handleSelect(ReportType.CASHFLOW, TransactionType.CREDITOR, 'Crediteuren (Uit)')}
                    className={`p-4 rounded-lg border-2 flex items-center gap-3 transition text-left ${selectedLabel === 'Crediteuren (Uit)' ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-100 hover:border-red-300 hover:bg-gray-50'}`}
                >
                    <div className="p-2 bg-red-100 rounded-full text-red-600">
                        <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="block font-bold text-sm">Crediteuren (Uit)</span>
                        <span className="text-xs text-gray-500">Te betalen facturen</span>
                    </div>
                </button>

                <button
                    onClick={() => handleSelect(ReportType.CASHFLOW, TransactionType.SUBSIDY, 'Subsidies & Overig')}
                    className={`p-4 rounded-lg border-2 flex items-center gap-3 transition text-left ${selectedLabel === 'Subsidies & Overig' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-gray-100 hover:border-purple-300 hover:bg-gray-50'}`}
                >
                    <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                        <Coins className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="block font-bold text-sm">Subsidies</span>
                        <span className="text-xs text-gray-500">Verwachte ontvangsten</span>
                    </div>
                </button>

                 <button
                    onClick={() => handleSelect(ReportType.CASHFLOW, TransactionType.VAT, 'Te Betalen BTW')}
                    className={`p-4 rounded-lg border-2 flex items-center gap-3 transition text-left ${selectedLabel === 'Te Betalen BTW' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-100 hover:border-orange-300 hover:bg-gray-50'}`}
                >
                    <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                        <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="block font-bold text-sm">Te betalen BTW</span>
                        <span className="text-xs text-gray-500">Maand/Kwartaal afdracht</span>
                    </div>
                </button>

            </div>
        </div>

        {/* Section 2: Financial Reports */}
        <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-700 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Financiële Rapportage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button
                    onClick={() => handleSelect(ReportType.PNL, undefined, 'Winst & Verlies')}
                    className={`p-4 rounded-lg border-2 flex items-center gap-3 transition text-left ${selectedLabel === 'Winst & Verlies' ? 'border-gray-800 bg-gray-100 ring-1 ring-gray-600' : 'border-gray-100 hover:border-gray-400 hover:bg-gray-50'}`}
                >
                    <div className="p-2 bg-gray-200 rounded-full text-gray-700">
                        <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="block font-bold text-sm">Winst & Verlies</span>
                        <span className="text-xs text-gray-500">Resultatenrekening</span>
                    </div>
                </button>

                <button
                    onClick={() => handleSelect(ReportType.BALANCE, undefined, 'Balans')}
                    className={`p-4 rounded-lg border-2 flex items-center gap-3 transition text-left ${selectedLabel === 'Balans' ? 'border-gray-800 bg-gray-100 ring-1 ring-gray-600' : 'border-gray-100 hover:border-gray-400 hover:bg-gray-50'}`}
                >
                    <div className="p-2 bg-gray-200 rounded-full text-gray-700">
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="block font-bold text-sm">Balans</span>
                        <span className="text-xs text-gray-500">Activa & Passiva</span>
                    </div>
                </button>
            </div>
        </div>

        {selectedLabel && (
            <div className="border-t pt-8 text-center animate-in fade-in slide-in-from-bottom-2">
               <label 
                 className={`inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg text-white font-medium shadow-md transition cursor-pointer text-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`} 
                 style={{ backgroundColor: 'var(--color-primary)' }}
               >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  <span>{selectedLabel} Uploaden</span>
                  <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileChange}
                      accept=".csv,.txt,.xls,.xlsx"
                      disabled={isLoading}
                  />
               </label>
               <p className="mt-4 text-sm text-gray-400">
                 Ondersteunt Exact Online & Excel
               </p>
            </div>
        )}

        <div className="mt-8 flex justify-center">
            <button onClick={() => onCancel(sourceId)} className="text-gray-400 hover:text-gray-600 text-sm hover:underline">
                Annuleren
            </button>
        </div>
      </div>
    </div>
  );
};

export default SourceConfigurator;