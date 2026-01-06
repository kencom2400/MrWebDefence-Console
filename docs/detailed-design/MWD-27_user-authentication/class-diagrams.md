# クラス構造図

## 概要

ユーザー認証機能のクラス構造を定義します。

## クラス図

```mermaid
classDiagram
    %% Presentation Layer
    class AuthController {
        +login(LoginRequestDto): Promise~LoginResponseDto~
    }
    
    class LoginRequestDto {
        +email: string
        +password: string
    }
    
    class LoginResponseDto {
        +accessToken: string
        +tokenType: string
        +expiresIn: number
    }
    
    %% Application Layer
    class LoginUseCase {
        -userRepository: IUserRepository
        -passwordService: PasswordService
        -jwtService: JwtService
        +execute(email: string, password: string): Promise~LoginResult~
    }
    
    %% Domain Layer
    class User {
        +id: string
        +email: string
        +hashedPassword: string
        +createdAt: Date
        +updatedAt: Date
    }
    
    class IUserRepository {
        <<interface>>
        +findByEmail(email: string): Promise~User | null~
        +save(user: User): Promise~User~
    }
    
    %% Infrastructure Layer
    class UserRepository {
        +findByEmail(email: string): Promise~User | null~
        +save(user: User): Promise~User~
    }
    
    class JwtService {
        +generateToken(payload: JwtPayload): string
        +verifyToken(token: string): JwtPayload | null
    }
    
    class PasswordService {
        +hash(password: string): Promise~string~
        +compare(password: string, hash: string): Promise~boolean~
    }
    
    %% Relationships
    AuthController --> LoginUseCase : uses
    AuthController --> LoginRequestDto : receives
    AuthController --> LoginResponseDto : returns
    
    LoginUseCase --> IUserRepository : depends on
    LoginUseCase --> PasswordService : depends on
    LoginUseCase --> JwtService : depends on
    
    UserRepository ..|> IUserRepository : implements
    
    AuthenticationService --> User : uses
    AuthenticationService --> JwtService : uses
```

## クラス説明

### Presentation Layer

#### AuthController
- **責務**: HTTPリクエストの受信とレスポンスの返却
- **メソッド**:
  - `login(LoginRequestDto)`: ログイン処理を実行

#### LoginRequestDto
- **責務**: ログインリクエストのデータ転送オブジェクト
- **プロパティ**:
  - `email: string`: ユーザーのメールアドレス
  - `password: string`: ユーザーのパスワード

#### LoginResponseDto
- **責務**: ログインレスポンスのデータ転送オブジェクト
- **プロパティ**:
  - `accessToken: string`: JWTアクセストークン
  - `tokenType: string`: トークンタイプ（"Bearer"）
  - `expiresIn: number`: トークンの有効期限（秒）

### Application Layer

#### LoginUseCase
- **責務**: ログイン処理のユースケース実装
- **依存関係**:
  - `IUserRepository`: ユーザー情報の取得
  - `PasswordService`: パスワードの検証
  - `JwtService`: JWTトークンの生成

#### AuthenticationService
- **責務**: 認証関連のビジネスロジック
- **メソッド**:
  - `validateCredentials()`: 認証情報の検証
  - `generateToken()`: JWTトークンの生成

### Domain Layer

#### User
- **責務**: ユーザーエンティティ
- **プロパティ**:
  - `id: string`: ユーザーID
  - `email: string`: メールアドレス
  - `hashedPassword: string`: ハッシュ化されたパスワード
  - `createdAt: Date`: 作成日時
  - `updatedAt: Date`: 更新日時

#### IUserRepository
- **責務**: ユーザーリポジトリのインターフェース定義
- **メソッド**:
  - `findByEmail()`: メールアドレスでユーザーを検索
  - `save()`: ユーザーを保存

### Infrastructure Layer

#### UserRepository
- **責務**: ユーザーリポジトリの実装
- **実装**: `IUserRepository`インターフェース

#### JwtService
- **責務**: JWTトークンの生成と検証
- **メソッド**:
  - `generateToken()`: JWTトークンを生成
  - `verifyToken()`: JWTトークンを検証

#### PasswordService
- **責務**: パスワードのハッシュ化と検証
- **メソッド**:
  - `hash()`: パスワードをハッシュ化
  - `compare()`: パスワードを検証


