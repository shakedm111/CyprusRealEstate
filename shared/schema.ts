import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users: advisors and investors
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  name: text("name").notNull(),
  role: text("role", { enum: ["advisor", "investor"] }).notNull().default("investor"),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  lastLogin: timestamp("last_login"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id)
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, lastLogin: true, createdAt: true, updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// System settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id).notNull()
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings)
  .omit({ id: true, updatedAt: true });

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// Calculators
export const calculators = pgTable("calculators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // The investor
  name: text("name").notNull(),
  selfEquity: doublePrecision("self_equity").notNull(), // ILS amount
  hasMortgage: boolean("has_mortgage").notNull().default(false),
  hasPropertyInIsrael: boolean("has_property_in_israel").notNull().default(false),
  
  // Interest rates and terms
  israelInterestRate: real("israel_interest_rate"),
  israelLoanTerm: integer("israel_loan_term"),
  cyprusInterestRate: real("cyprus_interest_rate"),
  cyprusLoanTerm: integer("cyprus_loan_term"),
  
  // Financing preferences
  clientPreference: text("client_preference", { 
    enum: ["positive_cash_flow", "low_interest", "high_yield", "max_financing", "long_term"]
  }),
  
  // Additional costs & parameters
  mortgageFileCost: doublePrecision("mortgage_file_cost"),
  appraiserCost: doublePrecision("appraiser_cost"),
  exchangeRate: real("exchange_rate").notNull(),
  vatRate: real("vat_rate").notNull(),
  
  // Status fields
  status: text("status", { enum: ["draft", "active", "archived"] }).notNull().default("draft"),
  version: integer("version").notNull().default(1),
  lastCalculationDate: timestamp("last_calculation_date"),
  notes: text("notes"),
  isTemplate: boolean("is_template").notNull().default(false),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull(), // The advisor
  updatedBy: integer("updated_by").references(() => users.id)
});

export const insertCalculatorSchema = createInsertSchema(calculators)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertCalculator = z.infer<typeof insertCalculatorSchema>;
export type Calculator = typeof calculators.$inferSelect;

// Properties
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  priceWithoutVAT: doublePrecision("price_without_vat").notNull(), // EUR amount
  monthlyRent: doublePrecision("monthly_rent").notNull(), // EUR amount
  guaranteedRent: doublePrecision("guaranteed_rent"), // EUR amount
  deliveryDate: text("delivery_date").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  
  // Additional features
  hasFurniture: boolean("has_furniture").notNull().default(false),
  hasPropertyManagement: boolean("has_property_management").notNull().default(false),
  hasRealEstateAgent: boolean("has_real_estate_agent").notNull().default(false),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id)
});

export const insertPropertySchema = createInsertSchema(properties)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Investments
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  calculatorId: integer("calculator_id").references(() => calculators.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  
  // Override values if different from property
  priceOverride: doublePrecision("price_override"),
  monthlyRentOverride: doublePrecision("monthly_rent_override"),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id)
});

export const insertInvestmentSchema = createInsertSchema(investments)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investments.$inferSelect;

// Mortgage scenarios
export const mortgageScenarios = pgTable("mortgage_scenarios", {
  id: serial("id").primaryKey(),
  calculatorId: integer("calculator_id").references(() => calculators.id).notNull(),
  investmentId: integer("investment_id").references(() => investments.id),
  name: text("name").notNull(),
  location: text("location", { enum: ["israel", "cyprus", "hybrid"] }).notNull(),
  loanAmount: doublePrecision("loan_amount").notNull(), // EUR amount
  interestRate: real("interest_rate").notNull(),
  termYears: integer("term_years").notNull(),
  
  // Location-specific costs
  appraiserCost: doublePrecision("appraiser_cost"), // Israel
  mortgageFileCost: doublePrecision("mortgage_file_cost"), // Israel
  cyprusMortgageFeeRate: real("cyprus_mortgage_fee_rate"), // Cyprus
  
  // Calculation results
  monthlyPayment: doublePrecision("monthly_payment").notNull(),
  totalInterest: doublePrecision("total_interest").notNull(),
  
  // Preference fields
  isRecommended: boolean("is_recommended").notNull().default(false),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id)
});

export const insertMortgageScenarioSchema = createInsertSchema(mortgageScenarios)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertMortgageScenario = z.infer<typeof insertMortgageScenarioSchema>;
export type MortgageScenario = typeof mortgageScenarios.$inferSelect;

// Calculation history
export const calculationHistory = pgTable("calculation_history", {
  id: serial("id").primaryKey(),
  calculatorId: integer("calculator_id").references(() => calculators.id).notNull(),
  snapshot: jsonb("snapshot").notNull(), // JSON of calculator data
  results: jsonb("results").notNull(), // JSON of calculation results
  calculationType: text("calculation_type", { 
    enum: ["investment_comparison", "sensitivity", "cashflow", "mortgage"] 
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull()
});

export const insertCalculationHistorySchema = createInsertSchema(calculationHistory)
  .omit({ id: true, createdAt: true });

export type InsertCalculationHistory = z.infer<typeof insertCalculationHistorySchema>;
export type CalculationHistory = typeof calculationHistory.$inferSelect;

// Audit log
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  action: text("action", { enum: ["create", "update", "delete", "view"] }).notNull(),
  details: jsonb("details").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: text("ip_address").notNull()
});

export const insertAuditLogSchema = createInsertSchema(auditLogs)
  .omit({ id: true, timestamp: true });

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["info", "warning", "error", "success"] }).notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: integer("related_entity_id")
});

export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, createdAt: true, isRead: true });

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
