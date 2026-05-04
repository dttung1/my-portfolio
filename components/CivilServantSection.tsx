"use client";

import { useState } from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Profile } from "@/lib/profile-schema";

type Props = { form: UseFormReturn<Profile> };

export function CivilServantSection({ form }: Props) {
  const { register, control } = form;
  const [open, setOpen] = useState(false);
  const family = useFieldArray({ control, name: "civilServant.family" });
  const disciplines = useFieldArray({ control, name: "civilServant.disciplines" });

  return (
    <section className="card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="section-title w-full text-left"
      >
        <span>Viên chức / Sơ yếu lý lịch (tuỳ chọn)</span>
        <span className="text-xs text-slate-500">{open ? "Thu gọn ▲" : "Mở rộng ▼"}</span>
      </button>
      {open && (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Cơ quan tuyển dụng" path="civilServant.recruitmentAgency" register={register} />
            <Field label="Ngày tuyển dụng" path="civilServant.recruitmentDate" register={register} />
            <Field label="Chức vụ hiện tại" path="civilServant.currentPosition" register={register} />
            <Field label="Công việc chính được giao" path="civilServant.mainAssignedWork" register={register} />
            <Field label="Ngạch công chức / viên chức" path="civilServant.civilServantRank" register={register} />
            <Field label="Mã ngạch" path="civilServant.rankCode" register={register} />
            <Field label="Nơi sinh" path="civilServant.placeOfBirth" register={register} />
            <Field label="Nơi đăng ký HKTT" path="civilServant.permanentAddress" register={register} />
            <Field label="Tôn giáo" path="civilServant.religion" register={register} />
            <Field label="Trình độ giáo dục phổ thông" path="civilServant.educationLevel" register={register} />
            <Field label="Trình độ chuyên môn cao nhất" path="civilServant.highestQualification" register={register} />
            <Field label="Lý luận chính trị" path="civilServant.politicalTheoryLevel" register={register} />
            <Field label="Quản lý nhà nước" path="civilServant.stateManagementLevel" register={register} />
            <Field label="Tin học" path="civilServant.itLevel" register={register} />
            <Field label="Ngoại ngữ (mô tả)" path="civilServant.foreignLanguages" register={register} />
            <Field label="Ngày vào Đảng" path="civilServant.partyJoinDate" register={register} />
            <Field label="Ngày chính thức" path="civilServant.partyOfficialDate" register={register} />
            <Field label="Ngày vào Đoàn TNCS HCM" path="civilServant.youthLeagueJoinDate" register={register} />
            <Field label="Tình trạng sức khoẻ" path="civilServant.healthStatus" register={register} />
            <Field label="Chiều cao (cm)" path="civilServant.height" register={register} />
            <Field label="Cân nặng (kg)" path="civilServant.weight" register={register} />
            <Field label="Nhóm máu" path="civilServant.bloodType" register={register} />
            <Field label="Số CMND/CCCD" path="civilServant.idNumber" register={register} />
            <Field label="Ngày cấp CMND/CCCD" path="civilServant.idIssueDate" register={register} />
            <Field label="Số sổ BHXH" path="civilServant.socialInsuranceNumber" register={register} />
            <Field
              label="Gia đình chính sách / Thương binh"
              path="civilServant.policyFamilyStatus"
              register={register}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Quan hệ gia đình</h3>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() =>
                  family.append({
                    relation: "",
                    fullName: "",
                    dateOfBirth: "",
                    occupation: "",
                    address: "",
                  })
                }
              >
                + Thêm
              </button>
            </div>
            {family.fields.length === 0 && (
              <p className="text-sm text-slate-500">
                Cha, mẹ, anh chị em ruột, vợ/chồng, con…
              </p>
            )}
            {family.fields.map((f, i) => (
              <div key={f.id} className="mb-3 grid gap-2 rounded-md border border-slate-200 p-3 md:grid-cols-5">
                <input className="input" placeholder="Quan hệ" {...register(`civilServant.family.${i}.relation`)} />
                <input className="input" placeholder="Họ tên" {...register(`civilServant.family.${i}.fullName`)} />
                <input className="input" placeholder="Năm sinh" {...register(`civilServant.family.${i}.dateOfBirth`)} />
                <input className="input" placeholder="Nghề nghiệp" {...register(`civilServant.family.${i}.occupation`)} />
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Nơi ở"
                    {...register(`civilServant.family.${i}.address`)}
                  />
                  <button type="button" className="btn-danger text-xs" onClick={() => family.remove(i)}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Kỷ luật</h3>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => disciplines.append({ date: "", form: "", reason: "", authority: "" })}
              >
                + Thêm
              </button>
            </div>
            {disciplines.fields.length === 0 && (
              <p className="text-sm text-slate-500">Chưa có mục nào.</p>
            )}
            {disciplines.fields.map((f, i) => (
              <div key={f.id} className="mb-3 grid gap-2 rounded-md border border-slate-200 p-3 md:grid-cols-4">
                <input className="input" placeholder="Ngày" {...register(`civilServant.disciplines.${i}.date`)} />
                <input className="input" placeholder="Hình thức" {...register(`civilServant.disciplines.${i}.form`)} />
                <input className="input" placeholder="Lý do" {...register(`civilServant.disciplines.${i}.reason`)} />
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Cơ quan ban hành"
                    {...register(`civilServant.disciplines.${i}.authority`)}
                  />
                  <button type="button" className="btn-danger text-xs" onClick={() => disciplines.remove(i)}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  path,
  register,
}: {
  label: string;
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" {...register(path)} />
    </div>
  );
}
