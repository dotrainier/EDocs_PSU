import { seedCourses } from './seed.courses';
import { seedBase } from './seed.base';
import { seedDocuments } from './seed.document';
import { seedRequests } from './seed.requests';

export async function seedDatabase() {
  await seedCourses();
  await seedBase();
  await seedDocuments();
  await seedRequests();
}

seedDatabase()
  .then(() => {
    console.log('All seeding operations completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during database seeding:', error);
    process.exit(1);
  });
