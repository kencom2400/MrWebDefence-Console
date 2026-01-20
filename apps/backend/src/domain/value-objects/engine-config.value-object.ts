/**
 * EngineConfig Value Object
 *
 * WAFエンジンに配信する設定情報を表す値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import { Fqdn } from '../entities/fqdn.entity';
import { IpAllowList } from '../entities/ip-allowlist.entity';
import { Customer } from '../entities/customer.entity';

export class EngineConfig {
  public readonly fqdns: readonly Fqdn[];
  public readonly ipAllowLists: readonly IpAllowList[];
  public readonly customers: readonly Customer[];
  public readonly lastUpdated: Date;

  private constructor(
    fqdns: readonly Fqdn[],
    ipAllowLists: readonly IpAllowList[],
    customers: readonly Customer[],
    lastUpdated: Date,
  ) {
    this.fqdns = fqdns;
    this.ipAllowLists = ipAllowLists;
    this.customers = customers;
    this.lastUpdated = lastUpdated;
  }

  /**
   * EngineConfig Value Objectを作成する
   * @param fqdns FQDNエンティティの配列
   * @param ipAllowLists IP AllowListエンティティの配列
   * @param customers 顧客エンティティの配列
   * @returns EngineConfig Value Object
   */
  public static create(
    fqdns: Fqdn[],
    ipAllowLists: IpAllowList[],
    customers: Customer[],
  ): EngineConfig {
    // 配列を読み取り専用に変換
    const readonlyFqdns = Object.freeze([...fqdns]);
    const readonlyIpAllowLists = Object.freeze([...ipAllowLists]);
    const readonlyCustomers = Object.freeze([...customers]);

    // lastUpdatedは現在時刻を使用
    const lastUpdated = new Date();

    return new EngineConfig(
      readonlyFqdns,
      readonlyIpAllowLists,
      readonlyCustomers,
      lastUpdated,
    );
  }

  /**
   * 等価性チェック
   * @param other 比較対象
   * @returns 等しい場合true
   */
  public equals(other: EngineConfig): boolean {
    if (this.fqdns.length !== other.fqdns.length) {
      return false;
    }
    if (this.ipAllowLists.length !== other.ipAllowLists.length) {
      return false;
    }
    if (this.customers.length !== other.customers.length) {
      return false;
    }

    // 各配列のIDを比較（順序不問）
    if (!this.compareIds(this.fqdns.map((f) => f.id), other.fqdns.map((f) => f.id))) {
      return false;
    }
    if (!this.compareIds(this.ipAllowLists.map((i) => i.id), other.ipAllowLists.map((i) => i.id))) {
      return false;
    }
    if (!this.compareIds(this.customers.map((c) => c.id), other.customers.map((c) => c.id))) {
      return false;
    }

    return this.lastUpdated.getTime() === other.lastUpdated.getTime();
  }

  /**
   * ID配列の等価性を比較する（順序不問）
   * @param ids1 比較対象のID配列1
   * @param ids2 比較対象のID配列2
   * @returns 等しい場合true
   */
  private compareIds(ids1: string[], ids2: string[]): boolean {
    const sortedIds1 = [...ids1].sort();
    const sortedIds2 = [...ids2].sort();
    return JSON.stringify(sortedIds1) === JSON.stringify(sortedIds2);
  }
}
