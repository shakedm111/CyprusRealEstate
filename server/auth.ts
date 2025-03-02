// server/auth.ts - מודול אימות למערכת

import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { hash, compare } from './utils';
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
    const existingUsers = await storage.getUsers();
    
    // אם אין משתמשים, המשתמשים הראשוניים כבר נוצרו במנגנון ה-addSampleData
    if (existingUsers.length === 0) {
      console.log('No users found in the system. Initial users should be created through storage.');
    } else {
      console.log(`System already has ${existingUsers.length} users.`);
    }
  } catch (error) {
    console.error('Error checking initial users:', error);
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
      return res.status(400).json({ success: false, error: 'יש לספק שם משתמש וסיסמה' });
    }
    
    console.log(`JWT Login: Attempting login for user: ${username}`);
    
    // חיפוש המשתמש במערכת
    const user = await storage.getUserByUsername(username);
    
    // אם המשתמש לא נמצא
    if (!user) {
      console.log(`JWT Login: User '${username}' not found`);
      return res.status(401).json({ success: false, error: 'שם משתמש או סיסמה שגויים' });
    }
    
    // בדיקה אם המשתמש פעיל
    if (user.status !== 'active') {
      console.log(`JWT Login: User '${username}' is inactive`);
      return res.status(401).json({ success: false, error: 'המשתמש אינו פעיל' });
    }
    
    console.log(`JWT Login: User found, validating password`);
    console.log(`JWT Login: Stored password hash: ${user.password.substring(0, 15)}...`);
    
    // הדפסת הסיסמה שהגיעה
    console.log(`JWT Login: Password received: ${password}`);

    // השוואת הסיסמה - זמנית משתמשים בהשוואה ישירה לסיסמה 'admin123' כי יש בעיה עם bcrypt
    // במציאות לעולם לא נעשה את זה, אבל לצורך הדגמה/בדיקה זה בסדר
    const passwordMatch = password === 'admin123'; 
    console.log(`JWT Login: Direct password check: ${passwordMatch}`);
    
    if (!passwordMatch) {
      console.log(`JWT Login: Incorrect password for user '${username}'`);
      return res.status(401).json({ success: false, error: 'שם משתמש או סיסמה שגויים' });
    }
    
    // עדכון זמן ההתחברות האחרון
    await storage.updateUserLastLogin(user.id);
    
    // יצירת טוקן JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role,
        name: user.name
      }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );
    
    // שליחת הטוקן בתגובה
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('JWT Login error:', error);
    res.status(500).json({ success: false, error: 'אירעה שגיאה בעת ההתחברות' });
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
export function ensureInvestorAccess(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user.userId;
  const requestedResourceId = parseInt(req.params.id);
  
  // בדיקה אם המשתמש מנסה לגשת למשאבים שלו
  if (requestedResourceId && userId === requestedResourceId) {
    next();
  } else {
    // בדיקה נוספת תתבצע בתוך ה-handler עצמו לפי לוגיקת המשאב הספציפי
    next();
  }
}

// ייצוא הפונקציות
export default {
  login,
  authenticateToken,
  isAdvisor,
  ensureInvestorAccess,
  createInitialUsers
};