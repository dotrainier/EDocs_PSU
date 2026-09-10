'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, MoreHorizontal, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { api } from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseRow = {
  id: number;
  name: string;
  major: string | null;
  code: string;
  is_active: boolean;
};

type CourseFormState = {
  name: string;
  major: string;
  code: string;
};

const emptyCourseForm: CourseFormState = { name: '', major: '', code: '' };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CourseFormState>(emptyCourseForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadCourses() {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.get<{ courses: CourseRow[] }>('/admin/courses');
      setCourses(res.courses);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to load courses.';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const filtered = useMemo(
    () =>
      courses.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          (c.major ?? '').toLowerCase().includes(search.toLowerCase()),
      ),
    [courses, search],
  );

  const activeCount = courses.filter((c) => c.is_active).length;

  function openAddSheet() {
    setEditingId(null);
    setForm(emptyCourseForm);
    setFormError('');
    setSheetOpen(true);
  }

  function openEditSheet(course: CourseRow) {
    setEditingId(course.id);
    setForm({ name: course.name, major: course.major ?? '', code: course.code });
    setFormError('');
    setSheetOpen(true);
  }

  async function handleSave() {
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Program name is required.');
      return;
    }
    if (!form.code.trim()) {
      setFormError('Code is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        major: form.major.trim() || undefined,
        code: form.code.trim(),
      };

      if (editingId) {
        const res = await api.patch<{ course: CourseRow }>(`/admin/courses/${editingId}`, payload);
        setCourses((prev) => prev.map((c) => (c.id === editingId ? res.course : c)));
      } else {
        const res = await api.post<{ course: CourseRow }>('/admin/courses', payload);
        setCourses((prev) => [...prev, res.course]);
      }
      setSheetOpen(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to save course.';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(course: CourseRow) {
    try {
      const res = await api.patch<{ course: CourseRow }>(`/admin/courses/${course.id}`, {
        is_active: !course.is_active,
      });
      setCourses((prev) => prev.map((c) => (c.id === course.id ? res.course : c)));
    } catch {
      // silently ignore — table stays at last known-good state
    }
  }

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
            Courses
          </h1>
          <p className='font-sans mt-1 text-sm text-muted-foreground'>
            {activeCount} active programs available on the registration form
          </p>
        </div>
        <Button size='sm' className='gap-1.5' onClick={openAddSheet}>
          <Plus className='h-4 w-4' />
          Add Course
        </Button>
      </div>

      {loadError && (
        <Alert variant='destructive'>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardContent className='px-5 py-4'>
          <div className='relative max-w-sm'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search courses…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='font-sans pl-9'
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow className='border-border hover:bg-transparent'>
                {['Program', 'Major', 'Code', 'Status', ''].map((h) => (
                  <TableHead
                    key={h}
                    className={cn(
                      'font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                      h === 'Program' && 'pl-6',
                      h === '' && 'pr-6',
                    )}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className='py-16 text-center text-sm text-muted-foreground'>
                    <Loader2 className='mx-auto mb-2 h-5 w-5 animate-spin' />
                    Loading courses…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='py-16 text-center text-sm text-muted-foreground'>
                    No courses match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((course) => (
                  <TableRow key={course.id} className='border-border'>
                    <TableCell className='pl-6'>
                      <span className='font-sans text-sm font-medium text-foreground'>
                        {course.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-sans text-sm text-muted-foreground'>
                        {course.major ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-mono rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'>
                        {course.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium',
                          course.is_active ? 'text-emerald-600' : 'text-muted-foreground',
                        )}
                      >
                        {course.is_active ? (
                          <CheckCircle2 className='h-3.5 w-3.5' />
                        ) : (
                          <XCircle className='h-3.5 w-3.5' />
                        )}
                        {course.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className='pr-6'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => openEditSheet(course)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-destructive focus:text-destructive'
                            onClick={() => toggleActive(course)}
                          >
                            {course.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Course' : 'Add Course'}</SheetTitle>
            <SheetDescription>
              {editingId
                ? 'Update this program/major combination.'
                : 'Add a new program or major offered by the university.'}
            </SheetDescription>
          </SheetHeader>

          <div className='flex-1 space-y-4 overflow-y-auto px-4'>
            {formError && (
              <Alert variant='destructive' className='py-3'>
                <AlertDescription className='text-sm'>{formError}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='course-name' className='text-sm font-medium'>
                Program Name
              </Label>
              <Input
                id='course-name'
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder='e.g. Bachelor of Science in Industrial Technology'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='course-major' className='text-sm font-medium'>
                Major <span className='text-muted-foreground font-normal'>(optional)</span>
              </Label>
              <Input
                id='course-major'
                value={form.major}
                onChange={(e) => setForm((prev) => ({ ...prev, major: e.target.value }))}
                placeholder='e.g. Automotive Technology'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='course-code' className='text-sm font-medium'>
                Code
              </Label>
              <Input
                id='course-code'
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder='e.g. BSIT-AUTO'
                className='font-mono'
              />
            </div>
          </div>

          <SheetFooter className='flex-row justify-end gap-2'>
            <SheetClose asChild>
              <Button variant='outline'>Cancel</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className='mr-1.5 h-4 w-4 animate-spin' />
                  Saving…
                </>
              ) : editingId ? (
                'Save Changes'
              ) : (
                'Add Course'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
