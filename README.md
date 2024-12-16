#README.md

# ALX Files Manager

This project is a file management system that allows users to upload, view, and manage files. It uses MongoDB for database management and Redis for caching.

## Table of Contents
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Database](#database)
- [Contributing](#contributing)
- [License](#license)

## Requirements
- Node.js (>=14)
- MongoDB
- Redis

## Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/BrotherSilas/alx-files_manager.git
   cd alx-files_manager
Install dependencies:

```bash
npm install

Set up environment variables:
Create a .env file in the root directory:
```env
DB_HOST=localhost
DB_PORT=27017
DB_DATABASE=files_manager
REDIS_PORT=6379

Start the Redis server:
```bash
redis-server

Start the server:
```bash
npm run dev

Usage
The project uses nodemon to automatically restart the server on file changes.
Visit http://localhost:5000 to access the application.
Use http://localhost:5000/api/v1/files to list all files.
User registration and file upload can be accessed through the appropriate endpoints.

Database
Collections:
users: Stores user data including email, password, and creation date.
files: Stores file data including file name, type, size, and upload date.

Contributing
Feel free to contribute by forking this repository and submitting pull requests.
Make sure to test your changes locally before submitting.

License
This project is licensed under the ALX License. See the LICENSE file for more information.

