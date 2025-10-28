// MongoDB initialization script
// This script creates the application database and user

// Switch to the admin database to create user
db = db.getSiblingDB('admin');

// Create application user with read/write access
db.createUser({
  user: 'instabrief_user',
  pwd: 'instabrief_pass',
  roles: [
    {
      role: 'readWrite',
      db: 'instabrief'
    }
  ]
});

// Switch to application database
db = db.getSiblingDB('instabrief');

// Create initial collections
db.createCollection('documents');
db.createCollection('users');
db.createCollection('summaries');

// Create indexes for better performance
db.documents.createIndex({ "created_at": -1 });
db.documents.createIndex({ "owner_id": 1 });
db.documents.createIndex({ "title": "text", "content": "text" });

print('MongoDB initialization completed successfully!');
