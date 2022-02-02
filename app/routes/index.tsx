// Libs
import { Form, useActionData, useSearchParams } from "remix";

// Utils
import ErrorMessage from "~/components/ErrorMessage/ErrorMessage";

// Components
import { indexAction, IndexActionData } from "~/actionFunctions";

export const action = indexAction;

// Page
const Index = () => {
  const actionData = useActionData<IndexActionData>();
  let [searchParams] = useSearchParams();

  const join_session_id = searchParams.get('join_session_id') || ''

  return (
    <main className='h-screen flex flex-col justify-center lg:items-center p-4 bg-gray-50'>

      <div className='flex flex-col w-full max-w-2xl p-8 rounded-lg radius-m bg-white shadow-lg'>
        <img className='box-content w-12 h-12 mb-8 lg:mb-12 mx-auto' src='/img/logo.png' />

        {!join_session_id && <>
          <h2 className='text-2xl mb-2 font-thin'>Create new session</h2>
          <Form className='flex flex-col' method="post">
            <input name="form_type" defaultValue="create_session" required hidden />
            <label className='' htmlFor="username">Your name</label>
            <input className='my-2 p-4 rounded-lg bg-gray-100' id="username" name="username" autoFocus={!join_session_id} required />
            <button className='p-4 rounded-lg mt-4 uppercase bg-emerald-500 text-white'>New session</button>
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
          <button className='p-4 rounded-lg mt-4 uppercase bg-emerald-500 text-white'>Join session</button>
        </Form>

      </div>
      {actionData?.error && <ErrorMessage error={actionData.error} />}
    </main >
  );
}

export default Index
