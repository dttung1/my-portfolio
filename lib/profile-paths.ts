export const PROFILE_PATHS_DOC = `
basic.fullName — Họ và tên đầy đủ (full legal name)
basic.dateOfBirth — Ngày sinh (YYYY-MM-DD)
basic.gender — Giới tính (Nam / Nữ / Khác)
basic.nationality — Quốc tịch
basic.ethnicity — Dân tộc
basic.hometown — Quê quán (nguyên quán)
basic.address — Nơi ở hiện nay
basic.email — Email
basic.phone — Số điện thoại
basic.website — Website cá nhân
basic.summary — Tóm tắt / Giới thiệu ngắn

civilServant.partyJoinDate — Ngày vào Đảng (dự bị)
civilServant.partyOfficialDate — Ngày vào Đảng chính thức
civilServant.youthLeagueJoinDate — Ngày vào Đoàn TNCS HCM
civilServant.recruitmentDate — Ngày tuyển dụng
civilServant.recruitmentAgency — Cơ quan tuyển dụng
civilServant.currentPosition — Chức vụ / Chức danh hiện tại
civilServant.mainAssignedWork — Công việc chính được giao
civilServant.civilServantRank — Ngạch công chức / chức danh nghề nghiệp viên chức
civilServant.rankCode — Mã ngạch
civilServant.educationLevel — Trình độ giáo dục phổ thông (vd: 12/12)
civilServant.highestQualification — Trình độ chuyên môn cao nhất
civilServant.politicalTheoryLevel — Trình độ lý luận chính trị (Sơ cấp / Trung cấp / Cao cấp / Cử nhân)
civilServant.stateManagementLevel — Trình độ quản lý nhà nước
civilServant.itLevel — Trình độ tin học
civilServant.foreignLanguages — Ngoại ngữ (mô tả tự do)
civilServant.religion — Tôn giáo
civilServant.permanentAddress — Nơi đăng ký HKTT
civilServant.placeOfBirth — Nơi sinh
civilServant.healthStatus — Tình trạng sức khoẻ
civilServant.height — Chiều cao (cm)
civilServant.weight — Cân nặng (kg)
civilServant.bloodType — Nhóm máu
civilServant.idNumber — Số CMND/CCCD
civilServant.idIssueDate — Ngày cấp CMND/CCCD
civilServant.socialInsuranceNumber — Số sổ BHXH
civilServant.policyFamilyStatus — Gia đình chính sách / Thương binh
`.trim();

export const ALL_PROFILE_PATHS: string[] = PROFILE_PATHS_DOC
  .split("\n")
  .map((l) => l.split(" — ")[0].trim())
  .filter((l) => l.length > 0 && !l.startsWith("//"));
