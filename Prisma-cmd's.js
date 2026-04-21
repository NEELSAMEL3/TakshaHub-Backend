// | Step  | Command                                                 | Purpose                                                | Use When                                                      |
// | ----- | ------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
// | 🧩 1  | `npx prisma format`                                     | Validate + auto-format your Prisma schema              | After editing `schema.prisma` to keep it clean and error-free |
// | ⚙️ 2  | `npx prisma generate / npx prisma generate --force`                                   | Generate Prisma Client code to interact with DB        | After any schema changes or when starting the project         |
// | 🧱 3  | `npx prisma migrate dev --name <migration_name>`        | Apply schema changes, create migration history         | For development/production DB with tracked migrations         |
// | 🌐 4  | `npx prisma db push`                                    | Push schema directly to DB without creating migrations | Quick testing or syncing schema in development                |
// | 🔍 5  | `npx prisma studio`                                     | Open Prisma Studio (GUI) to view/edit database         | Visual inspection or manual editing of DB data                |
// | 💣 6  | `npx prisma migrate reset`                              | Drop all tables and reapply migrations                 | When you want a fresh start in development (all data lost)    |
// | 📝 7  | `npx prisma db pull`                                    | Pull current DB schema into `schema.prisma`            | When DB was changed outside Prisma (manual changes)           |
// | ✅ 8   | `npx prisma validate`                                   | Validate the Prisma schema for errors                  | After editing schema, before generating client                |
// | 🌱 9  | `npx prisma db seed`                                    | Run seed script defined in `package.json`              | To populate initial data like admin, manager, sales, leads    |
// | 🔧 10 | `npx prisma migrate status`                             | Check status of applied and pending migrations         | Before deploying or debugging migration issues                |
// | 🔄 11 | `npx prisma db push --force-reset`                      | Push schema and reset DB (overwrites data)             | Quick dev reset without creating migrations                   |
// | 🔎 12 | `npx prisma migrate resolve --applied <migration_name>` | Mark migration as applied manually                     | When you manually change DB but want Prisma to recognize it   |

rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
rm -rf node_modules package-lock.json
npm install
npm install prisma @prisma/client

npx prisma format
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate

# Generate Prisma client (after fixing schema)
npx prisma generate

# Deploy migrations to Neon database
npx prisma migrate deploy    