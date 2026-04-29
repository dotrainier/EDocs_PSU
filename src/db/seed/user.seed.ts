// src/db/seed.ts
import { createSeedClient } from '@/lib/supabase/seed';
import { db } from '@/db';
import { profiles } from '@/db/schema';

const fakeUsers = [
  { email: 'john@example.com', password: 'password123', username: 'john_doe' },
  { email: 'jane@example.com', password: 'password123', username: 'jane_smith' },
  { email: 'bob@example.com', password: 'password123', username: 'bob_jones' },
];

export async function seedFakeUsers() {
  const supabase = await createSeedClient();
  const createdUsers = [];

  for (const user of fakeUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (error) {
        console.error(`❌ Failed to create ${user.email}:`, error.message);
        continue;
      }

      if (data.user) {
        createdUsers.push({
          id: data.user.id,
          email: user.email,
          username: user.username,
          password: user.password,
        });
        console.log(`✅ Created auth user: ${user.email}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error);
    }
  }

  if (createdUsers.length > 0) {
    try {
      await db.insert(profiles).values(createdUsers).execute();
      console.log(`✅ Inserted ${createdUsers.length} profiles`);
    } catch (error) {
      console.error(`❌ Failed to insert profiles:`, error);
    }
  }
}
