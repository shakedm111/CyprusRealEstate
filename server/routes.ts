import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hash, compare } from "./utils";
import { z } from "zod";
import {
  insertUserSchema,
  insertCalculatorSchema,
  insertPropertySchema,
  insertInvestmentSchema,
  insertMortgageScenarioSchema,
  insertNotificationSchema,
} from "@shared/schema";
import authService, { authenticateToken, isAdvisor } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Call authService.createInitialUsers at startup
  await authService.createInitialUsers();

  // Register JWT API endpoints
  app.post("/api/auth/login", (req, res) => {
    authService.login(req, res);
  });

  // Add JWT current user endpoint
  app.get("/api/auth/current-user", authenticateToken, (req, res) => {
    const user = (req as any).user;
    res.json({
      id: user.userId,
      username: user.username,
      name: user.name,
      role: user.role
    });
  });

  // Add JWT logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    // JWT is stateless, so just tell client to remove token
    res.json({ success: true, message: "Logout successful" });
  });

  // Note: Old Passport-based auth routes have been replaced with JWT routes above

  // User routes
  app.get("/api/users", isAdvisor, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get("/api/users/:id", authenticateToken, async (req, res) => {
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.post("/api/users", authenticateToken, async (req, res) => {
    try {
      // Check if user is advisor
      if ((req.user as any).role !== 'advisor') {
        console.log('User role:', (req.user as any).role);
        return res.status(403).json({ error: 'אין הרשאות מתאימות לפעולה זו' });
      }

      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await hash(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        createdBy: (req.user as any).userId // Note: using userId from JWT token
      });
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Calculator routes
  app.get("/api/calculators", authenticateToken, async (req, res) => {
    const user = req.user as any;
    let calculators;

    if (user.role === "advisor") {
      // Advisors can see all calculators
      calculators = await storage.getCalculators();
    } else {
      // Investors can only see their own calculators
      calculators = await storage.getUserCalculators(user.id);
    }

    res.json(calculators);
  });

  app.get("/api/calculators/:id", authenticateToken, async (req, res) => {
    const user = req.user as any;
    const calculator = await storage.getCalculator(parseInt(req.params.id));

    if (!calculator) {
      return res.status(404).json({ message: "Calculator not found" });
    }

    // Ensure user has access to this calculator
    if (user.role !== "advisor" && calculator.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(calculator);
  });

  app.post("/api/calculators", authenticateToken, async (req, res) => {
    try {
      const calculatorData = insertCalculatorSchema.parse(req.body);
      const user = req.user as any;

      const calculator = await storage.createCalculator({
        ...calculatorData,
        createdBy: user.id
      });

      res.status(201).json(calculator);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create calculator" });
    }
  });

  app.put("/api/calculators/:id", authenticateToken, async (req, res) => {
    try {
      const user = req.user as any;
      const calculatorId = parseInt(req.params.id);
      const calculator = await storage.getCalculator(calculatorId);

      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }

      // Ensure user has access to update this calculator
      if (user.role !== "advisor" && calculator.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const calculatorData = insertCalculatorSchema.parse(req.body);
      const updatedCalculator = await storage.updateCalculator(calculatorId, {
        ...calculatorData,
        updatedBy: user.id
      });

      res.json(updatedCalculator);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update calculator" });
    }
  });

  app.delete("/api/calculators/:id", authenticateToken, async (req, res) => {
    try {
      const user = req.user as any;
      const calculatorId = parseInt(req.params.id);
      const calculator = await storage.getCalculator(calculatorId);

      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }

      // Only advisors or the owner can delete calculators
      if (user.role !== "advisor" && calculator.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteCalculator(calculatorId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete calculator" });
    }
  });

  // Property routes
  app.get("/api/properties", authenticateToken, async (req, res) => {
    const properties = await storage.getProperties();
    res.json(properties);
  });

  app.get("/api/properties/:id", authenticateToken, async (req, res) => {
    const property = await storage.getProperty(parseInt(req.params.id));
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  });

  app.post("/api/properties", isAdvisor, async (req, res) => {
    try {
      const propertyData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty({
        ...propertyData,
        createdBy: (req.user as any).id
      });
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", isAdvisor, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const propertyData = insertPropertySchema.parse(req.body);
      const updatedProperty = await storage.updateProperty(propertyId, {
        ...propertyData,
        updatedBy: (req.user as any).id
      });

      res.json(updatedProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", isAdvisor, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      await storage.deleteProperty(propertyId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Investment routes
  app.get("/api/investments", authenticateToken, async (req, res) => {
    const user = req.user as any;
    let investments;

    if (user.role === "advisor") {
      investments = await storage.getInvestments();
    } else {
      investments = await storage.getUserInvestments(user.id);
    }

    res.json(investments);
  });

  app.get("/api/investments/:id", authenticateToken, async (req, res) => {
    const investment = await storage.getInvestment(parseInt(req.params.id));

    if (!investment) {
      return res.status(404).json({ message: "Investment not found" });
    }

    const user = req.user as any;
    const calculator = await storage.getCalculator(investment.calculatorId);

    // Check if user has access to this investment
    if (user.role !== "advisor" && calculator && calculator.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(investment);
  });

  app.post("/api/investments", authenticateToken, async (req, res) => {
    try {
      const investmentData = insertInvestmentSchema.parse(req.body);
      const user = req.user as any;

      // Check if user has access to this calculator
      const calculator = await storage.getCalculator(investmentData.calculatorId);

      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }

      if (user.role !== "advisor" && calculator.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const investment = await storage.createInvestment({
        ...investmentData,
        createdBy: user.id
      });

      res.status(201).json(investment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create investment" });
    }
  });

  // Mortgage scenario routes
  app.get("/api/mortgage-scenarios", authenticateToken, async (req, res) => {
    const user = req.user as any;
    let scenarios;

    if (user.role === "advisor") {
      scenarios = await storage.getMortgageScenarios();
    } else {
      scenarios = await storage.getUserMortgageScenarios(user.id);
    }

    res.json(scenarios);
  });

  app.get("/api/mortgage-scenarios/:id", authenticateToken, async (req, res) => {
    const scenario = await storage.getMortgageScenario(parseInt(req.params.id));

    if (!scenario) {
      return res.status(404).json({ message: "Mortgage scenario not found" });
    }

    const user = req.user as any;
    const calculator = await storage.getCalculator(scenario.calculatorId);

    // Check if user has access to this scenario
    if (user.role !== "advisor" && calculator && calculator.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(scenario);
  });

  app.post("/api/mortgage-scenarios", authenticateToken, async (req, res) => {
    try {
      const scenarioData = insertMortgageScenarioSchema.parse(req.body);
      const user = req.user as any;

      // Check if user has access to this calculator
      const calculator = await storage.getCalculator(scenarioData.calculatorId);

      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }

      if (user.role !== "advisor" && calculator.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const scenario = await storage.createMortgageScenario({
        ...scenarioData,
        createdBy: user.id
      });

      res.status(201).json(scenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create mortgage scenario" });
    }
  });

  // Notification routes
  app.get("/api/notifications", authenticateToken, async (req, res) => {
    const user = req.user as any;
    const notifications = await storage.getUserNotifications(user.id);
    res.json(notifications);
  });

  app.post("/api/notifications", isAdvisor, async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification({
        ...notificationData
      });
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const user = req.user as any;
      const notification = await storage.getNotification(notificationId);

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Only the user who received the notification can mark it as read
      if (notification.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/mark-all-read", authenticateToken, async (req, res) => {
    try {
      const user = req.user as any;
      await storage.markAllNotificationsAsRead(user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  // Dashboard data
  app.get("/api/dashboard", authenticateToken, async (req, res) => {
    try {
      const user = req.user as any;
      let dashboardData;

      if (user.role === "advisor") {
        dashboardData = await storage.getAdvisorDashboardData();
      } else {
        dashboardData = await storage.getInvestorDashboardData(user.id);
      }

      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard data" });
    }
  });

  // System settings routes
  app.get("/api/system-settings", authenticateToken, async (req, res) => {
    const settings = await storage.getSystemSettings();
    res.json(settings);
  });

  app.get("/api/system-settings/:key", authenticateToken, async (req, res) => {
    const setting = await storage.getSystemSettingByKey(req.params.key);

    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    res.json(setting);
  });

  app.put("/api/system-settings/:key", isAdvisor, async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;

      if (!value) {
        return res.status(400).json({ message: "Value is required" });
      }

      const updatedSetting = await storage.updateSystemSetting(key, value, (req.user as any).id);

      if (!updatedSetting) {
        return res.status(404).json({ message: "Setting not found" });
      }

      res.json(updatedSetting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}