// Libs
import { createClient, SupabaseRealtimePayload } from "@supabase/supabase-js";
import { useEffect } from "react";

// Utils
// import { supabaseBrowserClient } from "~/utils/supabaseClient";

// Component
const useSupabaseSubscription = (SUPABASE_URL: string, SUPABASE_ANON_KEY: string, query: string, cb: (payload: SupabaseRealtimePayload<any>) => void) => {
    useEffect(() => {
        const subscription = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '')
            .from(query)
            .on('*', cb)
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, []);
};

export default useSupabaseSubscription;