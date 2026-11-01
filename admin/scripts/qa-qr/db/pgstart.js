// Demarre un cluster Postgres JETABLE (port 54399) dans le scratchpad, en tant qu'utilisateur postgres.
const cp = require('child_process')
const fs = require('fs')
const S = process.argv[2]
const uid = Number(cp.execSync('id -u postgres').toString())
const gid = Number(cp.execSync('id -g postgres').toString())
const B = '/usr/lib/postgresql/16/bin/'
const o = { uid, gid, stdio: 'inherit' }
fs.mkdirSync(S + '/pgdata', { recursive: true })
fs.chownSync(S + '/pgdata', uid, gid)
if (!fs.existsSync(S + '/pgdata/PG_VERSION')) cp.spawnSync(B + 'initdb', ['-D', S + '/pgdata', '-A', 'trust'], o)
cp.spawnSync(B + 'pg_ctl', ['-D', S + '/pgdata', '-o', '-p 54399 -k /tmp', '-l', S + '/pgdata/pg.log', '-w', 'start'], o)
