'use client'

/**
 * STATISTIQUES DU COMMERCE (maquette lot 5 E, validée) : 5 écrans en carrousel.
 * 1 chiffres clés (FLASHS = pages ouvertes en scannant un QR, contacts autorisés) · 2 hommes et femmes ·
 * 3 tranches d'âge · 4 code postal · 5 zone de chalandise (500 m, 1 km, 3 km).
 * Chiffres : RPC stats_pro_audience (agrégats, lib/statsPro.ts). RPC absente : « Bientôt », les flashs gardent leur repli.
 * Genre : jamais « autre » ; la part sans genre s'appelle « Non renseigné ». Démo : exemples étiquetés, aucun appel.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { estDemo } from '@/lib/demo'
import { fetchStatsAudience, STATS_DEMO, PERIODES, pct, libelleAge, ordonnerAges, type EtatStats, type Periode, type StatsAudience } from '@/lib/statsPro'
import CarrouselOrange, { Bientot, EtiquetteDemo, carteBlanche, boutonOrange, ORANGE, BLEU, GRIS, ENCRE, type EcranOrange } from '@/components/pro/CarrouselOrange'

const fmt = (v: number) => v.toLocaleString('fr-FR').replace(/ /g, ' ')
const grand = { fontSize: 46, fontWeight: 900, lineHeight: 1, letterSpacing: '-.02em' } as const
const etiq = { fontSize: 12.5, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: GRIS } as const

function Barre({ label, valeur, texte, part, couleur }: { label: string; valeur?: string; texte?: string; part: number; couleur: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 15, fontWeight: 800 }}>
        <span>{label}</span><span>{texte ?? valeur}</span>
      </div>
      <div style={{ height: 10, borderRadius: 6, background: '#E2E7EE', marginTop: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, part))}%`, background: couleur, borderRadius: 6 }} />
      </div>
    </div>
  )
}

function Anneau({ parts }: { parts: { n: number; couleur: string }[] }) {
  const total = parts.reduce((t, p) => t + p.n, 0)
  const R = 70, C = 2 * Math.PI * R
  let cumul = 0
  return (
    <svg viewBox="0 0 200 200" width="190" height="190" role="img" aria-label="Répartition hommes et femmes" style={{ display: 'block', margin: '8px auto' }}>
      <circle cx="100" cy="100" r={R} fill="none" stroke="#E2E7EE" strokeWidth="30" />
      {total > 0 && parts.map((p, k) => {
        const l = (p.n / total) * C
        const el = <circle key={k} cx="100" cy="100" r={R} fill="none" stroke={p.couleur} strokeWidth="30" strokeDasharray={`${l} ${C - l}`} strokeDashoffset={-cumul} transform="rotate(-90 100 100)" />
        cumul += l
        return el
      })}
      <text x="100" y="104" textAnchor="middle" fontSize="34" fontWeight="900" fill={ENCRE}>{fmt(total)}</text>
      <text x="100" y="126" textAnchor="middle" fontSize="13" fontWeight="700" fill={GRIS}>personnes</text>
    </svg>
  )
}

export default function StatsPro({ eventIds, nom, proQuery = '' }: { eventIds: string[]; nom: string; proQuery?: string }) {
  const [periode, setPeriode] = useState<Periode>(30)
  const [etat, setEtat] = useState<EtatStats | null>(null)
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    let vivant = true
    const d = estDemo()
    setDemo(d)
    if (d) { setEtat({ etat: 'ok', stats: STATS_DEMO }); return }
    setEtat(null)
    fetchStatsAudience(eventIds, periode).then(r => { if (vivant) setEtat(r) })
    return () => { vivant = false }
  }, [eventIds.join('|'), periode]) // eslint-disable-line react-hooks/exhaustive-deps

  const st: StatsAudience | null = etat && etat.etat === 'ok' ? etat.stats : null
  const flashs = etat ? (etat.etat === 'ok' ? etat.stats.flashs : etat.flashs) : null
  const sous = (t: string) => (demo ? `${t} (exemple)` : t)
  const enAttente = etat === null
  const manque = (corps: () => React.ReactNode) => {
    if (enAttente) return <div style={{ ...carteBlanche, fontSize: 14 }}>Chargement…</div>
    if (!st) return <Bientot />
    if (st.petitEchantillon) return <Bientot texte="Pas encore assez de contacts (5 minimum) pour afficher les parts." />
    return corps()
  }
  const total = st ? st.joueurs : 0
  const g = st?.genre

  const pied = (lien?: { href: string; label: string }) => lien ? <Link href={lien.href} style={boutonOrange()}>{lien.label}</Link> : undefined

  const ecrans: EcranOrange[] = [
    {
      cle: 'chiffres', titre: 'Mes statistiques', sous: sous(nom), picto: 'chart',
      corps: (
        <>
          {demo && <EtiquetteDemo />}
          <div style={{ display: 'flex', gap: 8, margin: '4px 0 10px', flexWrap: 'wrap' }}>
            {PERIODES.map(p => {
              const on = p.v === periode
              return <button key={String(p.v)} type="button" disabled={demo} onClick={() => setPeriode(p.v)} aria-pressed={on}
                style={{ minHeight: 44, padding: '0 16px', borderRadius: 22, fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: demo ? 'default' : 'pointer', border: `2px solid ${on ? ORANGE : '#E2E7EE'}`, background: on ? '#FFF4EA' : '#fff', color: on ? ORANGE : ENCRE }}>{p.label}</button>
            })}
          </div>
          <div style={{ ...carteBlanche, border: `2px solid ${ORANGE}` }}>
            <div style={etiq}>Flashs</div>
            <div style={{ ...grand, color: ORANGE, margin: '4px 0' }}>{flashs === null ? '…' : fmt(flashs)}</div>
            <div style={{ fontSize: 14, color: GRIS }}>Pages ouvertes en scannant un QR</div>
          </div>
          <div style={carteBlanche}>
            <div style={etiq}>Contacts autorisés</div>
            {st
              ? <><div style={{ ...grand, color: BLEU, margin: '4px 0' }}>{fmt(st.optin)}</div>
                  <div style={{ fontSize: 14, color: GRIS }}>{pct(st.optin, st.flashs)} % des flashs · ont coché « rester en contact avec ce commerce »</div></>
              : enAttente ? <div style={{ fontSize: 14, color: GRIS, marginTop: 6 }}>Chargement…</div> : <Bientot texte="Ce chiffre arrive bientôt." />}
          </div>
        </>
      ),
      pied: pied(),
    },
    {
      cle: 'genre', titre: 'Hommes et femmes', sous: st ? sous(`${fmt(total)} contacts`) : 'Contacts', picto: 'users',
      corps: manque(() => g && (
        <>
          {demo && <EtiquetteDemo />}
          <Anneau parts={[{ n: g.femmes, couleur: ORANGE }, { n: g.hommes, couleur: BLEU }, { n: g.non_renseigne, couleur: '#C9D1DC' }]} />
          <div style={{ ...carteBlanche, padding: '6px 14px' }}>
            {[{ l: 'Femmes', n: g.femmes, c: ORANGE }, { l: 'Hommes', n: g.hommes, c: BLEU }, { l: 'Non renseigné', n: g.non_renseigne, c: '#C9D1DC' }].map(x => (
              <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, fontSize: 17, fontWeight: 800 }}>
                <span style={{ width: 14, height: 14, borderRadius: 7, background: x.c, flex: 'none' }} />
                <span style={{ flex: 1 }}>{x.l}</span><span style={{ fontSize: 20 }}>{pct(x.n, total)} %</span>
              </div>
            ))}
          </div>
        </>
      )),
    },
    {
      cle: 'ages', titre: 'Âges', sous: sous('Tranches déclarées'), picto: 'calendar',
      corps: manque(() => {
        const ages = ordonnerAges(st?.ages ?? [])
        const connus = ages.reduce((t, a) => t + a.n, 0)
        if (!connus) return <Bientot texte="Aucune tranche d’âge déclarée pour l’instant." />
        const max = ages.reduce((m, a) => (a.n > m.n ? a : m), ages[0])
        return (
          <>
            {demo && <EtiquetteDemo />}
            <div style={{ marginTop: 8 }}>
              {ages.map(a => <Barre key={a.tranche} label={libelleAge(a.tranche)} texte={`${pct(a.n, connus)} %`} part={pct(a.n, connus)} couleur={a === max ? ORANGE : '#E8A27C'} />)}
            </div>
            <div style={{ background: '#FFF4EA', color: ORANGE, fontWeight: 800, fontSize: 14, borderRadius: 14, padding: '10px 14px' }}>La tranche la plus présente : {libelleAge(max.tranche)}.</div>
            <div style={{ fontSize: 13, color: GRIS, marginTop: 8 }}>Calculé sur les {fmt(connus)} contacts qui ont donné leur âge.</div>
          </>
        )
      }),
    },
    {
      cle: 'cp', titre: 'D’où viennent-ils ?', sous: sous('Code postal'), picto: 'globe',
      corps: manque(() => {
        const cps = st?.cp ?? []
        const base = st?.cpTotal ?? 0
        if (!base || !cps.length) return <Bientot texte="Pas encore assez de codes postaux (3 personnes minimum par code)." />
        const dansTop = cps.reduce((t, c) => t + c.n, 0)
        const autres = Math.max(0, base - dansTop)
        return (
          <>
            {demo && <EtiquetteDemo />}
            <div style={{ marginTop: 8 }}>
              {cps.map(c => <Barre key={c.cp} label={`${c.cp}${c.ville ? ' ' + c.ville : ''}`} texte={`${pct(c.n, base)} %`} part={pct(c.n, base)} couleur={ORANGE} />)}
              {autres > 0 && <Barre label="Autres" texte={`${pct(autres, base)} %`} part={pct(autres, base)} couleur="#C9D1DC" />}
            </div>
            <div style={{ fontSize: 13, color: GRIS }}>Calculé sur les {fmt(base)} contacts qui ont donné leur code postal.</div>
          </>
        )
      }),
    },
    {
      cle: 'chalandise', titre: 'Ma zone de chalandise', sous: sous('Distance au scan'), picto: 'pin',
      corps: manque(() => {
        const s = st?.scan
        const connus = s?.connus ?? 0
        const lignes = s ? [
          { l: 'Moins de 500 m', n: s.moins_500 }, { l: '500 m à 1 km', n: s.de_500_a_1000 },
          { l: '1 à 3 km', n: s.de_1000_a_3000 }, { l: 'Plus loin', n: s.plus_loin },
        ] : []
        return (
          <>
            {demo && <EtiquetteDemo />}
            <svg viewBox="0 0 200 200" width="180" height="180" role="img" aria-label="Cercles de 500 m, 1 km et 3 km autour du commerce" style={{ display: 'block', margin: '4px auto 0' }}>
              <circle cx="100" cy="100" r="92" fill="#FFF4EA" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="5 4" />
              <circle cx="100" cy="100" r="58" fill="#FBE3D1" stroke={ORANGE} strokeWidth="1.8" />
              <circle cx="100" cy="100" r="26" fill="#F5C9A9" stroke={ORANGE} strokeWidth="2" />
              <circle cx="100" cy="100" r="7" fill={ORANGE} />
              <text x="100" y="52" textAnchor="middle" fontSize="11" fontWeight="800" fill={ORANGE}>1 km</text>
              <text x="100" y="22" textAnchor="middle" fontSize="11" fontWeight="800" fill={ORANGE}>3 km</text>
              <text x="100" y="82" textAnchor="middle" fontSize="10" fontWeight="800" fill={ORANGE}>500 m</text>
            </svg>
            {connus > 0
              ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '6px 0' }}>
                  {lignes.map(x => (
                    <div key={x.l} style={{ ...carteBlanche, marginBottom: 0, textAlign: 'center', padding: '8px 6px' }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE }}>{pct(x.n, connus)} %</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: GRIS }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              : <div style={{ ...carteBlanche, fontSize: 14, color: GRIS, textAlign: 'center' }}>Distance au scan : non renseigné.</div>}
            <div style={{ fontSize: 13, color: GRIS }}>
              Distance mesurée au scan{connus > 0 ? ` (${fmt(connus)} parties)` : ''}. Domicile : {st && st.adressesConnues > 0 ? `adresse connue pour ${fmt(st.adressesConnues)} contacts, carte bientôt.` : 'non renseigné (aucune adresse recueillie pour l’instant).'}
            </div>
          </>
        )
      }),
      pied: proQuery !== undefined ? <Link href={`/pro${proQuery}`} style={boutonOrange(true)}>Retour à l’accueil</Link> : undefined,
    },
  ]
  return <CarrouselOrange ecrans={ecrans} nom="Mes statistiques" />
}
