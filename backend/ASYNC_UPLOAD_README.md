# Async File Upload with Real-time Notifications

## Tổng quan

Hệ thống này cung cấp khả năng upload file bất đồng bộ với thông báo real-time thông qua WebSocket. Khi user upload file, hệ thống sẽ:

1. **Nhận file ngay lập tức** và trả về file ID
2. **Xử lý file trong background** mà không block UI
3. **Thông báo real-time** về tiến trình upload thông qua WebSocket
4. **Lưu trạng thái** để user có thể reconnect và nhận thông báo

## Kiến trúc

### Backend Components

1. **File Model** (`src/file/model.py`)
   - Thêm các field: `status`, `upload_progress`, `file_size`, `error_message`
   - Enum `FileStatus`: UPLOADING, PROCESSING, COMPLETED, FAILED

2. **WebSocket Manager** (`src/websocket/manager.py`)
   - Quản lý kết nối WebSocket theo user ID
   - Gửi thông báo real-time về trạng thái upload

3. **Background Tasks** (`src/file/background_tasks.py`)
   - Xử lý file upload trong background
   - Cập nhật progress và thông báo cho user

4. **API Endpoints**
   - `POST /api/v1/admin/file/upload` - Upload files (async)
   - `GET /api/v1/admin/file/upload/status/{file_id}` - Check upload status
   - `WS /api/v1/ws/{user_id}` - WebSocket connection for notifications

## Cách sử dụng

### 1. Chạy migration

```bash
cd backend
alembic upgrade head
```

### 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 3. Chạy server

```bash
uvicorn src:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test WebSocket

Mở file `upload_demo.html` trong browser để test upload và nhận thông báo real-time.

## API Usage

### Upload Files

```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const response = await fetch('/api/v1/admin/file/upload', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});

const result = await response.json();
// Result contains file IDs for tracking
```

### WebSocket Connection

```javascript
const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/${userId}?token=${token}`);

ws.onmessage = function(event) {
    const message = JSON.parse(event.data);
    if (message.type === 'file_upload') {
        // Handle upload notification
        console.log(message.data);
    }
};
```

### Check Upload Status

```javascript
const response = await fetch(`/api/v1/admin/file/upload/status/${fileId}`, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

const status = await response.json();
```

## WebSocket Message Format

```json
{
    "type": "file_upload",
    "timestamp": "2025-01-18T10:30:00Z",
    "data": {
        "file_id": "uuid-here",
        "filename": "document.pdf",
        "status": "processing",
        "progress": 75.5,
        "error_message": ""
    }
}
```

## File Status States

- **UPLOADING**: File đang được tạo record trong DB
- **PROCESSING**: File đang được lưu và xử lý
- **COMPLETED**: File đã upload thành công
- **FAILED**: Upload gặp lỗi

## Features

✅ **Async Upload**: File được xử lý trong background  
✅ **Real-time Notifications**: WebSocket thông báo tiến trình  
✅ **Progress Tracking**: Theo dõi % upload  
✅ **Error Handling**: Thông báo lỗi chi tiết  
✅ **Reconnection**: User có thể tắt/mở browser và vẫn nhận thông báo  
✅ **Multiple Files**: Upload nhiều file cùng lúc  
✅ **Large Files**: Hỗ trợ file lớn với progress tracking  

## Frontend Integration

### React Example

```jsx
import { useState, useEffect } from 'react';

function FileUpload() {
    const [ws, setWs] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const websocket = new WebSocket(`ws://localhost:8000/api/v1/ws/${userId}?token=${token}`);
        
        websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'file_upload') {
                setNotifications(prev => [...prev, message.data]);
            }
        };

        setWs(websocket);
        return () => websocket.close();
    }, []);

    const uploadFiles = async (files) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        await fetch('/api/v1/admin/file/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
    };

    return (
        <div>
            <input type="file" multiple onChange={e => uploadFiles(e.target.files)} />
            {notifications.map(notif => (
                <div key={notif.file_id}>
                    {notif.filename}: {notif.status} ({notif.progress}%)
                </div>
            ))}
        </div>
    );
}
```

## Security

- WebSocket connections require JWT token authentication
- File upload endpoints require admin authentication
- File paths are sanitized to prevent directory traversal
- File size limits are enforced

## Performance

- Files are processed in background tasks
- WebSocket connections are managed efficiently
- Database sessions are properly handled in background tasks
- Progress updates are throttled to prevent spam

## Troubleshooting

1. **WebSocket connection fails**: Check token validity and user permissions
2. **Files not uploading**: Verify file size limits and disk space
3. **No notifications**: Ensure WebSocket connection is established
4. **Database errors**: Check migration status and database connection
