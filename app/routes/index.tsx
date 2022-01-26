import { ActionFunction, Form, redirect, useActionData } from "remix";
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

  return (
    <main className='h-screen'>
      <h1>Scrum Poker</h1>

      <h2>Create new session</h2>
      <Form method="post">
        <input name="form_type" defaultValue="create_session" required hidden />
        <label htmlFor="hostname">Your name</label>
        <input id="hostname" name="hostname" required />
        <button>New session</button>
      </Form>

      <h2>Join existing session</h2>
      <Form method="post">
        <input name="form_type" defaultValue="join_session" required hidden />
        <label htmlFor="session_id">Session ID</label>
        <input id="session_id" name="session_id" required />
        <label htmlFor="username">Your name</label>
        <input id="username" name="username" required />
        <button type='submit'>Join session</button>
      </Form>

      {actionData?.error && <pre>{JSON.stringify(actionData?.error)}</pre>}
    </main >
  );
}

export default Index
