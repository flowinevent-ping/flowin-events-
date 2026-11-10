'use client'
/**
 * IMPORTER VOTRE FICHIER CLIENT (registre L13, 10/11/2026).
 * Carrousel en 4 ecrans, sans defilement : 1 fichier, 2 colonnes, 3 apercu, 4 import.
 * Les contacts rejoignent le fichier client du pro (crm_pro) avec l'origine « import »,
 * via la RPC securisee import_contacts_pro (sql/2026-11-10-import-fichier-client.sql).
 * Consentement : seulement si la colonne consentement du fichier dit oui.
 */
import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { CHARTE_PRO as C } from '@/lib/charte'
import { BTN, BTN2, CARD, MUTED } from '@/lib/proui'

type Champ = 'prenom' | 'nom' | 'email' | 'tel' | 'genre' | 'ville' | 'code_postal' | 'optin'
const CHAMPS: { id: Champ; label: string; mots: string[] }[] = [
  { id: 'prenom', label: 'Prénom', mots: ['prenom', 'firstname', 'first name', 'given name'] },
  { id: 'nom', label: 'Nom', mots: ['nom', 'lastname', 'last name', 'surname', 'nom de famille'] },
  { id: 'email', label: 'Email', mots: ['email', 'e-mail', 'mail', 'courriel', 'adresse mail'] },
  { id: 'tel', label: 'Téléphone', mots: ['tel', 'telephone', 'phone', 'mobile', 'portable', 'gsm'] },
  { id: 'genre', label: 'Genre', mots: ['genre', 'sexe', 'civilite', 'gender', 'sex'] },
  { id: 'ville', label: 'Ville', mots: ['ville', 'city', 'commune', 'localite'] },
  { id: 'code_postal', label: 'Code postal', mots: ['code postal', 'cp', 'zip', 'postal', 'codepostal'] },
  { id: 'optin', label: 'Consentement', mots: ['consentement', 'optin', 'opt-in', 'opt in', 'rgpd', 'newsletter', 'accord', 'consent'] },
]
const LOT = 500

export interface ContactImport { prenom: string; nom: string; email: string; tel: string; genre: '' | 'Homme' | 'Femme'; ville: string; code_postal: string; optin: boolean }

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[_.]/g, ' ').replace(/\s+/g, ' ').trim()

/** Associe chaque champ a la colonne dont l'en-tete lui ressemble le plus. */
export function deviner(entetes: string[]): Record<Champ, number> {
  const res = {} as Record<Champ, number>
  const pris = new Set<number>()
  for (const ch of CHAMPS) {
    let idx = entetes.findIndex((h, i) => !pris.has(i) && ch.mots.includes(norm(h)))
    if (idx < 0) idx = entetes.findIndex((h, i) => !pris.has(i) && ch.mots.some(m => m.length > 2 && norm(h).includes(m)))
    if (idx >= 0) pris.add(idx)
    res[ch.id] = idx
  }
  return res
}

/** Lecture CSV simple (guillemets, separateur ; , ou tabulation detecte). */
function lireCsv(texte: string): string[][] {
  const t = texte.replace(/^﻿/, '')
  const l1 = t.split(/\r?\n/)[0] ?? ''
  const sep = [';', ',', '\t'].sort((a, b) => l1.split(b).length - l1.split(a).length)[0]
  const lignes: string[][] = []
  let ligne: string[] = [], cel = '', q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) {
      if (c === '"' && t[i + 1] === '"') { cel += '"'; i++ } else if (c === '"') q = false; else cel += c
    } else if (c === '"') q = true
    else if (c === sep) { ligne.push(cel); cel = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      ligne.push(cel); lignes.push(ligne); ligne = []; cel = ''
    } else cel += c
  }
  if (cel || ligne.length) { ligne.push(cel); lignes.push(ligne) }
  return lignes.filter(l => l.some(x => x.trim()))
}

async function lireFichier(f: File): Promise<string[][]> {
  if (/\.(csv|txt)$/i.test(f.name)) return lireCsv(await f.text())
  const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: '' })
  return rows.map(r => r.map(x => String(x ?? ''))).filter(l => l.some(x => x.trim()))
}

const OUI = ['oui', 'o', 'yes', 'y', '1', 'true', 'vrai', 'x', 'ok', 'accepte', 'accord', 'opt-in', 'optin']
function genreDe(v: string): '' | 'Homme' | 'Femme' {
  const n = norm(v)
  if (['h', 'homme', 'm', 'mr', 'm.', 'monsieur', 'masculin', 'male'].indexOf(n) >= 0) return 'Homme'
  if (['f', 'femme', 'mme', 'mlle', 'madame', 'mademoiselle', 'feminin', 'female'].indexOf(n) >= 0) return 'Femme'
  return ''
}
export const telNorm = (v: string) => v.replace(/[^0-9+]/g, '')
const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)

export function construire(lignes: string[][], map: Record<Champ, number>) {
  const get = (l: string[], c: Champ) => (map[c] >= 0 ? (l[map[c]] ?? '').trim() : '')
  const vus = new Set<string>()
  const contacts: ContactImport[] = []
  let doublons = 0, invalides = 0
  for (const l of lignes) {
    const email = get(l, 'email').toLowerCase()
    const c: ContactImport = {
      prenom: get(l, 'prenom'), nom: get(l, 'nom'), email: emailOk(email) ? email : '', tel: telNorm(get(l, 'tel')),
      genre: genreDe(get(l, 'genre')), ville: get(l, 'ville'), code_postal: get(l, 'code_postal'),
      optin: map.optin >= 0 && OUI.indexOf(norm(get(l, 'optin'))) >= 0,
    }
    if (!c.code_postal) { const m = c.ville.match(/\b(\d{5})\b/); if (m) { c.code_postal = m[1]; c.ville = c.ville.replace(m[1], '').trim() } }
    if (!c.email && c.tel.length < 6) { invalides++; continue }
    if (c.tel.length < 6) c.tel = ''
    const cles = [c.email && 'e:' + c.email, c.tel && 't:' + c.tel].filter(Boolean) as string[]
    if (cles.some(k => vus.has(k))) { doublons++; continue }
    cles.forEach(k => vus.add(k))
    contacts.push(c)
  }
  return { contacts, doublons, invalides, optin: contacts.filter(c => c.optin).length }
}

function messageErreur(brut: string): string {
  if (/PGRST202|42883|could not find the function|does not exist|schema cache/i.test(brut)) return 'L’import n’est pas encore activé sur votre espace. L’équipe Flowin l’active très bientôt : réessayez plus tard.'
  if (/42501|acces refuse|permission denied|JWT/i.test(brut)) return 'Import refusé avec ce compte. Reconnectez-vous à votre espace pro puis réessayez.'
  if (/54000|trop de lignes/i.test(brut)) return 'Fichier trop volumineux : 5000 contacts maximum par import.'
  if (/fetch|network|timeout/i.test(brut)) return 'Connexion impossible : vérifiez votre réseau puis réessayez.'
  return 'L’import n’a pas abouti. Réessayez ; si le problème continue, contactez Flowin.'
}

const ETAPES = ['Fichier', 'Colonnes', 'Aperçu', 'Import']

export default function ImportFichierClient({ proId }: { proId: string }) {
  const [etape, setEtape] = useState(0)
  const [nomFichier, setNomFichier] = useState('')
  const [entetes, setEntetes] = useState<string[]>([])
  const [lignes, setLignes] = useState<string[][]>([])
  const [map, setMap] = useState<Record<Champ, number> | null>(null)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [res, setRes] = useState<{ total: number; crees: number; rattaches: number; ignores: number } | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''

  const bilan = useMemo(() => (map ? construire(lignes, map) : null), [lignes, map])

  async function choisir(f: File | undefined) {
    if (!f) return
    setErreur('')
    if (!/\.(csv|txt|xlsx|xls|ods)$/i.test(f.name)) { setErreur('Format non pris en charge : CSV, Excel (.xlsx, .xls) ou tableur (.ods).'); return }
    try {
      const rows = await lireFichier(f)
      if (rows.length < 2) { setErreur('Fichier vide : il faut une ligne d’en-têtes puis au moins un contact.'); return }
      setNomFichier(f.name); setEntetes(rows[0]); setLignes(rows.slice(1)); setMap(deviner(rows[0])); setRes(null); setEtape(1)
    } catch { setErreur('Fichier illisible. Enregistrez-le en CSV ou .xlsx puis réessayez.') }
  }

  async function importer() {
    if (!bilan) return
    setEnvoi(true); setErreur(''); setEtape(3)
    const total = { total: 0, crees: 0, rattaches: 0, ignores: 0 }
    try {
      for (let i = 0; i < bilan.contacts.length; i += LOT) {
        const { data, error } = await supabase.rpc('import_contacts_pro', { p_pro: proId, p_contacts: bilan.contacts.slice(i, i + LOT) })
        if (error) throw new Error(`${error.code ?? ''} ${error.message}`)
        const d = (data ?? {}) as Partial<typeof total>
        total.total += Number(d.total ?? 0); total.crees += Number(d.crees ?? 0); total.rattaches += Number(d.rattaches ?? 0); total.ignores += Number(d.ignores ?? 0)
      }
      setRes(total)
    } catch (e) { setErreur(messageErreur(e instanceof Error ? e.message : String(e))) }
    setEnvoi(false)
  }

  const ok = !!map && (map.email >= 0 || map.tel >= 0)
  const pastille = (n: number, l: string, couleur: string = C.texte) => (
    <div style={{ background: C.subtil, border: `1px solid ${C.bordure}`, borderRadius: 14, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: couleur }}>{n}</div>
      <div style={{ fontSize: 11.5, ...MUTED, fontWeight: 700 }}>{l}</div>
    </div>
  )

  return (
    <div data-import-fichier style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {ETAPES.map((e, i) => (
          <div key={e} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 4, background: i <= etape ? C.bleu : C.bordure }} />
            <div style={{ fontSize: 11, fontWeight: 800, marginTop: 4, color: i === etape ? C.bleu : C.attenue }}>{i + 1}. {e}</div>
          </div>
        ))}
      </div>

      <div style={{ ...CARD, padding: 16 }}>
        {etape === 0 && (
          <div data-etape="fichier">
            <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 4 }}>Choisissez votre fichier</div>
            <div style={{ fontSize: 13, ...MUTED, marginBottom: 14 }}>CSV, Excel (.xlsx, .xls) ou tableur (.ods). Une ligne par contact.</div>
            <input ref={input} type="file" accept=".csv,.txt,.xlsx,.xls,.ods" style={{ display: 'none' }} onChange={e => choisir(e.target.files?.[0])} />
            <button type="button" onClick={() => input.current?.click()} style={{ ...BTN, width: '100%' }}>Choisir un fichier</button>
            <div style={{ fontSize: 12, ...MUTED, marginTop: 12, lineHeight: 1.45 }}>Seuls les contacts qui ont donné leur consentement pourront être recontactés.</div>
          </div>
        )}

        {etape === 1 && map && (
          <div data-etape="colonnes">
            <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 2 }}>Vos colonnes</div>
            <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomFichier} · {lignes.length} ligne{lignes.length > 1 ? 's' : ''}. Corrigez si besoin.</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {CHAMPS.map(ch => (
                <label key={ch.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800 }}>
                  {ch.label}
                  <select data-champ={ch.id} value={map[ch.id]} onChange={e => setMap({ ...map, [ch.id]: Number(e.target.value) })}
                    style={{ padding: '7px 8px', borderRadius: 10, border: `1.5px solid ${map[ch.id] >= 0 ? C.bleu : C.bordureChamp}`, background: '#fff', fontSize: 13, color: C.texte, minWidth: 0 }}>
                    <option value={-1}>Aucune</option>
                    {entetes.map((h, i) => <option key={i} value={i}>{h || `Colonne ${i + 1}`}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {!ok && <div style={{ fontSize: 12.5, color: C.ko, fontWeight: 700, marginTop: 8 }}>Choisissez au moins la colonne email ou téléphone.</div>}
          </div>
        )}

        {etape === 2 && bilan && (
          <div data-etape="apercu">
            <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 10 }}>Aperçu</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 10 }}>
              {pastille(bilan.contacts.length, 'à importer', C.bleu)}
              {pastille(bilan.optin, 'avec consentement', C.ok)}
              {pastille(bilan.doublons, 'doublons retirés')}
              {pastille(bilan.invalides, 'sans email ni tél.')}
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              {bilan.contacts.slice(0, 3).map((c, i) => (
                <div key={i} style={{ fontSize: 12.5, padding: '6px 10px', background: C.subtil, borderRadius: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <b>{[c.prenom, c.nom].filter(Boolean).join(' ') || 'Sans nom'}</b> · {c.email || c.tel}{c.optin ? ' · consentement' : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {etape === 3 && (
          <div data-etape="import" style={{ textAlign: 'center', padding: '8px 0' }}>
            {envoi && <div style={{ fontSize: 16, fontWeight: 900 }}>Import en cours…</div>}
            {!envoi && res && (
              <div data-resultat="ok">
                <div style={{ fontSize: 18, fontWeight: 900, color: C.ok, marginBottom: 10 }}>Fichier importé</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 12 }}>
                  {pastille(res.crees, 'nouveaux contacts', C.bleu)}
                  {pastille(res.rattaches, 'déjà connus, ajoutés')}
                </div>
                <Link href={`/pro/donnees${q}`} style={{ ...BTN, display: 'block', textDecoration: 'none' }}>Voir mes contacts</Link>
              </div>
            )}
            {!envoi && erreur && (
              <div data-resultat="erreur">
                <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>Import non effectué</div>
                <div style={{ fontSize: 13.5, ...MUTED, lineHeight: 1.5, marginBottom: 12 }}>{erreur}</div>
                <button type="button" onClick={() => setEtape(2)} style={{ ...BTN2, width: '100%' }}>Retour</button>
              </div>
            )}
          </div>
        )}
        {etape < 3 && erreur && <div data-erreur style={{ fontSize: 12.5, color: C.ko, fontWeight: 700, marginTop: 10 }}>{erreur}</div>}
      </div>

      {(etape === 1 || etape === 2) && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setEtape(etape - 1)} style={{ ...BTN2, flex: 1 }}>Retour</button>
          {etape === 1 && <button type="button" disabled={!ok} onClick={() => setEtape(2)} style={{ ...BTN, flex: 2, opacity: ok ? 1 : 0.5 }}>Continuer</button>}
          {etape === 2 && <button type="button" disabled={!bilan?.contacts.length} onClick={importer} style={{ ...BTN, flex: 2, opacity: bilan?.contacts.length ? 1 : 0.5 }}>Importer {bilan?.contacts.length ?? 0} contacts</button>}
        </div>
      )}
    </div>
  )
}
