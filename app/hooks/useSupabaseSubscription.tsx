// Libs
import { useEffect } from "react";

// Utils
import { supabase } from "~/utils/supabaseClient";

// Component
const useSupabaseSubscription = (query: string, cb: () => void) => {
    useEffect(() => {
        const subscription = supabase
            .from(query)
            .on('*', cb)
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, []);
};

export default useSupabaseSubscription;