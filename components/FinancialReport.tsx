import React, { useState, useEffect } from 'react';
import { DataSource, LedgerEntry, AppSettings, ReportType, ThemeColors } from '../types';
import { ArrowUp, ArrowDown, AlertTriangle, CheckCircle2, MessageSquare, Upload, AlertCircle } from 'lucide-react';
import { parseFile } from '../services/importService';

interface Props {
  dataSource: DataSource;
  settings: AppSettings;
  themeColors: ThemeColors;
  onUpdateEntries: (sourceId: string, entries: LedgerEntry[], errors?: string[]) => void;
}

const FinancialReport: React.FC<Props> = ({ dataSource, settings, themeColors, onUpdateEntries }) => {
  // Local state for filtered/sorted entries to display
  const [entries, setEntries] = useState<LedgerEntry[]>(dataSource.ledgerEntries);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Re-sync if props change (e.g. source switch)
    setEntries(dataSource.ledgerEntries);
  }, [dataSource]);

  const handleUpdateFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUpdating(true);
      try {
          // Re-parse utilizing the existing source type
          const result = await parseFile(file, dataSource.id, dataSource.type);
          onUpdateEntries(dataSource.id, result.ledgerEntries, result.errors);
      } catch (err) {
          alert("Fout bij updaten: " + err);
      } finally {
          setIsUpdating(false);
      }
  };

  const filteredEntries = entries.filter(e => {
    if (!settings.showSmallAmounts) {
      return (e.debit + e.credit) >= settings.smallAmountThreshold;
    }
    return true;
  });

  const totalDebit = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = filteredEntries.reduce((sum, e) => sum + e.credit, 0);

  // Validation
  const validation = dataSource.validationTotals;
  const isDebitValid = validation ? Math.abs(validation.sourceDebit - totalDebit) < 1 : true;
  const isCreditValid = validation ? Math.abs(validation.sourceCredit - totalCredit) < 1 : true;

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newEntries = [...entries];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newEntries.length) {
       // Swap
       [newEntries[index], newEntries[targetIndex]] = [newEntries[targetIndex], newEntries[index]];
       // Update rowOrder locally
       newEntries.forEach((e, i) => e.rowOrder = i);
       setEntries(newEntries);
       onUpdateEntries(dataSource.id, newEntries);
    }
  };

  const handleComment = (id: string) => {
      const comment = prompt("Opmerking toevoegen:");
      if (comment) {
          const newEntries = entries.map(e => e.id === id ? {
              ...e,
              managerComment: comment,
              managerName: settings.appName || 'Manager',
              commentDate: new Date().toLocaleDateString('nl-NL')
          } : e);
          setEntries(newEntries);
          onUpdateEntries(dataSource.id, newEntries);
      }
  };

  const formatMoney = (val: number) => {
      if (val === 0) return '-';
      if (settings.currencyInK) return `€ ${(val / 1000).toFixed(1)}k`;
      return val.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
  };

  return (
    <div className="bg-white p-8 max-w-5xl mx-auto shadow-sm min-h-[600px] border-t-4 relative" style={{ borderColor: themeColors.primary }}>
        
        {/* Paper Report Header */}
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-serif font-bold text-black uppercase tracking-wider mb-2">
                    {dataSource.type === ReportType.BALANCE ? 'Balans' : 'Winst & Verlies'}
                </h1>
                <div className="flex items-center gap-4 text-sm font-mono text-gray-600">
                    <span>Rapportage: {dataSource.name}</span>
                    <span>|</span>
                    <span>Datum: {new Date().toLocaleDateString('nl-NL')}</span>
                    <label className={`flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 border rounded cursor-pointer hover:bg-gray-200 print:hidden ${isUpdating ? 'opacity-50' : ''}`}>
                        <Upload className="w-3 h-3" />
                        {isUpdating ? 'Bezig...' : 'Data Verversen'}
                        <input type="file" className="hidden" onChange={handleUpdateFile} disabled={isUpdating} />
                    </label>
                </div>
            </div>
            <div className="text-right">
                 <div className="text-xs text-gray-500 mb-1">Status Validatie</div>
                 {validation ? (
                     <div className={`flex items-center gap-1 text-sm font-bold ${isDebitValid && isCreditValid ? 'text-green-600' : 'text-red-600'}`}>
                         {isDebitValid && isCreditValid ? <CheckCircle2 className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                         {isDebitValid && isCreditValid ? 'Gevalideerd' : 'Afwijking Totaal'}
                     </div>
                 ) : (
                     <span className="text-xs text-gray-400">Geen bron-totaal</span>
                 )}
            </div>
        </div>

        {dataSource.errors && dataSource.errors.length > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700 print:hidden">
              <h4 className="font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Validatie Waarschuwingen
              </h4>
              <ul className="list-disc list-inside mt-1 text-xs">
                  {dataSource.errors.slice(0,3).map((e,i) => <li key={i}>{e}</li>)}
                  {dataSource.errors.length > 3 && <li>... (+{dataSource.errors.length - 3} andere)</li>}
              </ul>
          </div>
        )}

        {/* The Table */}
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b-2 border-black text-xs font-bold uppercase tracking-wide">
                    <th className="py-2 w-16">Code</th>
                    <th className="py-2">Omschrijving</th>
                    <th className="py-2 text-right w-32">Debet</th>
                    <th className="py-2 text-right w-32">Credit</th>
                    <th className="py-2 w-16 print:hidden">Actie</th>
                </tr>
            </thead>
            <tbody className="font-mono text-sm">
                {filteredEntries.map((entry, idx) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                        <td className="py-2 text-gray-500">{entry.code}</td>
                        <td className="py-2 pr-4 relative">
                            {entry.description}
                            {entry.managerComment && (
                                <div className="block mt-1 text-[10px] italic text-blue-600">
                                    ↳ {entry.managerComment} ({entry.managerName})
                                </div>
                            )}
                        </td>
                        <td className="py-2 text-right font-medium">
                            {formatMoney(entry.debit)}
                        </td>
                        <td className="py-2 text-right font-medium">
                            {formatMoney(entry.credit)}
                        </td>
                        <td className="py-2 text-right flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                             <button onClick={() => moveItem(idx, 'up')} className="p-1 hover:bg-gray-200 rounded">
                                <ArrowUp className="w-3 h-3 text-gray-500" />
                             </button>
                             <button onClick={() => moveItem(idx, 'down')} className="p-1 hover:bg-gray-200 rounded">
                                <ArrowDown className="w-3 h-3 text-gray-500" />
                             </button>
                             <button onClick={() => handleComment(entry.id)} className="p-1 hover:bg-gray-200 rounded">
                                <MessageSquare className="w-3 h-3 text-blue-500" />
                             </button>
                        </td>
                    </tr>
                ))}
            </tbody>
            <tfoot className="border-t-2 border-black bg-gray-50 font-bold">
                <tr>
                    <td colSpan={2} className="py-3 pl-2">TOTAAL GENEREERD</td>
                    <td className="py-3 text-right">{formatMoney(totalDebit)}</td>
                    <td className="py-3 text-right">{formatMoney(totalCredit)}</td>
                    <td className="print:hidden"></td>
                </tr>
                {validation && (!isDebitValid || !isCreditValid) && (
                    <tr className="text-red-600 italic text-xs">
                        <td colSpan={2} className="py-2 pl-2">Bronbestand Totaal (Afwijking)</td>
                        <td className="py-2 text-right">
                            {formatMoney(validation.sourceDebit)} 
                            <span className="block text-[10px]">Diff: {formatMoney(validation.sourceDebit - totalDebit)}</span>
                        </td>
                        <td className="py-2 text-right">
                            {formatMoney(validation.sourceCredit)}
                             <span className="block text-[10px]">Diff: {formatMoney(validation.sourceCredit - totalCredit)}</span>
                        </td>
                        <td></td>
                    </tr>
                )}
            </tfoot>
        </table>

        {/* Footer Notes */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 flex justify-between print:flex">
             <span>Gegenereerd door {settings.appName}</span>
             <span>Pagina 1 van 1</span>
        </div>
    </div>
  );
};

export default FinancialReport;