import { createCookieSessionStorage } from "remix";

const { getSession, commitSession, destroySession } =
    createCookieSessionStorage({
        cookie: {
            name: "__session",
            path: '/'
        }
    });

export { getSession, commitSession, destroySession };