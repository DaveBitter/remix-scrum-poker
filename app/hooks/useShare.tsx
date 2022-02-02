// Libs
import { useState } from "react";

// Utils

// Type
export type UseShareType = {
    type: 'copy' | 'share';
    content: string;
}

// Component
const useShare = ({ type, content }: UseShareType) => {
    const [usedShareType, setUsedShareType] = useState<UseShareType['type']>(type);
    const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);

    const triggerShare = () => {
        const triggerCopyToClipboard = () => {
            setUsedShareType('copy');

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
            if (!window.navigator['share']) {
                setUsedShareType('copy');

                triggerCopyToClipboard()
            } else {
                setUsedShareType('share');

                window.navigator['share']({
                    url: content
                });
            }
        };

        switch (type) {
            case 'share':
                triggerNativeShare();
            default:
                triggerCopyToClipboard();
                break;
        }
    }
    return { usedShareType, triggerShare, showCopiedFeedback }
};

// Props
useShare.defaultProps = {
    type: 'copy'
};

export default useShare;