type StringSchema = { type: "string"; description?: string };

const s = (description?: string): StringSchema =>
  description ? { type: "string", description } : { type: "string" };

const stringArray = { type: "array", items: { type: "string" } } as const;

function obj<P extends Record<string, unknown>>(properties: P) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  } as const;
}

function arr<I>(items: I) {
  return { type: "array", items } as const;
}

const basic = obj({
  fullName: s("Họ tên đầy đủ"),
  dateOfBirth: s("Ngày sinh dạng YYYY-MM-DD nếu đoán được, không thì để rỗng"),
  gender: { type: "string", description: 'Để "male", "female", "other", hoặc ""' } as const,
  nationality: s("Quốc tịch"),
  ethnicity: s("Dân tộc"),
  hometown: s("Quê quán"),
  address: s("Nơi ở hiện nay"),
  email: s("Email"),
  phone: s("Số điện thoại"),
  website: s("Website cá nhân"),
  summary: s("Tóm tắt / giới thiệu ngắn 1-3 câu"),
});

const education = arr(
  obj({
    institution: s("Trường / cơ sở đào tạo"),
    degree: s("Bằng cấp / học vị"),
    field: s("Chuyên ngành"),
    startYear: s("Năm/tháng bắt đầu"),
    endYear: s("Năm/tháng kết thúc, để 'Hiện tại' nếu chưa xong"),
    description: s("Mô tả thêm (tuỳ chọn)"),
  }),
);

const experience = arr(
  obj({
    organization: s("Tổ chức / đơn vị"),
    role: s("Chức vụ / vai trò"),
    startDate: s("Mốc bắt đầu"),
    endDate: s("Mốc kết thúc"),
    description: s("Mô tả công việc"),
  }),
);

const projects = arr(
  obj({
    name: s("Tên dự án"),
    role: s("Vai trò"),
    year: s("Năm"),
    url: s("URL"),
    description: s("Mô tả"),
  }),
);

const publications = arr(
  obj({
    title: s("Tiêu đề công bố"),
    authors: s("Danh sách tác giả"),
    venue: s("Tạp chí / hội nghị / NXB"),
    year: s("Năm"),
    doi: s("DOI nếu có"),
  }),
);

const awards = arr(
  obj({
    name: s("Tên giải thưởng"),
    issuer: s("Đơn vị trao"),
    year: s("Năm"),
  }),
);

const links = arr(
  obj({
    label: s("Nhãn (vd LinkedIn, GitHub, ORCID)"),
    url: s("URL đầy đủ có https://"),
  }),
);

const family = arr(
  obj({
    relation: s("Quan hệ (Cha, Mẹ, Vợ/Chồng, Con, Anh/Chị/Em)"),
    fullName: s("Họ tên"),
    dateOfBirth: s("Năm sinh"),
    occupation: s("Nghề nghiệp"),
    address: s("Nơi ở"),
  }),
);

const disciplines = arr(
  obj({
    date: s("Ngày"),
    form: s("Hình thức"),
    reason: s("Lý do"),
    authority: s("Cơ quan ban hành"),
  }),
);

const civilServant = obj({
  partyJoinDate: s("Ngày vào Đảng dự bị"),
  partyOfficialDate: s("Ngày vào Đảng chính thức"),
  youthLeagueJoinDate: s("Ngày vào Đoàn TNCS HCM"),
  recruitmentDate: s("Ngày tuyển dụng"),
  recruitmentAgency: s("Cơ quan tuyển dụng"),
  currentPosition: s("Chức vụ / chức danh hiện tại"),
  mainAssignedWork: s("Công việc chính được giao"),
  civilServantRank: s("Ngạch công chức / chức danh nghề nghiệp"),
  rankCode: s("Mã ngạch"),
  educationLevel: s("Trình độ giáo dục phổ thông (vd 12/12)"),
  highestQualification: s("Trình độ chuyên môn cao nhất"),
  politicalTheoryLevel: s("Lý luận chính trị"),
  stateManagementLevel: s("Quản lý nhà nước"),
  itLevel: s("Tin học"),
  foreignLanguages: s("Ngoại ngữ — mô tả tự do"),
  religion: s("Tôn giáo"),
  permanentAddress: s("Nơi đăng ký HKTT"),
  placeOfBirth: s("Nơi sinh"),
  healthStatus: s("Tình trạng sức khoẻ"),
  height: s("Chiều cao (cm)"),
  weight: s("Cân nặng (kg)"),
  bloodType: s("Nhóm máu"),
  idNumber: s("Số CMND/CCCD"),
  idIssueDate: s("Ngày cấp CMND/CCCD"),
  socialInsuranceNumber: s("Số sổ BHXH"),
  policyFamilyStatus: s("Gia đình chính sách / thương binh"),
  family,
  disciplines,
});

export const IMPORTED_PROFILE_SCHEMA = obj({
  basic,
  education,
  experience,
  projects,
  publications,
  awards,
  skills: stringArray,
  languages: stringArray,
  links,
  civilServant,
});
