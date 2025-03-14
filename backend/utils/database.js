// backend/utils/database.js
const fs = require('fs').promises;
const path = require('path');

// Database file paths
const DB_DIR = path.join(__dirname, '../database');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const GROUPS_FILE = path.join(DB_DIR, 'groups.json');
const EXPENSES_FILE = path.join(DB_DIR, 'expenses.json');

// Ensure database directory exists
const initDatabase = async () => {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });

    // Initialize files if they don't exist
    const files = [
      { path: USERS_FILE, defaultContent: '[]' },
      { path: GROUPS_FILE, defaultContent: '[]' },
      { path: EXPENSES_FILE, defaultContent: '[]' }
    ];

    for (const file of files) {
      try {
        await fs.access(file.path);
      } catch (error) {
        // File doesn't exist, create it
        await fs.writeFile(file.path, file.defaultContent);
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Read JSON data from file
const readData = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading from ${filePath}:`, error);
    throw error;
  }
};

// Write JSON data to file
const writeData = async (filePath, data) => {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData);
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    throw error;
  }
};

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
};

module.exports = {
  initDatabase,
  USERS_FILE,
  GROUPS_FILE,
  EXPENSES_FILE,
  readData,
  writeData,
  generateId
};