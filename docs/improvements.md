# Improvements (not built yet)

Kept out of v1 on purpose. Build only when the roadmap says so.

- **Photo of the handwritten recipe** card (the dish photo exists; this would be a second picture). Same Storage bucket.
- **Storage cleanup**: replaced or removed dish photos stay in the bucket (anon cannot delete). A scheduled Edge Function with the service key could delete files no recipe points to.
- **"Send what's missing to O Que Falta"**: after ticking ingredients in kitchen mode, send the
  unticked lines to an O Que Falta list through a link (`oquefalta.gr1618.io/add?items=…`), no
  shared tables. Needs an "add items" page on O Que Falta.
- **Real PDF file** to send on WhatsApp in one tap (today: the browser's "Save as PDF").
- **Offline reading** (service worker caching the recipes already opened).
- **Owner link** to rename or delete a whole book (today anyone with the link can rename it; deleting a book is a request through the contact).
- **Edit history** per recipe (today: last edit wins; deleted recipes go to a 30-day trash).
