import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OFFLINE_DIRECTORY_SCHEMA_VERSION,
  clearOfflineDirectorySnapshot,
  getActiveOfflineDirectorySnapshot,
  getOfflineDirectoryMetadata,
  saveOfflineDirectorySnapshot,
  type OfflineDirectorySnapshot,
} from './offlineDirectory';

type RequestLike = {
  result: unknown;
  error: DOMException | null;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
};

type StoreState = {
  keyPath: string;
  records: Map<IDBValidKey, unknown>;
};

class FakeTransaction {
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  error: DOMException | null = null;
  private staged = new Map<string, StoreState>();
  private operations: Array<() => void> = [];
  private operationIndex = 0;
  private started = false;
  private processing = false;
  private finished = false;
  private releaseQueue: (() => void) | null = null;

  constructor(
    private readonly database: FakeDatabase,
    private readonly storeNames: string[],
    private readonly mode: IDBTransactionMode,
  ) {
    const previous = database.transactionQueue;
    database.transactionQueue = new Promise<void>((resolve) => {
      this.releaseQueue = resolve;
    });
    previous.then(() => {
      this.staged = new Map(
        [...database.stores.entries()].map(([name, store]) => [
          name,
          { keyPath: store.keyPath, records: new Map(store.records) },
        ]),
      );
      this.started = true;
      this.pump();
    });
  }

  objectStore(name: string): FakeObjectStore {
    if (!this.storeNames.includes(name)) throw new DOMException('Store is outside this transaction.', 'NotFoundError');
    if (!this.staged.has(name) && this.started) throw new DOMException('Object store does not exist.', 'NotFoundError');
    return new FakeObjectStore(this, name);
  }

  enqueue(request: RequestLike, operation: (store: StoreState) => unknown, storeName: string): void {
    this.operations.push(() => {
      try {
        const store = this.staged.get(storeName);
        if (!store) throw new DOMException('Object store does not exist.', 'NotFoundError');
        request.result = operation(store);
        request.onsuccess?.();
      } catch (error) {
        request.error = error instanceof DOMException ? error : new DOMException(String(error), 'UnknownError');
        request.onerror?.();
        this.abort(request.error);
      }
    });
    this.pump();
  }

  private pump(): void {
    if (!this.started || this.processing || this.finished) return;
    this.processing = true;
    while (this.operationIndex < this.operations.length && !this.finished) {
      const operation = this.operations[this.operationIndex++];
      operation();
    }
    this.processing = false;
    if (!this.finished && this.operationIndex === this.operations.length) {
      queueMicrotask(() => {
        if (!this.finished && this.operationIndex === this.operations.length) this.commit();
      });
    }
  }

  private checkQuota(): void {
    if (this.mode !== 'readwrite') return;
    const bytes = [...this.staged.values()].reduce((sum, store) => {
      return sum + [...store.records.entries()].reduce((recordBytes, [key, value]) => {
        return recordBytes + JSON.stringify([key, value]).length * 2;
      }, 0);
    }, 0);
    if (bytes > this.database.quotaBytes) {
      throw new DOMException('The simulated IndexedDB quota was exceeded.', 'QuotaExceededError');
    }
  }

  commit(): void {
    if (this.finished) return;
    if (this.mode === 'readwrite') this.database.stores = this.staged;
    this.finished = true;
    this.oncomplete?.();
    this.releaseQueue?.();
  }

  abort(error = new DOMException('The transaction was aborted.', 'AbortError')): void {
    if (this.finished) return;
    this.error = error;
    this.finished = true;
    this.onerror?.();
    this.onabort?.();
    this.releaseQueue?.();
  }

  getMode(): IDBTransactionMode {
    return this.mode;
  }

  checkWriteQuota(): void {
    this.checkQuota();
  }
}

class FakeObjectStore {
  constructor(private readonly transaction: FakeTransaction, private readonly name: string) {}

  put(value: Record<string, unknown>): IDBRequest {
    const request: RequestLike = { result: undefined, error: null, onsuccess: null, onerror: null };
    this.transaction.enqueue(request, (store) => {
      if (this.transaction.getMode() !== 'readwrite') throw new DOMException('Read-only transaction.', 'ReadOnlyError');
      const key = value[store.keyPath] as IDBValidKey;
      if (key === undefined || key === null) throw new DOMException('Missing key path.', 'DataError');
      store.records.set(key, structuredClone(value));
      this.transaction.checkWriteQuota();
      return key;
    }, this.name);
    return request as unknown as IDBRequest;
  }

  get(key: IDBValidKey): IDBRequest {
    const request: RequestLike = { result: undefined, error: null, onsuccess: null, onerror: null };
    this.transaction.enqueue(request, (store) => {
      const value = store.records.get(key);
      return value === undefined ? undefined : structuredClone(value);
    }, this.name);
    return request as unknown as IDBRequest;
  }

  getAllKeys(): IDBRequest {
    const request: RequestLike = { result: undefined, error: null, onsuccess: null, onerror: null };
    this.transaction.enqueue(request, (store) => [...store.records.keys()], this.name);
    return request as unknown as IDBRequest;
  }

  delete(key: IDBValidKey): IDBRequest {
    const request: RequestLike = { result: undefined, error: null, onsuccess: null, onerror: null };
    this.transaction.enqueue(request, (store) => {
      if (this.transaction.getMode() !== 'readwrite') throw new DOMException('Read-only transaction.', 'ReadOnlyError');
      store.records.delete(key);
      this.transaction.checkWriteQuota();
      return undefined;
    }, this.name);
    return request as unknown as IDBRequest;
  }

  clear(): IDBRequest {
    const request: RequestLike = { result: undefined, error: null, onsuccess: null, onerror: null };
    this.transaction.enqueue(request, (store) => {
      if (this.transaction.getMode() !== 'readwrite') throw new DOMException('Read-only transaction.', 'ReadOnlyError');
      store.records.clear();
      this.transaction.checkWriteQuota();
      return undefined;
    }, this.name);
    return request as unknown as IDBRequest;
  }
}

class FakeDatabase {
  stores = new Map<string, StoreState>();
  transactionQueue: Promise<void> = Promise.resolve();
  quotaBytes = Number.POSITIVE_INFINITY;
  readonly objectStoreNames = {
    contains: (name: string) => this.stores.has(name),
  };

  createObjectStore(name: string, options: { keyPath: string }): IDBObjectStore {
    this.stores.set(name, { keyPath: options.keyPath, records: new Map() });
    return {} as IDBObjectStore;
  }

  transaction(storeNames: string | string[], mode: IDBTransactionMode): IDBTransaction {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    return new FakeTransaction(this, names, mode) as unknown as IDBTransaction;
  }

  close(): void {}
}

class FakeIndexedDB {
  private databases = new Map<string, FakeDatabase>();
  quotaBytes = Number.POSITIVE_INFINITY;

  open(name: string, version: number): IDBOpenDBRequest {
    const request = {
      result: null as unknown as IDBDatabase,
      error: null as DOMException | null,
      onupgradeneeded: null as (() => void) | null,
      onsuccess: null as (() => void) | null,
      onerror: null as (() => void) | null,
      onblocked: null as (() => void) | null,
    };
    queueMicrotask(() => {
      let database = this.databases.get(name);
      if (!database) {
        database = new FakeDatabase();
        database.quotaBytes = this.quotaBytes;
        this.databases.set(name, database);
        request.result = database as unknown as IDBDatabase;
        request.onupgradeneeded?.();
      } else {
        database.quotaBytes = this.quotaBytes;
        request.result = database as unknown as IDBDatabase;
      }
      request.onsuccess?.();
    });
    return request as unknown as IDBOpenDBRequest;
  }

  setQuota(bytes: number): void {
    this.quotaBytes = bytes;
    for (const database of this.databases.values()) database.quotaBytes = bytes;
  }
}

const fakeIndexedDB = new FakeIndexedDB();
Object.defineProperty(globalThis, 'indexedDB', {
  configurable: true,
  value: fakeIndexedDB as unknown as IDBFactory,
});

function makeSnapshot(downloadedAt: string): OfflineDirectorySnapshot {
  return {
    schema_version: OFFLINE_DIRECTORY_SCHEMA_VERSION,
    downloaded_at: downloadedAt,
    businesses: [],
    categories: [],
    areas: [],
    emergency_contacts: [],
  };
}

test('IndexedDB storage saves and reads a verified active snapshot', async () => {
  fakeIndexedDB.setQuota(Number.POSITIVE_INFINITY);
  await clearOfflineDirectorySnapshot();
  const snapshot = makeSnapshot('2026-11-17T12:00:00.000Z');

  const metadata = await saveOfflineDirectorySnapshot(snapshot);
  const active = await getActiveOfflineDirectorySnapshot();

  assert.equal(metadata.schema_version, OFFLINE_DIRECTORY_SCHEMA_VERSION);
  assert.equal(metadata.counts.businesses, 0);
  assert.equal(active?.downloaded_at, snapshot.downloaded_at);
  assert.deepEqual(await getOfflineDirectoryMetadata(), metadata);
});

test('an invalid replacement package cannot replace the previous active snapshot', async () => {
  const previous = makeSnapshot('2026-11-17T12:10:00.000Z');
  await saveOfflineDirectorySnapshot(previous);

  const invalid = makeSnapshot('2026-11-17T12:11:00.000Z');
  invalid.schema_version += 1;

  await assert.rejects(saveOfflineDirectorySnapshot(invalid), /failed validation/);
  assert.equal((await getActiveOfflineDirectorySnapshot())?.downloaded_at, previous.downloaded_at);
});

test('a simulated quota abort preserves the previously committed snapshot', async () => {
  fakeIndexedDB.setQuota(Number.POSITIVE_INFINITY);
  const previous = makeSnapshot('2026-11-17T12:20:00.000Z');
  await saveOfflineDirectorySnapshot(previous);

  fakeIndexedDB.setQuota(1);
  const replacement = makeSnapshot('2026-11-17T12:21:00.000Z');
  await assert.rejects(saveOfflineDirectorySnapshot(replacement), /quota was exceeded/i);

  fakeIndexedDB.setQuota(Number.POSITIVE_INFINITY);
  assert.equal((await getActiveOfflineDirectorySnapshot())?.downloaded_at, previous.downloaded_at);
});

test('concurrent snapshot saves leave one complete active generation and matching metadata', async () => {
  fakeIndexedDB.setQuota(Number.POSITIVE_INFINITY);
  const first = makeSnapshot('2026-11-17T12:30:00.000Z');
  const second = makeSnapshot('2026-11-17T12:31:00.000Z');

  await Promise.all([
    saveOfflineDirectorySnapshot(first),
    saveOfflineDirectorySnapshot(second),
  ]);

  const active = await getActiveOfflineDirectorySnapshot();
  const metadata = await getOfflineDirectoryMetadata();

  assert.ok(active?.downloaded_at === first.downloaded_at || active?.downloaded_at === second.downloaded_at);
  assert.equal(metadata?.downloaded_at, active?.downloaded_at);
});
