# シーケンス図

## 概要

ユーザー認証機能の処理フローを定義します。

## ログイン処理フロー

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Controller as AuthController
    participant UseCase as LoginUseCase
    participant UserRepo as UserRepository
    participant PasswordSvc as PasswordService
    participant JwtSvc as JwtService

    Client->>Controller: POST /api/v1/auth/login<br/>{email, password}
    
    Controller->>Controller: バリデーション<br/>(LoginRequestDto)
    
    alt バリデーションエラー
        Controller-->>Client: 400 Bad Request<br/>{errors}
    else バリデーション成功
        Controller->>UseCase: execute(email, password)
        
        UseCase->>UserRepo: findByEmail(email)
        UserRepo-->>UseCase: User | null
        
        alt ユーザーが見つからない
            UseCase-->>Controller: AuthenticationError
            Controller-->>Client: 401 Unauthorized<br/>{message: "Invalid credentials"}
        else ユーザーが見つかった
            UseCase->>PasswordSvc: compare(password, user.hashedPassword)
            PasswordSvc-->>UseCase: boolean
            
            alt パスワード不一致
                UseCase-->>Controller: AuthenticationError
                Controller-->>Client: 401 Unauthorized<br/>{message: "Invalid credentials"}
            else パスワード一致
                UseCase->>JwtSvc: generateToken({userId, email})
                JwtSvc-->>UseCase: accessToken
                
                UseCase-->>Controller: LoginResult<br/>{accessToken, tokenType, expiresIn}
                
                Controller->>Controller: LoginResponseDtoに変換
                Controller-->>Client: 200 OK<br/>{accessToken, tokenType, expiresIn}
            end
        end
    end
```

## 処理ステップ詳細

### 1. リクエスト受信
- クライアントが`POST /api/v1/auth/login`にリクエストを送信
- リクエストボディに`email`と`password`を含む

### 2. バリデーション
- `LoginRequestDto`でリクエストをバリデーション
- `email`: 必須、メールアドレス形式
- `password`: 必須、最小長8文字

### 3. ユーザー検索
- `UserRepository.findByEmail()`でユーザーを検索
- ユーザーが見つからない場合は認証エラー

### 4. パスワード検証
- `PasswordService.compare()`でパスワードを検証
- bcryptを使用してハッシュ化されたパスワードと比較
- 不一致の場合は認証エラー

### 5. JWTトークン生成
- `JwtService.generateToken()`でJWTトークンを生成
- ペイロードに`userId`と`email`を含む
- 有効期限を設定（例: 24時間）

### 6. レスポンス返却
- `LoginResponseDto`に変換して返却
- ステータスコード: 200 OK
- レスポンスボディに`accessToken`、`tokenType`、`expiresIn`を含む

## エラーハンドリング

### バリデーションエラー
- **ステータスコード**: 400 Bad Request
- **レスポンス**: バリデーションエラーの詳細

### 認証エラー
- **ステータスコード**: 401 Unauthorized
- **レスポンス**: `{message: "Invalid credentials"}`
- **セキュリティ**: ユーザーが存在するかどうかを明示しない

### サーバーエラー
- **ステータスコード**: 500 Internal Server Error
- **レスポンス**: エラーメッセージ（本番環境では詳細を隠す）


