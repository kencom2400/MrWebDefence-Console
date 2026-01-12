# シーケンス図 (Sequence Diagrams)

## ダッシュボードデータ取得フロー

```mermaid
sequenceDiagram
    participant Client
    participant DashboardController
    participant GetDashboardDataUseCase
    participant IUserRepository
    participant IMfaRepository
    participant IIpAllowListRepository
    participant DashboardData

    Client->>DashboardController: GET /api/v1/dashboard
    DashboardController->>GetDashboardDataUseCase: execute(userId)
    
    par 並列実行（Promise.all）
        GetDashboardDataUseCase->>IUserRepository: findById(userId)
        IUserRepository-->>GetDashboardDataUseCase: user
    and
        GetDashboardDataUseCase->>IMfaRepository: getSecret(userId)
        IMfaRepository-->>GetDashboardDataUseCase: secret | null
    and
        GetDashboardDataUseCase->>IIpAllowListRepository: countByUserId(userId)
        IIpAllowListRepository-->>GetDashboardDataUseCase: count
    end
    
    alt User not found
        GetDashboardDataUseCase-->>DashboardController: NotFoundException
        DashboardController-->>Client: 404 Not Found
    else User found
        Note over GetDashboardDataUseCase: データ集計ロジック（Use Case内で実行）\n初期実装では lastLoginAt と loginAttemptCount は null
        GetDashboardDataUseCase->>GetDashboardDataUseCase: aggregateData(user, mfaSecret, ipAllowListCount)
        GetDashboardDataUseCase->>DashboardData: create(userId, email, role, mfaEnabled, ipAllowListCount, accountCreatedAt, null, null)
        DashboardData-->>GetDashboardDataUseCase: DashboardData
        
        GetDashboardDataUseCase-->>DashboardController: DashboardData
        DashboardController-->>Client: 200 OK { userId, email, role, mfaEnabled, ipAllowListCount, accountCreatedAt, lastLoginAt: null, loginAttemptCount: null }
    end
```

