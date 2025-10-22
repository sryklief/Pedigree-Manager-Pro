const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

let db = null;

function getAppDataPath() {
  const userDataPath = app.getPath('userData');
  const appDataDir = path.join(userDataPath, 'PigeonPedigreeManager');
  
  // Ensure directory exists
  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir, { recursive: true });
  }
  
  return appDataDir;
}

function getImagesPath() {
  const appDataDir = getAppDataPath();
  const imagesDir = path.join(appDataDir, 'images');
  
  // Ensure images directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  return imagesDir;
}

async function initDatabase() {
  try {
    const dbPath = path.join(getAppDataPath(), 'pedigree.db');
    
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    
    console.log('Connected to SQLite database');
    await createTables();
  } catch (err) {
    console.error('Error opening database:', err);
    throw err;
  }
}

async function createTables() {
  const tables = [
    // Birds table
    `CREATE TABLE IF NOT EXISTS birds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ring_number TEXT UNIQUE,
      sex TEXT CHECK(sex IN ('male', 'female')),
      color TEXT,
      breed TEXT,
      year INTEGER,
      notes TEXT,
      body_photo TEXT,
      eye_photo TEXT,
      sire_id INTEGER,
      dam_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sire_id) REFERENCES birds (id),
      FOREIGN KEY (dam_id) REFERENCES birds (id)
    )`,
    
    // License activation table
    `CREATE TABLE IF NOT EXISTS license_activation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT NOT NULL,
      device_id TEXT NOT NULL,
      activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      status TEXT DEFAULT 'active'
    )`,
    
    // Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Pedigrees table for saved pedigrees
    `CREATE TABLE IF NOT EXISTS pedigrees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bird_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bird_id) REFERENCES birds (id)
    )`
  ];
  
  try {
    tables.forEach((tableSQL) => {
      db.exec(tableSQL);
    });
    console.log('All database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
}

function getDatabase() {
  return db;
}

function closeDatabase() {
  if (db) {
    try {
      db.close();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error closing database:', err);
    }
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  getAppDataPath,
  getImagesPath
};
