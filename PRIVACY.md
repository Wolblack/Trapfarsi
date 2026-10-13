# TRAPFARSI privacy notes

TRAPFARSI is a local-first music-discovery prototype. Review this document and update it to match your final deployment, jurisdiction, and actual providers before inviting the public.

## Data handled in local-only mode

- Profile fields, playlists, favorites, search history, listening notes, preferences, and activity can be stored in this browser's local storage.
- If the listener explicitly enables persistent audio storage, selected audio files are saved in browser IndexedDB on that device. Files are not uploaded by that feature. Browser storage may be removed by the browser or operating system.
- The JSON backup/restore tool works with supported local application data. It excludes audio blobs and authentication tokens.
- A browser-local profile is not a verified identity and is not automatically synced across devices.

## Optional online services

- If Supabase is configured, authentication, account-data sync, and community features send relevant information to the configured Supabase project. Its operator must publish the appropriate privacy notice and configure access controls.
- If the optional lyric phrase endpoint is configured, the search phrase is sent to the deployed TRAPFARSI Edge Function and then to the configured licensed provider. The endpoint returns track metadata and provider links, not full lyrics. Provider terms, quotas, attribution, retention and regional availability apply.
- External artwork and web fonts may load from their respective third-party hosts and can expose ordinary network metadata such as IP address to those hosts.

## Controls

Listeners can clear local app data from the profile data controls, remove saved local audio from the on-device audio library, or clear browser site data. Clearing local data does not delete data already stored in a configured Supabase project. Server-side deletion must be handled through the account/database implementation.

## Before production

Replace this prototype notice with a reviewed privacy policy that names the legal operator, contact address, applicable jurisdiction, data controller, processors, retention periods, account deletion process, cookie/storage details, age requirements, and user rights. Do not claim regulatory compliance without legal review.
