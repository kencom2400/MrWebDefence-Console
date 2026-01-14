# クラス図 (Class Diagrams)

## ユーザー管理関連クラス

```mermaid
classDiagram
    %% Presentation Layer
    class UserController {
        +create(createUserDto: CreateUserDto): Promise~UserResponseDto~
        +update(id: string, updateUserDto: UpdateUserDto): Promise~UserResponseDto~
        +delete(id: string): Promise~void~
        +findAll(query: UserListQueryDto): Promise~UserListResponseDto~
        +findOne(id: string): Promise~UserResponseDto~
        +changeRole(id: string, changeRoleDto: ChangeUserRoleDto): Promise~UserResponseDto~
    }
    
    class CreateUserDto {
        +string email
        +string password
        +UserRole role
    }
    
    class UpdateUserDto {
        +string? email
    }
    
    class UserResponseDto {
        +string id
        +string email
        +UserRole role
        +boolean mfaEnabled
        +Date createdAt
        +Date updatedAt
    }
    
    class UserListResponseDto {
        +UserResponseDto[] users
        +number total
        +number page
        +number limit
    }
    
    class UserListQueryDto {
        +string? email
        +UserRole? role
        +number? page
        +number? limit
    }
    
    class ChangeUserRoleDto {
        +UserRole role
    }
    
    %% Application Layer
    class CreateUserUseCase {
        -IUserRepository userRepository
        -PasswordService passwordService
        +execute(dto: CreateUserDto): Promise~User~
    }
    
    class UpdateUserUseCase {
        -IUserRepository userRepository
        +execute(id: string, dto: UpdateUserDto): Promise~User~
    }
    
    class DeleteUserUseCase {
        -IUserRepository userRepository
        +execute(id: string): Promise~void~
    }
    
    class GetUserListUseCase {
        -IUserRepository userRepository
        +execute(query: UserListQuery): Promise~UserListResult~
    }
    
    class GetUserByIdUseCase {
        -IUserRepository userRepository
        +execute(id: string): Promise~User | null~
    }
    
    class ChangeUserRoleUseCase {
        -IUserRepository userRepository
        +execute(id: string, role: UserRole): Promise~User~
    }
    
    %% Domain Layer
    class User {
        +string id
        +string email
        +string hashedPassword
        +UserRole role
        +boolean mfaEnabled
        +string | null mfaSecret
        +Date createdAt
        +Date updatedAt
        +create(id, email, hashedPassword, role?): User
        +reconstruct(id, email, hashedPassword, role, mfaEnabled, mfaSecret, createdAt, updatedAt): User
        +updatePassword(newHashedPassword: string): User
        +enableMfa(secret: string): User
        +disableMfa(): User
        +updateEmail(email: string): User
        +updateRole(role: UserRole): User
    }
    
    enum UserRole {
        SERVICE_ADMIN
        SERVICE_MEMBER
    }
    
    class UserListQuery {
        <<Value Object>>
        +string? email
        +UserRole? role
        +number page
        +number limit
    }
    
    class UserListResult {
        <<Value Object>>
        +User[] users
        +number total
        +number page
        +number limit
    }
    
    class IUserRepository {
        <<interface>>
        +create(user: User): Promise~User~
        +update(user: User): Promise~User~
        +delete(id: string): Promise~void~
        +findById(id: string): Promise~User | null~
        +findByEmail(email: string): Promise~User | null~
        +findAll(query: UserListQuery): Promise~UserListResult~
    }
    
    %% Infrastructure Layer
    class UserRepository {
        +create(user: User): Promise~User~
        +update(user: User): Promise~User~
        +delete(id: string): Promise~void~
        +findById(id: string): Promise~User | null~
        +findByEmail(email: string): Promise~User | null~
        +findAll(query: UserListQuery): Promise~UserListResult~
    }
    
    class PasswordService {
        +hash(password: string): Promise~string~
        +compare(password: string, hash: string): Promise~boolean~
    }
    
    %% Relationships
    UserController --> CreateUserUseCase : uses
    UserController --> UpdateUserUseCase : uses
    UserController --> DeleteUserUseCase : uses
    UserController --> GetUserListUseCase : uses
    UserController --> GetUserByIdUseCase : uses
    UserController --> ChangeUserRoleUseCase : uses
    UserController --> CreateUserDto : receives
    UserController --> UpdateUserDto : receives
    UserController --> UserListQueryDto : receives
    UserController --> ChangeUserRoleDto : receives
    UserController --> UserResponseDto : returns
    UserController --> UserListResponseDto : returns
    
    CreateUserUseCase --> IUserRepository : depends on
    CreateUserUseCase --> PasswordService : depends on
    UpdateUserUseCase --> IUserRepository : depends on
    DeleteUserUseCase --> IUserRepository : depends on
    GetUserListUseCase --> IUserRepository : depends on
    GetUserByIdUseCase --> IUserRepository : depends on
    ChangeUserRoleUseCase --> IUserRepository : depends on
    
    GetUserListUseCase --> UserListQuery : uses
    GetUserListUseCase --> UserListResult : returns
    IUserRepository --> UserListQuery : uses
    IUserRepository --> UserListResult : returns
    
    UserRepository ..|> IUserRepository : implements
    
    CreateUserUseCase --> User : creates
    UpdateUserUseCase --> User : updates
    ChangeUserRoleUseCase --> User : updates
    GetUserListUseCase --> User : returns
    GetUserByIdUseCase --> User : returns
    
    User --> UserRole : uses
```

## クラス説明

### Presentation Layer

#### UserController
ユーザー管理に関するHTTPエンドポイントを提供するコントローラー。

- `create`: 新規ユーザーを作成
- `update`: 既存ユーザーを更新（メールアドレスのみ）
- `delete`: ユーザーを削除
- `findAll`: ユーザー一覧を取得・検索（ページネーション対応）
- `findOne`: ユーザー詳細を取得
- `changeRole`: ユーザーのロールを変更

#### DTOs
- **CreateUserDto**: ユーザー作成時のリクエストDTO
- **UpdateUserDto**: ユーザー更新時のリクエストDTO
- **UserResponseDto**: ユーザー情報のレスポンスDTO（パスワードは含めない）
- **UserListResponseDto**: ユーザー一覧のレスポンスDTO（ページネーション情報含む）
- **UserListQueryDto**: ユーザー一覧取得・検索時のクエリDTO（検索パラメータ含む）
- **ChangeUserRoleDto**: ロール変更時のリクエストDTO

### Application Layer

#### Use Cases
各ユースケースは単一責任の原則に従い、特定の操作を担当します。

- **CreateUserUseCase**: ユーザー作成処理（パスワードハッシュ化を含む）
- **UpdateUserUseCase**: ユーザー更新処理
- **DeleteUserUseCase**: ユーザー削除処理
- **GetUserListUseCase**: ユーザー一覧取得・検索処理（検索クエリパラメータ対応）
- **GetUserByIdUseCase**: ユーザー詳細取得処理
- **ChangeUserRoleUseCase**: ユーザーロール変更処理

### Domain Layer

#### User Entity
ユーザーエンティティ。ユーザーの基本情報とロールを保持します。

- `id`: ユーザーID（UUID）
- `email`: メールアドレス
- `hashedPassword`: ハッシュ化されたパスワード
- `role`: ロール（SERVICE_ADMIN または SERVICE_MEMBER）
- `mfaEnabled`: MFA有効化フラグ
- `mfaSecret`: MFAシークレット（オプション）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

**注意**: 既存のUser Entityには`updatePassword`、`enableMfa`、`disableMfa`メソッドが実装されていますが、`updateEmail`と`updateRole`メソッドは実装されていません。実装時にこれらのメソッドを追加する必要があります。

#### UserRole Enum
ユーザーロールを表す列挙型。

- `SERVICE_ADMIN`: サービス管理者
- `SERVICE_MEMBER`: サービスメンバー

#### IUserRepository
ユーザーリポジトリのインターフェース。ドメイン層とインフラストラクチャ層を分離します。

**既存インターフェースからの変更点**:
- `save(user: User): Promise<void>` は、より責務が明確な `create(user: User): Promise<User>` と `update(user: User): Promise<User>` に置き換えられます
- `create`と`update`は、保存されたエンティティを返すため、戻り値が`Promise<User>`に変更されます
- `delete(id: string): Promise<void>` と `findAll(query: UserListQuery): Promise<UserListResult>` が追加されます
- 既存の`save`メソッドは非推奨となり、将来的に削除される予定です

この変更により、`ICustomerRepository`との一貫性が保たれ、責務がより明確になります。

### Infrastructure Layer

#### UserListQuery
ユーザー一覧取得・検索のクエリパラメータを表すValue Object。

- `email`: メールアドレス（部分一致検索、オプション）
- `role`: ユーザーロール（オプション）
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 10）

#### UserListResult
ユーザー一覧取得・検索の結果を表すValue Object。

- `users`: ユーザー配列
- `total`: 総件数
- `page`: 現在のページ番号
- `limit`: 1ページあたりの件数

#### UserRepository
ユーザーリポジトリの実装。現段階ではインメモリ実装ですが、将来的にはデータベースに接続します。

#### PasswordService
パスワードのハッシュ化と検証を行うサービス（既存）。

