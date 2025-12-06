export enum TransactionType {
  DEBTOR = 'DEBTOR', // Debiteuren (In)
  CREDITOR = 'CREDITOR', // Crediteuren (Out)
  COST = 'COST', // Variabele Bankkosten (Out)
  FIXED = 'FIXED', // Vaste Lasten (Huur, Salaris, Abo's) (Out)
  SUBSIDY = 'SUBSIDY', // Subsidies (In)
  VAT = 'VAT', // BTW (Out usually, or In)
  ONE_OFF = 'ONE_OFF' // Eenmalig
}

export enum TransactionStatus {
  CONFIRMED = 'CONFIRMED', // Zeker / Toegekend
  PENDING = 'PENDING', // Onzeker / Aangevraagd
}

export enum ReportType {
  CASHFLOW = 'CASHFLOW', // Existing functionality
  BALANCE = 'BALANCE', // Balans
  PNL = 'PNL', // Winst & Verlies
  EMPTY = 'EMPTY' // New unconfigured tab
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  amount: number;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  isRecurring: boolean; // e.g. Monthly subscription, Salary
  sourceId: string; // ID of the "file" or tab it belongs to
  managerComment?: string;
  managerName?: string;
  commentDate?: string;
}

export interface LedgerEntry {
  id: string;
  code: string;
  description: string;
  debit: number;
  credit: number;
  rowOrder: number; // For sorting
  category?: string; // Activa, Passiva, Omzet, Kosten
  sourceId: string;
  managerComment?: string;
  managerName?: string;
  commentDate?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: ReportType;
  isActive: boolean;
  defaultTransactionType?: TransactionType; // Remembers if this is specifically 'CREDITOR', 'DEBTOR' etc.
  transactions: Transaction[]; // For Cashflow mode
  ledgerEntries: LedgerEntry[]; // For Financial Report mode
  validationTotals?: {
    sourceDebit: number;
    sourceCredit: number;
  };
  errors?: string[]; // Validation errors from import
}

export enum ScenarioType {
  OPTIMISTIC = 'Optimistisch',
  REALISTIC = 'Realistisch',
  PESSIMISTIC = 'Pessimistisch',
}

export interface DailyBalance {
  date: string;
  incoming: number;
  outgoing: number;
  balance: number;
  details: {
    debtors: number;
    creditors: number;
    variableCosts: number;
    fixedCosts: number; // Salaris, Huur, Abo's
    vat: number;
    subsidies: number;
  };
}

export interface ThemeColors {
  primary: string;
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
  text: string;
  accent1?: string;
  accent2?: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export interface AppSettings {
  showSmallAmounts: boolean; // Hide < 50
  currencyInK: boolean; // Show 1k instead of 1000
  smallAmountThreshold: number;
  appName: string;
  activeThemeId: string;
}

export type DateRangeType = '7DAYS' | '14DAYS' | 'CUSTOM' | 'ALL';

export interface DateRange {
  type: DateRangeType;
  startDate?: string; // Used for CUSTOM
  endDate?: string;   // Used for CUSTOM
}