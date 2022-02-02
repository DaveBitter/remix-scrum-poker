// Libs
import { ActionFunction, redirect } from "remix";
// @ts-ignore
import { hri } from 'human-readable-ids';
import { v4 as uuidv4 } from 'uuid';

// Utils
import { getSession, getSessionStorageInit } from "~/sessions";
import { supabase } from "~/utils/supabaseClient";

// Type
export type IndexActionData = {
    join_session_id?: string;
    error?: string;
}

// Action
export const indexAction: ActionFunction = async ({ request }): Promise<Response | IndexActionData> => {
    const formData = await request.formData();
    const cookieSession = await getSession(request.headers.get("Cookie"));

    const form_type = formData.get("form_type");
    const username = formData.get("username");
    const session_id = formData.get("session_id") as string;
    const user_id = uuidv4();

    switch (form_type) {
        case 'create_session':
            const newSession_id = hri.random();

            cookieSession.set(newSession_id, { user_id, username })

            const { error: newSessionError } = await supabase
                .from('sessions')
                .insert({ session_id: newSession_id, host_id: user_id })
                .single()

            return newSessionError ? { error: JSON.stringify(newSessionError) } : redirect(`/session/${newSession_id}`, await getSessionStorageInit(cookieSession));
        case 'join_session':
            const { error: existingSessionError } = await supabase
                .from('sessions')
                .select('*')
                .eq('session_id', session_id)
                .single()


            if (existingSessionError) {
                return { error: JSON.stringify(existingSessionError) }
            }

            cookieSession.set(session_id, { user_id, username })

            return redirect(`/session/${session_id}`, await getSessionStorageInit(cookieSession))
        default:
            return {};
    }
};