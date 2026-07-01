import { withSupabase } from "@supabase/server";

export default {
    fetch: withSupabase({ auth: "none" }, async (_req, ctx) => {
        // Because auth is "none", verify_jwt is disabled in config.toml for this edge function.
        
        // Example: Reading data using the RLS-scoped client
        // (Even with auth: "none", the client is available, but it will act as an anonymous user).
        // If you need admin privileges, use ctx.supabaseAdmin instead.
        const { data, error } = await ctx.supabase.from("nodes").select("*").limit(5);
        
        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        return new Response(JSON.stringify({
            message: "Hello from Supabase Edge Functions!",
            nodes: data
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    })
};
