# MongoDB Migrations

This folder contains file-based MongoDB migrations for the backend.

## Workflow

- `npm run migrate:status` shows applied and pending migrations.
- `npm run migrate:up` runs all pending migrations in filename order.
- `npm run migrate:create -- add-user-indexes` creates a timestamped migration stub.

## Format

Each migration exports two async functions:

- `up({ db, mongoose, fileName })`
- `down({ db, mongoose, fileName })`

Use `db.collection("...")` to make MongoDB changes. Keep migrations idempotent when possible.

## Tracking

Applied migrations are stored in the collection defined by `MIGRATIONS_COLLECTION_NAME`.