import { db } from '@/db';
import { courses } from '@/db/schema';

const courseData = [
  { name: 'Bachelor of Science in Accountancy', major: null, code: 'BSA' },
  {
    name: 'Bachelor of Science in Business Administration',
    major: 'Marketing Management',
    code: 'BSBA-MM',
  },
  { name: 'Bachelor of Science in Information Technology', major: null, code: 'BSIT' },
  { name: 'Bachelor of Elementary Education', major: null, code: 'BEEd' },
  { name: 'Bachelor of Secondary Education', major: 'English', code: 'BSEd-ENG' },
  { name: 'Bachelor of Secondary Education', major: 'Filipino', code: 'BSEd-FIL' },
  { name: 'Bachelor in Physical Education', major: null, code: 'BPEd' },
  {
    name: 'Bachelor of Science in Industrial Technology',
    major: 'Automotive Technology',
    code: 'BSIT-AUTO',
  },
  {
    name: 'Bachelor of Science in Industrial Technology',
    major: 'Electrical Technology',
    code: 'BSIT-ELEC',
  },
  {
    name: 'Bachelor of Science in Industrial Technology',
    major: 'Food and Service Management',
    code: 'BSIT-FSM',
  },
  {
    name: 'Bachelor of Science in Industrial Technology',
    major: 'Graphic Technology',
    code: 'BSIT-GT',
  },
  {
    name: 'Bachelor of Technology and Livelihood Education',
    major: 'Home Economics',
    code: 'BTLEd-HE',
  },
  { name: 'Bachelor of Science in Hospitality Management', major: null, code: 'BSHM' },
];

export async function seedCourses() {
  console.log('Seeding courses...');

  await db.insert(courses).values(courseData).onConflictDoNothing();

  console.log(`  Courses: ${courseData.length}`);
}
