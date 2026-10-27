# Request: `delegate-plan` accepts herdr pane ids past the ninth pane

`claude-org-runtime dispatcher delegate-plan` plans where the next worker is spawned. It reads the panes of the current layout from the file given to `--panes-json` (a JSON list of panes, or an object `{"panes": [...]}`), and picks the pane to split. Each pane has an `id`, a `name`, a `role` and its geometry.

On the herdr terminal backend a pane id is a handle `w<workspace>:p<pane>`, for example `w1:p2` or `w_live:p3`. The part after `:p` is not a decimal number. herdr writes pane numbers with the 32 symbols

`1 2 3 4 5 6 7 8 9 A B C D E F G H J K M N P Q R S T V W X Y Z 0`

in this order, with no zero digit. Reading the symbols as the values 1 to 32, a pane segment is a bijective base-32 number: the first nine panes are `p1` to `p9`, the 10th is `pA`, the 31st is `pZ`, the 32nd is `p0`, the 33rd is `p11`, the 34th is `p12`. In general, start from `n = 0` and for each symbol from left to right set `n = n * 32 + value`.

Today `delegate-plan` reads the pane segment as decimal digits only. As soon as the layout has a 10th pane, the whole panes file is rejected (exit code 1, `panes[i] is invalid: ...` on standard error) and the dispatcher falls back to doing the spawn by hand.

## What should change

- A pane segment made of one or more of the 32 symbols is accepted and decoded as above. Symbols outside the table (lower-case letters, `I`, `L`, `O`, `U`, any other character) and an empty segment are still rejected the way they are today.
- The decoded number is what breaks ties between split candidates that are otherwise equal: the pane with the **lower** number is chosen. So `w1:p9` is chosen before `w1:pA`, `w1:pZ` before `w1:p0`, and `w1:p0` before `w1:p11`.
- A segment is always read in this table, also when it is made of digits only: `p10` is 1 * 32 + 32 = 64, not ten. Segments of one digit, `p1` to `p9`, mean what they meant before.
- Everything else stays as it is: renga numeric ids, tmux `%N` ids, the other herdr ids, the workspace part, the exit codes (0, 1, 2), the shape of the plan printed on standard output and the files written under `--state-dir`.

## Checks the result should pass

- A layout with workers on `w1:p9` and `w1:pA` of the same size gets its spawn planned (exit 0), and the pane of `w1:p9` is the one that is split.
- A layout whose only larger pane is `w1:p11` is planned, and ordering against `w1:p0` follows the numbers 33 and 32.
- A layout with a pane `w1:pI` or `w1:pa` is refused with exit code 1.
