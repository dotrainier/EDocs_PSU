import { requireSession } from '@/lib/session';
import { formatRole } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GraduationCap, IdCard, User, Shield } from 'lucide-react';

export default async function ProfilePage() {
  const user = await requireSession();

  const fields = [
    { icon: User, label: 'Full Name', value: user.fullName },
    { icon: IdCard, label: 'School / Employee ID', value: user.schoolId },
    { icon: Shield, label: 'Role', value: formatRole(user.role) },
  ];

  return (
    <div className='mx-auto max-w-xl space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight text-foreground'>Profile</h1>
        <p className='mt-0.5 text-sm text-muted-foreground'>Your account information.</p>
      </div>

      {/* Avatar card */}
      <Card>
        <CardContent className='flex items-center gap-5 px-6 py-6'>
          <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25'>
            {user.initials}
          </div>
          <div className='min-w-0'>
            <p className='text-lg font-bold text-foreground'>{user.fullName}</p>
            <div className='mt-1 flex items-center gap-2'>
              <Badge variant='secondary' className='rounded-md text-xs'>
                {formatRole(user.role)}
              </Badge>
              <span className='text-xs text-muted-foreground'>{user.schoolId}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details card */}
      <Card>
        <CardHeader className='pb-2 pt-5'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold text-muted-foreground'>
            <GraduationCap className='h-4 w-4' />
            Account Details
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className='px-0 py-0'>
          {fields.map(({ icon: Icon, label, value }, i) => (
            <div key={label}>
              <div className='flex items-center gap-4 px-6 py-4'>
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted'>
                  <Icon className='h-4 w-4 text-muted-foreground' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
                    {label}
                  </p>
                  <p className='mt-0.5 text-sm font-medium text-foreground'>{value}</p>
                </div>
              </div>
              {i < fields.length - 1 && <Separator className='mx-6 w-auto' />}
            </div>
          ))}
        </CardContent>
      </Card>

      <p className='text-center text-xs text-muted-foreground'>
        To update your account information, please contact your system administrator.
      </p>
    </div>
  );
}
