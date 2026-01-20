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

    // FQDNの等価性チェック（順序不問）
    const thisFqdnIds = this.fqdns.map((f) => f.id).sort();
    const otherFqdnIds = other.fqdns.map((f) => f.id).sort();
    if (JSON.stringify(thisFqdnIds) !== JSON.stringify(otherFqdnIds)) {
      return false;
    }

    // IP AllowListの等価性チェック（順序不問）
    const thisIpAllowListIds = this.ipAllowLists.map((i) => i.id).sort();
    const otherIpAllowListIds = other.ipAllowLists.map((i) => i.id).sort();
    if (JSON.stringify(thisIpAllowListIds) !== JSON.stringify(otherIpAllowListIds)) {
      return false;
    }

    // Customerの等価性チェック（順序不問）
    const thisCustomerIds = this.customers.map((c) => c.id).sort();
    const otherCustomerIds = other.customers.map((c) => c.id).sort();
    if (JSON.stringify(thisCustomerIds) !== JSON.stringify(otherCustomerIds)) {
      return false;
    }

    return this.lastUpdated.getTime() === other.lastUpdated.getTime();
  }
}
