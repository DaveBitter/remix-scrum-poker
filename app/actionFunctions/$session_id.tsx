// Libs
import { ActionFunction } from 'remix';

// Utils
import { getSession } from '~/sessions';
import { supabaseServerClient } from '~/utils/supabaseClient.server';

// Type
export type SessionIDActionData = {
    error?: string
}

// Component
export const sessionIDAction: ActionFunction = async ({ request, params }): Promise<Response | SessionIDActionData> => {
    const form = await request.formData();
    const session_id = params.session_id;
    const form_type = form.get('form_type') as string;
    const effort = form.get("effort") as string;

    const session = await getSession(
        request.headers.get("Cookie")
    );

    let user;
    if (session_id) {
        user = session.get(session_id);
    }

    let { data: sessionData } = await supabaseServerClient
        .from('sessions')
        .select('*')
        .eq('session_id', session_id)
        .single()

    switch (form_type) {
        case 'update_effort':
            const { data: voteData, error: getEffortToUpdateError } = await supabaseServerClient
                .from('votes')
                .select('*')
                .eq('user_id', user.user_id)
                .single();

            if (getEffortToUpdateError) {
                return { error: JSON.stringify(getEffortToUpdateError) }
            }
            const { error: updateEffortError } = await supabaseServerClient
                .from('votes')
                .update({ ...voteData, effort })
                .eq('user_id', user.user_id)

            if (updateEffortError) {
                return { error: JSON.stringify(updateEffortError) }
            }
            break;
        case 'toggle_effort':
            if (sessionData.host_id !== user.user_id) {
                return { error: 'Not authorized to toggle effort.' }
            }

            const { error: toggleEffortError } = await supabaseServerClient
                .from('sessions')
                .update({ votes_visible: !Boolean(sessionData.votes_visible) })
                .eq('session_id', session_id)

            if (toggleEffortError) {
                return { error: JSON.stringify(toggleEffortError) }
            }
            break;
        case 'clear_effort':
            if (sessionData.host_id !== user.user_id) {
                return { error: 'Not authorized to clear effort.' }
            }

            const [{ error: clearEffortToggleError }, { error: clearEffortError }] = await Promise.all([
                supabaseServerClient
                    .from('sessions')
                    .update({ votes_visible: false })
                    .eq('session_id', session_id),
                supabaseServerClient
                    .from('votes')
                    .update({ effort: null })
                    .eq('session_id', session_id)
            ])

            if (clearEffortToggleError || clearEffortError) {
                return { error: JSON.stringify(clearEffortToggleError || clearEffortError) }
            }
            break;
        default:
            break;
    }

    return {};
}
