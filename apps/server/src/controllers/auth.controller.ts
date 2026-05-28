import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

let oauthClient: OAuth2Client | null = null;

function getOAuthClient(): OAuth2Client {
  if (!oauthClient) {
    oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID ?? '');
  }
  return oauthClient;
}

// Store hashed password at startup
let hashedAdminPassword: string | null = null;

async function getHashedPassword(): Promise<string> {
  if (!hashedAdminPassword) {
    const plain = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
    hashedAdminPassword = await bcrypt.hash(plain, 10);
  }
  return hashedAdminPassword;
}

export async function login(req: Request, res: Response): Promise<void> {
  let username = '';
  let password = '';

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    [username, password] = credentials.split(':');
  }

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Username and password must be provided via Basic Authentication' });
    return;
  }

  const hashed = await getHashedPassword();
  const validUser = username === (process.env.ADMIN_USERNAME ?? 'admin');
  const validPass = await bcrypt.compare(password, hashed);

  if (!validUser || !validPass) {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
    return;
  }

  const token = jwt.sign(
    { adminId: 'admin' },
    process.env.JWT_SECRET ?? 'secret',
    { expiresIn: '8h' }
  );

  res.json({ success: true, data: { token, expiresIn: 8 * 60 * 60 } });
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { credential } = req.body as { credential?: string };
  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';
  const adminEmailEnv = process.env.ADMIN_EMAIL ?? '';

  if (!credential) {
    res.status(400).json({ success: false, message: 'Google credential is required' });
    return;
  }

  try {
    const client = getOAuthClient();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ success: false, message: 'Invalid Google token' });
      return;
    }

    // Convert to lowercase to avoid case-sensitivity issues
    const email = payload.email.toLowerCase();
    const authorizedEmails = adminEmailEnv.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean);

    if (authorizedEmails.length === 0) {
      res.status(403).json({ success: false, message: 'OAuth login is not configured on the server yet.' });
      return;
    }

    if (!authorizedEmails.includes(email)) {
      res.status(401).json({ success: false, message: 'Unauthorized email address.' });
      return;
    }

    const token = jwt.sign(
      { adminId: 'admin', email },
      process.env.JWT_SECRET ?? 'secret',
      { expiresIn: '8h' }
    );

    res.json({ success: true, data: { token, expiresIn: 8 * 60 * 60 } });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
}


export function logout(_req: Request, res: Response): void {
  // Client-side token removal — server is stateless
  res.json({ success: true, message: 'Logged out' });
}
