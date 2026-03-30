// admin-data v5 – 2026-03-28T19:30:00Z – force redeploy with version in check_admin
// actions: check_admin, version, plan_review, all_artists, all_labels, set_plan_status,
//          create_label, update_label, delete_artist, delete_label
const FUNCTION_VERSION = 'v5-2026-03-28T19:30';
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const userId = user.id

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Check admin via user_profiles.account_type
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('account_type')
      .eq('user_id', userId)
      .maybeSingle()

    const body = await req.json()
    const { action } = body
    let result: any = {}

    // version action – no auth required beyond valid token
    if (action === 'version') {
      return new Response(JSON.stringify({ _version: FUNCTION_VERSION }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // check_admin returns admin status without requiring admin access
    if (action === 'check_admin') {
      return new Response(JSON.stringify({ is_admin: profile?.account_type === 'admin', _version: FUNCTION_VERSION }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // All other actions require admin
    if (profile?.account_type !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
    }

    switch (action) {
      case 'plan_review': {
        const { data: artists } = await adminClient
          .from('artist_intelligence')
          .select('artist_handle, artist_name, avatar_url, label_id, updated_at, plan_review_status, content_plan_html, intelligence_report_html, content_plan_30d_html, artist_brief_html, status')
          .not('content_plan_html', 'is', null)
          .order('updated_at', { ascending: false })

        // Get all label_ids and fetch labels
        const labelIds = [...new Set((artists || []).map((a: any) => a.label_id).filter(Boolean))]
        let labelsMap: Record<string, string> = {}
        if (labelIds.length > 0) {
          const { data: labels } = await adminClient
            .from('labels')
            .select('id, name')
            .in('id', labelIds)
          labels?.forEach((l: any) => { labelsMap[l.id] = l.name })
        }

        result = {
          artists: (artists || []).map((a: any) => ({
            ...a,
            label_name: labelsMap[a.label_id] || 'Unknown',
          })),
        }
        break
      }

      case 'all_artists': {
        const { data: artists } = await adminClient
          .from('artist_intelligence')
          .select('id, artist_handle, artist_name, avatar_url, label_id, status, tiktok_followers, spotify_monthly_listeners, invite_code, updated_at')
          .order('artist_name')

        const labelIds = [...new Set((artists || []).map((a: any) => a.label_id).filter(Boolean))]
        let labelsMap: Record<string, string> = {}
        if (labelIds.length > 0) {
          const { data: labels } = await adminClient
            .from('labels')
            .select('id, name')
            .in('id', labelIds)
          labels?.forEach((l: any) => { labelsMap[l.id] = l.name })
        }

        // Get latest pipeline status per artist
        const handles = (artists || []).map((a: any) => a.artist_handle).filter(Boolean)
        let pipelineMap: Record<string, { status: string; created_at: string }> = {}
        if (handles.length > 0) {
          const { data: jobs } = await adminClient
            .from('deep_research_jobs')
            .select('artist_handle, status, created_at')
            .in('artist_handle', handles)
            .order('created_at', { ascending: false })
          jobs?.forEach((j: any) => {
            if (!pipelineMap[j.artist_handle]) {
              pipelineMap[j.artist_handle] = { status: j.status, created_at: j.created_at }
            }
          })
        }

        result = {
          artists: (artists || []).map((a: any) => ({
            ...a,
            label_name: labelsMap[a.label_id] || 'Unknown',
            pipeline_status: pipelineMap[a.artist_handle]?.status || null,
            pipeline_date: pipelineMap[a.artist_handle]?.created_at || null,
          })),
        }
        break
      }

      case 'all_labels': {
        const { data: labels } = await adminClient
          .from('labels')
          .select('id, name, slug, invite_code, is_active, logo_url, created_at')
          .order('name')

        // Count artists per label
        const { data: artistCounts } = await adminClient
          .from('artist_intelligence')
          .select('label_id')

        const countMap: Record<string, number> = {}
        artistCounts?.forEach((a: any) => {
          if (a.label_id) countMap[a.label_id] = (countMap[a.label_id] || 0) + 1
        })

        // Get artists per label for expandable rows
        const { data: allArtists } = await adminClient
          .from('artist_intelligence')
          .select('artist_handle, artist_name, avatar_url, label_id, status')
          .order('artist_name')

        const artistsByLabel: Record<string, any[]> = {}
        allArtists?.forEach((a: any) => {
          if (a.label_id) {
            if (!artistsByLabel[a.label_id]) artistsByLabel[a.label_id] = []
            artistsByLabel[a.label_id].push(a)
          }
        })

        result = {
          labels: (labels || []).map((l: any) => ({
            ...l,
            artist_count: countMap[l.id] || 0,
            artists: artistsByLabel[l.id] || [],
          })),
        }
        break
      }

      case 'set_plan_status': {
        const { artist_handle, status: newStatus } = body
        if (!artist_handle || !newStatus) {
          return new Response(JSON.stringify({ error: 'artist_handle and status required' }), { status: 400, headers: corsHeaders })
        }
        const { error } = await adminClient
          .from('artist_intelligence')
          .update({ plan_review_status: newStatus })
          .eq('artist_handle', artist_handle)
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
        }
        result = { success: true }
        break
      }

      case 'create_label': {
        const { name, slug, invite_code, is_active } = body
        if (!name || !slug) {
          return new Response(JSON.stringify({ error: 'name and slug required' }), { status: 400, headers: corsHeaders })
        }
        const { data, error } = await adminClient
          .from('labels')
          .insert({ name, slug, invite_code: invite_code || null, is_active: is_active ?? true })
          .select()
          .single()
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
        }
        result = { label: data }
        break
      }

      case 'update_label': {
        const { id, ...updates } = body
        if (!id) {
          return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: corsHeaders })
        }
        const { error } = await adminClient
          .from('labels')
          .update(updates)
          .eq('id', id)
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
        }
        result = { success: true }
        break
      }

      case 'delete_artist': {
        const { artist_handle, confirm_handle } = body
        if (!artist_handle || !confirm_handle) {
          return new Response(JSON.stringify({ error: 'artist_handle and confirm_handle required' }), { status: 400, headers: corsHeaders })
        }
        if (artist_handle !== confirm_handle) {
          return new Response(JSON.stringify({ error: 'Handle does not match' }), { status: 400, headers: corsHeaders })
        }

        await adminClient.from('deep_research_jobs').delete().eq('artist_handle', artist_handle)
        const { error: delErr2 } = await adminClient.from('artist_intelligence').delete().eq('artist_handle', artist_handle)
        if (delErr2) {
          return new Response(JSON.stringify({ error: delErr2.message }), { status: 500, headers: corsHeaders })
        }
        result = { success: true }
        break
      }

      case 'delete_label': {
        const { label_id, confirm_name } = body
        if (!label_id || !confirm_name) {
          return new Response(JSON.stringify({ error: 'label_id and confirm_name required' }), { status: 400, headers: corsHeaders })
        }

        // Verify label exists and name matches
        const { data: label } = await adminClient
          .from('labels')
          .select('id, name')
          .eq('id', label_id)
          .maybeSingle()

        if (!label) {
          return new Response(JSON.stringify({ error: 'Label not found' }), { status: 404, headers: corsHeaders })
        }
        if (label.name !== confirm_name) {
          return new Response(JSON.stringify({ error: 'Label name does not match' }), { status: 400, headers: corsHeaders })
        }

        // Delete all artist_intelligence rows for this label
        const { data: deletedArtists } = await adminClient
          .from('artist_intelligence')
          .delete()
          .eq('label_id', label_id)
          .select('id')

        // Delete all deep_research_jobs for this label
        await adminClient
          .from('deep_research_jobs')
          .delete()
          .eq('label_id', label_id)

        // Unlink user_profiles from this label
        await adminClient
          .from('user_profiles')
          .update({ label_id: null })
          .eq('label_id', label_id)

        // Delete the label itself
        const { error: delErr } = await adminClient
          .from('labels')
          .delete()
          .eq('id', label_id)

        if (delErr) {
          return new Response(JSON.stringify({ error: delErr.message }), { status: 500, headers: corsHeaders })
        }

        result = { success: true, deleted_artists: deletedArtists?.length || 0 }
        break
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ ...result, _version: FUNCTION_VERSION, _action: action }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
