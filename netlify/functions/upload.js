const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async function (event, context) {
  // Chỉ chấp nhận phương thức POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { image } = JSON.parse(event.body);
    if (!image) {
      return { statusCode: 400, body: 'Missing image data' };
    }

    // Lấy API key từ biến môi trường (an toàn)
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: 'API key is not configured on the server.' };
    }

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', image); // Gửi dữ liệu base64

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      // Ném lỗi nếu ImgBB trả về lỗi
      throw new Error(result.error?.message || 'ImgBB API error');
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
