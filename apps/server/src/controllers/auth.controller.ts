import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin';
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
  const { username, password } = req.body as { username: string; password: string };

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Username and password are required' });
    return;
  }

  const hashed = await getHashedPassword();
  const validUser = username === ADMIN_USERNAME;
  const validPass = await bcrypt.compare(password, hashed);

  if (!validUser || !validPass) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { adminId: 'admin' },
    process.env.JWT_SECRET ?? 'secret',
    { expiresIn: '8h' }
  );

  res.json({ success: true, data: { token, expiresIn: 8 * 60 * 60 } });
}

export function logout(_req: Request, res: Response): void {
  // Client-side token removal — server is stateless
  res.json({ success: true, message: 'Logged out' });
}
