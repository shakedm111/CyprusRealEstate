// server/routes.ts - נתיבי API מותאמים לאפיון המקורי

import express from 'express';
import auth from './auth';
import { db } from './db';
import { users, calculators, properties, investments } from '../schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const router = express.Router();

// === נתיבי אימות ===
router.post('/api/login', auth.login);

// בדיקת המצב הנוכחי של המשתמש
router.get('/api/me', auth.authenticateToken, (req, res) => {
  res.json({ user: (req as any).user });
});

// === נתיבי ניהול משתמשים (יועצים ומשקיעים) ===

// יצירת משקיע חדש (רק ליועצים)
router.post('/api/investors', auth.authenticateToken, auth.isAdvisor, async (req, res) => {
  try {
    const { username, email, name, phone } = req.body;
    
    // יצירת סיסמה ראשונית (לדוגמה: 8 תווים רנדומליים)
    const initialPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    
    // בדיקה אם שם המשתמש כבר קיים
    const existingUser = await db.select({ count: users.id }).from(users)
      .where(eq(users.username, username));
    
    if (existingUser[0].count > 0) {
      return res.status(400).json({ error: 'שם המשתמש כבר קיים במערכת' });
    }
    
    // יצירת המשקיע החדש
    const result = await db.insert(users).values({
      username,
      password: hashedPassword,
      email,
      name,
      phone,
      role: 'investor',
      status: 'active',
      createdBy: (req as any).user.userId,
      updatedBy: (req as any).user.userId
    }).returning({ id: users.id });
    
    // החזר תגובה עם שם המשתמש והסיסמה הראשונית
    res.status(201).json({
      message: 'משקיע נוצר בהצלחה',
      investorId: result[0].id,
      initialCredentials: {
        username,
        password: initialPassword
      }
    });
  } catch (error) {
    console.error('Error creating investor:', error);
    res.status(500).json({ error: 'אירעה שגיאה ביצירת המשקיע' });
  }
});

// קבלת רשימת המשקיעים (רק ליועצים)
router.get('/api/investors', auth.authenticateToken, auth.isAdvisor, async (req, res) => {
  try {
    const investorsList = await db.select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      phone: users.phone,
      status: users.status,
      lastLogin: users.lastLogin
    }).from(users)
      .where(eq(users.role, 'investor'));
    
    res.json(investorsList);
  } catch (error) {
    console.error('Error fetching investors:', error);
    res.status(500).json({ error: 'אירעה שגיאה בטעינת רשימת המשקיעים' });
  }
});

// === נתיבי סביבות ניתוח (מחשבונים) ===

// יצירת סביבת ניתוח חדשה למשקיע (רק ליועצים)
router.post('/api/calculators', auth.authenticateToken, auth.isAdvisor, async (req, res) => {
  try {
    const { 
      investorId, 
      name, 
      selfEquity, 
      hasMortgage, 
      israelInterestRate,
      israelLoanTerm,
      cyprusInterestRate,
      cyprusLoanTerm,
      exchangeRate,
      vatRate
    } = req.body;
    
    // וידוא שהמשקיע קיים
    const investor = await db.select({ id: users.id }).from(users)
      .where(and(eq(users.id, investorId), eq(users.role, 'investor')));
    
    if (investor.length === 0) {
      return res.status(404).json({ error: 'המשקיע לא נמצא' });
    }
    
    // יצירת סביבת הניתוח
    const result = await db.insert(calculators).values({
      userId: investorId,
      name,
      selfEquity,
      hasMortgage,
      israelInterestRate: hasMortgage ? israelInterestRate : null,
      israelLoanTerm: hasMortgage ? israelLoanTerm : null,
      cyprusInterestRate: hasMortgage ? cyprusInterestRate : null,
      cyprusLoanTerm: hasMortgage ? cyprusLoanTerm : null,
      exchangeRate,
      vatRate,
      createdBy: (req as any).user.userId,
      updatedBy: (req as any).user.userId
    }).returning({ id: calculators.id });
    
    res.status(201).json({
      message: 'סביבת ניתוח נוצרה בהצלחה',
      calculatorId: result[0].id
    });
  } catch (error) {
    console.error('Error creating calculator:', error);
    res.status(500).json({ error: 'אירעה שגיאה ביצירת סביבת הניתוח' });
  }
});

// קבלת סביבות הניתוח של משקיע (ליועצים ולמשקיע עצמו)
router.get('/api/investors/:investorId/calculators', auth.authenticateToken, async (req, res) => {
  try {
    const { investorId } = req.params;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;
    
    // וידוא הרשאות - רק יועץ או המשקיע עצמו יכולים לראות את הסביבות
    if (userRole !== 'advisor' && userId !== parseInt(investorId)) {
      return res.status(403).json({ error: 'אין הרשאות מתאימות לצפייה בסביבות הניתוח' });
    }
    
    // שליפת סביבות הניתוח
    const calculatorsList = await db.select().from(calculators)
      .where(eq(calculators.userId, parseInt(investorId)));
    
    res.json(calculatorsList);
  } catch (error) {
    console.error('Error fetching calculators:', error);
    res.status(500).json({ error: 'אירעה שגיאה בטעינת סביבות הניתוח' });
  }
});

// === נתיבי אפשרויות השקעה ===

// יצירת אפשרות השקעה חדשה (רק ליועצים)
router.post('/api/properties', auth.authenticateToken, auth.isAdvisor, async (req, res) => {
  try {
    const { 
      name, 
      priceWithoutVAT, 
      monthlyRent,
      guaranteedRent,
      deliveryDate,
      bedrooms,
      hasFurniture,
      hasPropertyManagement,
      hasRealEstateAgent
    } = req.body;
    
    // יצירת הנכס החדש
    const result = await db.insert(properties).values({
      name,
      priceWithoutVAT,
      monthlyRent,
      guaranteedRent,
      deliveryDate,
      bedrooms,
      hasFurniture,
      hasPropertyManagement,
      hasRealEstateAgent,
      createdBy: (req as any).user.userId,
      updatedBy: (req as any).user.userId
    }).returning({ id: properties.id });
    
    res.status(201).json({
      message: 'אפשרות השקעה נוצרה בהצלחה',
      propertyId: result[0].id
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'אירעה שגיאה ביצירת אפשרות ההשקעה' });
  }
});

// הוספת אפשרות השקעה לסביבת ניתוח (רק ליועצים)
router.post('/api/investments', auth.authenticateToken, auth.isAdvisor, async (req, res) => {
  try {
    const { calculatorId, propertyId, priceOverride, monthlyRentOverride } = req.body;
    
    // וידוא שסביבת הניתוח והנכס קיימים
    const calculator = await db.select({ id: calculators.id }).from(calculators)
      .where(eq(calculators.id, calculatorId));
    
    if (calculator.length === 0) {
      return res.status(404).json({ error: 'סביבת הניתוח לא נמצאה' });
    }
    
    const property = await db.select({ id: properties.id }).from(properties)
      .where(eq(properties.id, propertyId));
    
    if (property.length === 0) {
      return res.status(404).json({ error: 'הנכס לא נמצא' });
    }
    
    // הוספת הנכס לסביבת הניתוח
    const result = await db.insert(investments).values({
      calculatorId,
      propertyId,
      priceOverride,
      monthlyRentOverride,
      createdBy: (req as any).user.userId,
      updatedBy: (req as any).user.userId
    }).returning({ id: investments.id });
    
    res.status(201).json({
      message: 'אפשרות ההשקעה נוספה לסביבת הניתוח בהצלחה',
      investmentId: result[0].id
    });
  } catch (error) {
    console.error('Error adding investment:', error);
    res.status(500).json({ error: 'אירעה שגיאה בהוספת אפשרות ההשקעה לסביבת הניתוח' });
  }
});

// === נתיבי החישובים והניתוחים ===

// חישוב והשוואה של אפשרויות השקעה בסביבת ניתוח
router.get('/api/calculators/:calculatorId/analysis', auth.authenticateToken, async (req, res) => {
  try {
    const { calculatorId } = req.params;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;
    
    // שליפת סביבת הניתוח
    const calculator = await db.select().from(calculators)
      .where(eq(calculators.id, parseInt(calculatorId)));
    
    if (calculator.length === 0) {
      return res.status(404).json({ error: 'סביבת הניתוח לא נמצאה' });
    }
    
    // וידוא הרשאות - רק יועץ או המשקיע עצמו יכולים לראות את הניתוח
    if (userRole !== 'advisor' && userId !== calculator[0].userId) {
      return res.status(403).json({ error: 'אין הרשאות מתאימות לצפייה בניתוח' });
    }
    
    // שליפת אפשרויות ההשקעה בסביבת הניתוח
    const investmentsList = await db.select({
      investmentId: investments.id,
      calculatorId: investments.calculatorId,
      propertyId: investments.propertyId,
      priceOverride: investments.priceOverride,
      monthlyRentOverride: investments.monthlyRentOverride
    }).from(investments)
      .where(eq(investments.calculatorId, parseInt(calculatorId)));
    
    // לכל אפשרות השקעה, שליפת פרטי הנכס
    const analysisResults = [];
    for (const investment of investmentsList) {
      const property = await db.select().from(properties)
        .where(eq(properties.id, investment.propertyId));
      
      if (property.length > 0) {
        // מחשבים את כל הנתונים הנדרשים...
        // לוגיקת החישוב המלאה צריכה להיות כאן
        
        analysisResults.push({
          investment,
          property: property[0],
          analysis: {
            // תוצאות החישובים - פירוט מלא יבוא בהמשך
            priceWithVAT: property[0].priceWithoutVAT * (1 + calculator[0].vatRate / 100),
            // ... חישובים נוספים
          }
        });
      }
    }
    
    res.json({
      calculator: calculator[0],
      analysisResults
    });
  } catch (error) {
    console.error('Error calculating analysis:', error);
    res.status(500).json({ error: 'אירעה שגיאה בחישוב הניתוח' });
  }
});

export default router;
