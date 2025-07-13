import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

export const handler = async (event) => {
  // Ghi log khi hàm được gọi để kiểm tra (chỉ ở phía server)
  console.log('Function "upload" đã được gọi.');

  // Chỉ chấp nhận phương thức POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405 }; // Lỗi, không trả về body
  }

  try {
    const { image } = JSON.parse(event.body);
    if (!image) {
      console.error('Lỗi: Không nhận được dữ liệu ảnh.');
      return { statusCode: 400 }; // Lỗi, không trả về body
    }
    console.log('Đã nhận dữ liệu ảnh.');

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      console.error('LỖI NGHIÊM TRỌNG: Biến môi trường IMGBB_API_KEY chưa được thiết lập.');
      return { statusCode: 500 }; // Lỗi, không trả về body
    }
    console.log('Đã tìm thấy API key.');

    const params = new URLSearchParams();
    params.append('key', apiKey);
    params.append('image', image);

    console.log('Đang gửi yêu cầu đến API của ImgBB...');
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: params,
    });

    const result = await response.json();
    console.log('Đã nhận phản hồi từ ImgBB.');

    if (!response.ok || !result.success) {
      const errorMessage = result.error?.message || 'Lỗi không xác định từ API ImgBB';
      console.error(`Lỗi API ImgBB: ${errorMessage}`);
      // Ném lỗi để khối catch xử lý và trả về mã 500 chung
      throw new Error(errorMessage);
    }

    console.log('Tải lên thành công.');
    return {
      statusCode: 204, // Thành công, không có nội dung để trả về
    };

  } catch (error) {
    // Ghi lại lỗi thực tế ở server
    console.error('Đã xảy ra lỗi trong hàm upload:', error);
    // Trả về lỗi chung chung cho client, không có body
    return { statusCode: 500 };
  }
};