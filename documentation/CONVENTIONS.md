# Project Conventions

Follow these patterns when generating code for this project.

## Tech Stack

- Next.js 14 with the App Router
- TypeScript everywhere
- Axios through `@/lib/axios`
- Drizzle for database queries
- Supabase for authentication and session handling

## General Style

- Prefer small, typed functions over untyped helpers
- Keep component logic and page logic close to the file that uses it
- Use clear, explicit return types when they improve readability
- Keep imports grouped by external packages first, then app aliases

## API Calls

Always use the `api` helper from `@/lib/axios`; do not use the raw axios instance directly.

```typescript
import { api } from '@/lib/axios';

type LoginResponse = {
  message: string;
  user: {
    email: string | null;
  } | null;
};

async function submitLogin(username: string, password: string) {
  const response = await api.post<LoginResponse>('/auth/login', {
    username,
    password,
  });

  return response;
}
```

## Pages

- Use `page.tsx` for route pages
- Use `export default function` for page components
- Keep pages focused on composition and state for that route

```typescript
export default function ExamplePage() {
	return <div>...</div>;
}
```

## Components

- Use function declarations, not arrow functions, for components
- Put the props interface above the component
- Export the component at the bottom of the file

```typescript
interface ButtonProps {
	label: string;
}

function Button({ label }: ButtonProps) {
	return <button>{label}</button>;
}

export default Button;
```

## API Routes

- Use the App Router route handler pattern
- Return responses with `NextResponse.json`
- Validate required inputs before hitting the database or auth provider
- Use `try/catch` with `error instanceof Error` for safe error messages

```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Login successful' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
```

## Error Handling

Use `unknown` in `catch` blocks and narrow before reading `message`.

```typescript
try {
  // work
} catch (err: unknown) {
  const message =
    err && typeof err === 'object' && 'message' in err
      ? (err as { message: string }).message
      : 'Default message';
}
```

## Database Access

- Use Drizzle query builders instead of hand-written SQL when possible
- Keep database access in server-side files
- Select only the data you need

```typescript
const profile = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1);
```

## File Naming

- Pages: `page.tsx`
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `types.ts` or inline when the type is local to the file
