import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { betaJSONSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/beta/json-schema";
import mammoth from "mammoth";
import { PROFILE_PATHS_DOC } from "@/lib/profile-paths";

export const runtime = "nodejs";
export const maxDuration = 300;

const SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    templatedHtml: {
      type: "string",
      description:
        "HTML giống nguyên bản nhưng đã chèn token {{path.to.field}} vào đúng các ô giá trị (không vào ô nhãn). Giữ nguyên cấu trúc <table>, <td>, <p>.",
    },
    mappings: {
      type: "array",
      description: "Danh sách nhãn đã được map vào profile path.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: {
            type: "string",
            description: "Nhãn đúng như xuất hiện trong mẫu (giữ nguyên dấu).",
          },
          token: {
            type: "string",
            description: 'Token đã chèn, dạng "{{basic.fullName}}".',
          },
          profilePath: {
            type: "string",
            description: "Path trong Profile (vd: basic.fullName).",
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
        },
        required: ["label", "token", "profilePath", "confidence"],
      },
    },
    unmatched: {
      type: "array",
      description: "Các nhãn trong mẫu không thể map tự tin vào profile schema.",
      items: { type: "string" },
    },
  },
  required: ["templatedHtml", "mappings", "unmatched"],
} as const;

const SYSTEM_PROMPT = `Bạn là trợ lý phân tích biểu mẫu hành chính tiếng Việt (sơ yếu lý lịch, đơn từ, lý lịch viên chức).

Đầu vào: HTML rút từ một mẫu DOCX.

Nhiệm vụ:
1. Nhận diện mọi ô có nhãn rõ ràng (vd: "Họ và tên khai sinh:", "Ngày, tháng, năm sinh", "Số CMND/CCCD"). Nhãn thường nằm trong ô bảng, hoặc trong đoạn văn kèm dấu hai chấm / dấu chấm.
2. Với mỗi nhãn, chọn duy nhất một path trong Profile schema có ý nghĩa tương đương nhất. Nếu không có path nào hợp, đưa nhãn đó vào danh sách \`unmatched\` và KHÔNG chèn token.
3. Trong trường \`templatedHtml\`, trả lại HTML giống đầu vào, NHƯNG chèn token \`{{path.to.field}}\` vào đúng vị trí ô giá trị:
   - Nếu nhãn ở ô bảng (<td>), token thường nằm ở ô bảng kế bên cùng hàng.
   - Nếu nhãn ở đoạn văn dạng "Nhãn: ...", chèn token ngay sau dấu hai chấm và khoảng trắng.
   - KHÔNG chèn token vào ô nhãn.
   - KHÔNG xoá hay đổi cấu trúc HTML khác. Giữ nguyên thẻ <table>, <tr>, <td>, <p>, <strong>, <em>, lớp, thuộc tính.
4. Mỗi profile path chỉ chèn nhiều nhất một lần.
5. Trả lời bằng JSON đúng schema yêu cầu.

Profile paths khả dụng (dạng dotted, kèm mô tả):

${PROFILE_PATHS_DOC}`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server chưa cấu hình ANTHROPIC_API_KEY (xem .env.local.example)." },
      { status: 500 },
    );
  }

  let html: string;
  let originalName: string;
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Thiếu file DOCX." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File quá lớn (giới hạn 5 MB)." }, { status: 413 });
    }
    originalName = file.name || "template.docx";
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.convertToHtml({ buffer });
    html = result.value;
  } catch (e) {
    return NextResponse.json(
      { error: `Không đọc được DOCX: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  if (html.length > 200_000) {
    return NextResponse.json(
      { error: "Mẫu quá lớn (HTML > 200K ký tự). Hãy rút gọn." },
      { status: 413 },
    );
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const adaptiveThinking = { type: "adaptive" } as unknown as Anthropic.Beta.BetaThinkingConfigParam;
    const response = await anthropic.beta.messages.parse({
      model: "claude-opus-4-7",
      max_tokens: 16000,
      thinking: adaptiveThinking,
      output_config: { effort: "high" },
      output_format: betaJSONSchemaOutputFormat(SCHEMA),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `HTML của mẫu cần phân tích (giữa hai dấu \`\`\`):\n\n\`\`\`html\n${html}\n\`\`\``,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "Mô hình từ chối phân tích mẫu này." },
        { status: 422 },
      );
    }
    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "Không phân tích được output JSON từ mô hình." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ...response.parsed_output,
      originalName,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cacheRead: response.usage.cache_read_input_tokens ?? 0,
      },
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Lỗi Claude API ${e.status}: ${e.message}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
