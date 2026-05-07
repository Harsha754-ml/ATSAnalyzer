/**
 * Lightweight JSON file-based database
 * No MongoDB, no external DB needed — works instantly on any machine
 */
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

class Collection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DB_DIR, `${name}.json`);
    this._ensureFile();
  }

  _ensureFile() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '[]', 'utf-8');
    }
  }

  _read() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  _genId() {
    return crypto.randomBytes(12).toString('hex'); // 24-char hex like MongoDB ObjectId
  }

  // Find all matching documents
  find(query = {}) {
    const docs = this._read();
    return docs.filter((doc) => {
      return Object.entries(query).every(([key, val]) => doc[key] === val);
    });
  }

  // Find one document
  findOne(query = {}) {
    return this.find(query)[0] || null;
  }

  // Find by ID
  findById(id) {
    return this.findOne({ _id: id });
  }

  // Insert a new document
  create(data) {
    const docs = this._read();
    const doc = {
      _id: this._genId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    docs.push(doc);
    this._write(docs);
    return doc;
  }

  // Update one document matching query
  findOneAndUpdate(query, updates, options = {}) {
    const docs = this._read();
    let idx = docs.findIndex((doc) =>
      Object.entries(query).every(([key, val]) => doc[key] === val)
    );

    if (idx === -1 && options.upsert) {
      // Create new doc
      const doc = {
        _id: this._genId(),
        ...query,
        ...updates,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      docs.push(doc);
      this._write(docs);
      return doc;
    }

    if (idx === -1) return null;

    docs[idx] = { ...docs[idx], ...updates, updatedAt: new Date().toISOString() };
    this._write(docs);
    return docs[idx];
  }

  // Update by ID
  findByIdAndUpdate(id, updates, options = {}) {
    return this.findOneAndUpdate({ _id: id }, updates, options);
  }

  // Delete one document
  findOneAndDelete(query) {
    const docs = this._read();
    const idx = docs.findIndex((doc) =>
      Object.entries(query).every(([key, val]) => doc[key] === val)
    );
    if (idx === -1) return null;
    const [deleted] = docs.splice(idx, 1);
    this._write(docs);
    return deleted;
  }

  // Delete by ID
  findByIdAndDelete(id) {
    return this.findOneAndDelete({ _id: id });
  }

  // Sort helper — returns sorted array
  findSorted(query, sortField, order = -1, limit = 100) {
    let results = this.find(query);
    results.sort((a, b) => {
      if (order === -1) return a[sortField] < b[sortField] ? 1 : -1;
      return a[sortField] > b[sortField] ? 1 : -1;
    });
    return results.slice(0, limit);
  }
}

// Export pre-made collections
const db = {
  users:      new Collection('users'),
  resumes:    new Collection('resumes'),
  portfolios: new Collection('portfolios'),
};

module.exports = db;
