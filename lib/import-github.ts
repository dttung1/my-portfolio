import type { LinkItem, ProjectItem } from "./profile-schema";

export type GitHubImport = {
  fullName?: string;
  summary?: string;
  address?: string;
  website?: string;
  email?: string;
  links: LinkItem[];
  projects: ProjectItem[];
  skills: string[];
};

type GitHubUser = {
  login: string;
  name: string | null;
  bio: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  html_url: string;
  avatar_url: string;
};

type GitHubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  fork: boolean;
  archived: boolean;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
};

const API = "https://api.github.com";

export async function fetchGitHubProfile(rawUsername: string): Promise<GitHubImport> {
  const username = rawUsername.trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9-]+$/.test(username)) {
    throw new Error("Tên người dùng GitHub không hợp lệ.");
  }

  const headers = { Accept: "application/vnd.github+json" };

  const [userRes, reposRes] = await Promise.all([
    fetch(`${API}/users/${username}`, { headers }),
    fetch(`${API}/users/${username}/repos?per_page=100&sort=updated`, { headers }),
  ]);
  if (userRes.status === 404) throw new Error("Không tìm thấy user GitHub này.");
  if (!userRes.ok) throw new Error(`GitHub API lỗi: ${userRes.status}`);
  if (!reposRes.ok) throw new Error(`GitHub API lỗi (repos): ${reposRes.status}`);

  const user = (await userRes.json()) as GitHubUser;
  const repos = (await reposRes.json()) as GitHubRepo[];

  const ownRepos = repos
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 8);

  const projects: ProjectItem[] = ownRepos.map((r) => ({
    name: r.name,
    role: r.language || "",
    year: r.pushed_at ? r.pushed_at.slice(0, 4) : "",
    url: r.html_url,
    description: [r.description, r.stargazers_count ? `★ ${r.stargazers_count}` : ""]
      .filter(Boolean)
      .join(" · "),
  }));

  const languageCounts = new Map<string, number>();
  for (const r of repos) {
    if (r.fork || !r.language) continue;
    languageCounts.set(r.language, (languageCounts.get(r.language) ?? 0) + 1);
  }
  const skills = [...languageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang]) => lang);

  const links: LinkItem[] = [{ label: "GitHub", url: user.html_url }];

  let website = user.blog?.trim();
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;

  return {
    fullName: user.name ?? user.login,
    summary: user.bio ?? undefined,
    address: user.location ?? undefined,
    email: user.email ?? undefined,
    website,
    links,
    projects,
    skills,
  };
}
