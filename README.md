# Agent Office

A Claude Code mod that shows your agents as cartoon characters working in an office.

The side panel has four desks: **Builder**, **Writer**, **Reviewer** and **Helper**. When an agent starts, a character sits down at the desk that fits its task, with a glowing screen, typing hands and a "…" bubble. When the agent finishes, the character cheers with a green "done ✓" bubble. A desk with more than one agent working shows a "+N" badge.

The panel is updated by hooks on the engine's own agent events (`agent.spawn`, `turn.complete`), not by model messages, so it costs no tokens.

## Install

At the prompt of a terminal Claude Code session:

```
/plugin install agent-office --marketplace yongvay/agent-office
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```bash
claude plugin install agent-office --marketplace yongvay/agent-office
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `yongvay/agent-office`, then Add plugin.

## Use

- Type `/agent-office` to open the panel. It also opens by itself when an agent starts, where the window is wide enough for a side panel.
- A status line under the prompt shows how many agents are working and done.
- Desks are picked from words in the agent's task:
  - review, test, check, verify → Reviewer
  - write, doc, draft, report → Writer
  - build, fix, implement, create → Builder
  - anything else → Helper
- In a terminal, where pictures can't be drawn, the panel shows the same thing as text.

## License

MIT
