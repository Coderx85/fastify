# Data Model: Core Entities

**Date**: 2026-01-26
**Feature**: Database Persistence Layer

This document describes the data models for the core entities of the application, which will be persisted in the database.

## 1. User Entity

Represents an application user.

| Field          | Type           | Description                             | Constraints         |
|----------------|----------------|-----------------------------------------|---------------------|
| `id`           | `integer`      | Unique identifier for the user.         | Primary Key, Auto-increment |
| `name`         | `varchar(255)` | The user's full name.                   | Required            |
| `email`        | `varchar(255)` | The user's email address.               | Required, Unique    |
| `password`     | `varchar(255)` | The user's hashed password.             | Required            |
| `createdAt`    | `timestamp`    | Timestamp of when the user was created. | Required, Default `now()` |

### Relationships

-   A `User` can have many `Posts`.

## 2. Post Entity

Represents a blog post created by a user.

| Field          | Type           | Description                              | Constraints                |
|----------------|----------------|------------------------------------------|----------------------------|
| `id`           | `integer`      | Unique identifier for the post.          | Primary Key, Auto-increment|
| `title`        | `varchar(255)` | The title of the post.                   | Required                   |
| `content`      | `text`         | The full content of the post.            | Required                   |
| `authorId`     | `integer`      | The ID of the user who created the post. | Required, Foreign Key to `User.id` |
| `publishedAt`  | `timestamp`    | Timestamp of when the post was published.| Optional, Default `null`   |

### Relationships

-   A `Post` belongs to one `User`.
