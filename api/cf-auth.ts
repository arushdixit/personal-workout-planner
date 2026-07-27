import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
    // 1. Extract Cloudflare Access Email header
    const cfEmail = req.headers['cf-access-authenticated-user-email'];

    if (!cfEmail || typeof cfEmail !== 'string') {
        return res.status(200).json({
            authenticated: false,
            message: 'No Cloudflare Access user header detected.',
        });
    }

    const email = cfEmail.toLowerCase().trim();

    // 2. Read environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[CF-Auth Error] Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL');
        return res.status(500).json({
            error: 'Server configuration missing: SUPABASE_SERVICE_ROLE_KEY environment variable is required.',
        });
    }

    // 3. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    try {
        // 4. Look up existing user by email to ensure exact User ID preservation
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        let user = users?.find(u => u.email?.toLowerCase() === email);

        // 5. If user does not exist yet in Supabase Auth, create user profile
        if (!user) {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                email_confirm: true,
                user_metadata: { name: email.split('@')[0] },
            });
            if (createError) throw createError;
            user = newUser.user;
        }

        // 6. Build target redirect URL back to the frontend domain
        const host = req.headers['host'] || 'fitness.arushpamouli.com';
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const redirectTo = `${protocol}://${host}/`;

        // 7. Generate magic link session for exact user
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: redirectTo,
            },
        });

        if (linkError) throw linkError;

        const actionLink = linkData?.properties?.action_link;
        if (actionLink) {
            // 8. Redirect user browser to Supabase session verification link
            return res.redirect(302, actionLink);
        } else {
            return res.status(500).json({ error: 'Failed to generate session link' });
        }
    } catch (err: any) {
        console.error('[CF-Auth Server Exception]:', err);
        return res.status(500).json({ error: err.message || 'Authentication pass-through failed' });
    }
}
