import fs from "fs/promises"
import path from "path"
import { pathToFileURL } from "url"
import mongoose from "mongoose"
import connectDB from "../src/db/index.js"

const projectRoot = process.cwd()
const migrationsDir = path.resolve(projectRoot, "src/migrations")
const migrationCollectionName = process.env.MIGRATIONS_COLLECTION_NAME || "migrations"

const getMigrationFiles = async () => {
    const entries = await fs.readdir(migrationsDir, { withFileTypes: true })

    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
        .map((entry) => entry.name)
        .sort()
}

const ensureMigrationCollection = async () => {
    return mongoose.connection.db.collection(migrationCollectionName)
}

const getAppliedMigrations = async () => {
    const collection = await ensureMigrationCollection()
    const appliedMigrations = await collection
        .find({}, { projection: { name: 1, appliedAt: 1 } })
        .sort({ appliedAt: 1, name: 1 })
        .toArray()

    return appliedMigrations
}

const runMigration = async (fileName, migrationCollection) => {
    const migrationPath = path.resolve(migrationsDir, fileName)
    const migrationModule = await import(pathToFileURL(migrationPath).href)
    const migrationUp = migrationModule.up || migrationModule.default?.up

    if (typeof migrationUp !== "function") {
        throw new Error(`Migration ${fileName} does not export an up function`)
    }

    await migrationUp({
        db: mongoose.connection.db,
        mongoose,
        fileName,
    })

    await migrationCollection.insertOne({
        name: fileName,
        appliedAt: new Date(),
    })
}

const printStatus = async () => {
    const migrationFiles = await getMigrationFiles()
    const appliedMigrations = await getAppliedMigrations()
    const appliedNames = new Set(appliedMigrations.map((migration) => migration.name))
    const pendingMigrations = migrationFiles.filter((fileName) => !appliedNames.has(fileName))

    console.log(`Applied migrations (${appliedMigrations.length}):`)
    for (const migration of appliedMigrations) {
        console.log(`- ${migration.name}`)
    }

    console.log(`Pending migrations (${pendingMigrations.length}):`)
    for (const fileName of pendingMigrations) {
        console.log(`- ${fileName}`)
    }
}

const createMigration = async (migrationName) => {
    if (!migrationName) {
        throw new Error("Provide a migration name, for example: npm run migrate:create -- add-user-indexes")
    }

    await fs.mkdir(migrationsDir, { recursive: true })

    const timestamp = new Date()
        .toISOString()
        .replace(/[-:TZ.]/g, "")
        .slice(0, 14)

    const safeName = migrationName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    if (!safeName) {
        throw new Error("Migration name must contain at least one alphanumeric character")
    }

    const fileName = `${timestamp}_${safeName}.js`
    const filePath = path.resolve(migrationsDir, fileName)

    const template = `export async function up({ db }) {
    // Add your forward migration logic here.
}

export async function down({ db }) {
    // Add your rollback logic here.
}
`

    await fs.writeFile(filePath, template, { flag: "wx" })
    console.log(`Created migration: ${fileName}`)
}

const main = async () => {
    const command = process.argv[2] || "status"
    const migrationArg = process.argv.slice(3).join(" ").trim()

    if (command === "create") {
        await createMigration(migrationArg)
        return
    }

    await connectDB()

    try {
        const migrationCollection = await ensureMigrationCollection()
        const appliedMigrations = await getAppliedMigrations()
        const appliedNames = new Set(appliedMigrations.map((migration) => migration.name))
        const migrationFiles = await getMigrationFiles()
        const pendingMigrations = migrationFiles.filter((fileName) => !appliedNames.has(fileName))

        if (command === "status") {
            await printStatus()
            return
        }

        if (command === "up") {
            if (!pendingMigrations.length) {
                console.log("No pending migrations")
                return
            }

            for (const fileName of pendingMigrations) {
                console.log(`Running migration: ${fileName}`)
                await runMigration(fileName, migrationCollection)
            }

            console.log("All pending migrations applied")
            return
        }

        throw new Error(`Unknown migration command: ${command}`)
    } finally {
        await mongoose.disconnect()
    }
}

main().catch(async (error) => {
    console.error(error)
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
    }
    process.exit(1)
})