import { ActionFunction, Form, redirect, useActionData, useSearchParams } from "remix";
import { v4 as uuidv4 } from 'uuid';

import { supabase } from "~/utils/supabaseClient";

type ActionData = {
  error?: any
}

export const action: ActionFunction = async ({ request }): Promise<Response | ActionData> => {
  const form = await request.formData();
  const form_type = form.get("form_type") as string;
  const hostname = form.get("hostname") as string;
  const username = form.get("username") as string;
  const session_id = form.get("session_id") as string;

  console.log(session_id);

  switch (form_type) {
    case 'create_session':
      const newSession_id = uuidv4();

      const newSessionData = await supabase
        .from('sessions')
        .insert({ session_id: newSession_id, hostname, votes: { [`${hostname}`]: null } })
        .single()

      return newSessionData.error ? { error: newSessionData.error } : redirect(`/session/${newSession_id}?username=${hostname}`);
    case 'join_session':
      const existingSessionData = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', session_id)
        .single()

      if (existingSessionData.error) {
        return { error: existingSessionData.error }
      }

      if (!existingSessionData.data?.votes[username]) {
        const updatedSessionData = await supabase
          .from('sessions')
          .update({ votes: { ...existingSessionData.data.votes, [`${username}`]: null } })
          .eq('session_id', session_id)

        return updatedSessionData.error ? { error: existingSessionData.error } : redirect(`/session/${session_id}?username=${username}`);
      } else {
        redirect(`/session/${session_id}?username=${username}`)
      }
    default:
      return {};
  }

};

/*** Component ***/
const Index = () => {
  const actionData = useActionData<ActionData>();
  let [searchParams] = useSearchParams();

  const join_session_id = searchParams.get('join_session_id') || ''

  return (
    <main className='h-screen flex justify-center lg:items-center p-4 bg-gradient-to-r from-indigo-500 to-blue-500'>
      <div className='flex flex-col w-full max-w-2xl p-8 rounded-lg bg-white radius-m'>
        {!join_session_id && <>
          <h2 className='text-2xl mb-2 font-thin'>Create new session</h2>
          <Form className='flex flex-col' method="post">
            <input name="form_type" defaultValue="create_session" required hidden />
            <label className='' htmlFor="hostname">Your name</label>
            <input className='my-2 p-4 rounded-lg bg-gray-100' id="hostname" name="hostname" required />
            <button className='p-4 rounded-lg mt-4 bg-indigo-500 text-white'>New session</button>
          </Form>

          <hr className='h-0.5 my-12 bg-gray-100 border-none' />
        </>}

        <h2 className='text-2xl mb-2 font-thin'>Join existing session</h2>
        <Form className='flex flex-col mb-8' method="post">
          <input name="form_type" defaultValue="join_session" required hidden />
          <label className='' htmlFor="session_id">Session ID</label>
          <input className={`my-2 p-4 rounded-lg bg-gray-100 ${!!join_session_id && 'text-gray-500 cursor-not-allowed'}`} defaultValue={join_session_id} id="session_id" name="session_id" readOnly={!!join_session_id} required />
          <label className='' htmlFor="username">Your name</label>
          <input className='my-2 p-4 rounded-lg bg-gray-100' id="username" name="username" autoFocus={!!join_session_id} required />
          <button className='p-4 rounded-lg mt-4 bg-indigo-500 text-white'>Join session</button>
        </Form>

        {actionData?.error && <pre>{JSON.stringify(actionData?.error)}</pre>}
      </div>
    </main >
  );
}

export default Index
