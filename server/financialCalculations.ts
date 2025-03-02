/**
 * financialCalculations.ts
 * מודול המכיל את כל פונקציות החישוב הפיננסיות לנדל"ן בקפריסין
 */

/**
 * חישוב מחיר הנכס כולל מע"מ
 * @param priceWithoutVAT מחיר ללא מע"מ ביורו
 * @param vatRate שיעור המע"מ (ברירת מחדל 19%)
 * @returns מחיר כולל מע"מ ביורו
 */
export function calculatePriceWithVAT(priceWithoutVAT: number, vatRate: number = 19): number {
  return priceWithoutVAT * (1 + vatRate / 100);
}

/**
 * חישוב מס רכישה בקפריסין
 * טבלת מס רכישה בקפריסין:
 * - עד 85,000 יורו: 3%
 * - 85,001 עד 170,000 יורו: 5% 
 * - מעל 170,000 יורו: 8%
 * @param propertyValue ערך הנכס ביורו
 * @returns סכום מס הרכישה ביורו
 */
export function calculateStampDuty(propertyValue: number): number {
  let stampDuty = 0;
  
  if (propertyValue <= 85000) {
    stampDuty = propertyValue * 0.03;
  } else if (propertyValue <= 170000) {
    stampDuty = 85000 * 0.03 + (propertyValue - 85000) * 0.05;
  } else {
    stampDuty = 85000 * 0.03 + 85000 * 0.05 + (propertyValue - 170000) * 0.08;
  }
  
  return stampDuty;
}

/**
 * חישוב עלות ריהוט לפי מספר חדרי שינה
 * @param bedroomCount מספר חדרי שינה
 * @param hasFurniture האם הנכס כולל ריהוט
 * @returns עלות הריהוט ביורו
 */
export function calculateFurnitureCost(bedroomCount: number, hasFurniture: boolean): number {
  if (hasFurniture) {
    return 0; // הנכס כבר מרוהט
  }
  
  // עלויות ריהוט משוערות לפי מספר חדרי שינה
  switch (bedroomCount) {
    case 0: // סטודיו
      return 5000;
    case 1:
      return 8000;
    case 2:
      return 12000;
    case 3:
      return 16000;
    case 4:
      return 22000;
    default:
      return 25000 + (bedroomCount - 5) * 5000; // תוספת של 5000 יורו לכל חדר נוסף מעל 5
  }
}

/**
 * חישוב עלויות נלוות לרכישה
 * @param propertyValue ערך הנכס ביורו
 * @param hasRealEstateAgent האם יש סוכן נדל"ן (ברירת מחדל: כן)
 * @returns אובייקט עם פירוט העלויות הנלוות
 */
export function calculateAcquisitionCosts(
  propertyValue: number, 
  hasRealEstateAgent: boolean = true
): {
  legalFees: number; // עלויות משפטיות
  agentFees: number; // עמלת תיווך
  landRegistryFees: number; // עלויות רישום מקרקעין
  bankFees: number; // עלויות בנקאיות
  other: number; // עלויות אחרות
  total: number; // סה"כ עלויות נלוות
} {
  // עלויות משפטיות - בממוצע 1% מערך הנכס
  const legalFees = propertyValue * 0.01;
  
  // עמלת תיווך - בממוצע 3% אם יש סוכן
  const agentFees = hasRealEstateAgent ? propertyValue * 0.03 : 0;
  
  // עלויות רישום מקרקעין - 0.5% מערך הנכס
  const landRegistryFees = propertyValue * 0.005;
  
  // עלויות בנקאיות - כ-1000 יורו קבועים
  const bankFees = 1000;
  
  // עלויות אחרות - כ-500 יורו קבועים
  const other = 500;
  
  // סה"כ עלויות נלוות
  const total = legalFees + agentFees + landRegistryFees + bankFees + other;
  
  return {
    legalFees,
    agentFees,
    landRegistryFees,
    bankFees,
    other,
    total
  };
}

/**
 * חישוב סה"כ עלות רכישה
 * @param priceWithoutVAT מחיר הנכס ללא מע"מ
 * @param vatRate שיעור המע"מ
 * @param bedroomCount מספר חדרי שינה
 * @param hasFurniture האם כולל ריהוט
 * @param hasRealEstateAgent האם יש סוכן נדל"ן
 * @returns אובייקט עם כל מרכיבי העלות
 */
export function calculateTotalAcquisitionCost(
  priceWithoutVAT: number,
  vatRate: number = 19,
  bedroomCount: number = 2,
  hasFurniture: boolean = false,
  hasRealEstateAgent: boolean = true
): {
  priceWithoutVAT: number;
  priceWithVAT: number;
  vatAmount: number; 
  stampDuty: number;
  furnitureCost: number;
  acquisitionCosts: {
    legalFees: number;
    agentFees: number;
    landRegistryFees: number;
    bankFees: number;
    other: number;
    total: number;
  };
  totalCost: number;
} {
  const priceWithVAT = calculatePriceWithVAT(priceWithoutVAT, vatRate);
  const vatAmount = priceWithVAT - priceWithoutVAT;
  const stampDuty = calculateStampDuty(priceWithoutVAT);
  const furnitureCost = calculateFurnitureCost(bedroomCount, hasFurniture);
  const acquisitionCosts = calculateAcquisitionCosts(priceWithoutVAT, hasRealEstateAgent);
  
  const totalCost = priceWithVAT + stampDuty + furnitureCost + acquisitionCosts.total;
  
  return {
    priceWithoutVAT,
    priceWithVAT,
    vatAmount,
    stampDuty,
    furnitureCost,
    acquisitionCosts,
    totalCost
  };
}

/**
 * חישוב תשואה פוטנציאלית שנתית
 * @param annualRent הכנסה שנתית משכירות
 * @param totalInvestment השקעה כוללת
 * @returns אחוז התשואה
 */
export function calculatePotentialYield(annualRent: number, totalInvestment: number): number {
  return (annualRent / totalInvestment) * 100;
}

/**
 * חישוב תזרים מזומנים חודשי
 * @param monthlyRent הכנסה חודשית משכירות
 * @param monthlyMortgagePayment תשלום משכנתא חודשי
 * @param monthlyManagementFee דמי ניהול חודשיים
 * @param monthlyExpenses הוצאות חודשיות נוספות
 * @returns תזרים מזומנים חודשי
 */
export function calculateMonthlyCashFlow(
  monthlyRent: number,
  monthlyMortgagePayment: number = 0,
  monthlyManagementFee: number = 0,
  monthlyExpenses: number = 0
): number {
  return monthlyRent - monthlyMortgagePayment - monthlyManagementFee - monthlyExpenses;
}

/**
 * חישוב החזר חודשי של משכנתא
 * @param loanAmount סכום ההלוואה
 * @param annualInterestRate שיעור ריבית שנתית
 * @param loanTermYears תקופת ההלוואה בשנים
 * @returns החזר חודשי
 */
export function calculateMonthlyMortgagePayment(
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number
): number {
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  
  if (monthlyInterestRate === 0) {
    return loanAmount / numberOfPayments;
  }
  
  return loanAmount * 
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
}

/**
 * חישוב סכום משכנתא אופטימלי
 * @param propertyValue ערך הנכס
 * @param maxLTV שיעור המימון המקסימלי (ברירת מחדל 60%)
 * @returns סכום המשכנתא המומלץ
 */
export function calculateOptimalMortgageAmount(
  propertyValue: number, 
  maxLTV: number = 60
): number {
  return propertyValue * (maxLTV / 100);
}

/**
 * חישוב צפי תשואה עתידית
 * @param currentRent שכירות נוכחית
 * @param annualIncreaseRate שיעור עליית שכירות שנתי (ברירת מחדל 3%)
 * @param years מספר שנים לחזות
 * @returns צפי שכירות בעוד מספר שנים
 */
export function calculateFutureRent(
  currentRent: number,
  annualIncreaseRate: number = 3,
  years: number = 5
): number {
  return currentRent * Math.pow(1 + annualIncreaseRate / 100, years);
}

/**
 * חישוב תשואה על הון עצמי
 * @param annualCashFlow תזרים מזומנים שנתי
 * @param equityAmount סכום ההון העצמי
 * @returns אחוז תשואה על ההון העצמי
 */
export function calculateReturnOnEquity(
  annualCashFlow: number,
  equityAmount: number
): number {
  return (annualCashFlow / equityAmount) * 100;
}