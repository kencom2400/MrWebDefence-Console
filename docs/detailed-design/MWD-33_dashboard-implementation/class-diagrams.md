# クラス図 (Class Diagrams)

## ダッシュボード関連クラス

```mermaid
classDiagram
    class User {
        +string id
        +string email
        +string hashedPassword
        +UserRole role
        +boolean mfaEnabled
        +string mfaSecret
        +Date createdAt
        +Date updatedAt
        +create(id, email, hashedPassword, role)
        +reconstruct(id, email, hashedPassword, role, mfaEnabled, mfaSecret, createdAt, updatedAt)
    }

    class DashboardData {
        <<ValueObject>>
        +string userId
        +string email
        +UserRole role
        +boolean mfaEnabled
        +number ipAllowListCount
        +Date accountCreatedAt
        +Date? lastLoginAt
        +number? loginAttemptCount
        +create(userId, email, role, mfaEnabled, ipAllowListCount, accountCreatedAt, lastLoginAt?, loginAttemptCount?): DashboardData
    }
    
    note for DashboardData "初期実装では lastLoginAt と loginAttemptCount は null\nipAllowListCount は 0（IP AllowList機能未実装時）"

    class GetDashboardDataUseCase {
        -IUserRepository userRepository
        -IIpAllowListRepository ipAllowListRepository
        +execute(userId): Promise~DashboardData~
        -aggregateData(user, ipAllowListCount): DashboardData
    }
    
    note for GetDashboardDataUseCase "MFA状態はUser.mfaEnabledから直接取得\nIIpAllowListRepositoryは初期実装ではスタブ（0を返す）"

    class DashboardController {
        +getDashboard()
    }

    class DashboardDto {
        +string userId
        +string email
        +string role
        +boolean mfaEnabled
        +number ipAllowListCount
        +string accountCreatedAt
        +string? lastLoginAt
        +number? loginAttemptCount
    }

    class IUserRepository {
        <<Interface>>
        +findById(id): Promise~User | null~
    }

    class IIpAllowListRepository {
        <<Interface>>
        +countByUserId(userId): Promise~number~
    }

    User --> DashboardData : used to create
    GetDashboardDataUseCase --> IUserRepository
    GetDashboardDataUseCase --> IIpAllowListRepository
    GetDashboardDataUseCase --> DashboardData : creates
    DashboardController --> GetDashboardDataUseCase
    DashboardController --> DashboardDto : returns
```

## 依存関係

```mermaid
classDiagram
    class DashboardController {
    }

    class AppModule {
        +providers
    }

    class GetDashboardDataUseCase {
    }

    class IUserRepository {
        <<Interface>>
    }

    class IIpAllowListRepository {
        <<Interface>>
    }

    AppModule --> DashboardController
    DashboardController --> GetDashboardDataUseCase
    GetDashboardDataUseCase --> IUserRepository
    GetDashboardDataUseCase --> IIpAllowListRepository
```

**注意**: `GetDashboardDataUseCase`は既存のRepositoryインターフェースに依存します。依存性逆転の原則に従い、具象クラスではなくインターフェースに依存します。


## ダッシュボード関連クラス

```mermaid
classDiagram
    class User {
        +string id
        +string email
        +string hashedPassword
        +UserRole role
        +boolean mfaEnabled
        +string mfaSecret
        +Date createdAt
        +Date updatedAt
        +create(id, email, hashedPassword, role)
        +reconstruct(id, email, hashedPassword, role, mfaEnabled, mfaSecret, createdAt, updatedAt)
    }

    class DashboardData {
        <<ValueObject>>
        +string userId
        +string email
        +UserRole role
        +boolean mfaEnabled
        +number ipAllowListCount
        +Date accountCreatedAt
        +Date? lastLoginAt
        +number? loginAttemptCount
        +create(userId, email, role, mfaEnabled, ipAllowListCount, accountCreatedAt, lastLoginAt?, loginAttemptCount?): DashboardData
    }
    
    note for DashboardData "初期実装では lastLoginAt と loginAttemptCount は null\nipAllowListCount は 0（IP AllowList機能未実装時）"

    class GetDashboardDataUseCase {
        -IUserRepository userRepository
        -IIpAllowListRepository ipAllowListRepository
        +execute(userId): Promise~DashboardData~
        -aggregateData(user, ipAllowListCount): DashboardData
    }
    
    note for GetDashboardDataUseCase "MFA状態はUser.mfaEnabledから直接取得\nIIpAllowListRepositoryは初期実装ではスタブ（0を返す）"

    class DashboardController {
        +getDashboard()
    }

    class DashboardDto {
        +string userId
        +string email
        +string role
        +boolean mfaEnabled
        +number ipAllowListCount
        +string accountCreatedAt
        +string? lastLoginAt
        +number? loginAttemptCount
    }

    class IUserRepository {
        <<Interface>>
        +findById(id): Promise~User | null~
    }

    class IIpAllowListRepository {
        <<Interface>>
        +countByUserId(userId): Promise~number~
    }

    User --> DashboardData : used to create
    GetDashboardDataUseCase --> IUserRepository
    GetDashboardDataUseCase --> IIpAllowListRepository
    GetDashboardDataUseCase --> DashboardData : creates
    DashboardController --> GetDashboardDataUseCase
    DashboardController --> DashboardDto : returns
```

## 依存関係

```mermaid
classDiagram
    class DashboardController {
    }

    class AppModule {
        +providers
    }

    class GetDashboardDataUseCase {
    }

    class IUserRepository {
        <<Interface>>
    }

    class IIpAllowListRepository {
        <<Interface>>
    }

    AppModule --> DashboardController
    DashboardController --> GetDashboardDataUseCase
    GetDashboardDataUseCase --> IUserRepository
    GetDashboardDataUseCase --> IIpAllowListRepository
```

**注意**: `GetDashboardDataUseCase`は既存のRepositoryインターフェースに依存します。依存性逆転の原則に従い、具象クラスではなくインターフェースに依存します。


## ダッシュボード関連クラス

```mermaid
classDiagram
    class User {
        +string id
        +string email
        +string hashedPassword
        +UserRole role
        +boolean mfaEnabled
        +string mfaSecret
        +Date createdAt
        +Date updatedAt
        +create(id, email, hashedPassword, role)
        +reconstruct(id, email, hashedPassword, role, mfaEnabled, mfaSecret, createdAt, updatedAt)
    }

    class DashboardData {
        <<ValueObject>>
        +string userId
        +string email
        +UserRole role
        +boolean mfaEnabled
        +number ipAllowListCount
        +Date accountCreatedAt
        +Date? lastLoginAt
        +number? loginAttemptCount
        +create(userId, email, role, mfaEnabled, ipAllowListCount, accountCreatedAt, lastLoginAt?, loginAttemptCount?): DashboardData
    }
    
    note for DashboardData "初期実装では lastLoginAt と loginAttemptCount は null\nipAllowListCount は 0（IP AllowList機能未実装時）"

    class GetDashboardDataUseCase {
        -IUserRepository userRepository
        -IIpAllowListRepository ipAllowListRepository
        +execute(userId): Promise~DashboardData~
        -aggregateData(user, ipAllowListCount): DashboardData
    }
    
    note for GetDashboardDataUseCase "MFA状態はUser.mfaEnabledから直接取得\nIIpAllowListRepositoryは初期実装ではスタブ（0を返す）"

    class DashboardController {
        +getDashboard()
    }

    class DashboardDto {
        +string userId
        +string email
        +string role
        +boolean mfaEnabled
        +number ipAllowListCount
        +string accountCreatedAt
        +string? lastLoginAt
        +number? loginAttemptCount
    }

    class IUserRepository {
        <<Interface>>
        +findById(id): Promise~User | null~
    }

    class IIpAllowListRepository {
        <<Interface>>
        +countByUserId(userId): Promise~number~
    }

    User --> DashboardData : used to create
    GetDashboardDataUseCase --> IUserRepository
    GetDashboardDataUseCase --> IIpAllowListRepository
    GetDashboardDataUseCase --> DashboardData : creates
    DashboardController --> GetDashboardDataUseCase
    DashboardController --> DashboardDto : returns
```

## 依存関係

```mermaid
classDiagram
    class DashboardController {
    }

    class AppModule {
        +providers
    }

    class GetDashboardDataUseCase {
    }

    class IUserRepository {
        <<Interface>>
    }

    class IIpAllowListRepository {
        <<Interface>>
    }

    AppModule --> DashboardController
    DashboardController --> GetDashboardDataUseCase
    GetDashboardDataUseCase --> IUserRepository
    GetDashboardDataUseCase --> IIpAllowListRepository
```

**注意**: `GetDashboardDataUseCase`は既存のRepositoryインターフェースに依存します。依存性逆転の原則に従い、具象クラスではなくインターフェースに依存します。

