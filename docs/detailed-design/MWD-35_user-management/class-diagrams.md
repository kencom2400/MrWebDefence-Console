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
        +updateRole(role: UserRole): User
    }
    
    enum UserRole {
        SERVICE_ADMIN
        SERVICE_MEMBER
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

#### UserRole Enum
ユーザーロールを表す列挙型。

- `SERVICE_ADMIN`: サービス管理者
- `SERVICE_MEMBER`: サービスメンバー

#### IUserRepository
ユーザーリポジトリのインターフェース。ドメイン層とインフラストラクチャ層を分離します。

### Infrastructure Layer

#### UserRepository
ユーザーリポジトリの実装。現段階ではインメモリ実装ですが、将来的にはデータベースに接続します。

#### PasswordService
パスワードのハッシュ化と検証を行うサービス（既存）。

