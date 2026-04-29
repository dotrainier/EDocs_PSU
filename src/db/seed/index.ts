import { seedFakeUsers } from './user.seed';

export async function seedDatabase() {
  console.log('Starting database seeding...');
  await seedFakeUsers();
  console.log('Database seeding completed!');
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
