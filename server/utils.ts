import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Password hashing and verification functions using bcrypt
export async function hash(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function compare(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Format date in Hebrew style
export function formatDateHebrew(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Get a formatted current date
export function getCurrentDateHebrew(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  return now.toLocaleDateString('he-IL', options);
}

// Format currency with the appropriate symbol
export function formatCurrency(amount: number, currency: 'EUR' | 'ILS'): string {
  if (currency === 'EUR') {
    return `€${amount.toLocaleString()}`;
  } else {
    return `${amount.toLocaleString()} ₪`;
  }
}

// Convert currency based on exchange rate
export function convertCurrency(amount: number, fromCurrency: 'EUR' | 'ILS', toCurrency: 'EUR' | 'ILS', exchangeRate: number): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  if (fromCurrency === 'EUR' && toCurrency === 'ILS') {
    return amount * exchangeRate;
  } else {
    // ILS to EUR
    return amount / exchangeRate;
  }
}

// Calculate mortgage monthly payment
export function calculateMortgagePayment(principal: number, annualRate: number, termYears: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  
  return principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments) / (Math.pow(1 + monthlyRate, numPayments) - 1);
}

// Calculate total interest over the life of the loan
export function calculateTotalInterest(principal: number, monthlyPayment: number, termYears: number): number {
  return (monthlyPayment * termYears * 12) - principal;
}

// Calculate return on investment (ROI)
export function calculateROI(annualIncome: number, totalInvestment: number): number {
  return (annualIncome / totalInvestment) * 100;
}

// Calculate cash on cash return
export function calculateCashOnCash(annualCashFlow: number, cashInvested: number): number {
  return (annualCashFlow / cashInvested) * 100;
}

// Calculate cap rate
export function calculateCapRate(annualNetOperatingIncome: number, propertyValue: number): number {
  return (annualNetOperatingIncome / propertyValue) * 100;
}

// Helper to create a unique identifier
export function generateUniqueId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Calculate investment cash flow
export function calculateCashFlow(
  monthlyRent: number,
  monthlyMortgagePayment: number,
  monthlyExpenses: number
): number {
  return monthlyRent - monthlyMortgagePayment - monthlyExpenses;
}
