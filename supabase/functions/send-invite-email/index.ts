import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function renderInviteEmailHtml(opts: { workspaceName: string; role: string; link: string }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <p style="font-size: 15px; color: #0a0a0a; margin: 0 0 16px;">
        You've been invited to join <strong>${opts.workspaceName}</strong> on Onward as ${opts.role === "admin" ? "an admin" : "a member"}.
      </p>
      <a href="${opts.link}"
         style="display: inline-block; background: #171717; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 6px; margin: 8px 0 20px;">
        Accept invite
      </a>
      <p style="font-size: 13px; color: #737373; margin: 0;">
        If you weren't expecting this, you can ignore this email.
      </p>
    </div>
  `
}

function renderInviteEmailText(opts: { workspaceName: string; role: string; link: string }) {
  return [
    `You've been invited to join ${opts.workspaceName} on Onward as ${opts.role === "admin" ? "an admin" : "a member"}.`,
    "",
    `Accept your invite: ${opts.link}`,
    "",
    "If you weren't expecting this, you can ignore this email.",
  ].join("\n")
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { inviteId } = await req.json()
    if (!inviteId) {
      return new Response(JSON.stringify({ error: "inviteId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!

    // Forwards the caller's own JWT — RLS only returns a row here if the
    // caller is actually an owner/admin of the invite's workspace, so this
    // select doubles as the authorization check.
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: invite, error: inviteErr } = await supabaseUser
      .from("invites")
      .select("id, email, role, workspace_id, workspaces(name)")
      .eq("id", inviteId)
      .single()

    if (inviteErr || !invite) {
      console.error("invites select failed", { inviteId, inviteErr })
      return new Response(
        JSON.stringify({
          error: inviteErr
            ? `Invite lookup failed: ${inviteErr.message} (${inviteErr.code ?? "no code"})`
            : "Invite not found or not permitted",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

    const siteUrl = Deno.env.get("SITE_URL") ?? "https://onward.cx"
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: invite.email,
      options: { redirectTo: `${siteUrl}/auth/callback?invite=${invite.id}` },
    })

    if (linkErr || !linkData) {
      return new Response(JSON.stringify({ error: linkErr?.message ?? "Failed to generate link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const workspaceName = (invite.workspaces as unknown as { name: string } | null)?.name ?? "Onward"

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Onward <invites@onward.cx>",
        to: invite.email,
        subject: `You've been invited to join ${workspaceName} on Onward`,
        html: renderInviteEmailHtml({
          workspaceName,
          role: invite.role,
          link: linkData.properties.action_link,
        }),
        text: renderInviteEmailText({
          workspaceName,
          role: invite.role,
          link: linkData.properties.action_link,
        }),
      }),
    })

    if (!resendRes.ok) {
      const body = await resendRes.text()
      return new Response(JSON.stringify({ error: `Resend error: ${body}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
