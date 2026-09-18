'use client'
import { AGE_OPTIONS, SOURCES } from '@/lib/parcours'

/* Bloc de champs standard (sexe / tranche d'age / code postal / provenance),
   partage par tous les parcours -- avant ca chaque fichier redessinait son
   propre sous-ensemble (QuizSolo/QuizMaster n'avaient AUCUN de ces 4 champs,
   Spin n'avait pas le sexe, Tombola avait un sexe en libelles emoji
   different du "H"/"F" utilise partout ailleurs). Un seul bloc = un seul
   formulaire partout (Romain, 18/09 : « le même formulaire sur tous les
   endroits, pas ce formulaire-là »). */

interface ChampsStandardForm { genre: string; age: string; cp: string; source: string }

export default function ParcoursChampsStandard<T extends ChampsStandardForm>(
  { form, setForm }: { form: T; setForm: (updater: (f: T) => T) => void }
) {
  return (
    <>
      <div className="grid2" style={{ marginBottom: 12 }}>
        <div>
          <label className="label">Sexe</label>
          <select className="input" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}>
            <option value="">—</option>
            <option value="H">Homme</option>
            <option value="F">Femme</option>
          </select>
        </div>
        <div>
          <label className="label">Tranche d&apos;âge</label>
          <select className="input" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}>
            {AGE_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label className="label">Code postal</label>
        <input className="input" inputMode="numeric" autoComplete="postal-code" value={form.cp} onChange={e => setForm(f => ({ ...f, cp: e.target.value }))} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label className="label">Comment nous avez-vous connu ?</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {SOURCES.map(s => (
            <button key={s} className={`source-chip${form.source === s ? ' sel' : ''}`} onClick={() => setForm(f => ({ ...f, source: s }))}>{s}</button>
          ))}
        </div>
      </div>
    </>
  )
}
