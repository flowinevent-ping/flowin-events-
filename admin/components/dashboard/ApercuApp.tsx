'use client'

/**
 * APERCU APP — ce que le joueur verra, construit pendant qu on saisit.
 *
 * Romain, 02/09 : « pourquoi ne pas avoir un parcours comme celui de la landing
 * page, avec le visuel app etape apres etape et parametrage [...] il faut
 * quelque chose de plus ergonomique, step by step, visuel app construit en meme
 * temps ».
 *
 * HONNETETE SUR CE QUE C EST : pendant la CREATION, l event n existe pas encore
 * en base. On ne peut donc pas afficher le vrai parcours dans une iframe, comme
 * le fait ParcoursMobil sur un event deja cree — l URL pointerait dans le vide.
 * Cet apercu est donc un RENDU DU BROUILLON : le nom, la couleur, le module et
 * les lots reellement saisis, dans la mise en page du parcours joueur. Il est
 * annonce comme tel a l ecran, pour que personne ne le prenne pour le parcours
 * final.
 *
 * Des que l event est cree, c est ParcoursMobil (le vrai parcours en iframe)
 * qui prend le relais depuis sa fiche.
 */

const MODULE_ECRAN: Record<string, { titre: string; action: string; sous: string }> = {
  spin: { titre: 'Tournez la roue', action: 'Lancer la roue', sous: 'Un tour, un résultat immédiat' },
  quiz: { titre: 'Prêt pour le quiz ?', action: 'Commencer', sous: 'Quelques questions, puis votre score' },
  quizmaster: { titre: 'Quiz Master', action: 'Rejoindre', sous: 'Un meneur lance les questions' },
  quizsolo: { titre: 'Quiz', action: 'Commencer', sous: 'À votre rythme' },
  tombola: { titre: 'Tombola', action: 'Participer', sous: 'Tirage au sort différé' },
  vote: { titre: 'À vous de voter', action: 'Voter', sous: 'Le public départage' },
  paques: { titre: 'Chasse aux œufs', action: 'Chercher', sous: 'Trouvez les œufs cachés' },
}

export interface BrouillonApercu {
  nom?: string
  module?: string
  couleur?: string
  lieu?: string | null
  dateD?: string | null
  /** Les lots saisis, pour l ecran « ce qu il y a a gagner ». */
  lots?: { nom?: string; quantite?: number; valeur?: number }[]
  /** Nom de l operation, affiche au-dessus du titre quand il y en a une. */
  superEvent?: string | null
}

export default function ApercuApp({
  d, ecran = 'accueil', onEcran,
}: {
  d: BrouillonApercu
  ecran?: 'accueil' | 'lots' | 'fin'
  onEcran?: (e: 'accueil' | 'lots' | 'fin') => void
}) {
  const accent = d.couleur || '#7C2D92'
  const m = MODULE_ECRAN[d.module ?? ''] ?? { titre: 'Votre jeu', action: 'Commencer', sous: 'Choisissez un module pour voir l’écran' }
  const lots = (d.lots ?? []).filter(l => (l.nom ?? '').trim())

  return (
    <div className="sa-apercu">
      <div className="sa-apercu-tete">
        <span className="t">Aperçu du jeu</span>
        <span className="d">Construit à partir de votre saisie</span>
      </div>

      <div className="sa-tel">
        <div className="sa-tel-ecran" style={{ background: `linear-gradient(160deg, ${accent} 0%, ${accent}CC 46%, #0F172A 100%)` }}>
          <div className="sa-tel-encoche" />

          {ecran === 'accueil' && (
            <div className="sa-tel-corps">
              {d.superEvent && <div className="sur">{d.superEvent}</div>}
              <div className="marque">{d.nom?.trim() || 'Nom de l’événement'}</div>
              <div className="titre">{m.titre}</div>
              <div className="sous">{m.sous}</div>
              <div className="cta" style={{ color: accent }}>{m.action}</div>
              {(d.lieu || d.dateD) && (
                <div className="pied">
                  {d.lieu ? `📍 ${d.lieu}` : ''}{d.lieu && d.dateD ? ' · ' : ''}
                  {d.dateD ? `📅 ${new Date(d.dateD).toLocaleDateString('fr-FR')}` : ''}
                </div>
              )}
            </div>
          )}

          {ecran === 'lots' && (
            <div className="sa-tel-corps">
              <div className="titre" style={{ marginTop: 4 }}>À gagner</div>
              {lots.length === 0 && <div className="sous">Aucun lot saisi pour l’instant.</div>}
              <div className="lots">
                {lots.slice(0, 5).map((l, i) => (
                  <div key={i} className="lot">
                    <span className="n">{l.nom}</span>
                    <span className="q">
                      {l.valeur ? `${l.valeur} €` : ''}{l.valeur && l.quantite ? ' · ' : ''}
                      {l.quantite ? `×${l.quantite}` : ''}
                    </span>
                  </div>
                ))}
                {lots.length > 5 && <div className="sous">+ {lots.length - 5} autre(s)</div>}
              </div>
            </div>
          )}

          {ecran === 'fin' && (
            <div className="sa-tel-corps">
              <div className="titre" style={{ marginTop: 30 }}>Merci d’avoir joué</div>
              <div className="sous">Votre résultat s’affiche ici, puis le billet si vous gagnez.</div>
              <div className="cta" style={{ color: accent }}>Voir mon billet</div>
            </div>
          )}
        </div>
      </div>

      {onEcran && (
        <div className="sa-apercu-pas">
          {([['accueil', 'Accueil'], ['lots', 'Lots'], ['fin', 'Fin']] as const).map(([id, lbl]) => (
            <button key={id} className={`sa-btn sm${ecran === id ? ' primary' : ''}`} onClick={() => onEcran(id)}>
              {lbl}
            </button>
          ))}
        </div>
      )}

      <p className="sa-apercu-note">
        Rendu de votre saisie, pas le parcours final : l’événement n’existe pas
        encore. Une fois créé, sa fiche affiche le <b>vrai</b> parcours en direct.
      </p>
    </div>
  )
}
