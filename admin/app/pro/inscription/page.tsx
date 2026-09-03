'use client'

/**
 * CREER SON COMPTE PRO — cote pro.
 *
 * Romain, 03/09 : « la création d'un pro côté pro ou dashboard SA doit être la
 * même ».
 *
 * Elle ne l'etait pas. Cette page posait sept champs d'un bloc, avec un secteur
 * en TEXTE LIBRE — deux commerces du meme metier finissaient donc dans deux
 * secteurs differents, et tout regroupement par secteur etait faux. Le SA, lui,
 * en posait quinze en cinq etapes.
 *
 * Les etapes viennent desormais de `lib/proCreation.ts`, la meme definition que
 * le dashboard. Memes questions, meme ordre, memes validations, meme liste de
 * secteurs. Ce qui reste propre a ce cote : le mot de passe, qui ouvre le compte,
 * et le fait que l'inscription arrive en `en_attente` — c'est une demande, pas
 * une creation.
 *
 * L'HABILLAGE NE CHANGE PAS : primitives de `proPublicUI`, avec la barre
 * d'etapes du parcours pro (RejoindreWizard) pour la progression.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  wrap, pageWrap, cardFloating, Hero, fieldInput, fieldLabel, fieldBlock,
  primaryBtn, ghostLink, errorBox, helpText, SuccessScreen, ACCENT_D, MUTED, BORDER,
} from '@/components/pro/proPublicUI'
import {
  PROFILS_PRO, etapesPour, ficheProVide, identifiantPro, lignePro, recapPro,
  type ChampPro, type FichePro, type ProfilPro,
} from '@/lib/proCreation'

export default function InscriptionProPage() {
  const [f, setF] = useState<FichePro>(ficheProVide())
  const [i, setI] = useState(0)
  const [envoi, setEnvoi] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [erreur, setErreur] = useState('')

  const maj = (c: Partial<FichePro>) => setF(x => ({ ...x, ...c }))
  const etapes = useMemo(() => etapesPour('pro', f.profil), [f.profil])
  const e = etapes[i]
  const dernier = i === etapes.length - 1
  const bloque = e?.bloque(f, 'pro')

  async function envoyer() {
    setEnvoi('loading'); setErreur('')

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: f.email.trim(), password: f.motdepasse,
    })
    if (authErr || !authData.user) {
      setErreur(authErr?.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email.'
        : (authErr?.message ?? 'Erreur de création de compte.'))
      setEnvoi('error')
      return
    }

    /* L identifiant est deduit du nom, exactement comme cote SA. S il est deja
       pris, on suffixe : deux commerces peuvent porter le meme nom, mais pas la
       meme cle — un insert dessus ecraserait la fiche de l autre. */
    const ligne = lignePro(f, 'pro')
    let id = identifiantPro(f)
    const { data: existe } = await supabase.from('pros').select('id').eq('id', id).maybeSingle()
    if (existe) id = `${id}-${Math.random().toString(36).slice(2, 6)}`

    const { error: insErr } = await supabase.from('pros').insert({
      ...ligne, id, auth_id: authData.user.id,
    })
    if (insErr) { setErreur(insErr.message); setEnvoi('error'); return }
    setEnvoi('ok')
  }

  if (envoi === 'ok') {
    return (
      <SuccessScreen emoji="✅" title="Demande envoyée">
        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: '#374151' }}>
          Votre compte est créé et en attente de validation par l&apos;équipe Flowin. Vous pouvez déjà{' '}
          <Link href="/pro/connexion" style={ghostLink}>vous connecter</Link> pour suivre l&apos;état de votre demande.
        </div>
      </SuccessScreen>
    )
  }

  function Champ({ c }: { c: ChampPro }) {
    const v = (f[c.cle] as string) ?? ''
    const set = (x: string) => maj({ [c.cle]: x } as Partial<FichePro>)
    return (
      <div style={fieldBlock}>
        <label style={fieldLabel}>{c.label}</label>
        {c.type === 'liste' ? (
          <select style={fieldInput} value={v} onChange={ev => set(ev.target.value)}>
            <option value="">— Choisir —</option>
            {(c.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : c.type === 'zone' ? (
          <textarea style={{ ...fieldInput, minHeight: 76, resize: 'vertical', fontFamily: 'inherit' }}
            value={v} onChange={ev => set(ev.target.value)} placeholder={c.placeholder} />
        ) : (
          <input
            style={fieldInput}
            type={c.type === 'email' ? 'email' : c.type === 'tel' ? 'tel' : c.type === 'motdepasse' ? 'password' : 'text'}
            autoCapitalize={c.type === 'email' ? 'none' : undefined}
            value={v} onChange={ev => set(ev.target.value)} placeholder={c.placeholder}
          />
        )}
        {c.aide && <div style={{ fontSize: 12, color: MUTED, marginTop: 5, lineHeight: 1.5 }}>{c.aide}</div>}
      </div>
    )
  }

  return (
    <div style={wrap}>
      <Hero
        kicker="Espace pro Flowin"
        title="Créez votre compte"
        sub="Votre demande sera validée par l'équipe Flowin avant activation."
      />
      <div style={pageWrap}>
        <div style={cardFloating}>
          {/* La jauge du parcours pro — meme mecanique que RejoindreWizard. */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: ACCENT_D }}>
              Étape {i + 1} sur {etapes.length}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {etapes.map((_, n) => (
                <div key={n} style={{ flex: 1, height: 5, borderRadius: 99, background: n <= i ? ACCENT_D : BORDER }} />
              ))}
            </div>
          </div>

          <div style={{ fontWeight: 800, fontSize: 17 }}>{e?.icone} {e?.titre}</div>
          <div style={{ fontSize: 13, color: MUTED, margin: '4px 0 18px', lineHeight: 1.55 }}>{e?.sous}</div>

          {e?.vignettes && (
            <div style={{ display: 'grid', gap: 10 }}>
              {PROFILS_PRO.map(p => (
                <div
                  key={p.id}
                  onClick={() => maj({ profil: p.id as ProfilPro })}
                  style={{
                    border: f.profil === p.id ? `2px solid ${ACCENT_D}` : `1.5px solid ${BORDER}`,
                    background: f.profil === p.id ? 'rgba(124,45,146,.05)' : '#fff',
                    borderRadius: 14, padding: 16, cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14.5 }}>{p.icone} {p.titre}</div>
                  <div style={{ fontSize: 12.5, color: MUTED, margin: '4px 0 8px', lineHeight: 1.5 }}>{p.sous}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {p.badges.map(b => (
                      <span key={b} style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(124,45,146,.1)', color: ACCENT_D }}>{b}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {e?.champs.map(c => <Champ key={c.cle} c={c} />)}

          {e?.id === 'recap' && (
            <div>
              {recapPro(f, 'pro').map(l => (
                <div key={l.k} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ minWidth: 120, fontSize: 12, fontWeight: 800, color: MUTED }}>{l.k}</span>
                  <span style={{ fontSize: 13.5 }}>{l.v}</span>
                </div>
              ))}
              <div style={{ fontSize: 12.5, color: MUTED, marginTop: 14, lineHeight: 1.55 }}>
                Votre compte est créé en attente : l’équipe Flowin le valide avant
                que vous puissiez recevoir une station.
              </div>
            </div>
          )}

          {erreur && <div style={{ ...errorBox, marginTop: 16 }}>{erreur}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <button
              onClick={() => setI(n => Math.max(0, n - 1))}
              disabled={i === 0 || envoi === 'loading'}
              style={{ background: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: i === 0 ? 0.4 : 1 }}
            >
              ← Précédent
            </button>
            <div style={{ flex: 1 }} />
            {bloque
              ? <span style={{ fontSize: 12.5, fontWeight: 800, color: '#B45309', textAlign: 'right', maxWidth: 260, lineHeight: 1.4 }}>{bloque}</span>
              : dernier
                ? <button onClick={envoyer} disabled={envoi === 'loading'} style={{ ...primaryBtn, width: 'auto', marginTop: 0 }}>
                    {envoi === 'loading' ? 'Envoi…' : 'Créer mon compte'}
                  </button>
                : <button onClick={() => setI(n => n + 1)} style={{ ...primaryBtn, width: 'auto', marginTop: 0 }}>Suivant →</button>}
          </div>

          <div style={helpText}>Déjà inscrit ? <Link href="/pro/connexion" style={ghostLink}>Se connecter</Link></div>
        </div>
      </div>
    </div>
  )
}
