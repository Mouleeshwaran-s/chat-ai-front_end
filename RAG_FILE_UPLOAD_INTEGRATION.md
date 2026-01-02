# RAG File Upload Integration - Backend Alignment Complete ✅

## Overview
The frontend has been successfully updated to match your Spring Boot backend's multipart/form-data + SSE streaming API.

## Backend API Contract
```
POST /api/rag/stream
Content-Type: multipart/form-data
Authorization: Bearer {token}

Parts:
- file: FilePart (the uploaded document)
- message: String (JSON stringified message object)
```

## Frontend Changes

### 1. Service Layer (`rag.service.ts`)
**Updated**: `streamRagChat` method signature
```typescript
streamRagChat(
  payload: FormData,  // Changed from message: any
  onChunk: (chunk: string) => void,
  onError: (err: any) => void,
  onComplete: () => void
): void
```

**Key Changes**:
- ✅ Accepts `FormData` instead of JSON object
- ✅ Removed `Content-Type: application/json` header
- ✅ Browser automatically sets `multipart/form-data` with boundary
- ✅ Sends FormData directly as request body
- ✅ Added FormData content logging for debugging

### 2. Component Layer (`rag-agent.component.ts`)
**Updated**: `askGPT()` method

**Key Changes**:
- ✅ Uses actual `File` objects instead of base64 conversion
- ✅ Creates FormData with two parts:
  - `message`: JSON.stringify(payLoadMessages)
  - `file`: actual File object with original filename
- ✅ Simplified file handling (no more manual blob creation)
- ✅ Added extensive console logging for debugging
- ✅ Properly tracks `isText` and `isFile` flags

**FormData Structure**:
```typescript
const formData = new FormData();
formData.append('message', JSON.stringify({
  session_id: "...",
  request_id: "...",
  content: "user's question",
  isText: true,
  isFile: true,
  // ... other fields
}));
formData.append('file', fileObject, fileName);
```

## File Upload Flow

### User Interaction
1. User uploads file (drag-drop or click)
2. File stored in `filesData` array with:
   - `file`: Original File object ✅ (backend compatible)
   - `name`: Filename
   - `type`: MIME type
   - `size`: File size
   - `previewUrl`: For image previews

### Request Preparation
1. `askGPT()` creates FormData
2. Appends message JSON as string
3. Appends first file from `filesData[0].file`
4. Sends to `ragService.streamRagChat(formData, ...)`

### Network Request
```
POST /api/rag/stream
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="message"

{"session_id":"...","request_id":"...","content":"how to install mysql?",
 "isText":true,"isFile":true,...}
------WebKitFormBoundary...
Content-Disposition: form-data; name="file"; filename="document.docx"
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document

[binary file content]
------WebKitFormBoundary...--
```

### SSE Response Handling
1. Backend streams chunks via Server-Sent Events
2. Frontend appends chunks to assistant message
3. UI updates in real-time as chunks arrive
4. On completion, marks message as complete

## Testing Checklist

### ✅ Before Testing
- [ ] Backend is running on `http://localhost:9000`
- [ ] Valid JWT token is available
- [ ] Test file is prepared (e.g., `.docx`, `.pdf`)

### ✅ Test Scenarios

#### 1. Text-Only Message (No File)
```
Input: "What is RAG?"
Expected: 
- FormData with only 'message' part
- Backend receives null for file
- Streaming response works
```

#### 2. File + Text Message
```
Input: "Explain this document" + upload "guide.docx"
Expected:
- FormData with 'message' and 'file' parts
- File sent with correct MIME type
- Backend processes document
- Streaming response includes document context
```

#### 3. File-Only (Optional Text)
```
Input: "" + upload "manual.pdf"
Expected:
- FormData with empty/minimal 'message' and 'file' part
- Backend handles empty prompt gracefully
```

### ✅ Debugging

#### Frontend Console Logs
```javascript
"Has Prompt: true"
"Has Files: true"
"Files Data: [{file: File, name: '...', ...}]"
"Payload Messages: {session_id: '...', ...}"
"Appended file: document.docx Type: application/vnd... Size: 12345"
"[RagService] Sending FormData to: /api/rag/stream"
"FormData contents:"
"  - file: document.docx"
"  - message: {\"session_id\":\"...\"}"
```

#### Network Tab
1. Open DevTools → Network
2. Look for `stream` request
3. Check Request Headers:
   - `Content-Type: multipart/form-data; boundary=...`
   - `Authorization: Bearer ...`
4. Check Request Payload (Form Data):
   - `message`: JSON string
   - `file`: Document file

## Common Issues & Solutions

### ❌ Issue: "File is null on backend"
**Solution**: Verify `filesData[0].file instanceof File` is true

### ❌ Issue: "400 Bad Request - Invalid JSON"
**Solution**: Ensure message is properly stringified: `JSON.stringify(payLoadMessages)`

### ❌ Issue: "CORS error"
**Solution**: Backend needs to allow `multipart/form-data` in CORS config

### ❌ Issue: "Stream doesn't complete"
**Solution**: Check backend sends `data: [DONE]` to signal completion

### ❌ Issue: "Wrong Content-Type boundary"
**Solution**: Don't manually set Content-Type header - let browser handle it

## Next Steps

1. **Run the frontend**: `npm start`
2. **Test file upload** with your backend
3. **Monitor console logs** for debugging
4. **Check Network tab** to verify request format
5. **Report any backend errors** for investigation

## File Size Limits

⚠️ **Important**: Configure these based on your backend:
- Frontend: No explicit limit (relies on backend)
- Backend: Check your Spring Boot config for max file size
  - `spring.servlet.multipart.max-file-size`
  - `spring.servlet.multipart.max-request-size`

## Security Notes

✅ **Already Implemented**:
- JWT token in Authorization header
- File type validation on upload
- Session-based isolation

🔒 **Backend Responsibilities**:
- Validate file types server-side
- Scan for malware
- Limit file sizes
- Rate limiting on uploads

---

## Quick Reference

### Component Method
```typescript
async askGPT(): Promise<void> {
  const formData = new FormData();
  formData.append('message', JSON.stringify(this.payLoadMessages));
  formData.append('file', this.filesData[0].file, fileName);
  
  this.ragService.streamRagChat(formData, onChunk, onError, onComplete);
}
```

### Service Method
```typescript
streamRagChat(payload: FormData, ...): void {
  fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream'
    },
    body: payload  // FormData sent directly
  });
}
```

---

**Status**: ✅ Integration Complete - Ready for Testing
**Last Updated**: 2025
