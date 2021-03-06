// Libs
import { useEffect, useRef, useState } from "react";
import { Form, Link, useActionData, useFetcher, useLoaderData, useSubmit, useTransition } from "remix";
import { SupabaseRealtimePayload } from "@supabase/supabase-js";

// Utils
import { sessionIDAction, SessionIDActionData } from "~/actionFunctions/$session_id";
import { sessionIDLoader, SessionIDLoaderData } from "~/loaderFunctions/$session_id";

// Components
import ErrorMessage from "~/components/ErrorMessage/ErrorMessage";
import useSupabaseSubscription from "~/hooks/useSupabaseSubscription";
import useShare from "~/hooks/useShare";
import throttle from "~/utils/throttle";
import debounce from "~/utils/debounce";

// Page
export const loader = sessionIDLoader
export const action = sessionIDAction;

const throttler = (cb: () => void) => throttle(cb, 500)
const debouncer = (cb: () => void) => debounce(cb, 1000)

const Session = () => {
    const loaderData = useLoaderData<SessionIDLoaderData>();
    const actionData = useActionData<SessionIDActionData>();
    const [optimisticVote, setOptimisticVote] = useState<null | string>();
    const submit = useSubmit();
    const fetcher = useFetcher();
    const transition = useTransition()
    const votesFormRef = useRef<null | HTMLFormElement>(null)

    const handleVotesUpdate = (payload: SupabaseRealtimePayload<any>) => {
        const isClearingMyEffort = payload.new?.username === user?.username && !payload.new.effort;

        if (isClearingMyEffort) {
            setOptimisticVote(null);
            votesFormRef.current?.reset();
        }

        throttler(() => fetcher.load(window.location.pathname))
    }

    loaderData?.session_id && useSupabaseSubscription(
        loaderData?.SUPABASE_URL || '',
        loaderData?.SUPABASE_ANON_KEY || '',
        `sessions:session_id=eq.${loaderData?.session_id}`,
        () => throttler(() => fetcher.load(window.location.pathname)));
    loaderData?.session_id && useSupabaseSubscription(
        loaderData?.SUPABASE_URL || '',
        loaderData?.SUPABASE_ANON_KEY || '',
        `votes:session_id=eq.${loaderData?.session_id}`,
        (payload: SupabaseRealtimePayload<any>) => handleVotesUpdate(payload));
    const { usedShareType, triggerShare, showCopiedFeedback } = useShare({ type: 'share', content: `${typeof window !== 'undefined' && window.location.origin}/?join_session_id=${loaderData?.session_id}` })

    const error = loaderData?.error || actionData?.error;
    const user = loaderData?.user;
    const votes = fetcher?.data?.votes || loaderData?.votes;
    const votesVisible = fetcher?.data?.votes_visible || loaderData?.votes_visible;
    const usersNotVoted = Object.keys(votes).filter(key => !votes[key]);
    const activeUserEffort = optimisticVote || votes[`${user?.username}`];

    useEffect(() => {
        switch (transition.state) {
            case 'submitting':
                const effort = transition?.submission?.formData.get('effort');
                const form_type = transition?.submission?.formData.get('form_type');
                form_type === 'update_effort' && user?.username && effort && setOptimisticVote(effort as string);

                if (form_type === 'clear_effort') {
                    setOptimisticVote(null);
                    votesFormRef.current?.reset();
                }
                break;
            case 'idle':
                debouncer(() => setOptimisticVote(null))
                break;
            default:
                break;
        }
    }, [transition.state]);

    return (
        <main className='flex flex-col justify-between items-center min-h-screen p-4 pt-0 bg-gray-50'>
            <aside className="flex items-center w-screen p-4 -mx-4 rounded-b-lg bg-white shadow-lg">
                <div className='relative'>
                    <img className='box-content w-12 h-12 mr-2 pr-2 border-r-2 border-gray-200' src='/img/logo.png' />
                    <Link className='absolute top-0 right-0 bottom-0 left-0' style={{ fontSize: 0 }} to='/' target='__blank'>Back to overview</Link>
                </div>

                {votes && <ul className='flex gap-8 pl-2 w-full overflow-x-auto'>
                    {Object.keys(votes).sort().map((key: string) => <li className={`flex flex-col flex-1 justify-center align-center text-center ${loaderData?.hostname === key && '-order-1'}`} key={key}>
                        <span className='text-lg font-thin'>{key}
                            {loaderData?.hostname === key && <span className='py-1 px-2 ml-2 rounded-lg text-xs font-medium bg-emerald-500 text-white'>host</span>}
                            {loaderData?.user?.username === key && <span className='py-1 px-2 ml-2 rounded-lg text-xs font-medium bg-gray-200 text-gray-500'>you</span>}
                        </span>
                        <span className='text-xl lg:text-2xl font-medium whitespace-nowrap	'>
                            {votesVisible ? <span className={votes[key] ? 'text-emerald-500' : 'text-gray-300'}>{votes[key] || '-'}</span> :
                                <span className={votes[key] ? 'text-emerald-500' : 'text-gray-300'}>{votes[key] ? 'voted' : 'not voted'}</span>
                            }
                        </span>
                    </li>)}
                </ul>}
            </aside>

            <div className='flex flex-col w-full max-w-2xl my-12 p-8 rounded-lg bg-white shadow-lg radius-m'>
                {votesVisible ?
                    <p className='mx-auto py-1 px-2 mb-4 rounded-lg bg-emerald-500 text-white'>discuss differences</p> :
                    !!usersNotVoted.length ?
                        <p className='mx-auto py-1 px-2 mb-4 rounded-lg bg-gray-100 text-gray-500'>waiting on <span className='text-emerald-500'>{usersNotVoted.length === 1 ? usersNotVoted[0] : `${usersNotVoted.length} people`}</span></p> :
                        <p className='mx-auto py-1 px-2 mb-4 rounded-lg bg-emerald-500 text-white'>everybody voted!</p>}

                <Form ref={votesFormRef} method='post' onChange={e => submit(e.currentTarget)}>
                    <input name="form_type" defaultValue="update_effort" required hidden />

                    <fieldset className='grid grid-cols-3 gap-4' id="effort">
                        {['?', '0.5', '1', '2', '3', '5', '8', '13', '20', '40', '100', '??????'].map((effort: string) => <div key={effort}>
                            <input className='peer sr-only' id={`effort_${effort}`} checked={effort === activeUserEffort} onChange={() => { }} type="radio" value={effort} name="effort" required />
                            <label className={`flex justify-center items-center p-6 lg:p-12 rounded-lg cursor-pointer text-xl font-medium bg-gray-100 hover:bg-emerald-200 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:pointer-events-none select-none ${activeUserEffort === effort && `${typeof window !== 'undefined' ? 'bg-emerald-500' : 'bg-emerald-300'} text-white pointer-events-none`}`} htmlFor={`effort_${effort}`}>{effort}</label>
                        </div>)}
                    </fieldset>
                    <button className='no-js-show w-full p-4 rounded-lg mt-4 bg-emerald-500 text-white'>Submit</button>
                </Form>

                {user?.isHost && <>
                    <div className='flex gap-4 mt-12'>
                        <Form className='flex w-full' method='post'>
                            <input name="form_type" defaultValue="toggle_effort" required hidden />
                            <button className='w-full p-2 rounded-lg bg-emerald-500 text-white uppercase'>{votesVisible ? 'hide' : 'show'} votes</button>
                        </Form>

                        <Form className='flex w-full' method='post'>
                            <input name="form_type" defaultValue="clear_effort" required hidden />
                            <button className='w-full p-2 rounded-lg bg-gray-200 uppercase'>Clear votes</button>
                        </Form>
                    </div>
                </>}
            </div>

            <footer className='flex items-center w-full lg:max-w-sm p-4 -mb-4 rounded-t-lg bg-white shadow-lg'>
                <p className='text-sm'><span className='text-gray-400 select-none'>Session </span><span className='font-mono text-emerald-400'>{loaderData?.session_id}</span></p>
                <button className={`no-js-hide whitespace-nowrap w-32 text-sm ml-auto p-2 uppercase rounded-lg ${showCopiedFeedback ? 'bg-emerald-500 text-white cursor-default' : 'bg-emerald-100 text-emerald-600'}`} disabled={showCopiedFeedback} onClick={triggerShare}>{showCopiedFeedback ? <span>Copied!</span> : <span>{usedShareType} invite</span>}</button>
            </footer>
            {error && <ErrorMessage error={error} />}
        </main>
    );
}

export default Session
