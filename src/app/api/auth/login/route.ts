// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const profile = await db
      .select()
      .from(profiles)
      .where(or(eq(profiles.username, username), eq(profiles.email, username)))
      .limit(1);

    const profileData = profile[0];

    if (!profileData) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    const supabase = await createClient();

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: profileData.email,
      password,
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json({ message: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: 'Login successful',
        user: data.user,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
