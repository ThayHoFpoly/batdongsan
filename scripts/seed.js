require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('../src/models/AdminUser');
const SiteSettings = require('../src/models/SiteSettings');
const SalesContact = require('../src/models/SalesContact');
const HomeSection = require('../src/models/HomeSection');
const Article = require('../src/models/Article');
const Lead = require('../src/models/Lead');
const Media = require('../src/models/Media');

const seedDatabase = async () => {
  try {
    const isForce = process.argv.includes('--force');
    const mongoUri = process.env.MONGODB_URI;
    console.log('[Seed] Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Connected to database: ${mongoose.connection.name}`);

    // Kiểm tra Idempotent: Nếu đã có dữ liệu và không truyền cờ --force, bảo vệ an toàn dữ liệu
    if (!isForce) {
      const [adminCount, settingsCount] = await Promise.all([
        AdminUser.countDocuments(),
        SiteSettings.countDocuments(),
      ]);

      if (adminCount > 0 && settingsCount > 0) {
        console.log('[Seed] ℹ️ Cơ sở dữ liệu đã chứa dữ liệu quản trị và cài đặt website.');
        console.log('[Seed] Để bảo vệ tính toàn vẹn dữ liệu người dùng, quá trình seed được bỏ qua.');
        console.log('[Seed] Gợi ý: Nếu muốn xóa toàn bộ và nạp lại dữ liệu mẫu ban đầu, hãy chạy:');
        console.log('       npm run seed -- --force');
        await mongoose.disconnect();
        process.exit(0);
      }
    } else {
      console.log('[Seed] ⚠️ Phát hiện cờ --force: Tiến hành xóa dữ liệu cũ và khởi tạo lại dữ liệu mẫu...');
    }

    // 1. Seed AdminUser
    await AdminUser.deleteMany({});
    const defaultEmail = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@grandriverfront.vn').toLowerCase();
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';
    const passwordHash = await AdminUser.hashPassword(defaultPassword);

    const admin = await AdminUser.create({
      displayName: 'Ban Quản Trị Dự Án',
      email: defaultEmail,
      passwordHash,
      role: 'admin',
    });
    console.log(`[Seed] Created AdminUser: ${admin.displayName} (${admin.email})`);

    // 2. Seed SiteSettings (Singleton)
    await SiteSettings.deleteMany({});
    const settings = await SiteSettings.create({
      siteName: 'The Horizon Riverside',
      logoUrl: '',
      faviconUrl: '',
      projectName: 'The Horizon Riverside',
      tagline: 'Không gian sống tinh tế bên dòng sông di sản (Dự Án Minh Họa)',
      shortDescription: 'Khu căn hộ nghỉ dưỡng ven sông sở hữu mật độ xây dựng thấp và chuỗi tiện ích tiêu chuẩn quốc tế.',
      fullDescription: 'The Horizon Riverside được kiến tạo nhằm mang lại chốn an cư thư thái, kết hợp hài hòa giữa nhịp sống đô thị hiện đại và cảnh quan thiên nhiên trong lành bên bờ sông.',
      address: 'Đường Ven Sông, Phường Thạnh Mỹ Lợi, TP. Thủ Đức, TP. Hồ Chí Minh (Vị trí minh họa)',
      developer: 'Đơn Vị Phát Triển Dự Án (Minh họa)',
      projectStats: [
        { label: 'Quy mô tổng thể', value: '2.8 ha', subtext: 'Diện tích quy hoạch toàn khu (minh họa)' },
        { label: 'Mật độ xây dựng', value: '24%', subtext: '76% dành cho cây xanh & mặt nước' },
        { label: 'Quy mô công trình', value: '02 Tháp', subtext: 'Chiều cao 28 tầng nổi, tầm nhìn mở' },
        { label: 'Số lượng sản phẩm', value: '480 Căn', subtext: 'Phiên bản giới hạn dành cho chủ nhân' },
      ],
      seo: {
        title: 'The Horizon Riverside - Tuyệt tác căn hộ nghỉ dưỡng ven sông (Minh họa)',
        description: 'Website giới thiệu dự án căn hộ The Horizon Riverside. Khám phá không gian sinh thái, hệ tiện ích đồng bộ và liên hệ tư vấn chuyên sâu.',
        ogImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      },
      footer: {
        copyrightText: 'Bản quyền © 2026 The Horizon Riverside. Tất cả quyền được bảo lưu.',
        disclaimerText: 'Lưu ý: Tất cả hình ảnh, thông số kỹ thuật, quy mô và thông tin trên website này chỉ mang tính chất minh họa tham khảo cho giao diện phần mềm, không phải là cam kết pháp lý hay chào bán chính thức.',
        links: [
          { label: 'Tổng quan dự án', url: '/#tong-quan' },
          { label: 'Vị trí & Kết nối', url: '/#vi-tri' },
          { label: 'Hệ thống tiện ích', url: '/#tien-ich' },
          { label: 'Mặt bằng căn hộ', url: '/#mat-bang' },
          { label: 'Thư viện hình ảnh', url: '/#thu-vien' },
          { label: 'Tin tức & Sự kiện', url: '/#tin-tuc' },
          { label: 'Liên hệ tư vấn', url: '/#lien-he' },
        ],
      },
    });
    console.log(`[Seed] Created SiteSettings: ${settings.siteName}`);

    // 3. Seed SalesContact
    await SalesContact.deleteMany({});
    const contact = await SalesContact.create({
      fullName: 'Võ Minh Quân',
      title: 'Chuyên viên tư vấn dự án cao cấp',
      phone: '0901234567',
      email: 'tuvan@horizonriverside.vn',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
      messengerUrl: 'https://m.me/horizonriverside.demo',
      zaloUrl: 'https://zalo.me/0901234567',
      ctaText: 'Liên hệ tư vấn',
      isEnabled: true,
    });
    console.log(`[Seed] Created SalesContact: ${contact.fullName} (${contact.phone})`);

    // 4. Seed HomeSections (8 sections)
    await HomeSection.deleteMany({});
    const sections = [
      {
        key: 'hero',
        type: 'hero',
        title: 'Tuyệt tác kiến trúc bên dòng chảy thanh bình',
        subtitle: 'Căn hộ nghỉ dưỡng ven sông • Minh họa',
        order: 1,
        enabled: true,
        heroContent: {
          headline: 'Tuyệt tác kiến trúc bên dòng chảy thanh bình',
          subheadline: 'The Horizon Riverside mở ra không gian sống tĩnh tại, nơi giá trị thiên nhiên nguyên bản hòa quyện cùng ngôn ngữ thiết kế tối giản, tinh tế.',
          ctaText: 'Liên hệ tư vấn',
          ctaLink: '#lien-he',
          secondaryBtnText: 'Khám phá tổng quan',
          secondaryBtnLink: '#tong-quan',
          backgroundImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80',
        },
      },
      {
        key: 'overview',
        type: 'overview',
        title: 'Quy chuẩn sống chuẩn mực giữa lòng đô thị',
        subtitle: 'Tổng quan dự án',
        order: 2,
        enabled: true,
        overviewContent: {
          description: 'Tọa lạc tại dải đất ven sông hiếm hoi, The Horizon Riverside được quy hoạch với triết lý tôn trọng thiên nhiên và tối đa hóa khoảng thở. Không gian mỗi ngày là sự kết hợp cân bằng giữa nhịp điệu sinh hoạt tiện nghi và sự tĩnh tâm tuyệt đối.',
          masterPlanImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
          stats: [
            { label: 'Quy mô tổng thể', value: '2.8 ha', subtext: 'Diện tích quy hoạch toàn khu (minh họa)' },
            { label: 'Mật độ xây dựng', value: '24%', subtext: '76% dành cho cây xanh & mặt nước' },
            { label: 'Quy mô công trình', value: '02 Tháp', subtext: 'Chiều cao 28 tầng nổi, tầm nhìn mở' },
            { label: 'Số lượng sản phẩm', value: '480 Căn', subtext: 'Phiên bản giới hạn dành cho chủ nhân' },
          ],
        },
      },
      {
        key: 'location',
        type: 'location',
        title: 'Tâm điểm kết nối, trọn vẹn cảnh sắc ven sông',
        subtitle: 'Vị trí & Kết nối',
        order: 3,
        enabled: true,
        locationContent: {
          description: 'Sở hữu mặt tiền trải dài hướng ra bờ sông lộng gió, dự án nằm trên trục giao thông kết nối trực tiếp đến trung tâm tài chính và các khu đô thị vệ tinh hiện đại.',
          address: 'Đường Ven Sông, Phường Thạnh Mỹ Lợi, TP. Thủ Đức, TP. Hồ Chí Minh (Vị trí minh họa)',
          mapEmbedUrl: '',
          mapImageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80',
          highlights: [
            { destination: 'Trung tâm tài chính Thủ Thiêm / Quận 1', minutes: '12 - 15 phút', distanceKm: '6.5 km', note: 'Qua trục đường Mai Chí Thọ' },
            { destination: 'Nhà ga tuyến Metro Bến Thành - Suối Tiên', minutes: '5 phút', distanceKm: '2.0 km', note: 'Kết nối nhanh bằng xe điện nội khu' },
            { destination: 'Bến thuyền du lịch ven sông', minutes: '1 phút đi bộ', distanceKm: '100 m', note: 'Liền kề công viên bờ sông dự án' },
            { destination: 'Hệ thống trường học quốc tế & bệnh viện quốc tế', minutes: '8 phút', distanceKm: '3.5 km', note: 'Phục vụ cư dân đầy đủ tiện nghi' },
          ],
        },
      },
      {
        key: 'amenities',
        type: 'amenities',
        title: 'Trải nghiệm phong cách nghỉ dưỡng mỗi ngày',
        subtitle: 'Hệ sinh thái tiện ích',
        order: 4,
        enabled: true,
        amenitiesContent: {
          description: 'Từng chi tiết cảnh quan và tiện ích nội khu được kiến tạo tỉ mỉ, giúp thanh lọc tâm trí và bồi đắp sức khỏe sau những giờ làm việc bận rộn.',
          items: [
            {
              title: 'Hồ bơi vô cực hướng sông',
              description: 'Mặt nước tràn bờ diện tích 600m² sử dụng công nghệ điện phân muối khoáng, đem đến cảm giác bồng bềnh giữa mây trời và sông nước.',
              imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
              category: 'Nghỉ dưỡng',
            },
            {
              title: 'Công viên ven sông 1.2 ha',
              description: 'Đường dạo bộ rợp bóng mát dài hơn 800m dọc triền sông kết hợp các khu vườn thiền, chòi ngắm cảnh và bãi cỏ dã ngoại.',
              imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
              category: 'Thiên nhiên',
            },
            {
              title: 'Sảnh đón tiếp & Lounge thượng lưu',
              description: 'Trần cao 7m với vật liệu đá tự nhiên và gỗ mộc, dịch vụ concierge chu đáo hỗ trợ mọi nhu cầu đời sống cư dân.',
              imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
              category: 'Dịch vụ cao cấp',
            },
            {
              title: 'Phòng gym & Yoga view kính panorama',
              description: 'Trang thiết bị chuẩn Technogym thế hệ mới với huấn luyện viên cá nhân và tầm nhìn trọn vẹn ra vườn cây xanh ngát.',
              imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
              category: 'Sức khỏe',
            },
            {
              title: 'Khu tiệc nướng BBQ gia đình',
              description: 'Bố trí biệt lập giữa các tán cây lớn, trang bị lò nướng và bàn ăn ngoài trời cho các buổi họp mặt ấm cúng.',
              imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
              category: 'Cộng đồng',
            },
            {
              title: 'Khu vui chơi trẻ em sáng tạo',
              description: 'Thiết kế theo phương pháp vận động tự nhiên, sử dụng vật liệu an toàn thân thiện với môi trường.',
              imageUrl: 'https://images.unsplash.com/photo-1596464716127-f2a829822301?auto=format&fit=crop&w=800&q=80',
              category: 'Gia đình',
            },
          ],
        },
      },
      {
        key: 'floor-plans',
        type: 'floorPlans',
        title: 'Thiết kế thông minh, tôn vinh ánh sáng tự nhiên',
        subtitle: 'Mặt bằng & Thiết kế',
        order: 5,
        enabled: true,
        floorPlansContent: {
          description: 'Tất cả căn hộ đều sở hữu chiều sâu logia rộng rãi, hệ cửa kính full-height từ sàn tới trần giúp đón trọn vẹn ánh bình minh và gió mát từ sông.',
          items: [
            {
              name: 'Căn hộ Suite 1 Phòng Ngủ',
              code: '1BR-A',
              bedrooms: '1 PN',
              bathrooms: '1 WC',
              area: '54.5 m²',
              imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
              description: 'Không gian mở thanh lịch, lý tưởng cho người trẻ thành đạt hoặc các chuyên gia tìm kiếm một nơi chốn tĩnh lặng.',
              features: ['Logia phòng khách rộng', 'Bếp mở phong cách Bắc Âu', 'Phòng ngủ lớn đón ánh sáng tự nhiên'],
            },
            {
              name: 'Căn hộ Deluxe 2 Phòng Ngủ',
              code: '2BR-B',
              bedrooms: '2 PN',
              bathrooms: '2 WC',
              area: '78.2 m²',
              imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
              description: 'Thiết kế cân đối tối ưu công năng cho gia đình trẻ, với khu vực sinh hoạt chung ấm cúng và phòng làm việc riêng.',
              features: ['Ban công hướng trực diện sông', 'Phòng ngủ Master có WC riêng', 'Khu vực giặt phơi thông thoáng'],
            },
            {
              name: 'Căn hộ Executive 3 Phòng Ngủ',
              code: '3BR-C',
              bedrooms: '3 PN',
              bathrooms: '2 WC',
              area: '105.8 m²',
              imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
              description: 'Căn góc 2 mặt thoáng với tầm nhìn 270 độ, mang đến không gian rộng rãi cho các thế hệ trong cùng gia đình.',
              features: ['Tầm nhìn góc rộng panorama', 'Khu vực bếp ướt và khô riêng biệt', 'Phòng chứa đồ và tủ giày âm tường'],
            },
            {
              name: 'Sky Villa Penthouse Thượng Lưu',
              code: 'PENTHOUSE',
              bedrooms: '4 PN',
              bathrooms: '4 WC',
              area: '215.0 m²',
              imageUrl: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80',
              description: 'Kiệt tác trên tầng không với trần cao 6m, sân vườn trên cao và hồ bơi cảnh quan riêng biệt.',
              features: ['Thiết kế duplex thông tầng sang trọng', 'Hồ ngâm jacuzzi thư giãn ngoài trời', 'Thang máy riêng bảo mật'],
            },
          ],
        },
      },
      {
        key: 'gallery',
        type: 'gallery',
        title: 'Cận cảnh vẻ đẹp kiến trúc đương đại',
        subtitle: 'Thư viện hình ảnh',
        order: 6,
        enabled: true,
        galleryContent: {
          description: 'Những góc nhìn chân thực phản chiếu vẻ đẹp trang nhã và chuẩn mực xây dựng của dự án.',
          items: [
            {
              title: 'Phối cảnh tổng thể tháp căn hộ ven sông',
              imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
              category: 'Kiến trúc',
            },
            {
              title: 'Hồ bơi vô cực ngắm hoàng hôn',
              imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80',
              category: 'Tiện ích',
            },
            {
              title: 'Không gian phòng khách căn hộ mẫu 3PN',
              imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
              category: 'Căn hộ mẫu',
            },
            {
              title: 'Đường dạo bộ ven sông chiều hoàng hôn',
              imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
              category: 'Cảnh quan',
            },
            {
              title: 'Sảnh đón tiếp sang trọng tiêu chuẩn khách sạn',
              imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
              category: 'Nội thất',
            },
            {
              title: 'Phòng ngủ Master với khung cửa kính lớn',
              imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
              category: 'Căn hộ mẫu',
            },
          ],
        },
      },
      {
        key: 'news',
        type: 'news',
        title: 'Cập nhật tin tức dự án & góc nhìn thị trường',
        subtitle: 'Tin tức & Thị trường',
        order: 7,
        enabled: true,
        newsContent: {
          description: 'Theo dõi những chuyển động mới nhất về tiến trình phát triển và bài viết phân tích thị trường.',
          displayCount: 6,
        },
      },
      {
        key: 'contact',
        type: 'contact',
        title: 'Đăng ký nhận thông tin và tư vấn chuyên sâu',
        subtitle: 'Liên hệ tư vấn',
        order: 8,
        enabled: true,
        contactContent: {
          description: 'Quý khách vui lòng để lại thông tin liên hệ. Chuyên viên tư vấn dự án sẽ liên hệ lại trong thời gian sớm nhất để cung cấp tài liệu chi tiết.',
          note: 'Mọi thông tin đăng ký đều được bảo mật tuyệt đối.',
        },
      },
    ];

    for (const secData of sections) {
      await HomeSection.create(secData);
    }
    console.log(`[Seed] Created ${sections.length} HomeSections.`);

    // 5. Seed Articles
    await Article.deleteMany({});
    const articleDocs = [
      {
        title: 'Xu hướng không gian sống sinh thái ven sông: Giá trị trường tồn của phong cách nghỉ dưỡng tại gia',
        slug: 'xu-huong-khong-gian-song-sinh-thai-ven-song',
        category: 'Phong cách sống',
        excerpt: 'Trong kỷ nguyên đô thị hóa nhanh chóng, những không gian sống kế cận mặt nước không chỉ đem lại vi khí hậu mát mẻ mà còn là tài sản nâng niu sức khỏe tinh thần dài lâu cho gia đình.',
        coverImage: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
        contentHtml: `
          <p>Sự phát triển mạnh mẽ của nhịp sống hiện đại khiến nhu cầu tìm kiếm một chốn an cư yên bình, hòa hợp với thiên nhiên trở thành ưu tiên hàng đầu của nhiều gia đình thành đạt. Trong đó, bất động sản ven sông luôn sở hữu sức hấp dẫn đặc biệt nhờ giá trị kép: cảnh quan thoáng đạt và phong thủy thịnh vượng.</p>
          <h2>1. Vi khí hậu trong lành và khoảng thở tự nhiên</h2>
          <p>Mặt nước tự nhiên có khả năng điều hòa nhiệt độ, lọc bụi mịn và tạo ra những làn gió mát lành. Khi trở về nhà sau một ngày bận rộn, việc ngắm nhìn dòng nước lững lờ trôi giúp nhịp tim chậm lại, giải tỏa căng thẳng và tái tạo nguồn năng lượng tích cực cho cơ thể.</p>
          <p>Tại các dự án ven sông chuẩn mực, kiến trúc luôn ưu tiên các mặt cắt đón gió đối lưu, ban công sâu và các mảng kính lớn để thiên nhiên trở thành một phần của không gian nội thất.</p>
          <h2>2. Tinh thần nghỉ dưỡng hòa quyện trong từng nếp sống</h2>
          <p>Không cần phải chờ đợi những chuyến du lịch xa xôi, một dự án được quy hoạch bài bản mang lại cảm giác nghỉ dưỡng (resort-living) ngay tại chính ngôi nhà của mình. Từ đường chạy bộ ven sông rợp bóng cây cổ thụ, hồ bơi điện phân muối cho tới khu vườn thiền tĩnh lặng vào buổi sớm, tất cả tạo nên một phong cách sống thư thái và bền vững.</p>
          <h2>3. Giá trị gia tăng và tính khan hiếm theo thời gian</h2>
          <p>Quỹ đất ven sông tại các đô thị lớn là nguồn tài nguyên hữu hạn không thể nhân bản. Chính vì vậy, các sản phẩm căn hộ bên sông luôn duy trì được tính thanh khoản và giá trị gia tăng bền bỉ qua các chu kỳ kinh tế, xứng đáng là di sản truyền đời cho các thế hệ tiếp nối.</p>
        `,
        status: 'published',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        author: 'Ban Biên Tập Kiến Trúc',
        views: 145,
      },
      {
        title: 'Tối ưu hóa ánh sáng và đối lưu không khí trong thiết kế căn hộ đương đại',
        slug: 'toi-uu-hoa-anh-sang-va-doi-luu-khong-khi-trong-thiet-ke-can-ho',
        category: 'Thiết kế kiến trúc',
        excerpt: 'Khám phá giải pháp kiến trúc xanh giúp căn hộ luôn ngập tràn ánh sáng tự nhiên, tiết kiệm năng lượng và nuôi dưỡng năng lượng sống mỗi ngày.',
        coverImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
        contentHtml: `
          <p>Ánh sáng và không khí tự nhiên là hai yếu tố cốt lõi quyết định chất lượng không gian sống trong căn hộ cao tầng. Một căn hộ được thiết kế tối ưu không chỉ giúp chủ nhân giảm thiểu chi phí sử dụng năng lượng mà còn cải thiện rõ rệt sức khỏe thể chất và tinh thần.</p>
          <h2>Thiết kế mặt bằng chữ H và các khe lấy sáng</h2>
          <p>Thay vì bố trí các khối nhà liền mạch dạng hộp kín, các kiến trúc sư đương đại áp dụng layout tạo hình chữ H hoặc chữ U nhằm mở rộng diện tích tiếp xúc với khí trời. Nhờ đó, ngay cả các khu vực chức năng như bếp, hành lang và phòng vệ sinh cũng đều có cửa thông gió tự nhiên, loại bỏ ẩm mốc và mùi thức ăn.</p>
          <h2>Hệ kính cản nhiệt Low-E và cửa trượt lớn</h2>
          <p>Việc trang bị kính cản nhiệt kép Low-E giúp tối ưu hóa lượng ánh sáng đi vào phòng nhưng vẫn ngăn chặn bức xạ nhiệt hồng ngoại và tia cực tím gây hại. Nhờ đó, nhiệt độ trong phòng luôn duy trì ở mức dễ chịu dù vào những ngày hè oi bức.</p>
        `,
        status: 'published',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        author: 'KTS. Lê Hoàng Hải',
        views: 102,
      },
      {
        title: 'Hệ tiện ích khép kín: Tiêu chuẩn vàng định hình đẳng cấp cộng đồng cư dân',
        slug: 'he-tien-ich-khep-kin-tieu-chuan-vang-dinh-hinh-dang-cap',
        category: 'Tiện ích dự án',
        excerpt: 'Khi không gian sống vượt khỏi bốn bức tường căn hộ, hệ tiện ích đồng bộ chính là thước đo khẳng định đẳng cấp sống và sự tiện nghi của gia chủ.',
        coverImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        contentHtml: `
          <p>Mô hình "all-in-one" (tất cả trong một) tại các dự án bất động sản hạng sang đã tiến hóa lên một tầm cao mới: không chỉ đầy đủ về số lượng, mà còn đòi hỏi sự tinh tế về trải nghiệm cá nhân hóa và tính riêng tư bảo mật.</p>
          <p>Cư dân không chỉ tìm kiếm một hồ bơi thông thường, mà là một hồ bơi muối khoáng vô cực với tầm nhìn đắt giá. Họ không chỉ cần một khu vui chơi, mà là một không gian khám phá sinh thái an toàn để con trẻ lớn lên tự nhiên. Chính sự chăm chút này tạo nên một cộng đồng cư dân văn minh, gắn kết và đồng điệu về phong cách hưởng thụ cuộc sống.</p>
        `,
        status: 'published',
        publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        author: 'Nguyễn Thanh Tùng',
        views: 89,
      },
      {
        title: 'Quy hoạch hạ tầng đô thị ven sông: Bệ phóng kết nối khu vực Đông TP.HCM',
        slug: 'quy-hoach-ha-tang-do-thi-ven-song-be-phong-ket-noi',
        category: 'Hạ tầng kết nối',
        excerpt: 'Sự hoàn thiện đồng bộ của hệ thống cầu nối, vành đai và các tuyến buýt đường thủy đang tạo nên diện mạo giao thông hiện đại cho các khu dân cư sinh thái bên sông.',
        coverImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80',
        contentHtml: `
          <p>Hạ tầng giao thông luôn là đòn bẩy thúc đẩy giá trị bất động sản. Tại khu vực phía Đông, sự kết hợp giữa giao thông đường bộ tốc độ cao và giao thông đường thủy du lịch đang tạo nên một diện mạo mới cho các dự án bất động sản tọa lạc dọc bờ sông.</p>
          <p>Cư dân tương lai có thể linh hoạt lựa chọn di chuyển bằng phương tiện cá nhân, metro hoặc trải nghiệm tuyến buýt sông mát lành để đến nơi làm việc mà không phải chịu cảnh ùn tắc giao thông giờ cao điểm.</p>
        `,
        status: 'published',
        publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        author: 'Chuyên Viên Phân Tích Thị Trường',
        views: 124,
      },
    ];

    for (const art of articleDocs) {
      await Article.create(art);
    }
    console.log(`[Seed] Created ${articleDocs.length} published articles.`);

    // 6. Seed Lead
    await Lead.deleteMany({});
    const lead = await Lead.create({
      fullName: 'Trần Văn Nam (Minh họa)',
      phone: '0988123456',
      interest: 'Căn hộ Executive 3 Phòng Ngủ',
      note: 'Quan tâm căn góc tầng cao hướng sông, muốn nhận brochure chi tiết (Dữ liệu mẫu)',
      source: 'landing_page',
      status: 'new',
      consentGiven: true,
      consentAt: new Date(),
    });
    console.log(`[Seed] Created sample Lead: ${lead.fullName}`);

    // 7. Seed Media records
    await Media.deleteMany({});
    const mediaItems = [
      {
        filename: 'hero-banner-main.jpg',
        originalName: 'the-horizon-hero.jpg',
        mimeType: 'image/jpeg',
        size: 384000,
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80',
        altText: 'Phối cảnh tháp căn hộ ven sông The Horizon Riverside',
        width: 2000,
        height: 1125,
      },
      {
        filename: 'overview-master-plan.jpg',
        originalName: 'master-plan.jpg',
        mimeType: 'image/jpeg',
        size: 256000,
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        altText: 'Mặt bằng tổng thể quy hoạch The Horizon Riverside',
        width: 1200,
        height: 800,
      },
    ];
    for (const m of mediaItems) {
      await Media.create(m);
    }
    console.log(`[Seed] Created ${mediaItems.length} media records.`);

    console.log('[Seed] Database seeded to Atlas successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();
