# Analytics Guide

## Dashboard Overview

The Overview page provides a summary of AI usage across your organization.

### Hero Metric Cards

Six metric cards display key figures at a glance:

| Card | Description |
|------|-------------|
| **Total Tokens** | Sum of input and output tokens across all sessions |
| **Total Cost** | Estimated cost in USD for the selected period |
| **Active Users** | Number of unique users with at least one session |
| **Sessions** | Total number of AI coding sessions |
| **Active Providers** | Number of providers with recorded usage |
| **Avg Cost / Session** | Total cost divided by total sessions |

Each card includes a sparkline showing the trend over the selected period and a percentage change indicator comparing to the previous period.

### Period Selector

Choose the time range for all dashboard data:

- **7d** - Last 7 days
- **30d** - Last 30 days (default)
- **90d** - Last 90 days
- **12m** - Last 12 months

### Charts

The Overview page includes four charts:

- **Usage Over Time**: Area chart showing token usage trend
- **Provider Distribution**: Donut chart showing cost split by provider
- **Cost by Provider**: Stacked bar chart showing cost breakdown over time
- **Model Distribution**: Bar chart showing token usage by model

### Quick Insights

The Insights section highlights key findings:

- **Top Provider**: Provider with the highest total cost
- **Fastest Growing**: Provider with the largest share of total usage
- **Top Project**: Project with the most sessions
- **Highest Cost User**: User with the highest estimated cost
- **Most Active User**: User with the most sessions
- **Cost Efficiency Leader**: Provider with the lowest cost per token

### Activity Feed

The Recent Activity section shows the latest sessions with user name, provider, project, token count, and relative timestamp.

## Provider Analytics

The Providers page breaks down usage by AI coding provider.

### Provider Health Cards

Each provider gets a card showing:

- Total cost and percentage of total usage
- Token count and session count
- Cost per session
- Health status indicator:
  - **Healthy**: >30% of total usage
  - **Stable**: 10-30% of total usage
  - **Low**: <10% of total usage
- Mini sparkline trend

### Usage Trends

An area chart with a toggle to switch between:

- **Tokens**: Total token usage over time
- **Cost**: Estimated cost over time
- **Sessions**: Session count over time

### Cost Distribution

A donut chart showing the proportional cost split across all providers.

### Model Distribution by Provider

A stacked bar chart showing session counts per model, grouped by provider. This reveals which models are most popular within each provider.

### Provider Comparison Table

A sortable table with columns:

- Provider name (with color indicator)
- Sessions
- Tokens
- Cost
- Percentage share (with visual bar)
- Average cost per session
- Trend sparkline

Click column headers to sort ascending or descending.

## User Analytics

The Users page tracks individual user activity and spending.

### Summary Cards

- **Total Active Users**: Unique users in the period
- **Most Active User**: User with the highest session count
- **Highest Spender**: User with the highest estimated cost
- **Avg Sessions/User**: Average session count per user

### User Leaderboard

A paginated, sortable table showing all users ranked by:

- Sessions
- Tokens
- Cost

Each row displays the user's rank, name, email, sessions, tokens, total cost, and average cost per session. The top 3 users are highlighted with special styling.

### User Activity Over Time

An area chart showing the number of active users per day.

### Provider Preferences by User

A horizontal stacked bar chart showing the top 10 users by session count and their provider distribution. This reveals individual user tool preferences.

### Activity Heatmap

A calendar heatmap showing daily activity intensity over the past year. Darker cells indicate higher session counts. Weekdays typically show higher activity than weekends.

## Project Analytics

The Projects page analyzes usage across codebases and repositories.

### Summary Cards

- **Total Projects**: Number of unique project names recorded
- **Total Cost**: Sum of estimated costs across all projects
- **Total Sessions**: Sum of sessions across all projects
- **Total Tokens**: Sum of tokens across all projects

### Top 5 Projects by Cost

Ranked project cards showing:

- Project name and rank
- Total cost
- Session count
- Token count
- Average cost per session

The top project is highlighted with a gold accent.

### Project Cost Trends

An area chart showing cost trends for the top 5 projects over the selected period.

### Token Usage by Project

A horizontal bar chart comparing token usage across projects.

### Project Activity Table

A full table with columns:

- Project name and rank
- Sessions
- Tokens
- Cost
- Average cost per session
- Status indicator:
  - **Active**: Above average session count
  - **Recent**: Around average session count
  - **Inactive**: Below average session count

### Project Comparison

A grouped bar chart comparing cost and session count across the top 6 projects.

## Trend Analytics

The Trends page tracks usage patterns and changes over time.

### Metric Summary Cards

Three cards showing the current period value, change amount, and percentage change compared to the previous half of the period:

- **Sessions**
- **Tokens**
- **Cost**

### Granularity Selector

Choose the time aggregation level:

- **Daily**: One data point per day
- **Weekly**: One data point per week
- **Monthly**: One data point per month

### Multi-Series Chart

An area chart with toggle buttons to show/hide:

- Sessions
- Tokens
- Cost

### Individual Trend Charts

Separate area charts for:

- Sessions Trend
- Token Usage Trend
- Cost Trend

### Week-over-Week Comparison

When 14+ days of data are available, a comparison card shows:

- This week vs. last week for sessions, tokens, and cost
- Absolute change and percentage change
- Trend arrows (up, down, or flat)

## Understanding Metrics

| Metric | Description | How It's Calculated |
|--------|-------------|---------------------|
| **Sessions** | Number of AI coding sessions | Count of unique session records in the period |
| **Tokens** | Total tokens consumed | Sum of input tokens + output tokens across all sessions |
| **Cost** | Estimated cost in USD | Calculated from token counts and provider pricing |
| **Users** | Active users | Count of unique user IDs with at least one session |
| **Projects** | Active projects | Count of unique project names with at least one session |

### Interpreting Usage Data

| Pattern | Likely Meaning | Suggested Action |
|---------|---------------|------------------|
| High token usage | Complex tasks or verbose prompts | Review prompt efficiency, consider model selection |
| High cost | Expensive models or high volume | Evaluate model alternatives, set usage budgets |
| Low activity | Team adoption issues or seasonal variation | Check agent status, review onboarding |
| Provider shift | Team adopting a new tool | Investigate which provider is gaining share |
| Spike in sessions | Sprint or project deadline | Monitor for sustained increase |
| Cost per session increasing | More complex tasks or model upgrades | Review model usage breakdown |

### Cost Estimation

AIInsight estimates costs based on published provider pricing for input and output tokens. Actual provider bills may differ due to:

- Negotiated enterprise pricing
- Promotional credits or free tiers
- Rate limiting or throttling effects
- Currency conversion differences

Use AIInsight costs as a directional estimate, not an exact billing figure.
