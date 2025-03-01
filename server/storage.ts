import { 
  users, type User, type InsertUser,
  calculators, type Calculator, type InsertCalculator,
  properties, type Property, type InsertProperty,
  investments, type Investment, type InsertInvestment,
  mortgageScenarios, type MortgageScenario, type InsertMortgageScenario,
  calculationHistory, type CalculationHistory, type InsertCalculationHistory,
  auditLogs, type AuditLog, type InsertAuditLog,
  notifications, type Notification, type InsertNotification,
  systemSettings, type SystemSetting, type InsertSystemSetting
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<boolean>;
  
  // Calculator methods
  getCalculators(): Promise<Calculator[]>;
  getCalculator(id: number): Promise<Calculator | undefined>;
  getUserCalculators(userId: number): Promise<Calculator[]>;
  createCalculator(calculator: InsertCalculator): Promise<Calculator>;
  updateCalculator(id: number, calculator: Partial<InsertCalculator>): Promise<Calculator | undefined>;
  deleteCalculator(id: number): Promise<boolean>;
  
  // Property methods
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Investment methods
  getInvestments(): Promise<Investment[]>;
  getInvestment(id: number): Promise<Investment | undefined>;
  getUserInvestments(userId: number): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: number, investment: Partial<InsertInvestment>): Promise<Investment | undefined>;
  deleteInvestment(id: number): Promise<boolean>;
  
  // Mortgage scenario methods
  getMortgageScenarios(): Promise<MortgageScenario[]>;
  getMortgageScenario(id: number): Promise<MortgageScenario | undefined>;
  getUserMortgageScenarios(userId: number): Promise<MortgageScenario[]>;
  createMortgageScenario(scenario: InsertMortgageScenario): Promise<MortgageScenario>;
  updateMortgageScenario(id: number, scenario: Partial<InsertMortgageScenario>): Promise<MortgageScenario | undefined>;
  deleteMortgageScenario(id: number): Promise<boolean>;
  
  // Calculation history methods
  getCalculationHistory(calculatorId: number): Promise<CalculationHistory[]>;
  addCalculationHistory(history: InsertCalculationHistory): Promise<CalculationHistory>;
  
  // Audit log methods
  addAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  
  // Notification methods
  getUserNotifications(userId: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  
  // System settings methods
  getSystemSettings(): Promise<SystemSetting[]>;
  getSystemSettingByKey(key: string): Promise<SystemSetting | undefined>;
  updateSystemSetting(key: string, value: string, updatedBy: number): Promise<SystemSetting | undefined>;
  
  // Dashboard data
  getAdvisorDashboardData(): Promise<any>;
  getInvestorDashboardData(userId: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private calculators: Map<number, Calculator>;
  private properties: Map<number, Property>;
  private investments: Map<number, Investment>;
  private mortgageScenarios: Map<number, MortgageScenario>;
  private calculationHistory: Map<number, CalculationHistory>;
  private auditLogs: Map<number, AuditLog>;
  private notifications: Map<number, Notification>;
  private systemSettings: Map<number, SystemSetting>;
  
  private userIdCounter: number;
  private calculatorIdCounter: number;
  private propertyIdCounter: number;
  private investmentIdCounter: number;
  private mortgageScenarioIdCounter: number;
  private calculationHistoryIdCounter: number;
  private auditLogIdCounter: number;
  private notificationIdCounter: number;
  private systemSettingIdCounter: number;

  constructor() {
    this.users = new Map();
    this.calculators = new Map();
    this.properties = new Map();
    this.investments = new Map();
    this.mortgageScenarios = new Map();
    this.calculationHistory = new Map();
    this.auditLogs = new Map();
    this.notifications = new Map();
    this.systemSettings = new Map();
    
    this.userIdCounter = 1;
    this.calculatorIdCounter = 1;
    this.propertyIdCounter = 1;
    this.investmentIdCounter = 1;
    this.mortgageScenarioIdCounter = 1;
    this.calculationHistoryIdCounter = 1;
    this.auditLogIdCounter = 1;
    this.notificationIdCounter = 1;
    this.systemSettingIdCounter = 1;

    // Add default system settings
    this.addDefaultSystemSettings();
    // Add sample data
    this.addSampleData();
  }

  /* User methods */
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt, 
      updatedAt,
      lastLogin: null,
      twoFactorEnabled: false,
      twoFactorSecret: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      ...userData, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserLastLogin(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    const updatedUser = { 
      ...user, 
      lastLogin: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return true;
  }

  /* Calculator methods */
  async getCalculators(): Promise<Calculator[]> {
    return Array.from(this.calculators.values());
  }

  async getCalculator(id: number): Promise<Calculator | undefined> {
    return this.calculators.get(id);
  }

  async getUserCalculators(userId: number): Promise<Calculator[]> {
    return Array.from(this.calculators.values()).filter(
      (calculator) => calculator.userId === userId
    );
  }

  async createCalculator(calculatorData: InsertCalculator): Promise<Calculator> {
    const id = this.calculatorIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const calculator: Calculator = { 
      ...calculatorData, 
      id, 
      createdAt, 
      updatedAt,
      lastCalculationDate: null
    };
    this.calculators.set(id, calculator);
    return calculator;
  }

  async updateCalculator(id: number, calculatorData: Partial<InsertCalculator>): Promise<Calculator | undefined> {
    const calculator = this.calculators.get(id);
    if (!calculator) return undefined;

    const updatedCalculator = { 
      ...calculator, 
      ...calculatorData, 
      updatedAt: new Date() 
    };
    this.calculators.set(id, updatedCalculator);
    return updatedCalculator;
  }

  async deleteCalculator(id: number): Promise<boolean> {
    return this.calculators.delete(id);
  }

  /* Property methods */
  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(propertyData: InsertProperty): Promise<Property> {
    const id = this.propertyIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const property: Property = { 
      ...propertyData, 
      id, 
      createdAt, 
      updatedAt 
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<InsertProperty>): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;

    const updatedProperty = { 
      ...property, 
      ...propertyData, 
      updatedAt: new Date() 
    };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    return this.properties.delete(id);
  }

  /* Investment methods */
  async getInvestments(): Promise<Investment[]> {
    return Array.from(this.investments.values());
  }

  async getInvestment(id: number): Promise<Investment | undefined> {
    return this.investments.get(id);
  }

  async getUserInvestments(userId: number): Promise<Investment[]> {
    const userCalculators = await this.getUserCalculators(userId);
    const calculatorIds = userCalculators.map(calc => calc.id);
    
    return Array.from(this.investments.values()).filter(
      (investment) => calculatorIds.includes(investment.calculatorId)
    );
  }

  async createInvestment(investmentData: InsertInvestment): Promise<Investment> {
    const id = this.investmentIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const investment: Investment = { 
      ...investmentData, 
      id, 
      createdAt, 
      updatedAt 
    };
    this.investments.set(id, investment);
    return investment;
  }

  async updateInvestment(id: number, investmentData: Partial<InsertInvestment>): Promise<Investment | undefined> {
    const investment = this.investments.get(id);
    if (!investment) return undefined;

    const updatedInvestment = { 
      ...investment, 
      ...investmentData, 
      updatedAt: new Date() 
    };
    this.investments.set(id, updatedInvestment);
    return updatedInvestment;
  }

  async deleteInvestment(id: number): Promise<boolean> {
    return this.investments.delete(id);
  }

  /* Mortgage scenario methods */
  async getMortgageScenarios(): Promise<MortgageScenario[]> {
    return Array.from(this.mortgageScenarios.values());
  }

  async getMortgageScenario(id: number): Promise<MortgageScenario | undefined> {
    return this.mortgageScenarios.get(id);
  }

  async getUserMortgageScenarios(userId: number): Promise<MortgageScenario[]> {
    const userCalculators = await this.getUserCalculators(userId);
    const calculatorIds = userCalculators.map(calc => calc.id);
    
    return Array.from(this.mortgageScenarios.values()).filter(
      (scenario) => calculatorIds.includes(scenario.calculatorId)
    );
  }

  async createMortgageScenario(scenarioData: InsertMortgageScenario): Promise<MortgageScenario> {
    const id = this.mortgageScenarioIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const scenario: MortgageScenario = { 
      ...scenarioData, 
      id, 
      createdAt, 
      updatedAt 
    };
    this.mortgageScenarios.set(id, scenario);
    return scenario;
  }

  async updateMortgageScenario(id: number, scenarioData: Partial<InsertMortgageScenario>): Promise<MortgageScenario | undefined> {
    const scenario = this.mortgageScenarios.get(id);
    if (!scenario) return undefined;

    const updatedScenario = { 
      ...scenario, 
      ...scenarioData, 
      updatedAt: new Date() 
    };
    this.mortgageScenarios.set(id, updatedScenario);
    return updatedScenario;
  }

  async deleteMortgageScenario(id: number): Promise<boolean> {
    return this.mortgageScenarios.delete(id);
  }

  /* Calculation history methods */
  async getCalculationHistory(calculatorId: number): Promise<CalculationHistory[]> {
    return Array.from(this.calculationHistory.values()).filter(
      (history) => history.calculatorId === calculatorId
    );
  }

  async addCalculationHistory(historyData: InsertCalculationHistory): Promise<CalculationHistory> {
    const id = this.calculationHistoryIdCounter++;
    const createdAt = new Date();
    const history: CalculationHistory = { 
      ...historyData, 
      id, 
      createdAt
    };
    this.calculationHistory.set(id, history);
    return history;
  }

  /* Audit log methods */
  async addAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const id = this.auditLogIdCounter++;
    const timestamp = new Date();
    const log: AuditLog = { 
      ...logData, 
      id, 
      timestamp
    };
    this.auditLogs.set(id, log);
    return log;
  }

  /* Notification methods */
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.userId === userId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const createdAt = new Date();
    const notification: Notification = { 
      ...notificationData, 
      id, 
      createdAt,
      isRead: false
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    const updatedNotification = { 
      ...notification, 
      isRead: true
    };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = await this.getUserNotifications(userId);
    
    for (const notification of userNotifications) {
      if (!notification.isRead) {
        const updatedNotification = { 
          ...notification, 
          isRead: true 
        };
        this.notifications.set(notification.id, updatedNotification);
      }
    }
    
    return true;
  }

  /* System settings methods */
  async getSystemSettings(): Promise<SystemSetting[]> {
    return Array.from(this.systemSettings.values());
  }

  async getSystemSettingByKey(key: string): Promise<SystemSetting | undefined> {
    return Array.from(this.systemSettings.values()).find(
      (setting) => setting.key === key
    );
  }

  async updateSystemSetting(key: string, value: string, updatedBy: number): Promise<SystemSetting | undefined> {
    const setting = await this.getSystemSettingByKey(key);
    if (!setting) return undefined;

    const updatedSetting = { 
      ...setting, 
      value,
      updatedBy,
      updatedAt: new Date()
    };
    this.systemSettings.set(setting.id, updatedSetting);
    return updatedSetting;
  }

  /* Dashboard data */
  async getAdvisorDashboardData(): Promise<any> {
    const activeCalculators = Array.from(this.calculators.values()).filter(
      (calculator) => calculator.status === "active"
    ).length;
    
    const investorCount = new Set(Array.from(this.calculators.values()).map(calc => calc.userId)).size;
    
    const propertyCount = this.properties.size;
    
    // Get exchange rate from system settings
    const exchangeRate = await this.getSystemSettingByKey("exchange_rate");
    const currentRate = exchangeRate ? parseFloat(exchangeRate.value) : 3.95;
    
    // Recent calculators
    const recentCalculators = Array.from(this.calculators.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)
      .map(async (calc) => {
        const user = await this.getUser(calc.userId);
        return {
          id: calc.id,
          name: calc.name,
          investor: user ? user.name : "Unknown",
          updatedAt: calc.updatedAt,
          status: calc.status
        };
      });
    
    // Investment summary
    const investmentsData = {
      totalValue: 1250000, // Mock value in EUR
      averageYield: 8.2,    // Mock percentage
      monthlyIncome: 5400,  // Mock value in EUR
      distribution: [
        { name: "Limassol", percentage: 55 },
        { name: "Paphos", percentage: 25 },
        { name: "Larnaca", percentage: 20 }
      ]
    };
    
    // Performance data
    const performanceData = {
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      apartments: [3, 3.5, 5, 7.5, 8, 9],
      villas: [2, 2.2, 3, 3.5, 4, 4.5]
    };
    
    // Recent activity
    const recentActivity = [
      {
        type: "calculator",
        message: "New calculator created for Yossi Cohen",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        type: "property",
        message: "New property added: 2 bedroom apartment in Limassol",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        type: "analysis",
        message: "Yield analysis completed for Ronit Levi",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        type: "investor",
        message: "New investor added: Avi Mizrahi",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        type: "exchangeRate",
        message: "Exchange rate updated: 3.95 ₪/€",
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      }
    ];
    
    return {
      stats: {
        activeCalculators,
        investorCount,
        propertyCount,
        exchangeRate: currentRate
      },
      recentCalculators: await Promise.all(recentCalculators),
      investmentSummary: investmentsData,
      performanceData,
      recentActivity
    };
  }

  async getInvestorDashboardData(userId: number): Promise<any> {
    // Similar to advisor dashboard but filtered for the specific investor
    const activeCalculators = Array.from(this.calculators.values()).filter(
      (calculator) => calculator.status === "active" && calculator.userId === userId
    ).length;
    
    const propertyCount = Array.from(this.investments.values()).filter(
      (investment) => {
        const calculator = this.calculators.get(investment.calculatorId);
        return calculator && calculator.userId === userId;
      }
    ).length;
    
    // Get exchange rate from system settings
    const exchangeRate = await this.getSystemSettingByKey("exchange_rate");
    const currentRate = exchangeRate ? parseFloat(exchangeRate.value) : 3.95;
    
    // Recent calculators for this investor
    const recentCalculators = Array.from(this.calculators.values())
      .filter(calc => calc.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)
      .map(async (calc) => {
        const user = await this.getUser(calc.userId);
        return {
          id: calc.id,
          name: calc.name,
          investor: user ? user.name : "Unknown",
          updatedAt: calc.updatedAt,
          status: calc.status
        };
      });
    
    // Investment summary (simpler for investor)
    const investmentsData = {
      totalValue: 450000, // Mock value in EUR
      averageYield: 7.5,   // Mock percentage
      monthlyIncome: 1800, // Mock value in EUR
      distribution: [
        { name: "Limassol", percentage: 70 },
        { name: "Paphos", percentage: 30 }
      ]
    };
    
    // Performance data - investor specific
    const performanceData = {
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      apartments: [3.2, 3.8, 5.2, 6.8, 7.2, 7.5],
      villas: []
    };
    
    // Recent activity filtered for this investor
    const recentActivity = [
      {
        type: "calculator",
        message: "Your new calculator was created",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        type: "investment",
        message: "New investment proposal for 2 bedroom in Limassol",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        type: "exchangeRate",
        message: "Exchange rate updated: 3.95 ₪/€",
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      }
    ];
    
    return {
      stats: {
        activeCalculators,
        propertyCount,
        exchangeRate: currentRate
      },
      recentCalculators: await Promise.all(recentCalculators),
      investmentSummary: investmentsData,
      performanceData,
      recentActivity
    };
  }

  /* Helper methods for initialization */
  private addDefaultSystemSettings() {
    // Add default system settings
    const settings: Partial<SystemSetting>[] = [
      {
        key: "exchange_rate",
        value: "3.95",
        category: "rates",
        description: "Current EUR/ILS exchange rate",
        updatedBy: 1
      },
      {
        key: "default_interest_rate_cyprus",
        value: "3.5",
        category: "rates",
        description: "Default mortgage interest rate in Cyprus (%)",
        updatedBy: 1
      },
      {
        key: "default_interest_rate_israel",
        value: "4.5",
        category: "rates",
        description: "Default mortgage interest rate in Israel (%)",
        updatedBy: 1
      },
      {
        key: "vat_rate",
        value: "19",
        category: "taxes",
        description: "VAT rate in Cyprus (%)",
        updatedBy: 1
      },
      {
        key: "property_tax_rate",
        value: "0.1",
        category: "taxes",
        description: "Annual property tax rate in Cyprus (%)",
        updatedBy: 1
      }
    ];

    settings.forEach((setting, index) => {
      const id = this.systemSettingIdCounter++;
      const now = new Date();
      this.systemSettings.set(id, {
        id,
        key: setting.key!,
        value: setting.value!,
        category: setting.category!,
        description: setting.description!,
        updatedAt: now,
        updatedBy: setting.updatedBy!
      });
    });
  }

  private addSampleData() {
    // Add a sample admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$2dQm5Qd3IzW.aBo82ycfQuMfVrL5ZGiL2TOk3tzRFwDdJ/sRKi0Cq", // password: admin123
      email: "admin@telemnadlan.com",
      phone: "+972 50-000-0000",
      name: "System Admin",
      role: "advisor",
      status: "active",
      twoFactorEnabled: false,
      twoFactorSecret: null,
      createdBy: null,
      updatedBy: null
    });

    // Add a sample advisor
    this.createUser({
      username: "daniel",
      password: "$2b$10$2dQm5Qd3IzW.aBo82ycfQuMfVrL5ZGiL2TOk3tzRFwDdJ/sRKi0Cq", // password: admin123
      email: "daniel@telemnadlan.com",
      phone: "+972 50-111-1111",
      name: "דניאל",
      role: "advisor",
      status: "active",
      twoFactorEnabled: false,
      twoFactorSecret: null,
      createdBy: 1,
      updatedBy: null
    });

    // Add a few sample investors
    const investorNames = ["יוסי כהן", "רונית לוי", "אבי מזרחי", "שירה דוד"];
    const investors = investorNames.map((name, index) => {
      return this.createUser({
        username: `investor${index + 1}`,
        password: "$2b$10$2dQm5Qd3IzW.aBo82ycfQuMfVrL5ZGiL2TOk3tzRFwDdJ/sRKi0Cq", // password: admin123
        email: `investor${index + 1}@example.com`,
        phone: `+972 50-222-${1000 + index}`,
        name,
        role: "investor",
        status: "active",
        twoFactorEnabled: false,
        twoFactorSecret: null,
        createdBy: 2, // Created by Daniel
        updatedBy: null
      });
    });

    // Add sample properties
    const properties = [
      {
        name: "דירת 3 חדרים בלימסול",
        priceWithoutVAT: 250000,
        monthlyRent: 1200,
        guaranteedRent: 1000,
        deliveryDate: "2023-12-01",
        bedrooms: 3,
        hasFurniture: true,
        hasPropertyManagement: true,
        hasRealEstateAgent: true,
        createdBy: 2,
        updatedBy: null
      },
      {
        name: "וילה עם בריכה בפאפוס",
        priceWithoutVAT: 450000,
        monthlyRent: 2200,
        guaranteedRent: null,
        deliveryDate: "2024-03-15",
        bedrooms: 4,
        hasFurniture: false,
        hasPropertyManagement: true,
        hasRealEstateAgent: true,
        createdBy: 2,
        updatedBy: null
      },
      {
        name: "דירת סטודיו בניקוסיה",
        priceWithoutVAT: 120000,
        monthlyRent: 600,
        guaranteedRent: 550,
        deliveryDate: "2023-10-01",
        bedrooms: 1,
        hasFurniture: true,
        hasPropertyManagement: false,
        hasRealEstateAgent: true,
        createdBy: 2,
        updatedBy: null
      },
      {
        name: "דירת 2 חדרים בלרנקה",
        priceWithoutVAT: 180000,
        monthlyRent: 850,
        guaranteedRent: 800,
        deliveryDate: "2023-11-15",
        bedrooms: 2,
        hasFurniture: true,
        hasPropertyManagement: true,
        hasRealEstateAgent: false,
        createdBy: 2,
        updatedBy: null
      }
    ];

    properties.forEach(property => {
      this.createProperty(property);
    });

    // Add sample calculators
    Promise.all(investors).then(investors => {
      const calculators = [
        {
          userId: 3, // Yossi Cohen
          name: "השקעה בלימסול - דירת 3 חדרים",
          selfEquity: 450000, // ILS
          hasMortgage: true,
          hasPropertyInIsrael: true,
          israelInterestRate: 4.5,
          israelLoanTerm: 20,
          cyprusInterestRate: 3.5,
          cyprusLoanTerm: 25,
          clientPreference: "positive_cash_flow" as const,
          mortgageFileCost: 2000,
          appraiserCost: 1500,
          exchangeRate: 3.95,
          vatRate: 19,
          status: "active" as const,
          version: 1,
          lastCalculationDate: new Date(2023, 5, 12), // June 12, 2023
          notes: null,
          isTemplate: false,
          createdBy: 2, // Daniel
          updatedBy: null
        },
        {
          userId: 4, // Ronit Levi
          name: "השקעה בפאפוס - וילה עם בריכה",
          selfEquity: 900000, // ILS
          hasMortgage: true,
          hasPropertyInIsrael: false,
          israelInterestRate: null,
          israelLoanTerm: null,
          cyprusInterestRate: 3.2,
          cyprusLoanTerm: 30,
          clientPreference: "high_yield" as const,
          mortgageFileCost: null,
          appraiserCost: null,
          exchangeRate: 3.95,
          vatRate: 19,
          status: "active" as const,
          version: 1,
          lastCalculationDate: new Date(2023, 5, 10), // June 10, 2023
          notes: "לקוח מעוניין בהשקעה ארוכת טווח עם תשואה גבוהה",
          isTemplate: false,
          createdBy: 2, // Daniel
          updatedBy: null
        },
        {
          userId: 5, // Avi Mizrahi
          name: "השקעה בניקוסיה - דירת סטודיו",
          selfEquity: 250000, // ILS
          hasMortgage: false,
          hasPropertyInIsrael: true,
          israelInterestRate: 4.5,
          israelLoanTerm: 15,
          cyprusInterestRate: null,
          cyprusLoanTerm: null,
          clientPreference: "low_interest" as const,
          mortgageFileCost: 2000,
          appraiserCost: 1500,
          exchangeRate: 3.95,
          vatRate: 19,
          status: "draft" as const,
          version: 1,
          lastCalculationDate: null,
          notes: "לקוח חדש, עדיין בודק אפשרויות",
          isTemplate: false,
          createdBy: 2, // Daniel
          updatedBy: null
        },
        {
          userId: 6, // Shira David
          name: "השקעה בלרנקה - דירת 2 חדרים",
          selfEquity: 350000, // ILS
          hasMortgage: true,
          hasPropertyInIsrael: false,
          israelInterestRate: null,
          israelLoanTerm: null,
          cyprusInterestRate: 3.4,
          cyprusLoanTerm: 20,
          clientPreference: "positive_cash_flow" as const,
          mortgageFileCost: null,
          appraiserCost: null,
          exchangeRate: 3.95,
          vatRate: 19,
          status: "archived" as const,
          version: 1,
          lastCalculationDate: new Date(2023, 5, 5), // June 5, 2023
          notes: "עסקה לא יצאה לפועל",
          isTemplate: false,
          createdBy: 2, // Daniel
          updatedBy: null
        }
      ];

      calculators.forEach(calculator => {
        this.createCalculator(calculator);
      });

      // Add sample investments (linking calculators to properties)
      this.createInvestment({
        calculatorId: 1,
        propertyId: 1,
        priceOverride: null,
        monthlyRentOverride: null,
        createdBy: 2,
        updatedBy: null
      });

      this.createInvestment({
        calculatorId: 2,
        propertyId: 2,
        priceOverride: 440000, // Negotiated price
        monthlyRentOverride: null,
        createdBy: 2,
        updatedBy: null
      });

      this.createInvestment({
        calculatorId: 3,
        propertyId: 3,
        priceOverride: null,
        monthlyRentOverride: 620, // Actual projected rent
        createdBy: 2,
        updatedBy: null
      });

      this.createInvestment({
        calculatorId: 4,
        propertyId: 4,
        priceOverride: null,
        monthlyRentOverride: null,
        createdBy: 2,
        updatedBy: null
      });

      // Add sample mortgage scenarios
      this.createMortgageScenario({
        calculatorId: 1,
        investmentId: 1,
        name: "משכנתא בקפריסין",
        location: "cyprus" as const,
        loanAmount: 150000,
        interestRate: 3.5,
        termYears: 25,
        appraiserCost: null,
        mortgageFileCost: null,
        cyprusMortgageFeeRate: 1.5,
        monthlyPayment: 750,
        totalInterest: 75000,
        isRecommended: true,
        createdBy: 2,
        updatedBy: null
      });

      this.createMortgageScenario({
        calculatorId: 1,
        investmentId: 1,
        name: "משכנתא בישראל",
        location: "israel" as const,
        loanAmount: 150000,
        interestRate: 4.5,
        termYears: 20,
        appraiserCost: 1500,
        mortgageFileCost: 2000,
        cyprusMortgageFeeRate: null,
        monthlyPayment: 950,
        totalInterest: 78000,
        isRecommended: false,
        createdBy: 2,
        updatedBy: null
      });

      this.createMortgageScenario({
        calculatorId: 2,
        investmentId: 2,
        name: "משכנתא בקפריסין - 70%",
        location: "cyprus" as const,
        loanAmount: 300000,
        interestRate: 3.2,
        termYears: 30,
        appraiserCost: null,
        mortgageFileCost: null,
        cyprusMortgageFeeRate: 1.5,
        monthlyPayment: 1300,
        totalInterest: 168000,
        isRecommended: true,
        createdBy: 2,
        updatedBy: null
      });
    });

    // Add sample notifications
    this.createNotification({
      userId: 2, // Daniel
      title: "עדכון מערכת",
      message: "גרסה חדשה של המערכת זמינה. אנא רענן את הדף כדי להשתמש בתכונות החדשות.",
      type: "info" as const,
      relatedEntityType: null,
      relatedEntityId: null
    });

    this.createNotification({
      userId: 2, // Daniel
      title: "משקיע חדש",
      message: "משקיע חדש נוסף למערכת: יוסי כהן. צור קשר להתחלת תהליך ייעוץ.",
      type: "success" as const,
      relatedEntityType: "user",
      relatedEntityId: 3
    });

    this.createNotification({
      userId: 2, // Daniel
      title: "שינוי בשער חליפין",
      message: "שער החליפין שקל/אירו השתנה ב-2%. המחשבונים הושפעו בהתאם.",
      type: "warning" as const,
      relatedEntityType: "system_setting",
      relatedEntityId: 1
    });
  }
}

export const storage = new MemStorage();
