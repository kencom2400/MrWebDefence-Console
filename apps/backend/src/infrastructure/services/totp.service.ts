/**
 * TotpService
 *
 * TOTP（Time-based One-Time Password）の生成・検証を行うサービス
 * Infrastructure層に位置し、外部ライブラリ（otplib）に依存する
 */

import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';

@Injectable()
export class TotpService {
  // TOTP設定（RFC 6238準拠）
  private readonly timeStep: number = 30; // 30秒
  private readonly digits: number = 6; // 6桁
  private readonly window: number = 1; // ±1ステップ（30秒前後を許容）

  constructor() {
    // otplibの設定
    authenticator.options = {
      step: this.timeStep,
      digits: this.digits,
      window: this.window,
    };
  }

  /**
   * TOTPコードを生成する
   * @param secret MFAシークレット（Base32形式）
   * @returns TOTPコード（6桁の数字）
   */
  public generate(secret: string): string {
    return authenticator.generate(secret);
  }

  /**
   * TOTPコードを検証する
   * @param secret MFAシークレット（Base32形式）
   * @param token TOTPコード（6桁の数字）
   * @returns 検証成功時true、失敗時false
   */
  public verify(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      return false;
    }
  }

  /**
   * MFAシークレットを生成する
   * @returns Base32エンコードされたシークレット
   */
  public generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * OTPAUTH URIを生成する
   * @param secret MFAシークレット
   * @param email ユーザーのメールアドレス
   * @param issuer 発行者名（例: "MrWebDefence"）
   * @returns OTPAUTH URI
   */
  public generateKeyUri(secret: string, email: string, issuer: string): string {
    return authenticator.keyuri(email, issuer, secret);
  }
}
 * TotpService
 *
 * TOTP（Time-based One-Time Password）の生成・検証を行うサービス
 * Infrastructure層に位置し、外部ライブラリ（otplib）に依存する
 */

import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';

@Injectable()
export class TotpService {
  // TOTP設定（RFC 6238準拠）
  private readonly timeStep: number = 30; // 30秒
  private readonly digits: number = 6; // 6桁
  private readonly window: number = 1; // ±1ステップ（30秒前後を許容）

  constructor() {
    // otplibの設定
    authenticator.options = {
      step: this.timeStep,
      digits: this.digits,
      window: this.window,
    };
  }

  /**
   * TOTPコードを生成する
   * @param secret MFAシークレット（Base32形式）
   * @returns TOTPコード（6桁の数字）
   */
  public generate(secret: string): string {
    return authenticator.generate(secret);
  }

  /**
   * TOTPコードを検証する
   * @param secret MFAシークレット（Base32形式）
   * @param token TOTPコード（6桁の数字）
   * @returns 検証成功時true、失敗時false
   */
  public verify(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      return false;
    }
  }

  /**
   * MFAシークレットを生成する
   * @returns Base32エンコードされたシークレット
   */
  public generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * OTPAUTH URIを生成する
   * @param secret MFAシークレット
   * @param email ユーザーのメールアドレス
   * @param issuer 発行者名（例: "MrWebDefence"）
   * @returns OTPAUTH URI
   */
  public generateKeyUri(secret: string, email: string, issuer: string): string {
    return authenticator.keyuri(email, issuer, secret);
  }
}
 * TotpService
 *
 * TOTP（Time-based One-Time Password）の生成・検証を行うサービス
 * Infrastructure層に位置し、外部ライブラリ（otplib）に依存する
 */

import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';

@Injectable()
export class TotpService {
  // TOTP設定（RFC 6238準拠）
  private readonly timeStep: number = 30; // 30秒
  private readonly digits: number = 6; // 6桁
  private readonly window: number = 1; // ±1ステップ（30秒前後を許容）

  constructor() {
    // otplibの設定
    authenticator.options = {
      step: this.timeStep,
      digits: this.digits,
      window: this.window,
    };
  }

  /**
   * TOTPコードを生成する
   * @param secret MFAシークレット（Base32形式）
   * @returns TOTPコード（6桁の数字）
   */
  public generate(secret: string): string {
    return authenticator.generate(secret);
  }

  /**
   * TOTPコードを検証する
   * @param secret MFAシークレット（Base32形式）
   * @param token TOTPコード（6桁の数字）
   * @returns 検証成功時true、失敗時false
   */
  public verify(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      return false;
    }
  }

  /**
   * MFAシークレットを生成する
   * @returns Base32エンコードされたシークレット
   */
  public generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * OTPAUTH URIを生成する
   * @param secret MFAシークレット
   * @param email ユーザーのメールアドレス
   * @param issuer 発行者名（例: "MrWebDefence"）
   * @returns OTPAUTH URI
   */
  public generateKeyUri(secret: string, email: string, issuer: string): string {
    return authenticator.keyuri(email, issuer, secret);
  }
}
