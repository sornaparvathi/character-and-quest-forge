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

- Keep shared studio state in a browser-hydrated context and persist the frontend preview vault locally; the supplied brief explicitly requests local/mock persistence, not online accounts.
- Use a dedicated route for each creative tool and a shared studio shell so navigation and saved work remain consistent.
- Keep sample story generation in a pure browser-safe module so its modes and filtering can be tested independently.
