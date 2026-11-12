import { atom, read, update } from 'claude-code'
import type { Engine, Register } from 'claude-code'

import type { Desk, OfficeAgent } from '../types'

const PANE = 'agent-office'
const TITLE = 'Agent office'
const DESKS: Desk[] = ['Builder', 'Writer', 'Reviewer', 'Helper']

const agents = atom({ plugin: 'agent-office', key: 'agents' } as const, [], {
  shape: 'agents-1',
})

/**
 * Picks a desk: an agent named for a desk (`builder`, `writer-2`,
 * `Reviewer_A`, `helper`) sits there; otherwise its type and task words decide.
 */
export function deskFor(kind: string, text: string, name?: string): Desk {
  const named = /^(builder|writer|reviewer|helper)/i.exec(name ?? '')?.[1]
  if (named !== undefined) {
    return (named[0].toUpperCase() + named.slice(1).toLowerCase()) as Desk
  }
  const t = `${kind} ${text}`.toLowerCase()
  if (/review|check|verif|test|audit|lint|inspect/.test(t)) return 'Reviewer'
  if (/writ|doc|draft|readme|summar|report|explain|blog|copy/.test(t)) return 'Writer'
  if (/build|implement|fix|creat|add|refactor|code|make|scaffold|migrat/.test(t)) return 'Builder'
  return 'Helper'
}

// ---------- cartoon office ----------

const LOOK: Record<Desk, { shirt: string; hat: string }> = {
  Builder: { shirt: '#e8833a', hat: 'hardhat' },
  Writer: { shirt: '#8a63d2', hat: 'beret' },
  Reviewer: { shirt: '#2f8fd8', hat: 'glasses' },
  Helper: { shirt: '#3aa66b', hat: 'headset' },
}

function esc(t: string): string {
  return t.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)
}

function cut(t: string, n: number): string {
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

function hat(kind: string, x: number, y: number): string {
  switch (kind) {
    case 'hardhat':
      return `<path d="M${x - 21} ${y - 6} a21 19 0 0 1 42 0 z" fill="#f6c431" stroke="#b8901c" stroke-width="2"/>
        <rect x="${x - 25}" y="${y - 8}" width="50" height="5" rx="2" fill="#f6c431" stroke="#b8901c" stroke-width="1.5"/>`
    case 'beret':
      return `<ellipse cx="${x - 3}" cy="${y - 15}" rx="21" ry="8" fill="#c0392b"/>
        <circle cx="${x - 3}" cy="${y - 23}" r="3" fill="#c0392b"/>`
    case 'glasses':
      return `<circle cx="${x - 8}" cy="${y}" r="7" fill="none" stroke="#333" stroke-width="2"/>
        <circle cx="${x + 8}" cy="${y}" r="7" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="${x - 1}" y1="${y}" x2="${x + 1}" y2="${y}" stroke="#333" stroke-width="2"/>`
    default:
      return `<path d="M${x - 20} ${y} a20 22 0 0 1 40 0" fill="none" stroke="#333" stroke-width="3"/>
        <rect x="${x - 24}" y="${y - 4}" width="7" height="12" rx="3" fill="#333"/>
        <rect x="${x + 17}" y="${y - 4}" width="7" height="12" rx="3" fill="#333"/>
        <path d="M${x - 20} ${y + 8} q4 14 16 14" fill="none" stroke="#333" stroke-width="2"/>`
  }
}

const BLINK = `<animate attributeName="r" values="2.5;2.5;0.4;2.5" keyTimes="0;0.9;0.95;1" dur="3s" repeatCount="indefinite"/>`

function character(desk: Desk, a: OfficeAgent, cx: number, top: number): string {
  const look = LOOK[desk]
  const hy = top + 52 // head centre
  const eyes = a.isDone
    ? `<path d="M${cx - 11} ${hy - 1} q3 -4 6 0 M${cx + 5} ${hy - 1} q3 -4 6 0" stroke="#333" stroke-width="2" fill="none"/>`
    : `<circle cx="${cx - 8}" cy="${hy}" r="2.5" fill="#333">${BLINK}</circle>
       <circle cx="${cx + 8}" cy="${hy}" r="2.5" fill="#333">${BLINK}</circle>`
  const mouth = a.isDone
    ? `<path d="M${cx - 8} ${hy + 8} q8 9 16 0" stroke="#333" stroke-width="2" fill="#fff"/>`
    : `<path d="M${cx - 5} ${hy + 10} q5 3 10 0" stroke="#333" stroke-width="2" fill="none"/>`
  const arms = a.isDone
    ? `<path d="M${cx - 22} ${hy + 30} l-14 -26" stroke="${look.shirt}" stroke-width="8" stroke-linecap="round"/>
       <circle cx="${cx - 37}" cy="${hy + 2}" r="5" fill="#f2c9a0"/>
       <path d="M${cx + 22} ${hy + 30} l14 -26" stroke="${look.shirt}" stroke-width="8" stroke-linecap="round"/>
       <circle cx="${cx + 37}" cy="${hy + 2}" r="5" fill="#f2c9a0"/>`
    : `<g><circle cx="${cx - 14}" cy="${top + 104}" r="5" fill="#f2c9a0"/>
         <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="0.35s" repeatCount="indefinite"/></g>
       <g><circle cx="${cx + 14}" cy="${top + 104}" r="5" fill="#f2c9a0"/>
         <animateTransform attributeName="transform" type="translate" values="0 -4;0 0;0 -4" dur="0.35s" repeatCount="indefinite"/></g>`
  const dots = [0, 1, 2]
    .map(k => `<circle cx="${cx + 31 + k * 9}" cy="${top + 18}" r="2.5" fill="#888"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" begin="${k * 0.2}s" repeatCount="indefinite"/></circle>`)
    .join('')
  const bubble = a.isDone
    ? `<g><rect x="${cx + 18}" y="${top + 6}" width="58" height="24" rx="12" fill="#2e9e5b"/>
         <path d="M${cx + 26} ${top + 28} l-6 8 l14 -8 z" fill="#2e9e5b"/>
         <text x="${cx + 47}" y="${top + 23}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">done ✓</text></g>`
    : `<g><rect x="${cx + 20}" y="${top + 8}" width="40" height="20" rx="10" fill="#fff" stroke="#bbb"/>
         <path d="M${cx + 26} ${top + 26} l-6 8 l12 -8 z" fill="#fff" stroke="#bbb"/>${dots}</g>`
  return `<g>
    <rect x="${cx - 22}" y="${hy + 18}" width="44" height="44" rx="14" fill="${look.shirt}"/>
    <circle cx="${cx}" cy="${hy}" r="20" fill="#f2c9a0" stroke="#d9a877" stroke-width="1.5"/>
    <circle cx="${cx - 13}" cy="${hy + 7}" r="3" fill="#f4a3a3" opacity="0.7"/>
    <circle cx="${cx + 13}" cy="${hy + 7}" r="3" fill="#f4a3a3" opacity="0.7"/>
    ${eyes}${mouth}${hat(look.hat, cx, desk === 'Reviewer' ? hy : hy - 4)}
    ${arms}${bubble}
  </g>`
}

function cell(desk: Desk, here: OfficeAgent[], x: number, y: number): string {
  const cx = x + 100
  const now = here[here.length - 1]
  const busy = here.filter(a => !a.isDone).length
  const screen = now !== undefined && !now.isDone
  const person = now === undefined
    ? `<rect x="${cx - 18}" y="${y + 70}" width="36" height="40" rx="8" fill="#9aa3ad"/>`
    : character(desk, now, cx, y)
  const label = now === undefined
    ? `<text x="${cx}" y="${y + 172}" text-anchor="middle" font-size="11" fill="#8a8f96">empty desk</text>`
    : `<text x="${cx}" y="${y + 172}" text-anchor="middle" font-size="11" fill="#444">${esc(cut(now.label, 30))}</text>`
  const extra = busy > 1
    ? `<g><circle cx="${x + 182}" cy="${y + 18}" r="11" fill="#e04f5f"/><text x="${x + 182}" y="${y + 22}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">+${busy - 1}</text></g>`
    : ''
  const glow = screen
    ? `<animate attributeName="fill" values="#7fd3ff;#b6e8ff;#7fd3ff" dur="1.5s" repeatCount="indefinite"/>`
    : ''
  return `<g>
    <rect x="${x + 6}" y="${y + 6}" width="188" height="176" rx="12" fill="#fbf6ec" stroke="#e3d9c6"/>
    <rect x="${x + 14}" y="${y + 12}" width="62" height="18" rx="9" fill="${LOOK[desk].shirt}"/>
    <text x="${x + 45}" y="${y + 25}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${desk}</text>
    ${extra}${person}
    <rect x="${cx + 30}" y="${y + 80}" width="30" height="22" rx="2" fill="#555"/><rect x="${cx + 42}" y="${y + 102}" width="6" height="6" fill="#555"/>
    <rect x="${cx + 32}" y="${y + 82}" width="26" height="18" rx="1" fill="${screen ? '#7fd3ff' : '#2b2f36'}">${glow}</rect>
    <rect x="${cx - 70}" y="${y + 108}" width="140" height="12" rx="3" fill="#b07a4a"/>
    <rect x="${cx - 70}" y="${y + 120}" width="140" height="30" fill="#9a6a3f"/>
    <rect x="${cx - 64}" y="${y + 150}" width="8" height="10" fill="#7d5532"/>
    <rect x="${cx + 56}" y="${y + 150}" width="8" height="10" fill="#7d5532"/>
    <rect x="${cx - 54}" y="${y + 96}" width="12" height="12" rx="2" fill="#fff" stroke="#999"/><rect x="${cx - 20}" y="${y + 104}" width="40" height="5" rx="2" fill="#ddd" stroke="#aaa"/>
    ${label}
  </g>`
}

/** The whole office as one SVG: four desks in a 2 x 2 room. */
export function drawOffice(list: readonly OfficeAgent[]): string {
  const cells = DESKS.map((desk, i) =>
    cell(desk, list.filter(a => a.desk === desk), (i % 2) * 200, 30 + Math.floor(i / 2) * 190),
  ).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 412" font-family="Segoe UI, Helvetica, Arial, sans-serif">
    <rect width="400" height="412" rx="14" fill="#e9eef3"/>
    <rect width="400" height="26" rx="14" fill="#cfd8e1"/>
    <rect x="12" y="6" width="36" height="14" rx="3" fill="#a8d4f0" stroke="#fff"/>
    <rect x="352" y="6" width="36" height="14" rx="3" fill="#a8d4f0" stroke="#fff"/>
    <text x="200" y="18" text-anchor="middle" font-size="12" font-weight="700" fill="#4a5560">The Agent Office</text>
    ${cells}
  </svg>`
}

/** The one-line status under the prompt: always visible, even with the panel closed. */
function statusLine(list: readonly OfficeAgent[]): string | undefined {
  if (list.length === 0) return undefined
  const busy = list.filter(a => !a.isDone).length
  const done = list.length - busy
  return `Agent office: ${busy} working, ${done} done (/agent-office to watch)`
}

function summary(list: readonly OfficeAgent[]): string {
  return DESKS.map(desk => {
    const now = list.filter(a => a.desk === desk).at(-1)
    return now === undefined
      ? `${desk}: empty`
      : `${desk}: ${now.isDone ? 'done' : 'working'}: ${now.label}`
  }).join('; ')
}

/** Writes the agent list, then refreshes the status line from it. */
async function change($: Engine, fn: (list: OfficeAgent[]) => OfficeAgent[]): Promise<void> {
  let after: OfficeAgent[] = []
  await update($, agents, list => (after = fn(list)))
  $.ui.status(statusLine(after))
}

export const register: Register = on => {

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'agent-office',
      description: 'Open the agent office panel',
    })
    void $.ui.open({ id: PANE, title: TITLE })
    return next(e)
  })

  on('command.run', { command: 'agent-office' }, async $ => {
    const r = await $.ui.open({ id: PANE, title: TITLE })
    return {
      text: r.isPlaced
        ? 'Agent office opened in the side panel.'
        : `Agent office could not be shown: ${r.reason}`,
    }
  })

  // An agent is about to start: seat it at once, then note its id.
  on('agent.spawn', async ($, e, next) => {
    if (e.resume) {
      const id = e.resume.agentId
      await change($, list =>
        list.map(a => (a.agentId === id ? { ...a, isDone: false } : a)),
      )
      return next(e)
    }
    const callId = e.tool_use_id || `spawn-${Date.now()}`
    const one: OfficeAgent = {
      callId,
      desk: deskFor(e.subagentType, e.description, e.name),
      // The task says more than a role name like "builder".
      label: e.description || e.name || e.subagentType,
      kind: e.subagentType,
      isDone: false,
    }
    await change($, list => [...list, one].slice(-40))
    void $.ui.open({ id: PANE, title: TITLE })
    const res = await next(e)
    await change($, list =>
      res.deny !== undefined
        ? list.filter(a => a.callId !== callId)
        : list.map(a => (a.callId === callId ? { ...a, agentId: res.agentId } : a)),
    )
    return res
  }).catch(($, e, next) => next(e)) // never block an agent over the panel

  // A teammate wakes for another turn: back to work.
  on('turn.start', async ($, e, next) => {
    const id = e.agentId
    if (id !== undefined) {
      await change($, list =>
        list.map(a => (a.agentId === id && a.isDone ? { ...a, isDone: false } : a)),
      )
    }
    return next(e)
  })

  // The agent's run ended: mark it done.
  on('turn.complete', async ($, e, next) => {
    const id = e.agentId
    if (id !== undefined) {
      await change($, list =>
        list.map(a => (a.agentId === id ? { ...a, isDone: true } : a)),
      )
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const list = await read($, agents)

    // Desktop, editor and mobile draw the cartoon office; the terminal gets text.
    if (e.surface !== 'terminal' && 'Svg' in ui) {
      const { Svg } = ui
      // The pane's width arrives in code-font cells (~7.2 CSS px each on desktop);
      // a width change redraws, so the office follows the panel's slide bar.
      const width = Math.max(200, Math.floor(e.props.bodyColumns * 7.2) - 8)
      const height = Math.round((width * 412) / 400)
      return (
        <Box flexDirection="column">
          <Svg
            source={drawOffice(list)}
            alt={`Agent office. ${summary(list)}`}
            width={width}
            height={height}
            isInteractive
          />
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap={1}>
        {DESKS.map(desk => {
          const here = list.filter(a => a.desk === desk)
          const now = here[here.length - 1]
          return (
            <Box flexDirection="column">
              <Text bold>{desk} desk</Text>
              {now === undefined ? (
                <Text dimColor>empty</Text>
              ) : (
                <Text dimColor={now.isDone}>
                  {now.isDone ? 'done' : 'working'}: {now.label}
                </Text>
              )}
            </Box>
          )
        })}
      </Box>
    )
  })
}
