const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

exports.handler = async function (event) {
  // Chỉ chấp nhận phương thức POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { image } = JSON.parse(event.body);
    if (!image) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing image data' }) };
    }

    // Lấy API key từ biến môi trường (an toàn)
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      console.error('IMGBB_API_KEY is not configured on the server.');
      return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured.' }) };
    }

    // Chuẩn bị dữ liệu để gửi đi dưới dạng application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('key', apiKey);
    params.append('image', image); // Gửi dữ liệu base64

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const result = await response.json();

    // Ghi lại lỗi từ ImgBB để dễ dàng gỡ lỗi
    if (!result.success) {
      console.error('ImgBB API Error:', result.error);
      throw new Error(result.error?.message || 'ImgBB API error');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Internal Server Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
