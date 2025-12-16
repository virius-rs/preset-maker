import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const REPO_OWNER = "virius-rs";
const REPO_NAME = "preset-maker";
const STORAGE_PATH = "presets";

export default async function handler(req, res) {
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