'use client'

/**
 * CRM COMPLET DU PRO (16/09 nuit, demande de Romain).
 *
 * Tous les contacts du pro, toutes operations confondues (events et super
 * events) : origines, operations jouees, nombre de parties, gains. Filtres
 * (operation, origine, gagnants, opt-in, mois), selection, et actions de
 * relance : email (liens Gmail par lots en copie cachee, meme mecanisme que
 * l envoi en masse SA), SMS, copie des coordonnees, export CSV.
 * Onglets : Contacts · Par origine · Par operation · Statistiques.
 * `operationFixe` : le meme CRM limite a une operation (fiche operation).
 */
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ContactPro } from '@/lib/crmPro'
import { libelleOrigine } from '@/lib/crmPro'
import { Camembert } from '@/components/dashboard/Camembert'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CHAMP, LABEL } from '@/lib/proui'

type Vue = 'contacts' | 'origines' | 'operations' | 'stats'
const VUES: { id: Vue; label: string }[] = [
  { id: 'contacts', label: 'Contacts' },
  { id: 'origines', label: 'Par origine' },
  { id: 'operations', label: 'Par opération' },
  { id: 'stats', label: 'Statistiques' },
]
const TAILLE_LOT = 40
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const libMois = (ym: string) => { const [a, m] = ym.split('-'); return `${MOIS[Number(m) - 1] ?? m} ${a}` }
const dateFr = (d: string | null) => d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR') : '—'

const petit: React.CSSProperties = { ...CHAMP, padding: '8px 11px', fontSize: 13, borderRadius: 10, width: 'auto' }
const bouton: React.CSSProperties = {
  border: `1.5px solid ${C.bordureChamp}`, background: '#fff', color: C.accent, borderRadius: 50,
  padding: '7px 13px', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', textDecoration: 'none',
}
const boutonPlein: React.CSSProperties = { ...bouton, border: 'none', background: C.degrade, color: '#fff' }
const th: React.CSSProperties = { textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: C.attenue, padding: '8px 10px', borderBottom: `1px solid ${C.bordure}`, background: C.subtil, whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '8px 10px', borderBottom: `1px solid ${C.bordure}`, fontSize: 12.5, verticalAlign: 'top' }

function Tuile({ v, l }: { v: React.ReactNode; l: string }) {
  return (
    <div style={{ flex: '1 1 120px', background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, padding: '10px 14px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.accent, lineHeight: 1.1 }}>{v}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.attenue }}>{l}</div>
    </div>
  )
}

export default function CrmPro({ proId, proNom, contacts, operations, operationFixe, operationInitiale }: {
  proId: string
  proNom: string
  contacts: ContactPro[]
  /** Operations du pro, dans l ordre du rangement (pour le filtre). */
  operations: { cle: string; nom: string; dates: string }[]
  operationFixe?: string | null
  operationInitiale?: string | null
}) {
  const router = useRouter()
  const [vue, setVue] = useState<Vue>('contacts')
  const [q, setQ] = useState('')
  const [op, setOp] = useState(operationFixe ?? operationInitiale ?? '')
  const [origine, setOrigine] = useState('')
  const [profil, setProfil] = useState<'' | 'gagnants' | 'participants'>('')
  const [optinSeul, setOptinSeul] = useState(false)
  const [mois, setMois] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [composer, setComposer] = useState(false)
  const [objet, setObjet] = useState('')
  const [message, setMessage] = useState('')
  const [copie, setCopie] = useState('')
  const [tous, setTous] = useState(false)
  const qs = proId ? `?pro=${encodeURIComponent(proId)}` : ''

  const base = useMemo(() => op ? contacts.filter(c => c.operations.some(o => o.cle === op)) : contacts, [contacts, op])
  const origines = useMemo(() => Array.from(new Set(base.flatMap(c => c.origines))).sort(), [base])
  const moisDispo = useMemo(() => Array.from(new Set(base.map(c => (c.derniere ?? '').slice(0, 7)).filter(Boolean))).sort().reverse(), [base])

  const liste = useMemo(() => {
    const t = q.trim().toLowerCase()
    return base.filter(c =>
      (!origine || c.origines.includes(origine)) &&
      (!profil || (profil === 'gagnants' ? c.nb_gains > 0 : c.nb_gains === 0)) &&
      (!optinSeul || c.optin) &&
      (!mois || (c.derniere ?? '').startsWith(mois)) &&
      (!t || [c.prenom, c.nom, c.email, c.tel, c.ville, c.code_postal].some(v => String(v ?? '').toLowerCase().includes(t))),
    )
  }, [base, q, origine, profil, optinSeul, mois])

  const choisis = liste.filter(c => sel.has(c.joueur_id))
  const cible = choisis.length ? choisis : liste
  /* Relance par email : opt-in, ou gagnant (retrait de son lot). */
  const destEmail = cible.filter(c => c.email && (c.optin || c.nb_gains > 0))
  const exclus = cible.filter(c => c.email).length - destEmail.length
  const lotsEmail: string[][] = []
  for (let i = 0; i < destEmail.length; i += TAILLE_LOT) lotsEmail.push(destEmail.slice(i, i + TAILLE_LOT).map(c => c.email as string))
  const tels = cible.map(c => c.tel).filter((x): x is string => !!x)
  const lienGmail = (bcc: string[]) =>
    `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(bcc.join(','))}&su=${encodeURIComponent(objet)}&body=${encodeURIComponent(message)}`

  function basculer(id: string) {
    const n = new Set(sel)
    if (n.has(id)) n.delete(id); else n.add(id)
    setSel(n)
  }
  function toutCocher() {
    setSel(choisis.length === liste.length && liste.length ? new Set() : new Set(liste.map(c => c.joueur_id)))
  }
  async function copier(txt: string, quoi: string) {
    try { await navigator.clipboard.writeText(txt); setCopie(quoi) } catch { setCopie('') }
    setTimeout(() => setCopie(''), 2500)
  }
  function exporter() {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const entete = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Code postal', 'Ville', 'Genre', 'Âge', 'Opt-in', 'Origines', 'Opérations', 'Parties', 'Gains', 'Lots', 'Première', 'Dernière']
    const lignes = cible.map(c => [c.prenom, c.nom, c.email, c.tel, c.code_postal, c.ville, c.genre, c.tranche_age, c.optin ? 'oui' : 'non',
      c.origines.map(libelleOrigine).join(' / '), c.operations.map(o => o.nom).join(' / '), c.nb_parties, c.nb_gains, c.lots.join(' / '),
      c.premiere ?? '', c.derniere ?? ''])
    const csv = '﻿' + [entete, ...lignes].map(l => l.map(esc).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `crm-${proId || 'pro'}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const nbOptin = base.filter(c => c.optin).length
  const nbGagnants = base.filter(c => c.nb_gains > 0).length
  const nbParties = base.reduce((s, c) => s + c.nb_parties, 0)
  const repart = (vals: (string | null)[]) => {
    const m = new Map<string, number>()
    vals.forEach(v => { const k = (v ?? '').trim() || 'Non renseigné'; m.set(k, (m.get(k) ?? 0) + 1) })
    return Array.from(m.entries()).map(([valeur, n]) => ({ valeur, n })).sort((a, b) => b.n - a.n)
  }
  const visibles = tous ? liste : liste.slice(0, 100)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Tuile v={base.length} l="contacts" />
        <Tuile v={nbOptin} l="opt-in (relançables)" />
        <Tuile v={nbGagnants} l="gagnants" />
        <Tuile v={nbParties} l="participations" />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {VUES.map(v => (
          <button key={v.id} onClick={() => setVue(v.id)}
            style={{ ...bouton, background: vue === v.id ? C.degrade : '#fff', color: vue === v.id ? '#fff' : C.texte, border: vue === v.id ? 'none' : bouton.border }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, padding: 10, marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher : nom, email, ville…" style={{ ...petit, flex: '1 1 200px' }} />
        {!operationFixe && (
          <select value={op} onChange={e => { setOp(e.target.value); setSel(new Set()) }} style={petit}>
            <option value="">Toutes les opérations</option>
            {operations.map(o => <option key={o.cle} value={o.cle}>{o.nom} — {o.dates}</option>)}
          </select>
        )}
        <select value={origine} onChange={e => setOrigine(e.target.value)} style={petit}>
          <option value="">Toutes les origines</option>
          {origines.map(o => <option key={o} value={o}>{libelleOrigine(o)}</option>)}
        </select>
        <select value={profil} onChange={e => setProfil(e.target.value as typeof profil)} style={petit}>
          <option value="">Gagnants et participants</option>
          <option value="gagnants">Gagnants</option>
          <option value="participants">Participants non gagnants</option>
        </select>
        <select value={mois} onChange={e => setMois(e.target.value)} style={petit}>
          <option value="">Tous les mois</option>
          {moisDispo.map(m => <option key={m} value={m}>{libMois(m)}</option>)}
        </select>
        <label style={{ fontSize: 12.5, fontWeight: 700, display: 'flex', gap: 5, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={optinSeul} onChange={e => setOptinSeul(e.target.checked)} /> Opt-in seulement
        </label>
      </div>

      {vue === 'contacts' && (
        <>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, marginRight: 4 }}>
              {choisis.length ? `${choisis.length} sélectionné${choisis.length > 1 ? 's' : ''}` : `${liste.length} contact${liste.length > 1 ? 's' : ''} filtré${liste.length > 1 ? 's' : ''}`}
            </span>
            <button style={boutonPlein} onClick={() => setComposer(!composer)}>Envoyer un email</button>
            <a style={bouton} href={tels.length ? `sms:${tels.join(',')}${message ? `?body=${encodeURIComponent(message)}` : ''}` : undefined}>SMS ({tels.length})</a>
            <button style={bouton} onClick={() => copier(destEmail.map(c => c.email).join(', '), 'emails')}>Copier les emails</button>
            <button style={bouton} onClick={() => copier(tels.join(', '), 'téléphones')}>Copier les téléphones</button>
            <button style={bouton} onClick={exporter}>Export CSV</button>
            {copie && <span style={{ fontSize: 12, color: '#15803D', fontWeight: 700 }}>{copie} copiés</span>}
          </div>

          {composer && (
            <div style={{ background: '#fff', border: `1.5px solid ${C.magenta}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Relance par email — {destEmail.length} destinataire{destEmail.length > 1 ? 's' : ''}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <div><label style={LABEL}>Objet</label><input style={CHAMP} value={objet} onChange={e => setObjet(e.target.value)} placeholder={`${proNom} — …`} /></div>
                <div><label style={LABEL}>Message</label><textarea style={{ ...CHAMP, minHeight: 110, resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)} /></div>
              </div>
              {exclus > 0 && <div style={{ fontSize: 12, color: C.attenue, marginTop: 8 }}>{exclus} contact{exclus > 1 ? 's' : ''} sans opt-in exclu{exclus > 1 ? 's' : ''} (seuls les opt-in et les gagnants reçoivent une relance).</div>}
              <div style={{ fontSize: 12, color: C.attenue, margin: '8px 0' }}>Chaque bouton ouvre Gmail, destinataires en copie cachée ({TAILLE_LOT} maximum par envoi).</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {lotsEmail.map((l, i) => (
                  <a key={i} style={boutonPlein} href={lienGmail(l)} target="_blank" rel="noopener noreferrer">
                    {lotsEmail.length > 1 ? `Envoi ${i + 1} / ${lotsEmail.length} (${l.length})` : `Ouvrir Gmail (${l.length})`}
                  </a>
                ))}
                {!lotsEmail.length && <span style={{ fontSize: 12.5, color: C.attenue }}>Aucun destinataire avec email.</span>}
              </div>
            </div>
          )}

          <div style={{ background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, overflowX: 'auto' }}>
            {liste.length === 0 ? <div style={{ padding: 16, fontSize: 13, color: C.attenue }}>Aucun contact avec ces filtres.</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
                <thead>
                  <tr>
                    <th style={th}><input type="checkbox" checked={choisis.length === liste.length && liste.length > 0} onChange={toutCocher} /></th>
                    <th style={th}>Contact</th><th style={th}>Coordonnées</th><th style={th}>Origine</th>
                    <th style={th}>Opérations</th><th style={th}>Parties</th><th style={th}>Gains</th><th style={th}>Dernière</th><th style={th}>Opt-in</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Ligne cliquable -> fiche, plus de colonne « Fiche » redondante
                      (Romain, 18/09 : « pas besoin de marquer fiche, un simple clic
                      sur la ligne permet d'y accéder »). La case à cocher stoppe la
                      propagation pour ne pas ouvrir la fiche en la cochant. */}
                  {visibles.map(c => (
                    <tr key={c.joueur_id} onClick={() => router.push(`/pro/crm/${c.joueur_id}${qs}`)}
                      style={{ cursor: 'pointer', background: sel.has(c.joueur_id) ? 'rgba(224,33,138,.05)' : undefined }}>
                      <td style={td} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.has(c.joueur_id)} onChange={() => basculer(c.joueur_id)} /></td>
                      <td style={td}>
                        <div style={{ fontWeight: 800 }}>{`${c.prenom ?? ''} ${c.nom ?? ''}`.trim() || '—'}</div>
                        <div style={{ fontSize: 11.5, color: C.attenue }}>{[c.code_postal, c.ville].filter(Boolean).join(' ') || '—'}</div>
                      </td>
                      <td style={td}>
                        <div>{c.email || '—'}</div>
                        <div style={{ fontSize: 11.5, color: C.attenue }}>{c.tel || ''}</div>
                      </td>
                      <td style={{ ...td, fontSize: 11.5 }}>{c.origines.length ? c.origines.map(libelleOrigine).join(', ') : '—'}</td>
                      <td style={{ ...td, fontSize: 11.5 }}>{c.operations.map(o => o.nom).join(', ') || '—'}</td>
                      <td style={{ ...td, fontWeight: 800 }}>{c.nb_parties}</td>
                      <td style={td}>
                        {c.nb_gains > 0
                          ? <span title={c.lots.join(', ')} style={{ fontSize: 11, fontWeight: 800, color: '#15803D', background: 'rgba(21,128,61,.09)', borderRadius: 99, padding: '3px 8px' }}>{c.nb_gains} lot{c.nb_gains > 1 ? 's' : ''}</span>
                          : <span style={{ color: C.attenue }}>—</span>}
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{dateFr(c.derniere)}</td>
                      <td style={td}>{c.optin ? <span style={{ color: '#15803D', fontWeight: 800 }}>Oui</span> : <span style={{ color: C.attenue }}>Non</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {liste.length > 100 && !tous && (
            <button style={{ ...bouton, marginTop: 10 }} onClick={() => setTous(true)}>Afficher les {liste.length} contacts</button>
          )}
        </>
      )}

      {vue === 'origines' && (
        <TableRepartition titre="Origine" lignes={(() => {
          /* Cle = code brut d origine (pour re-filtrer les Contacts au clic),
             libelle = ce qui s affiche. Avant : la cle etait deja le libelle
             traduit, impossible a reinjecter dans le filtre `origine` qui
             attend le code brut (c.origines.includes(origine)). */
          const m = new Map<string, { nom: string; n: number; g: number; o: number }>()
          liste.forEach(c => (c.origines.length ? c.origines : ['']).forEach(o => {
            const x = m.get(o) ?? { nom: o ? libelleOrigine(o) : 'Non renseignée', n: 0, g: 0, o: 0 }
            x.n++; if (c.nb_gains > 0) x.g++; if (c.optin) x.o++
            m.set(o, x)
          }))
          return Array.from(m.entries()).map(([id, x]) => ({ id, ...x })).sort((a, b) => b.n - a.n)
        })()} onLigne={id => { setOrigine(id); setVue('contacts') }} />
      )}

      {vue === 'operations' && (
        <TableRepartition titre="Opération" lignes={(() => {
          const m = new Map<string, { nom: string; n: number; g: number; o: number; p: number }>()
          liste.forEach(c => c.operations.forEach(o => {
            const x = m.get(o.cle) ?? { nom: o.nom, n: 0, g: 0, o: 0, p: 0 }
            x.n++; x.p += Number(o.parties ?? 0); if (c.nb_gains > 0) x.g++; if (c.optin) x.o++
            m.set(o.cle, x)
          }))
          return Array.from(m.entries()).map(([id, x]) => ({ id, ...x })).sort((a, b) => b.n - a.n)
        })()} onLigne={id => { setOp(id); setVue('contacts') }} />
      )}

      {vue === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
          {[
            { t: 'Genre', p: repart(liste.map(c => c.genre === 'F' ? 'Femmes' : c.genre === 'H' ? 'Hommes' : c.genre)) },
            { t: 'Tranches d’âge', p: repart(liste.map(c => c.tranche_age)) },
            { t: 'Codes postaux', p: repart(liste.map(c => c.code_postal)).slice(0, 8) },
            { t: 'Opt-in', p: repart(liste.map(c => c.optin ? 'Opt-in' : 'Sans opt-in')) },
          ].map(x => (
            <div key={x.t} style={{ background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, padding: 12 }}>
              <Camembert titre={x.t} parts={x.p} unite="contacts" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TableRepartition({ titre, lignes, onLigne }: { titre: string; lignes: { id?: string; nom: string; n: number; g: number; o: number; p?: number }[]; onLigne?: (id: string) => void }) {
  const max = Math.max(1, ...lignes.map(l => l.n))
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, overflowX: 'auto' }}>
      {onLigne && lignes.length > 0 && (
        <div style={{ padding: '9px 14px', fontSize: 11.5, color: C.attenue, borderBottom: `1px solid ${C.bordure}` }}>Clique une ligne pour voir ses contacts.</div>
      )}
      {lignes.length === 0 ? <div style={{ padding: 16, fontSize: 13, color: C.attenue }}>Aucune donnée.</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead><tr>
            <th style={th}>{titre}</th><th style={th}>Contacts</th>
            {lignes.some(l => l.p !== undefined) && <th style={th}>Parties</th>}
            <th style={th}>Gagnants</th><th style={th}>Opt-in</th>
            <th style={th} title="Part de cette ligne par rapport à celle qui en a le plus">Répartition</th>
          </tr></thead>
          <tbody>
            {lignes.map(l => (
              <tr key={l.id ?? l.nom} onClick={onLigne && l.id !== undefined ? () => onLigne(l.id as string) : undefined}
                style={onLigne ? { cursor: 'pointer' } : undefined}
                onMouseEnter={onLigne ? e => (e.currentTarget.style.background = C.subtil) : undefined}
                onMouseLeave={onLigne ? e => (e.currentTarget.style.background = '') : undefined}>
                <td style={{ ...td, fontWeight: 800 }}>{l.nom}</td>
                <td style={td}>{l.n}</td>
                {l.p !== undefined && <td style={td}>{l.p}</td>}
                <td style={td}>{l.g}</td>
                <td style={td}>{l.o}</td>
                <td style={td}>
                  <span style={{ display: 'inline-block', width: 120, height: 8, borderRadius: 99, background: C.bordure, overflow: 'hidden', verticalAlign: 'middle' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.max(4, Math.round(l.n / max * 100))}%`, background: C.degrade }} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
