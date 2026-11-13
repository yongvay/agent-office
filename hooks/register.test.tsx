import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'agent-office',
  component: 'Pane',
  requestId: 'agent-office',
  props: {
    title: 'Agent office',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const SPAWN = {
  prompt: 'p',
  provider: { plugin: 'engine', tier: 'core' },
  parentModel: 'm',
  background: true,
  fork: false,
} as const

test('an agent appears at its desk, then shows done', async ($, on) => {
  on('command.register', () => ({ value: { command: 'agent-office' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.spawn', () => ({ model: 'm', agentId: 'a1' }))
  on('turn.complete', () => ({ text: '' }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const desk = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const term = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const alt = async () => String((await desk.find({ type: 'Svg' }))?.props.alt)
  const size = await desk.find({ type: 'Svg' })
  expect(size?.props.width).toBe(280)
  expect(size?.props.height).toBe(288)

  expect(await alt()).toContain('Reviewer: empty')

  await $.agent.spawn({ ...SPAWN, tool_use_id: 't1', description: 'Review the diff', subagentType: 'general-purpose' } as never)
  expect(await alt()).toContain('Reviewer: working: Review the diff')
  expect((await term.find({ type: 'Text', text: /Review the diff/ }))?.text).toBe('working: Review the diff')

  await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: 'x', agentId: 'a1', reason: 'answer' } as never)
  expect(await alt()).toContain('Reviewer: done: Review the diff')
  expect(String((await desk.find({ type: 'Svg' }))?.props.source)).toContain('done ✓')
  expect((await term.find({ type: 'Text', text: /Review the diff/ }))?.text).toBe('done: Review the diff')
  await desk.unmount()
  await term.unmount()
})

test('an agent named for a desk sits there, whatever its task says', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('agent.spawn', () => ({ model: 'm', agentId: 'b1' }))

  const desk = await $.ui.mount({ ...PANE, surface: 'desktop' })
  // "test" alone would send this to the Reviewer desk.
  await $.agent.spawn({ ...SPAWN, tool_use_id: 't2', name: 'builder-1', description: 'Add unit tests', subagentType: 'general-purpose' } as never)
  const alt = String((await desk.find({ type: 'Svg' }))?.props.alt)
  expect(alt).toContain('Builder: working: Add unit tests')
  expect(alt).toContain('Reviewer: empty')
  await desk.unmount()
})

test('with no app attached, /agent-office says the panel will appear later', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: false, reason: 'no-surface: no surface is attached' } }))

  const out = await $.command.run({ command: 'agent-office', args: '' } as never)
  expect((out as { text: string }).text).toContain('waiting for the app to connect')
  expect((out as { text: string }).text).toContain('appear by itself')
})
