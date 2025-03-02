// server/auth.ts - תיקון למערכת האימות המותאם לאפיון המקורי

import { Request, Response, NextFunction } from 'express';
import { db } from './db'; // נניח שיש קובץ db.ts שמייצא את חיבור מסד הנתונים
import { users } from '../schema'; // ייבוא הטבלה מהסכמה
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// קבוע לתוקף של טוקן JWT - 24 שעות
const TOKEN_EXPIRY = '24h';
// מפתח סודי לחתימת טוקנים - יש לשמור בקובץ .env במציאות
const JWT_SECRET = process.env.JWT_SECRET || 'telem-real-estate-secret-key';

/**
 * פונקציה ליצירת משתמשי מערכת ראשוניים אם לא קיימים
 * יוצרת משתמש יועץ ראשי ומשתמש דוגמה למשקיע
 */
export async function createInitialUsers() {
  try {
    // בדיקה אם יש משתמשים במערכת
    const existingUsers = await db.select().from(users).limit(1);
    
    // אם אין משתמשים, יוצרים משתמשי מערכת ראשוניים
    if (existingUsers.length === 0) {
      console.log('Creating initial users...');
      
      // יצירת משתמש יועץ ראשי
      const advisorPassword = await bcrypt.hash('admin123', 10);
      const advisorId = await db.insert(users).values({
        username: 'admin',
        password: advisorPassword,
        email: 'admin@telem-realestate.com',
        name: 'יועץ ראשי',
        role: 'advisor',
        status: 'active',
        createdBy: null, // משתמש ראשוני אין לו יוצר
        updatedBy: null
      }).returning({ id: users.id });
      
      // יצירת משתמש דוגמה למשקיע
      const investorPassword = await bcrypt.hash('investor123', 10);
      await db.insert(users).values({
        username: 'investor1',
        password: investorPassword,
        email: 'investor1@example.com',
        name: 'משקיע לדוגמה',
        role: 'investor',
        status: 'active',
        createdBy: advisorId[0].id, // נוצר על ידי היועץ הראשי
        updatedBy: advisorId[0].id
      });
      
      console.log('Initial users created successfully');
    }
  } catch (error) {
    console.error('Error creating initial users:', error);
  }
}

/**
 * פונקציית אימות משתמש
 */
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    
    // בדיקה שהתקבלו שם משתמש וסיסמה
    if (!username || !password) {
      return res.status(400).json({ error: 'יש לספק שם משתמש וסיסמה' });
    }
    
    // חיפוש המשתמש במסד הנתונים
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    // אם המשתמש לא נמצא
    if (user.length === 0) {
      console.log(`Login attempt failed: User '${username}' not found`);
      return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    }
    
    const userRecord = user[0];
    
    // בדיקה אם המשתמש פעיל
    if (userRecord.status !== 'active') {
      console.log(`Login attempt failed: User '${username}' is inactive`);
      return res.status(401).json({ error: 'המשתמש אינו פעיל' });
    }
    
    // השוואת הסיסמה
    const passwordMatch = await bcrypt.compare(password, userRecord.password);
    
    if (!passwordMatch) {
      console.log(`Login attempt failed: Incorrect password for user '${username}'`);
      return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    }
    
    // עדכון זמן ההתחברות האחרון
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, userRecord.id));
    
    // יצירת טוקן JWT
    const token = jwt.sign(
      { 
        userId: userRecord.id, 
        username: userRecord.username,
        role: userRecord.role,
        name: userRecord.name
      }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );
    
    // שליחת הטוקן בתגובה
    res.json({
      token,
      user: {
        id: userRecord.id,
        username: userRecord.username,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'אירעה שגיאה בעת ההתחברות' });
  }
}

/**
 * Middleware לאימות טוקן JWT
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // קבלת הטוקן מהכותרת
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // פורמט: Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'אימות נדרש' });
  }
  
  // אימות הטוקן
  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'טוקן לא תקף או פג תוקף' });
    }
    
    // הוספת המידע המפוענח לאובייקט הבקשה
    (req as any).user = decoded;
    next();
  });
}

/**
 * בדיקה אם המשתמש הוא יועץ
 */
export function isAdvisor(req: Request, res: Response, next: NextFunction) {
  if ((req as any).user && (req as any).user.role === 'advisor') {
    next();
  } else {
    res.status(403).json({ error: 'אין הרשאות מתאימות לפעולה זו' });
  }
}

/**
 * וידוא שמשקיע יכול לגשת רק לנתונים שלו
 */
export async function ensureInvestorAccess(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user.userId;
  const requestedResourceId = req.params.id;
  
  // לוגיקה שמוודאת שמשקיע ניגש רק למשאבים שלו
  // קוד זה צריך להתאים למבנה המדויק של הנתונים והיחסים במערכת שלך
  
  next(); // כרגע עובר הלאה - צריך להתאים לפי המבנה המדויק של הנתונים
}

// ייצוא הפונקציות לשימוש ב-routes.ts
export default {
  login,
  authenticateToken,
  isAdvisor,
  ensureInvestorAccess,
  createInitialUsers
};
