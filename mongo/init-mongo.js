const dbName = process.env.MONGO_INITDB_DATABASE;
const appUsername = process.env.MONGO_APP_USERNAME;
const appPassword = process.env.MONGO_APP_PASSWORD;

const database = db.getSiblingDB(dbName);

database.createUser({
  user: appUsername,
  pwd: appPassword,
  roles: [
    {
      role: 'readWrite',
      db: dbName
    }
  ]
});

print(`Aurelia database initialised: ${dbName}`);