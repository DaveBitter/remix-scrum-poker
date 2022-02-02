// Libs
import { json, LoaderFunction, redirect } from 'remix';

// Utils
import { getSession, getSessionStorageInit } from '~/sessions';
import { supabaseServerClient } from '~/utils/supabaseClient.server';

// Type
export type SessionIDLoaderData = {
    error?: string;
    session_id?: string;
    user?: {
        user_id: string;
        username: string;
        isHost: boolean;
    };
    votes?: {
        [key in string]: string;
    };
    hostname?: string;
    votes_visible?: boolean;
    SUPABASE_ANON_KEY?: string;
    SUPABASE_URL?: string;
}

// Component
export const sessionIDLoader: LoaderFunction = async ({ params, request }): Promise<Response | SessionIDLoaderData> => {
    if (!params.session_id) {
        return redirect('/')
    }

    const cookieSession = await getSession(request.headers.get("Cookie"));
    let user = cookieSession.get(params.session_id);

    if (!user) {
        return redirect(`/?join_session_id=${params.session_id}`)
    }

    const { data: sessionData, error } = await supabaseServerClient
        .from('sessions')
        .select('*')
        .eq('session_id', params.session_id)
        .single()

    user.isHost = sessionData.host_id === user.user_id

    const { data: userVote } = await supabaseServerClient
        .from('votes')
        .select('*')
        .eq('user_id', user.user_id)
        .single();

    if (!userVote) {
        const { error: inserVotesError } = await supabaseServerClient
            .from('votes')
            .insert({ session_id: params.session_id, user_id: user.user_id, username: user.username, effort: null })
            .single()

        if (inserVotesError) {
            return { error: JSON.stringify(inserVotesError) }
        }
    }

    let { data: votes, error: votesError } = await supabaseServerClient
        .from('votes')
        .select('*')
        .eq('session_id', params.session_id);

    if (votesError) {
        return { error: JSON.stringify(votesError) }
    }
    let hostname;

    if (votes) {
        hostname = votes.find(({ user_id }) => user_id === sessionData.host_id)?.username;
        votes = votes.reduce((acc, { username, effort }) => ({ ...acc, [username]: effort }), {})
    }

    return json({
        session_id: params.session_id,
        votes_visible: sessionData.votes_visible,
        user,
        hostname,
        votes,
        error,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        SUPABASE_URL: process.env.SUPABASE_URL
    }, await getSessionStorageInit(cookieSession));
};
