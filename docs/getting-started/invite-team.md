# Invite Team

Invite team members to your AIInsight organization via email.

## Sending Invitations

### Via Dashboard

1. Navigate to **Settings → Team**
2. Click **Invite Member**
3. Enter the email address
4. Select a role (Admin or Member)
5. Click **Send Invitation**

<!-- Screenshot: Invitation form -->

### Via API

```bash
curl -X POST http://localhost:3002/api/v1/invitations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "colleague@company.com",
    "role": "member"
  }'
```

### Role Selection

| Role | Permissions Granted |
|------|---------------------|
| **Member** | View dashboard, view analytics |
| **Admin** | All Member permissions + manage teams, API keys, enrollment keys, org settings |

See [Architecture: Organization Flow](../architecture/organization-flow.md) for the full permission matrix.

## Accepting Invitations

1. Check your email for an invitation from `no-reply@aiinsight.dev`
2. Click the **Accept Invitation** link
3. If you don't have an account, you'll be prompted to create one
4. If you already have an account, you'll be added to the organization automatically

<!-- Screenshot: Invitation email -->

### Invitation Link Details

- The invitation link is valid for **7 days**
- Links are single-use and tied to the recipient's email
- If the link expires, the sender can resend the invitation

## Managing Invitations

### Viewing Pending Invitations

**Via Dashboard:**
Navigate to **Settings → Team → Invitations** to see all pending invitations.

**Via API:**
```bash
curl http://localhost:3002/api/v1/invitations \
  -H "Authorization: Bearer $TOKEN"
```

### Resending Invitations

If an invitation hasn't been accepted, you can resend it:

**Via Dashboard:**
1. Go to **Settings → Team → Invitations**
2. Find the pending invitation
3. Click **Resend**

**Via API:**
```bash
curl -X POST http://localhost:3002/api/v1/invitations/{invitationId}/resend \
  -H "Authorization: Bearer $TOKEN"
```

> **Note:** Resending generates a new invitation link. The previous link remains valid until it expires.

### Revoking Invitations

To cancel a pending invitation:

**Via Dashboard:**
1. Go to **Settings → Team → Invitations**
2. Find the pending invitation
3. Click **Revoke**

**Via API:**
```bash
curl -X DELETE http://localhost:3002/api/v1/invitations/{invitationId} \
  -H "Authorization: Bearer $TOKEN"
```

## Changing Roles

After a member has joined, you can update their role:

### Promoting to Admin

```bash
curl -X PATCH http://localhost:3002/api/v1/organizations/current/members/{userId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

### Demoting to Member

```bash
curl -X PATCH http://localhost:3002/api/v1/organizations/current/members/{userId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "member"
  }'
```

> **Note:** Organization Owners cannot be demoted via the API. Only the Owner can transfer ownership.

## Expiration Policies

| Policy | Duration | Description |
|--------|----------|-------------|
| Invitation link | 7 days | Links expire after 7 days |
| Resent invitations | 7 days | Resending resets the expiration |
| Pending invitations | No limit | Invitations remain pending until accepted or revoked |

## Troubleshooting

### Invitation email not received

1. Check the recipient's spam/junk folder
2. Verify the email address is correct
3. Resend the invitation from the dashboard
4. Check if the organization has reached its member limit

### "Invitation expired" error

The invitation link has expired. Ask the sender to resend the invitation.

### "Already a member" error

The email address is already associated with an account in the organization. If the user needs to switch organizations, they must leave the current one first.

### "Invalid invitation" error

The invitation link may be malformed or the invitation may have been revoked. Request a new invitation from the organization admin.

## Related Documentation

- [Organization Onboarding](../architecture/organization-flow.md) — Full org setup guide
- [Email Templates](../support/email-templates.md) — Customize invitation emails
- [Troubleshooting](troubleshooting.md) — Common issues and solutions
