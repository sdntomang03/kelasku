import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import initSqlJs from 'sql.js/dist/sql-wasm.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { defineCustomElements } from 'jeep-sqlite/loader'
import { resolvePublicImages } from '../utils/resolvePublicImages'

const DATABASE_NAME = 'kelasku_practice'
const sqlite = new SQLiteConnection(CapacitorSQLite)
let databasePromise
let bundledDatabasePromise

const schema = [
  `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '', sort_order INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS packages (id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT DEFAULT '', difficulty TEXT DEFAULT '', sort_order INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, package_id TEXT NOT NULL REFERENCES packages(id) ON DELETE CASCADE, position INTEGER DEFAULT 0, type TEXT NOT NULL, content TEXT NOT NULL, explanation TEXT DEFAULT '')`,
  `CREATE TABLE IF NOT EXISTS options (id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE, option_text TEXT NOT NULL, is_correct INTEGER DEFAULT 0, score_weight REAL, position INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE, premise_text TEXT NOT NULL, target_id TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS targets (id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE, target_text TEXT NOT NULL, position INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS practice_answers (package_id TEXT NOT NULL, question_id TEXT NOT NULL, answer TEXT, updated_at TEXT NOT NULL, PRIMARY KEY (package_id, question_id))`,
  `CREATE TABLE IF NOT EXISTS practice_package_settings (package_id TEXT PRIMARY KEY, grading_mode TEXT NOT NULL CHECK (grading_mode IN ('weighted', 'average')))`,
  `CREATE TABLE IF NOT EXISTS learning_materials (id TEXT PRIMARY KEY, category_id TEXT REFERENCES categories(id) ON DELETE SET NULL, title TEXT NOT NULL, summary TEXT DEFAULT '', content TEXT NOT NULL, sort_order INTEGER DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS idx_learning_materials_category_order ON learning_materials(category_id, sort_order, title)`,
]

async function openDatabase() {
  if (databasePromise) return databasePromise
  databasePromise = (async () => {
    if (Capacitor.getPlatform() === 'web') {
      defineCustomElements(window)
      await customElements.whenDefined('jeep-sqlite')
      let element = document.querySelector('jeep-sqlite')
      if (!element) element = document.createElement('jeep-sqlite')
      element.wasmPath = new URL('.', new URL(sqlWasmUrl, document.baseURI)).pathname
      if (!element.isConnected) document.body.append(element)
      await sqlite.initWebStore()
    }
    const consistency = await sqlite.checkConnectionsConsistency()
    const connected = consistency.result && await sqlite.isConnection(DATABASE_NAME, false)
    const db = connected?.result
      ? await sqlite.retrieveConnection(DATABASE_NAME, false)
      : await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false)
    const isOpen = await db.isDBOpen()
    if (!isOpen.result) await db.open()
    await db.execute(schema.join(';'))
    if (Capacitor.getPlatform() === 'web') await sqlite.saveToStore(DATABASE_NAME)
    return db
  })().catch((error) => {
    databasePromise = null
    throw error
  })
  return databasePromise
}

async function query(statement, values = []) {
  const db = await openDatabase()
  const result = await db.query(statement, values)
  return result.values || []
}

function requiredColumns(database, tableName, required) {
  const table = database.exec(`PRAGMA table_info("${tableName}")`)[0]
  if (!table) throw new Error(`Tabel "${tableName}" tidak ditemukan di file database.`)
  const columns = table.values.map((column) => column[1])
  const missing = required.filter((column) => !columns.includes(column))
  if (missing.length) throw new Error(`Tabel "${tableName}" harus memiliki kolom: ${missing.join(', ')}.`)
  return columns
}

function tableRows(database, tableName, required) {
  requiredColumns(database, tableName, required)
  const result = database.exec(`SELECT * FROM "${tableName}"`)
  if (!result.length) return []
  return result[0].values.map((row) => Object.fromEntries(result[0].columns.map((column, index) => [column, row[index]])))
}

function value(row, key, fallback = null) {
  return row[key] === undefined || row[key] === null ? fallback : row[key]
}

function toBoolean(input) {
  return input === true || input === 1 || input === '1' || input === 'true'
}

async function ensureBundledPracticeDatabase() {
  if (bundledDatabasePromise) return bundledDatabasePromise
  bundledDatabasePromise = (async () => {
    const db = await openDatabase()
    const rows = await db.query('SELECT COUNT(*) AS category_count FROM categories')
    const hasPracticeContent = Number(rows.values?.[0]?.category_count || 0) > 0
    const response = await fetch(`${import.meta.env.BASE_URL}latihan-contoh.db`, { cache: 'no-cache' })
    if (!response.ok) throw new Error(`Database latihan bawaan gagal dimuat (${response.status}).`)
    const bytes = await response.arrayBuffer()
    if (hasPracticeContent) await syncBundledLearningMaterials(bytes)
    else await importPracticeDatabaseBytes(bytes)
  })().catch((error) => {
    bundledDatabasePromise = null
    throw error
  })
  return bundledDatabasePromise
}

export async function refreshBundledPracticeDatabase() {
  bundledDatabasePromise = null
  await ensureBundledPracticeDatabase()
}

export async function getPracticeCategories() {
  await ensureBundledPracticeDatabase()
  return query(`SELECT c.id, c.name, c.description, COUNT(DISTINCT p.id) AS package_count
    FROM categories c LEFT JOIN packages p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.description ORDER BY c.sort_order, c.name`)
}

export async function getPracticePackages(categoryId) {
  await ensureBundledPracticeDatabase()
  return query(`SELECT p.id, p.category_id, p.title, p.description, p.difficulty,
      COUNT(DISTINCT q.id) AS question_count
    FROM packages p LEFT JOIN questions q ON q.package_id = p.id
    WHERE p.category_id = ? GROUP BY p.id, p.category_id, p.title, p.description, p.difficulty
    ORDER BY p.sort_order, p.title`, [categoryId])
}

export async function getPracticePackage(categoryId, packageId) {
  await ensureBundledPracticeDatabase()
  const rows = await query('SELECT * FROM packages WHERE category_id = ? AND id = ?', [categoryId, packageId])
  return rows[0] || null
}

export async function getPracticeQuestions(packageId) {
  await ensureBundledPracticeDatabase()
  const questions = await query('SELECT * FROM questions WHERE package_id = ? ORDER BY position, id', [packageId])
  return Promise.all(questions.map(async (question) => {
    const [options, matches, targets] = await Promise.all([
      query('SELECT * FROM options WHERE question_id = ? ORDER BY position, id', [question.id]),
      query('SELECT * FROM matches WHERE question_id = ? ORDER BY id', [question.id]),
      query('SELECT * FROM targets WHERE question_id = ? ORDER BY position, id', [question.id]),
    ])
    return {
      ...question,
      content: resolvePublicImages(question.content),
      explanation: resolvePublicImages(question.explanation),
      options: options.map((option) => ({
        ...option,
        option_text: resolvePublicImages(option.option_text),
        is_correct: toBoolean(option.is_correct),
      })),
      matches: matches.map((match) => ({ ...match, premise_text: resolvePublicImages(match.premise_text) })),
      target_options: targets.map((target) => ({ id: target.id, text: resolvePublicImages(target.target_text) })),
    }
  }))
}

export async function getLearningCategories() {
  await ensureBundledPracticeDatabase()
  return query(`SELECT c.id, c.name, c.description, COUNT(m.id) AS material_count
    FROM categories c JOIN learning_materials m ON m.category_id = c.id
    GROUP BY c.id, c.name, c.description, c.sort_order
    ORDER BY c.sort_order, c.name`)
}

export async function getLearningMaterials(categoryId) {
  await ensureBundledPracticeDatabase()
  const materials = await query(`SELECT m.id, m.category_id, m.title, m.summary, c.name AS category_name
    FROM learning_materials m LEFT JOIN categories c ON c.id = m.category_id
    WHERE m.category_id = ?
    ORDER BY COALESCE(c.sort_order, 999), m.sort_order, m.title`, [categoryId])
  return materials.map((material) => ({
    ...material,
    summary: resolvePublicImages(material.summary || ''),
  }))
}

export async function getLearningMaterial(categoryId, materialId) {
  await ensureBundledPracticeDatabase()
  const rows = await query(`SELECT m.id, m.category_id, m.title, m.summary, m.content, c.name AS category_name
    FROM learning_materials m LEFT JOIN categories c ON c.id = m.category_id
    WHERE m.category_id = ? AND m.id = ?`, [categoryId, materialId])
  const material = rows[0]
  return material ? {
    ...material,
    summary: resolvePublicImages(material.summary || ''),
    content: resolvePublicImages(material.content || ''),
  } : null
}

export async function getPracticeAnswers(packageId) {
  await ensureBundledPracticeDatabase()
  const rows = await query('SELECT question_id, answer FROM practice_answers WHERE package_id = ?', [packageId])
  return Object.fromEntries(rows.map((row) => [row.question_id, JSON.parse(row.answer)]))
}

export async function getPracticeGradingMode(packageId) {
  await ensureBundledPracticeDatabase()
  const saved = await query('SELECT grading_mode FROM practice_package_settings WHERE package_id = ?', [packageId])
  if (saved[0]?.grading_mode) return saved[0].grading_mode
  const weighted = await query(`SELECT COUNT(*) AS count FROM questions q
    JOIN options o ON o.question_id = q.id
    WHERE q.package_id = ? AND o.score_weight IS NOT NULL`, [packageId])
  return Number(weighted[0]?.count || 0) > 0 ? 'weighted' : 'average'
}

export async function savePracticeGradingMode(packageId, gradingMode) {
  if (!['weighted', 'average'].includes(gradingMode)) throw new Error('Pilih metode koreksi yang tersedia.')
  const db = await openDatabase()
  await db.run(
    `INSERT INTO practice_package_settings (package_id, grading_mode) VALUES (?, ?)
      ON CONFLICT(package_id) DO UPDATE SET grading_mode = excluded.grading_mode`,
    [packageId, gradingMode],
  )
  if (Capacitor.getPlatform() === 'web') await sqlite.saveToStore(DATABASE_NAME)
}

export async function savePracticeAnswer(packageId, questionId, answer) {
  const db = await openDatabase()
  await db.run(
    `INSERT INTO practice_answers (package_id, question_id, answer, updated_at)
      VALUES (?, ?, ?, ?) ON CONFLICT(package_id, question_id)
      DO UPDATE SET answer = excluded.answer, updated_at = excluded.updated_at`,
    [packageId, questionId, JSON.stringify(answer), new Date().toISOString()],
  )
  if (Capacitor.getPlatform() === 'web') await sqlite.saveToStore(DATABASE_NAME)
}

async function importPracticeDatabaseBytes(bytes) {
  const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl })
  const source = new SQL.Database(new Uint8Array(bytes))
  try {
    const categories = tableRows(source, 'categories', ['id', 'name'])
    const packages = tableRows(source, 'packages', ['id', 'category_id', 'title'])
    const questions = tableRows(source, 'questions', ['id', 'package_id', 'type', 'content'])
    const options = tableRows(source, 'options', ['id', 'question_id', 'option_text'])
    const optionalRows = (table, columns) => {
      const exists = source.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`).length > 0
      return exists ? tableRows(source, table, columns) : []
    }
    const matches = optionalRows('matches', ['id', 'question_id', 'premise_text', 'target_id'])
    const targets = optionalRows('targets', ['id', 'question_id', 'target_text'])
    const learningMaterials = optionalRows('learning_materials', ['id', 'title', 'content'])
    if (!categories.length || !packages.length || !questions.length) {
      throw new Error('Database harus berisi kategori, paket, dan soal latihan.')
    }
    const db = await openDatabase()
    const inserts = [
      ['categories', ['id', 'name', 'description', 'sort_order'], categories, (row) => [row.id, row.name, value(row, 'description', ''), value(row, 'sort_order', 0)]],
      ['packages', ['id', 'category_id', 'title', 'description', 'difficulty', 'sort_order'], packages, (row) => [row.id, row.category_id, row.title, value(row, 'description', ''), value(row, 'difficulty', ''), value(row, 'sort_order', 0)]],
      ['questions', ['id', 'package_id', 'position', 'type', 'content', 'explanation'], questions, (row) => [row.id, row.package_id, value(row, 'position', 0), row.type, row.content, value(row, 'explanation', '')]],
      ['options', ['id', 'question_id', 'option_text', 'is_correct', 'score_weight', 'position'], options, (row) => [row.id, row.question_id, row.option_text, value(row, 'is_correct', 0), value(row, 'score_weight'), value(row, 'position', 0)]],
      ['matches', ['id', 'question_id', 'premise_text', 'target_id'], matches, (row) => [row.id, row.question_id, row.premise_text, row.target_id]],
      ['targets', ['id', 'question_id', 'target_text', 'position'], targets, (row) => [row.id, row.question_id, row.target_text, value(row, 'position', 0)]],
      ['learning_materials', ['id', 'category_id', 'title', 'summary', 'content', 'sort_order'], learningMaterials, (row) => [row.id, value(row, 'category_id'), row.title, value(row, 'summary', ''), row.content, value(row, 'sort_order', 0)]],
    ]
    const statements = [
      { statement: 'DELETE FROM practice_answers', values: [] },
      { statement: 'DELETE FROM practice_package_settings', values: [] },
      ...['learning_materials', 'options', 'matches', 'targets', 'questions', 'packages', 'categories'].map((table) => ({ statement: `DELETE FROM ${table}`, values: [] })),
    ]
    for (const [table, columns, rows, mapRow] of inserts) {
      const placeholders = columns.map(() => '?').join(', ')
      const statement = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
      statements.push(...rows.map((row) => ({ statement, values: mapRow(row) })))
    }
    await db.executeSet(statements, true)
    if (Capacitor.getPlatform() === 'web') await sqlite.saveToStore(DATABASE_NAME)
    return { categories: categories.length, packages: packages.length, questions: questions.length }
  } finally {
    source.close()
  }
}

async function syncBundledLearningMaterials(bytes) {
  const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl })
  const source = new SQL.Database(new Uint8Array(bytes))
  try {
    const hasMaterialsTable = source.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='learning_materials'").length > 0
    if (!hasMaterialsTable) return

    const materials = tableRows(source, 'learning_materials', ['id', 'title', 'content'])
    const db = await openDatabase()
    const categories = await query('SELECT id FROM categories')
    const categoryIds = new Set(categories.map((category) => String(category.id)))
    const statements = [
      { statement: 'DELETE FROM learning_materials', values: [] },
      ...materials.map((material) => ({
        statement: `INSERT INTO learning_materials (id, category_id, title, summary, content, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)`,
        values: [
          material.id,
          categoryIds.has(String(value(material, 'category_id'))) ? material.category_id : null,
          material.title,
          value(material, 'summary', ''),
          material.content,
          value(material, 'sort_order', 0),
        ],
      })),
    ]
    await db.executeSet(statements, true)
    if (Capacitor.getPlatform() === 'web') await sqlite.saveToStore(DATABASE_NAME)
  } finally {
    source.close()
  }
}
