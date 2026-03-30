// Admin stats edge function — v5
// Force redeploy: 2026-02-16T20:15Z
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
    // Verify admin
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

    const { data: { user: callingUser }, error: userError } = await userClient.auth.getUser()
    if (userError || !callingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const userId = callingUser.id

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: isAdmin } = await adminClient.rpc('has_role', { _user_id: userId, _role: 'admin' })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
    }

    const { action, filters } = await req.json()

    let result: any = {}

    switch (action) {
      case 'overview': {
        const { data: users } = await adminClient.auth.admin.listUsers({ perPage: 1, page: 1 })
        const totalUsers = users?.total ?? 0

        const now = new Date()
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

        const { data: dauData } = await adminClient
          .from('user_activity')
          .select('user_id')
          .gte('created_at', dayAgo)
        const dau = new Set(dauData?.map(r => r.user_id)).size

        const { data: wauData } = await adminClient
          .from('user_activity')
          .select('user_id')
          .gte('created_at', weekAgo)
        const wau = new Set(wauData?.map(r => r.user_id)).size

        const { count: totalChats } = await adminClient
          .from('chat_sessions')
          .select('*', { count: 'exact', head: true })

        const { count: totalVideos } = await adminClient
          .from('user_activity')
          .select('*', { count: 'exact', head: true })
          .eq('action', 'video_viewed')

        // Signups in last 7 days — paginate through all users
        let signups7d = 0
        let signupPage = 1
        while (true) {
          const { data: pageData } = await adminClient.auth.admin.listUsers({ perPage: 1000, page: signupPage })
          const pageUsers = pageData?.users ?? []
          if (pageUsers.length === 0) break
          signups7d += pageUsers.filter(u => new Date(u.created_at) >= new Date(weekAgo)).length
          if (pageUsers.length < 1000) break
          signupPage++
        }

        // Avg messages per chat
        const { count: totalMessages } = await adminClient
          .from('user_activity')
          .select('*', { count: 'exact', head: true })
          .eq('action', 'message_sent')
        const avgMessagesPerChat = (totalChats && totalChats > 0) ? Math.round(((totalMessages ?? 0) / totalChats) * 10) / 10 : 0

        // Power users (10+ actions in last 7 days)
        const { data: weekActivity } = await adminClient
          .from('user_activity')
          .select('user_id')
          .gte('created_at', weekAgo)
        const userActionCounts: Record<string, number> = {}
        weekActivity?.forEach(a => {
          userActionCounts[a.user_id] = (userActionCounts[a.user_id] || 0) + 1
        })
        const powerUsers7d = Object.values(userActionCounts).filter(c => c >= 10).length

        // Plan type breakdown from user_analysis_usage
        const { data: analysisUsage } = await adminClient
          .from('user_analysis_usage')
          .select('analysis_type')
        const plansByType: Record<string, number> = { audio: 0, video: 0, favorite: 0 }
        analysisUsage?.forEach(row => {
          const t = (row.analysis_type || '').toLowerCase()
          if (t.includes('audio')) plansByType.audio++
          else if (t.includes('favorite') || t.includes('fav')) plansByType.favorite++
          else if (t.includes('video')) plansByType.video++
        })

        result = {
          totalUsers,
          dau,
          wau,
          dauWauRatio: wau > 0 ? Math.round((dau / wau) * 100) / 100 : 0,
          totalChats: totalChats ?? 0,
          totalVideos: totalVideos ?? 0,
          signups7d,
          avgMessagesPerChat,
          powerUsers7d,
          plansAudio: plansByType.audio,
          plansVideo: plansByType.video,
          plansFavorite: plansByType.favorite,
          plansTotal: (plansByType.audio + plansByType.video + plansByType.favorite),
        }
        break
      }

      case 'signup_growth': {
        const { data: allUsersData } = await adminClient.auth.admin.listUsers({ perPage: 1000, page: 1 })
        const allUsers = allUsersData?.users ?? []

        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Count signups per day for last 30 days
        const dailySignups: Record<string, number> = {}
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now)
          d.setDate(d.getDate() - i)
          dailySignups[d.toISOString().split('T')[0]] = 0
        }

        allUsers.forEach(u => {
          const day = u.created_at.split('T')[0]
          if (dailySignups.hasOwnProperty(day)) {
            dailySignups[day]++
          }
        })

        // Calculate cumulative
        const totalBefore = allUsers.filter(u => new Date(u.created_at) < thirtyDaysAgo).length
        let cumulative = totalBefore
        const days = Object.entries(dailySignups)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, signups]) => {
            cumulative += signups
            return { date, signups, cumulative }
          })

        result = { days }
        break
      }

      case 'user_breakdown': {
        const { data: profiles } = await adminClient
          .from('user_profiles')
          .select('account_type, creator_role, genres')

        const typeCounts: Record<string, number> = {}
        const genreCounts: Record<string, number> = {}
        const roleCounts: Record<string, number> = {}

        profiles?.forEach(p => {
          const t = p.account_type || 'Unknown'
          typeCounts[t] = (typeCounts[t] || 0) + 1
          const r = p.creator_role || 'Unknown'
          roleCounts[r] = (roleCounts[r] || 0) + 1
          if (p.genres && Array.isArray(p.genres)) {
            p.genres.forEach((g: string) => {
              genreCounts[g] = (genreCounts[g] || 0) + 1
            })
          }
        })

        result = {
          typeDistribution: Object.entries(typeCounts).map(([name, value]) => ({ name, value })),
          genreDistribution: Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([name, value]) => ({ name, value })),
          roleDistribution: Object.entries(roleCounts).map(([name, value]) => ({ name, value })),
        }
        break
      }

      case 'funnel': {
        const { data: allUsers } = await adminClient.auth.admin.listUsers({ perPage: 1, page: 1 })
        const signedUp = allUsers?.total ?? 0

        const { count: completedOnboarding } = await adminClient
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })

        const { count: appliedFilters } = await adminClient
          .from('user_activity')
          .select('user_id', { count: 'exact', head: true })
          .eq('action', 'filter_applied')

        const { count: viewedVideo } = await adminClient
          .from('user_activity')
          .select('user_id', { count: 'exact', head: true })
          .eq('action', 'video_viewed')

        const { count: openedChat } = await adminClient
          .from('user_activity')
          .select('user_id', { count: 'exact', head: true })
          .eq('action', 'ai_chat_started')

        const { count: sentMessage } = await adminClient
          .from('user_activity')
          .select('user_id', { count: 'exact', head: true })
          .eq('action', 'message_sent')

        const { count: generatedPlan } = await adminClient
          .from('user_activity')
          .select('user_id', { count: 'exact', head: true })
          .eq('action', 'content_plan_generated')

        result = {
          steps: [
            { name: 'Signed Up', count: signedUp },
            { name: 'Completed Onboarding', count: completedOnboarding ?? 0 },
            { name: 'Applied Filters', count: appliedFilters ?? 0 },
            { name: 'Viewed Video', count: viewedVideo ?? 0 },
            { name: 'Opened AI Chat', count: openedChat ?? 0 },
            { name: 'Sent Message', count: sentMessage ?? 0 },
            { name: 'Generated Plan', count: generatedPlan ?? 0 },
          ],
        }
        break
      }

      case 'retention': {
        const { data: allUsersData } = await adminClient.auth.admin.listUsers({ perPage: 1000, page: 1 })
        const users = allUsersData?.users ?? []

        const { data: activity } = await adminClient
          .from('user_activity')
          .select('user_id, created_at')
          .order('created_at', { ascending: true })

        const cohorts: Record<string, { total: number; weeks: Record<number, Set<string>> }> = {}

        users.forEach(user => {
          const created = new Date(user.created_at)
          const weekStart = new Date(created)
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          const cohortKey = weekStart.toISOString().split('T')[0]

          if (!cohorts[cohortKey]) {
            cohorts[cohortKey] = { total: 0, weeks: {} }
          }
          cohorts[cohortKey].total++
        })

        activity?.forEach(a => {
          const user = users.find(u => u.id === a.user_id)
          if (!user) return
          const created = new Date(user.created_at)
          const weekStart = new Date(created)
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          const cohortKey = weekStart.toISOString().split('T')[0]

          const actDate = new Date(a.created_at)
          const weekNum = Math.floor((actDate.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))

          if (weekNum >= 0 && weekNum <= 4 && cohorts[cohortKey]) {
            if (!cohorts[cohortKey].weeks[weekNum]) {
              cohorts[cohortKey].weeks[weekNum] = new Set()
            }
            cohorts[cohortKey].weeks[weekNum].add(a.user_id)
          }
        })

        const cohortData = Object.entries(cohorts)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .slice(0, 8)
          .map(([week, data]) => ({
            week,
            total: data.total,
            retention: [0, 1, 2, 3, 4].map(w => ({
              week: w,
              pct: data.total > 0 ? Math.round(((data.weeks[w]?.size ?? 0) / data.total) * 100) : 0,
            })),
          }))

        result = { cohorts: cohortData }
        break
      }

      case 'top_users': {
        const { data: allUsersData } = await adminClient.auth.admin.listUsers({ perPage: 1000, page: 1 })
        const users = allUsersData?.users ?? []

        const { data: profiles } = await adminClient.from('user_profiles').select('*')
        const { data: activity } = await adminClient.from('user_activity').select('user_id, action, created_at')
        const { data: chatSessions } = await adminClient.from('chat_sessions').select('user_id')

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? [])

        const userStats = users.map(user => {
          const profile = profileMap.get(user.id)
          const userActs = activity?.filter(a => a.user_id === user.id) ?? []
          const chats = chatSessions?.filter(c => c.user_id === user.id)?.length ?? 0
          const videos = userActs.filter(a => a.action === 'video_viewed').length
          const plans = userActs.filter(a => a.action === 'content_plan_generated').length
          const lastAct = userActs.length > 0
            ? userActs.reduce((latest, a) => a.created_at > latest ? a.created_at : latest, '')
            : null

          return {
            id: user.id,
            email: user.email ?? 'N/A',
            accountType: profile?.account_type ?? 'Unknown',
            creatorRole: profile?.creator_role ?? 'Unknown',
            genres: profile?.genres ?? [],
            signupDate: user.created_at,
            lastActive: lastAct,
            totalSessions: chats,
            totalChats: chats,
            totalPlans: plans,
            totalVideos: videos,
            totalActions: userActs.length,
          }
        })

        userStats.sort((a, b) => b.totalActions - a.totalActions)
        result = { users: userStats.slice(0, 50) }
        break
      }

      case 'user_timeline': {
        const targetUserId = filters?.userId
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: corsHeaders })
        }

        const { data: activities } = await adminClient
          .from('user_activity')
          .select('action, metadata, created_at')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(50)

        result = {
          timeline: activities?.map(a => ({
            timestamp: a.created_at,
            action: a.action,
            metadata: a.metadata,
          })) ?? [],
        }
        break
      }

      case 'power_users': {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        const { data: weekActivity } = await adminClient
          .from('user_activity')
          .select('user_id, created_at')
          .gte('created_at', weekAgo)

        // Group by user and count
        const userCounts: Record<string, { count: number; lastActive: string }> = {}
        weekActivity?.forEach(a => {
          if (!userCounts[a.user_id]) {
            userCounts[a.user_id] = { count: 0, lastActive: a.created_at }
          }
          userCounts[a.user_id].count++
          if (a.created_at > userCounts[a.user_id].lastActive) {
            userCounts[a.user_id].lastActive = a.created_at
          }
        })

        const powerUserIds = Object.entries(userCounts)
          .filter(([, v]) => v.count >= 10)
          .sort((a, b) => b[1].count - a[1].count)

        if (powerUserIds.length === 0) {
          result = { users: [] }
          break
        }

        const ids = powerUserIds.map(([id]) => id)
        const { data: profiles } = await adminClient
          .from('user_profiles')
          .select('user_id, account_type, creator_role, genres')
          .in('user_id', ids)

        const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000, page: 1 })
        const emailMap = new Map(authUsers?.users?.map(u => [u.id, u.email]) ?? [])
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? [])

        result = {
          users: powerUserIds.map(([id, stats]) => {
            const profile = profileMap.get(id)
            return {
              id,
              email: emailMap.get(id) ?? 'Unknown',
              accountType: profile?.account_type ?? 'Unknown',
              creatorRole: profile?.creator_role ?? 'Unknown',
              genres: profile?.genres ?? [],
              actionsThisWeek: stats.count,
              lastActive: stats.lastActive,
            }
          }),
        }
        break
      }

      case 'activity_feed': {
        const { data: recentActivity } = await adminClient
          .from('user_activity')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        const userIds = [...new Set(recentActivity?.map(a => a.user_id) ?? [])]
        const { data: profiles } = await adminClient
          .from('user_profiles')
          .select('user_id, account_type, creator_role, genres')
          .in('user_id', userIds)

        const { data: allUsersData } = await adminClient.auth.admin.listUsers({ perPage: 1000, page: 1 })
        const emailMap = new Map(allUsersData?.users?.map(u => [u.id, u.email]) ?? [])
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? [])

        const feed = recentActivity?.map(a => {
          const profile = profileMap.get(a.user_id)
          return {
            id: a.id,
            timestamp: a.created_at,
            email: emailMap.get(a.user_id) ?? 'Unknown',
            accountType: profile?.account_type ?? 'Unknown',
            creatorRole: profile?.creator_role ?? '',
            genres: profile?.genres ?? [],
            action: a.action,
            metadata: a.metadata,
          }
        }) ?? []

        result = { feed }
        break
      }

      case 'daily_usage': {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const userTypeFilter = filters?.userType

        const { data: activity } = await adminClient
          .from('user_activity')
          .select('user_id, action, created_at')
          .gte('created_at', thirtyDaysAgo)

        let allowedUserIds: Set<string> | null = null
        if (userTypeFilter && userTypeFilter !== 'all') {
          const { data: filteredProfiles } = await adminClient
            .from('user_profiles')
            .select('user_id')
            .eq('account_type', userTypeFilter)
          allowedUserIds = new Set(filteredProfiles?.map(p => p.user_id) ?? [])
        }

        const dailyData: Record<string, { dau: Set<string>; chats: number; plans: number; messages: number; chatSessions: Set<string> }> = {}

        activity?.forEach(a => {
          if (allowedUserIds && !allowedUserIds.has(a.user_id)) return
          const day = a.created_at.split('T')[0]
          if (!dailyData[day]) {
            dailyData[day] = { dau: new Set(), chats: 0, plans: 0, messages: 0, chatSessions: new Set() }
          }
          dailyData[day].dau.add(a.user_id)
          if (a.action === 'ai_chat_started') dailyData[day].chatSessions.add(a.user_id + '_' + a.created_at)
          if (a.action === 'message_sent') dailyData[day].messages++
          if (a.action === 'ai_chat_started' || a.action === 'message_sent') dailyData[day].chats++
          if (a.action === 'content_plan_generated') dailyData[day].plans++
        })

        const days = Object.entries(dailyData)
          .map(([date, data]) => {
            const sessionCount = data.chatSessions.size
            return {
              date,
              dau: data.dau.size,
              chats: data.chats,
              plans: data.plans,
              avgMsgsPerChat: sessionCount > 0 ? Math.round((data.messages / sessionCount) * 10) / 10 : 0,
            }
          })
          .sort((a, b) => a.date.localeCompare(b.date))

        result = { days }
        break
      }

      case 'active_now': {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

        const { data: recentActivity } = await adminClient
          .from('user_activity')
          .select('user_id, action, metadata, created_at')
          .gte('created_at', hourAgo)
          .order('created_at', { ascending: false })

        // Get unique active users with their latest action
        const userLatest: Record<string, { action: string; time: string }> = {}
        recentActivity?.forEach(a => {
          if (!userLatest[a.user_id]) {
            userLatest[a.user_id] = { action: a.action, time: a.created_at }
          }
        })

        const activeUserIds = Object.keys(userLatest)

        // Fetch emails and profiles
        let emailMap = new Map<string, string>()
        let profileMap = new Map<string, any>()
        if (activeUserIds.length > 0) {
          const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000, page: 1 })
          emailMap = new Map(authUsers?.users?.map(u => [u.id, u.email ?? 'Unknown']) ?? [])

          const { data: profiles } = await adminClient
            .from('user_profiles')
            .select('user_id, account_type, creator_role')
            .in('user_id', activeUserIds)
          profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? [])
        }

        const activeUsers = activeUserIds.map(id => {
          const profile = profileMap.get(id)
          return {
            id,
            email: emailMap.get(id) ?? 'Unknown',
            accountType: profile?.account_type ?? 'Unknown',
            creatorRole: profile?.creator_role ?? '',
            lastAction: userLatest[id].action,
            lastActionTime: userLatest[id].time,
          }
        })

        const recentEvents = recentActivity?.slice(0, 100).map(a => ({
          timestamp: a.created_at,
          userId: a.user_id,
          email: emailMap.get(a.user_id) ?? 'Unknown',
          action: a.action,
          metadata: a.metadata,
        })) ?? []

        result = {
          activeCount: activeUserIds.length,
          users: activeUsers,
          recentEvents,
        }
        break
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
