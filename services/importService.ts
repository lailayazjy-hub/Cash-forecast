import { Transaction, TransactionType, TransactionStatus, LedgerEntry, ReportType } from '../types';

// Helper to parse Dutch numbers: 1.234,56 or 100,00-
const parseDutchNumber = (val: string | undefined): number => {
  if (!val) return 0;
  let clean = val.trim();
  
  // Handle trailing negative sign (Exact Online feature: "100,00-")
  let isNegative = false;
  if (clean.endsWith('-')) {
    isNegative = true;
    clean = clean.substring(0, clean.length - 1);
  } else if (clean.startsWith('-')) {
    isNegative = true;
    clean = clean.substring(1);
  }

  // Handle Dutch format 1.234,56 vs English 1,234.56
  // Logic: if both . and , exist, the last one is the decimal separator.
  if (clean.includes(',') && clean.includes('.')) {
       if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
           // Dutch: 1.234,56 -> 1234.56
           clean = clean.replace(/\./g, '').replace(',', '.');
       } else {
           // English: 1,234.56 -> 1234.56
           clean = clean.replace(/,/g, '');
       }
  } else if (clean.includes(',')) {
      // Assume comma is decimal if no dots (Standard Dutch) -> 1234,56 -> 1234.56
      clean = clean.replace(',', '.');
  } else if (clean.includes('.')) {
      // Assume dot is decimal if no commas. 
      if ((clean.match(/\./g) || []).length > 1) {
          clean = clean.replace(/\./g, '');
      }
  }
  
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
};

function parseDate(d: string): string | null {
    if (!d) return null;
    
    // Clean string (remove quotes etc)
    const clean = d.trim().replace(/^['"]+|['"]+$/g, '');

    // Check YYYY-MM-DD
    if (clean.match(/^\d{4}-\d{2}-\d{2}$/)) return clean;
    
    // Check DD-MM-YYYY or DD/MM/YYYY or D-M-YYYY
    // Also support DD.MM.YYYY
    const parts = clean.split(/[-/.]/);
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        
        // Basic validation
        const dateObj = new Date(`${year}-${month}-${day}`);
        if (isNaN(dateObj.getTime())) return null;
        
        return `${year}-${month}-${day}`;
    }
    
    // Check YYYYMMDD
    if (clean.match(/^\d{8}$/)) {
        const year = clean.substr(0, 4);
        const month = clean.substr(4, 2);
        const day = clean.substr(6, 2);
        return `${year}-${month}-${day}`;
    }

    return null;
}

// Keywords to detect header row
const HEADER_KEYWORDS = {
    date: ['datum', 'date', 'factuurdatum', 'transactiedatum', 'entry date'],
    dueDate: ['vervaldatum', 'verval', 'due date', 'exp date'],
    amount: ['bedrag', 'amount', 'saldo', 'debet', 'credit', 'waarde', 'openstaand', 'bedrag(val)', 'bedrag (val)'],
    description: ['omschrijving', 'description', 'naam', 'relatienaam', 'relatie', 'opmerking', 'details'],
    code: ['code', 'grootboek', 'rekening', 'gl', 'account', 'rekeningnummer', 'gbrek'],
    type: ['dagboek', 'type', 'kostensoort', 'journal']
};

interface ColumnMapping {
    date: number;
    dueDate: number;
    desc: number;
    code: number;
    debet: number;
    credit: number;
    saldo: number;
    relName: number;
    journal: number; // Dagboek
    entryNum: number; // Boekstuknr
}

// Robust line splitter that handles quoted CSV values (e.g. "1.234,56"; "Text")
const splitLine = (line: string, separator: string): string[] => {
    const res = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
            res.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    res.push(current);
    return res;
};

const detectSeparator = (rows: string[]): string => {
    const candidates = [';', ',', '\t'];
    const scores = candidates.map(sep => {
        let consistentCount = 0;
        let totalSep = 0;
        let prevCount = -1;
        
        // Scan first 10 rows
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            // Count separators outside quotes would be ideal, but simple count is usually enough for detection
            const count = (rows[i].match(new RegExp(sep === '\t' ? '\\t' : '\\' + sep, 'g')) || []).length;
            if (count > 0) {
                totalSep += count;
                if (prevCount === -1) prevCount = count;
                else if (Math.abs(prevCount - count) <= 2) consistentCount++; // Allow small variance
            }
        }
        return { sep, score: totalSep + (consistentCount * 5) };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0].score > 0 ? scores[0].sep : ','; // Default to comma
};

const detectHeader = (rows: string[], separator: string): { index: number, mapping: ColumnMapping } | null => {
    // Scan first 50 rows to find the best header candidate
    let bestScore = 0;
    let bestIndex = -1;
    let bestMapping: ColumnMapping = { date: -1, dueDate: -1, desc: -1, code: -1, debet: -1, credit: -1, saldo: -1, relName: -1, journal: -1, entryNum: -1 };

    for (let i = 0; i < Math.min(rows.length, 50); i++) {
        // Use smart split
        const cols = splitLine(rows[i], separator).map(c => c.trim().toLowerCase().replace(/^"|"$/g, ''));
        
        let score = 0;
        const currentMapping = { ...bestMapping };

        cols.forEach((col, idx) => {
            if (col.length < 2) return; // Skip tiny headers

            if (HEADER_KEYWORDS.date.some(k => col.includes(k)) && !col.includes('verval')) { score += 2; currentMapping.date = idx; }
            if (HEADER_KEYWORDS.dueDate.some(k => col.includes(k))) { score += 2; currentMapping.dueDate = idx; }
            if (HEADER_KEYWORDS.description.some(k => col.includes(k))) { score += 1; currentMapping.desc = idx; }
            if (HEADER_KEYWORDS.code.some(k => col === k || col.includes(k))) { score += 2; currentMapping.code = idx; }
            
            // Exact matches for debet/credit give high confidence
            if (col === 'debet' || col === 'debit') { score += 3; currentMapping.debet = idx; }
            else if (col.includes('debet') || col.includes('debit')) { score += 1; currentMapping.debet = idx; }

            if (col === 'credit') { score += 3; currentMapping.credit = idx; }
            else if (col.includes('credit')) { score += 1; currentMapping.credit = idx; }

            if ((col.includes('bedrag') || col.includes('saldo') || col.includes('openstaand') || col === 'amount') && !col.includes('btw')) { score += 2; currentMapping.saldo = idx; }
            
            if (col.includes('relatienaam') || col.includes('relatie')) { score += 2; currentMapping.relName = idx; }
            if (col.includes('dagboek')) { score += 1; currentMapping.journal = idx; }
            if (col.includes('boekstuk') || col.includes('bkst')) { score += 1; currentMapping.entryNum = idx; }
        });

        // Heuristic: Must have at least a Date OR Due Date, AND some financial value (Amount, Debit, Credit) OR Description/Code
        const hasDate = currentMapping.date > -1 || currentMapping.dueDate > -1;
        const hasValue = currentMapping.saldo > -1 || currentMapping.debet > -1 || currentMapping.credit > -1;
        const hasDetail = currentMapping.desc > -1 || currentMapping.code > -1 || currentMapping.relName > -1;

        if (hasDate && (hasValue || hasDetail)) {
             // Bonus for structure
             if (hasValue) score += 2;
             
             if (score > bestScore) {
                bestScore = score;
                bestIndex = i;
                bestMapping = currentMapping;
            }
        }
    }

    if (bestIndex > -1) {
        return { index: bestIndex, mapping: bestMapping };
    }
    return null;
};

export const parseFile = async (
    file: File, 
    sourceId: string, 
    reportType: ReportType,
    forcedType?: TransactionType
): Promise<{
    transactions: Transaction[], 
    ledgerEntries: LedgerEntry[],
    validationTotals?: { sourceDebit: number, sourceCredit: number },
    errors: string[]
}> => {
    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(r => r.trim().length > 0);
    const errors: string[] = [];
    
    if (rows.length === 0) throw new Error("Bestand is leeg.");

    const separator = detectSeparator(rows);
    const headerInfo = detectHeader(rows, separator);

    if (!headerInfo) {
        throw new Error("Kon de tabelstructuur niet automatisch herkennen. Controleer of de headers 'Datum', 'Bedrag', 'Omschrijving' etc. bevatten.");
    }

    const { index: headerRowIndex, mapping: idx } = headerInfo;
    const transactions: Transaction[] = [];
    const ledgerEntries: LedgerEntry[] = [];
    
    let sourceDebit = 0;
    let sourceCredit = 0;
    let rowOrder = 0;

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const cols = splitLine(rows[i], separator).map(c => c.trim().replace(/^"|"$/g, ''));
        
        // Strict: Min 4 filled cells (relaxed slightly from 5 for some compact CSVs)
        const filledCells = cols.filter(c => c.length > 0).length;
        if (filledCells < 4) continue;

        const descRaw = idx.desc > -1 ? cols[idx.desc] : 'Onbekend';
        const code = idx.code > -1 ? cols[idx.code] : '';
        const relName = idx.relName > -1 ? cols[idx.relName] : '';
        const journal = idx.journal > -1 ? cols[idx.journal] : '';

        // Check for Totaal lines
        if (descRaw.toLowerCase().startsWith('totaal') || descRaw.toLowerCase().includes('resultaat')) {
             const d = idx.debet > -1 ? parseDutchNumber(cols[idx.debet]) : 0;
             const c = idx.credit > -1 ? parseDutchNumber(cols[idx.credit]) : 0;
             if (d !== 0 || c !== 0) {
                sourceDebit = d;
                sourceCredit = c;
             }
             continue;
        }

        // Parse Amounts
        let debit = 0;
        let credit = 0;
        let saldo = 0;

        if (idx.debet > -1) debit = parseDutchNumber(cols[idx.debet]);
        if (idx.credit > -1) credit = parseDutchNumber(cols[idx.credit]);
        if (idx.saldo > -1) saldo = parseDutchNumber(cols[idx.saldo]);

        // Balance / PnL logic
        if (reportType === ReportType.BALANCE || reportType === ReportType.PNL) {
             if (debit === 0 && credit === 0) continue;

             ledgerEntries.push({
                id: `ldg-${Math.random().toString(36).substr(2, 9)}`,
                code: code,
                description: descRaw,
                debit,
                credit,
                rowOrder: rowOrder++,
                sourceId,
                category: reportType === ReportType.BALANCE ? (code < '2000' ? 'Balans' : 'W&V') : 'W&V'
            });
            continue;
        }

        // Cashflow Logic
        // Determine Date: Prioritize Due Date if forced type is Debtor/Creditor
        let dateRaw = '';
        if ((forcedType === TransactionType.DEBTOR || forcedType === TransactionType.CREDITOR) && idx.dueDate > -1) {
            dateRaw = cols[idx.dueDate];
            if (!dateRaw && idx.date > -1) dateRaw = cols[idx.date]; // Fallback
        } else if (idx.date > -1) {
            dateRaw = cols[idx.date];
        }

        if (!dateRaw) {
            // Only log error if it looks like a real row (has amount)
            if (debit !== 0 || credit !== 0 || saldo !== 0) {
                errors.push(`Regel ${i + 1}: Datum ontbreekt.`);
            }
            continue;
        }

        const parsedDate = parseDate(dateRaw);
        if (!parsedDate) {
             if (debit !== 0 || credit !== 0 || saldo !== 0) {
                errors.push(`Regel ${i + 1}: Ongeldige datum '${dateRaw}'.`);
             }
            continue;
        }

        let amount = 0;
        let type = TransactionType.COST;

        if (forcedType) {
            type = forcedType;
            // Use saldo/amount absolute value if forced
            if (saldo !== 0) amount = Math.abs(saldo);
            else if (debit !== 0) amount = debit;
            else if (credit !== 0) amount = credit;
        } else {
            // Heuristic
            if (debit > 0) {
                amount = debit;
                type = TransactionType.DEBTOR;
            } else {
                amount = credit;
                type = TransactionType.CREDITOR;
            }
            if (amount === 0 && saldo !== 0) {
                amount = Math.abs(saldo);
                type = saldo >= 0 ? TransactionType.DEBTOR : TransactionType.CREDITOR;
            }
        }

        if (amount === 0) continue;

        // Extra Heuristics if not forced
        if (!forcedType) {
            const fullText = (descRaw + " " + relName + " " + journal).toLowerCase();
            if (fullText.includes('salaris') || fullText.includes('loon') || fullText.includes('personeel')) type = TransactionType.FIXED;
            else if (fullText.includes('huur') || fullText.includes('lease')) type = TransactionType.FIXED;
            else if (fullText.includes('btw') || fullText.includes('belasting')) type = TransactionType.VAT;
            else if (fullText.includes('subsidie') || fullText.includes('toeslag')) type = TransactionType.SUBSIDY;
        }

        transactions.push({
            id: `imp-${Math.random().toString(36).substr(2, 9)}`,
            date: parsedDate,
            amount,
            description: relName ? `${descRaw} (${relName})` : descRaw,
            type,
            status: TransactionStatus.CONFIRMED,
            isRecurring: false,
            sourceId
        });
    }

    if (transactions.length === 0 && ledgerEntries.length === 0 && errors.length === 0) {
        errors.push("Geen transacties herkend. Controleer of de kolommen Datum en Bedrag aanwezig zijn.");
    }

    return { transactions, ledgerEntries, validationTotals: { sourceDebit, sourceCredit }, errors };
};