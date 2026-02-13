/**
 * POST /api/auth/logout
 * Logout and clear session
 */

import { logout, getCurrentUser } from '@/lib/auth';
import { successResponse, serverErrorResponse } from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

export async function POST() {
  try {
    const user = await getCurrentUser();
    
    if (user) {
      await auditLog('Session', user.id, 'LOGOUT', { userId: user.id });
    }
    
    await logout();
    
    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return serverErrorResponse('Failed to logout');
  }
}
