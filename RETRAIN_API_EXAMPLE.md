# File Retraining API Documentation

## Overview
The `/upload` endpoint now supports retraining existing files in the database. You can send new files along with an array that specifies which existing files should be retrained. The array length must match the files array length, with each index corresponding to the same file position.

## API Endpoint
`POST /file/upload`

## Parameters
- `files`: Array of files to upload (multipart/form-data)
- `retrain_file_ids` (optional): JSON string containing an array of file IDs

## Retrain File IDs Format
```json
[
  "uuid-of-existing-file-1",  // files[0] will retrain this existing file
  null,                        // files[1] will be treated as new file
  "uuid-of-existing-file-2",  // files[2] will retrain this existing file
  null                         // files[3] will be treated as new file
]
```

**Important Rules:**
- Array length MUST equal the number of files being uploaded
- `null` values indicate the corresponding file should be treated as a new upload
- UUID strings indicate the corresponding file should retrain the existing file with that ID
- Files are processed in the order they are sent by the client (FastAPI preserves order)

## Example Usage

### JavaScript/Frontend Example
```javascript
// Prepare files (order matters!)
const files = [
  new File(['updated content 1'], 'updated_document1.docx'),  // Index 0
  new File(['new content'], 'completely_new_file.pdf'),       // Index 1
  new File(['updated content 2'], 'updated_document2.txt'),   // Index 2
  new File(['another new file'], 'another_new_file.docx')     // Index 3
];

// Define which files are for retraining (array must have same length as files)
const retrainFileIds = [
  "123e4567-e89b-12d3-a456-426614174000", // Retrain existing file with files[0]
  null,                                    // files[1] is a new upload
  "987fcdeb-51a2-43d1-9f42-123456789abc", // Retrain existing file with files[2]
  null                                     // files[3] is a new upload
];

// Create FormData
const formData = new FormData();
files.forEach(file => formData.append('files', file));
formData.append('retrain_file_ids', JSON.stringify(retrainFileIds));

// Send request
fetch('/file/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Upload response:', data);
  // Response will include uploadID for tracking via WebSocket
});
```

### Python Example
```python
import requests
import json

# Files to upload (order matters!)
files = [
    ('files', ('updated_doc1.docx', open('path/to/updated_doc1.docx', 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
    ('files', ('new_file.pdf', open('path/to/new_file.pdf', 'rb'), 'application/pdf')),
    ('files', ('updated_doc2.txt', open('path/to/updated_doc2.txt', 'rb'), 'text/plain')),
    ('files', ('another_new.docx', open('path/to/another_new.docx', 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
]

# Retrain file IDs (must match files array length)
retrain_file_ids = [
    "123e4567-e89b-12d3-a456-426614174000",  # Retrain with files[0]
    None,                                     # files[1] is new
    "987fcdeb-51a2-43d1-9f42-123456789abc",  # Retrain with files[2]
    None                                      # files[3] is new
]

# Prepare data
data = {
    'retrain_file_ids': json.dumps(retrain_file_ids)
}

headers = {
    'Authorization': 'Bearer your-jwt-token'
}

# Send request
response = requests.post(
    'http://localhost:8000/file/upload',
    files=files,
    data=data,
    headers=headers
)

print(response.json())
```

## Response Format
```json
{
  "message": "Files are being processed in the background. You will be notified upon completion. 2 files will be retrained.",
  "files": [
    {"filename": "updated_doc1.docx", "upload_index": 0},
    {"filename": "new_file.pdf", "upload_index": 1},
    {"filename": "updated_doc2.txt", "upload_index": 2},
    {"filename": "another_new.docx", "upload_index": 3}
  ],
  "uploadID": "uuid-for-tracking",
  "retrain_count": 2
}
```

## WebSocket Notification
When processing is complete, you'll receive a WebSocket message:
```json
{
  "event": "processing_complete",
  "data": [
    {
      "filename": "updated_doc1.docx",
      "status": "retrained",
      "file_id": "123e4567-e89b-12d3-a456-426614174000",
      "is_retrain": true,
      "original_file_id": "123e4567-e89b-12d3-a456-426614174000"
    },
    {
      "filename": "new_file.pdf",
      "status": "success",
      "file_id": "new-uuid-1",
      "is_retrain": false
    },
    {
      "filename": "updated_doc2.txt",
      "status": "retrained", 
      "file_id": "987fcdeb-51a2-43d1-9f42-123456789abc",
      "is_retrain": true,
      "original_file_id": "987fcdeb-51a2-43d1-9f42-123456789abc"
    },
    {
      "filename": "another_new.docx",
      "status": "success",
      "file_id": "new-uuid-2",
      "is_retrain": false
    }
  ],
  "uploadId": "uuid-for-tracking"
}
```

## Behavior
1. **Order Preservation**: FastAPI preserves the order of uploaded files as sent by the client
2. **Index Matching**: `retrain_file_ids[i]` corresponds to `files[i]`
3. **Retraining**: Non-null IDs replace the content, chunks, and embeddings of existing files
4. **New Files**: Null values in the array indicate new file uploads
5. **Validation**: Ensures file IDs exist and belong to the authenticated admin
6. **Atomic**: Each file operation is independent - if one fails, others continue

## Error Handling
- Array length mismatch returns 400
- Invalid file IDs return 404
- Invalid UUID format returns 400
- Malformed JSON in retrain_file_ids returns 400
- Individual file processing errors are reported in the WebSocket response

## Advantages of This Approach
- **Simpler**: Just an array of UUIDs (or nulls) matching file positions
- **Order-based**: Relies on natural file upload order preservation
- **Intuitive**: Index-based mapping is easier to understand and implement
- **Less error-prone**: No complex mapping objects to validate
