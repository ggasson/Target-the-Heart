# Database Setup Guide

## Quick Database Setup Options

### Option 1: Neon (Recommended - Free Cloud PostgreSQL)
1. Go to [neon.tech](https://neon.tech/)
2. Sign up for a free account
3. Create a new project
4. Copy the connection string (it looks like: `postgresql://username:password@hostname/database`)
5. Update your `.env` file with the connection string

### Option 2: Supabase (Free Cloud PostgreSQL)
1. Go to [supabase.com](https://supabase.com/)
2. Sign up for a free account
3. Create a new project
4. Go to Settings > Database
5. Copy the connection string
6. Update your `.env` file with the connection string

### Option 3: Local PostgreSQL
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install with default settings
3. Create a database:
   ```sql
   CREATE DATABASE target_the_heart;
   ```
4. Update your `.env` file:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/target_the_heart
   ```

## Initialize Database Schema

Once you have your database set up, run:

```bash
npm run db:push
```

This will create all the necessary tables in your database.

## Verify Database Connection

You can test your database connection by running:

```bash
npm run check
```

If there are no TypeScript errors, your database connection is working.
