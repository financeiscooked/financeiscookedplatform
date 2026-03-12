// IndexedDB storage for custom sounds and memes

const DB_NAME = 'financeiscooked-soundboard'
const DB_VERSION = 2
const STORE_NAME = 'sounds'
const CONFIG_STORE = 'config'
const MEME_STORE = 'memes'
const MEME_CONFIG_STORE = 'memeConfig'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(MEME_STORE)) {
        db.createObjectStore(MEME_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(MEME_CONFIG_STORE)) {
        db.createObjectStore(MEME_CONFIG_STORE, { keyPath: 'id' })
      }
    }
  })
}

// ==================== SOUNDS ====================

export async function saveCustomSound(slotId, file) {
  const db = await openDB()
  const arrayBuffer = await file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put({
      id: slotId,
      name: file.name.replace(/\.[^.]+$/, '').toUpperCase(),
      data: arrayBuffer,
      type: file.type,
      originalName: file.name,
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAllCustomSounds() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteCustomSound(slotId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(slotId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveButtonConfig(slotId, config) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG_STORE, 'readwrite')
    const store = tx.objectStore(CONFIG_STORE)
    store.put({ id: slotId, ...config })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAllButtonConfigs() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG_STORE, 'readonly')
    const store = tx.objectStore(CONFIG_STORE)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ==================== MEMES ====================

export async function saveCustomMeme(slotId, file) {
  const db = await openDB()
  const arrayBuffer = await file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEME_STORE, 'readwrite')
    const store = tx.objectStore(MEME_STORE)
    store.put({
      id: slotId,
      name: file.name.replace(/\.[^.]+$/, '').toUpperCase(),
      data: arrayBuffer,
      type: file.type,
      originalName: file.name,
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAllCustomMemes() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEME_STORE, 'readonly')
    const store = tx.objectStore(MEME_STORE)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteCustomMeme(slotId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEME_STORE, 'readwrite')
    const store = tx.objectStore(MEME_STORE)
    store.delete(slotId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveMemeConfig(slotId, config) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEME_CONFIG_STORE, 'readwrite')
    const store = tx.objectStore(MEME_CONFIG_STORE)
    store.put({ id: slotId, ...config })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAllMemeConfigs() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEME_CONFIG_STORE, 'readonly')
    const store = tx.objectStore(MEME_CONFIG_STORE)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
