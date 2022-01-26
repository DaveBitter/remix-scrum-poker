import { Fragment, useEffect, useRef, useState } from "react";
import { ActionFunction, Form, LoaderFunction, useLoaderData, useParams, useSearchParams } from "remix";

import { supabase } from "~/utils/supabaseClient";

export const loader: LoaderFunction = async ({ params }) => {
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
                .update({ votes: updatedVotes })
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

    let { session_id } = useParams();
    let [searchParams] = useSearchParams();
    const username = searchParams.get('username') || ''

    const formRef = useRef<null | HTMLFormElement>(null);
    const handleFormChange = () => {
        formRef?.current?.submit();
    }

    const [votes, setVotes] = useState(loaderData?.data?.votes)
    const [votesVisible, setVotesVisible] = useState(loaderData?.data?.votes)
    useEffect(() => {
        const subscription = supabase
            .from(`sessions:session_id=eq.${session_id}`)
            .on('UPDATE', payload => {
                console.log(payload?.new?.votes)
                setVotes(payload?.new?.votes)
                setVotesVisible(payload?.new?.votes_visible)
            })
            .subscribe()

        return () => {
            subscription.unsubscribe();
        }
    }, []);


    return (
        <main className='h-screen'>
            <h1>Session {session_id}</h1>

            <Form ref={formRef} method='post' action={`/session/${session_id}?username=${username}`} onChange={handleFormChange}>
                <input name="form_type" defaultValue="update_effort" required hidden />
                <input name="username" defaultValue={username} required hidden />
                <input name="votes" defaultValue={JSON.stringify(votes)} required hidden />

                <fieldset id="effort">
                    {['?', '0.5', '1', '2', '3', '5', '8', '13', '20', '40', '100'].map((effort: string) => <Fragment key={effort}>
                        <label htmlFor={`effort_${effort}`}>{effort}</label>
                        <input id={`effort_${effort}`} defaultChecked={votes[`${username}`] === effort} type="radio" value={effort} name="effort" required />
                    </Fragment>)}
                </fieldset>
                <button type='submit'>Submit</button>
            </Form>

            {loaderData?.data?.hostname === username && <Form method='post' action={`/session/${session_id}?username=${username}`}>
                <input name="form_type" defaultValue="toggle_effort" required hidden />
                <input name="votes_visible" defaultValue={`${!loaderData.data.votes_visible}`} required hidden />
                <button type='submit'>TOGGLE VOTES</button>
            </Form>}

            {loaderData?.data?.hostname === username && <Form method='post' action={`/session/${session_id}?username=${username}`}>
                <input name="form_type" defaultValue="clear_effort" required hidden />
                <input name="votes" defaultValue={JSON.stringify(votes)} required hidden />
                <button type='submit'>CLEAR VOTES</button>
            </Form>}


            <aside>
                {votes && <ul>
                    {Object.keys(loaderData.data.votes).map((key: string) => <li key={key}>{key} {votesVisible && votes[key]}</li>)}
                </ul>}
            </aside>
        </main >
    );
}

export default Index
