// Migration tracking for future versions
// This ensures data is preserved when updating the app

const MIGRATIONS = [
  {
    version: 1,
    name: 'Initial schema',
    // The initial schema is created in schema.ts
    // This is just for tracking
  }
];

export const runMigrations = async (): Promise<void> => {
  // In the future, when we add v2 features (recipes, stock, etc.)
  // we can check current DB version and run specific migrations
  // without touching existing data
  
  console.log('Database migrations up to date (v1)');
};
