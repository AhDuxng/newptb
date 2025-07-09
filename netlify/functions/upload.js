const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { image } = JSON.parse(event.body);
    if (!image) {
      return { statusCode: 400, body: 'Missing image data' };
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: 'API key is missing on server.' };
    }

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', image);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'ImgBB upload failed');
    }

    // ✅ KHÔNG trả về bất kỳ thông tin nào về ảnh
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Server error.' }),
    };
  }
};
