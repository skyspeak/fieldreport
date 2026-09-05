/**
 * v4 metro report: v3 field report plus AOI wages, cluster skills, and atlas ranks.
 */
import { aoiDsl } from './aoiClient.mjs'
import { buildAtlas } from './buildAtlas.mjs'
import { buildFieldReport } from './buildFieldReport.mjs'

function pickWage(segments, msaSize, years) {
  const want = msaSize === 'Small/Medium' ? 'Small/Medium' : 'Large'
  const row = (segments || []).find(
    (s) => s.msa_size === want && String(s.experience_level) === String(years),
  )
  return row
    ? {
        p25: Math.round(row.percentile_25),
        median: Math.round(row.median),
        p75: Math.round(row.percentile_75),
      }
    : null
}

async function fetchWages(onet) {
  if (!onet) return []
  try {
    const res = await aoiDsl(`GET WAGES FOR OCCUPATION WHERE ONET_CODE IS "${onet}"`)
    const data = res.data
    return Array.isArray(data?.wages_by_segment) ? data.wages_by_segment : []
  } catch {
    return []
  }
}

async function fetchCluster(clusterId) {
  try {
    const res = await aoiDsl(`GET CLUSTER ${clusterId}`)
    return res.data || null
  } catch {
    return null
  }
}

/**
 * @param {{ cip: string, zip: string }} args
 */
export async function buildV4Report({ cip, zip }) {
  const [report, atlas] = await Promise.all([
    buildFieldReport({ cip, zip }),
    buildAtlas({ cip }).catch(() => null),
  ])

  const wagesByGroup = []
  const skillsByGroup = []

  await Promise.all(
    (report.groups || []).map(async (g) => {
      const onet = g.primaryOnet || null
      const clusterId = g.clusterIds?.[0]
      const [segments, cluster] = await Promise.all([
        fetchWages(onet),
        clusterId ? fetchCluster(clusterId) : Promise.resolve(null),
      ])
      const msa = report.place?.msaSize || 'Large'
      wagesByGroup.push({
        groupId: g.id,
        groupName: g.displayName,
        onet: cluster?.onet_code || onet,
        title: cluster?.occupations?.[0]?.onet_title || g.displayName,
        msaSize: msa,
        entry: pickWage(segments, msa, '0'),
        year5: pickWage(segments, msa, '5'),
        year10: pickWage(segments, msa, '10'),
      })
      if (cluster) {
        skillsByGroup.push({
          groupId: g.id,
          groupName: g.displayName,
          jobLevel: cluster.job_level || null,
          baPlusShare: cluster.ba_plus_share ?? null,
          aiFlag: cluster.ai_flag || null,
          premiumSkills: [
            cluster.premium_skill_1,
            cluster.premium_skill_2,
            cluster.premium_skill_3,
          ].filter(Boolean),
          jobTitles: [
            cluster.common_clean_job_title_1,
            cluster.common_clean_job_title_2,
            cluster.common_clean_job_title_3,
          ].filter(Boolean),
        })
      }
    }),
  )

  wagesByGroup.sort((a, b) => a.groupId - b.groupId)
  skillsByGroup.sort((a, b) => a.groupId - b.groupId)

  const rankedMetros = (atlas?.metros || []).map((m) => ({
    zip: m.zip,
    cbsa: m.cbsa,
    cbsaName: m.cbsaName,
    short: m.short,
    employersHiring: m.employers,
    platinum: m.platinum,
    isCurrent: m.cbsa === report.place?.cbsa,
    score: m.employers,
    lat: m.lat,
    lng: m.lng,
  }))

  return {
    ...report,
    wagesByGroup,
    skillsByGroup,
    atlasPreview: atlas
      ? {
          cluster: atlas.cluster,
          metros: rankedMetros.slice(0, 12),
          totals: atlas.totals,
        }
      : null,
    metros: rankedMetros.length ? rankedMetros : report.metros,
    namedEmployers: true,
    variant: 'v4',
  }
}
