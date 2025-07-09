const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async function (event, context) {
  // Chỉ cho phép phương thức POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Lấy dữ liệu ảnh từ body của request
    const { image } = JSON.parse(event.body);
    if (!image) {
      return { statusCode: 400, body: 'Missing image data' };
    }

    // Lấy API key từ biến môi trường của Netlify (bảo mật hơn)
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      console.error('IMGBB_API_KEY is not set on the server.');
      return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Server configuration error.' }) };
    }

    // Chuẩn bị dữ liệu để gửi đến ImgBB
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', image); // `image` là chuỗi base64

    // Gọi API của ImgBB
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    // Xử lý nếu ImgBB trả về lỗi
    if (!result.success) {
      console.error('ImgBB upload failed:', result.error?.message || 'Unknown error');
      throw new Error('ImgBB upload failed');
    }

    // ✅ Trả về dữ liệu thành công, bao gồm cả URL của ảnh
    // Phía frontend có thể dùng hoặc không, nhưng API đã hoàn thành đúng chức năng
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.data 
      }),
    };
  } catch (error) {
    console.error('Server-side error during upload:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'An internal server error occurred.' }),
    };
  }
};
