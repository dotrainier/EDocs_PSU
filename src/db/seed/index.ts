import { seedBase } from './seed.base';
import { seedDocuments } from './seed.document';

export async function seedDatabase() {
  await seedBase();
  await seedDocuments();
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
