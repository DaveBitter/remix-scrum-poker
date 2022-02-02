// Libs
import { ActionFunction } from 'remix';

// Utils
import { getSession } from '~/sessions';
import { supabase } from '~/utils/supabaseClient';

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

    let { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', session_id)
        .single()

    switch (form_type) {
        case 'update_effort':
            const { data: vote, error: getEffortToUpdateError } = await supabase
                .from('votes')
                .select('*')
                .eq('user_id', user.user_id)
                .single();

            if (getEffortToUpdateError) {
                return { error: JSON.stringify(getEffortToUpdateError) }
            }
            const { error: updateEffortError } = await supabase
                .from('votes')
                .update({ ...vote, effort })
                .eq('user_id', user.user_id)

            if (updateEffortError) {
                return { error: JSON.stringify(updateEffortError) }
            }
            break;
        case 'toggle_effort':
            const { error: toggleEffortError } = await supabase
                .from('sessions')
                .update({ votes_visible: !Boolean(data.votes_visible) })
                .eq('session_id', session_id)

            if (toggleEffortError) {
                return { error: JSON.stringify(toggleEffortError) }
            }
            break;
        case 'clear_effort':
            const { error: clearEffortError } = await supabase
                .from('votes')
                .update({ effort: null })
                .eq('session_id', session_id)

            if (clearEffortError) {
                return { error: JSON.stringify(clearEffortError) }
            }

            const { error: clearEffortToggleError } = await supabase
                .from('sessions')
                .update({ votes_visible: !Boolean(data.votes_visible) })
                .eq('session_id', session_id)

            if (clearEffortToggleError) {
                return { error: JSON.stringify(clearEffortToggleError) }
            }
            break;
        default:
            break;
    }

    return {};
}
