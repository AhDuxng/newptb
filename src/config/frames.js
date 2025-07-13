import { ref } from 'vue';

// Quản lý danh sách các khung ảnh có sẵn
// Hướng dẫn: Đặt các file khung ảnh PNG của bạn vào thư mục /public/frames/
// và cập nhật danh sách đường dẫn tương ứng dưới đây.
export const availableFrames = ref({
  single: [
    '/frames/single/pinkv2single.png',
    '/frames/single/cutesingle.png',
    '/frames/single/hellokitty.png',
    '/frames/single/3congausingle.png',
    '/frames/single/minionsingle.png',
    '/frames/single/locketsingle.png',
    '/frames/single/3cogaisingle.png',
    '/frames/single/thohongsingle.png',
    '/frames/single/quadausingle.png',
  ],
  strip: [
    '/frames/strip/cutestrip.png',
    '/frames/strip/hellokittystrip.png',
    '/frames/strip/3congaustrip.png',
    '/frames/strip/minionstrip.png',
    '/frames/strip/locketstrip.png',
    '/frames/strip/3cogaistrip.png',
    '/frames/strip/thohongstrip.png',
    '/frames/strip/snoopystrip.png',
  ],
  grid_2x3: [
    '/frames/grid_2x3/cutegrid.png',
    '/frames/grid_2x3/minion_2x3.png',
    '/frames/grid_2x3/locketgrid.png',
    '/frames/grid_2x3/3cogaigrid.png',
    '/frames/grid_2x3/thohonggrid.png',
    '/frames/grid_2x3/quadaugrid.png',
  ]
});