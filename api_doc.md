# Backend API Documentation

## Overview

This is a comprehensive REST API for a content management system built with NestJS. The API provides endpoints for user management, authentication, posts, bookmarks, likes, tags, workspaces, pages, chat, and writer profiles.

## Base URL

```
http://echo.pilput.me/v1
http://nest.pilput.me/v1
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Standard Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": {}, // Response data (optional)
  "error": "Error message", // Only present on errors
  "meta": {} // Pagination metadata (optional)
}
```

### Pagination Response

For paginated endpoints, the response includes metadata:

```json
{
  "success": true,
  "message": "Successfully retrieved data",
  "data": [],
  "meta": {
    "total_items": 100,
    "offset": 0,
    "limit": 10,
    "total_pages": 10
  }
}
```

## HTTP Status Codes

- `200` - OK: Successful request
- `201` - Created: Resource successfully created
- `400` - Bad Request: Invalid request format or parameters
- `401` - Unauthorized: Authentication required or invalid
- `403` - Forbidden: Access denied
- `404` - Not Found: Resource not found
- `422` - Unprocessable Entity: Validation errors
- `500` - Internal Server Error: Server error

---

## Authentication Endpoints

### Register User

**POST** `/v1/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**Validation Rules:**
- `email`: Required, valid email format
- `username`: Required, 3-30 characters
- `password`: Required, minimum 6 characters

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

**Error Response (409):**
```json
{
  "success": false,
  "message": "Registration failed",
  "error": "Email or username already exists"
}
```

### Login

**POST** `/v1/auth/login`

Authenticate user and receive JWT token.

**Rate Limit:** 5 requests per 1 minute (60 seconds)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "jwt-token-here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username"
    }
  }
}
```

### Get Profile

**GET** `/v1/auth/profile`

🔒 **Authentication Required**

Retrieve current user's profile information.

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

### GitHub OAuth

**GET** `/v1/auth/github`

Initiate GitHub OAuth login flow. Redirects to GitHub for authentication.

### GitHub OAuth Callback

**GET** `/v1/auth/github/callback`

Handle GitHub OAuth callback. Sets JWT cookie and redirects to frontend.

### Refresh Token

**POST** `/v1/auth/refresh-token`

🔒 **Authentication Required**

Refresh JWT token.

**Response (200):**
```json
{
  "success": true,
  "message": "Refresh token successful",
  "data": {
    "access_token": "new-jwt-token"
  }
}
```

### Check Username Availability

**POST** `/v1/auth/check-username`

Check if a username is available for registration.

**Request Body:**
```json
{
  "username": "desired-username"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Username availability checked",
  "data": {
    "username": "desired-username",
    "available": true
  }
}
```

---

## User Endpoints

### Get User by ID

**GET** `/v1/users/{id}`

Retrieve user information by ID. Includes follow status if authenticated.

**Parameters:**
- `id` (path): User ID

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully retrieved user",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "First Last",
    "username": "username",
    "image": "profile-image-url",
    "first_name": "First",
    "last_name": "Last",
    "followers_count": 10,
    "following_count": 5,
    "is_following": true,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

### Get Current User

**GET** `/v1/users/me`

🔒 **Authentication Required**

Retrieve current authenticated user's information.

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully retrieved current user",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "first_name": "First",
    "last_name": "Last",
    "image": "profile-image-url",
    "is_super_admin": false,
    "followers_count": 10,
    "following_count": 5
  }
}
```

### Get All Users (Admin Only)

**GET** `/v1/users`

🔒 **Authentication Required** | 👑 **Admin Only**

Retrieve paginated list of all users.

**Query Parameters:**
- `offset` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "name": "First Last"
    }
  ],
  "metadata": {
    "total_items": 100,
    "offset": 0,
    "limit": 10,
    "total_pages": 10
  }
}
```

### Create User (Admin Only)

**POST** `/v1/users`

🔒 **Authentication Required** | 👑 **Admin Only**

Create a new user account.

### Update User (Admin Only)

**PUT** `/v1/users/{id}`

🔒 **Authentication Required** | 👑 **Admin Only**

Update user information.

### Reset User Password (Admin Only)

**PUT** `/v1/users/{id}/reset-password`

🔒 **Authentication Required** | 👑 **Admin Only**

Reset user password.

### Delete User (Admin Only)

**DELETE** `/v1/users/{id}`

🔒 **Authentication Required** | 👑 **Admin Only**

Delete a user account.

**Parameters:**
- `id` (path): User ID to delete

**Response (204):** No content

---

## User Follow Endpoints

### Follow User

**POST** `/v1/users/follow`

🔒 **Authentication Required**

Follow another user.

**Request Body:**
```json
{
  "user_id": "uuid-of-user-to-follow"
}
```

### Unfollow User

**DELETE** `/v1/users/{id}/follow`

🔒 **Authentication Required**

Unfollow a user.

**Parameters:**
- `id` (path): User ID to unfollow

### Check Follow Status

**GET** `/v1/users/{id}/follow-status`

🔒 **Authentication Required**

Check if current user follows the specified user.

### Get Mutual Follows

**GET** `/v1/users/{id}/mutual-follows`

🔒 **Authentication Required**

Get users that both current user and specified user follow.

### Get User Followers

**GET** `/v1/users/{id}/followers`

Get list of users following the specified user.

### Get User Following

**GET** `/v1/users/{id}/following`

Get list of users that the specified user follows.

### Get Follow Statistics

**GET** `/v1/users/{id}/follow-stats`

Get follower and following counts for a user.

---

## Post Endpoints

### Create Post

**POST** `/v1/posts`

🔒 **Authentication Required**

Create a new blog post with optional image upload.

**Request:** Multipart form data
- `image` (file, optional): Image file to upload
- JSON body with post data:
```json
{
  "title": "Post Title",
  "slug": "post-slug",
  "body": "Post content here...",
  "tags": ["tag1", "tag2"],
  "published": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully created post",
  "data": {
    "id": "uuid",
    "title": "Post Title",
    "slug": "post-slug",
    "body": "Post content here...",
    "published": true
  }
}
```

### Get All Posts

**GET** `/v1/posts`

Retrieve paginated list of all posts.

**Query Parameters:**
- `offset` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 10)

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully retrieved posts",
  "data": [
    {
      "id": "uuid",
      "title": "Post Title",
      "photo_url": "image-url",
      "body": "Truncated content...",
      "slug": "post-slug",
      "view_count": 100,
      "creator": {
        "id": "uuid",
        "username": "author",
        "name": "Author Name"
      },
      "tags": [
        {
          "id": "uuid",
          "name": "tag-name"
        }
      ],
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total_items": 100,
    "offset": 0,
    "limit": 10,
    "total_pages": 10
  }
}
```

### Get Post by ID

**GET** `/v1/posts/{id}`

Retrieve a specific post by ID. Automatically records a view.

**Parameters:**
- `id` (path): Post ID

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully retrieved post",
  "data": {
    "id": "uuid",
    "title": "Post Title",
    "photo_url": "image-url",
    "body": "Full post content...",
    "slug": "post-slug",
    "view_count": 100,
    "creator": {
      "id": "uuid",
      "username": "author",
      "name": "Author Name"
    },
    "tags": [],
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

### Get Post by Slug and Username

**GET** `/v1/posts/u/{username}/{slug}`

Retrieve a post by username and slug. Automatically records a view.

**Parameters:**
- `username` (path): Author's username
- `slug` (path): Post slug

### Update Post

**PATCH** `/v1/posts`

🔒 **Authentication Required**

Update an existing post.

**Request Body:**
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "slug": "updated-slug",
  "body": "Updated content...",
  "tags": ["new-tag"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully updated post",
  "data": {
    "id": "uuid",
    "title": "Updated Title"
  }
}
```

### Update Post Published Status

**PATCH** `/v1/posts/{id}/published`

🔒 **Authentication Required**

Update the published status of a post.

**Parameters:**
- `id` (path): Post ID

**Request Body:**
```json
{
  "published": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully updated post",
  "data": {
    "id": "uuid",
    "published": true
  }
}
```

### Delete Post

**DELETE** `/v1/posts/{id}`

🔒 **Authentication Required** | 👤 **Author Only**

Delete a post. Only the post author can delete.

**Parameters:**
- `id` (path): Post ID

### Get Random Posts

**GET** `/v1/posts/random`

Retrieve random posts for discovery.

**Query Parameters:**
- `limit` (optional): Number of posts to return (default: 9, max: 50)

### Get My Posts

**GET** `/v1/posts/me`

🔒 **Authentication Required**

Retrieve current user's posts.

**Query Parameters:**
- `offset` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 10)

### Get Posts by Username

**GET** `/v1/posts/username/{username}`

Retrieve posts by a specific user.

**Parameters:**
- `username` (path): Author's username

**Query Parameters:**
- `offset` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 10)

### Get Posts by Tag

**GET** `/v1/posts/tag/{tag}`

Retrieve posts with a specific tag.

**Parameters:**
- `tag` (path): Tag name

**Query Parameters:**
- `offset` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 10)

---

## Post Like Endpoints

### Like Post

**POST** `/v1/posts/like`

🔒 **Authentication Required**

Like a post.

**Request Body:**
```json
{
  "post_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully liked post",
  "data": {
    "id": "uuid",
    "post_id": "uuid",
    "user_id": "uuid"
  }
}
```

### Unlike Post

**DELETE** `/v1/posts/like/{id}`

🔒 **Authentication Required**

Unlike a post.

**Parameters:**
- `id` (path): Like ID or Post ID

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully unliked post",
  "data": null
}
```

### Get Post Likes

**GET** `/v1/posts/{id}/likes`

Get all likes for a specific post.

**Parameters:**
- `id` (path): Post ID

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully fetched post likes",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "post_id": "uuid",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Check if User Liked Post

**GET** `/v1/posts/{id}/liked`

🔒 **Authentication Required**

Check if current user has liked a specific post.

**Parameters:**
- `id` (path): Post ID

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully checked if user liked post",
  "data": {
    "liked": true,
    "like_id": "uuid"
  }
}
```

---

## Post Bookmark Endpoints

### Bookmark Post

**POST** `/v1/posts/bookmark`

🔒 **Authentication Required**

Bookmark a post.

**Request Body:**
```json
{
  "post_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully bookmarked post",
  "data": {
    "id": "uuid",
    "post_id": "uuid",
    "user_id": "uuid"
  }
}
```

### Unbookmark Post

**DELETE** `/v1/posts/bookmark/{id}`

🔒 **Authentication Required**

Remove a bookmark from a post.

**Parameters:**
- `id` (path): Bookmark ID or Post ID

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully unbookmarked post",
  "data": null
}
```

### Get Post Bookmarks

**GET** `/v1/posts/{id}/bookmarks`

Get all bookmarks for a specific post.

**Parameters:**
- `id` (path): Post ID

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully fetched post bookmarks",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "post_id": "uuid",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Check if User Bookmarked Post

**GET** `/v1/posts/{id}/bookmarked`

🔒 **Authentication Required**

Check if current user has bookmarked a specific post.

**Parameters:**
- `id` (path): Post ID

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully checked if user bookmarked post",
  "data": {
    "bookmarked": true,
    "bookmark_id": "uuid"
  }
}
```

### Get User Bookmarks

**GET** `/v1/posts/bookmarks/me`

🔒 **Authentication Required**

Get current user's bookmarked posts.

**Query Parameters:**
- `offset` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 10)

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully fetched user bookmarks",
  "data": [
    {
      "id": "uuid",
      "title": "Post Title",
      "slug": "post-slug",
      "creator": {
        "id": "uuid",
        "username": "author"
      }
    }
  ],
  "meta": {
    "total_items": 50,
    "offset": 0,
    "limit": 10,
    "total_pages": 5
  }
}
```

---

## Post View Endpoints

### Record Post View

**POST** `/v1/posts/{id}/view`

Record a view for a post. Can be called by anonymous users.

**Parameters:**
- `id` (path): Post ID

### Get Post Views

**GET** `/v1/posts/{id}/views`

🔒 **Authentication Required**

Get detailed view information for a post.

### Get Post View Statistics

**GET** `/v1/posts/{id}/view-stats`

Get view statistics for a post.

### Check if User Viewed Post

**GET** `/v1/posts/{id}/viewed`

🔒 **Authentication Required**

Check if current user has viewed a specific post.

---

## Tag Endpoints

### Get All Tags

**GET** `/v1/tags`

Retrieve all available tags.

**Response (200):**
```json
{
  "success": true,
  "message": "Tags fetched successfully",
  "data": [
    {
      "id": "uuid",
      "name": "tag-name",
      "description": "Tag description",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

---

## Workspace Endpoints

### Create Workspace

**POST** `/v1/workspaces`

Create a new workspace.

**Request Body:**
```json
{
  "name": "Workspace Name",
  "description": "Workspace description"
}
```

### Get All Workspaces

**GET** `/v1/workspaces`

Retrieve all workspaces.

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Workspace Name",
      "description": "Workspace description",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Get Workspace by ID

**GET** `/v1/workspaces/{id}`

Retrieve a specific workspace.

**Parameters:**
- `id` (path): Workspace ID (integer)

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "name": "Workspace Name",
    "description": "Workspace description",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### Update Workspace

**PATCH** `/v1/workspaces/{id}`

Update a workspace.

**Parameters:**
- `id` (path): Workspace ID (integer)

**Request Body:**
```json
{
  "name": "Updated Workspace Name",
  "description": "Updated description"
}
```

### Delete Workspace

**DELETE** `/v1/workspaces/{id}`

Delete a workspace.

**Parameters:**
- `id` (path): Workspace ID (integer)

---

## Page Endpoints

### Create Page

**POST** `/v1/pages`

Create a new page within a workspace.

**Request Body:**
```json
{
  "title": "Page Title",
  "content": "Page content",
  "workspace_id": 1,
  "parent_id": null
}
```

### Get Page

**GET** `/v1/pages/{id}`

Retrieve a specific page.

**Parameters:**
- `id` (path): Page ID (integer)

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "title": "Page Title",
    "content": "Page content",
    "workspace_id": 1,
    "parent_id": null,
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### Update Page

**PATCH** `/v1/pages/{id}`

Update a page.

**Parameters:**
- `id` (path): Page ID (integer)

**Request Body:**
```json
{
  "title": "Updated Page Title",
  "content": "Updated content"
}
```

### Delete Page

**DELETE** `/v1/pages/{id}`

Delete a page.

**Parameters:**
- `id` (path): Page ID (integer)

### Get Workspace Pages

**GET** `/v1/pages/workspace/{workspace_id}`

Retrieve all pages in a workspace.

**Parameters:**
- `workspace_id` (path): Workspace ID (integer)

### Get Child Pages

**GET** `/v1/pages/children/{parent_id}`

Retrieve child pages of a parent page.

**Parameters:**
- `parent_id` (path): Parent page ID (integer)

---

## Writer Endpoints

### Get Writer by Username

**GET** `/v1/writers/{username}`

Retrieve writer profile information by username.

**Parameters:**
- `username` (path): Writer's username

**Response (200):**
```json
{
  "success": true,
  "message": "Writer retrieved successfully",
  "data": {
    "id": "uuid",
    "username": "writer-username",
    "name": "Writer Name",
    "email": "writer@example.com",
    "followers_count": 10,
    "following_count": 5,
    "posts_count": 25
  }
}
```

---

## Chat Endpoints

All chat endpoints require authentication.

### Create Conversation

**POST** `/v1/chat/conversations`

🔒 **Authentication Required**
**Rate Limit:** 5 requests per minute

Create a new conversation.

**Request Body:**
```json
{
  "title": "Conversation Title"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "id": "uuid",
    "title": "Conversation Title",
    "user_id": "uuid",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### Send Message

**POST** `/v1/chat/conversations/{id}/messages`

🔒 **Authentication Required**
**Rate Limit:** 10 requests per minute

Send a message to a conversation.

**Parameters:**
- `id` (path): Conversation ID

**Request Body:**
```json
{
  "content": "Message content here..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "uuid",
    "conversation_id": "uuid",
    "user_id": "uuid",
    "content": "Message content here...",
    "role": "user",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### Stream Message

**POST** `/v1/chat/conversations/{id}/messages/stream`

🔒 **Authentication Required**
**Rate Limit:** 10 requests per minute

Send a message and receive streaming response using Server-Sent Events (SSE).

**Parameters:**
- `id` (path): Conversation ID

**Request Body:**
```json
{
  "content": "Message content here..."
}
```

**Response:** Server-Sent Events stream
```
data: {"content": "Partial response"}
data: {"content": "More response"}
data: [DONE]
```

### List Conversations

**GET** `/v1/chat/conversations`

🔒 **Authentication Required**

Retrieve all conversations for the current user.

**Response (200):**
```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Conversation Title",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Get Conversation

**GET** `/v1/chat/conversations/{id}`

🔒 **Authentication Required**

Retrieve a specific conversation with its messages.

**Parameters:**
- `id` (path): Conversation ID

**Response (200):**
```json
{
  "success": true,
  "message": "Conversation retrieved successfully",
  "data": {
    "id": "uuid",
    "title": "Conversation Title",
    "messages": [
      {
        "id": "uuid",
        "content": "Message content",
        "role": "user|assistant",
        "created_at": "2023-01-01T00:00:00Z"
      }
    ],
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### Delete Conversation

**DELETE** `/v1/chat/conversations/{id}`

🔒 **Authentication Required**

Delete a conversation and all its messages.

**Parameters:**
- `id` (path): Conversation ID

**Response (200):**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

## Debug Endpoints (Development Only)

These endpoints are only available when `DEBUG=true` in the configuration.

### Performance Profiling

**GET** `/v1/debug/pprof/*`

Access Go pprof profiling endpoints for performance analysis.

Available endpoints:
- `/v1/debug/pprof/` - Index
- `/v1/debug/pprof/cmdline` - Command line
- `/v1/debug/pprof/profile` - CPU profile
- `/v1/debug/pprof/symbol` - Symbol lookup
- `/v1/debug/pprof/trace` - Execution trace
- `/v1/debug/pprof/heap` - Heap profile
- `/v1/debug/pprof/goroutine` - Goroutine profile
- `/v1/debug/pprof/allocs` - Memory allocations
- `/v1/debug/pprof/block` - Block profile
- `/v1/debug/pprof/mutex` - Mutex profile

---

## Error Handling

### Common Error Responses

**Validation Error (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Validation error details",
  "data": {
    "field_name": ["error message"]
  }
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "Unauthorized access"
}
```

**Authorization Error (403):**
```json
{
  "success": false,
  "message": "Access denied",
  "error": "Access forbidden"
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "Resource not found"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

---

## Rate Limiting

Certain endpoints have rate limiting applied:

- **Login endpoint**: 5 requests per 1 minute per IP address
- **Chat conversation creation**: 5 requests per 1 minute per user
- **Chat message sending**: 10 requests per 1 minute per user
- **Global rate limiting**: 10 requests per 60 seconds for all endpoints

---

## Data Models

### User Model
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "First Last",
  "username": "username",
  "image": "profile-image-url",
  "first_name": "First",
  "last_name": "Last",
  "is_super_admin": false,
  "followers_count": 0,
  "following_count": 0,
  "is_following": null,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Post Model
```json
{
  "id": "uuid",
  "title": "Post Title",
  "photo_url": "image-url",
  "body": "Post content",
  "slug": "post-slug",
  "view_count": 0,
  "creator": {
    "id": "uuid",
    "username": "author",
    "name": "Author Name"
  },
  "tags": [
    {
      "id": "uuid",
      "name": "tag-name"
    }
  ],
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Tag Model
```json
{
  "id": "uuid",
  "name": "tag-name",
  "description": "Tag description",
  "created_at": "2023-01-01T00:00:00Z"
}
```

---

## Best Practices

### Request Headers
Always include appropriate headers:
```
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

### Pagination
Use `offset` and `limit` parameters for pagination:
- Default `limit`: 10
- Default `offset`: 0
- Maximum `limit`: Varies by endpoint

### Error Handling
Always check the `success` field in responses and handle errors appropriately.

### Authentication
Store JWT tokens securely and include them in the Authorization header for protected endpoints.

### Rate Limiting
Respect rate limits and implement appropriate retry logic with exponential backoff.

---

## Changelog

### Version 1.0.0
- Initial API release built with NestJS
- User authentication with JWT and GitHub OAuth
- User management with follow/unfollow functionality
- Post creation and management with image upload support
- Post like and bookmark system (replaces comment system)
- Tag system (read-only)
- Workspace and page management for notes
- Chat system with conversation and message management
- Writer profiles
- Post view tracking
- Rate limiting on sensitive endpoints
- Server-Sent Events streaming for chat responses

### Key Changes from Documentation
- Authentication includes GitHub OAuth flow and refresh tokens
- Comments replaced with like and bookmark functionality
- Post creation supports multipart file uploads for images
- Chat system added with streaming responses
- Tags are currently read-only (GET only)
- Workspaces and pages use integer IDs instead of UUIDs
- WebSocket Gateway removed (no longer implemented)
- Response format uses `metadata` instead of `meta` for pagination

---

*This documentation is generated based on the Echo Backend API codebase analysis.*
