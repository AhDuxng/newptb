import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

export const handler = async (event) => {
  // Ghi log khi hàm được gọi để kiểm tra
  console.log('Function "upload" đã được gọi.');

  // Chỉ chấp nhận phương thức POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Phương thức không được phép' }) 
    };
  }

  try {
    const { image } = JSON.parse(event.body);
    if (!image) {
      console.error('Lỗi: Không nhận được dữ liệu ảnh.');
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Không tìm thấy dữ liệu ảnh.' }) 
      };
    }
    // Ghi log độ dài của ảnh để xác nhận đã nhận được dữ liệu
    console.log(`Đã nhận dữ liệu ảnh với độ dài: ${image.length}`);

    // Lấy API key từ biến môi trường (an toàn)
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      console.error('LỖI NGHIÊM TRỌNG: Biến môi trường IMGBB_API_KEY chưa được thiết lập.');
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'API key chưa được cấu hình trên server. Vui lòng kiểm tra biến môi trường.' }) 
      };
    }
    console.log('Đã tìm thấy API key.');

    // Sử dụng URLSearchParams để gửi dữ liệu base64, đây là cách ImgBB hỗ trợ
    const params = new URLSearchParams();
    params.append('key', apiKey);
    params.append('image', image);

    console.log('Đang gửi yêu cầu đến API của ImgBB...');
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: params,
    });

    // Luôn lấy kết quả trả về để kiểm tra
    const result = await response.json();
    console.log('Đã nhận phản hồi từ ImgBB:', JSON.stringify(result, null, 2));

    // Kiểm tra kỹ hơn kết quả trả về
    if (!response.ok || !result.success) {
      const errorMessage = result.error?.message || 'Lỗi không xác định từ API ImgBB';
      console.error(`Lỗi API ImgBB: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log('Tải lên thành công. Đang trả dữ liệu về.');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Đã xảy ra lỗi trong hàm upload:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
