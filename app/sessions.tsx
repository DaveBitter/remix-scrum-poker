import { createCookieSessionStorage, Session } from "remix";

const { getSession, commitSession, destroySession } =
    createCookieSessionStorage({
        cookie: {
            name: "__session",
            path: '/'
        }
    });

const getSessionStorageInit: any = async (cookieSession: Session) => ({
    headers: {
        "Set-Cookie": await commitSession(cookieSession)
    }
})

export { getSession, getSessionStorageInit, destroySession };