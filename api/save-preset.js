import { Octokit } from "@octokit/rest";
import crypto from "crypto";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const REPO_OWNER = "virius-rs";
const REPO_NAME = "preset-maker";
const STORAGE_PATH = "presets";
const BRANCH = "master";

function stableJsonStringify(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableJsonStringify).join(',') + ']';
  }
  return '{' + Object.keys(obj).sort().map(key => {
    return JSON.stringify(key) + ':' + stableJsonStringify(obj[key]);
  }).join(',') + '}';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
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

    const stableString = stableJsonStringify(data);
    const hash = crypto.createHash('sha256').update(stableString).digest('hex');
    
    const id = hash.substring(0, 32);
    const filename = `${STORAGE_PATH}/${id}.json`;

    const prettyContent = JSON.stringify(data, null, 2);
    const contentBase64 = Buffer.from(prettyContent).toString("base64");

    try {
      await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filename,
        ref: BRANCH,
      });

      console.log(`Duplicate preset detected: ${id}. Returning existing link.`);
      return res.status(200).json({ id });

    } catch (err) {
      if (err.status !== 404) {
        throw err;
      }
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filename,
      message: `feat: add preset ${id} [skip ci]`,
      content: contentBase64,
      branch: BRANCH,
    });

    return res.status(200).json({ id });

  } catch (error) {
    console.error("Save failed:", error);
    return res.status(500).json({ 
      error: "Failed to save preset.", 
      details: error.message 
    });
  }
}