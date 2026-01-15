/**
 * Jest Setup File
 *
 * E2Eテスト用のセットアップファイル
 * uuidパッケージをモックする
 */

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substring(7)),
}));

