export async function up({ db }) {
    const users = db.collection("users")
    const subscriptions = db.collection("subscriptions")
    const videos = db.collection("videos")
    const comments = db.collection("comments")

    await Promise.all([
        users.createIndex({ username: 1 }, { unique: true, name: "users_username_unique" }),
        users.createIndex({ email: 1 }, { unique: true, name: "users_email_unique" }),
        subscriptions.createIndex(
            { subscriber: 1, channel: 1 },
            { unique: true, name: "subscriptions_subscriber_channel_unique" }
        ),
        videos.createIndex({ owner: 1, isPublished: 1, createdAt: -1 }, { name: "videos_owner_published_createdAt" }),
        comments.createIndex({ video: 1, createdAt: -1 }, { name: "comments_video_createdAt" }),
    ])
}

export async function down({ db }) {
    const users = db.collection("users")
    const subscriptions = db.collection("subscriptions")
    const videos = db.collection("videos")
    const comments = db.collection("comments")

    await Promise.all([
        users.dropIndex("users_username_unique").catch(() => null),
        users.dropIndex("users_email_unique").catch(() => null),
        subscriptions.dropIndex("subscriptions_subscriber_channel_unique").catch(() => null),
        videos.dropIndex("videos_owner_published_createdAt").catch(() => null),
        comments.dropIndex("comments_video_createdAt").catch(() => null),
    ])
}