const parseDurationToMs = (value) => {
    if (!value) {
        return undefined
    }

    const match = String(value).trim().match(/^(\d+)([smhdw])$/i)

    if (!match) {
        return undefined
    }

    const amount = Number(match[1])
    const unit = match[2].toLowerCase()
    const unitToMs = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
    }

    return amount * unitToMs[unit]
}

const createAuthCookieOptions = (expiry) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: parseDurationToMs(expiry),
})

export { createAuthCookieOptions, parseDurationToMs }