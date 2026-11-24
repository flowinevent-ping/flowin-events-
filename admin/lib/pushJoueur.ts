/**
 * RAPPELS (notifications Web Push) du joueur : 24/11/2026.
 * Règles de Romain : activés par défaut, case « Rappels » décochable, une seule demande de permission du
 * téléphone, jamais bloquant. Sur iPhone, les notifications n'existent que si l'appli est installée : sinon
 * l'API est absente, on n'affiche rien et on ne notifie pas (aucun message technique).
 * Démo (?demo=1) : aucune permission demandée, aucune écriture.
 * Stockage : RPC push_abonner / push_desabonner (sql/2026-11-24-push-abonnements.sql). Tant que la migration
 * n'est pas appliquée, la RPC est absente : on ignore sans bruit.
 * Clé publique VAPID : NEXT_PUBLIC_VAPID_PUBLIC_KEY (la clé privée ne vit que dans les secrets Supabase).
 */
import { supabase } from '@/lib/supabase'
import { rpcAbsente } from '@/lib/rpcRepli'
import { estDemo } from '@/lib/demo'

const CLE_PUBLIQUE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BIfRxeL5gwdS__iOoxtJ6YS8cmf08UJHCXu5gDJlihkxXNQJBZfvNQwC2xszvfHbEuaAPoF_wcrFISqpRduia-I'
const K_PREF = 'flowin_rappels'          // '0' = décoché ; absent = coché (défaut)
const K_DEMANDE = 'flowin_push_demande'  // la demande automatique n'est faite qu'une fois
const K_SYNC = 'flowin_push_sync'        // joueur|endpoint déjà enregistré

function lire(k: string): string | null { try { return localStorage.getItem(k) } catch { return null } }
function ecrire(k: string, v: string | null) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch { /* */ } }

/** Vrai seulement si le téléphone sait recevoir des notifications (iPhone : appli installée). */
export function pushSupporte(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}
export function permissionRefusee(): boolean {
  return pushSupporte() && Notification.permission === 'denied'
}
/** Case « Rappels » : cochée par défaut. */
export function rappelsCoches(): boolean { return lire(K_PREF) !== '0' }

function joueurValide(id: string | null | undefined): id is string {
  return !!id && id.indexOf('demo') !== 0 && !estDemo()
}

function cleEnOctets(b64: string): Uint8Array {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const s = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

async function registration(): Promise<ServiceWorkerRegistration> {
  /* Portée /moi : le worker ne contrôle aucune autre page ; l'abonnement se prend depuis n'importe quelle page. */
  return navigator.serviceWorker.register('/sw-push.js', { scope: '/moi' })
}

/** Enregistre l'abonnement du téléphone. Ne demande la permission que si `demander` et qu'elle est encore « default ». */
export async function synchroniserRappels(joueurId: string | null | undefined, demander: boolean): Promise<void> {
  try {
    if (!pushSupporte() || !joueurValide(joueurId) || !rappelsCoches()) return
    if (Notification.permission === 'denied') return
    if (Notification.permission === 'default') {
      if (!demander) return
      ecrire(K_DEMANDE, '1')
      const p = await Notification.requestPermission()
      if (p !== 'granted') return
    }
    const reg = await registration()
    await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleEnOctets(CLE_PUBLIQUE) as unknown as BufferSource })
    const j = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    if (!j.endpoint || !j.keys || !j.keys.p256dh || !j.keys.auth) return
    const marque = joueurId + '|' + j.endpoint
    if (lire(K_SYNC) === marque) return
    const r = await supabase.rpc('push_abonner', { p_joueur_id: joueurId, p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth })
    if (!r.error && (r.data as { ok?: boolean } | null)?.ok) ecrire(K_SYNC, marque)
    else if (r.error && !rpcAbsente(r.error)) { /* réessai à la prochaine ouverture */ }
  } catch { /* jamais bloquant */ }
}

/** Demande automatique unique : au premier toucher de l'écran (le téléphone exige un geste). */
export function armerPremiereDemande(joueurId: string | null | undefined): void {
  try {
    if (!pushSupporte() || !joueurValide(joueurId) || !rappelsCoches()) return
    if (Notification.permission === 'granted') { void synchroniserRappels(joueurId, false); return }
    if (Notification.permission !== 'default' || lire(K_DEMANDE) === '1') return
    const f = () => { document.removeEventListener('pointerup', f, true); void synchroniserRappels(joueurId, true) }
    document.addEventListener('pointerup', f, true)
  } catch { /* */ }
}

/** Case cochée / décochée par le joueur. Décocher = désabonnement immédiat, cocher = nouvel abonnement. */
export async function definirRappels(joueurId: string | null | undefined, actif: boolean): Promise<void> {
  try {
    if (!joueurValide(joueurId)) return
    ecrire(K_PREF, actif ? null : '0')
    if (actif) { await synchroniserRappels(joueurId, true); return }
    if (!pushSupporte()) return
    const reg = await navigator.serviceWorker.getRegistration('/moi')
    const sub = reg ? await reg.pushManager.getSubscription() : null
    if (sub) {
      const endpoint = sub.endpoint
      await sub.unsubscribe().catch(() => false)
      await supabase.rpc('push_desabonner', { p_joueur_id: joueurId, p_endpoint: endpoint })
    }
    ecrire(K_SYNC, null)
  } catch { /* */ }
}
