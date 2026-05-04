import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { betaJSONSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/beta/json-schema";
import mammoth from "mammoth";
import { IMPORTED_PROFILE_SCHEMA } from "@/lib/import-schema";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM_PROMPT = `Bạn là trợ lý trích xuất dữ liệu từ CV / sơ yếu lý lịch / portfolio tiếng Việt hoặc tiếng Anh.

Đầu vào: văn bản thô của một file đã có sẵn.

Nhiệm vụ:
1. Đọc kỹ và điền vào schema Profile JSON. Luôn trả về đầy đủ các field bắt buộc.
2. Nếu trường nào không có trong văn bản, trả chuỗi rỗng "" (cho trường string) hoặc mảng rỗng [] (cho trường array). Không tự bịa.
3. \`basic.gender\`: chỉ chọn "male" / "female" / "other" / "" (tiếng Anh — không đổi).
4. Ngày tháng: ưu tiên YYYY-MM-DD nếu có đủ; nếu chỉ có năm thì giữ năm; nếu là "Hiện tại"/"Present" thì để \`endDate\`/\`endYear\` = "Hiện tại".
5. Tách tác giả công bố thành chuỗi gốc, không cố reformat.
6. \`civilServant.*\`: chỉ điền nếu file có thông tin viên chức (ngạch, ngày vào Đảng, mã ngạch, CCCD…). Nếu là CV ngành tư thông thường, để rỗng/array rỗng.
7. \`links\`: gom mọi URL hồ sơ MXH thấy trong văn bản (LinkedIn, GitHub, ORCID, Scholar, Facebook, X…). Đặt nhãn rõ ràng.
8. \`skills\` / \`languages\`: chỉ liệt kê thứ thực sự xuất hiện trong file.

Trả lời theo schema JSON đã yêu cầu.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server chưa cấu hình ANTHROPIC_API_KEY (xem .env.local.example)." },
      { status: 500 },
    );
  }

  let text: string;
  let sourceName: string;
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const presetText = formData.get("text");

    if (file instanceof File) {
      sourceName = file.name || "file";
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File quá lớn (> 10 MB)." }, { status: 413 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const lower = sourceName.toLowerCase();
      if (lower.endsWith(".docx")) {
        const r = await mammoth.extractRawText({ buffer });
        text = r.value;
      } else if (lower.endsWith(".txt") || file.type.startsWith("text/")) {
        text = buffer.toString("utf8");
      } else {
        return NextResponse.json(
          {
            error:
              "Server chỉ tự xử lý DOCX/TXT. Với PDF, client cần trích xuất text trước rồi gửi qua field 'text'.",
          },
          { status: 400 },
        );
      }
    } else if (typeof presetText === "string" && presetText.trim()) {
      text = presetText;
      sourceName = (formData.get("sourceName") as string) || "(văn bản)";
    } else {
      return NextResponse.json({ error: "Thiếu file hoặc text." }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: `Không đọc được file: ${(e as Error).message}` }, { status: 400 });
  }

  text = text.trim();
  if (!text) {
    return NextResponse.json({ error: "Văn bản rỗng." }, { status: 400 });
  }
  if (text.length > 200_000) {
    return NextResponse.json(
      { error: "Văn bản quá dài (> 200K ký tự). Hãy rút gọn trước khi tải lên." },
      { status: 413 },
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const adaptiveThinking = { type: "adaptive" } as unknown as Anthropic.Beta.BetaThinkingConfigParam;

  try {
    const response = await anthropic.beta.messages.parse({
      model: "claude-opus-4-7",
      max_tokens: 16000,
      thinking: adaptiveThinking,
      output_config: { effort: "high" },
      output_format: betaJSONSchemaOutputFormat(IMPORTED_PROFILE_SCHEMA),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Đây là toàn bộ văn bản trích từ "${sourceName}":\n\n<<<\n${text}\n>>>`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "Mô hình từ chối trích xuất file này." }, { status: 422 });
    }
    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "Không phân tích được output JSON từ mô hình." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ...(response.parsed_output as Record<string, unknown>),
      sourceName,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
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
