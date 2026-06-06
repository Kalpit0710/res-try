import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';
import { Teacher } from '../models/Teacher';
import { z } from 'zod';

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

  let validUser = false;
  let validPass = false;

  const admin = await Admin.findOne();
  if (admin) {
    validUser = username === admin.username;
    validPass = await bcrypt.compare(password, admin.passwordHash);
  } else {
    const defaultUser = process.env.ADMIN_USERNAME ?? 'admin';
    const defaultPass = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
    validUser = username === defaultUser;
    validPass = password === defaultPass;
    if (validUser && validPass) {
      await Admin.create({ username: defaultUser, passwordHash: await bcrypt.hash(defaultPass, 10) });
    }
  }

  if (!validUser || !validPass) {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
    return;
  }

  const token = jwt.sign(
    { adminId: 'admin', role: 'admin' },
    process.env.JWT_SECRET ?? 'secret',
    { expiresIn: '8h' }
  );

  res.json({ success: true, data: { token, expiresIn: 8 * 60 * 60 } });
}

const UpdateAdminSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export async function updateAdminCredentials(req: Request, res: Response): Promise<void> {
  const parsed = UpdateAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
    return;
  }

  const { username, password } = parsed.data;
  let admin = await Admin.findOne();
  
  if (!admin) {
    const defaultPass = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
    admin = await Admin.create({ username, passwordHash: await bcrypt.hash(defaultPass, 10) });
  } else {
    admin.username = username;
  }

  if (password) {
    admin.passwordHash = await bcrypt.hash(password, 10);
  }

  await admin.save();
  res.json({ success: true, message: 'Admin credentials updated successfully' });
}

export async function teacherLogin(req: Request, res: Response): Promise<void> {
  let { teacherId, pin } = req.body;
  if (!teacherId || !pin) {
    res.status(400).json({ success: false, message: 'Teacher ID and PIN are required' });
    return;
  }
  pin = Buffer.from(pin, 'base64').toString('utf8');

  const teacher = await Teacher.findById(teacherId);
  if (!teacher || !teacher.pin) {
    res.status(401).json({ success: false, message: 'Invalid teacher ID or PIN not set' });
    return;
  }

  const validPass = await bcrypt.compare(pin, teacher.pin);
  if (!validPass) {
    res.status(401).json({ success: false, message: 'Invalid PIN' });
    return;
  }

  const token = jwt.sign(
    { teacherId: teacher._id, classId: teacher.classId, role: 'teacher' },
    process.env.JWT_SECRET ?? 'secret',
    { expiresIn: '10m' } // 10 minutes session for teachers
  );

  res.json({ success: true, data: { token, expiresIn: 10 * 60, teacher } });
}

export async function resetTeacherPin(req: Request, res: Response): Promise<void> {
  let { oldPin, newPin } = req.body;
  
  if (oldPin) oldPin = Buffer.from(oldPin, 'base64').toString('utf8');
  if (newPin) newPin = Buffer.from(newPin, 'base64').toString('utf8');
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET ?? 'secret');
    if (decoded.role !== 'teacher') {
       res.status(403).json({ success: false, message: 'Forbidden' });
       return;
    }
    const teacherId = decoded.teacherId;
    
    if (!oldPin || !newPin || newPin.length < 4 || newPin.length > 6) {
      res.status(400).json({ success: false, message: 'Both old and new valid PIN (4-6 digits) are required' });
      return;
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher || !teacher.pin) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    const validOldPin = await bcrypt.compare(oldPin, teacher.pin);
    if (!validOldPin) {
      res.status(400).json({ success: false, message: 'Incorrect old PIN' });
      return;
    }
    
    const hashedPin = await bcrypt.hash(newPin, 10);
    teacher.pin = hashedPin;
    await teacher.save();
    
    res.json({ success: true, message: 'PIN updated successfully' });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function logout(_req: Request, res: Response): void {
  // Client-side token removal — server is stateless
  res.json({ success: true, message: 'Logged out' });
}
