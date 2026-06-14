# Team Onboarding Guide

## Inviting Team Members

### Step-by-Step Invitation Process

1. Navigate to **Settings > Team** in the dashboard
2. Click **Invite Member**
3. Enter the team member's email address
4. Select a role (default: `member`)
5. Click **Send Invitation**

The invitee receives an email with a link to accept. The invitation expires after 7 days. If the invitee does not have an account, one is created automatically when they accept.

### Bulk Invitations

You can invite multiple team members at once:

1. Navigate to **Settings > Team**
2. Click **Invite Members**
3. Enter multiple email addresses (one per line or comma-separated)
4. Select a role for all invitees
5. Click **Send Invitations**

### Custom Messages

When sending invitations, the system uses a default template. Invitations can be resent with a fresh 7-day expiry if the original link expires before acceptance.

### Accepting Invitations

Invited users click the link in their email, which directs them to the login page with the invitation token. After accepting:

- A user account is created with the invited role
- The user is added to the **General** team by default
- The invitation is marked as accepted

## Role Management

| Role | Permissions |
|------|-------------|
| **Owner** | Full access. Can delete the organization, manage billing, transfer ownership, and perform all admin actions. |
| **Admin** | Manage teams, send/revoke invitations, update organization settings, view all analytics. Cannot delete the organization or manage billing. |
| **Member** | View dashboard, manage own agents, view own analytics. Cannot invite users or modify organization settings. |

### Role Assignment

- The organization creator is automatically assigned the `owner` role
- Invited users default to the `member` role unless specified otherwise
- Roles can be changed by an owner or admin from the team management page

### Changing User Roles

1. Navigate to **Settings > Team**
2. Find the user in the team list
3. Click the role dropdown next to their name
4. Select the new role
5. Confirm the change

## Recommended Rollout Strategy

### Small Teams (2-5 people)

- Invite all members at once
- Use the default **General** team
- Share the enrollment key securely (password manager or encrypted channel)
- Each member installs the agent on their machine

### Medium Teams (6-20 people)

- Create department or project-based teams (e.g., "Backend", "Frontend", "DevOps")
- Stagger invitations over 1-2 weeks to manage onboarding load
- Assign a team admin for each team to handle day-to-day member management
- Use team-specific enrollment keys if needed

### Enterprise Teams (20+ people)

- Create project-based or functional teams
- Establish an approval workflow for new members (admin review before invitation)
- Document enrollment key rotation policy
- Consider SSO integration when available (planned feature)
- Assign multiple admins to avoid single-point-of-failure
- Set up notification preferences per team

## Teams

### Creating Teams

1. Navigate to **Settings > Teams**
2. Click **Create Team**
3. Enter a name and optional description
4. Click **Create**

### Managing Team Members

- **Add member**: Select a team, click **Add Member**, choose from existing users
- **Remove member**: Click the remove icon next to a member's name
- **Delete team**: Click **Delete Team** (members are not deleted, only removed from the team)

### Team Enrollment Keys

Each team can have its own enrollment keys for agent registration:

1. Navigate to **Settings > Agents > Enrollment Keys**
2. Click **Generate Key**
3. Name the key (e.g., "Backend Team Key")
4. Optionally set an expiry date
5. Share the key securely with team members

Enrollment keys can be rotated at any time. Old keys are immediately invalidated when rotated.

## Onboarding Checklist

For administrators setting up AIInsight for a team:

- [ ] Create the organization and verify email
- [ ] Generate an enrollment key
- [ ] Install the agent on at least one machine
- [ ] Verify data appears on the dashboard
- [ ] Invite team members with appropriate roles
- [ ] Create teams for different departments or projects
- [ ] Share enrollment keys with team members
- [ ] Set up notification preferences
