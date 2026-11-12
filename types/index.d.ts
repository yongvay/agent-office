export type Desk = 'Builder' | 'Writer' | 'Reviewer' | 'Helper'

export type OfficeAgent = {
  /** The Agent tool call that started it: known before the agent runs. */
  callId: string
  /** The engine's id for the agent's loop, once it has started. */
  agentId?: string
  desk: Desk
  label: string
  kind: string
  isDone: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'agent-office': { agents: Shaped<OfficeAgent[]> }
  }
}
