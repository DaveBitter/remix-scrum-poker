import { useEffect, useState } from "react";
import { ActionFunction, Form, json, Link, LoaderFunction, redirect, useFetcher, useLoaderData, useParams, useSubmit } from "remix";

import { commitSession, getSession } from "~/sessions";
import { supabase } from "~/utils/supabaseClient";

export const loader: LoaderFunction = async ({ params, request }) => {
    if (!params.session_id) {
        return redirect('/')
    }

    const session = await getSession(
        request.headers.get("Cookie")
    );

    let user = session.get(params.session_id);

    if (!user) {
        return redirect(`/?join_session_id=${params.session_id}`)
    }

    let { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', params.session_id)
        .single()

    user.isHost = data.host_id === user.vote_id

    let { data: userVote } = await supabase
        .from('votes')
        .select('*')
        .eq('vote_id', user.vote_id)
        .single();

    if (!userVote) {
        await supabase
            .from('votes')
            .insert({ session_id: params.session_id, vote_id: user.vote_id, username: user.username, effort: null })
            .single()
    }

    let { data: votes } = await supabase
        .from('votes')
        .select('*')
        .eq('session_id', params.session_id);

    let hostname;

    if (votes) {
        hostname = votes.find(({ vote_id }) => vote_id === data.host_id)?.username;
        votes = votes.reduce((acc, { username, effort }) => ({ ...acc, [username]: effort }), {})
    }

    return json({ session_id: params.session_id, data, user, hostname, votes, error }, {
        headers: {
            "Set-Cookie": await commitSession(session)
        }
    });
};

type ActionData = {
    error?: any,
    data?: any
}

export const action: ActionFunction = async ({ request, params }): Promise<Response | ActionData> => {
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
            let { data: vote } = await supabase
                .from('votes')
                .select('*')
                .eq('vote_id', user.vote_id)
                .single();

            await supabase
                .from('votes')
                .update({ ...vote, effort })
                .eq('vote_id', user.vote_id)
            break;
        case 'toggle_effort':
            await supabase
                .from('sessions')
                .update({ votes_visible: !Boolean(data.votes_visible) })
                .eq('session_id', session_id)
            break;
        case 'clear_effort':
            await supabase
                .from('votes')
                .update({ effort: null })
                .eq('session_id', session_id)
            break;
        default:
            break;
    }

    return {};
}

/*** Component ***/
const Session = () => {
    const loaderData = useLoaderData<any>();
    const submit = useSubmit();
    const fetcher = useFetcher();

    let { session_id } = useParams();

    const user = loaderData?.user;
    const votes = fetcher?.data?.votes || loaderData?.votes;
    const votesVisible = fetcher?.data?.data?.votes_visible || loaderData?.data?.votes_visible;

    useEffect(() => {
        const sessionsSubscription = supabase
            .from(`sessions:session_id=eq.${session_id}`)
            .on('UPDATE', () => fetcher.load(window.location.pathname + window.location.search))
            .subscribe()

        const votesSubscription = supabase
            .from(`votes:session_id=eq.${session_id}`)
            .on('UPDATE', () => fetcher.load(window.location.pathname + window.location.search))
            .on('INSERT', () => fetcher.load(window.location.pathname + window.location.search))
            .subscribe()

        return () => {
            sessionsSubscription.unsubscribe();
            votesSubscription.unsubscribe();
        }
    }, []);

    const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
    const shareType = typeof window !== 'undefined' ? (window.navigator['share'] ? 'share' : 'copy') : 'copy';
    const handleShare = () => {
        const content = `${window.location.origin}/?join_session_id=${session_id}`;

        const triggerCopyToClipboard = () => {
            const placeholder = document.createElement('input');

            document.body.appendChild(placeholder);
            placeholder.setAttribute('value', content);
            placeholder.select();

            document.execCommand('copy');

            document.body.removeChild(placeholder);

            setShowCopiedFeedback(true)
            setTimeout(() => {
                setShowCopiedFeedback(false);
            }, 2000)
        };

        const triggerNativeShare = () => {
            window.navigator['share']({
                url: content
            });
        };

        switch (shareType) {
            case 'share':
                triggerNativeShare();
            default:
                triggerCopyToClipboard();
                break;
        }
    }

    return (
        <main className='flex flex-col justify-center lg:items-center h-screen p-4 pt-0 bg-gray-50'>
            <aside className="flex items-center w-screen p-4 -mx-4 rounded-b-lg bg-white shadow-lg">
                <div className='relative'>
                    <img className='box-content w-12 h-12 mr-2 pr-2 border-r-2 border-gray-200' src='/img/logo.png' />
                    <Link className='absolute top-0 right-0 bottom-0 left-0' style={{ fontSize: 0 }} to='/'>Back to overview</Link>
                </div>
                {votes && <ul className='flex gap-8 pl-2 w-full overflow-x-auto'>
                    {Object.keys(votes).sort().map((key: string) => <li className={`flex flex-col flex-1 justify-center align-center text-center ${loaderData?.hostname === key && '-order-1'}`} key={key}>
                        <span className='text-lg font-thin'>{key} {loaderData?.hostname === key && <span className='py-1 px-2 rounded-lg text-xs font-medium bg-emerald-500 text-white'>host</span>}</span>
                        <span className='text-xl lg:text-2xl font-medium whitespace-nowrap	'>
                            {votesVisible ? <span className={votes[key] ? 'text-emerald-500' : 'text-gray-300'}>{votes[key] || '-'}</span> :
                                <span className={votes[key] ? 'text-emerald-500' : 'text-gray-300'}>{votes[key] ? 'voted' : 'not voted'}</span>
                            }
                        </span>
                    </li>)}
                </ul>}
            </aside>

            <div className='flex flex-col my-auto w-full max-w-2xl p-8 rounded-lg bg-white shadow-lg radius-m'>
                <Form method='post' onChange={e => submit(e.currentTarget)}>
                    <input name="form_type" defaultValue="update_effort" required hidden />

                    <fieldset className='grid grid-cols-3 gap-4' id="effort">
                        {['?', '0.5', '1', '2', '3', '5', '8', '13', '20', '40', '100', '☕️'].map((effort: string) => <div key={effort}>
                            <input className='peer sr-only' id={`effort_${effort}`} defaultChecked={votes[`${user.username}`] === effort} type="radio" value={effort} name="effort" required />
                            <label className={`flex justify-center items-center p-6 lg:p-12 rounded-lg cursor-pointer text-xl font-medium bg-gray-100 hover:bg-emerald-200 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:pointer-events-none select-none ${votes[user.username] === effort && `${typeof window !== 'undefined' ? 'bg-emerald-500' : 'bg-emerald-300'} text-white pointer-events-none`}`} htmlFor={`effort_${effort}`}>{effort}</label>
                        </div>)}
                    </fieldset>
                    <button className='no-js-show w-full p-4 rounded-lg mt-4 bg-emerald-500 text-white'>Submit</button>
                </Form>

                {user.isHost && <>
                    <div className='flex gap-4 mt-12'>
                        <Form className='flex w-full' method='post'>
                            <input name="form_type" defaultValue="toggle_effort" required hidden />
                            <button className='w-full p-2 rounded-lg bg-emerald-500 text-white uppercase'>Toggle votes</button>
                        </Form>

                        <Form className='flex w-full' method='post'>
                            <input name="form_type" defaultValue="clear_effort" required hidden />
                            <button className='w-full p-2 rounded-lg bg-gray-200 uppercase'>Clear votes</button>
                        </Form>
                    </div>
                </>}
            </div>

            <footer className='flex items-center w-full lg:max-w-sm p-4 -mb-4 rounded-t-lg bg-white shadow-lg'>
                <p className='text-sm'><span className='text-gray-400 select-none'>Session </span><span className='font-mono text-emerald-400'>{session_id}</span></p>
                <button className={`no-js-hide whitespace-nowrap w-32 text-sm ml-auto p-2 uppercase rounded-lg ${showCopiedFeedback ? 'bg-emerald-500 text-white cursor-default' : 'bg-emerald-100 text-emerald-600'}`} disabled={showCopiedFeedback} onClick={handleShare}>{showCopiedFeedback ? <span>Copied!</span> : <span>{shareType} invite</span>}</button>
            </footer>
        </main>
    );
}

export default Session
