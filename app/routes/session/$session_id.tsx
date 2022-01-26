import { useEffect, useState } from "react";
import { ActionFunction, Form, LoaderFunction, redirect, useLoaderData, useParams, useSearchParams, useSubmit } from "remix";

import { supabase } from "~/utils/supabaseClient";

export const loader: LoaderFunction = async ({ params, request }) => {
    const requestURL = new URL(request.url);
    const username = requestURL.searchParams.get("username");

    if (!username) {
        return redirect(`/?join_session_id=${params.session_id}`);
    }

    let { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', params.session_id)
        .single()
    return { session_id: params.session_id, data, error };
};

type ActionData = {
    error?: any,
    data?: any
}

export const action: ActionFunction = async ({ request, params }): Promise<Response | ActionData> => {
    const form = await request.formData();
    const session_id = params.session_id;
    const form_type = form.get('form_type') as string;
    const votes_visible = form.get('votes_visible') as string;
    const effort = form.get("effort") as string;
    const username = form.get("username") as string;
    const votes = form.get("votes") as string;

    switch (form_type) {
        case 'update_effort':
            await supabase
                .from('sessions')
                .update({ votes: { ...JSON.parse(votes), [username]: effort } })
                .eq('session_id', session_id)
            break;
        case 'toggle_effort':
            await supabase
                .from('sessions')
                .update({ votes_visible: votes_visible === 'true' })
                .eq('session_id', session_id)
            break;
        case 'clear_effort':
            const updatedVotes = JSON.parse(votes);

            Object.keys(updatedVotes).forEach((key: string) => {
                updatedVotes[key] = null
            })

            await supabase
                .from('sessions')
                .update({ votes: updatedVotes, votes_visible: false })
                .eq('session_id', session_id)
            break;
        default:
            break;
    }

    return {};
}

/*** Component ***/
const Index = () => {
    const loaderData = useLoaderData<any>();
    const submit = useSubmit();

    let { session_id } = useParams();
    let [searchParams] = useSearchParams();
    const username = searchParams.get('username') || ''

    const [votes, setVotes] = useState(loaderData?.data?.votes)
    const [votesVisible, setVotesVisible] = useState(loaderData?.data?.votes_visible)
    useEffect(() => {
        const subscription = supabase
            .from(`sessions:session_id=eq.${session_id}`)
            .on('UPDATE', (payload: any) => {
                setVotes(payload?.new?.votes)
                setVotesVisible(payload?.new?.votes_visible)
            })
            .subscribe()

        return () => {
            subscription.unsubscribe();
        }
    }, []);

    const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
    const shareType = typeof window !== 'undefined' ? (window.navigator['share'] ? 'share' : 'copy') : 'copy';
    const handleShare = () => {
        const content = window.location.origin + window.location.pathname;

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
            <aside className="w-screen p-4 -mx-4 rounded-b-lg bg-white shadow-lg">
                {votes && <ul className='flex justify-around gap-4 max-w-full overflow-x-auto'>
                    {Object.keys(votes).sort().map((key: string) => <li className={`flex flex-col flex-1 justify-center align-center text-center ${loaderData?.data?.hostname === key && '-order-1'}`} key={key}>
                        <span className='text-lg font-thin'>{key} {loaderData?.data?.hostname === key && <span className='py-1 px-2 rounded-lg text-xs font-medium bg-emerald-500 text-white'>host</span>}</span>
                        <span className='text-2xl font-medium'>
                            {votesVisible ? <span className={votes[key] ? 'text-emerald-500' : 'text-gray-300'}>{votes[key] || '-'}</span> :
                                <span className={votes[key] ? 'text-emerald-500' : 'text-gray-300'}>{votes[key] ? 'voted' : 'not voted'}</span>
                            }
                        </span>
                    </li>)}
                </ul>}
            </aside>

            <div className='flex flex-col my-auto w-full max-w-2xl p-8 rounded-lg bg-white shadow-lg radius-m'>
                <Form method='post' action={`/session/${session_id}?username=${username}`} onChange={e => submit(e.currentTarget)}>
                    <input name="form_type" defaultValue="update_effort" required hidden />
                    <input name="username" defaultValue={username} required hidden />
                    <input name="votes" defaultValue={JSON.stringify(votes)} required hidden />

                    <fieldset className='grid grid-cols-3 gap-4' id="effort">
                        {['?', '0.5', '1', '2', '3', '5', '8', '13', '20', '40', '100', '☕️'].map((effort: string) => <div key={effort}>
                            <input className='peer sr-only' id={`effort_${effort}`} checked={votes[`${username}`] === effort} type="radio" value={effort} name="effort" required />
                            <label className={`flex justify-center items-center p-6 lg:p-12 rounded-lg cursor-pointer text-xl font-medium bg-gray-100 hover:bg-emerald-200 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:pointer-events-none select-none ${votes[username] === effort && `${typeof window !== 'undefined' ? 'bg-emerald-500' : 'bg-emerald-300'} text-white pointer-events-none`}`} htmlFor={`effort_${effort}`}>{effort}</label>
                        </div>)}
                    </fieldset>
                    <button className='no-js-show w-full p-4 rounded-lg mt-4 bg-emerald-500 text-white'>Submit</button>
                </Form>

                {loaderData?.data?.hostname === username && <>
                    <div className='flex gap-4 mt-12'>
                        <Form className='flex w-full' method='post' action={`/session/${session_id}?username=${username}`}>
                            <input name="form_type" defaultValue="toggle_effort" required hidden />
                            <input name="votes_visible" defaultValue={`${!loaderData.data.votes_visible}`} required hidden />
                            <button className='w-full p-2 rounded-lg bg-emerald-500 text-white uppercase'>Toggle votes</button>
                        </Form>

                        <Form className='flex w-full' method='post' action={`/session/${session_id}?username=${username}`}>
                            <input name="form_type" defaultValue="clear_effort" required hidden />
                            <input name="votes" defaultValue={JSON.stringify(votes)} required hidden />
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

export default Index
