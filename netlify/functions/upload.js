const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async function (event) {
  // Chỉ chấp nhận phương thức POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const { image } = JSON.parse(event.body);
    if (!image) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Không tìm thấy dữ liệu ảnh.' }) 
      };
    }

    // Lấy API key từ biến môi trường (an toàn)
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      console.error('IMGBB_API_KEY chưa được cấu hình trên server.');
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'API key chưa được cấu hình.' }) 
      };
    }

    // Tạo một đối tượng FormData
    const formData = new FormData();
    formData.append('key', apiKey);
    
    // Chuyển đổi chuỗi base64 thành Buffer
    const imageBuffer = Buffer.from(image, 'base64');
    
    // Thêm buffer vào form-data như một file
    formData.append('image', imageBuffer, { filename: 'photobooth-upload.png' });

    // Gửi yêu cầu đến ImgBB
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
      // Để thư viện form-data tự động tạo headers, bao gồm cả 'boundary'
      headers: formData.getHeaders(), 
    });

    const result = await response.json();

    // Ghi lại lỗi từ ImgBB để dễ dàng gỡ lỗi
    if (!result.success) {
      console.error('Lỗi từ API ImgBB:', result.error);
      throw new Error(result.error?.message || 'Lỗi từ API ImgBB.');
    }

    // Trả về kết quả thành công
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Lỗi server nội bộ:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
