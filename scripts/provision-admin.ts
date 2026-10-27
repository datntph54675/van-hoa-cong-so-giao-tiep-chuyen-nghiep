import { dbManager } from '../server/db';
import { generateSalt, hashPassword, verifyPassword } from '../src/utils/crypto';
import { UserAccount } from '../src/types';

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'tuda2k4@gmail.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '123456';
  const name = process.env.ADMIN_NAME || 'Nguyễn Tuấn Đạt';
  const role = process.env.ADMIN_ROLE || 'Quản trị viên Hệ thống';

  if (!email || !password) {
    console.error('ERROR: Missing ADMIN_EMAIL or ADMIN_PASSWORD');
    process.exit(1);
  }

  console.log(`[Admin Provisioning] Processing administrator account for: ${email}`);

  const db = dbManager.getDB();
  const existingUserIndex = db.users.findIndex((u) => u.email.toLowerCase() === email);

  const salt = generateSalt();
  const hash = await hashPassword(password, salt);

  // Verify hash immediately
  const verifyCheck = await verifyPassword(password, salt, hash);
  if (!verifyCheck) {
    console.error('ERROR: Generated password hash verification failed');
    process.exit(1);
  }

  if (existingUserIndex >= 0) {
    const existing = db.users[existingUserIndex];
    console.log(`[Admin Provisioning] User ${email} already exists (id: ${existing.id}). Upgrading/updating role to admin.`);
    db.users[existingUserIndex] = {
      ...existing,
      name: existing.name || name,
      role,
      isAdmin: true,
      passwordSalt: salt,
      passwordHash: hash
    };
    dbManager.logAction(
      { name, email },
      'Cập nhật quyền Quản trị viên (Provision Script)',
      'user',
      name,
      `Tài khoản ${email} đã được cập nhật vai trò Quản trị viên tối cao.`
    );
  } else {
    console.log(`[Admin Provisioning] Creating new administrator account for: ${email}`);
    const newAdminUser: UserAccount = {
      id: 'usr_admin_' + Date.now().toString(36),
      email,
      name,
      birthDate: '2004-01-01',
      phone: '0901234567',
      gender: 'Nam',
      role,
      organizationType: 'Đơn vị sự nghiệp công lập',
      organizationName: 'Hệ thống Đào tạo Văn hóa Công sở & Giao tiếp Chuyên nghiệp',
      department: 'Ban Điều hành & Quản trị Hệ thống',
      subUnit: 'Tổ Quản trị Nội dung & Phân tích AI',
      workplaceAddress: 'Hà Nội',
      city: 'Hà Nội',
      experienceYears: '5 - 10 năm',
      learningGoal: 'Đào tạo nhân viên',
      avatarSeed: 'tuda2k4',
      joinedDate: 'Tháng ' + (new Date().getMonth() + 1) + ', ' + new Date().getFullYear(),
      createdAt: new Date().toISOString().split('T')[0],
      passwordSalt: salt,
      passwordHash: hash,
      isAdmin: true
    };
    db.users.unshift(newAdminUser);
    dbManager.logAction(
      { name, email },
      'Khởi tạo Quản trị viên đầu tiên (Provision Script)',
      'user',
      name,
      `Tài khoản Quản trị viên chính thức đã được thiết lập qua hệ thống backend an toàn.`
    );
  }

  dbManager.save();
  console.log(`[Admin Provisioning] SUCCESS: Administrator account [${email}] is provisioned with role [${role}] and isAdmin [true].`);
}

main().catch((err) => {
  console.error('[Admin Provisioning] Fatal Error:', err);
  process.exit(1);
});
