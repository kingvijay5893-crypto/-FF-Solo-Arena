import { Router } from 'express';
import { db } from '../firebaseAdmin.js';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { WalletTransaction } from '../types.js';

export const walletRouter = Router();

walletRouter.get('/transactions', requireAuth, async (req: AuthedRequest, res) => {
  const snap = await db
    .collection('transactions')
    .where('userId', '==', req.authUid)
    .orderBy('createdAt', 'desc')
    .get();

  const transactions = snap.docs.map((d) => d.data() as WalletTransaction);
  res.json(transactions);
});
