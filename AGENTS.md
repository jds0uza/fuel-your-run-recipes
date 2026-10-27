<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep daily nutrition goal calculations in a browser-safe pure module, separate from the home-page controls, so formulas can be tested without server access.
- Weight-based goals are calculated locally without storing body weight or modifying recipe nutrition; this keeps the public calculator independent of private recipe accounts.
- Guest demo analyses are capped server-side via the `demo_usage` table and `increment_demo_usage` RPC (service-role only); never rely on client-side counters for quota enforcement, since guests can reset browser storage.
