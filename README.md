## Insophinia User Management API Documentation

### Overview

The Insophinia User Management API provides a comprehensive solution for managing user profiles, roles, permissions, and API keys within the Insophinia management system. Leveraging Node.js and Express.js, this API offers robust authentication and authorization features, ensuring secure access to resources.

### Key Features

- **User Profile Management**: Create, retrieve, update, and delete user profiles.
- **Role-Permissions Management**: Define roles and assign permissions to control access levels.
- **User-Roles Management**: Assign roles to users for role-based access control.
- **API Key Management**: Generate, retrieve, update, and delete API keys for users.
- **Authentication and Authorization**: Utilize JWT tokens for user authentication and role-based authorization.
- **Middleware Integration**: Implement various middleware components for request handling, security, and logging.
- **HTTPS Server Support**: Optionally configure an HTTPS server for enhanced security.

### Installation and Usage

To get started with the Insophinia Management API:

1. **Installation**: Install dependencies and initialize the database.
2. **Configuration**: Set up environment variables and database settings as required.
3. **Usage**: Start the server and access API endpoints using appropriate HTTP methods and routes.

### Documentation Structure

- **Installation Steps**: Guide for cloning the repository, installing dependencies, and initializing the database.
- **Used Technologies**: Overview of the technologies utilized in the API development.
- **Introduction**: Brief introduction to the functionality provided by the API.
- **Endpoints**: Detailed description of API endpoints categorized by functionality.
- **Middleware**: Explanation of middleware components used for request handling and processing.
- **Usage**: Instructions for utilizing the API including installation, configuration, and access.
- **App.js Explanation**: Overview of the main entry point file of the API and its components.
- **Conclusion**: Summary of the features and disclaimer regarding usage.

### Installation Steps

1. Install the required dependencies by running `npm install`.
   ```
   npm install
   ```

2. Database Initialization
   - Ensure SQLite is installed on your system.
   - Run the following command to initialize the database:
     ```
     node ./data/database.js
     ```

3. Start the server by running `node app.js`.
   ```
   node app.js
   ```

### Used Technologies

- Node JS Runtime Environment
- Express JS Framework
- SQLite3 Database

## API Documentation

#### Base URL

The base URL for this API is `http://localhost:8080/`.

### Introduction

Welcome to the Insophinia Management API documentation. This API provides functionality for managing user profiles, roles, permissions, and API keys within the Insophinia management system. It also includes authentication and authorization features to secure access to resources.

## Table of Contents

1. [Authentication](#authentication)
2. [Authorization](#authorization)
3. [Endpoints](#endpoints)
   - [Admin Endpoints](#admin-endpoints)
   - [User Endpoints](#user-endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [Root Endpoint](#root-endpoint)
4. [Middleware](#middleware)
5. [Usage](#usage)
6. [App.js Explanation](#appjs-explanation)
7. [Conclusion](#conclusion)

## Authentication

The Insophinia Management API uses JWT (JSON Web Tokens) for authentication. Upon successful authentication, a JWT token is generated and included in subsequent requests for authorization.

## Authorization

Authorization in the Insophinia Management API is role-based. Users are assigned roles, and each role is associated with a set of permissions. Access to specific endpoints and resources is restricted based on the user's role and permissions.

## Endpoints

### Admin Endpoints

#### 1. Profile Management

- **POST /admin**
  - Create a new user profile.
- **GET /admin**
  - Retrieve all user profiles.
- **GET /admin/:id**
  - Retrieve a specific user profile by ID.
- **PUT /admin/:id**
  - Update a specific user profile.
- **DELETE /admin/:id**
  - Delete a specific user profile.

#### 2. Role-Permissions Management

- **POST /admin/role-permissions**
  - Create a new role-permission mapping.
- **GET /admin/role-permissions**
  - Retrieve all role-permission mappings.
- **GET /admin/role-permissions/:role_id/:permission_id**
  - Retrieve a specific role-permission mapping.
- **PUT /admin/role-permissions/:role_id/:permission_id**
  - Update a specific role-permission mapping.
- **DELETE /admin/role-permissions/:role_id/:permission_id**
  - Delete a specific role-permission mapping.

#### 3. User-Roles Management

- **POST /admin/user-roles**
  - Assign roles to users.
- **GET /admin/user-roles**
  - Retrieve all user-role mappings.
- **GET /admin/user-roles/:user_id/:role_id**
  - Retrieve a specific user-role mapping.
- **PUT /admin/user-roles/:user_id/:role_id**
  - Update a specific user-role mapping.
- **DELETE /admin/user-roles/:user_id/:role_id**
  - Delete a specific user-role mapping.

### User Endpoints

#### 1. API Key Management

- **POST /api**
  - Generate API key and secret key for a user.
- **GET /api/:email**
  - Retrieve API key and secret key for a specific user.
- **PUT /api/:email**
  - Update API key and secret key for a specific user.
- **DELETE /api/:email**
  - Delete API key and secret key for a specific user.

### Auth Endpoints

#### 1. Login

- **POST /auth/login**
  - Authenticate user credentials and generate JWT token for authorization.

#### 2. Logout

- **POST /auth/logout**
  - Blacklist JWT token to invalidate session upon logout.

### Root Endpoint

- **GET /**
  - Welcome message and entry point of the API.

## Middleware

The Insophinia Management API utilizes various middleware components for request handling and processing.

1. **Admin Verifier**: Middleware to check if the user is an admin.
2. **Authorization Manager**: Middleware for user authorization based on role and permissions.
3. **CORS Options**: Cross-Origin Resource Sharing configuration.
4. **Error Logger**: Middleware to log errors encountered during request processing.
5. **Event Logger**: Middleware to log request events.
6. **Hash Password**: Middleware for hashing user passwords.
7. **Key Manager**: Middleware for generating API and secret keys.
8. **Rate Limiter**: Middleware for rate limiting requests.
9. **Request Limiter**: Middleware for limiting requests per IP address.
10. **Token Manager**: Middleware for token generation, verification, and authentication.

## Usage

To utilize the Insophinia Management API, follow these steps:

1. **Installation**: Install dependencies using `npm install`.
2. **Configuration**: Set up environment variables and database configuration.
3. **Run**: Start the API server using `npm start`.
4. **Access**: Access API endpoints using appropriate HTTP methods and routes.

## App.js Explanation

This file is the main entry point of the Insophinia Management API. It sets up the Express.js server, configures middleware, defines routes, and starts the server listening on a specified port.

#### Dependencies
- `express`: Fast, unopinionated, minimalist web framework for Node.js.
- `body-parser`: Node.js body parsing middleware, parsing incoming request bodies.
- `helmet`: Middleware for securing Express apps by setting various HTTP headers.
- `cors`: Middleware for enabling CORS (Cross-Origin Resource Sharing) in Express apps.

#### Middleware
- `bodyParser`: Middleware to parse incoming request bodies as JSON or URL encoded data.
- `cors`: Middleware to enable CORS with custom options defined in `corsOptions`.
- `helmet`: Middleware to set various security-related HTTP headers.
- `limiter`: Middleware for rate limiting requests.
- `logger`: Middleware for logging incoming requests and responses.
- `errorHandler`: Middleware for handling errors and logging them.

#### Routes
- `/`: Root route, handled by `root.js`.
- `/auth/login`: Route for handling user authentication, handled by `loginRoute.js`.
- `/auth/logout`: Route for handling user logout, handled by `logoutRoute.js`.
- `/api/keys`: Route for managing user API keys, handled by `userOperations.js`.
- `/profiles`: Route for managing admin profiles, handled by `adminOperations.js`.
- `/permissions`: Route for managing role permissions, handled by `rolePermissionsManage.js`.
- `/roles`: Route for managing user roles, handled by `userRolesManage.js`.

#### Server Initialization
- The Express app is initialized and configured with middleware and routes.
- The server starts listening on the specified port.
- A log message is printed to the console indicating that the server is running.

### HTTPS Server Implementation
- The code for setting up an HTTPS server is provided but commented out.
- It requires a private key and a certificate to be specified.
- Once configured, it can be used to create an HTTPS server instance instead of the regular HTTP server.

## Conclusion

The Insophinia Management API provides robust functionality for managing user profiles, roles, permissions, and API keys. It ensures security through JWT authentication and role-based authorization. 

Kindly note that this project is developed solely for educational purposes, not intended for industrial use, as its sole intention lies within the realm of education. We emphatically underscore that this endeavor is not sanctioned for industrial application. It is imperative to bear in mind that any utilization of this project for commercial endeavors falls outside the intended scope and responsibility of its creators. Thus, we explicitly disclaim any liability or accountability for such usage.
