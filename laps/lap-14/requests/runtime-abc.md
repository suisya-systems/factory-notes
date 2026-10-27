# Request: pane ids past the ninth pane, a decision record for `spawn-prompt-step`, and an ntfy sink for attention notifications

Three changes to `claude-org-runtime`. The first two touch the same plan output, so they are written together; the third is a separate command.

## Part 1. herdr pane ids past the ninth pane

`claude-org-runtime dispatcher delegate-plan` plans where the next worker is spawned. It reads the panes of the current layout from the file given to `--panes-json` (a JSON list of panes, or an object `{"panes": [...]}`), and picks the pane to split.

On the herdr terminal backend a pane id is a handle `w<workspace>:p<pane>`, for example `w1:p2` or `w_live:p3`. The part after `:p` is not a decimal number. herdr writes pane numbers with the 32 symbols

`1 2 3 4 5 6 7 8 9 A B C D E F G H J K M N P Q R S T V W X Y Z 0`

in this order, with no zero digit. Reading the symbols as the values 1 to 32, a pane segment is a bijective base-32 number: the first nine panes are `p1` to `p9`, the 10th is `pA`, the 31st is `pZ`, the 32nd is `p0`, the 33rd is `p11`, the 34th is `p12`. In general, start from `n = 0` and for each symbol from left to right set `n = n * 32 + value`.

Today the pane segment is read as decimal digits only. As soon as the layout has a 10th pane, the whole panes file is rejected (exit code 1, `panes[i] is invalid: ...` on standard error).

What should change:

- A pane segment made of one or more of the 32 symbols is accepted and decoded as above. Symbols outside the table (lower-case letters, `I`, `L`, `O`, `U`, any other character) and an empty segment are still rejected the way they are today.
- The decoded number breaks ties between split candidates that are otherwise equal: the pane with the **lower** number is chosen. So `w1:p9` is chosen before `w1:pA`, `w1:pZ` before `w1:p0`, and `w1:p0` before `w1:p11`.
- A segment is always read in this table, also when it is made of digits only: `p10` is 1 * 32 + 32 = 64, not ten. Segments of one digit, `p1` to `p9`, mean what they meant before.
- Everything else stays as it is: renga numeric ids, tmux `%N` ids, the other herdr ids, the workspace part, the exit codes (0, 1, 2) and the shape of the plan printed on standard output.

## Part 2. `spawn-prompt-step` writes a decision record

`dispatcher spawn-prompt-step` reads `{"screen", "previous_screen", "elapsed_ms"}` on standard input and prints the next action for a freshly spawned worker's startup prompts (`send_keys`, `wait`, `done` or `escalate`). A hook that guards `send_keys` in the dispatcher's pane needs a file that says which keys the step authorised, so that it can allow exactly those and nothing else.

New options:

- `--target <pane>`: the pane the decision is for. Without it the command behaves exactly as today and reads and writes no file.
- `--task-id <id>`: stored in the record; when omitted the record has `null` there.
- `--state-dir <dir>`: the root that holds the record, default `.state`, created when missing.

A target must start with a letter, a digit or `_`, and continue with letters, digits, `_`, `.` or `-` only. Any other target is invalid input: exit code 2, the usual `{"error": ...}` on standard output, and no file is read, written or removed.

With a valid target:

- When the action is `send_keys` or `done`, the step writes `<state-dir>/dispatcher/spawn-prompt/<target>.json`. The file is replaced as a whole: a reader never sees half a record, and each pass overwrites the previous one for that target. It is one JSON object with these keys: `schema_version` (the integer 1), `task_id`, `target`, `action`, `send_keys` (the same value the step prints under `send_keys`, `null` for `done`), `state` (the prompt state the step classified: `folder_trust`, `dev_channel` or `done`), `decided_at_ms` (Unix time in milliseconds when the step decided) and `expires_at_ms` (`decided_at_ms + 30000`).
- For every other outcome (`wait`, `escalate`, invalid input) the record of that target is removed if it exists. A record left by an earlier pass must never authorise a key on a screen that now says to wait.
- If the record cannot be written (for example `--state-dir` is a file, or the directory is not writable), the earlier record of that target is removed as far as it can be, nothing is printed except `{"error": ...}`, and the exit code is 2.
- What the step prints on standard output and its exit codes (0, 10, 2) are the same as without `--target`, apart from the failure just described.

Document the new options and the record format in `docs/cli.md`.

## Part 3. the two together

`delegate-plan` already puts the approval step into the plan it prints (the step `approve_spawn_prompts`, with a `decide_argv` list that starts with `spawn-prompt-step`, `--deadline-ms` and its value). That list gains `--target <name>`, `--task-id <task id>` and `--state-dir <dir>`, after the deadline: the name is the name of the pane being spawned (the `name` of the plan's `spawn`), the task id is the task's, and the directory is the `--state-dir` of the `delegate-plan` call. The list is the same for the renga and the broker transport, and for plans with a lettered pane id in the layout.

## Part 4. an optional ntfy sink for attention notifications

`claude-org-runtime attention scan` (and `attention watch`, which runs the same cycle repeatedly) tells the operator about attention events: a log line on standard output, a desktop notification, a bell. The attention config file (`--config`, the same JSON that holds `desktop`, `sound`, `cooldown_sec`, `templates`) gets one optional external sink, [ntfy](https://docs.ntfy.sh/publish/). It is opt-in, and it must not change what the local notifications do.

Config. A new optional object `ntfy` with these keys:

- `enabled`: boolean, default `false`. With `ntfy` absent or `enabled` false nothing changes anywhere.
- `server`: string, default `https://ntfy.sh`.
- `topic`: string, required when `enabled` is true; 1 to 64 characters, letters, digits, `_` and `-` only.
- `max_body_chars`: integer of at least 1, default 120 (shorter than the desktop body, whose default limit is 240).

A wrong type, a missing or malformed topic with `enabled` true, or an unknown key inside `ntfy` is a config error, handled like the other config errors (message on standard error, exit code 2).

Sending. For each event that the cycle notifies locally (not suppressed, not skipped by the cooldown or the dedup state), when the sink is enabled and the run is not `--dry-run`, the program sends one HTTP POST to `<server>/<topic>` (a trailing `/` on `server` is ignored). The body is the event's rendered body, the text the desktop notification would show after the template and the existing truncation, cut again to `max_body_chars` by the existing truncation rule (the last kept character is the ellipsis), with control characters removed as for the desktop. Two headers carry the rest: `Title` is the rendered title, and `Priority` is `5` for an `urgent` event and `3` for a `normal` one. Nothing else of the event goes out: no task id, summary, key or other field, no extra header, unless the template put it into the title or body. With `--dry-run` no request is made.

Failures. A connection error, a timeout (5 seconds) or an HTTP status of 400 or more is reported as one line on standard error that starts with `warning: ntfy notification failed` and is then swallowed: the exit code, the standard output, the local notifications and the dedup state are what they would be without the sink. `--json` output does not change.

Not decided here, left to you (keep it simple, do not add features for them): authentication or tokens, the other sinks of the same family (Slack, Discord, Gotify, Pushover), retrying a failed send, filtering by event kind, ntfy tags or click actions.

## Checks the result should pass

- With `--transport renga`: a layout with workers on `w1:p9` and `w1:pA` of the same size gets its spawn planned (exit 0), and the pane of `w1:p9` is the one that is split; a layout with `w1:p0` and `w1:p11` of the same size splits `w1:p0`.
- With either transport, a layout with a pane `w1:pA` is accepted (exit 0), and one with a pane `w1:pI` or `w1:pa` is refused with exit code 1.
- After a `delegate-plan` run, the `decide_argv` of the plan carries the three new options with the pane name, task id and state directory of that run.
- `spawn-prompt-step --target worker-t1` on a screen that needs a key writes a record whose `send_keys` equals the printed `send_keys`; on a later pass with a screen that says to wait, the record is gone; on a pass with input that is not valid JSON, it is gone too.
- A `done` screen writes a record with `action` `done` and `send_keys` `null`, and both `decided_at_ms` and `expires_at_ms` are integers.
- A target such as `../x` or `.hidden` exits 2 and leaves any existing file alone.
- `attention scan` with a pending decision that is old enough to be urgent, desktop notifications off, sound off and `ntfy` enabled with a topic, against a server that answers 200: the server received exactly one POST to `/<topic>` whose `Title`, `Priority` (`5`) and body match the local notification, and the exit code is 0. Run again with the same state directory, the cooldown stops it, and the server receives nothing more.
- The same scan with `ntfy` absent, or with `enabled` false, or with `--dry-run`: the server receives nothing.
- The same scan with the server answering 500, or with nothing listening at `server`: exit code 0, one `warning: ntfy notification failed` line on standard error, the same standard output as without the sink.
- A config with `ntfy.topic` `"a b"` while enabled, or with an unknown key inside `ntfy`, exits 2.
