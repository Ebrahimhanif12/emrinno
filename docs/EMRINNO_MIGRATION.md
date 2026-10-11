# Emrinno platform migration

## What changed

- The project identity is now Emrinno.
- The old Subminno homepage moved from `/` to `/subminno`.
- The document workspace moved from `/check/[documentId]` to `/subminno/check/[documentId]`.
- The previous `/check/[documentId]` route is retained only as a server redirect for existing authenticated links.
- Subminno client/server/service code is grouped under service-specific folders.
- The guest draft provider now exists only inside the Subminno layout.
- A platform service registry currently contains `SUBMINNO` and `PRESENTATION`.
- `/presentation` is intentionally a placeholder; no presentation-generation functionality has been added yet.
- Authentication copy now refers to Emrinno because one account will be shared across services.
- The Subminno extraction endpoint moved to `/api/subminno/extract`.
- Upload validation now checks extension, MIME compatibility, file signature, file size, and supported document length before continuing.

## No database migration in this step

The existing Supabase `documents` table is intentionally left unchanged in this migration so the already-tested M1/M2 persistence and RLS behavior are not broken while the route/code migration is verified.

A later controlled database migration can rename or further isolate service-specific tables when generic billing is introduced.

## Manual configuration to update

Before public launch, update Supabase Auth email copy so account emails use **Emrinno** rather than **Subminno**. Keep the same secure email-confirmation flow.

When `emrinno.com` is connected, review Supabase Auth Site URL / redirect configuration and Vercel domain settings before enabling production traffic.

## Regression checklist

After installing dependencies and restoring local environment variables, verify:

1. `/` loads the Emrinno platform page.
2. `/subminno` loads the existing Subminno landing page.
3. PDF, DOCX, and TXT extraction still works for valid files.
4. Pasted text still creates a guest draft.
5. New guest workspaces use `/subminno/check/<uuid>`.
6. Refresh before authentication intentionally loses the in-memory guest draft.
7. Authentication persists the document to the authenticated user's Supabase row.
8. Refresh after persistence reloads the document successfully.
9. Another signed-in user cannot access the document UUID.
10. An unauthenticated/incognito visitor cannot access persisted document metadata.
11. Package selection still persists securely.
12. `/check/<existing-uuid>` redirects to `/subminno/check/<existing-uuid>`.
13. `/presentation` renders the Coming Soon placeholder.
14. `npm run build` succeeds.

## Deferred intentionally

- Generic platform order schema (`service_code` / service reference)
- Payment-provider implementation
- Sapling detection execution
- Gemini writing-improvement execution
- Presentation Maker backend
- Emrinno final logo / favicon / full visual system
- Production rate limiting and final CSP rollout
