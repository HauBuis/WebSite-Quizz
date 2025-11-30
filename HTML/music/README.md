# Hướng dẫn thêm nhạc nền

## Cách thêm file nhạc

1. **Download bài hát** "Hẹn hò nhưng không yêu remix" từ YouTube hoặc các nguồn khác dưới dạng file MP3

2. **Đổi tên file thành** `background-music.mp3`

3. **Lưu file vào folder này** (`HTML/music/`)

4. **Khởi động lại server** nếu cần

## Định dạng file hỗ trợ

- MP3 (.mp3) ✓
- WAV (.wav) ✓
- OGG (.ogg) ✓
- M4A (.m4a) ✓

## Cách download từ YouTube

### Sử dụng công cụ online:

1. Truy cập https://mp3-ytmp4.com/ hoặc https://yt1s.com/
2. Dán link YouTube vào
3. Chọn MP3 format
4. Download file
5. Đổi tên thành `background-music.mp3`
6. Lưu vào folder này

## Cách sử dụng

Khi đã lưu file `background-music.mp3` vào folder này:

1. Mở website http://localhost:5500
2. Đăng nhập
3. Vào **Cài đặt** (Settings)
4. Tick ✓ **"Bật nhạc nền"**
5. Click **"Lưu"**
6. Nghe nhạc phát! 🎵

## Điều chỉnh âm lượng

Mở file `HTML/app.js`, tìm dòng:

```javascript
backgroundAudio.volume = 0.3; // 30% volume
```

Thay `0.3` bằng giá trị khác (0.0 = tắt, 1.0 = to nhất)
