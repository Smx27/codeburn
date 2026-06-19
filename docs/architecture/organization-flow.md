# Organization Flow

## Organization Creation

Organizations are created automatically during user registration.

```mermaid
sequenceDiagram
    participant U as User
    participant DA as Dashboard API
    participant DB as PostgreSQL

    U->>DA: POST /api/v1/auth/register
    DA->>DB: INSERT INTO organizations (name)
    DA->>DB: INSERT INTO organization_settings
    DA->>DB: INSERT INTO users (role=owner)
    DA->>DB: INSERT INTO teams (name=General)
    DA->>DB: INSERT INTO team_members (role=admin)
```

The registering user becomes the `owner` of the organization.

---

## Member Invitation

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant DA as Dashboard API
    participant DB as PostgreSQL
    participant E as Email Service
    participant Invitee as Invited User

    Admin->>DA: POST /api/v1/invitations
    Note over Admin: { email, role }
    DA->>DB: Check for existing pending invitation
    alt No existing invitation
        DA->>DA: Generate random token (32 bytes)
        DA->>DB: INSERT INTO organization_invitations
        DA->>E: Send invitation email
        DA-->>Admin: { id, email, role, expires_at }
    else Existing pending invitation
        DA-->>Admin: null (already invited)
    end
```

Invitations expire after 7 days.

---

## Invitation Acceptance

```mermaid
sequenceDiagram
    participant Invitee as Invited User
    participant DW as Dashboard Web
    participant DA as Dashboard API
    participant DB as PostgreSQL

    Invitee->>DW: Click invitation link
    Note over DW: /login?invitation=<token>
    DW->>DA: POST /api/v1/invitations/accept
    Note over DW: Body: { token }
    DA->>DB: SELECT organization_invitations WHERE token
    DA->>DA: Check expiry (7 days)
    DA->>DA: Hash temporary password
    DA->>DB: INSERT INTO users (role from invitation)
    DA->>DB: INSERT INTO team_members (General team)
    DA->>DB: UPDATE organization_invitations SET accepted_at
    DA->>DA: Sign JWT
    DA-->>DW: { token, user }
```

---

## Roles

| Role | Description | Can Invite | Can Manage API Keys | Can Manage Teams | Can View Analytics |
|------|-------------|------------|---------------------|------------------|-------------------|
| `owner` | Full access | Yes | Yes | Yes | Yes |
| `admin` | Full access except org deletion | Yes | Yes | Yes | Yes |
| `org_admin` | Agent and analytics management | Yes | Yes | Yes | Yes |
| `member` | Basic access | No | No | No | Yes |

---

## Tenant Boundaries

All data is scoped to an organization:

```mermaid
graph TD
    O[Organization] --> U[Users]
    O --> T[Teams]
    O --> M[Machines]
    O --> S[Sessions]
    O --> E[Events]
    O --> AK[API Keys]
    O --> EK[Enrollment Keys]
    O --> I[Invitations]
    O --> DU[Daily Usage]
    O --> DP[Daily Provider Usage]
    O --> DM[Daily Model Usage]
```

No cross-organization queries exist. Every SQL query includes `WHERE organization_id = $1`.

---

## Team Management

Teams are optional groupings within an organization.

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant DA as Dashboard API
    participant DB as PostgreSQL

    Admin->>DA: POST /api/v1/teams
    Note over Admin: { name, description }
    DA->>DB: INSERT INTO teams
    DA-->>Admin: { id, name }

    Admin->>DA: POST /api/v1/teams/:id/members
    Note over Admin: { userId, role }
    DA->>DB: INSERT INTO team_members
```

The default `General` team is created during organization setup. All invited users are automatically added to it.

---

## Onboarding Progress

The `GET /api/v1/onboarding/progress` endpoint tracks onboarding steps:

| Step | Field | Check |
|------|-------|-------|
| Organization created | `hasOrganization` | Always true (created during registration) |
| Users exist | `hasUsers` | `COUNT(*) > 0` in users table |
| Teams exist | `hasTeams` | `COUNT(*) > 0` in teams table |
| Enrollment keys exist | `hasEnrollmentKeys` | `COUNT(*) > 0` in organization_enrollment_keys |
| Machines registered | `hasMachines` | `COUNT(*) > 0` in machines |
| Sessions synced | `hasSessions` | `COUNT(*) > 0` in sessions |
