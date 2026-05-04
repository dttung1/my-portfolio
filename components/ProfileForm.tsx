"use client";

import { ChangeEvent } from "react";
import {
  Controller,
  useFieldArray,
  UseFormReturn,
} from "react-hook-form";
import { Profile } from "@/lib/profile-schema";
import { FieldArrayCard } from "./FieldArrayCard";

type Props = {
  form: UseFormReturn<Profile>;
};

export function ProfileForm({ form }: Props) {
  const { register, control, watch, setValue, formState } = form;
  const errors = formState.errors;

  const education = useFieldArray({ control, name: "education" });
  const experience = useFieldArray({ control, name: "experience" });
  const projects = useFieldArray({ control, name: "projects" });
  const publications = useFieldArray({ control, name: "publications" });
  const awards = useFieldArray({ control, name: "awards" });
  const links = useFieldArray({ control, name: "links" });

  const skills = watch("skills") ?? [];
  const languages = watch("languages") ?? [];
  const photo = watch("basic.photoDataUrl");

  const onPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setValue("basic.photoDataUrl", reader.result as string, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="section-title">Thông tin cơ bản</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">Họ và tên *</label>
            <input className="input" {...register("basic.fullName")} />
            {errors.basic?.fullName && (
              <p className="mt-1 text-xs text-red-600">{errors.basic.fullName.message}</p>
            )}
          </div>
          <div>
            <label className="label">Ngày sinh</label>
            <input type="date" className="input" {...register("basic.dateOfBirth")} />
          </div>
          <div>
            <label className="label">Giới tính</label>
            <select className="input" {...register("basic.gender")}>
              <option value="">--</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div>
            <label className="label">Quốc tịch</label>
            <input className="input" {...register("basic.nationality")} />
          </div>
          <div>
            <label className="label">Dân tộc</label>
            <input className="input" {...register("basic.ethnicity")} />
          </div>
          <div>
            <label className="label">Quê quán</label>
            <input className="input" {...register("basic.hometown")} />
          </div>
          <div>
            <label className="label">Địa chỉ</label>
            <input className="input" {...register("basic.address")} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" {...register("basic.email")} />
            {errors.basic?.email && (
              <p className="mt-1 text-xs text-red-600">{errors.basic.email.message}</p>
            )}
          </div>
          <div>
            <label className="label">Số điện thoại</label>
            <input className="input" {...register("basic.phone")} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Website / Trang cá nhân</label>
            <input className="input" {...register("basic.website")} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Giới thiệu ngắn</label>
            <textarea rows={3} className="input" {...register("basic.summary")} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Ảnh chân dung</label>
            <div className="flex items-center gap-3">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt="avatar"
                  className="h-20 w-20 rounded-md object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-md bg-slate-100 text-xs text-slate-400">
                  Chưa có
                </div>
              )}
              <input type="file" accept="image/*" onChange={onPhotoChange} />
              {photo && (
                <button
                  type="button"
                  className="btn-danger text-xs"
                  onClick={() => setValue("basic.photoDataUrl", "", { shouldDirty: true })}
                >
                  Xoá ảnh
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <FieldArrayCard
        title="Học vấn"
        onAdd={() =>
          education.append({
            institution: "",
            degree: "",
            field: "",
            startYear: "",
            endYear: "",
            description: "",
          })
        }
      >
        {education.fields.length === 0 && (
          <p className="text-sm text-slate-500">Chưa có mục nào.</p>
        )}
        {education.fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Trường / Cơ sở đào tạo</label>
              <input className="input" {...register(`education.${i}.institution`)} />
            </div>
            <div>
              <label className="label">Bằng cấp</label>
              <input className="input" {...register(`education.${i}.degree`)} />
            </div>
            <div>
              <label className="label">Chuyên ngành</label>
              <input className="input" {...register(`education.${i}.field`)} />
            </div>
            <div>
              <label className="label">Từ năm</label>
              <input className="input" {...register(`education.${i}.startYear`)} />
            </div>
            <div>
              <label className="label">Đến năm</label>
              <input className="input" {...register(`education.${i}.endYear`)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Mô tả</label>
              <textarea rows={2} className="input" {...register(`education.${i}.description`)} />
            </div>
            <div className="md:col-span-2 text-right">
              <button type="button" className="btn-danger text-xs" onClick={() => education.remove(i)}>
                Xoá
              </button>
            </div>
          </div>
        ))}
      </FieldArrayCard>

      <FieldArrayCard
        title="Kinh nghiệm / Công tác"
        onAdd={() =>
          experience.append({
            organization: "",
            role: "",
            startDate: "",
            endDate: "",
            description: "",
          })
        }
      >
        {experience.fields.length === 0 && (
          <p className="text-sm text-slate-500">Chưa có mục nào.</p>
        )}
        {experience.fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Tổ chức / Đơn vị</label>
              <input className="input" {...register(`experience.${i}.organization`)} />
            </div>
            <div>
              <label className="label">Chức vụ / Vai trò</label>
              <input className="input" {...register(`experience.${i}.role`)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Từ</label>
                <input className="input" {...register(`experience.${i}.startDate`)} />
              </div>
              <div>
                <label className="label">Đến</label>
                <input className="input" {...register(`experience.${i}.endDate`)} />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="label">Mô tả</label>
              <textarea rows={3} className="input" {...register(`experience.${i}.description`)} />
            </div>
            <div className="md:col-span-2 text-right">
              <button type="button" className="btn-danger text-xs" onClick={() => experience.remove(i)}>
                Xoá
              </button>
            </div>
          </div>
        ))}
      </FieldArrayCard>

      <FieldArrayCard
        title="Dự án"
        onAdd={() =>
          projects.append({ name: "", role: "", year: "", url: "", description: "" })
        }
      >
        {projects.fields.length === 0 && (
          <p className="text-sm text-slate-500">Chưa có mục nào.</p>
        )}
        {projects.fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Tên dự án</label>
              <input className="input" {...register(`projects.${i}.name`)} />
            </div>
            <div>
              <label className="label">Vai trò</label>
              <input className="input" {...register(`projects.${i}.role`)} />
            </div>
            <div>
              <label className="label">Năm</label>
              <input className="input" {...register(`projects.${i}.year`)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">URL</label>
              <input className="input" {...register(`projects.${i}.url`)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Mô tả</label>
              <textarea rows={2} className="input" {...register(`projects.${i}.description`)} />
            </div>
            <div className="md:col-span-2 text-right">
              <button type="button" className="btn-danger text-xs" onClick={() => projects.remove(i)}>
                Xoá
              </button>
            </div>
          </div>
        ))}
      </FieldArrayCard>

      <FieldArrayCard
        title="Công bố / Bài báo"
        onAdd={() =>
          publications.append({ title: "", authors: "", venue: "", year: "", doi: "" })
        }
      >
        {publications.fields.length === 0 && (
          <p className="text-sm text-slate-500">Chưa có mục nào.</p>
        )}
        {publications.fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Tiêu đề</label>
              <input className="input" {...register(`publications.${i}.title`)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Tác giả</label>
              <input className="input" {...register(`publications.${i}.authors`)} />
            </div>
            <div>
              <label className="label">Nơi xuất bản</label>
              <input className="input" {...register(`publications.${i}.venue`)} />
            </div>
            <div>
              <label className="label">Năm</label>
              <input className="input" {...register(`publications.${i}.year`)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">DOI</label>
              <input className="input" {...register(`publications.${i}.doi`)} />
            </div>
            <div className="md:col-span-2 text-right">
              <button type="button" className="btn-danger text-xs" onClick={() => publications.remove(i)}>
                Xoá
              </button>
            </div>
          </div>
        ))}
      </FieldArrayCard>

      <FieldArrayCard
        title="Giải thưởng / Khen thưởng"
        onAdd={() => awards.append({ name: "", issuer: "", year: "" })}
      >
        {awards.fields.length === 0 && (
          <p className="text-sm text-slate-500">Chưa có mục nào.</p>
        )}
        {awards.fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-3">
            <div className="md:col-span-3">
              <label className="label">Tên</label>
              <input className="input" {...register(`awards.${i}.name`)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Đơn vị trao</label>
              <input className="input" {...register(`awards.${i}.issuer`)} />
            </div>
            <div>
              <label className="label">Năm</label>
              <input className="input" {...register(`awards.${i}.year`)} />
            </div>
            <div className="md:col-span-3 text-right">
              <button type="button" className="btn-danger text-xs" onClick={() => awards.remove(i)}>
                Xoá
              </button>
            </div>
          </div>
        ))}
      </FieldArrayCard>

      <section className="card">
        <div className="section-title">Kỹ năng & Ngôn ngữ</div>
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={control}
            name="skills"
            render={({ field }) => (
              <TagInput
                label="Kỹ năng (Enter để thêm)"
                values={field.value ?? []}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="languages"
            render={({ field }) => (
              <TagInput
                label="Ngôn ngữ (Enter để thêm)"
                values={field.value ?? []}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Đang có: {skills.length} kỹ năng, {languages.length} ngôn ngữ.
        </div>
      </section>

      <FieldArrayCard
        title="Liên kết mạng xã hội / hồ sơ"
        onAdd={() => links.append({ label: "", url: "" })}
      >
        {links.fields.length === 0 && (
          <p className="text-sm text-slate-500">
            Thêm các liên kết như LinkedIn, GitHub, ORCID, Google Scholar, Facebook…
          </p>
        )}
        {links.fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-3">
            <div>
              <label className="label">Nhãn</label>
              <input className="input" {...register(`links.${i}.label`)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">URL</label>
              <input className="input" {...register(`links.${i}.url`)} />
              {errors.links?.[i]?.url && (
                <p className="mt-1 text-xs text-red-600">{errors.links[i]?.url?.message}</p>
              )}
            </div>
            <div className="md:col-span-3 text-right">
              <button type="button" className="btn-danger text-xs" onClick={() => links.remove(i)}>
                Xoá
              </button>
            </div>
          </div>
        ))}
      </FieldArrayCard>
    </div>
  );
}

function TagInput({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2 rounded-md border border-slate-300 bg-white p-2">
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
          >
            {v}
            <button
              type="button"
              className="text-brand-700/70 hover:text-brand-700"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none"
          placeholder="Nhập rồi nhấn Enter…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = (e.target as HTMLInputElement).value.trim();
              if (v && !values.includes(v)) onChange([...values, v]);
              (e.target as HTMLInputElement).value = "";
            }
          }}
        />
      </div>
    </div>
  );
}
