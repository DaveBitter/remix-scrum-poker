// Libs

import { useEffect } from "react";

// Utils
import useShare from "~/hooks/useShare";

// Components

// Type
export type ErrorMessageProps = {
    error?: string;
}

// Component
const ErrorMessage = ({ error }: ErrorMessageProps) => {
    const { triggerShare, showCopiedFeedback } = useShare({ type: 'copy', content: `Error on: ${typeof window !== 'undefined' && window.location.origin}: ${error}` })

    useEffect(() => {
        console.error(`Error on: ${window.location.origin}: ${error}`)
    }, [error])

    return <div className='flex flex-col items-center lg:flex-row fixed w-fit bottom-0 left-1/2 -translate-x-1/2 p-4 rounded-t-lg shadow-lg text-red-500 bg-red-100'>
        <p>Something went wrong, call Dave out <a className='border-b-2 border-red-500 font-bold' href='https://twitter.com/dave_bitter' target='_blank' rel='noopener noreferrer'>on Twitter</a> or <a className='border-b-2 border-red-500 font-bold' href='https://github.com/DaveBitter/remix-scrum-poker/issues' target='_blank' rel='noopener noreferrer'>file an issue</a> on this!</p>
        {error && <button className={`no-js-hide whitespace-nowrap lg:w-32 text-sm mt-2 lg:mt-0 lg:ml-2 p-1 uppercase rounded-lg ${showCopiedFeedback ? 'border-2 border-red-500 bg-red-500 text-white cursor-default' : 'border-2 border-red-500 bg-red-100 text-red-500'}`} disabled={showCopiedFeedback} onClick={triggerShare}>{showCopiedFeedback ? <span>Copied!</span> : <span>copy error</span>}</button>}
    </div>;
};

// Props
ErrorMessage.defaultProps = {
};

export default ErrorMessage;