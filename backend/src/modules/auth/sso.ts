import { PrismaClient, Role } from "@prisma/client";
import { FastifyInstance } from "fastify";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// Use environment variables for real Entra ID, otherwise provide a local mock implementation for the hackathon
const CLIENT_ID = process.env.ENTRA_CLIENT_ID || "mock-client-id";
const CLIENT_SECRET = process.env.ENTRA_CLIENT_SECRET || "mock-client-secret";
const TENANT_ID = process.env.ENTRA_TENANT_ID || "common";
const REDIRECT_URI = process.env.ENTRA_REDIRECT_URI || "http://localhost:3001/api/v1/auth/sso/microsoft/callback";

export function getAuthorizationUrl() {
  if (CLIENT_ID === "mock-client-id") {
    // Return mock URL
    return `${REDIRECT_URI}?code=mock_auth_code_for_hackathon`;
  }
  
  const scope = "User.Read openid profile email User.Read.All Directory.Read.All";
  const authUrl = new URL(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`);
  authUrl.searchParams.append("client_id", CLIENT_ID);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.append("response_mode", "query");
  authUrl.searchParams.append("scope", scope);
  
  return authUrl.toString();
}

export async function handleSsoCallback(
  prisma: PrismaClient,
  fastify: FastifyInstance,
  code: string
) {
  let userProfile: any;
  let managerProfile: any;
  let adGroups: any[] = [];

  if (CLIENT_ID === "mock-client-id") {
    // Mock data for Hackathon demo
    userProfile = {
      id: "entra-user-123",
      displayName: "Entra Demo User",
      mail: "entra.user@alignops.com",
      jobTitle: "Software Engineer",
      department: "Engineering"
    };
    managerProfile = {
      id: "entra-manager-456",
      displayName: "Entra Demo Manager",
      mail: "entra.manager@alignops.com"
    };
    adGroups = [
      { id: "group-1", displayName: "AlignOps-Employees" },
      { id: "group-2", displayName: "AlignOps-Engineering" }
    ];
  } else {
    // 1. Exchange code for token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        scope: "User.Read openid profile email User.Read.All Directory.Read.All",
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        client_secret: CLIENT_SECRET,
      })
    });
    
    const tokenData = (await tokenResponse.json()) as any;
    if (!tokenResponse.ok) {
      throw new Error(`Entra ID Token Error: ${tokenData.error_description}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    userProfile = await profileRes.json();

    // 3. Fetch Org Hierarchy (Manager)
    const managerRes = await fetch("https://graph.microsoft.com/v1.0/me/manager", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (managerRes.ok) {
      managerProfile = await managerRes.json();
    }

    // 4. Fetch AD Groups
    const groupsRes = await fetch("https://graph.microsoft.com/v1.0/me/memberOf", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (groupsRes.ok) {
      const groupData = (await groupsRes.json()) as any;
      adGroups = groupData.value || [];
    }
  }

  // Evaluate AD Group mappings for role
  // Default to EMPLOYEE, but upgrade if they belong to specific AD groups
  let role: Role = Role.EMPLOYEE;
  const isManager = adGroups.some(g => g.displayName?.includes("Manager") || g.displayName?.includes("Leadership"));
  const isAdmin = adGroups.some(g => g.displayName?.includes("Admin") || g.displayName?.includes("HR"));
  
  if (isAdmin) role = Role.ADMIN;
  else if (isManager) role = Role.MANAGER;

  // Ensure Manager exists in DB if applicable (Org hierarchy sync)
  let localManagerId: string | null = null;
  if (managerProfile && managerProfile.mail) {
    let manager = await prisma.user.findUnique({ where: { email: managerProfile.mail } });
    if (!manager) {
      manager = await prisma.user.create({
        data: {
          email: managerProfile.mail,
          name: managerProfile.displayName || "Manager",
          passwordHash: await bcrypt.hash(uuidv4(), 10), // Random placeholder password
          role: Role.MANAGER, // Inherently a manager
          department: "Unknown",
          externalId: managerProfile.id
        }
      });
    }
    localManagerId = manager.id;
  }

  // Create or Update User
  let user = await prisma.user.findFirst({
    where: { OR: [{ externalId: userProfile.id }, { email: userProfile.mail }] }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userProfile.mail,
        name: userProfile.displayName,
        passwordHash: await bcrypt.hash(uuidv4(), 10),
        role,
        department: userProfile.department || "General",
        externalId: userProfile.id,
        managerId: localManagerId
      }
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: userProfile.displayName,
        department: userProfile.department || user.department,
        externalId: userProfile.id,
        managerId: localManagerId,
        // Role might be synced but we be careful not to downgrade an admin
        role: role === Role.ADMIN ? Role.ADMIN : (user.role === Role.ADMIN ? Role.ADMIN : role)
      }
    });
  }

  // Generate JWT tokens
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    department: user.department,
    managerId: user.managerId,
  };
  
  const newAccessToken = fastify.jwt.sign(payload, { expiresIn: "15m" });
  const newRefreshToken = fastify.jwt.sign(payload, { expiresIn: "7d" });

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      managerId: user.managerId,
    }
  };
}
