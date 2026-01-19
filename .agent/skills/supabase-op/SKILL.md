---
name: supabase-op
description: Best practices for interacting with the Supabase database, including migrations and security checks.
---

# Instructions

## Workflow for Database Changes
1.  **Plan**: Write the SQL schema change carefully.
2.  **Migrate**: Use the `apply_migration` tool. 
    *   Do NOT run `execute_sql` for DDL (schema changes).
3.  **Verify**: 
    -   Run `get_advisors` (Security & Performance) immediately after migration.
    -   Check table structure with `list_tables`.

## Security Policies (RLS)
*   **Always Enable RLS**: `ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;`
*   **Least Privilege**: Grant only necessary permissions to `anon` and `authenticated` roles.
*   **Policies**: Create specific policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE`.

## Tool Usage
*   **`confirm_cost`**: Must be called before creating new projects or branches.
*   **`get_project`**: Use to verify project status if operations take time.

## Type Generation
After any schema change, run `generate_typescript_types` to keep the frontend types in sync.
