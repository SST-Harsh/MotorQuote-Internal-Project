import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/suspended
 * List all suspended users (Super Admin only)
 *
 * Backend endpoint: GET /users/suspended?page=1&limit=5
 */
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const role = cookieStore.get('role')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only super_admin can access suspended users
    if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied. Super Admin only.' }, { status: 403 });
    }

    // Get the backend URL from environment
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 'https://elastic-meitner.74-208-164-206.plesk.page';

    // Get query params
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    // Call the backend /users/suspended endpoint (without /api prefix)
    const response = await fetch(`${backendUrl}/users/suspended?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('Error fetching suspended users:', error);
    return NextResponse.json({ error: 'Failed to fetch suspended users' }, { status: 500 });
  }
}
