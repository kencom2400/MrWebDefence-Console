# クラス図 (Class Diagrams)

## MFA関連クラス

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
        +enableMfa(secret)
        +disableMfa()
    }

    class MfaSecret {
        <<ValueObject>>
        +string value
        +validate()
        +encrypt()
    }

    class BackupCode {
        <<ValueObject>>
        +string code
        +string hash
        +boolean used
        +Date createdAt
        +generate()
        +hash()
        +verify(input)
    }

    class SetupMfaUseCase {
        -IUserRepository userRepository
        -TotpService totpService
        -QrCodeService qrCodeService
        -BackupCodeService backupCodeService
        +execute(userId): SetupMfaResult
    }

    class VerifyMfaUseCase {
        -IUserRepository userRepository
        -TotpService totpService
        -IMfaRepository mfaRepository
        +execute(userId, code, type): boolean
    }

    class DisableMfaUseCase {
        -IUserRepository userRepository
        -IMfaRepository mfaRepository
        +execute(userId): void
    }

    class TotpService {
        +generateSecret(): string
        +generateToken(secret): string
        +verifyToken(secret, token): boolean
    }

    class QrCodeService {
        +generateQrCode(secret, email, issuer): string
    }

    class BackupCodeService {
        +generateCodes(count): BackupCode[]
        +hashCode(code): string
        +verifyCode(code, hash): boolean
    }

    class MfaController {
        +setupMfa()
        +verifySetup()
        +verify()
        +disable()
        +getBackupCodes()
    }

    class AuthController {
        +login()
        +verifyMfa()
    }

    User --> MfaSecret : has
    User --> BackupCode : has many
    SetupMfaUseCase --> TotpService
    SetupMfaUseCase --> QrCodeService
    SetupMfaUseCase --> BackupCodeService
    VerifyMfaUseCase --> TotpService
    VerifyMfaUseCase --> IMfaRepository
    DisableMfaUseCase --> IMfaRepository
    MfaController --> SetupMfaUseCase
    MfaController --> VerifyMfaUseCase
    MfaController --> DisableMfaUseCase
    AuthController --> VerifyMfaUseCase
```

## リポジトリインターフェース

```mermaid
classDiagram
    class IMfaRepository {
        <<Interface>>
        +saveSecret(userId, secret): Promise~void~
        +getSecret(userId): Promise~string | null~
        +deleteSecret(userId): Promise~void~
        +saveBackupCodes(userId, codes): Promise~void~
        +getBackupCodes(userId): Promise~BackupCode[]~
        +markBackupCodeAsUsed(userId, codeHash): Promise~void~
    }

    class MfaRepository {
        +saveSecret(userId, secret): Promise~void~
        +getSecret(userId): Promise~string | null~
        +deleteSecret(userId): Promise~void~
        +saveBackupCodes(userId, codes): Promise~void~
        +getBackupCodes(userId): Promise~BackupCode[]~
        +markBackupCodeAsUsed(userId, codeHash): Promise~void~
    }

    IMfaRepository <|.. MfaRepository
```

## 依存関係

```mermaid
classDiagram
    class MfaController {
    }
    
    class AuthController {
    }

    class AppModule {
        +providers
    }

    class SetupMfaUseCase {
    }

    class VerifyMfaUseCase {
    }

    class LoginUseCase {
    }

    AppModule --> MfaController
    AppModule --> AuthController
    MfaController --> SetupMfaUseCase
    MfaController --> VerifyMfaUseCase
    AuthController --> LoginUseCase
    AuthController --> VerifyMfaUseCase
```

