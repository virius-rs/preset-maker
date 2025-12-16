import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const REPO_OWNER = "virius-rs";
const REPO_NAME = "preset-maker";
const STORAGE_PATH = "presets";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://virius-rs.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { data } = req.body;
    const id = crypto.randomUUID();
    const filename = `${STORAGE_PATH}/${id}.json`;

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filename,
      message: `feat: add preset ${id} [skip ci]`,
      content: content,
      branch: "main",
    });

    return res.status(200).json({ id });

  } catch (error) {
    console.error("Save failed:", error);
    return res.status(500).json({ error: "Failed to save preset." });
  }
}