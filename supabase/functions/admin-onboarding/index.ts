// admin-onboarding v3 – 2026-03-28 – force redeploy with delete_label + delete_artist
import { createClient } from 'npm:@supabase/supabase-js@2'

const FUNCTION_VERSION = 'v3-2026-03-28-force';

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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Check admin
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('account_type')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profile?.account_type !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders })
    }

    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'version': {
        return new Response(JSON.stringify({ _version: FUNCTION_VERSION }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'list_labels': {
        const { data: labels } = await adminClient
          .from('labels')
          .select('id, name, slug, invite_code, is_active, contact_email, onboarding_status, created_at')
          .order('created_at', { ascending: false })

        // Enrich with artist counts
        const enriched = await Promise.all((labels || []).map(async (l: any) => {
          const { data: artists } = await adminClient
            .from('artist_intelligence')
            .select('id, plan_review_status')
            .eq('label_id', l.id)

          const artistCount = artists?.length || 0
          const approvedCount = artists?.filter((a: any) => a.plan_review_status === 'approved').length || 0

          // Check if all pipelines completed
          const { data: jobs } = await adminClient
            .from('deep_research_jobs')
            .select('status')
            .eq('label_id', l.id)

          const allCompleted = jobs && jobs.length > 0 && jobs.every((j: any) => j.status === 'completed' || j.status === 'failed')

          return {
            ...l,
            artist_count: artistCount,
            approved_count: approvedCount,
            all_approved: artistCount > 0 && approvedCount === artistCount,
            all_completed: allCompleted,
          }
        }))

        return new Response(JSON.stringify({ labels: enriched, _version: FUNCTION_VERSION, _action: action }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'label_detail': {
        const { label_id } = body
        if (!label_id) {
          return new Response(JSON.stringify({ error: 'label_id required' }), { status: 400, headers: corsHeaders })
        }

        const { data: label } = await adminClient
          .from('labels')
          .select('*')
          .eq('id', label_id)
          .maybeSingle()

        if (!label) {
          return new Response(JSON.stringify({ error: 'Label not found' }), { status: 404, headers: corsHeaders })
        }

        // Get artist pipelines
        const { data: artists } = await adminClient
          .from('artist_intelligence')
          .select('id, artist_name, artist_handle, plan_review_status')
          .eq('label_id', label_id)

        const pipelines = await Promise.all((artists || []).map(async (a: any) => {
          const { data: jobs } = await adminClient
            .from('deep_research_jobs')
            .select('status, current_phase, completed_phases, total_phases, phases')
            .eq('artist_handle', a.artist_handle)
            .order('created_at', { ascending: false })
            .limit(1)

          const job = jobs?.[0]
          return {
            artist_handle: a.artist_handle,
            artist_name: a.artist_name,
            status: job?.status || 'pending',
            current_phase: job?.current_phase || '',
            completed_phases: job?.completed_phases || 0,
            total_phases: job?.total_phases || 8,
            phases: job?.phases || [],
            plan_review_status: a.plan_review_status || 'pending',
          }
        }))

        return new Response(JSON.stringify({ label, pipelines, _version: FUNCTION_VERSION, _action: action }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'onboard_label': {
        const { label_name, contact_email, artists } = body
        if (!label_name || !contact_email || !artists?.length) {
          return new Response(JSON.stringify({ error: 'label_name, contact_email, and artists required' }), { status: 400, headers: corsHeaders })
        }

        // Create slug and invite code
        const slug = label_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase()

        const { data: label, error: labelErr } = await adminClient
          .from('labels')
          .insert({ name: label_name, slug, invite_code, contact_email, is_active: true, onboarding_status: 'generating' })
          .select()
          .single()

        if (labelErr) {
          return new Response(JSON.stringify({ error: labelErr.message }), { status: 500, headers: corsHeaders })
        }

        // Trigger artist pipelines
        const triggered: string[] = []
        for (const a of artists) {
          try {
            // Create artist_intelligence row
            await adminClient.from('artist_intelligence').insert({
              artist_name: a.artist_name,
              artist_handle: a.artist_handle,
              instagram_handle: a.instagram_handle || null,
              label_id: label.id,
              plan_review_status: 'pending',
            })

            // Trigger research pipeline
            const triggerRes = await fetch(`${supabaseUrl}/functions/v1/trigger-artist-research`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': anonKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                artist_handle: a.artist_handle,
                artist_name: a.artist_name,
                instagram_handle: a.instagram_handle || null,
                label_id: label.id,
                initiated_by: user.id,
              }),
            })

            if (triggerRes.ok) triggered.push(a.artist_handle)
          } catch (e) {
            console.error(`Failed to trigger pipeline for ${a.artist_handle}:`, e)
          }
        }

        return new Response(JSON.stringify({
          label_id: label.id,
          invite_code: label.invite_code,
          label,
          artists_triggered: triggered,
          _version: FUNCTION_VERSION,
          _action: action,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'approve_artist':
      case 'flag_artist': {
        const { artist_handle } = body
        if (!artist_handle) {
          return new Response(JSON.stringify({ error: 'artist_handle required' }), { status: 400, headers: corsHeaders })
        }
        const newStatus = action === 'approve_artist' ? 'approved' : 'needs_changes'
        const { error } = await adminClient
          .from('artist_intelligence')
          .update({ plan_review_status: newStatus })
          .eq('artist_handle', artist_handle)
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
        }
        return new Response(JSON.stringify({ success: true, _version: FUNCTION_VERSION, _action: action }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'go_live': {
        const { label_id } = body
        if (!label_id) {
          return new Response(JSON.stringify({ error: 'label_id required' }), { status: 400, headers: corsHeaders })
        }
        const { error } = await adminClient
          .from('labels')
          .update({ onboarding_status: 'live', is_active: true })
          .eq('id', label_id)
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
        }
        return new Response(JSON.stringify({ success: true, _version: FUNCTION_VERSION, _action: action }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'add_artist': {
        const { label_id, artist_name, artist_handle, instagram_handle } = body
        if (!label_id || !artist_name || !artist_handle) {
          return new Response(JSON.stringify({ error: 'label_id, artist_name, and artist_handle required' }), { status: 400, headers: corsHeaders })
        }

        await adminClient.from('artist_intelligence').insert({
          artist_name,
          artist_handle,
          instagram_handle: instagram_handle || null,
          label_id,
          plan_review_status: 'pending',
        })

        // Trigger research
        await fetch(`${supabaseUrl}/functions/v1/trigger-artist-research`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': anonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artist_handle,
            artist_name,
            instagram_handle: instagram_handle || null,
            label_id,
            initiated_by: user.id,
          }),
        })

        return new Response(JSON.stringify({ success: true, _version: FUNCTION_VERSION, _action: action }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
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
        const { error: delErr } = await adminClient.from('artist_intelligence').delete().eq('artist_handle', artist_handle)
        if (delErr) {
          return new Response(JSON.stringify({ error: delErr.message }), { status: 500, headers: corsHeaders })
        }
        return new Response(JSON.stringify({ success: true, _version: FUNCTION_VERSION, _action: action }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
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

        return new Response(JSON.stringify({
          success: true,
          deleted_artists: deletedArtists?.length || 0,
          _version: FUNCTION_VERSION,
          _action: action,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action', _version: FUNCTION_VERSION }), { status: 400, headers: corsHeaders })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message, _version: FUNCTION_VERSION }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
