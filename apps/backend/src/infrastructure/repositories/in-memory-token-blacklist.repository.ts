import { ITokenBlacklistRepository } from '../../domain/repositories/token-blacklist.repository.interface';

export class InMemoryTokenBlacklistRepository implements ITokenBlacklistRepository {
  private blacklist: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 1時間ごとに期限切れトークンをクリーンアップ（簡易実装）
    // 本番環境ではRedisのTTL機能などを使用すべき
    this.cleanupInterval = setInterval(() => {
      // メモリ上のSetなので、expiresAtを保存していないとクリーンアップが難しい
      // ここでは簡易的に、Setのサイズが大きくなりすぎたらクリアする等の対策が必要だが、
      // 厳密な実装にはトークンと有効期限のペアを保存する必要がある。
      // MVPとして今回はクリーンアップなし、または再起動でクリアされる前提とする。
    }, 3600000);
  }

  // クリーンアップ用メソッド（テスト用などで使用）
  public stopCleanup(): void {
    clearInterval(this.cleanupInterval);
  }

  public async add(token: string, expiresAt: number): Promise<void> {
    this.blacklist.add(token);
    // 期限付きで削除するロジックを入れるのが望ましい
    // setTimeout(() => this.blacklist.delete(token), (expiresAt * 1000) - Date.now());
    // ただし大量のタイマーは避けるべき。
  }

  public async isBlacklisted(token: string): Promise<boolean> {
    return this.blacklist.has(token);
  }
}
