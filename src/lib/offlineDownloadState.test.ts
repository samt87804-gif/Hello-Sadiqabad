import assert from 'node:assert/strict';
import test from 'node:test';
import {
  beginOfflineDownload,
  cancelOfflineDownload,
  finishOfflineDownload,
  getOfflineDownloadController,
  getOfflineDownloadState,
  publishOfflineDownloadState,
} from './offlineDownloadState';

test('download state and controller are app-scoped until explicitly finished', () => {
  const controller = beginOfflineDownload();
  assert.ok(controller);
  assert.equal(getOfflineDownloadController(), controller);
  publishOfflineDownloadState({ progress: 42, message: 'Downloading public data' });
  assert.equal(getOfflineDownloadState().progress, 42);
  assert.equal(getOfflineDownloadState().message, 'Downloading public data');
  cancelOfflineDownload();
  assert.equal(controller.signal.aborted, true);
  finishOfflineDownload();
  assert.equal(getOfflineDownloadController(), null);
});
