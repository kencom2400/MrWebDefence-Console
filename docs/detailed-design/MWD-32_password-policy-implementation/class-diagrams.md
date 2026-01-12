# クラス図 (Class Diagrams)

## パスワードポリシー関連クラス

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
        +updatePassword(hashedPassword)
    }

    class PasswordPolicy {
        <<ValueObject>>
        +number minLength
        +number maxLength
        +boolean requireUppercase
        +boolean requireLowercase
        +boolean requireNumbers
        +boolean requireSymbols
        +number historyCount
        +validate(password): ValidationResult
    }

    class ValidationResult {
        +boolean isValid
        +string[] errors
    }

    class ChangePasswordUseCase {
        -IUserRepository userRepository
        -IPasswordHistoryRepository passwordHistoryRepository
        -PasswordService passwordService
        -PasswordPolicyService passwordPolicyService
        +execute(userId, currentPassword, newPassword): void
    }

    class ValidatePasswordPolicyUseCase {
        -IPasswordHistoryRepository passwordHistoryRepository
        -PasswordPolicyService passwordPolicyService
        -PasswordService passwordService
        +execute(userId, password): ValidatePasswordResult
    }

    class GetPasswordPolicyUseCase {
        -PasswordPolicyService passwordPolicyService
        +execute(): PasswordPolicyDto
    }

    class PasswordPolicyService {
        <<Infrastructure>>
        +createPasswordPolicy(): PasswordPolicy
        +calculateStrengthScore(password): number
    }

    class PasswordService {
        <<Infrastructure>>
        +hash(password): Promise~string~
        +compare(password, hash): Promise~boolean~
    }

    class PasswordController {
        +changePassword()
        +validatePassword()
        +getPasswordPolicy()
    }

    class ValidatePasswordResult {
        +boolean isValid
        +string[] errors
        +number strengthScore
        +boolean isReused
    }

    class PasswordPolicyDto {
        +number minLength
        +number maxLength
        +boolean requireUppercase
        +boolean requireLowercase
        +boolean requireNumbers
        +boolean requireSymbols
        +number historyCount
    }

    User --> PasswordPolicy : validates with
    ChangePasswordUseCase --> IUserRepository
    ChangePasswordUseCase --> IPasswordHistoryRepository
    ChangePasswordUseCase --> PasswordService
    ChangePasswordUseCase --> PasswordPolicy
    ChangePasswordUseCase --> PasswordPolicyService
    ValidatePasswordPolicyUseCase --> IPasswordHistoryRepository
    ValidatePasswordPolicyUseCase --> PasswordPolicy
    ValidatePasswordPolicyUseCase --> PasswordPolicyService
    ValidatePasswordPolicyUseCase --> PasswordService
    GetPasswordPolicyUseCase --> PasswordPolicyService
    PasswordController --> ChangePasswordUseCase
    PasswordController --> ValidatePasswordPolicyUseCase
    PasswordController --> GetPasswordPolicyUseCase
    PasswordPolicyService --> PasswordPolicy : creates
```

## リポジトリインターフェース

```mermaid
classDiagram
    class IPasswordHistoryRepository {
        <<Interface>>
        +savePasswordHistory(userId, passwordHash): Promise~void~
        +getPasswordHistory(userId, count): Promise~string[]~
        +checkPasswordInHistory(userId, passwordHash, count): Promise~boolean~
        +deleteOldHistory(userId, keepCount): Promise~void~
    }

    class PasswordHistoryRepository {
        +savePasswordHistory(userId, passwordHash): Promise~void~
        +getPasswordHistory(userId, count): Promise~string[]~
        +checkPasswordInHistory(userId, passwordHash, count): Promise~boolean~
        +deleteOldHistory(userId, keepCount): Promise~void~
    }

    IPasswordHistoryRepository <|.. PasswordHistoryRepository
```

## 依存関係

```mermaid
classDiagram
    class PasswordController {
    }

    class AppModule {
        +providers
    }

    class ChangePasswordUseCase {
    }

    class ValidatePasswordPolicyUseCase {
    }

    class GetPasswordPolicyUseCase {
    }

    class PasswordPolicyService {
    }

    class PasswordHistoryRepository {
    }

    AppModule --> PasswordController
    PasswordController --> ChangePasswordUseCase
    PasswordController --> ValidatePasswordPolicyUseCase
    PasswordController --> GetPasswordPolicyUseCase
    ChangePasswordUseCase --> PasswordPolicyService
    ChangePasswordUseCase --> PasswordHistoryRepository
    ValidatePasswordPolicyUseCase --> PasswordPolicyService
    ValidatePasswordPolicyUseCase --> PasswordHistoryRepository
```

