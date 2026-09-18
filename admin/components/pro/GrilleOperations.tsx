/**
 * GRILLE DE VIGNETTES D OPERATIONS (16/09 nuit) — petites vignettes rangees
 * par periode (En cours, A venir, Passees) puis par mois et annee.
 * Composant sans etat : utilisable par les pages serveur.
 */
import Link from 'next/link'
import type { DonneesOperation } from '@/lib/operations'
import { libelleModule } from '@/lib/operations'
import type { GroupePeriode } from '@/lib/rangementOperations'
import { CHARTE_PRO as C, ACCENT_ANIM, ACCENT_SUPER } from '@/lib/charte'

const MOIS_C = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
/** « 26–27 sept. 2026 », « 9 juil. → 2 août 2026 ». */
export function datesCourtes(d: string | null, f: string | null): string {
  if (!d) return 'Sans date'
  const [ad, md, jd] = d.split('-').map(Number)
  if (!f || f === d) return `${jd} ${MOIS_C[md - 1]} ${ad}`
  const [af, mf, jf] = f.split('-').map(Number)
  if (ad === af && md === mf) return `${jd}–${jf} ${MOIS_C[md - 1]} ${ad}`
  if (ad === af) return `${jd} ${MOIS_C[md - 1]} → ${jf} ${MOIS_C[mf - 1]} ${ad}`
  return `${jd} ${MOIS_C[md - 1]} ${ad} → ${jf} ${MOIS_C[mf - 1]} ${af}`
}

export function chiffresOperation(op: DonneesOperation) {
  const parties = op.stations.reduce((n, s) => n + (s.participants ?? 0), 0)
  const remis = op.gagnants.filter(x => x.etat === 'retire').length
  const lots = op.lots.reduce((n, l) => n + (l.quantite || 0), 0)
  return { parties, lots, gagnants: op.gagnants.length, aRemettre: op.gagnants.length - remis }
}

/* Polish demande par Romain (18/09) : « le bleu est dégueulasse, trop
   lumineux, harmonise avec le bleu du sidebar » -- le bleu vif #2563EB
   (C.accent) sur fond blanc, repete sur les chiffres ET le badge ET la
   bordure, faisait trop de saturation d un coup. C.accentFonce (#1D4ED8,
   deja dans la charte) est le meme bleu, plus dense, moins « neon ».
   « on ne voit pas que ce sont des boutons » : les liens de pied de carte
   n avaient ni fond ni bordure -- de simples mots bleus. Ils devienne des
   puces avec un vrai contour.
   Code couleur (18/09, second retour) : super event et animation se
   distinguaient mal, tous deux en bleu. « garde le super event en orange,
   l'event en bleu » -- reprend l'orange deja etabli comme identifiant super
   event ailleurs dans l'appli (SuperEventDrawer .t-super, /rejoindre). */
export function Vignette({ op, href, liens }: { op: DonneesOperation; href: string; liens?: { label: string; href: string }[] }) {
  const k = chiffresOperation(op)
  const accent = op.type === 'super' ? ACCENT_SUPER : ACCENT_ANIM
  const chiffre = (v: number, l: string) => (
    <span style={{ whiteSpace: 'nowrap' }}><b style={{ color: accent, fontSize: 15 }}>{v}</b> <span style={{ color: C.attenue, fontSize: 11.5 }}>{l}</span></span>
  )
  return (
    <div className="op-vignette" style={{ background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(43,16,54,.04)', transition: 'box-shadow .15s, transform .15s' }}>
      <style>{`.op-vignette:hover{box-shadow:0 8px 20px rgba(43,16,54,.1);transform:translateY(-1px)} .op-vignette-lien:hover{background:${C.subtil};border-color:${accent}}`}</style>
      <Link href={href} style={{ textDecoration: 'none', color: C.texte, padding: '11px 13px 9px', display: 'block', borderLeft: `4px solid ${accent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.attenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{datesCourtes(op.dateD, op.dateF)}</span>
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: accent, background: `${accent}14`, borderRadius: 99, padding: '3px 8px' }}>
            {op.type === 'super' ? 'Super event' : 'Animation'}
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2, marginTop: 3 }}>{op.nom}</div>
        <div style={{ fontSize: 11.5, color: C.attenue, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {libelleModule(op.stations[0]?.module)}{op.type === 'super' ? ` · ${op.stations.length > 1 ? `${op.stations.length} stations` : op.stations[0]?.nom ?? ''}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 7 }}>
          {chiffre(k.parties, 'parties')}
          {chiffre(k.gagnants, 'gagnants')}
          {chiffre(k.aRemettre, 'à remettre')}
        </div>
      </Link>
      {liens && liens.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '9px 11px', borderTop: `1px solid ${C.bordure}`, background: C.subtil }}>
          {liens.map(l => (
            <Link key={l.label} href={l.href} className="op-vignette-lien"
              style={{ fontSize: 11, fontWeight: 800, color: accent, textDecoration: 'none', whiteSpace: 'nowrap', background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 99, padding: '5px 10px', transition: 'background .12s, border-color .12s' }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GrilleOperations({ groupes, vignette }: {
  groupes: GroupePeriode<DonneesOperation>[]
  vignette: (op: DonneesOperation) => React.ReactNode
}) {
  return (
    <div>
      {groupes.map(g => (
        <section key={g.periode} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderBottom: `2px solid ${C.bordure}`, paddingBottom: 6, marginBottom: 10 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: g.periode === 'en_cours' ? C.magenta : C.texte }}>{g.titre}</h2>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.attenue }}>{g.n}</span>
          </div>
          {g.mois.map(m => (
            <div key={m.cle} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: C.attenue, margin: '0 2px 7px' }}>{m.titre}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
                {m.ops.map(op => <div key={op.cle}>{vignette(op)}</div>)}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
