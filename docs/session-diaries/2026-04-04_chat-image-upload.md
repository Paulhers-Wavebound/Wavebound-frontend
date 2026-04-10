# Session: Chat Image Upload — 2026-04-04

## What changed

### Files modified

- `src/services/chatJobService.ts` — Added `image?: { data: string; media_type: string }` to `streamChatMessage` payload, spread into request body
- `src/components/chat/ChatInput.tsx` — Full rewrite: added image upload button (paperclip icon), clipboard paste handler, file validation (PNG/JPEG/WebP/GIF, 5MB max), base64 conversion, and inline preview with remove button. Exports `PendingImage` type, `validateImageFile`, `fileToBase64` for reuse.
- `src/pages/label/LabelAssistant.tsx` — Added `pendingImage` state, drag-and-drop with counter-based flicker prevention, wired image into `streamChatMessage` call, stores preview URL on user messages, clears image in `finally` block
- `src/components/chat/MessageList.tsx` — Extended `Message` interface with `image?: string`, renders attached image above text in user message bubbles
- `docs/handoffs/backend-todo.md` — Added "Persist Chat Image Attachments" item for DB-level image storage

## Why

Backend `label-chat` edge function now accepts multimodal input (image + text). Frontend needed all three standard image input methods: click-to-upload, drag-and-drop, and clipboard paste.

## What was tested

- `npx tsc --noEmit` — clean, zero errors

## What to verify in browser

1. Click paperclip icon next to send button, select a PNG/JPEG — preview should appear above textarea with filename and remove (X) button
2. Take a screenshot (Cmd+Shift+4), paste into chat (Cmd+V) — preview should appear
3. Drag an image file onto the chat area — accent-colored dashed overlay should appear, dropping should set preview
4. Hover drag over child elements (header, messages) — overlay should NOT flicker (counter-based fix)
5. Send a message with image attached — image should appear in user bubble, AI should respond about the image content
6. Click X on preview — image should be removed, send text-only
7. Try uploading a .pdf or 10MB image — should show error toast
8. Image button should be disabled during streaming

## While I was in here

- Image attachments don't persist across page refreshes — added backend-todo for DB storage via Supabase Storage bucket
- Multi-image support (multiple images per message) is a natural v2 extension — change `pendingImage` to array
- Consider compressing images client-side before base64 encoding to reduce payload size (canvas resize to max 2048px)
